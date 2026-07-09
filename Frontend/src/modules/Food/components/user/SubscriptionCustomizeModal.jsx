import React, { useState, useEffect } from "react";
import { X, MapPin, Ban, PlusCircle, Utensils, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@food/components/ui/card";
import { Button } from "@food/components/ui/button";
import { toast } from "sonner";
import { subscriptionAPI } from "@food/api";
import { initRazorpayPayment, loadRazorpayScript } from "@food/utils/razorpay";
import { useNavigate } from "react-router-dom";

export default function SubscriptionCustomizeModal({
  isOpen,
  onClose,
  schedule,
  subscription,
  onUpdate,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("options"); // options, addon
  const [loading, setLoading] = useState(false);
  const [availableDishes, setAvailableDishes] = useState([]);
  
  useEffect(() => {
    if (schedule?.availableDishes) {
      setAvailableDishes(schedule.availableDishes);
    }
  }, [schedule]);

  if (!isOpen || !schedule) return null;

  const handleSkip = async () => {
    if (!window.confirm("Are you sure you want to skip this meal? Your plan will be extended by 1 day.")) return;
    setLoading(true);
    try {
      await subscriptionAPI.skipSchedule(schedule.scheduleId || schedule._id);
      toast.success("Meal skipped successfully");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to skip meal");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = () => {
    onClose();
    navigate("/food/user/address-selector", {
      state: {
        mode: "subscription-address",
        subscriptionId: subscription.subscriptionId || subscription._id,
        returnTo: `/food/user/profile/subscriptions/${subscription.subscriptionId || subscription._id}`,
        backTo: `/food/user/profile/subscriptions/${subscription.subscriptionId || subscription._id}`,
      },
    });
  };

  const handleDishChange = () => {
    onClose();
    navigate(`/food/user/profile/subscriptions/${subscription.subscriptionId || subscription._id}/change-dish/${schedule.scheduleId || schedule._id}`);
  };

  const handleAddExtraTiffin = async (dish) => {
    setLoading(true);
    const dishId = dish._id || dish.id || dish.dishId;
    try {
      await loadRazorpayScript();

      const res = await subscriptionAPI.addExtraTiffin(schedule.scheduleId || schedule._id, { dishId });
      const { razorpay } = res.data?.data || {};

      if (!razorpay) {
        toast.error("Failed to initialize payment");
        setLoading(false);
        return;
      }

      if (razorpay.directTestMode) {
        await subscriptionAPI.verifyExtraTiffinPayment(schedule.scheduleId || schedule._id, {
          dishId,
          razorpayOrderId: razorpay.orderId,
          razorpayPaymentId: `test_pay_${Date.now()}`,
          razorpaySignature: "test_sig",
        });
        toast.success("Extra tiffin added successfully");
        onUpdate();
        onClose();
        setLoading(false);
        return;
      }

      const options = {
        key: razorpay.key,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: "MyMeal",
        description: `Extra tiffin: ${dish.name}`,
        order_id: razorpay.orderId,
        handler: async function (response) {
          try {
            await subscriptionAPI.verifyExtraTiffinPayment(schedule.scheduleId || schedule._id, {
              dishId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Extra tiffin added successfully");
            onUpdate();
            onClose();
          } catch (err) {
            toast.error(err?.response?.data?.message || "Payment verification failed");
          }
        },
        prefill: {
          name: subscription.customerName || "User",
          contact: subscription.customerPhone || "",
        },
        theme: { color: "#16a34a" },
      };

      await initRazorpayPayment(options);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Failed to add extra tiffin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-full rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-2xl sm:slide-in-from-bottom-0 dark:bg-[#1a1a1a]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {activeTab === "options" ? "Customize Meal" : "Add Extra Tiffin"}
          </h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => activeTab === "options" ? onClose() : setActiveTab("options")}>
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {activeTab === "options" && (
          <div className="space-y-4">
            <Button
              variant="outline"
              className="flex h-16 w-full items-center justify-start justify-between rounded-xl border-gray-200 px-4 hover:border-green-600 hover:bg-green-50 dark:border-gray-800 dark:hover:bg-green-900/20"
              onClick={handleAddressChange}
              disabled={!schedule.canChangeAddress}
            >
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Change Address</p>
                  <p className="text-xs text-gray-500">Deliver to a different location</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex h-16 w-full items-center justify-start justify-between rounded-xl border-gray-200 px-4 hover:border-green-600 hover:bg-green-50 dark:border-gray-800 dark:hover:bg-green-900/20"
              onClick={handleDishChange}
              disabled={!schedule.canChangeDish || availableDishes.length === 0}
            >
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Change Items</p>
                  <p className="text-xs text-gray-500">Select a different dish today</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex h-16 w-full items-center justify-start justify-between rounded-xl border-gray-200 px-4 hover:border-green-600 hover:bg-green-50 dark:border-gray-800 dark:hover:bg-green-900/20"
              onClick={() => {
                const defaultDish = availableDishes.find(d => (d._id || d.id || d.dishId) === (schedule.dishId || schedule.dish?._id || schedule.dish?.id)) || availableDishes[0];
                if (defaultDish) handleAddExtraTiffin(defaultDish);
              }}
              disabled={!schedule.canChangeDish || availableDishes.length === 0 || loading}
            >
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Add Extra Tiffin</p>
                  <p className="text-xs text-gray-500">Order an additional meal today</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex h-16 w-full items-center justify-start justify-between rounded-xl border-gray-200 px-4 hover:border-red-600 hover:bg-red-50 dark:border-gray-800 dark:hover:bg-red-900/20"
              onClick={handleSkip}
              disabled={!schedule.canSkip || loading}
            >
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Ban className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-red-600">Skip Today's Meal</p>
                  <p className="text-xs text-red-400">Plan extended by 1 day</p>
                </div>
              </div>
            </Button>
          </div>
        )}


      </div>
    </div>
  );
}
