import { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const CreateTask = () => {
  const { t } = useTranslation();

  // -----------------------------
  // State for your form and data
  // -----------------------------
  const [formData, setFormData] = useState({
    departmentId: "",
    projectId: "",
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
    assignedTo: [],
  });

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const [departmentDetails, setDepartmentDetails] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);

  // הזמנות
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]); // array of item._id

  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // 1) Fetch departments
  // --------------------------------------------------
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
        toast.error(t("createTask.error_loading_departments"));
      }
    };
    fetchDepartments();
  }, [t]);

  // --------------------------------------------------
  // 2) Fetch projects when departmentId changes
  // --------------------------------------------------
  useEffect(() => {
    if (formData.departmentId) {
      const fetchProjects = async () => {
        try {
          const res = await axiosInstance.get(
            `/departments/projectName/${formData.departmentId}`
          );
          // בהנחה שה־API מחזיר שדה "id" לפרויקט
          const options = res.data.data.map((project) => ({
            id: project.id,
            name: project.name,
            endDate: project.endDate,
          }));
          setProjectOptions(options);
        } catch (error) {
          console.error("Error fetching projects:", error);
          toast.error(t("createTask.error_loading_projects"));
        }
      };
      fetchProjects();
    } else {
      setProjectOptions([]);
    }
  }, [formData.departmentId, t]);

  // --------------------------------------------------
  // 3) Fetch employees
  // --------------------------------------------------
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axiosInstance.get("/employees");
        setEmployees(res.data.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error(t("createTask.error_loading_employees"));
      }
    };
    fetchEmployees();
  }, [t]);

  // --------------------------------------------------
  // 4) Fetch department details
  // --------------------------------------------------
  useEffect(() => {
    if (formData.departmentId) {
      axiosInstance
        .get(`/departments/${formData.departmentId}`)
        .then((res) => {
          setDepartmentDetails(res.data.data);
        })
        .catch((err) => {
          console.error("Error fetching department details:", err);
          setDepartmentDetails(null);
        });
    } else {
      setDepartmentDetails(null);
    }
  }, [formData.departmentId]);

  // --------------------------------------------------
  // 5) Fetch project details
  // --------------------------------------------------
  useEffect(() => {
    if (formData.projectId) {
      axiosInstance
        .get(`/projects/${formData.projectId}`)
        .then((res) => {
          setProjectDetails(res.data.data);
        })
        .catch((err) => {
          console.error("Error fetching project details:", err);
          setProjectDetails(null);
        });
    } else {
      setProjectDetails(null);
    }
  }, [formData.projectId]);

  // --------------------------------------------------
  // 6) Filter employees by dept & project
  // --------------------------------------------------
  useEffect(() => {
    let filtered = [];
    if (departmentDetails && departmentDetails.teamMembers) {
      // teamMembers => [{employeeId: "XXX"}, ...]
      filtered = employees.filter((emp) =>
        departmentDetails.teamMembers.some(
          (member) => String(member.employeeId) === String(emp._id)
        )
      );
    }
    // אם פרויקט נבחר, מצמצמים עוד לפי projectDetails.teamMembers
    if (formData.projectId && projectDetails && projectDetails.teamMembers) {
      filtered = filtered.filter((emp) =>
        projectDetails.teamMembers.some(
          (member) => String(member.employeeId) === String(emp._id)
        )
      );
    }
    setFilteredEmployees(filtered);
  }, [
    formData.departmentId,
    formData.projectId,
    employees,
    departmentDetails,
    projectDetails,
  ]);

  // --------------------------------------------------
  // 7) Fetch orders, filter by unallocated items
  // --------------------------------------------------
  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get("/CustomerOrder");
      if (res.data.success) {
        const allOrders = res.data.data;
        const unallocatedOrders = allOrders.filter((order) =>
          order.items.some((item) => item.isAllocated === false)
        );
        setOrders(unallocatedOrders);
      } else {
        console.error("Error fetching orders:", res.data.message);
        toast.error(t("createTask.error_loading_orders"));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(t("createTask.error_loading_orders"));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [t]);

  // --------------------------------------------------
  // Handlers
  // --------------------------------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // אם שינינו מחלקה, איפסנו פרויקט
    if (name === "departmentId") {
      setFormData((prev) => ({ ...prev, projectId: "" }));
    }
  };

  const handleAssignedChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
    setFormData((prev) => ({ ...prev, assignedTo: selected }));
  };

  // בחירת הזמנה
  const handleOrderChange = (e) => {
    const order = orders.find((o) => o._id === e.target.value);
    setSelectedOrder(order || null);
    setSelectedItems([]);
    setFormData((prev) => ({
      ...prev,
      title: order?.customer?.name
        ? `Task for ${order.customer.name}`
        : "New Task",
      dueDate: order?.deliveryDate || prev.dueDate,
    }));
  };

  // בחירת פריטים מההזמנה
  const handleItemChange = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // --------------------------------------------------
  // 8) Create task (Submit)
  // --------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // בדיקות מינימליות
    if (!formData.departmentId) {
      toast.error(t("createTask.department_required"));
      setLoading(false);
      return;
    }

    // אם נבחרה הזמנה אבל לא נבחר שום פריט
    if (selectedOrder && selectedItems.length === 0) {
      toast.error("אנא בחר לפחות פריט אחד מההזמנה");
      setLoading(false);
      return;
    }

    // בונים מערך של פריטי הזמנה
    const orderItemsArray = selectedOrder
      ? selectedItems.map((itemId) => {
          const item = selectedOrder.items.find((i) => i._id === itemId);
          return {
            itemId: item._id.toString(),
            productId: item.product?._id,
            productName: item.product?.productName || "Unknown Product",
            quantity: item.quantity,
          };
        })
      : [];

    // אובייקט השליחה
    const taskData = {
      // מכיל departmentId, projectId, וכו'
      ...formData,

      // אם נבחרה הזמנה
      ...(selectedOrder && {
        orderId: selectedOrder._id,
        orderItems: orderItemsArray,
      }),

      // **לא** שולחים { project: { projectId: ... } }! רק projectId ישירות
      // ולכן לא צריך פה שום דבר נוסף, כי formData.projectId כבר קיים
    };

    try {
      await axiosInstance.post("/tasks", taskData);
      toast.success(t("createTask.success"));

      // איפוס
      await fetchOrders();
      setSelectedOrder(null);
      setSelectedItems([]);
      setFormData({
        departmentId: "",
        projectId: "",
        title: "",
        description: "",
        status: "pending",
        priority: "medium",
        dueDate: "",
        assignedTo: [],
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(t("createTask.error"));
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projectOptions.find(
    (p) => p.id === formData.projectId
  );

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="container mx-auto max-w-4xl p-8 bg-bg rounded-2xl shadow-2xl border border-border-color transform transition-all duration-500 hover:shadow-3xl">
      <h2 className="text-3xl font-bold mb-6 text-primary">
        {t("createTask.title")}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Department */}
        <div className="mb-4">
          <label htmlFor="departmentId" className="block font-medium mb-1">
            {t("createTask.departmentLabel")}
          </label>
          <select
            id="departmentId"
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
            required
          >
            <option value="">{t("createTask.selectDepartment")}</option>
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
              {t("createTask.projectLabel")}
            </label>
            <select
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
            >
              <option value="">{t("createTask.selectProject")}</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Order selection */}
        <div className="mb-4">
          <label htmlFor="orderId" className="block font-medium mb-1">
            {t("createTask.orderLabel")}
          </label>
          <select
            id="orderId"
            value={selectedOrder?._id || ""}
            onChange={handleOrderChange}
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
          >
            <option value="">{t("createTask.selectOrder")}</option>
            {orders.map((order) => (
              <option key={order._id} value={order._id}>
                {order.customer?.name || "Unknown Customer"} -{" "}
                {new Date(order.orderDate).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        {/* Items from selected order */}
        {selectedOrder && (
          <div className="mb-4">
            <label className="block font-medium mb-1">
              {t("createTask.selectItemsFromOrder")}
            </label>
            {selectedOrder.items
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
                  <label htmlFor={`item-${item._id}`} className="text-text">
                    {item.product?.productName || "Unknown Product"} - Quantity:{" "}
                    {item.quantity}
                  </label>
                </div>
              ))}
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
          <label htmlFor="title" className="block font-medium mb-1">
            {t("createTask.taskTitleLabel")}
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
            required
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block font-medium mb-1">
            {t("createTask.descriptionLabel")}
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
          />
        </div>

        {/* Status */}
        <div className="mb-4">
          <label htmlFor="status" className="block font-medium mb-1">
            {t("createTask.statusLabel")}
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
          >
            <option value="pending">{t("createTask.status.pending")}</option>
            <option value="in progress">
              {t("createTask.status.inProgress")}
            </option>
            <option value="completed">
              {t("createTask.status.completed")}
            </option>
            <option value="cancelled">
              {t("createTask.status.cancelled")}
            </option>
          </select>
        </div>

        {/* Priority */}
        <div className="mb-4">
          <label htmlFor="priority" className="block font-medium mb-1">
            {t("createTask.priorityLabel")}
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
          >
            <option value="low">{t("createTask.priority.low")}</option>
            <option value="medium">{t("createTask.priority.medium")}</option>
            <option value="high">{t("createTask.priority.high")}</option>
          </select>
        </div>

        {/* Due Date */}
        <div className="mb-4">
          <label htmlFor="dueDate" className="block font-medium mb-1">
            {t("createTask.dueDateLabel")}
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full border border-border-color p-2 rounded bg-bg text-text"
          />
        </div>

        {/* Display project end date if a project is selected */}
        {formData.projectId && selectedProject && (
          <div className="mb-4">
            <label className="block font-medium mb-1">
              {t("createTask.projectEndDateLabel")}
            </label>
            <p className="p-2 border border-border-color rounded bg-bg text-text">
              {selectedProject.endDate
                ? new Date(selectedProject.endDate).toLocaleDateString()
                : t("createTask.notAvailable")}
            </p>
          </div>
        )}

        {/* Employee selection */}
        {filteredEmployees.length > 0 && (
          <div className="mb-4">
            <label htmlFor="assignedTo" className="block font-medium mb-1">
              {t("createTask.assignedToLabel")}
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              multiple
              value={formData.assignedTo}
              onChange={handleAssignedChange}
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
            >
              {filteredEmployees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.lastName}
                </option>
              ))}
            </select>
            <small className="text-sm text-gray-600">
              {t("createTask.selectEmployeesOptional")}
            </small>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-button-bg text-button-text px-4 py-2 rounded"
        >
          {loading ? t("createTask.creating") : t("createTask.submitButton")}
        </button>
      </form>
    </div>
  );
};

export default CreateTask;
