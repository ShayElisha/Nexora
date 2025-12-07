import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const OrderTimeline = ({ currentStatus, stages }) => {
  const getStatusIndex = (status) => {
    const statusMap = {
      Pending: 0,
      "Pending Approval": 0,
      Approved: 1,
      Confirmed: 1,
      "In Progress": 2,
      "Not Started": 2,
      "Ready to Ship": 2,
      Shipped: 3,
      Delivered: 4,
    };
    return statusMap[status] ?? 0;
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="w-full py-4">
      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-6 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: "var(--border-color)" }}
        />
        <div
          className="absolute left-6 top-0 w-0.5 transition-all duration-500"
          style={{
            height: `${(currentIndex / (stages.length - 1)) * 100}%`,
            backgroundColor: "var(--color-primary)",
          }}
        />

        {/* Stages */}
        <div className="space-y-6">
          {stages.map((stage, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start gap-4"
              >
                {/* Icon */}
                <div
                  className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: isCompleted
                      ? "var(--color-primary)"
                      : "var(--bg-color)",
                    borderColor: isCompleted
                      ? "var(--color-primary)"
                      : "var(--border-color)",
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2
                      size={24}
                      style={{ color: "var(--button-text)" }}
                    />
                  ) : (
                    <Circle
                      size={24}
                      style={{ color: "var(--text-color-secondary)" }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="font-semibold text-lg"
                      style={{
                        color: isCompleted
                          ? "var(--color-primary)"
                          : "var(--text-color-secondary)",
                      }}
                    >
                      {stage.name}
                    </h3>
                    {isCurrent && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "var(--color-primary)",
                          color: "var(--button-text)",
                        }}
                      >
                        <Clock size={12} />
                        נוכחי
                      </motion.div>
                    )}
                  </div>
                  {stage.date && (
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-color-secondary)" }}
                    >
                      {new Date(stage.date).toLocaleDateString("he-IL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {stage.notes && (
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--text-color-secondary)" }}
                    >
                      {stage.notes}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;

