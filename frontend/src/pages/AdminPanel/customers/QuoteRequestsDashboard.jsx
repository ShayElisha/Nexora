import React, { useState, useEffect } from "react";
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
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">כל פרטי ההזמנות</h2>
      {orders.length === 0 && <p className="text-gray-600">אין הזמנות להצגה</p>}
      {orders.map((order) => (
        <div
          key={order._id}
          className="border border-gray-300 rounded-lg shadow-sm mb-4 transition-all hover:shadow-md"
        >
          {/* לחיצה על התיבה כולה תפעיל את הפונקציה */}
          <div
            className="flex justify-between items-center p-4 cursor-pointer bg-gray-50"
            onClick={() => toggleOrder(order._id)}
          >
            <div>
              <p className="text-lg font-medium">
                <span className="font-bold">לקוח:</span>{" "}
                {order.customer?.name || "לא זמין"}
              </p>
              <p className="text-gray-600">
                <span className="font-bold">תאריך משלוח:</span>{" "}
                {order.deliveryDate
                  ? new Date(order.deliveryDate).toLocaleDateString("he-IL")
                  : "לא צוין"}
              </p>
              <p className="text-gray-600">
                <span className="font-bold">סה"כ הזמנה:</span>{" "}
                {order.orderTotal}
              </p>
              {order.notes && (
                <p className="text-gray-600">
                  <span className="font-bold">הערות:</span> {order.notes}
                </p>
              )}
            </div>
            <div className="text-2xl">
              {expandedOrders.includes(order._id) ? "▲" : "▼"}
            </div>
          </div>
          {expandedOrders.includes(order._id) && (
            <div className="bg-white p-4 border-t border-gray-200">
              <h4 className="text-xl font-semibold mb-2">מוצרים והכמויות:</h4>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div
                    key={index}
                    className="mb-3 pb-3 border-b border-gray-200"
                  >
                    <p className="text-lg">
                      <span className="font-bold">מוצר:</span>{" "}
                      {item.product?.productName || "לא זמין"}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-bold">כמות:</span> {item.quantity}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-bold">מחיר ליחידה:</span>{" "}
                      {item.unitPrice}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-bold">הנחה:</span> {item.discount}%
                    </p>
                    <p className="text-gray-600">
                      <span className="font-bold">סה"כ:</span> {item.totalPrice}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">אין פרטי מוצרים להזמנה זו.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuoteRequestsDashboard;
