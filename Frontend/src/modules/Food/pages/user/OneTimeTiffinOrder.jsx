import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronDown, Loader2, MapPin, Minus, Plus, ShieldCheck, Clock, Circle, ChevronRight, Home, Edit2, Leaf, RotateCcw, Utensils, Sparkles, Info, Lock, Truck, Package } from "lucide-react";
import { toast } from "sonner";
import { orderAPI } from "@food/api";
import { useProfile } from "@food/context/ProfileContext";
import { initRazorpayPayment } from "@food/utils/razorpay";
import { getCompanyNameAsync } from "@food/utils/businessSettings";
import { DEFAULT_APP_CUSTOMIZATION, loadAppCustomization } from "@food/utils/appCustomization";
import { useLocation } from "@food/hooks/useLocation";

const RUPEE_SYMBOL = "\u20B9";

const formatCurrency = (value) =>
  `${RUPEE_SYMBOL}${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatAddress = (address) => {
  if (!address) return "";
  if (address.formattedAddress && address.formattedAddress !== "Select location") return address.formattedAddress;
  if (address.address && address.address !== "Select location") return address.address;
  return [address.street, address.additionalDetails, address.city, address.state, address.zipCode].filter(Boolean).join(", ");
};

const getAddressId = (address) => address?.id || address?._id || "";

function buildDefaultSelections(categories) {
  return categories.reduce((acc, category) => {
    acc[category.categoryId] = category.defaultItem?.itemId || category.items?.[0]?.itemId || "";
    return acc;
  }, {});
}

export default function OneTimeTiffinOrder() {
  const navigate = useNavigate();
  const { userProfile, getDefaultAddress, isAuthenticated } = useProfile();
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [menu, setMenu] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [tiffins, setTiffins] = useState([]);
  const [appCustomization, setAppCustomization] = useState(DEFAULT_APP_CUSTOMIZATION);
  const [note, setNote] = useState("");
  const { location } = useLocation();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [menuResponse, settings] = await Promise.all([
          orderAPI.getOneTimeTiffinMenu(),
          loadAppCustomization().catch(() => DEFAULT_APP_CUSTOMIZATION),
        ]);
        if (!mounted) return;
        const data = menuResponse?.data?.data || {};
        const categories = Array.isArray(data.categories) ? data.categories : [];
        setMenu({ ...data, categories });
        setAppCustomization(settings);
        setTiffins([{ selections: buildDefaultSelections(categories) }]);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load today's tiffin menu.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = menu?.categories || [];
  const unitPrice = Number(menu?.price || 0);
  const deliveryFee = Number(menu?.deliveryFee || 0);
  const totalAmount = unitPrice * quantity;
  const finalAmount = totalAmount + deliveryFee;
  const selectedAddress = getDefaultAddress?.() || location || null;
  const addressText = formatAddress(selectedAddress);

  const summary = useMemo(() => {
    const customizedCount = tiffins.filter((tiffin) => {
      return categories.some((category) => {
        const selectedItemId = tiffin.selections?.[category.categoryId];
        return selectedItemId && selectedItemId !== category.defaultItem?.itemId;
      });
    }).length;
    return { customizedCount };
  }, [categories, tiffins]);

  const updateQuantity = (nextQuantity) => {
    const next = Math.min(10, Math.max(1, Number(nextQuantity) || 1));
    setQuantity(next);
    setTiffins((current) => {
      const defaults = buildDefaultSelections(categories);
      const copy = [...current];
      while (copy.length < next) copy.push({ selections: { ...defaults } });
      return copy.slice(0, next);
    });
  };

  const updateSelection = (tiffinIndex, categoryId, selectedItemId) => {
    setTiffins((current) =>
      current.map((tiffin, index) =>
        index === tiffinIndex
          ? { ...tiffin, selections: { ...(tiffin.selections || {}), [categoryId]: selectedItemId } }
          : tiffin,
      ),
    );
  };

  const handleChangeAddress = () => {
    navigate("/food/user/address-selector", { state: { from: "/food/user/one-time-tiffin" } });
  };

  const verifyPayment = async ({ order, razorpayResponse, razorpay }) => {
    const verifyResponse = await orderAPI.verifyOneTimeTiffinPayment({
      orderId: order?._id || order?.id,
      razorpayOrderId: razorpayResponse?.razorpay_order_id || razorpay?.orderId || `test_order_${Date.now()}`,
      razorpayPaymentId: razorpayResponse?.razorpay_payment_id || `test_payment_${Date.now()}`,
      razorpaySignature: razorpayResponse?.razorpay_signature || "test_signature_bypass",
    });
    if (!verifyResponse?.data?.success) throw new Error(verifyResponse?.data?.message || "Payment verification failed.");
    const verifiedOrder = verifyResponse?.data?.data?.order || order;
    toast.success("One-time tiffin order confirmed.");
    navigate(`/food/user/orders/${verifiedOrder?._id || verifiedOrder?.id || order?._id || order?.id}`, { replace: true });
  };

  const handlePayOnline = async () => {
    if (!isAuthenticated) {
      navigate("/user/auth/login", { state: { from: "/food/user/one-time-tiffin" } });
      return;
    }
    if (!unitPrice || unitPrice <= 0) {
      toast.error("One-time tiffin price is not configured yet.");
      return;
    }
    if (!selectedAddress || !addressText) {
      toast.error("Please select a delivery address.");
      handleChangeAddress();
      return;
    }

    setPlacing(true);
    try {
      const payloadAddress = { ...selectedAddress };
      if (!payloadAddress.street && !payloadAddress.addressLine1 && !payloadAddress.fullAddress) {
        payloadAddress.street = addressText;
      }
      if (!payloadAddress.city) payloadAddress.city = "Unknown";
      if (!payloadAddress.state) payloadAddress.state = "Unknown";

      const payload = {
        quantity,
        menuDate: menu?.menuDate,
        address: payloadAddress,
        customerName: userProfile?.name || userProfile?.fullName || selectedAddress?.fullName || "User",
        customerPhone: userProfile?.phone || selectedAddress?.phone || "",
        note,
        tiffins: tiffins.map((tiffin) => ({
          items: categories.map((category) => ({
            categoryId: category.categoryId,
            selectedItemId: tiffin.selections?.[category.categoryId] || category.defaultItem?.itemId,
          })),
        })),
      };

      const response = await orderAPI.createOneTimeTiffinOrder(payload);
      const { order, razorpay } = response?.data?.data || {};
      if (!order) throw new Error("Unable to create one-time tiffin order.");

      if (appCustomization.directPaymentTestMode === true) {
        await verifyPayment({ order, razorpay });
        return;
      }

      if (!razorpay?.key || !razorpay?.orderId) {
        throw new Error("Online payment gateway is not configured.");
      }

      const customerName = payload.customerName;
      const customerPhone = String(payload.customerPhone || "").replace(/\D/g, "").slice(-10);
      const companyName = await getCompanyNameAsync();
      let handled = false;

      await initRazorpayPayment({
        key: razorpay.key,
        amount: razorpay.amount,
        currency: razorpay.currency || "INR",
        order_id: razorpay.orderId,
        name: companyName,
        description: `One-Time Tiffin - ${quantity} ${quantity > 1 ? "tiffins" : "tiffin"}`,
        prefill: {
          name: customerName,
          email: userProfile?.email || "",
          contact: customerPhone,
        },
        notes: {
          orderId: order?._id || order?.id || "",
          orderType: "one_time_tiffin",
          deliveryAddress: addressText,
        },
        handler: async (razorpayResponse) => {
          if (handled) return;
          handled = true;
          try {
            await verifyPayment({ order, razorpayResponse, razorpay });
          } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || "Payment verification failed.");
          } finally {
            setPlacing(false);
          }
        },
        onError: (error) => {
          if (handled) return;
          handled = true;
          toast.error(error?.description || error?.message || "Payment failed. Please try again.");
          setPlacing(false);
        },
        onClose: () => {
          if (handled) return;
          handled = true;
          toast.info("Payment was not completed.");
          setPlacing(false);
        },
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Unable to place one-time tiffin order.");
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
          <Loader2 className="h-4 w-4 animate-spin text-[#009247]" />
          Loading today's tiffin
        </div>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-base font-bold text-slate-900">Today's menu is not ready yet.</p>
          <p className="mt-2 text-sm text-slate-500">Please try again after admin publishes the daily menu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32 text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0f9f4] text-[#009247] transition hover:bg-[#e2f3ea]">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-slate-900">One-Time Tiffin</h1>
              <p className="text-xs text-slate-500">Customize today's default meal</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 rounded-xl bg-[#f0f9f4] px-4 py-3 border border-[#e2f3ea]">
            <Clock className="h-6 w-6 text-[#009247]" />
            <div>
              <p className="text-[11px] font-medium text-[#009247]">Delivery Today</p>
              <p className="text-[12px] font-medium text-[#007a3b]">12:30 PM – 02:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex flex-row items-stretch justify-between gap-3 sm:gap-6">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <p className="text-[13px] sm:text-sm font-semibold text-slate-700">Today's Price</p>
              <p className="mt-0.5 sm:mt-1 text-3xl sm:text-4xl font-bold text-[#009247]">{formatCurrency(unitPrice)}</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-medium">
              <span className="flex items-center gap-1 rounded-full bg-[#f0fdf4] px-2 py-1 sm:px-3 sm:py-1.5 text-[#166534]">
                <ShieldCheck className="w-3 h-3"/> Online payment only
              </span>
              <span className="flex items-center gap-1 rounded-full bg-[#fff7ed] px-2 py-1 sm:px-3 sm:py-1.5 text-[#c2410c]">
                <Circle className="w-3 h-3"/> {summary.customizedCount} customized
              </span>
            </div>
          </div>
          
          <div className="w-px bg-slate-100 my-1"></div>
          
          <div className="flex flex-col justify-between pl-1 sm:pl-2 min-w-[110px] sm:min-w-[130px]">
            <div>
              <p className="text-[13px] sm:text-sm font-semibold text-slate-700 mb-2">Quantity</p>
              <div className="flex items-center rounded-[10px] border border-slate-200 bg-white w-full h-9 sm:h-10">
                <button onClick={() => updateQuantity(quantity - 1)} className="flex h-full w-9 sm:w-10 items-center justify-center text-slate-500 hover:text-slate-800 transition border-r border-slate-200" disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex-1 text-center text-[15px] sm:text-base font-semibold text-slate-900">{quantity}</span>
                <button onClick={() => updateQuantity(quantity + 1)} className="flex h-full w-9 sm:w-10 items-center justify-center text-[#009247] transition hover:text-[#007a3b] border-l border-slate-200" disabled={quantity >= 10}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-[11px] sm:text-[12px] text-slate-500 mt-2 font-medium">Per tiffin</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <MapPin className="h-5 w-5 text-[#009247]" />
              <h2 className="text-base font-semibold">Delivery Address</h2>
            </div>
            <button onClick={handleChangeAddress} className="text-[13px] font-medium text-[#009247] flex items-center transition hover:text-[#007a3b]">Change <ChevronRight className="w-4 h-4 ml-0.5"/></button>
          </div>
          {addressText ? (
            <div className="flex gap-4 rounded-xl bg-[#f8f9fa] p-4 border border-slate-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f4ea] text-[#009247]">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-1">Home</p>
                <p className="text-[12px] font-normal leading-relaxed text-slate-600">{addressText}</p>
              </div>
            </div>
          ) : (
            <button onClick={handleChangeAddress} className="w-full rounded-xl border border-dashed border-slate-300 p-5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition">
              Select delivery address
            </button>
          )}
          
          <div className="mt-7">
            <label className="text-[13px] font-semibold text-slate-900 mb-3 block">Delivery Instructions / Note <span className="text-slate-400 font-normal">(Optional)</span></label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Edit2 className="h-4 w-4 text-[#009247]" />
              </div>
              <input
                type="text"
                placeholder="e.g. Leave at the front desk, ring the bell, call before delivery..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-[13px] font-normal text-slate-700 outline-none transition focus:border-[#009247] focus:ring-1 focus:ring-[#009247]"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-normal">This note will be printed on your order and sent to the delivery partner.</p>
          </div>
        </section>

        {tiffins.map((tiffin, tiffinIndex) => (
          <section key={tiffinIndex} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#f8f9fa] p-4">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-[#009247]" />
                <h2 className="text-lg font-semibold text-slate-900">Tiffin {tiffinIndex + 1}</h2>
                <span className="ml-3 rounded-full bg-[#e6f4ea] px-3 py-1 text-[11px] font-medium text-[#009247]">Default Meal</span>
              </div>
              <button className="flex items-center gap-1.5 text-[13px] font-medium text-[#009247] transition hover:text-[#007a3b]">
                <RotateCcw className="w-3.5 h-3.5" /> Reset all
              </button>
            </div>
            <div className="p-2 space-y-1">
              {categories.map((category) => {
                const selectedItemId = tiffin.selections?.[category.categoryId] || category.defaultItem?.itemId;
                const selectedItem = category.items?.find((item) => item.itemId === selectedItemId) || category.defaultItem;
                return (
                  <div key={category.categoryId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-100 last:border-0 hover:bg-[#f8f9fa] transition">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f9f4] text-[#009247]">
                        <Utensils className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-semibold text-slate-900">{category.categoryName}</h3>
                        <p className="text-[12px] font-normal text-slate-500 mt-1">Default: {category.defaultItem?.name}</p>
                      </div>
                    </div>
                    <div className="flex-1 w-full sm:max-w-xs">
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden relative">
                        <select
                          value={selectedItemId}
                          onChange={(event) => updateSelection(tiffinIndex, category.categoryId, event.target.value)}
                          className="w-full appearance-none bg-transparent px-3.5 py-3 pr-10 text-[13px] font-semibold text-slate-800 outline-none cursor-pointer"
                        >
                          {(category.items || []).map((item) => (
                            <option key={item.itemId} value={item.itemId}>{item.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#009247]" />
                      </div>
                      <p className="mt-1.5 text-[11px] font-medium text-[#009247]">Selected: {selectedItem?.name || "Default item"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-[#fdf9ea] p-4 mx-4 mb-4 rounded-xl flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <p className="text-[12px] font-medium text-[#b45309]">You are ordering today's default tiffin with all selected items.</p>
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sticky bottom-4 z-30 mt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8 flex-1 w-full border-b sm:border-b-0 border-slate-100 pb-4 sm:pb-0">
              <div className="w-full sm:w-auto">
                <p className="text-[13px] font-semibold text-slate-900 mb-0.5">Item Total</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-slate-200"></div>
              <div className="flex-1 space-y-2.5 w-full sm:w-auto px-2">
                <div className="flex justify-between items-center text-[12px] font-normal text-slate-500">
                  <span>Delivery Charges</span>
                  <span className="font-medium text-slate-900">{deliveryFee > 0 ? formatCurrency(deliveryFee) : <span className="text-[#009247]">Free</span>}</span>
                </div>
                <div className="flex justify-between items-center text-[12px] font-normal text-slate-500">
                  <span>Taxes & Charges</span>
                  <span className="font-medium text-slate-900">₹0</span>
                </div>
              </div>
            </div>
            
            <div className="hidden sm:block w-px h-20 bg-slate-200"></div>

            <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
              <div>
                <p className="text-[12px] font-medium text-[#009247]">Total Amount</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-[#009247]">{formatCurrency(finalAmount)}</p>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <button
                  onClick={handlePayOnline}
                  disabled={placing || unitPrice <= 0}
                  className="flex min-h-[48px] min-w-[160px] items-center justify-center gap-2 rounded-xl bg-[#009247] px-5 py-2.5 text-base font-semibold text-white shadow-sm transition hover:bg-[#007a3b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placing ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Lock className="w-4 h-4"/> Pay {formatCurrency(finalAmount)}</>}
                </button>
                <p className="text-[10px] font-medium text-[#009247] mt-2 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5"/> Secure & Safe Payment</p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-[#f8f9fa] p-4 mt-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#e6f4ea] p-2 rounded-xl"><ShieldCheck className="w-5 h-5 text-[#009247]"/></div>
            <p className="text-[11px] font-medium text-slate-700 leading-tight">Hygienic<br/>& Safe</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="bg-[#e6f4ea] p-2 rounded-xl"><Leaf className="w-5 h-5 text-[#009247]"/></div>
            <p className="text-[11px] font-medium text-slate-700 leading-tight">Fresh<br/>Ingredients</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="bg-[#e6f4ea] p-2 rounded-xl"><Truck className="w-5 h-5 text-[#009247]"/></div>
            <p className="text-[11px] font-medium text-slate-700 leading-tight">On-time<br/>Delivery</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="bg-[#e6f4ea] p-2 rounded-xl"><Package className="w-5 h-5 text-[#009247]"/></div>
            <p className="text-[11px] font-medium text-slate-700 leading-tight">No Minimum<br/>Order</p>
          </div>
        </div>
      </main>
    </div>
  );
}
