import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Building,
  Globe,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Package,
  Receipt,
  CreditCard,
  Activity,
  Briefcase,
  Target,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  File,
  Star,
} from "lucide-react";

const Customer360 = () => {
  const { t } = useTranslation();
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customer360", customerId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/customers/360/${customerId}`);
      return res.data.data;
    },
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("customer360.loading") || "Loading customer data..."}</p>
        </motion.div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertTriangle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {t("customer360.error_loading") || "Error loading customer data"}
          </p>
          <button
            onClick={() => navigate("/dashboard/customers")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {t("customer360.back_to_customers") || "Back to Customers"}
          </button>
        </div>
      </div>
    );
  }

  const {
    customer,
    orders = [],
    invoices = [],
    payments = [],
    activities = [],
    tasks = [],
    projects = [],
    leads = [],
    supportTickets = [],
    files = [],
    satisfactionSurveys = [],
    retentionData,
    statistics = {},
  } = data;

  const tabs = [
    { id: "overview", label: t("customer360.overview") || "Overview", icon: User },
    { id: "orders", label: t("customer360.orders") || "Orders", icon: Package },
    { id: "invoices", label: t("customer360.invoices") || "Invoices", icon: Receipt },
    { id: "activities", label: t("customer360.activities") || "Activities", icon: Activity },
    { id: "tasks", label: t("customer360.tasks") || "Tasks", icon: CheckCircle },
    { id: "projects", label: t("customer360.projects") || "Projects", icon: Briefcase },
    { id: "files", label: t("customer360.files") || "Files", icon: File },
  ];

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard/customers")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ color: 'var(--text-color)' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
              {customer?.name || t("customer360.customer_360") || "Customer 360"}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("customer360.all_customer_information") || "All customer information in one place"}
            </p>
          </div>
        </div>

        {/* Customer Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail size={18} style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t("customer360.email") || "Email"}
                </span>
              </div>
              <p style={{ color: 'var(--text-color)' }}>{customer?.email || "-"}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone size={18} style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t("customer360.phone") || "Phone"}
                </span>
              </div>
              <p style={{ color: 'var(--text-color)' }}>{customer?.phone || "-"}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building size={18} style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t("customer360.company") || "Company"}
                </span>
              </div>
              <p style={{ color: 'var(--text-color)' }}>{customer?.company || "-"}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t("customer360.customer_since") || "Customer Since"}
                </span>
              </div>
              <p style={{ color: 'var(--text-color)' }}>
                {customer?.customerSince
                  ? new Date(customer.customerSince).toLocaleDateString()
                  : "-"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t("customer360.total_orders") || "Total Orders"}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                  {statistics.totalOrders || 0}
                </p>
              </div>
              <Package size={32} style={{ color: 'var(--color-primary)' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t("customer360.total_value") || "Total Value"}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                  ${(statistics.totalOrderValue || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign size={32} style={{ color: 'var(--color-primary)' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t("customer360.total_paid") || "Total Paid"}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                  ${(statistics.totalPaid || 0).toLocaleString()}
                </p>
              </div>
              <CreditCard size={32} style={{ color: 'var(--color-primary)' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t("customer360.avg_order_value") || "Avg Order Value"}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>
                  ${(statistics.averageOrderValue || 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp size={32} style={{ color: 'var(--color-primary)' }} />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap border-b" style={{ borderColor: 'var(--border-color)' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  style={{
                    borderBottomColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-color)',
                  }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Recent Orders */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                    {t("customer360.recent_orders") || "Recent Orders"}
                  </h3>
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div>
                          <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                            {t("customer360.order") || "Order"} #{order.orderNumber || order._id.slice(-6)}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(order.orderDate).toLocaleDateString()} - ${order.totalAmount?.toFixed(2)}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            order.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                        {t("customer360.no_orders") || "No orders found"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Recent Activities */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                    {t("customer360.recent_activities") || "Recent Activities"}
                  </h3>
                  <div className="space-y-2">
                    {activities.slice(0, 5).map((activity) => (
                      <div
                        key={activity._id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Activity size={18} style={{ color: 'var(--color-primary)' }} />
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                            {activity.subject}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(activity.date).toLocaleDateString()} - {activity.type}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                        {t("customer360.no_activities") || "No activities found"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                          {t("customer360.order") || "Order"} #{order.orderNumber || order._id.slice(-6)}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>
                          ${order.totalAmount?.toFixed(2)}
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            order.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                    {t("customer360.no_orders") || "No orders found"}
                  </p>
                )}
              </div>
            )}

            {activeTab === "invoices" && (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                          {t("customer360.invoice") || "Invoice"} #{invoice.invoiceNumber}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>
                          ${invoice.totalAmount?.toFixed(2)}
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            invoice.status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : invoice.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                    {t("customer360.no_invoices") || "No invoices found"}
                  </p>
                )}
              </div>
            )}

            {activeTab === "activities" && (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-start gap-3">
                      <Activity size={20} style={{ color: 'var(--color-primary)' }} />
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                          {activity.subject}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {activity.description}
                        </p>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(activity.date).toLocaleString()} - {activity.type}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                    {t("customer360.no_activities") || "No activities found"}
                  </p>
                )}
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                          {task.title}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {task.description}
                        </p>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          task.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                    {t("customer360.no_tasks") || "No tasks found"}
                  </p>
                )}
              </div>
            )}

            {activeTab === "projects" && (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                          {project.name}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {project.description}
                        </p>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                          {project.startDate
                            ? `${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.endDate).toLocaleDateString()}`
                            : "-"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          project.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : project.status === "Active"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                    {t("customer360.no_projects") || "No projects found"}
                  </p>
                )}
              </div>
            )}

            {activeTab === "files" && (
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <File size={20} style={{ color: 'var(--color-primary)' }} />
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                            {file.fileName}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {file.category} - {(file.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {files.length === 0 && (
                  <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                    {t("customer360.no_files") || "No files found"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Customer360;

