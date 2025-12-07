import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Copy,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  QrCode,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

const DeliveryStatusCard = ({ tracking, onUpdateStatus }) => {
  const [copied, setCopied] = useState(false);

  const statusColors = {
    Preparing: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
    "Picked Up": { bg: "bg-blue-100", text: "text-blue-800", icon: Package },
    "In Transit": { bg: "bg-indigo-100", text: "text-indigo-800", icon: Package },
    "Out for Delivery": {
      bg: "bg-purple-100",
      text: "text-purple-800",
      icon: Package,
    },
    Delivered: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle2 },
    Exception: { bg: "bg-red-100", text: "text-red-800", icon: Clock },
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

  const currentStatus = statusColors[tracking?.shippingStatus] || statusColors.Preparing;
  const StatusIcon = currentStatus.icon;

  const copyTrackingNumber = () => {
    if (tracking?.trackingNumber) {
      navigator.clipboard.writeText(tracking.trackingNumber);
      setCopied(true);
      toast.success("מספר המעקב הועתק");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!tracking) {
    return (
      <div className="p-6 rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}>
        <p style={{ color: "var(--text-color-secondary)" }}>אין מעקב משלוח זמין</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border space-y-4"
      style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${currentStatus.bg}`}>
            <StatusIcon size={24} className={currentStatus.text} />
          </div>
          <div>
            <h3 className="font-semibold text-lg" style={{ color: "var(--text-color)" }}>
              {statusLabels[tracking.shippingStatus] || tracking.shippingStatus}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
              {tracking.shippingCompany}
            </p>
          </div>
        </div>
      </div>

      {/* Tracking Number */}
      <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: "var(--border-color)" }}>
        <div className="flex-1">
          <p className="text-xs mb-1" style={{ color: "var(--text-color-secondary)" }}>
            מספר מעקב
          </p>
          <p className="font-mono font-semibold" style={{ color: "var(--text-color)" }}>
            {tracking.trackingNumber}
          </p>
        </div>
        <button
          onClick={copyTrackingNumber}
          className="p-2 rounded-lg hover:opacity-80 transition-all"
          style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
        >
          <Copy size={18} />
        </button>
      </div>

      {/* QR Code */}
      {tracking.qrCode && (
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg" style={{ backgroundColor: "var(--border-color)" }}>
          <QrCode size={32} style={{ color: "var(--color-primary)" }} />
          <img src={tracking.qrCode} alt="QR Code" className="w-32 h-32" />
          <a
            href={`/track/${tracking.trackingNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm hover:opacity-80 transition-all"
            style={{ color: "var(--color-primary)" }}
          >
            צפה במעקב <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* Details */}
      <div className="space-y-3 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
        {tracking.currentLocation && (
          <div className="flex items-start gap-3">
            <MapPin size={18} style={{ color: "var(--color-primary)", marginTop: 2 }} />
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-color-secondary)" }}>
                מיקום נוכחי
              </p>
              <p style={{ color: "var(--text-color)" }}>{tracking.currentLocation}</p>
            </div>
          </div>
        )}

        {tracking.estimatedDeliveryDate && (
          <div className="flex items-start gap-3">
            <Calendar size={18} style={{ color: "var(--color-primary)", marginTop: 2 }} />
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-color-secondary)" }}>
                תאריך משלוח משוער
              </p>
              <p style={{ color: "var(--text-color)" }}>
                {new Date(tracking.estimatedDeliveryDate).toLocaleDateString("he-IL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}

        {tracking.actualDeliveryDate && (
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} style={{ color: "var(--color-primary)", marginTop: 2 }} />
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-color-secondary)" }}>
                תאריך משלוח בפועל
              </p>
              <p style={{ color: "var(--text-color)" }}>
                {new Date(tracking.actualDeliveryDate).toLocaleDateString("he-IL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Update Status Button */}
      {onUpdateStatus && tracking.shippingStatus !== "Delivered" && (
        <button
          onClick={() => onUpdateStatus(tracking)}
          className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:opacity-80"
          style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
        >
          עדכן סטטוס משלוח
        </button>
      )}
    </motion.div>
  );
};

export default DeliveryStatusCard;

