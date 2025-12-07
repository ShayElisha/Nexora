import { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ListChecks,
  Building2,
  FolderKanban,
  ShoppingCart,
  FileText,
  AlignLeft,
  Flag,
  Calendar,
  Users,
  CheckCircle,
  Loader2,
  Package,
  AlertCircle,
} from "lucide-react";

const CreateTask = () => {
  const { t } = useTranslation();

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
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
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
        toast.error(t("createTask.error_loading_departments"));
      }
    };
    fetchDepartments();
  }, [t]);

  // Fetch projects when department changes
  useEffect(() => {
    if (formData.departmentId) {
      const fetchProjects = async () => {
        try {
          const res = await axiosInstance.get(
            `/departments/projectName/${formData.departmentId}`
          );
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

  // Fetch employees
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

  // Fetch department details
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

  // Fetch project details
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

  // Filter employees by department only - show only employees from the selected department
  useEffect(() => {
    let filtered = [];
    
    // Only show employees if a department is selected
    if (formData.departmentId && departmentDetails && departmentDetails.teamMembers) {
      // Filter employees that belong to the selected department
      filtered = employees.filter((emp) =>
        departmentDetails.teamMembers.some(
          (member) => String(member.employeeId) === String(emp._id)
        )
      );
      
      // If project is also selected, further filter by project team members
      if (formData.projectId && projectDetails && projectDetails.teamMembers) {
        filtered = filtered.filter((emp) =>
          projectDetails.teamMembers.some(
            (member) => String(member.employeeId) === String(emp._id)
          )
        );
      }
    }
    
    setFilteredEmployees(filtered);
  }, [
    formData.departmentId,
    formData.projectId,
    employees,
    departmentDetails,
    projectDetails,
  ]);

  // Remove assigned employees that don't belong to the current filtered list
  useEffect(() => {
    if (filteredEmployees.length > 0 && formData.assignedTo.length > 0) {
      const validAssignedIds = filteredEmployees.map(emp => emp._id.toString());
      const invalidAssigned = formData.assignedTo.filter(empId => !validAssignedIds.includes(empId.toString()));
      
      if (invalidAssigned.length > 0) {
        setFormData((prev) => ({
          ...prev,
          assignedTo: prev.assignedTo.filter(empId => validAssignedIds.includes(empId.toString()))
        }));
      }
    } else if (formData.departmentId && filteredEmployees.length === 0) {
      // If department is selected but no employees found, clear assigned employees
      if (formData.assignedTo.length > 0) {
        setFormData((prev) => ({
          ...prev,
          assignedTo: []
        }));
      }
    }
  }, [filteredEmployees, formData.departmentId]);

  // Fetch orders
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

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      // If department changed, clear project and assigned employees
      if (name === "departmentId") {
        newData.projectId = "";
        newData.assignedTo = [];
      }
      return newData;
    });
  };

  const handleAssignedChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
    setFormData((prev) => ({ ...prev, assignedTo: selected }));
  };

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
      toast.error(t("createTask.department_required"));
      setLoading(false);
      return;
    }

    if (selectedOrder && selectedItems.length === 0) {
      toast.error(t("createTask.select_items_required"));
      setLoading(false);
      return;
    }

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

    const taskData = {
      ...formData,
      ...(selectedOrder && {
        orderId: selectedOrder._id,
        orderItems: orderItemsArray,
      }),
    };

    try {
      await axiosInstance.post("/tasks", taskData);
      toast.success(t("createTask.success"));
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

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <ListChecks size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("createTask.title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("createTask.create_task_description")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="rounded-2xl shadow-lg border p-6 lg:p-8"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <Building2 className="inline mr-2" size={16} />
                {t("createTask.departmentLabel")} *
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
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
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <FolderKanban className="inline mr-2" size={16} />
                  {t("createTask.projectLabel")}
                </label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                  }}
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
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <ShoppingCart className="inline mr-2" size={16} />
                {t("createTask.orderLabel")}
              </label>
              <select
                value={selectedOrder?._id || ""}
                onChange={handleOrderChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
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
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}>
                <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-color)' }}>
                  <Package className="inline mr-2" size={16} />
                  {t("createTask.selectItemsFromOrder")}
                </label>
                <div className="space-y-2">
                  {selectedOrder.items
                    .filter((item) => !item.isAllocated)
                    .map((item) => (
                      <label
                        key={item._id}
                        className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-opacity-80 transition-all"
                        style={{ backgroundColor: 'var(--bg-color)' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={() => handleItemChange(item._id)}
                          className="w-5 h-5 mr-3 rounded"
                        />
                        <span style={{ color: 'var(--text-color)' }}>
                          {item.product?.productName || "Unknown Product"} - 
                          <span className="font-bold ml-2">
                            {t("createTask.quantity")}: {item.quantity}
                          </span>
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <FileText className="inline mr-2" size={16} />
                {t("createTask.taskTitleLabel")} *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
                placeholder={t("createTask.enter_task_title")}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <AlignLeft className="inline mr-2" size={16} />
                {t("createTask.descriptionLabel")}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
                placeholder={t("createTask.enter_description")}
              />
            </div>

            {/* Status and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <CheckCircle className="inline mr-2" size={16} />
                  {t("createTask.statusLabel")}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                  }}
                >
                  <option value="pending">{t("createTask.status.pending")}</option>
                  <option value="in progress">{t("createTask.status.inProgress")}</option>
                  <option value="completed">{t("createTask.status.completed")}</option>
                  <option value="cancelled">{t("createTask.status.cancelled")}</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Flag className="inline mr-2" size={16} />
                  {t("createTask.priorityLabel")}
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                  }}
                >
                  <option value="low">{t("createTask.priority.low")}</option>
                  <option value="medium">{t("createTask.priority.medium")}</option>
                  <option value="high">{t("createTask.priority.high")}</option>
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <Calendar className="inline mr-2" size={16} />
                {t("createTask.dueDateLabel")}
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
              />
            </div>

            {/* Project end date display */}
            {formData.projectId && selectedProject && (
              <div className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50">
                <div className="flex items-center gap-2">
                  <AlertCircle size={20} className="text-blue-600" />
                  <span className="font-bold text-blue-900">
                    {t("createTask.projectEndDateLabel")}:
                  </span>
                  <span className="text-blue-700">
                    {selectedProject.endDate
                      ? new Date(selectedProject.endDate).toLocaleDateString()
                      : t("createTask.notAvailable")}
                  </span>
                </div>
              </div>
            )}

            {/* Employee selection - only show if department is selected */}
            {formData.departmentId ? (
              filteredEmployees.length > 0 ? (
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    <Users className="inline mr-2" size={16} />
                    {t("createTask.assignedToLabel")}
                  </label>
                  <select
                    name="assignedTo"
                    multiple
                    value={formData.assignedTo}
                    onChange={handleAssignedChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 h-32"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
                  >
                    {filteredEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} {emp.lastName} - {emp.role || "Employee"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-secondary)' }}>
                    {t("createTask.selectEmployeesOptional")} ({filteredEmployees.length} {t("createTask.employeesInDepartment", { defaultValue: "employees in department" })})
                  </p>
                  
                  {/* Selected Employees Display */}
                  {formData.assignedTo.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.assignedTo.map((empId) => {
                        const employee = filteredEmployees.find((e) => e._id === empId);
                        if (!employee) return null;
                        return (
                          <span
                            key={empId}
                            className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"
                          >
                            {employee.name} {employee.lastName}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("createTask.noEmployeesInDepartment", { defaultValue: "No employees found in the selected department" })}
                  </p>
                </div>
              )
            ) : (
              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                  {t("createTask.selectDepartmentFirst", { defaultValue: "Please select a department first to assign employees" })}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  {t("createTask.creating")}
                </>
              ) : (
                <>
                  <CheckCircle size={24} />
                  {t("createTask.submitButton")}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateTask;
