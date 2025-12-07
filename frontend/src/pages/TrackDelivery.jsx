import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axiosInstance from "../lib/axios";
import { motion } from "framer-motion";
import {
  Package,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Loader2,
} from "lucide-react";
import OrderTimeline from "../components/orders/OrderTimeline";

const TrackDelivery = () => {
  const { trackingNumber } = useParams();
  const [searchNumber, setSearchNumber] = useState(trackingNumber || "");

  const { data: tracking, isLoading, error } = useQuery({
    queryKey: ["public-tracking", searchNumber],
    queryFn: async () => {
      const response = await axiosInstance.get(`/delivery-tracking/public/${searchNumber}`);
      return response.data.data;
    },
    enabled: !!searchNumber && searchNumber.length > 0,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchNumber.trim()) {
      // Trigger refetch
      window.location.href = `/track/${searchNumber}`;
    }
  };

  const statusColors = {
    Preparing: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
    "Picked Up": { bg: "bg-blue-100", text: "text-blue-800", icon: Package },
    "In Transit": { bg: "bg-indigo-100", text: "text-indigo-800", icon: Package },
    "Out for Delivery": { bg: "bg-purple-100", text: "text-purple-800", icon: Package },
    Delivered: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
    Exception: { bg: "bg-red-100", text: "text-red-800", icon: AlertCircle },
    Returned: { bg: "bg-gray-100", text: "text-gray-800", icon: Package },
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

  const getStages = () => {
    if (!tracking?.trackingHistory) return [];
    const uniqueStatuses = [...new Set(tracking.trackingHistory.map((h) => h.status))];
    return uniqueStatuses.map((status, index) => ({
      name: statusLabels[status] || status,
      date: tracking.trackingHistory.find((h) => h.status === status)?.timestamp,
      completed: index < uniqueStatuses.length - 1,
    }));
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
            מעקב משלוח
          </h1>
          <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
            הזן מספר מעקב כדי לראות את סטטוס המשלוח שלך
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="הזן מספר מעקב..."
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg border text-lg"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-2"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
          >
            <Search size={20} />
            חפש
          </button>
        </form>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-primary)" }} />
          </div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl border text-center"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
          >
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <p className="text-lg font-semibold mb-2" style={{ color: "var(--text-color)" }}>
              לא נמצא מעקב
            </p>
            <p style={{ color: "var(--text-color-secondary)" }}>
              אנא ודא שמספר המעקב שהוזן נכון
            </p>
          </motion.div>
        )}

        {/* Tracking Details */}
        {tracking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status Card */}
            <div className="p-6 rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: "var(--text-color-secondary)" }}>
                    מספר מעקב
                  </p>
                  <p className="font-mono text-xl font-bold" style={{ color: "var(--text-color)" }}>
                    {tracking.trackingNumber}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${statusColors[tracking.shippingStatus]?.bg || "bg-gray-100"}`}>
                  {(statusColors[tracking.shippingStatus]?.icon || Package)({
                    size: 32,
                    className: statusColors[tracking.shippingStatus]?.text || "text-gray-800",
                  })}
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
                  {statusLabels[tracking.shippingStatus] || tracking.shippingStatus}
                </h2>
                <p style={{ color: "var(--text-color-secondary)" }}>
                  {tracking.shippingCompany}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tracking.currentLocation && (
                <div className="p-4 rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin size={20} style={{ color: "var(--color-primary)" }} />
                    <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                      מיקום נוכחי
                    </h3>
                  </div>
                  <p style={{ color: "var(--text-color-secondary)" }}>
                    {tracking.currentLocation}
                  </p>
                </div>
              )}

              {tracking.estimatedDeliveryDate && (
                <div className="p-4 rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar size={20} style={{ color: "var(--color-primary)" }} />
                    <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                      תאריך משלוח משוער
                    </h3>
                  </div>
                  <p style={{ color: "var(--text-color-secondary)" }}>
                    {new Date(tracking.estimatedDeliveryDate).toLocaleDateString("he-IL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}

              {tracking.actualDeliveryDate && (
                <div className="p-4 rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle size={20} style={{ color: "var(--color-primary)" }} />
                    <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                      תאריך משלוח בפועל
                    </h3>
                  </div>
                  <p style={{ color: "var(--text-color-secondary)" }}>
                    {new Date(tracking.actualDeliveryDate).toLocaleDateString("he-IL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Timeline */}
            {tracking.trackingHistory && tracking.trackingHistory.length > 0 && (
              <div className="p-6 rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                  היסטוריית עדכונים
                </h3>
                <div className="space-y-3">
                  {tracking.trackingHistory.slice().reverse().map((update, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg"
                      style={{ backgroundColor: "var(--border-color)" }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold" style={{ color: "var(--text-color)" }}>
                            {statusLabels[update.status] || update.status}
                          </span>
                          <span className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                            {new Date(update.timestamp).toLocaleString("he-IL")}
                          </span>
                        </div>
                        {update.location && (
                          <p className="text-sm mb-1" style={{ color: "var(--text-color-secondary)" }}>
                            <MapPin size={14} className="inline mr-1" />
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
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TrackDelivery;

