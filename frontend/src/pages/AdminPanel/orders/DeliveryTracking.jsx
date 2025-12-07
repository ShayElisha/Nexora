import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Package,
  MapPin,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Loader2,
} from "lucide-react";

const DeliveryTracking = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [selectedTracking, setSelectedTracking] = useState(null);

  const { data: trackings = [], isLoading } = useQuery({
    queryKey: ["all-trackings", statusFilter, carrierFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (carrierFilter !== "all") params.append("carrier", carrierFilter);
      const response = await axiosInstance.get(`/delivery-tracking/all?${params.toString()}`);
      return response.data.data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, location, notes }) => {
      return axiosInstance.put(`/delivery-tracking/${id}/status`, {
        status,
        location,
        notes,
      });
    },
    onSuccess: () => {
      toast.success("סטטוס המשלוח עודכן");
      queryClient.invalidateQueries(["all-trackings"]);
      setSelectedTracking(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "שגיאה בעדכון סטטוס");
    },
  });

  const filteredTrackings = trackings.filter((tracking) => {
    const matchesSearch =
      tracking.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracking.shippingCompany.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const statusColors = {
    Preparing: "bg-yellow-100 text-yellow-800",
    "Picked Up": "bg-blue-100 text-blue-800",
    "In Transit": "bg-indigo-100 text-indigo-800",
    "Out for Delivery": "bg-purple-100 text-purple-800",
    Delivered: "bg-green-100 text-green-800",
    Exception: "bg-red-100 text-red-800",
    Returned: "bg-gray-100 text-gray-800",
  };

  const statusLabels = {
    Preparing: "מכין למשלוח",
    "Picked Up": "נאסף",
    "In Transit": "בדרך",
    "Out for Delivery": "בדרך למסירה",
    Delivered: "נמסר",
    Exception: "בעיה",
    Returned: "הוחזר",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-color)" }}>
        <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
            מעקב משלוחים
          </h1>
          <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
            ניהול ומעקב אחר כל המשלוחים הפעילים
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              size={20}
              style={{ color: "var(--text-color-secondary)" }}
            />
            <input
              type="text"
              placeholder="חפש לפי מספר מעקב או חברת משלוחים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-lg border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="Preparing">מכין למשלוח</option>
            <option value="Picked Up">נאסף</option>
            <option value="In Transit">בדרך</option>
            <option value="Out for Delivery">בדרך למסירה</option>
            <option value="Delivered">נמסר</option>
            <option value="Exception">בעיה</option>
          </select>

          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
          >
            <option value="all">כל החברות</option>
            <option value="DHL">DHL</option>
            <option value="UPS">UPS</option>
            <option value="FedEx">FedEx</option>
            <option value="דואר ישראל">דואר ישראל</option>
            <option value="Other">אחר</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="סה״כ משלוחים"
            value={trackings.length}
            icon={Package}
          />
          <StatCard
            title="בדרך"
            value={trackings.filter((t) => t.shippingStatus === "In Transit" || t.shippingStatus === "Out for Delivery").length}
            icon={Truck}
          />
          <StatCard
            title="נמסרו"
            value={trackings.filter((t) => t.shippingStatus === "Delivered").length}
            icon={CheckCircle}
          />
          <StatCard
            title="בעיות"
            value={trackings.filter((t) => t.shippingStatus === "Exception").length}
            icon={AlertCircle}
          />
        </div>

        {/* Trackings List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredTrackings.map((tracking) => (
              <motion.div
                key={tracking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 rounded-xl border cursor-pointer hover:shadow-lg transition-all"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
                onClick={() => navigate(`/dashboard/orders/tracking/${tracking._id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-mono text-sm mb-1" style={{ color: "var(--text-color-secondary)" }}>
                      {tracking.trackingNumber}
                    </p>
                    <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                      {tracking.shippingCompany}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusColors[tracking.shippingStatus] || "bg-gray-100 text-gray-800"}`}
                  >
                    {statusLabels[tracking.shippingStatus] || tracking.shippingStatus}
                  </span>
                </div>

                {tracking.currentLocation && (
                  <div className="flex items-center gap-2 mb-2 text-sm">
                    <MapPin size={14} style={{ color: "var(--text-color-secondary)" }} />
                    <span style={{ color: "var(--text-color-secondary)" }}>{tracking.currentLocation}</span>
                  </div>
                )}

                {tracking.estimatedDeliveryDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} style={{ color: "var(--text-color-secondary)" }} />
                    <span style={{ color: "var(--text-color-secondary)" }}>
                      {new Date(tracking.estimatedDeliveryDate).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                )}

                {tracking.orderType === "customer" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/orders/management/${tracking.orderId}`);
                    }}
                    className="mt-3 w-full py-2 px-3 rounded-lg text-sm font-medium transition-all hover:opacity-80 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
                  >
                    <Eye size={14} />
                    צפה בהזמנה
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredTrackings.length === 0 && (
          <div className="text-center py-12">
            <Package size={64} className="mx-auto mb-4" style={{ color: "var(--text-color-secondary)" }} />
            <p className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
              לא נמצאו משלוחים
            </p>
          </div>
        )}
      </div>

      {/* Tracking Details Modal */}
      {selectedTracking && (
        <TrackingDetailsModal
          tracking={selectedTracking}
          onClose={() => setSelectedTracking(null)}
          onUpdateStatus={updateStatusMutation.mutate}
          isLoading={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="p-4 rounded-xl border"
    style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm mb-1" style={{ color: "var(--text-color-secondary)" }}>
          {title}
        </p>
        <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
          {value}
        </p>
      </div>
      <Icon size={32} style={{ color: "var(--color-primary)" }} />
    </div>
  </motion.div>
);

const TrackingDetailsModal = ({ tracking, onClose, onUpdateStatus, isLoading }) => {
  const [status, setStatus] = useState(tracking.shippingStatus);
  const [location, setLocation] = useState(tracking.currentLocation || "");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateStatus({
      id: tracking._id,
      status,
      location,
      notes,
    });
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
          פרטי מעקב משלוח
        </h2>

        {/* Tracking Info */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-color-secondary)" }}>
              מספר מעקב
            </p>
            <p className="font-mono font-semibold" style={{ color: "var(--text-color)" }}>
              {tracking.trackingNumber}
            </p>
          </div>

          <div>
            <p className="text-sm mb-1" style={{ color: "var(--text-color-secondary)" }}>
              חברת משלוחים
            </p>
            <p style={{ color: "var(--text-color)" }}>{tracking.shippingCompany}</p>
          </div>

          {/* Tracking History */}
          <div>
            <p className="text-sm mb-2 font-semibold" style={{ color: "var(--text-color)" }}>
              היסטוריית עדכונים
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tracking.trackingHistory?.slice().reverse().map((update, index) => (
                <div
                  key={index}
                  className="p-2 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--border-color)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium" style={{ color: "var(--text-color)" }}>
                      {update.status}
                    </span>
                    <span style={{ color: "var(--text-color-secondary)" }}>
                      {new Date(update.timestamp).toLocaleString("he-IL")}
                    </span>
                  </div>
                  {update.location && (
                    <p className="text-xs" style={{ color: "var(--text-color-secondary)" }}>
                      {update.location}
                    </p>
                  )}
                  {update.notes && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-color-secondary)" }}>
                      {update.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
              סטטוס חדש
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
            >
              <option value="Preparing">מכין למשלוח</option>
              <option value="Picked Up">נאסף</option>
              <option value="In Transit">בדרך</option>
              <option value="Out for Delivery">בדרך למסירה</option>
              <option value="Delivered">נמסר</option>
              <option value="Exception">בעיה</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
              מיקום נוכחי
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-color)" }}>
              הערות
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
            />
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
              {isLoading ? "מעדכן..." : "עדכן"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default DeliveryTracking;

