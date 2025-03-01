import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { useQuery } from "@tanstack/react-query";

import toast from "react-hot-toast";
import { FaTrash, FaEdit, FaUserPlus } from "react-icons/fa";

/**
 * OrdersList - מציג את רשימת ההזמנות עם אפשרויות:
 * - הצגת פרטי הזמנה (Expand/Collapse)
 * - פתיחת מודל הקצאת משימה (CreateTaskForm)
 * - פתיחת מודל לעדכון ההזמנה (UpdateOrderForm)
 * - מחיקת הזמנה
 */
const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState([]);

  // מודל להקצאת משימה
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [orderForTask, setOrderForTask] = useState(null);

  // מודל לעדכון הזמנה
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState(null);

  // Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axiosInstance.get("/CustomerOrder");
        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          console.error("Error fetching orders:", response.data.message);
          toast.error("Error fetching orders");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Error fetching orders");
      }
    };
    fetchOrders();
  }, []);

  // Expand/Collapse order details
  const toggleOrder = (orderId) => {
    setExpandedOrders((prevExpanded) =>
      prevExpanded.includes(orderId)
        ? prevExpanded.filter((id) => id !== orderId)
        : [...prevExpanded, orderId]
    );
  };

  // פתיחת מודל לעדכון הזמנה – מאתחל את הטופס עם פרטי ההזמנה
  const handleUpdateOrder = (orderId) => {
    const foundOrder = orders.find((o) => o._id === orderId);
    if (!foundOrder) return;
    setOrderToUpdate(foundOrder);
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setOrderToUpdate(null);
  };

  // פתיחת מודל הקצאת משימה (כפי שהיה)
  const handleAssignOrder = (orderId) => {
    const foundOrder = orders.find((o) => o._id === orderId);
    if (!foundOrder) return;
    setOrderForTask(foundOrder);
    setShowCreateTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowCreateTaskModal(false);
    setOrderForTask(null);
  };

  // מחיקת הזמנה
  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this order?"
    );
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/CustomerOrder/${orderId}`);
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      toast.success("Order deleted successfully");
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error("Failed to delete order");
    }
  };

  // פונקציה לעדכון ההזמנה ברשימה לאחר שמתקבל המידע המעודכן
  const handleOrderUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
    closeUpdateModal();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">כל פרטי ההזמנות</h2>

      {orders.length === 0 && (
        <p className="text-gray-600 text-center">אין הזמנות להצגה</p>
      )}

      {orders.map((order) => (
        <div
          key={order._id}
          className="border border-gray-300 rounded-lg shadow-sm mb-4 transition-all hover:shadow-md"
        >
          {/* כותרת ההזמנה */}
          <div className="flex justify-between items-center p-4 bg-gray-50 transition-colors hover:bg-gray-100">
            <div
              className="flex-1 cursor-pointer"
              onClick={() => toggleOrder(order._id)}
            >
              <p className="text-lg font-semibold">
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
              <p className="text-gray-600">
                <span className="font-bold">סטטוס:</span> {order.status}
              </p>
              {order.notes && (
                <p className="text-gray-600">
                  <span className="font-bold">הערות:</span> {order.notes}
                </p>
              )}
            </div>

            {/* אייקון לפתיחה/סגירה */}
            <div
              className="text-2xl ml-4 cursor-pointer"
              onClick={() => toggleOrder(order._id)}
            >
              {expandedOrders.includes(order._id) ? "▲" : "▼"}
            </div>

            {/* כפתורי פעולות */}
            <div className="flex items-center space-x-4 ml-4">
              <button
                className="text-blue-600 hover:text-blue-800"
                onClick={() => handleUpdateOrder(order._id)}
              >
                <FaEdit size={18} />
              </button>

              {order.status === "Confirmed" ? (
                <p className="text-green-600 font-medium">ההזמנה כבר הוקצת</p>
              ) : (
                <button
                  className="text-green-600 hover:text-green-800"
                  onClick={() => handleAssignOrder(order._id)}
                >
                  <FaUserPlus size={18} />
                </button>
              )}

              <button
                className="text-red-600 hover:text-red-800"
                onClick={() => handleDeleteOrder(order._id)}
              >
                <FaTrash size={18} />
              </button>
            </div>
          </div>

          {/* פרטי ההזמנה */}
          {expandedOrders.includes(order._id) && (
            <div className="bg-white p-4 border-t border-gray-200">
              <h4 className="text-xl font-semibold mb-4">
                מוצרים וכמויות בהזמנה:
              </h4>
              {order.items && order.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead className="border-b">
                      <tr className="bg-gray-50 text-gray-700">
                        <th className="py-2 px-2 font-semibold">מוצר</th>
                        <th className="py-2 px-2 font-semibold">כמות</th>
                        <th className="py-2 px-2 font-semibold">מחיר ליחידה</th>
                        <th className="py-2 px-2 font-semibold">הנחה לפריט</th>
                        <th className="py-2 px-2 font-semibold">סה"כ לפריט</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">
                            {item.product?.productName || "לא זמין"}
                          </td>
                          <td className="py-2 px-2">{item.quantity}</td>
                          <td className="py-2 px-2">{item.unitPrice}</td>
                          <td className="py-2 px-2">{item.discount || 0}%</td>
                          <td className="py-2 px-2">{item.totalPrice}</td>
                        </tr>
                      ))}
                      {order.globalDiscount && (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-2 px-2 border-b font-semibold text-gray-600 text-right"
                          >
                            <span className="font-bold">
                              הנחה כוללת להזמנה:
                            </span>{" "}
                            {order.globalDiscount}%
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 mt-2">אין פרטי מוצרים להזמנה זו.</p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* מודל הקצאת משימה */}
      {showCreateTaskModal && orderForTask && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={closeTaskModal}
        >
          <div
            className="bg-white p-6 rounded shadow-lg w-full max-w-3xl relative overflow-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeTaskModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-4">יצירת משימה עבור הזמנה</h3>
            <CreateTaskForm order={orderForTask} onClose={closeTaskModal} />
          </div>
        </div>
      )}

      {/* מודל לעדכון הזמנה */}
      {showUpdateModal && orderToUpdate && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={closeUpdateModal}
        >
          <div
            className="bg-white p-6 rounded shadow-lg w-full max-w-3xl relative overflow-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeUpdateModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-4">עדכון הזמנה</h3>
            <UpdateOrderForm
              order={orderToUpdate}
              onClose={closeUpdateModal}
              onUpdate={handleOrderUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersList;

/**
 * CreateTaskForm - טופס ליצירת משימה עבור הזמנה (כפי שהיה)
 */
function CreateTaskForm({ order, onClose }) {
  const [formData, setFormData] = useState({
    departmentId: "",
    projectId: "",
    title: order.customer?.name
      ? `Task for ${order.customer.name}`
      : "New Task",
    description: "",
    status: "pending",
    priority: "medium",
    dueDate: order.deliveryDate ? order.deliveryDate.split("T")[0] : "",
    assignedTo: [],
  });

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axiosInstance.get("/departments");
        const options = res.data.data.map((dept) => ({
          id: dept._id,
          name: dept.name,
        }));
        setDepartmentOptions(options);
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast.error("Error loading departments");
      }
    };
    fetchDepartments();
  }, []);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axiosInstance.get("/employees");
        setEmployees(res.data.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Error loading employees");
      }
    };
    fetchEmployees();
  }, []);

  // Filter employees by department
  useEffect(() => {
    if (formData.departmentId) {
      const filtered = employees.filter(
        (emp) => String(emp.department) === formData.departmentId
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees([]);
    }
  }, [formData.departmentId, employees]);

  // Fetch projects for the selected department
  useEffect(() => {
    if (formData.departmentId) {
      const fetchProjects = async () => {
        try {
          const res = await axiosInstance.get(
            `/departments/projectName/${formData.departmentId}`
          );
          const options = res.data.data.map((project) => ({
            id: project._id,
            name: project.name,
            endDate: project.endDate,
          }));
          setProjectOptions(options);
        } catch (error) {
          console.error("Error fetching projects:", error);
          toast.error("Error loading projects");
        }
      };
      fetchProjects();
    } else {
      setProjectOptions([]);
    }
  }, [formData.departmentId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "departmentId") {
      setFormData((prev) => ({ ...prev, projectId: "" }));
    }
  };

  const handleAssignedChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (opt) => opt.value
    );
    setFormData((prev) => ({ ...prev, assignedTo: selectedOptions }));
  };

  const handleItemChange = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.departmentId) {
      toast.error("Department is required");
      setLoading(false);
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Select at least one item");
      setLoading(false);
      return;
    }

    const orderItemsArray = selectedItems.map((itemId) => {
      const item = order.items.find((i) => i._id === itemId);
      return {
        itemId: item._id.toString(),
        productId: item.product?._id,
        productName: item.product?.productName || "Unknown Product",
        quantity: item.quantity,
      };
    });

    const taskData = {
      ...formData,
      orderId: order._id,
      orderItems: orderItemsArray,
    };

    try {
      await axiosInstance.post("/tasks", taskData);
      toast.success("Task created successfully");
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projectOptions.find(
    (proj) => proj.id === formData.projectId
  );

  return (
    <form onSubmit={handleSubmit} className="text-gray-800">
      {/* Department */}
      <div className="mb-4">
        <label htmlFor="departmentId" className="block font-medium mb-1">
          מחלקה
        </label>
        <select
          id="departmentId"
          name="departmentId"
          value={formData.departmentId}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded"
          required
        >
          <option value="">בחר מחלקה</option>
          {departmentOptions.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Project (optional) */}
      {formData.departmentId && (
        <div className="mb-4">
          <label htmlFor="projectId" className="block font-medium mb-1">
            פרויקט (אופציונלי)
          </label>
          <select
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="">בחר פרויקט</option>
            {projectOptions.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Items from the selected order */}
      <div className="mb-4">
        <label className="block font-medium mb-1">
          פריטים בהזמנה (לבחירה להקצאה)
        </label>
        {order.items
          .filter((item) => !item.isAllocated)
          .map((item) => (
            <div key={item._id} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={`item-${item._id}`}
                checked={selectedItems.includes(item._id)}
                onChange={() => handleItemChange(item._id)}
                className="mr-2"
              />
              <label htmlFor={`item-${item._id}`} className="text-sm">
                {item.product?.productName || "Unknown Product"} - כמות:{" "}
                {item.quantity}
              </label>
            </div>
          ))}
      </div>

      {/* Title */}
      <div className="mb-4">
        <label htmlFor="title" className="block font-medium mb-1">
          כותרת משימה
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded"
          required
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label htmlFor="description" className="block font-medium mb-1">
          תיאור משימה
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full border border-gray-300 p-2 rounded"
        />
      </div>

      {/* Status */}
      <div className="mb-4">
        <label htmlFor="status" className="block font-medium mb-1">
          סטטוס
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded"
        >
          <option value="pending">ממתין</option>
          <option value="in progress">בתהליך</option>
          <option value="completed">הושלם</option>
          <option value="cancelled">בוטל</option>
        </select>
      </div>

      {/* Priority */}
      <div className="mb-4">
        <label htmlFor="priority" className="block font-medium mb-1">
          עדיפות
        </label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded"
        >
          <option value="low">נמוכה</option>
          <option value="medium">בינונית</option>
          <option value="high">גבוהה</option>
        </select>
      </div>

      {/* Due Date */}
      <div className="mb-4">
        <label htmlFor="dueDate" className="block font-medium mb-1">
          תאריך יעד
        </label>
        <input
          type="date"
          id="dueDate"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded"
        />
      </div>

      {/* If projectId is set, show the project's end date */}
      {formData.projectId && selectedProject && (
        <div className="mb-4">
          <label className="block font-medium mb-1">תאריך סיום פרויקט:</label>
          <p className="p-2 border border-gray-300 rounded">
            {selectedProject.endDate
              ? new Date(selectedProject.endDate).toLocaleDateString()
              : "לא זמין"}
          </p>
        </div>
      )}

      {/* Employee selection */}
      {filteredEmployees.length > 0 && (
        <div className="mb-4">
          <label htmlFor="assignedTo" className="block font-medium mb-1">
            להקצות לעובדים (ניתן לבחור יותר מאחד)
          </label>
          <select
            id="assignedTo"
            name="assignedTo"
            multiple
            value={formData.assignedTo}
            onChange={handleAssignedChange}
            className="w-full border border-gray-300 p-2 rounded"
          >
            {filteredEmployees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} {emp.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end mt-6">
        {/* Cancel button */}
        <button
          type="button"
          onClick={onClose}
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          ביטול
        </button>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "יוצר משימה..." : "צור משימה"}
        </button>
      </div>
    </form>
  );
}

/**
 * UpdateOrderForm - טופס לעדכון הזמנה
 */
function UpdateOrderForm({ order, onClose, onUpdate }) {
  const [customers, setCustomers] = useState([]);

  // טעינת לקוחות
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axiosInstance.get("/customers");
        setCustomers(res.data.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Error fetching customers");
      }
    };
    fetchCustomers();
  }, []);

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventoryInfo"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/inventory/productsInfo`);
      return res.data.data;
    },
  });

  // Destructure products and inventory from the combined data
  const products = inventoryData?.products || [];
  const inventory = inventoryData?.inventory || [];

  // לצורך ניפוי באגים
  useEffect(() => {
    console.log("Products:", products);
    console.log("Order Items from order:", order.items);
  }, [products, order.items]);

  // אתחול ערכי הטופס מההזמנה הנבחרת
  const [selectedCustomer, setSelectedCustomer] = useState(
    order.customer?._id || ""
  );
  const [orderItems, setOrderItems] = useState(
    order.items?.map((item) => ({
      product: item.product?._id ? item.product._id : item.product,
      productName: item.product?.productName || "",
      unitPrice: item.product?.unitPrice
        ? parseFloat(Number(item.product.unitPrice).toFixed(2))
        : 0,
      quantity: item.quantity,
      discount: item.discount || 0,
    })) || [
      { product: "", productName: "", unitPrice: 0, quantity: 1, discount: 0 },
    ]
  );
  const [deliveryDate, setDeliveryDate] = useState(
    order.deliveryDate ? order.deliveryDate.split("T")[0] : ""
  );
  const [orderNotes, setOrderNotes] = useState(order.notes || "");
  const [orderDiscount, setOrderDiscount] = useState(order.globalDiscount || 0);
  const [status, setStatus] = useState(order.status || "pending");
  const [loading, setLoading] = useState(false);

  // העשרת orderItems במידע מלא מהמערך products (והמרת מחירי יחידה לעיגול לשתי ספרות)
  useEffect(() => {
    if (products.length > 0) {
      setOrderItems((prevItems) =>
        prevItems.map((item) => {
          const prod = products.find(
            (p) => String(p._id) === String(item.product)
          );
          return prod
            ? {
                ...item,
                productName: prod.productName,
                unitPrice: parseFloat(Number(prod.unitPrice).toFixed(2)),
              }
            : item;
        })
      );
    }
  }, [products]);

  // חישוב סך ההזמנה – עיגול מחירי יחידה, מחיר לכל פריט וסך ההזמנה לשתי ספרות אחרי הנקודה
  const orderTotal = orderItems.reduce((acc, item) => {
    const unitPrice = parseFloat(Number(item.unitPrice).toFixed(2)) || 0;
    const discount =
      orderDiscount > 0 ? orderDiscount : Number(item.discount) || 0;
    const effectivePrice = parseFloat(
      (unitPrice * (1 - discount / 100)).toFixed(2)
    );
    const itemTotal = parseFloat(
      (effectivePrice * Number(item.quantity)).toFixed(2)
    );
    return acc + itemTotal;
  }, 0);
  const orderTotalRounded = parseFloat(orderTotal.toFixed(2));

  // הוספת פריט להזמנה
  const handleAddItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { product: "", productName: "", unitPrice: 0, quantity: 1, discount: 0 },
    ]);
  };

  // עדכון שדה בפריט – כאשר בוחרים מוצר, מעדכנים גם productName ו-unitPrice (עם עיגול)
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    if (field === "product") {
      updatedItems[index][field] = value;
      // חיפוש פרטי המוצר במערך המוצרים (עם המרת מזהה למחרוזת)
      const prod = products.find((p) => String(p._id) === String(value));
      if (prod) {
        updatedItems[index]["productName"] = prod.productName;
        updatedItems[index]["unitPrice"] = parseFloat(
          Number(prod.unitPrice).toFixed(2)
        );
      } else {
        updatedItems[index]["productName"] = "";
        updatedItems[index]["unitPrice"] = 0;
      }
    } else {
      updatedItems[index][field] = value;
    }
    setOrderItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error("Please select a customer.");
      return;
    }
    if (
      orderItems.length === 0 ||
      orderItems.some((item) => !item.product || item.quantity < 1)
    ) {
      toast.error("Please add at least one valid order item.");
      return;
    }
    setLoading(true);
    try {
      const updatedOrderData = {
        customer: selectedCustomer,
        deliveryDate,
        items: orderItems.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
          discount: orderDiscount > 0 ? 0 : Number(item.discount) || 0,
        })),
        globalDiscount: Number(orderDiscount) || 0,
        notes: orderNotes,
        status,
        // ניתן לשלב את הערך המעוגל של סך ההזמנה אם נדרש
        orderTotal: orderTotalRounded,
      };
      const res = await axiosInstance.put(
        `/CustomerOrder/${order._id}`,
        updatedOrderData
      );
      if (res.data.success) {
        toast.success("Order updated successfully");
        onUpdate(res.data.data);
      } else {
        toast.error(res.data.message || "Error updating order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Error updating order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* בחירת לקוח */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Select Customer
        </label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded"
        >
          <option value="">Choose a customer</option>
          {customers.map((cust) => (
            <option key={cust._id} value={cust._id}>
              {cust.name} ({cust.email})
            </option>
          ))}
        </select>
      </div>

      {/* פריטי הזמנה */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Order Items
        </label>
        {orderItems.map((item, index) => {
          // נחשב את המזהה בצורה בטוחה – אם item.product הוא אובייקט, נשתמש ב-_id שלו
          const productId =
            typeof item.product === "object" ? item.product._id : item.product;
          const availableStock = (() => {
            if (!productId) return 0;
            const inv = inventory.find(
              (inv) =>
                inv.productId &&
                inv.productId.toString() === productId.toString()
            );
            return inv ? inv.quantity : 0;
          })();
          const unitPrice = Number(item.unitPrice) || 0;
          const appliedDiscount =
            orderDiscount > 0 ? orderDiscount : Number(item.discount) || 0;
          const discountedUnitPrice = parseFloat(
            (unitPrice * (1 - appliedDiscount / 100)).toFixed(2)
          );
          const itemTotal = parseFloat(
            (discountedUnitPrice * Number(item.quantity)).toFixed(2)
          );
          return (
            <div key={index} className="mb-4 border-b pb-2">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/2">
                  <select
                    value={item.product}
                    onChange={(e) =>
                      handleItemChange(index, "product", e.target.value)
                    }
                    className="w-full border border-gray-300 p-2 rounded"
                  >
                    <option value="">Choose a product</option>
                    {products.map((prod) => (
                      <option key={prod._id} value={prod._id}>
                        {prod.productName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-1/4">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newQuantity = Number(e.target.value);
                      if (newQuantity > availableStock) {
                        toast.error("Quantity exceeds available stock.");
                        return;
                      }
                      handleItemChange(index, "quantity", newQuantity);
                    }}
                    min="1"
                    max={availableStock}
                    className="w-full border border-gray-300 p-2 rounded"
                    placeholder="Quantity"
                  />
                </div>
                <div className="w-full sm:w-1/4">
                  <input
                    type="number"
                    value={item.discount}
                    onChange={(e) =>
                      handleItemChange(index, "discount", e.target.value)
                    }
                    min="0"
                    max="100"
                    disabled={orderDiscount > 0}
                    className="w-full border border-gray-300 p-2 rounded"
                    placeholder="Discount %"
                  />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>Product: {item.productName || "N/A"}</p>
                <p>Available Stock: {availableStock}</p>
                <p>Unit Price: {unitPrice.toFixed(2)}</p>
                <p>Discount Applied: {appliedDiscount}%</p>
                <p>Item Total: {itemTotal.toFixed(2)}</p>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={handleAddItem}
          className="text-blue-600 underline"
        >
          Add another item
        </button>
      </div>

      {/* הנחה כוללת להזמנה */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Global Discount (%)
        </label>
        <input
          type="number"
          value={orderDiscount}
          onChange={(e) => {
            const newDiscount = Number(e.target.value);
            setOrderDiscount(newDiscount);
            if (newDiscount > 0) {
              setOrderItems((prev) =>
                prev.map((item) => ({ ...item, discount: 0 }))
              );
            }
          }}
          min="0"
          max="100"
          className="w-full border border-gray-300 p-2 rounded"
        />
      </div>

      {/* הצגת סך ההזמנה */}
      <div className="text-right font-bold text-xl">
        Total: {orderTotalRounded.toFixed(2)}
      </div>

      {/* תאריך משלוח */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Delivery Date (optional)
        </label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded"
        />
      </div>

      {/* הערות להזמנה */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Notes (optional)
        </label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          rows="4"
          className="w-full border border-gray-300 p-2 rounded"
          placeholder="Enter additional details..."
        ></textarea>
      </div>

      {/* סטטוס הזמנה */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded"
        >
          <option value="pending">ממתין</option>
          <option value="confirmed">מאושר</option>
          <option value="cancelled">בוטל</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          ביטול
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Updating..." : "Update Order"}
        </button>
      </div>
    </form>
  );
}
