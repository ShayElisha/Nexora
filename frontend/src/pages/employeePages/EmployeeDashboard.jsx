import { useState, useEffect } from "react";
import axiosInstance from "../../lib/axios";
import { useQuery } from "@tanstack/react-query";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle2,
  Clock,
  Target,
  Award,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Loader2,
  Building2,
  IdCard,
  Camera,
  TrendingUp,
} from "lucide-react";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const EmployeeDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });
  const authUser = authData?.user;
  const employeeId = authUser?.employeeId || authUser?._id;

  const toStringId = (id) => {
    if (!id) return "";
    return typeof id === "object" && id.toString ? id.toString() : String(id);
  };

  const filterActiveTasksForRole = (tasksArray) => {
    if (employee) {
      if (employee.role === "Employee") {
        return tasksArray.filter((task) => task.status === "in progress");
      } else {
        return tasksArray.filter(
          (task) => task.status === "pending" || task.status === "in progress"
        );
      }
    }
    return tasksArray;
  };

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  const [employee, setEmployee] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState(null);

  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const activeTasks = employee ? filterActiveTasksForRole(tasks) : [];
  const archivedTasks = tasks.filter(
    (task) => task.status === "completed" || task.status === "cancelled"
  );
  const tasksNoProjectAssignedToUser = employee
    ? tasks.filter((task) => {
        return (
          (!task.projectId || task.projectId === "") &&
          task.assignedTo &&
          task.assignedTo.some(
            (assignee) =>
              toStringId(assignee._id ? assignee._id : assignee) ===
              toStringId(employee._id)
          )
        );
      })
    : [];
  const projectTasksForUser = employee
    ? tasks.filter((task) => {
        const userProjectIds =
          employee.projects?.map((p) => toStringId(p.projectId)) || [];
        return (
          task.projectId && userProjectIds.includes(toStringId(task.projectId))
        );
      })
    : [];

  const myTasks = tasks.filter(
    (task) =>
      employee &&
      task.assignedTo &&
      task.assignedTo.some(
        (assignee) =>
          toStringId(assignee._id ? assignee._id : assignee) ===
          toStringId(employee._id)
      )
  );

  const statusCount = myTasks.reduce((acc, task) => {
    const status = task.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const taskStatusDistribution = {
    labels: Object.keys(statusCount).map(s => {
      const labels = {
        'pending': t("employeeDashboard.statusLabels.pending"),
        'in progress': t("employeeDashboard.statusLabels.inProgress"),
        'completed': t("employeeDashboard.statusLabels.completed"),
        'cancelled': t("employeeDashboard.statusLabels.cancelled"),
      };
      return labels[s] || s;
    }),
    datasets: [
      {
        data: Object.values(statusCount),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(251, 146, 60, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: "#fff",
        borderWidth: 3,
      },
    ],
  };

  const priorityData = {
    labels: [t("employeeDashboard.low"), t("employeeDashboard.medium"), t("employeeDashboard.high")],
    datasets: [
      {
        label: t("employeeDashboard.tasks"),
        data: [
          myTasks.filter((t) => t.priority === "low").length,
          myTasks.filter((t) => t.priority === "medium").length,
          myTasks.filter((t) => t.priority === "high").length,
        ],
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderRadius: 8,
      },
    ],
  };

  const handleToggleTask = (taskId) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axiosInstance.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId || task.id === taskId
            ? { ...task, status: newStatus }
            : task
        )
      );
      toast.success(t("employeeDashboard.statusUpdated"));
    } catch (error) {
      console.error("Error updating status", error);
      toast.error(t("employeeDashboard.statusUpdateError"));
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditedEmployee({
      name: employee.name,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      address: employee.address || {
        city: "",
        street: "",
        country: "",
        postalCode: "",
      },
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      profileImagePreview: employee.profileImage || "",
    });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditedEmployee((prev) => ({ ...prev, profileImageFile: file }));
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditedEmployee((prev) => ({
          ...prev,
          profileImagePreview: event.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (
      editedEmployee.currentPassword ||
      editedEmployee.newPassword ||
      editedEmployee.confirmNewPassword
    ) {
      if (
        !editedEmployee.currentPassword ||
        !editedEmployee.newPassword ||
        !editedEmployee.confirmNewPassword
      ) {
        toast.error(t("employeeDashboard.fillAllPasswordFields"));
        return;
      }
      if (editedEmployee.newPassword !== editedEmployee.confirmNewPassword) {
        toast.error(t("employeeDashboard.passwordMismatch"));
        return;
      }
    }

    const formData = new FormData();
    formData.append("name", editedEmployee.name);
    formData.append("lastName", editedEmployee.lastName);
    formData.append("email", editedEmployee.email);
    formData.append("phone", editedEmployee.phone);

    if (editedEmployee.address) {
      formData.append("address.street", editedEmployee.address.street || "");
      formData.append("address.city", editedEmployee.address.city || "");
      formData.append("address.country", editedEmployee.address.country || "");
      formData.append(
        "address.postalCode",
        editedEmployee.address.postalCode || ""
      );
    }

    if (editedEmployee.newPassword) {
      formData.append("password", editedEmployee.newPassword);
    }

    if (editedEmployee.profileImageFile) {
      formData.append("profileImage", editedEmployee.profileImageFile);
    }

    try {
      const response = await axiosInstance.put(
        `/employees/${employee._id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("Response from server:", response.data);
      setEmployee(response.data.data);
      setIsEditingProfile(false);
      toast.success(t("employeeDashboard.profileUpdated"));
    } catch (error) {
      console.error(
        "Error updating employee profile:",
        error.response?.data || error
      );
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(t("employeeDashboard.profileUpdateError") + ": " + errorMsg);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setEditedEmployee((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setEditedEmployee((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axiosInstance.get("/tasks");
        setTasks(response.data.data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setTasksError(t("employeeDashboard.tasksLoadError"));
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, [t]);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await axiosInstance.get("/employees/me");
        console.log("Employee data:", response.data.data);
        setEmployee(response.data.data);
      } catch (err) {
        console.error("Error fetching employee data:", err);
        setEmployeeError(t("employeeDashboard.profileLoadError"));
      } finally {
        setEmployeeLoading(false);
      }
    };
    fetchEmployee();
  }, [t]);

  const statsCards = [
    {
      title: t("employeeDashboard.myTasks"),
      value: myTasks.length,
      icon: Target,
      gradient: "from-blue-500 to-cyan-500",
      lightBg: "from-blue-50 to-cyan-50",
    },
    {
      title: t("employeeDashboard.activeTasks"),
      value: activeTasks.length,
      icon: Clock,
      gradient: "from-orange-500 to-amber-500",
      lightBg: "from-orange-50 to-amber-50",
    },
    {
      title: t("employeeDashboard.completedTasks"),
      value: myTasks.filter((t) => t.status === "completed").length,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-500",
      lightBg: "from-emerald-50 to-teal-50",
    },
    {
      title: t("employeeDashboard.projects"),
      value: employee?.projects?.length || 0,
      icon: Award,
      gradient: "from-violet-500 to-purple-500",
      lightBg: "from-violet-50 to-purple-50",
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-blue-50 text-blue-700 border-blue-200",
      "in progress": "bg-orange-50 text-orange-700 border-orange-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-emerald-50 text-emerald-700 border-emerald-200",
      medium: "bg-amber-50 text-amber-700 border-amber-200",
      high: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[priority] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Refined */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>
            {t("employeeDashboard.title")}
          </h1>
          {employee && (
            <p className="text-base" style={{ color: 'var(--color-secondary)' }}>
              {t("employeeDashboard.welcome")}, {employee.name} {employee.lastName}
            </p>
          )}
        </div>

        {/* Stats Cards - Refined */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, index) => (
            <div
              key={index}
              className={`rounded-xl shadow-sm p-5 bg-gradient-to-br ${card.lightBg} border border-gray-200/50 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium mb-1 opacity-70" style={{ color: 'var(--text-color)' }}>
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient} shadow-sm`}>
                  <card.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1">
            {employeeLoading ? (
              <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : employeeError ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                <p className="text-rose-600 text-sm">{employeeError}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
                    {t("employeeDashboard.myProfile")}
                  </h2>
                  {!isEditingProfile && (
                    <button
                      onClick={handleEditProfile}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-all"
                      title={t("employeeDashboard.editProfile")}
                    >
                      <Edit className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    </button>
                  )}
                </div>

                {!isEditingProfile ? (
                  <div className="space-y-4">
                    {/* Profile Image */}
                    <div className="flex justify-center mb-6">
                      {employee.profileImage ? (
                        <img
                          src={employee.profileImage}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                        />
                      ) : (
                        <div
                          className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-100 shadow-sm"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                          {employee.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>

                    {/* Info Items - Refined */}
                    <div className="space-y-3">
                      {[
                        { icon: User, label: t("employeeDashboard.name"), value: `${employee.name} ${employee.lastName}` },
                        { icon: Mail, label: t("employeeDashboard.email"), value: employee.email },
                        { icon: Phone, label: t("employeeDashboard.phone"), value: employee.phone },
                        { icon: Briefcase, label: t("employeeDashboard.role"), value: employee.role },
                        { icon: IdCard, label: t("employeeDashboard.employeeId"), value: employee.employeeId || t("employeeDashboard.notSpecified") },
                        { icon: Building2, label: t("employeeDashboard.department"), value: employee.department?.name || employee.department || t("employeeDashboard.notSpecified") },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50">
                          <item.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-secondary)' }}>
                              {item.label}
                            </p>
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-color)' }}>
                              {item.value}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Address */}
                      {employee.address && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                          <div className="flex-1">
                            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-secondary)' }}>
                              {t("employeeDashboard.address")}
                            </p>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-color)' }}>
                              {`${employee.address.street}, ${employee.address.city}, ${employee.address.country}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Projects */}
                      {employee.projects && employee.projects.length > 0 && (
                        <div className="p-3 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200">
                          <p className="text-xs font-medium mb-2 text-violet-700">
                            {t("employeeDashboard.myProjects")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {employee.projects.map((proj, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-600 text-white"
                              >
                                {proj.projectId?.name || t("employeeDashboard.unknownProject")}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Edit Mode - Refined */
                  <div className="space-y-5">
                    {/* Profile Image Upload */}
                    <div className="flex justify-center">
                      <div className="relative group">
                        {editedEmployee.profileImagePreview ? (
                          <img
                            src={editedEmployee.profileImagePreview}
                            alt="Preview"
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                          />
                        ) : (
                          <div
                            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-100"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            {employee.name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <label
                          htmlFor="profileImage"
                          className="absolute bottom-0 right-0 p-2 rounded-full cursor-pointer shadow-md hover:scale-110 transition-all bg-white border-2"
                          style={{ borderColor: 'var(--color-primary)' }}
                        >
                          <Camera className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                        </label>
                        <input
                          type="file"
                          id="profileImage"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-3">
                      {[
                        { label: t("employeeDashboard.firstName"), name: "name", type: "text", value: editedEmployee.name, icon: User },
                        { label: t("employeeDashboard.lastName"), name: "lastName", type: "text", value: editedEmployee.lastName, icon: User },
                        { label: t("employeeDashboard.email"), name: "email", type: "email", value: editedEmployee.email, icon: Mail },
                        { label: t("employeeDashboard.phone"), name: "phone", type: "tel", value: editedEmployee.phone, icon: Phone },
                        { label: t("employeeDashboard.street"), name: "address.street", type: "text", value: editedEmployee.address?.street, icon: MapPin },
                        { label: t("employeeDashboard.city"), name: "address.city", type: "text", value: editedEmployee.address?.city, icon: MapPin },
                        { label: t("employeeDashboard.country"), name: "address.country", type: "text", value: editedEmployee.address?.country, icon: MapPin },
                        { label: t("employeeDashboard.postalCode"), name: "address.postalCode", type: "text", value: editedEmployee.address?.postalCode, icon: MapPin },
                      ].map((field, idx) => (
                        <div key={idx}>
                          <label className="flex items-center gap-2 text-xs font-semibold mb-1.5" style={{ color: 'var(--color-secondary)' }}>
                            <field.icon className="w-3.5 h-3.5" />
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            name={field.name}
                            value={field.value || ""}
                            onChange={handleProfileChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            style={{
                              backgroundColor: 'var(--bg-color)',
                              color: 'var(--text-color)',
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Password Section - Compact */}
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-4 rounded-lg border border-violet-200">
                      <p className="text-xs font-semibold mb-3 text-violet-700 flex items-center gap-2">
                        <Edit className="w-3.5 h-3.5" />
                        {t("employeeDashboard.changePassword")}
                      </p>
                      <div className="space-y-2">
                        {[
                          { label: t("employeeDashboard.currentPassword"), name: "currentPassword", key: "current" },
                          { label: t("employeeDashboard.newPassword"), name: "newPassword", key: "new" },
                          { label: t("employeeDashboard.confirmPassword"), name: "confirmNewPassword", key: "confirm" },
                        ].map((field, idx) => (
                          <div key={idx} className="relative">
                            <input
                              type={showPasswords[field.key] ? "text" : "password"}
                              name={field.name}
                              value={editedEmployee[field.name] || ""}
                              onChange={handleProfileChange}
                              placeholder={field.label}
                              className="w-full px-3 py-2 pr-10 rounded-lg border border-violet-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswords((prev) => ({
                                  ...prev,
                                  [field.key]: !prev[field.key],
                                }))
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600"
                            >
                              {showPasswords[field.key] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons - Compact */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        {t("employeeDashboard.cancel")}
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {t("employeeDashboard.save")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Charts - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200/50">
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-color)' }}>
                  {t("employeeDashboard.taskDistribution")}
                </h3>
                <div className="h-48 flex items-center justify-center">
                  <Doughnut 
                    data={taskStatusDistribution} 
                    options={{ 
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: { size: 11 }
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200/50">
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-color)' }}>
                  {t("employeeDashboard.priorityBreakdown")}
                </h3>
                <div className="h-48">
                  <Bar
                    data={priorityData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: { 
                          beginAtZero: true,
                          ticks: { stepSize: 1 }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Sections - Refined */}
        <div className="space-y-6">
          {/* Standalone Tasks */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200/50">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
              <Target className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              {t("employeeDashboard.standaloneТasks")}
            </h2>
            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : filterActiveTasksForRole(tasksNoProjectAssignedToUser).length === 0 ? (
              <p className="text-center text-sm py-8" style={{ color: 'var(--color-secondary)' }}>
                {t("employeeDashboard.noStandaloneTasks")}
              </p>
            ) : (
              <div className="space-y-3">
                {filterActiveTasksForRole(tasksNoProjectAssignedToUser).map((task) => (
                  <div
                    key={task.id || task._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-color)' }}>
                        {task.title}
                      </h3>
                      <button
                        onClick={() => handleToggleTask(task.id || task._id)}
                        className="p-1 rounded hover:bg-gray-100 transition-all"
                      >
                        {expandedTaskId === (task.id || task._id) ? (
                          <ChevronUp className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
                        ) : (
                          <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {expandedTaskId === (task.id || task._id) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs mb-3" style={{ color: 'var(--text-color)' }}>
                          {task.description || t("employeeDashboard.noDescription")}
                        </p>
                        {employee && employee.role !== "Employee" && (
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task.id || task._id, e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
                            style={{ color: 'var(--text-color)' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Tasks */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200/50">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
              <Award className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              {t("employeeDashboard.projectTasks")}
            </h2>
            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            ) : filterActiveTasksForRole(projectTasksForUser).length === 0 ? (
              <p className="text-center text-sm py-8" style={{ color: 'var(--color-secondary)' }}>
                {t("employeeDashboard.noProjectTasks")}
              </p>
            ) : (
              <div className="space-y-3">
                {filterActiveTasksForRole(projectTasksForUser).map((task) => (
                  <div
                    key={task.id || task._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-color)' }}>
                        {task.title}
                      </h3>
                      <button
                        onClick={() => handleToggleTask(task.id || task._id)}
                        className="p-1 rounded hover:bg-gray-100 transition-all"
                      >
                        {expandedTaskId === (task.id || task._id) ? (
                          <ChevronUp className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
                        ) : (
                          <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.projectId && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-600 text-white">
                          {task.projectId.name || t("employeeDashboard.unknownProject")}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {expandedTaskId === (task.id || task._id) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs mb-3" style={{ color: 'var(--text-color)' }}>
                          {task.description || t("employeeDashboard.noDescription")}
                        </p>
                        {employee && employee.role !== "Employee" && (
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task.id || task._id, e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
                            style={{ color: 'var(--text-color)' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Archived Tasks - Compact Table */}
          {archivedTasks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200/50">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                {t("employeeDashboard.completedCancelledTasks")}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {[
                        t("employeeDashboard.title"),
                        t("employeeDashboard.status"),
                        t("employeeDashboard.priority"),
                        t("employeeDashboard.dueDate"),
                      ].map((header, idx) => (
                        <th
                          key={idx}
                          className="px-3 py-2 text-left text-xs font-semibold"
                          style={{ color: 'var(--color-secondary)' }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {archivedTasks.map((task) => (
                      <tr
                        key={task.id || task._id}
                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-3 py-3 font-medium" style={{ color: 'var(--text-color)' }}>
                          {task.title}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs" style={{ color: 'var(--color-secondary)' }}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
