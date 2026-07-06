import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, Package, Clock, ChevronRight } from 'lucide-react';
import { deliveryAPI } from '@food/api';
import { formatCurrency } from '@food/utils/currency';
import { toast } from 'sonner';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateString));
};

export const OrdersListV2 = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      const res = await deliveryAPI.getActiveOrders();
      if (res?.data?.data?.activeOrders) {
        setOrders(res.data.data.activeOrders);
      }
    } catch (err) {
      console.error("Failed to fetch active orders", err);
      toast.error("Failed to load active orders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* HEADER */}
      <div className="bg-white px-6 py-4 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Active Orders</h1>
          <p className="text-xs font-semibold text-gray-500 tracking-wide mt-0.5 uppercase">Your pending deliveries</p>
        </div>
        <div className="bg-orange-100 text-orange-600 p-2 rounded-xl">
          <Package className="w-5 h-5" />
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-6 overflow-y-auto no-scrollbar pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">No Active Orders</h2>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">You don't have any ongoing deliveries.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {orders.map((order, i) => (
                <motion.div
                  key={order._id || order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate('/food/delivery/feed', { state: { targetOrderId: order._id } })}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden group"
                >
                  {/* Status Banner */}
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                    {order.orderStatus.replace(/_/g, ' ')}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100/50">
                      <Package className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 leading-tight">Order #{order.order_id || order._id.toString().slice(-6).toUpperCase()}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pl-2 border-l-2 border-gray-100 ml-4 relative">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="absolute -left-[5px] bottom-2 w-2 h-2 rounded-full bg-green-500"></div>

                    <div className="pl-4">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Pickup</p>
                      <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-1">{order.restaurantName || order.restaurantId?.restaurantName || 'MyMeal Store'}</p>
                    </div>
                    <div className="pl-4 pt-1">
                      <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Dropoff</p>
                      <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-1">{order.deliveryAddress?.street || 'Customer Address'}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</p>
                      <p className="text-sm font-black text-gray-900">{formatCurrency(order.pricing?.total || 0)}</p>
                    </div>
                    <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
                      <span className="text-xs font-bold uppercase tracking-wider">View Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersListV2;
