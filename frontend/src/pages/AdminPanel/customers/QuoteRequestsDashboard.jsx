import React, { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";
import axiosInstance from "../../../lib/axios.js";

const QuoteRequestsDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState([]);

  // טעינת ההזמנות מהשרת
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axiosInstance.get("/CustomerOrder");
        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          console.error("Error fetching orders:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  // פונקציה לפתיחת/סגירת פרטי ההזמנה
  const toggleOrder = (orderId) => {
    setExpandedOrders((prevExpanded) =>
      prevExpanded.includes(orderId)
        ? prevExpanded.filter((id) => id !== orderId)
        : [...prevExpanded, orderId]
    );
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            }}
          >
            <ClipboardList size={28} className="text-white" />
          </div>
          <h1
            className="text-4xl font-bold"
            style={{ color: "var(--text-color)" }}
          >
            כל פרטי ההזמנות
          </h1>
        </div>
        {orders.length === 0 && (
          <p
            className="text-center py-16"
            style={{ color: "var(--color-secondary)" }}
          >
            אין הזמנות להצגה
          </p>
        )}
        {orders.map((order) => (
          <div
            key={order._id}
            className="rounded-2xl shadow-lg border mb-4 overflow-hidden transition-all hover:shadow-md"
            style={{
              backgroundColor: "var(--surface-color)",
              borderColor: "var(--border-color)",
            }}
          >
            {/* לחיצה על התיבה כולה תפעיל את הפונקציה */}
            <div
              className="flex justify-between items-center p-4 cursor-pointer"
              style={{ backgroundColor: "var(--bg-secondary)" }}
              onClick={() => toggleOrder(order._id)}
            >
              <div>
                <p
                  className="text-lg font-medium"
                  style={{ color: "var(--text-color)" }}
                >
                  <span className="font-bold">לקוח:</span>{" "}
                  {order.customer?.name || "לא זמין"}
                </p>
                <p style={{ color: "var(--color-secondary)" }}>
                  <span className="font-bold">תאריך משלוח:</span>{" "}
                  {order.deliveryDate
                    ? new Date(order.deliveryDate).toLocaleDateString("he-IL")
                    : "לא צוין"}
                </p>
                <p style={{ color: "var(--color-secondary)" }}>
                  <span className="font-bold">סה"כ הזמנה:</span>{" "}
                  {order.orderTotal}
                </p>
                {order.notes && (
                  <p style={{ color: "var(--color-secondary)" }}>
                    <span className="font-bold">הערות:</span> {order.notes}
                  </p>
                )}
              </div>
              <div className="text-2xl" style={{ color: "var(--text-color)" }}>
                {expandedOrders.includes(order._id) ? "▲" : "▼"}
              </div>
            </div>
            {expandedOrders.includes(order._id) && (
              <div
                className="p-4 border-t"
                style={{
                  backgroundColor: "var(--surface-color)",
                  borderColor: "var(--border-color)",
                }}
              >
                <h4
                  className="text-xl font-semibold mb-2"
                  style={{ color: "var(--text-color)" }}
                >
                  מוצרים והכמויות:
                </h4>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div
                      key={index}
                      className="mb-3 pb-3 border-b"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <p
                        className="text-lg"
                        style={{ color: "var(--text-color)" }}
                      >
                        <span className="font-bold">מוצר:</span>{" "}
                        {item.product?.productName || "לא זמין"}
                      </p>
                      <p style={{ color: "var(--color-secondary)" }}>
                        <span className="font-bold">כמות:</span> {item.quantity}
                      </p>
                      <p style={{ color: "var(--color-secondary)" }}>
                        <span className="font-bold">מחיר ליחידה:</span>{" "}
                        {item.unitPrice}
                      </p>
                      <p style={{ color: "var(--color-secondary)" }}>
                        <span className="font-bold">הנחה:</span> {item.discount}
                        %
                      </p>
                      <p style={{ color: "var(--color-secondary)" }}>
                        <span className="font-bold">סה"כ:</span>{" "}
                        {item.totalPrice}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "var(--color-secondary)" }}>
                    אין פרטי מוצרים להזמנה זו.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuoteRequestsDashboard;
