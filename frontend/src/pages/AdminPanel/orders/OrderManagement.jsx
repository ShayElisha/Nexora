import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  User,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Plus,
  Loader2,
  Eye,
} from "lucide-react";
import OrderTimeline from "../../../components/orders/OrderTimeline";
import DeliveryStatusCard from "../../../components/orders/DeliveryStatusCard";

const OrderManagement = () => {
  const { orderId, id } = useParams(); // Support both :orderId and :id params
  const actualOrderId = orderId || id; // Use orderId if available, otherwise use id
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateTracking, setShowCreateTracking] = useState(false);

  // Fetch order data (Customer Order only)
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", actualOrderId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/CustomerOrder/${actualOrderId}`);
      return response.data.data || response.data;
    },
    enabled: !!actualOrderId,
  });

  // Fetch tracking data
  const { data: tracking, isLoading: trackingLoading } = useQuery({
    queryKey: ["tracking", actualOrderId, "customer"],
    queryFn: async () => {
      const response = await axiosInstance.get(`/delivery-tracking/order/${actualOrderId}/customer`);
      return response.data.data;
    },
    enabled: !!actualOrderId && !!order?.deliveryTrackingId,
  });

  // Create production orders mutation (alternative solution)
  const createProductionOrdersMutation = useMutation({
    mutationFn: async () => {
      console.log(`🚀 [FRONTEND] Calling create-production-orders route for order ${actualOrderId}`);
      try {
        const response = await axiosInstance.post(`/CustomerOrder/${actualOrderId}/create-production-orders`);
        console.log(`✅ [FRONTEND] Create production orders response:`, response.data);
        return response;
      } catch (error) {
        console.error(`❌ [FRONTEND] Create production orders error:`, error);
        throw error;
      }
    },
    onSuccess: (response) => {
      const data = response.data;
      if (data.productionOrdersCreated > 0) {
        toast.success(`נוצרו ${data.productionOrdersCreated} הזמנות ייצור עבור ההפרש החסר במלאי`, { duration: 5000 });
        queryClient.invalidateQueries(["production-orders"]);
      } else {
        toast.info("לא נוצרו הזמנות ייצור - יש מספיק מלאי או אין BOM למוצרים");
      }
      queryClient.invalidateQueries(["order", actualOrderId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "שגיאה ביצירת הזמנות ייצור");
    }
  });

  // Prepare for shipping mutation
  const prepareMutation = useMutation({
    mutationFn: async () => {
      console.log(`🚀 [FRONTEND] Calling prepare route for order ${actualOrderId}`);
      console.log(`🚀 [FRONTEND] URL: /CustomerOrder/${actualOrderId}/prepare`);
      try {
        const response = await axiosInstance.post(`/CustomerOrder/${actualOrderId}/prepare`);
        console.log(`✅ [FRONTEND] Prepare response:`, response.data);
        return response;
      } catch (error) {
        console.error(`❌ [FRONTEND] Prepare error:`, error);
        throw error;
      }
    },
    onSuccess: (response) => {
      const data = response.data;
      let message = "ההזמנה הוכנה למשלוח";
      
      if (data.productionOrdersCreated && data.productionOrdersCreated > 0) {
        message += `\nנוצרו ${data.productionOrdersCreated} הזמנות ייצור עבור ההפרש החסר במלאי`;
        if (data.productionOrderDetails && data.productionOrderDetails.length > 0) {
          const details = data.productionOrderDetails.map(po => 
            `${po.productName}: ${po.quantity} יחידות (${po.orderNumber})`
          ).join("\n");
          toast.success(message, { duration: 5000 });
          console.log("Production orders created:", details);
        } else {
          toast.success(message, { duration: 5000 });
        }
      } else {
        toast.success(message);
      }
      
      queryClient.invalidateQueries(["order", actualOrderId]);
      queryClient.invalidateQueries(["production-orders"]);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "שגיאה בהכנת ההזמנה";
      const inventoryIssues = error.response?.data?.inventoryIssues;
      
      if (inventoryIssues && inventoryIssues.length > 0) {
        const issuesText = inventoryIssues.map(issue =>
          `${issue.productName}: נדרש ${issue.required}, זמין ${issue.available}, חסר ${issue.missing}`
        ).join("\n");
        toast.error(`${errorMessage}\n\n${issuesText}`, {
          duration: 6000,
        });
      } else {
        toast.error(errorMessage);
      }
    },
  });

  // Create tracking mutation
  const createTrackingMutation = useMutation({
    mutationFn: async (data) => {
      return axiosInstance.post("/delivery-tracking/create", {
        orderId: actualOrderId,
        orderType: "customer",
        ...data,
      });
    },
    onSuccess: () => {
      toast.success("מעקב משלוח נוצר בהצלחה");
      setShowCreateTracking(false);
      queryClient.invalidateQueries(["tracking", actualOrderId, "customer"]);
      queryClient.invalidateQueries(["order", actualOrderId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "שגיאה ביצירת מעקב משלוח");
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      return axiosInstance.put(`/CustomerOrder/${actualOrderId}/status`, { status });
    },
    onSuccess: () => {
      toast.success("סטטוס ההזמנה עודכן");
      queryClient.invalidateQueries(["order", actualOrderId]);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "שגיאה בעדכון סטטוס";
      const inventoryIssues = error.response?.data?.inventoryIssues;
      
      if (inventoryIssues && inventoryIssues.length > 0) {
        // Show detailed inventory issues
        const issuesText = inventoryIssues.map(issue =>
          `${issue.productName}: נדרש ${issue.required}, זמין ${issue.available}, חסר ${issue.missing}`
        ).join("\n");
        toast.error(`${errorMessage}\n\n${issuesText}`, {
          duration: 6000,
        });
      } else {
        toast.error(errorMessage);
      }
    },
  });

  if (orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-color)" }}>
        <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-color)" }}>
        <div className="text-center">
          <XCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-xl font-semibold" style={{ color: "var(--text-color)" }}>
            הזמנה לא נמצאה
          </p>
        </div>
      </div>
    );
  }

  // Determine stages for customer order
  const getStages = () => {
    return [
      {
        name: "ממתין",
        date: order.createdAt,
        completed: order.status !== "Pending",
      },
      {
        name: "מאושר",
        date: order.confirmedAt,
        completed: order.status === "Confirmed" || order.status === "Shipped" || order.status === "Delivered",
      },
      {
        name: "נשלח להכנה",
        date: order.preparationDate,
        completed: order.preparationStatus === "In Progress" || order.preparationStatus === "Ready to Ship" || order.status === "Shipped" || order.status === "Delivered",
      },
      {
        name: "מוכן",
        date: order.preparationStatus === "Ready to Ship" ? order.preparationDate : null,
        completed: order.preparationStatus === "Ready to Ship" || order.status === "Shipped" || order.status === "Delivered",
      },
      {
        name: "נשלח לחברת שליחויות",
        date: order.shippedAt,
        completed: order.status === "Shipped" || order.status === "Delivered",
      },
      {
        name: "נשלח",
        date: tracking?.trackingHistory?.find(h => h.status === "In Transit" || h.status === "Out for Delivery")?.timestamp,
        completed: tracking?.shippingStatus === "In Transit" || tracking?.shippingStatus === "Out for Delivery" || tracking?.shippingStatus === "Delivered",
      },
      {
        name: "נמסר",
        date: order.deliveredAt,
        completed: order.status === "Delivered",
      },
    ];
  };

  const getCurrentStatus = () => {
    // Prioritize delivery tracking status if available
    if (tracking?.shippingStatus === "Delivered") return "Delivered";
    if (tracking?.shippingStatus === "Out for Delivery") return "Out for Delivery";
    if (tracking?.shippingStatus === "In Transit") return "In Transit";
    if (tracking?.shippingStatus === "Picked Up") return "Picked Up";
    if (order.status === "Shipped") return "Shipped";
    if (order.preparationStatus === "Ready to Ship") return "Ready to Ship";
    if (order.preparationStatus === "In Progress") return "In Progress";
    if (order.status === "Confirmed") return "Confirmed";
    return order.status; // Fallback to order status
  };

  // Check what actions are available based on current stage
  const canApprove = () => {
    return order.status === "Pending";
  };

  const canPrepare = () => {
    const can = order.status === "Confirmed" && order.preparationStatus === "Not Started";
    console.log(`🔍 [FRONTEND] canPrepare check:`, {
      status: order.status,
      preparationStatus: order.preparationStatus,
      can: can
    });
    return can;
  };

  const canCreateTracking = () => {
    return order.preparationStatus === "Ready to Ship" && !order.deliveryTrackingId;
  };

  const canViewTracking = () => {
    return !!order.deliveryTrackingId;
  };

  const canViewPreparation = () => {
    return order.preparationStatus === "In Progress" || order.preparationStatus === "Ready to Ship";
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:opacity-80 transition-all"
              style={{ backgroundColor: "var(--border-color)" }}
            >
              <ArrowLeft size={20} style={{ color: "var(--text-color)" }} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                ניהול הזמנת לקוח
              </h1>
              <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                הזמנה #${order._id?.slice(-6)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                פרטי הזמנה
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <User size={20} style={{ color: "var(--color-primary)" }} />
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-color-secondary)" }}>
                      לקוח
                    </p>
                    <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                      {order.customer?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar size={20} style={{ color: "var(--color-primary)" }} />
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-color-secondary)" }}>
                      תאריך הזמנה
                    </p>
                    <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                      {new Date(order.orderDate).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign size={20} style={{ color: "var(--color-primary)" }} />
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-color-secondary)" }}>
                      סכום כולל
                    </p>
                    <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                      {order.orderTotal} {order.currency || "USD"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Package size={20} style={{ color: "var(--color-primary)" }} />
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-color-secondary)" }}>
                      כמות מוצרים
                    </p>
                    <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                      {order.items?.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Products/Items List */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3" style={{ color: "var(--text-color)" }}>
                  מוצרים
                </h3>
                <div className="space-y-2">
                  {order.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: "var(--border-color)" }}
                    >
                      <div>
                        <p className="font-medium" style={{ color: "var(--text-color)" }}>
                          {item.product?.productName || item.productName}
                        </p>
                        <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                          כמות: {item.quantity} | מחיר: {item.unitPrice || (item.totalPrice / item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                        {item.totalPrice}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                התקדמות ההזמנה
              </h2>
              <OrderTimeline currentStatus={getCurrentStatus()} stages={getStages()} />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Tracking */}
            {trackingLoading ? (
              <div className="p-6 rounded-xl border flex items-center justify-center" style={{ borderColor: "var(--border-color)" }}>
                <Loader2 className="animate-spin" size={24} style={{ color: "var(--color-primary)" }} />
              </div>
            ) : (
              <DeliveryStatusCard
                tracking={tracking}
                onUpdateStatus={(tracking) => {
                  // Navigate to tracking update page or open modal
                  navigate(`/dashboard/orders/tracking/${tracking._id}`);
                }}
              />
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-xl border space-y-3"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
            >
              <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                פעולות
              </h3>

              {/* Stage 1: Pending - Approve Order */}
              {canApprove() && (
                <button
                  onClick={() => updateStatusMutation.mutate("Confirmed")}
                  disabled={updateStatusMutation.isPending}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      אשר הזמנה
                    </>
                  )}
                </button>
              )}

              {/* Stage 2: Confirmed - Prepare for Shipping */}
              {canPrepare() && (
                <>
                  <button
                    onClick={() => prepareMutation.mutate()}
                    disabled={prepareMutation.isPending}
                    className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
                  >
                    {prepareMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Package size={18} />
                        שלח להכנה
                      </>
                    )}
                  </button>
                  
                  {/* Alternative: Create Production Orders Button */}
                  <button
                    onClick={() => createProductionOrdersMutation.mutate()}
                    disabled={createProductionOrdersMutation.isPending}
                    className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2 border"
                    style={{ 
                      borderColor: "var(--color-accent)", 
                      color: "var(--color-accent)",
                      backgroundColor: "transparent"
                    }}
                  >
                    {createProductionOrdersMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Package size={18} />
                        צור הזמנות ייצור למלאי חסר
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Stage 3: In Progress - View in Preparation Page */}
              {canViewPreparation() && (
                <button
                  onClick={() => navigate("/dashboard/orders/preparation")}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--color-secondary)", color: "var(--button-text)" }}
                >
                  <Eye size={18} />
                  צפה בדף ההכנה
                </button>
              )}

              {/* Stage 4: Ready to Ship - Create Tracking */}
              {canCreateTracking() && (
                <button
                  onClick={() => setShowCreateTracking(true)}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
                >
                  <Truck size={18} />
                  צור מעקב משלוח
                </button>
              )}

              {/* Stage 5+: Shipped/Delivered - View Tracking */}
              {canViewTracking() && (
                <button
                  onClick={() => navigate(`/dashboard/orders/tracking/${tracking?._id || order.deliveryTrackingId}`)}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--color-secondary)", color: "var(--button-text)" }}
                >
                  <Truck size={18} />
                  צפה במעקב משלוח
                </button>
              )}

              {/* Manual Status Update (for edge cases) */}
              {order.status !== "Delivered" && order.status !== "Cancelled" && !canApprove() && !canPrepare() && !canCreateTracking() && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--border-color)" }}>
                  <label className="block text-sm font-medium" style={{ color: "var(--text-color-secondary)" }}>
                    עדכון סטטוס ידני
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                  >
                    <option value="Pending">ממתין</option>
                    <option value="Confirmed">מאושר</option>
                    <option value="On Hold">מושהה</option>
                    <option value="Shipped">נשלח</option>
                    <option value="Delivered">נמסר</option>
                    <option value="Cancelled">בוטל</option>
                  </select>
                </div>
              )}

              {/* Completed/Delivered Message */}
              {order.status === "Delivered" && (
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "var(--border-color)" }}>
                  <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                    ההזמנה נמסרה בהצלחה
                  </p>
                </div>
              )}

              {/* Cancelled Message */}
              {order.status === "Cancelled" && (
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "var(--border-color)" }}>
                  <XCircle size={24} className="mx-auto mb-2 text-red-500" />
                  <p className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                    ההזמנה בוטלה
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Create Tracking Modal */}
      {showCreateTracking && (
        <CreateTrackingModal
          order={order}
          onClose={() => setShowCreateTracking(false)}
          onSubmit={(data) => createTrackingMutation.mutate(data)}
          isLoading={createTrackingMutation.isPending}
        />
      )}
    </div>
  );
};

