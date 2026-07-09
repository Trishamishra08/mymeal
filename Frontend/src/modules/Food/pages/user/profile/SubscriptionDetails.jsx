import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, MapPin, Store, Utensils, SlidersHorizontal, ArrowDownCircle } from "lucide-react";
import AnimatedPage from "@food/components/user/AnimatedPage";
import { Card, CardContent } from "@food/components/ui/card";
import { Button } from "@food/components/ui/button";
import { subscriptionAPI, orderAPI } from "@food/api";
import SubscriptionCustomizeModal from "@food/components/user/SubscriptionCustomizeModal";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeRange = (value) => {
  if (!value) return "12:30 PM - 02:00 PM";
  return "12:30 PM - 02:00 PM"; // Mock delivery time range
};

const getAddressText = (address = {}) =>
  [
    address.street || address.address || address.formattedAddress,
    address.additionalDetails,
    address.city,
    address.state,
    address.zipCode || address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

export default function SubscriptionDetails() {
  const navigate = useNavigate();
  const { subscriptionId } = useParams();
  const [subscription, setSubscription] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [selections, setSelections] = useState({});
  const [savingItems, setSavingItems] = useState(false);

  // States for Add-on customization
  const [editingAddonId, setEditingAddonId] = useState(null);
  const [addonSelections, setAddonSelections] = useState({});
  const [savingAddon, setSavingAddon] = useState(false);

  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState(null);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const [subscriptionResponse, scheduleResponse, menuResponse, ordersResponse] = await Promise.all([
        subscriptionAPI.getMySubscriptions(),
        subscriptionAPI.getUpcomingSchedules().catch(() => null),
        orderAPI.getOneTimeTiffinMenu().catch(() => null),
        orderAPI.getOrders({ limit: 50, page: 1 }).catch(() => null),
      ]);

      const list =
        subscriptionResponse?.data?.data?.subscriptions ||
        subscriptionResponse?.data?.subscriptions ||
        [];
      const current = (Array.isArray(list) ? list : []).find(
        (item) => String(item.subscriptionId || item._id) === String(subscriptionId),
      );
      const upcoming =
        scheduleResponse?.data?.data?.schedules ||
        scheduleResponse?.data?.schedules ||
        [];
      const upcomingSchedules = (Array.isArray(upcoming) ? upcoming : []).filter(
        (schedule) =>
          String(schedule.subscriptionId?._id || schedule.subscriptionId || schedule.subscription?.subscriptionId || "") ===
          String(subscriptionId),
      );
      setSubscription(current || null);
      setSchedules(upcomingSchedules);

      const menuData = menuResponse?.data?.data || {};
      const categories = Array.isArray(menuData.categories) ? menuData.categories : [];
      setMenu({ ...menuData, categories });

      if (upcomingSchedules.length > 0) {
        setSelections(upcomingSchedules[0].selections || {});
      }

      // Find active daily delivery order for this subscription
      let orders = [];
      if (ordersResponse?.data?.success && ordersResponse?.data?.data?.orders) {
        orders = ordersResponse.data.data.orders;
      } else if (ordersResponse?.data?.orders) {
        orders = ordersResponse.data.orders;
      } else if (Array.isArray(ordersResponse?.data?.data)) {
        orders = ordersResponse.data.data;
      }
      
      const activeDelivery = orders.find(o => {
        if (o.orderType !== 'subscription') return false;
        
        const orderSubId = String(
          o.subscriptionUsage?.subscriptionId?._id || 
          o.subscriptionUsage?.subscriptionId || 
          o.subscriptionId?._id || 
          o.subscriptionId || 
          o.subscription || ''
        );
        if (orderSubId !== String(subscriptionId)) return false;
        
        const status = String(o.status || '').toLowerCase();
        const phase = String(o.orderPhase || '').toLowerCase();
        
        // Exclude completed or cancelled orders
        if (['delivered', 'cancelled', 'dead', 'failed'].includes(status) || ['delivered', 'completed'].includes(phase)) return false;

        // Ensure it's assigned or dispatched
        const isDispatched = ['ready_for_pickup', 'out_for_delivery', 'en_route_to_delivery', 'at_pickup', 'at_drop', 'picked_up'].includes(status);
        const hasDeliveryPartner = Boolean(o.dispatch?.deliveryPartnerId || o.deliveryPartnerId);
        
        console.log('Order check:', { id: o._id, type: o.orderType, subId: o.subscriptionId, status, phase, isDispatched, hasDeliveryPartner });

        return isDispatched || hasDeliveryPartner;
      });
      console.log('activeDelivery found:', activeDelivery);
      setActiveDeliveryOrder(activeDelivery || null);

    } catch {
      setSubscription(null);
      setSchedules([]);
      setMenu(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [subscriptionId]);

  const nextSchedule = useMemo(() => schedules[0] || null, [schedules]);
  const planDays = subscription?.durationDays || subscription?.planDays || 0;
  let mealsLeft = planDays;
  if (subscription?.status === 'active' && subscription?.remainingDays !== undefined) {
    mealsLeft = Math.min(planDays, subscription.remainingDays);
  } else if (subscription?.status === 'expired' || subscription?.status === 'cancelled') {
    mealsLeft = 0;
  }
  const progressPercent = planDays > 0 ? Math.round((mealsLeft / planDays) * 100) : 0;

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a]">
        <div className="max-w-md mx-auto px-4 py-4 pb-24 text-center text-sm text-gray-400">
          Loading subscription...
        </div>
      </AnimatedPage>
    );
  }

  if (!subscription) {
    return (
      <AnimatedPage className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a]">
        <div className="max-w-md mx-auto px-4 py-4 pb-24 text-center">
          <Button variant="ghost" className="mb-4 px-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <p className="text-gray-500">Subscription not found.</p>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="min-h-screen bg-[#f7faf8] dark:bg-[#0f1714]">
      <div className="max-w-md mx-auto px-4 py-4 pb-24">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Subscription details</h1>
          </div>
        </div>

        <div className="space-y-4">
          {/* Active Delivery Tracking Card */}
          {activeDeliveryOrder && (
            <div 
              onClick={() => navigate(`/user/food/orders/tracking/${activeDeliveryOrder.orderId || activeDeliveryOrder.id || activeDeliveryOrder._id}`)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[20px] p-4 text-white shadow-lg cursor-pointer transform transition-transform active:scale-95 flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-1">Today's Delivery</p>
                <h3 className="font-bold text-base md:text-lg">Track Live Delivery</h3>
                <p className="text-xs text-blue-50 mt-0.5 opacity-90 capitalize">
                  {String(activeDeliveryOrder.status || '').replace(/_/g, ' ')}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
                <MapPin className="h-5 w-5 text-white animate-bounce" />
              </div>
            </div>
          )}

          {/* Current Plan Card */}
          <Card className="rounded-[20px] border-0 bg-white shadow-sm dark:bg-[#151f1a]">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Plan</p>
                  <h2 className="text-xl font-extrabold text-green-700 dark:text-green-500 mt-1">{subscription.planName || subscription.planTitle || "Standard Plan"}</h2>
                  <div className="mt-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                    Active
                  </div>
                </div>

                <div className="h-px w-full bg-gray-100 dark:bg-gray-800 md:hidden"></div>

                <div className="flex flex-row items-center justify-between md:justify-end gap-4 sm:gap-6 w-full md:w-auto">
                  <div className="text-left md:text-right flex-1 md:flex-none">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Plan Duration</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1 truncate max-w-[130px] sm:max-w-none">{formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{subscription.durationDays || subscription.planDays || 0} Days</p>
                  </div>
                  
                  <div className="h-10 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Meals Left</p>
                      <p className="text-lg font-extrabold text-green-700 dark:text-green-500 mt-0.5">{mealsLeft} <span className="text-sm text-gray-400 font-semibold">/ {subscription.durationDays || subscription.planDays || 0}</span></p>
                      <p className="text-xs text-gray-500 mt-0.5">Meals</p>
                    </div>
                    {/* Fake progress circle for demo */}
                    <div className="relative h-11 w-11 shrink-0 rounded-full border-[3px] border-green-600 flex items-center justify-center">
                       <span className="text-[11px] font-bold text-green-700 dark:text-green-500">{progressPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Meal Section */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Today's Meal</h2>
              <p className="text-sm text-gray-500">{nextSchedule ? formatDate(nextSchedule.serviceDate) : formatDate(new Date())}</p>
            </div>
          </div>

          <Card className="rounded-[20px] border-0 bg-white shadow-sm dark:bg-[#151f1a]">
            <CardContent className="p-5">
              <div className="flex flex-col items-center sm:flex-row gap-5">
                 {/* Dish Image Placeholder */}
                 <div className="h-40 w-40 rounded-full bg-gray-100 overflow-hidden shadow-sm flex-shrink-0 relative">
                   <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" alt="Meal" className="h-full w-full object-cover" />
                 </div>
                 
                 <div className="flex-1 w-full text-center sm:text-left">
                   <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                     <span className="flex h-4 w-4 items-center justify-center rounded border border-green-600">
                        <span className="h-2 w-2 rounded-full bg-green-600"></span>
                     </span>
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white">{nextSchedule?.dishName || subscription.planName || subscription.dishName || "Veg Thali"}</h3>
                   </div>
                   
                   {!isEditingItems && (
                     <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex flex-col gap-1 mt-3">
                       {(!menu?.categories || menu.categories.length === 0) && (
                         <div className="text-[13px] text-gray-500 italic py-2">Today's menu is not available yet.</div>
                       )}
                       {(menu?.categories || []).map((cat) => {
                         const selectedItemId = selections[cat.categoryId] || cat.defaultItem?.itemId;
                         const item = cat.items?.find((i) => i.itemId === selectedItemId) || cat.defaultItem;
                         if (!item) return null;
                         return (
                           <div key={cat.categoryId} className="flex items-center justify-between text-[13px]">
                             <span className="font-medium text-gray-500">{cat.categoryName}:</span>
                             <span className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</span>
                           </div>
                         );
                       })}
                     </div>
                   )}

                   {isEditingItems && (
                     <div className="mb-4 mt-3 space-y-3">
                       {(!menu?.categories || menu.categories.length === 0) && (
                         <div className="text-[13px] text-gray-500 italic py-2">Today's menu is not available yet.</div>
                       )}
                       {(menu?.categories || []).map((category) => {
                         const selectedItemId = selections[category.categoryId] || category.defaultItem?.itemId;
                         const selectedItem = category.items?.find((item) => item.itemId === selectedItemId) || category.defaultItem;
                         return (
                           <div key={category.categoryId} className="flex flex-col gap-1">
                             <div className="flex items-center justify-between">
                               <span className="text-[12px] font-semibold text-gray-500">{category.categoryName}</span>
                               <span className="text-[11px] font-medium text-green-600">Selected: {selectedItem?.name}</span>
                             </div>
                             <div className="relative rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
                               <select
                                 value={selectedItemId || ""}
                                 onChange={(e) => {
                                   setSelections(prev => ({
                                     ...prev,
                                     [category.categoryId]: e.target.value
                                   }));
                                 }}
                                 className="w-full appearance-none bg-transparent px-3 py-2.5 pr-8 text-[13px] font-semibold text-gray-800 dark:text-gray-200 outline-none"
                               >
                                 {(category.items || []).map((item) => (
                                   <option key={item.itemId} value={item.itemId}>{item.name}</option>
                                 ))}
                               </select>
                               <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}

                   <div className="space-y-2">
                     <div className="flex items-center gap-3 rounded-xl bg-green-50/50 p-3 dark:bg-green-900/10">
                       <Clock3 className="h-5 w-5 text-green-700 dark:text-green-500" />
                       <div className="text-left">
                         <p className="text-xs text-gray-500">Delivery Time</p>
                         <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatTimeRange()}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-3 rounded-xl bg-orange-50/50 p-3 dark:bg-orange-900/10">
                       <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                       <div className="text-left">
                         <p className="text-xs text-gray-500">Status</p>
                         <p className="text-sm font-semibold text-orange-700 dark:text-orange-500">
                           {nextSchedule?.status === "skipped" ? "Skipped" : "Preparing your meal"}
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>

              {nextSchedule?.addOnTiffins?.filter(a => a.status === 'active')?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Add-ons (Extra Tiffins)</p>
                  {nextSchedule.addOnTiffins.filter(a => a.status === 'active').map((addon) => (
                    <div key={addon._id} className="flex flex-col text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{addon.dishName}</span>
                        <span className="text-green-600 font-semibold">+ ₹{addon.price}</span>
                      </div>
                      
                      {editingAddonId === addon._id ? (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="space-y-3 mb-3">
                            {(menu?.categories || []).map((category) => {
                              const selectedItemId = addonSelections[category.categoryId] || category.defaultItem?.itemId;
                              const selectedItem = category.items?.find((item) => item.itemId === selectedItemId) || category.defaultItem;
                              return (
                                <div key={category.categoryId} className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-semibold text-gray-500">{category.categoryName}</span>
                                    <span className="text-[11px] font-medium text-green-600">Selected: {selectedItem?.name}</span>
                                  </div>
                                  <div className="relative rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1a1a]">
                                    <select
                                      value={selectedItemId || ""}
                                      onChange={(e) => {
                                        setAddonSelections(prev => ({
                                          ...prev,
                                          [category.categoryId]: e.target.value
                                        }));
                                      }}
                                      className="w-full appearance-none bg-transparent px-3 py-2 pr-8 text-[12px] font-semibold text-gray-800 dark:text-gray-200 outline-none"
                                    >
                                      {(category.items || []).map((item) => (
                                        <option key={item.itemId} value={item.itemId}>{item.name}</option>
                                      ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-green-600" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs"
                              onClick={() => {
                                setEditingAddonId(null);
                                setAddonSelections({});
                              }}
                              disabled={savingAddon}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                              onClick={async () => {
                                try {
                                  setSavingAddon(true);
                                  await subscriptionAPI.customizeAddOnTiffin(nextSchedule._id || nextSchedule.scheduleId, addon._id, { selections: addonSelections });
                                  toast.success("Add-on customized successfully");
                                  setEditingAddonId(null);
                                  loadDetails();
                                } catch (err) {
                                  toast.error(err?.response?.data?.message || "Failed to customize add-on");
                                } finally {
                                  setSavingAddon(false);
                                }
                              }}
                              disabled={savingAddon}
                            >
                              {savingAddon ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-3 bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                            onClick={() => {
                              setEditingAddonId(addon._id);
                              setAddonSelections(addon.selections || {});
                            }}
                            disabled={nextSchedule?.status === "skipped" || !nextSchedule?.canChangeDish || !(menu?.categories?.length > 0)}
                          >
                            <SlidersHorizontal className="h-3 w-3 mr-1" />
                            Customize
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-3 bg-white text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200"
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to cancel this add-on? The amount will be refunded.")) return;
                              try {
                                await subscriptionAPI.cancelAddOnTiffin(nextSchedule._id || nextSchedule.scheduleId, addon._id);
                                toast.success("Add-on cancelled and refunded");
                                loadDetails();
                              } catch (err) {
                                toast.error(err?.response?.data?.message || "Failed to cancel add-on");
                              }
                            }}
                            disabled={nextSchedule?.status === "skipped" || !nextSchedule?.canChangeDish}
                          >
                            Cancel & Refund
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 text-center">
                {!isEditingItems ? (
                  <>
                    <Button
                      onClick={() => setIsEditingItems(true)}
                      disabled={nextSchedule?.status === "skipped" || !nextSchedule?.canChangeDish || !(menu?.categories?.length > 0)}
                      className="h-12 w-full rounded-xl bg-green-600 text-sm font-bold text-white hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-500 flex items-center justify-center gap-2"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Enable Customize
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCustomizeModalOpen(true)}
                      disabled={nextSchedule?.status === "skipped" || !nextSchedule?.canChangeDish}
                      className="h-10 w-full rounded-xl mt-3 text-sm font-bold border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
                    >
                      More Options (Skip / Add-on / Address)
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingItems(false);
                        setSelections(nextSchedule?.selections || {});
                      }}
                      disabled={savingItems}
                      className="flex-1 h-12 rounded-xl text-sm font-bold border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          setSavingItems(true);
                          await subscriptionAPI.customizeScheduleItems(nextSchedule._id || nextSchedule.scheduleId, { selections });
                          toast.success("Items customized successfully");
                          setIsEditingItems(false);
                          loadDetails();
                        } catch (err) {
                          toast.error(err?.response?.data?.message || "Failed to save customized items");
                        } finally {
                          setSavingItems(false);
                        }
                      }}
                      disabled={savingItems}
                      className="flex-1 h-12 rounded-xl bg-green-600 text-sm font-bold text-white hover:bg-green-700"
                    >
                      {savingItems ? "Saving..." : "Save Customization"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plan Details Card */}
          <Card className="rounded-[20px] border-0 bg-white shadow-sm dark:bg-[#151f1a]">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-5 w-5 text-green-700" />
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">Plan Details</h2>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Plan Name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{subscription.planTitle || "Standard Plan"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(subscription.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(subscription.endDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-sm font-semibold text-green-700">₹{Number(subscription.totalAmount || 0).toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <SubscriptionCustomizeModal 
        isOpen={isCustomizeModalOpen} 
        onClose={() => setIsCustomizeModalOpen(false)} 
        schedule={nextSchedule}
        subscription={subscription}
        onUpdate={loadDetails}
      />
    </AnimatedPage>
  );
}
