import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import AnimatedPage from "@food/components/user/AnimatedPage";
import { Card, CardContent } from "@food/components/ui/card";
import { orderAPI } from "@food/api";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Transactions() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getOrders({ limit: 100 });
      const ordersData = res?.data?.data?.data || res?.data?.data?.orders || res?.data?.data || [];
      setOrders(ordersData);
    } catch (err) {
      console.error("Error fetching orders for transactions:", err);
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  // Generate transactions from orders
  const transactions = [];
  orders.forEach((order) => {
    const paymentStatus = (order.payment?.status || "").toLowerCase();
    const orderTotal = Number(order.pricing?.total || order.total || order.payment?.amountDue || 0);
    
    // Check if paid
    const isPaid = ["paid", "captured", "settled"].includes(paymentStatus);
    const isRefunded = paymentStatus === "refunded" || order.payment?.refund?.status === "processed";
    
    if (isPaid || isRefunded || paymentStatus === "authorized") {
      transactions.push({
        id: `pay-${order._id || order.id}`,
        orderId: order.orderId || order.order_id || order._id || order.id,
        mongoId: order._id || order.id,
        type: "payment",
        amount: orderTotal,
        date: new Date(order.createdAt || Date.now()),
        method: order.payment?.method || order.paymentMethod || "online",
        status: isPaid ? "Success" : "Pending",
      });
    }

    if (isRefunded) {
      const refundAmount = Number(order.payment?.refund?.amount || orderTotal);
      transactions.push({
        id: `ref-${order._id || order.id}`,
        orderId: order.orderId || order.order_id || order._id || order.id,
        mongoId: order._id || order.id,
        type: "refund",
        amount: refundAmount,
        date: order.payment?.refund?.processedAt ? new Date(order.payment.refund.processedAt) : new Date(order.updatedAt || Date.now()),
        method: "refund",
        status: "Processed",
      });
    }
  });

  // Sort by date descending
  transactions.sort((a, b) => b.date - a.date);

  const getMethodDisplay = (method) => {
    if (!method) return "Online";
    const m = String(method).toLowerCase();
    if (m === "razorpay" || m === "online") return "Online Payment";
    if (m === "wallet") return "Wallet";
    if (m === "cash" || m === "cod") return "Cash on Delivery";
    if (m === "razorpay_qr") return "COD (QR)";
    return method;
  };

  return (
    <AnimatedPage className="min-h-screen bg-gray-50 dark:bg-[#121212] p-4 pb-20 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/user/profile"
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Transactions
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <Card key={txn.id} className="border-0 shadow-sm rounded-xl overflow-hidden dark:bg-[#1a1a1a]">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${txn.type === "payment" ? "bg-red-50 text-red-600 dark:bg-red-900/20" : "bg-green-50 text-green-600 dark:bg-green-900/20"}`}>
                      {txn.type === "payment" ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {txn.type === "payment" ? "Paid for Order" : "Refund for Order"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>#{txn.orderId}</span>
                        <span>•</span>
                        <span>{format(txn.date, "dd MMM yyyy, hh:mm a")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${txn.type === "payment" ? "text-gray-900 dark:text-white" : "text-green-600"}`}>
                      {txn.type === "payment" ? "-" : "+"}₹{txn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {txn.type === "payment" ? getMethodDisplay(txn.method) : "Refund Processed"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border-0">
            <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              No Transactions Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
              Your payments and refunds will appear here once you place orders.
            </p>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