// Create Tracking Modal Component
const CreateTrackingModal = ({ order, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    shippingCompany: "",
    carrier: "Other",
    estimatedDeliveryDate: order?.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : "",
    deliveryAddress: {
      street: order?.shippingAddress?.street || "",
      city: order?.shippingAddress?.city || "",
      country: order?.shippingAddress?.country || "",
      zipCode: order?.shippingAddress?.zipCode || "",
      contactName: order?.shippingAddress?.contactName || order?.customer?.name || "",
      contactPhone: order?.shippingAddress?.contactPhone || order?.contactPhone || order?.customer?.phone || "",
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
          צור מעקב משלוח
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
              חברת משלוחים *
            </label>
            <input
              type="text"
              required
              value={formData.shippingCompany}
              onChange={(e) => setFormData({ ...formData, shippingCompany: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
              ספק שירות
            </label>
            <select
              value={formData.carrier}
              onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
            >
              <option value="Other">אחר</option>
              <option value="DHL">DHL</option>
              <option value="UPS">UPS</option>
              <option value="FedEx">FedEx</option>
              <option value="USPS">USPS</option>
              <option value="דואר ישראל">דואר ישראל</option>
              <option value="TNT">TNT</option>
              <option value="Aramex">Aramex</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
              תאריך משלוח משוער
            </label>
            <input
              type="date"
              value={formData.estimatedDeliveryDate}
              onChange={(e) => setFormData({ ...formData, estimatedDeliveryDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
            />
          </div>

          {/* Delivery Address Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
                רחוב
              </label>
              <input
                type="text"
                value={formData.deliveryAddress.street}
                onChange={(e) => setFormData({
                  ...formData,
                  deliveryAddress: { ...formData.deliveryAddress, street: e.target.value }
                })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
                עיר
              </label>
              <input
                type="text"
                value={formData.deliveryAddress.city}
                onChange={(e) => setFormData({
                  ...formData,
                  deliveryAddress: { ...formData.deliveryAddress, city: e.target.value }
                })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
                מדינה
              </label>
              <input
                type="text"
                value={formData.deliveryAddress.country}
                onChange={(e) => setFormData({
                  ...formData,
                  deliveryAddress: { ...formData.deliveryAddress, country: e.target.value }
                })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
                מיקוד
              </label>
              <input
                type="text"
                value={formData.deliveryAddress.zipCode}
                onChange={(e) => setFormData({
                  ...formData,
                  deliveryAddress: { ...formData.deliveryAddress, zipCode: e.target.value }
                })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
                שם איש קשר
              </label>
              <input
                type="text"
                value={formData.deliveryAddress.contactName}
                onChange={(e) => setFormData({
                  ...formData,
                  deliveryAddress: { ...formData.deliveryAddress, contactName: e.target.value }
                })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
                טלפון ליצירת קשר
              </label>
              <input
                type="text"
                value={formData.deliveryAddress.contactPhone}
                onChange={(e) => setFormData({
                  ...formData,
                  deliveryAddress: { ...formData.deliveryAddress, contactPhone: e.target.value }
                })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: "var(--border-color)", color: "var(--text-color)" }}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
            >
              {isLoading ? "יוצר..." : "צור"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default OrderManagement;

