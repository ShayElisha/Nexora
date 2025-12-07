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
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Loader2,
  FileText,
  QrCode,
  Download,
} from "lucide-react";

const TrackingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: "",
    location: "",
    notes: "",
  });

  const { data: tracking, isLoading } = useQuery({
    queryKey: ["tracking", id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/delivery-tracking/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data) => {
      return axiosInstance.put(`/delivery-tracking/${id}/status`, data);
    },
    onSuccess: () => {
      toast.success("סטטוס המשלוח עודכן");
      queryClient.invalidateQueries(["tracking", id]);
      setShowUpdateModal(false);
      setUpdateForm({ status: "", location: "", notes: "" });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "שגיאה בעדכון סטטוס");
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: async (data) => {
      return axiosInstance.put(`/delivery-tracking/${id}/delivered`, data);
    },
    onSuccess: () => {
      toast.success("המשלוח סומן כמסופק");
      queryClient.invalidateQueries(["tracking", id]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "שגיאה בסימון כמסופק");
    },
  });

  const statusLabels = {
    Preparing: "מכין",
    "Picked Up": "נאסף",
    "In Transit": "נשלח",
    "Out for Delivery": "בדרך למסירה",
    Delivered: "נמסר",
    Exception: "בעיה",
    Returned: "הוחזר",
  };

  const statusColors = {
    Preparing: "bg-blue-100 text-blue-800",
    "Picked Up": "bg-purple-100 text-purple-800",
    "In Transit": "bg-yellow-100 text-yellow-800",
    "Out for Delivery": "bg-orange-100 text-orange-800",
    Delivered: "bg-green-100 text-green-800",
    Exception: "bg-red-100 text-red-800",
    Returned: "bg-gray-100 text-gray-800",
  };

  const handleUpdateStatus = (e) => {
    e.preventDefault();
    updateStatusMutation.mutate(updateForm);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-color)" }}>
        <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-color)" }}>
        <div className="text-center">
          <XCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-xl font-semibold" style={{ color: "var(--text-color)" }}>
            מעקב משלוח לא נמצא
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
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
                מעקב משלוח
              </h1>
              <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                {tracking.trackingNumber}
              </p>
            </div>
          </div>
          {tracking.orderType === "customer" && (
            <button
              onClick={() => navigate(`/dashboard/orders/management/${tracking.orderId}`)}
              className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-2"
              style={{ backgroundColor: "var(--color-secondary)", color: "var(--button-text)" }}
            >
              <Package size={18} />
              צפה בהזמנה
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                פרטי משלוח
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-color-secondary)" }}>
                    חברת משלוחים
                  </p>
                  <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                    {tracking.shippingCompany}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-color-secondary)" }}>
                    ספק שירות
                  </p>
                  <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                    {tracking.carrier}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-color-secondary)" }}>
                    סטטוס
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      statusColors[tracking.shippingStatus] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusLabels[tracking.shippingStatus] || tracking.shippingStatus}
                  </span>
                </div>
                {tracking.currentLocation && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: "var(--text-color-secondary)" }}>
                      מיקום נוכחי
                    </p>
                    <p className="font-semibold flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                      <MapPin size={16} />
                      {tracking.currentLocation}
                    </p>
                  </div>
                )}
                {tracking.estimatedDeliveryDate && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: "var(--text-color-secondary)" }}>
                      תאריך משלוח משוער
                    </p>
                    <p className="font-semibold flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                      <Calendar size={16} />
                      {new Date(tracking.estimatedDeliveryDate).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                )}
                {tracking.actualDeliveryDate && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: "var(--text-color-secondary)" }}>
                      תאריך משלוח בפועל
                    </p>
                    <p className="font-semibold flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                      <CheckCircle size={16} />
                      {new Date(tracking.actualDeliveryDate).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              {tracking.deliveryAddress && (
                <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--border-color)" }}>
                  <h3 className="font-semibold mb-3" style={{ color: "var(--text-color)" }}>
                    כתובת משלוח
                  </h3>
                  <div className="space-y-1 text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    {tracking.deliveryAddress.street && <p>{tracking.deliveryAddress.street}</p>}
                    {tracking.deliveryAddress.city && (
                      <p>
                        {tracking.deliveryAddress.city}
                        {tracking.deliveryAddress.zipCode && `, ${tracking.deliveryAddress.zipCode}`}
                      </p>
                    )}
                    {tracking.deliveryAddress.country && <p>{tracking.deliveryAddress.country}</p>}
                    {tracking.deliveryAddress.contactName && (
                      <p className="mt-2">
                        <strong>איש קשר:</strong> {tracking.deliveryAddress.contactName}
                      </p>
                    )}
                    {tracking.deliveryAddress.contactPhone && (
                      <p>
                        <strong>טלפון:</strong> {tracking.deliveryAddress.contactPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {tracking.qrCode && (
                <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--border-color)" }}>
                  <h3 className="font-semibold mb-3" style={{ color: "var(--text-color)" }}>
                    קוד QR למעקב
                  </h3>
                  <div className="flex items-center gap-4">
                    <img src={tracking.qrCode} alt="QR Code" className="w-32 h-32" />
                    <div>
                      <p className="text-sm mb-2" style={{ color: "var(--text-color-secondary)" }}>
                        סרוק כדי לעקוב אחר המשלוח
                      </p>
                      <a
                        href={tracking.qrCode}
                        download
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                        style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
                      >
                        <Download size={16} />
                        הורד QR
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Tracking History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-xl border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
            >
              <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                היסטוריית מעקב
              </h2>
              <div className="space-y-4">
                {tracking.trackingHistory?.map((update, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg"
                    style={{ backgroundColor: "var(--border-color)" }}
                  >
                    <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{ backgroundColor: "var(--color-primary)" }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold" style={{ color: "var(--text-color)" }}>
                          {statusLabels[update.status] || update.status}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-color-secondary)" }}>
                          {new Date(update.timestamp).toLocaleString("he-IL")}
                        </p>
                      </div>
                      {update.location && (
                        <p className="text-sm mb-1 flex items-center gap-1" style={{ color: "var(--text-color-secondary)" }}>
                          <MapPin size={14} />
                          {update.location}
                        </p>
                      )}
                      {update.notes && (
                        <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                          {update.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

              <button
                onClick={() => setShowUpdateModal(true)}
                className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
              >
                <Edit size={18} />
                עדכן סטטוס
              </button>

              {tracking.shippingStatus !== "Delivered" && (
                <button
                  onClick={() => {
                    if (window.confirm("האם אתה בטוח שהמשלוח נמסר?")) {
                      markDeliveredMutation.mutate({});
                    }
                  }}
                  disabled={markDeliveredMutation.isPending}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
                >
                  {markDeliveredMutation.isPending ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      סמן כמסופק
                    </>
                  )}
                </button>
              )}

              {/* Delivery Proof */}
              {tracking.deliveryProof && (
                <div className="pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                  <h4 className="font-semibold mb-2 text-sm" style={{ color: "var(--text-color)" }}>
                    הוכחת משלוח
                  </h4>
                  <a
                    href={tracking.deliveryProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={tracking.deliveryProof}
                      alt="Delivery Proof"
                      className="w-full rounded-lg"
                    />
                  </a>
                </div>
              )}

              {/* Signature */}
              {tracking.signatureUrl && (
                <div className="pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                  <h4 className="font-semibold mb-2 text-sm" style={{ color: "var(--text-color)" }}>
                    חתימה
                  </h4>
                  <a
                    href={tracking.signatureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={tracking.signatureUrl}
                      alt="Signature"
                      className="w-full rounded-lg"
                    />
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl max-w-md w-full"
            style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
              עדכן סטטוס משלוח
            </h2>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
                  סטטוס *
                </label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="">בחר סטטוס</option>
                  <option value="Preparing">מכין</option>
                  <option value="Picked Up">נאסף</option>
                  <option value="In Transit">נשלח</option>
                  <option value="Out for Delivery">בדרך למסירה</option>
                  <option value="Delivered">נמסר</option>
                  <option value="Exception">בעיה</option>
                  <option value="Returned">הוחזר</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
                  מיקום
                </label>
                <input
                  type="text"
                  value={updateForm.location}
                  onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
                  הערות
                </label>
                <textarea
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setUpdateForm({ status: "", location: "", notes: "" });
                  }}
                  className="flex-1 py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{ backgroundColor: "var(--border-color)", color: "var(--text-color)" }}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
                >
                  {updateStatusMutation.isPending ? "מעדכן..." : "עדכן"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TrackingDetails;

