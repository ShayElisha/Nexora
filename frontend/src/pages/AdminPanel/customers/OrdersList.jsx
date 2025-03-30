import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import {
  FaTrash,
  FaEdit,
  FaUserPlus,
  FaSearch,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

/**
 * פונקציה ליצירת צבע רנדומלי (להצגת עיגול צבעוני ליד שם ההזמנה)
 */
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const OrdersList = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // מודלים וכו'
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [orderForTask, setOrderForTask] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState(null);

  const {
    data: fetchedOrders = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await axiosInstance.get("/CustomerOrder");
      if (response.data.success) return response.data.data;
      throw new Error(response.data.message || t("order.error_fetching_orders"));
    },
  });

  useEffect(() => {
    setOrders(fetchedOrders);
  }, [fetchedOrders]);

  const toggleOrder = (orderId) => {
    setExpandedOrders((prevExpanded) =>
      prevExpanded.includes(orderId)
        ? prevExpanded.filter((id) => id !== orderId)
        : [...prevExpanded, orderId]
    );
  };

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
  const handleOrderUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
    closeUpdateModal();
  };

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

  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm(t("order.confirm_delete_order"));
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/CustomerOrder/${orderId}`);
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      toast.success(t("order.order_deleted_successfully"));
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error(t("order.error_deleting_order"));
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    const combinedText = [
      order.customer?.name || "",
      order.notes || "",
      order.status || "",
      order.items?.map((item) => item.product?.productName || "").join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return combinedText.includes(searchLower);
  });

  return (
    <div className="container mx-auto p-8 bg-gradient-to-br from-bg to-bg min-h-screen animate-fade-in">
      <h1 className="text-4xl font-extrabold text-text mb-8 text-center tracking-tight drop-shadow-md">
        {t("order.all_order_details")}
      </h1>

      {/* תיבת חיפוש */}
      <div className="mb-6 flex justify-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder={t("order.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 pl-12 border border-border-color rounded-full shadow-md focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-white text-text placeholder-gray-400"
          />
          <FaSearch
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary"
            size={20}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-text animate-pulse text-lg">
            {t("order.loading_orders")}
          </p>
        </div>
      ) : isError ? (
        <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-4 mb-8 rounded-lg shadow-lg animate-slide-in max-w-2xl mx-auto">
          <p className="flex items-center">
            <FaExclamationTriangle className="mr-2" />
            {error?.message || t("order.error_loading_orders")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-2xl rounded-xl bg-white transform transition-all duration-500 hover:shadow-3xl">
          <table className="min-w-full text-text">
            <thead className="bg-gradient-to-r from-primary to-secondary text-button-text">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("order.customer")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("order.status")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("order.delivery_date")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("order.order_total")}
                </th>
                <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                  {t("order.notes")}
                </th>
                <th className="py-4 px-6 text-center text-sm font-bold tracking-wider">
                  {t("order.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 px-4 text-center text-text italic animate-fade-in"
                  >
                    {searchTerm
                      ? t("order.no_orders_found")
                      : t("order.no_orders_to_display")}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => {
                  const backgroundColor = getRandomColor();
                  const customerInitial = order.customer?.name
                    ? order.customer.name[0].toUpperCase()
                    : "O";
                  return (
                    <React.Fragment key={order._id}>
                      <tr
                        className={`border-b transition-all duration-300 ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-accent hover:shadow-inner animate-slide-up`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => toggleOrder(order._id)}
                      >
                        <td className="py-4 px-6">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
                            style={{ backgroundColor }}
                          >
                            {customerInitial}
                          </div>
                          <span className="block mt-2 font-medium">
                            {order.customer?.name || t("order.not_available")}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {order.status || t("order.not_specified")}
                        </td>
                        <td className="py-4 px-6">
                          {order.deliveryDate
                            ? new Date(order.deliveryDate).toLocaleDateString("he-IL")
                            : "-"}
                        </td>
                        <td className="py-4 px-6">
                          {order.orderTotal || "-"}
                        </td>
                        <td className="py-4 px-6">
                          {order.notes?.length ? order.notes : "-"}
                        </td>
                        <td className="py-4 px-6 flex gap-3 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateOrder(order._id);
                            }}
                            className="text-primary hover:text-secondary transition-all duration-200 transform hover:scale-125 hover:rotate-6"
                            title={t("order.update_order")}
                          >
                            <FaEdit size={20} />
                          </button>
                          {order.status === "confirmed" ? (
                            <p className="text-green-600 font-medium">
                              {t("order.assigned")}
                            </p>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignOrder(order._id);
                              }}
                              className="text-green-600 hover:text-green-800 transition-all duration-200 transform hover:scale-125 hover:rotate-6"
                              title={t("order.assign_task")}
                            >
                              <FaUserPlus size={20} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(order._id);
                            }}
                            className="text-red-600 hover:text-red-800 transition-all duration-200 transform hover:scale-125 hover:rotate-6"
                            title={t("order.delete_order")}
                          >
                            <FaTrash size={20} />
                          </button>
                        </td>
                      </tr>
                      {expandedOrders.includes(order._id) && (
                        <tr className="bg-gray-50 animate-slide-up">
                          <td colSpan={6} className="py-4 px-6">
                            <div className="flex flex-col gap-2">
                              <div>
                                <strong className="text-text">
                                  {t("order.order_items_details")}
                                </strong>
                                {order.items && order.items.length > 0 ? (
                                  <ul className="list-disc list-inside text-text mt-2">
                                    {order.items.map((item, idx) => (
                                      <li key={idx} className="mb-1">
                                        {item.product?.productName ||
                                          t("order.not_available")}{" "}
                                        - {t("order.quantity")}: {item.quantity}{" "}
                                        {item.discount
                                          ? `(${t("order.discount")}: ${item.discount}%)`
                                          : ""}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-600 mt-2">
                                    {t("order.no_order_items")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
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
            <h3 className="text-2xl font-bold mb-4">
              {t("order.update_order_form_title")}
            </h3>
            <UpdateOrderForm
              order={orderToUpdate}
              onClose={closeUpdateModal}
              onUpdate={handleOrderUpdated}
            />
          </div>
        </div>
      )}

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
            <h3 className="text-2xl font-bold mb-4">
              {t("order.create_task_for_order_title")}
            </h3>
            <CreateTaskForm order={orderForTask} onClose={closeTaskModal} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        .animate-slide-in { animation: slideIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default OrdersList;

/**
 * CreateTaskForm - טופס ליצירת משימה עבור הזמנה
 */
function CreateTaskForm({ order, onClose }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    departmentId: "",
    projectId: "",
    title: order.customer?.name
      ? `${t("order.task_for")} ${order.customer.name}`
      : t("order.new_task"),
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
        toast.error(t("order.error_loading_departments"));
      }
    };
    fetchDepartments();
  }, [t]);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axiosInstance.get("/employees");
        setEmployees(res.data.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error(t("order.error_loading_employees"));
      }
    };
    fetchEmployees();
  }, [t]);

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
          toast.error(t("order.error_loading_projects"));
        }
      };
      fetchProjects();
    } else {
      setProjectOptions([]);
    }
  }, [formData.departmentId, t]);

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
    const selectedOptions = Array.from(e.target.selectedOptions, (opt) => opt.value);
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
      toast.error(t("order.department_required"));
      setLoading(false);
      return;
    }
    if (selectedItems.length === 0) {
      toast.error(t("order.select_at_least_one_item"));
      setLoading(false);
      return;
    }
    const orderItemsArray = selectedItems.map((itemId) => {
      const item = order.items.find((i) => i._id === itemId);
      return {
        itemId: item._id.toString(),
        productId: item.product?._id,
        productName: item.product?.productName || t("order.not_available"),
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
      toast.success(t("order.task_created_successfully"));
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(t("order.failed_to_create_task"));
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projectOptions.find(
    (proj) => proj.id === formData.projectId
  );

  return (
    <form onSubmit={handleSubmit} className="text-gray-800">
      <div className="mb-4">
        <label htmlFor="departmentId" className="block font-medium mb-1">
          {t("order.department")}
        </label>
        <select
          id="departmentId"
          name="departmentId"
          value={formData.departmentId}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded"
          required
        >
          <option value="">{t("order.choose_department")}</option>
          {departmentOptions.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>
      {formData.departmentId && (
        <div className="mb-4">
          <label htmlFor="projectId" className="block font-medium mb-1">
            {t("order.project_optional")}
          </label>
          <select
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="">{t("order.choose_project")}</option>
            {projectOptions.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mb-4">
        <label className="block font-medium mb-1">
          {t("order.order_items_for_assignment")}
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
                {item.product?.productName || t("order.not_available")} - {t("order.quantity")}: {item.quantity}
              </label>
            </div>
          ))}
      </div>
      <div className="mb-4">
        <label htmlFor="title" className="block font-medium mb-1">
          {t("order.task_title")}
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
      <div className="mb-4">
        <label htmlFor="description" className="block font-medium mb-1">
          {t("order.task_description")}
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
      <div className="mb-4">
        <label htmlFor="status" className="block font-medium mb-1">
          {t("order.status")}
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded"
        >
          <option value="pending">{t("order.status_pending")}</option>
          <option value="in progress">{t("order.status_in_progress")}</option>
          <option value="completed">{t("order.status_completed")}</option>
          <option value="cancelled">{t("order.status_cancelled")}</option>
        </select>
      </div>
      <div className="mb-4">
        <label htmlFor="priority" className="block font-medium mb-1">
          {t("order.priority")}
        </label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded"
        >
          <option value="low">{t("order.priority_low")}</option>
          <option value="medium">{t("order.priority_medium")}</option>
          <option value="high">{t("order.priority_high")}</option>
        </select>
      </div>
      <div className="mb-4">
        <label htmlFor="dueDate" className="block font-medium mb-1">
          {t("order.due_date")}
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
      {formData.projectId && selectedProject && (
        <div className="mb-4">
          <label className="block font-medium mb-1">
            {t("order.project_end_date")}
          </label>
          <p className="p-2 border border-gray-300 rounded">
            {selectedProject.endDate
              ? new Date(selectedProject.endDate).toLocaleDateString()
              : t("order.not_available")}
          </p>
        </div>
      )}
      {filteredEmployees.length > 0 && (
        <div className="mb-4">
          <label htmlFor="assignedTo" className="block font-medium mb-1">
            {t("order.assign_to_employees")}
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
        <button
          type="button"
          onClick={onClose}
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          {t("order.cancel")}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? t("order.creating_task") : t("order.create_task")}
        </button>
      </div>
    </form>
  );
}

/**
 * UpdateOrderForm - טופס לעדכון הזמנה
 */
function UpdateOrderForm({ order, onClose, onUpdate }) {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axiosInstance.get("/customers");
        setCustomers(res.data.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error(t("order.error_fetching_customers"));
      }
    };
    fetchCustomers();
  }, [t]);

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventoryInfo"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/inventory/productsInfo`);
      return res.data.data;
    },
  });

  const products = inventoryData?.products || [];
  const inventory = inventoryData?.inventory || [];

  useEffect(() => {
    console.log("Products:", products);
    console.log("Order Items from order:", order.items);
  }, [products, order.items]);

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
    })) || [{ product: "", productName: "", unitPrice: 0, quantity: 1, discount: 0 }]
  );
  const [deliveryDate, setDeliveryDate] = useState(
    order.deliveryDate ? order.deliveryDate.split("T")[0] : ""
  );
  const [orderNotes, setOrderNotes] = useState(order.notes || "");
  const [orderDiscount, setOrderDiscount] = useState(order.globalDiscount || 0);
  const [status, setStatus] = useState(order.status || "pending");
  const [loading, setLoading] = useState(false);

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

  const handleAddItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { product: "", productName: "", unitPrice: 0, quantity: 1, discount: 0 },
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    if (field === "product") {
      updatedItems[index][field] = value;
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
      toast.error(t("order.customer_required"));
      return;
    }
    if (
      orderItems.length === 0 ||
      orderItems.some((item) => !item.product || item.quantity < 1)
    ) {
      toast.error(t("order.item_required"));
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
        orderTotal: orderTotalRounded,
      };
      const res = await axiosInstance.put(
        `/CustomerOrder/${order._id}`,
        updatedOrderData
      );
      if (res.data.success) {
        toast.success(t("order.order_updated_successfully"));
        onUpdate(res.data.data);
      } else {
        toast.error(res.data.message || t("order.error_updating_order"));
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(t("order.error_updating_order"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          {t("order.select_customer")}
        </label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded"
        >
          <option value="">{t("order.choose_customer")}</option>
          {customers.map((cust) => (
            <option key={cust._id} value={cust._id}>
              {cust.name} ({cust.email})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          {t("order.order_items")}
        </label>
        {orderItems.map((item, index) => {
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
                    <option value="">{t("order.choose_product")}</option>
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
                        toast.error(t("order.exceeds_stock"));
                        return;
                      }
                      handleItemChange(index, "quantity", newQuantity);
                    }}
                    min="1"
                    max={availableStock}
                    className="w-full border border-gray-300 p-2 rounded"
                    placeholder={t("order.quantity")}
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
                    className="w-full border border-gray-300 p-2 rounded disabled:opacity-50"
                    placeholder={t("order.discount")}
                  />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>
                  {t("order.product")}: {item.productName || t("order.not_available")}
                </p>
                <p>
                  {t("order.available_stock")}: {availableStock}
                </p>
                <p>
                  {t("order.unit_price")}: {unitPrice.toFixed(2)}
                </p>
                <p>
                  {t("order.discount_applied")}: {appliedDiscount}%
                </p>
                <p>
                  {t("order.item_total")}: {itemTotal.toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={handleAddItem}
          className="text-blue-600 underline"
        >
          {t("order.add_item")}
        </button>
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          {t("order.global_discount")}
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
          placeholder={t("order.global_discount")}
        />
      </div>
      <div className="text-right font-bold text-xl">
        {t("order.total")}: {orderTotalRounded.toFixed(2)}
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          {t("order.delivery_date_optional")}
        </label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          {t("order.notes_optional")}
        </label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          rows="4"
          className="w-full border border-gray-300 p-2 rounded"
          placeholder={t("order.notes_placeholder")}
        ></textarea>
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          {t("order.status")}
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded"
        >
          <option value="pending">{t("order.status_pending")}</option>
          <option value="confirmed">{t("order.status_confirmed")}</option>
          <option value="cancelled">{t("order.status_cancelled")}</option>
        </select>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          {t("order.cancel")}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? t("order.updating") : t("order.update_order")}
        </button>
      </div>
    </form>
  );
}

