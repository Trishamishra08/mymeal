import React, { useEffect, useState } from "react";
import { subscriptionAPI, orderAPI } from "@food/api";
import { Card, CardContent } from "@food/components/ui/card";
import { Button } from "@food/components/ui/button";
import { Badge } from "@food/components/ui/badge";
import { Search, Utensils, MapPin, CheckCircle, Package, Eye } from "lucide-react";
import AnimatedPage from "@food/components/user/AnimatedPage";
import { toast } from "sonner";
import Loader from "@food/components/Loader";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import AssignDeliveryModal from "@food/components/admin/AssignDeliveryModal";

export default function TodaySubscriptionOrders() {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [menu, setMenu] = useState(null);
  const [assignOrderId, setAssignOrderId] = useState(null);

  const loadMeals = async () => {
    setLoading(true);
    try {
      const [res, menuRes] = await Promise.all([
        subscriptionAPI.getTodaySubscriptionSchedulesAdmin(),
        orderAPI.getOneTimeTiffinMenu().catch(() => null)
      ]);
      const list = res?.data?.data?.schedules || res?.data?.schedules || [];
      setMeals(list);

      const menuData = menuRes?.data?.data || {};
      const categories = Array.isArray(menuData.categories) ? menuData.categories : [];
      setMenu({ ...menuData, categories });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load today's orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeals();
  }, []);

  const handleManualAssign = async (meal) => {
    try {
      const res = await subscriptionAPI.sendSubscriptionMealToDeliveryAdmin(meal._id);
      const orderId = res.data?.data?.order?._id || res.data?.order?._id;
      if (orderId) {
        setAssignOrderId(orderId);
      } else {
        toast.error("Could not fetch the generated order ID");
      }
      loadMeals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to assign delivery");
    }
  };

  const filteredMeals = meals.filter(
    (meal) =>
      meal.dishName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.subscriptionId?.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Subscription Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and assign today's tiffin deliveries</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
             <input
               type="text"
               placeholder="Search orders..."
               className="h-10 rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
           <Button onClick={loadMeals} variant="outline" className="h-10">Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader />
        </div>
      ) : filteredMeals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No orders today</h3>
            <p className="text-gray-500 max-w-sm mt-1">There are no subscription tiffins scheduled for today or they have all been dispatched.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-bold">Order ID</th>
                  <th className="px-6 py-4 font-bold">Customer</th>
                  <th className="px-6 py-4 font-bold">Address</th>
                  <th className="px-6 py-4 font-bold">Meal Details</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMeals.map((meal) => {
                  const sub = meal.subscriptionId || {};
                  const address = sub.deliveryAddress || {};
                  const isSkipped = meal.status === "skipped";
                  const hasAddons = meal.addOnTiffins && meal.addOnTiffins.length > 0;
                  const isCustomizedDish = meal.dishChange && meal.dishChange.originalDishId;
                  const hasItemSelections = meal.selections && Object.keys(meal.selections).length > 0;

                  return (
                    <tr key={meal._id} className={`hover:bg-gray-50 transition-colors ${isSkipped ? 'opacity-60 grayscale bg-gray-50' : 'bg-white'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">#{meal._id?.substring(0, 8)}</span>
                        <div className="text-xs text-gray-500 mt-1">{format(new Date(meal.serviceDate), "dd MMM, yyyy")}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{sub.customerName || "Customer"}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{meal.user?.phone || sub.customerPhone || "No phone"}</div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <div className="flex items-start gap-1 text-gray-600">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                          <span className="truncate" title={address.street || address.address}>
                            {address.street || address.address || "Address not provided"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <Utensils className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{meal.dishName}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {isCustomizedDish && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 text-[10px]">Customized Dish</Badge>}
                          {hasItemSelections && <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 text-[10px]">Customized Items</Badge>}
                        </div>
                        {hasAddons && (
                          <div className="mt-2 text-xs">
                            <span className="font-semibold text-green-700">Add-ons: </span>
                            {meal.addOnTiffins.map(a => a.dishName).join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isSkipped ? (
                          <Badge variant="destructive">Skipped</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 capitalize">
                            {meal.status.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-[#55254b]"
                            onClick={() => setSelectedMeal(meal)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!isSkipped && meal.status === "scheduled" ? (
                            <Button 
                              onClick={() => handleManualAssign(meal)} 
                              size="sm"
                              className="bg-[#55254b] hover:bg-[#6f3461] whitespace-nowrap"
                            >
                              Assign Delivery
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Meal Details Modal */}
      <Dialog open={!!selectedMeal} onOpenChange={(open) => !open && setSelectedMeal(null)}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#55254b] border-b pb-4">
              Subscription Meal Details
              <div className="text-xs text-gray-500 font-normal mt-1 flex items-center gap-2">
                ID: {selectedMeal?._id}
                <Badge variant="outline" className="bg-gray-50">{selectedMeal?.status}</Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedMeal && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2 border-b pb-1">Customer Info</h4>
                  <p className="text-sm text-gray-700 font-medium">{selectedMeal.subscriptionId?.customerName || selectedMeal.user?.name || "Customer"}</p>
                  <p className="text-xs text-gray-500 mt-1">Phone: {selectedMeal.user?.phone || selectedMeal.subscriptionId?.customerPhone || "N/A"}</p>
                  <p className="text-xs text-gray-500 mt-1">Email: {selectedMeal.user?.email || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-2 border-b pb-1">Delivery Address</h4>
                  <div className="flex items-start gap-1 text-sm text-gray-700">
                    <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                    <span>
                      {selectedMeal.subscriptionId?.deliveryAddress?.street || selectedMeal.subscriptionId?.deliveryAddress?.address || "Address not provided"}
                      {selectedMeal.subscriptionId?.deliveryAddress?.landmark && <><br /><span className="text-xs text-gray-500">Landmark: {selectedMeal.subscriptionId.deliveryAddress.landmark}</span></>}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 border-b pb-1">Meal & Customizations</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Utensils className="h-4 w-4 text-[#55254b]" />
                    <span className="font-semibold text-gray-900">{selectedMeal.dishName}</span>
                    {selectedMeal.status === "skipped" && <Badge variant="destructive" className="ml-2">Skipped</Badge>}
                  </div>
                  
                  {selectedMeal.dishChange?.originalDishId && (
                    <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded mb-2 border border-blue-100">
                      <strong>Customized Dish:</strong> Changed from default menu dish.
                    </div>
                  )}

                  {menu && menu.categories && menu.categories.length > 0 && (
                    <div className="mb-3 mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Menu Items:</p>
                      <ul className="text-sm text-gray-700 space-y-2">
                        {menu.categories.map((cat) => {
                          const isCustomized = selectedMeal.selections && selectedMeal.selections[cat.categoryId];
                          const selectedItemId = selectedMeal.selections?.[cat.categoryId] || cat.defaultItem?.itemId;
                          const item = cat.items?.find((i) => i.itemId === String(selectedItemId)) || cat.defaultItem;
                          if (!item) return null;
                          return (
                            <li key={cat.categoryId} className="flex flex-col gap-0.5 pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-900 font-medium">{cat.categoryName}: </span>
                                {isCustomized ? (
                                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 text-[10px] h-5 py-0 px-2 rounded-sm">Customized</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-[10px] h-5 py-0 px-2 rounded-sm">Default</Badge>
                                )}
                              </div>
                              <span className="text-gray-600 font-medium">{item.name}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {selectedMeal.addOnTiffins && selectedMeal.addOnTiffins.length > 0 ? (
                    <div className="mt-4 border-t pt-4 border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Extra Add-ons:</p>
                      <ul className="text-sm space-y-3">
                        {selectedMeal.addOnTiffins.map((addon, i) => {
                          const isCancelled = addon.status === 'cancelled' || addon.status === 'refunded';
                          return (
                            <li key={i} className={`flex flex-col text-gray-700 bg-white px-3 py-3 rounded border border-gray-100 ${isCancelled ? 'opacity-50' : ''}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className={`font-semibold ${isCancelled ? 'line-through' : ''}`}>Add-on: {addon.dishName}</span>
                                <div className="flex items-center gap-2">
                                  {isCancelled && <Badge variant="destructive" className="text-[10px] h-5 py-0 px-2 rounded-sm">Cancelled</Badge>}
                                  <span className="text-green-600 font-semibold">+₹{addon.price}</span>
                                </div>
                              </div>
                              
                              {!isCancelled && menu && menu.categories && menu.categories.length > 0 && (
                                <ul className="text-sm text-gray-700 space-y-2 mt-2 pt-2 border-t border-gray-50">
                                  {menu.categories.map((cat) => {
                                    const isCustomized = addon.selections && addon.selections[cat.categoryId];
                                    const selectedItemId = addon.selections?.[cat.categoryId] || cat.defaultItem?.itemId;
                                    const item = cat.items?.find((i) => i.itemId === String(selectedItemId)) || cat.defaultItem;
                                    if (!item) return null;
                                    return (
                                      <li key={cat.categoryId} className="flex flex-col gap-0.5 pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between">
                                          <span className="text-gray-500 font-medium text-xs">{cat.categoryName}: </span>
                                          {isCustomized ? (
                                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 text-[9px] h-4 py-0 px-1.5 rounded-sm">Customized</Badge>
                                          ) : null}
                                        </div>
                                        <span className="text-gray-800 font-medium text-xs">{item.name}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-500">No add-ons for this meal.</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 border-b pb-1">Delivery Status</h4>
                <div className="text-sm flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-medium capitalize">{selectedMeal.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service Date:</span>
                    <span className="font-medium">{format(new Date(selectedMeal.serviceDate), "dd MMM, yyyy")}</span>
                  </div>
                  {selectedMeal.deliveryBoyId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Boy:</span>
                      <span className="font-medium text-[#55254b]">{selectedMeal.deliveryBoyId?.name || "Assigned"}</span>
                    </div>
                  )}
                  {selectedMeal.sentAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sent to delivery at:</span>
                      <span className="font-medium">{format(new Date(selectedMeal.sentAt), "hh:mm a")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AssignDeliveryModal
        orderId={assignOrderId}
        isOpen={!!assignOrderId}
        onClose={() => setAssignOrderId(null)}
        onAssigned={() => {
          setAssignOrderId(null);
          loadMeals();
        }}
      />
    </AnimatedPage>
  );
}
