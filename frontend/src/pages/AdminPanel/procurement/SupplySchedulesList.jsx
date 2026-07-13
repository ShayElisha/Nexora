import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Truck,
  Package,
  Filter,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  Eye,
  Copy,
  Download,
  Mail,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Grid,
  List,
  ExternalLink,
} from "lucide-react";
import ReactModal from "react-modal";

// Modal component for delete confirmation
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, scheduleNumber, isRTL, t }) => {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center z-50"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      contentLabel="Delete Confirmation"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4"
        style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
            {t("procurement.delete_confirm_title") || "Confirm Delete"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={20} style={{ color: 'var(--text-color)' }} />
          </button>
        </div>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          {t("procurement.delete_confirm_message", { scheduleNumber }) || `Are you sure you want to delete schedule ${scheduleNumber}? This action cannot be undone.`}
        </p>
        <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: '#ef4444' }}
          >
            {t("procurement.delete_button") || "Delete"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
          >
            {t("procurement.cancel_button") || "Cancel"}
          </button>
        </div>
      </motion.div>
    </ReactModal>
  );
};

// Details Modal Component
const ScheduleDetailsModal = ({ isOpen, onClose, schedule, isRTL, textAlign, t }) => {
  if (!schedule) return null;

  const calculateProgress = () => {
    if (!schedule.schedule || schedule.schedule.length === 0) return 0;
    const delivered = schedule.schedule.filter(d => d.items?.some(item => item.status === "Delivered")).length;
    return Math.round((delivered / schedule.schedule.length) * 100);
  };

  const getDeliveryStatusColor = (delivery) => {
    const now = new Date();
    const deliveryDate = new Date(delivery.deliveryDate);
    const daysDiff = Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24));
    
    if (delivery.items?.some(item => item.status === "Delivered")) return "bg-green-100 text-green-800";
    if (deliveryDate < now && !delivery.items?.some(item => item.status === "Delivered")) return "bg-red-100 text-red-800";
    if (daysDiff <= 7) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      contentLabel="Schedule Details"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
      >
        <div className="p-6 border-b sticky top-0 z-10" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
              {schedule.scheduleNumber}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <X size={24} style={{ color: 'var(--text-color)' }} />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
              {t("procurement.basic_information") || "Basic Information"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t("procurement.supplier") || "Supplier"}</p>
                <p className="font-medium" style={{ color: 'var(--text-color)' }}>{schedule.supplierName}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t("procurement.status") || "Status"}</p>
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(schedule.status)}`}>
                  {schedule.status}
                </span>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t("procurement.start_date") || "Start Date"}</p>
                <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                  {schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t("procurement.end_date") || "End Date"}</p>
                <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                  {schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
                {t("procurement.progress") || "Progress"}
              </h3>
              <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                {calculateProgress()}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>

          {/* Deliveries */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
              {t("procurement.deliveries") || "Deliveries"}
            </h3>
            <div className="space-y-4">
              {schedule.schedule && schedule.schedule.length > 0 ? (
                schedule.schedule.map((delivery, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                          {new Date(delivery.deliveryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getDeliveryStatusColor(delivery)}`}>
                        {delivery.items?.some(item => item.status === "Delivered") ? "Delivered" : 
                         new Date(delivery.deliveryDate) < new Date() ? "Delayed" : "Scheduled"}
                      </span>
                    </div>
                    {delivery.tracking?.trackingNumber && (
                      <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {t("procurement.tracking") || "Tracking"}: {delivery.tracking.trackingNumber}
                      </div>
                    )}
                    {delivery.items && delivery.items.length > 0 && (
                      <div className="mt-2">
                        {delivery.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="text-sm mt-1" style={{ color: 'var(--text-color)' }}>
                            {item.productName} - {item.quantity} {item.receivedQuantity > 0 && `(${item.receivedQuantity} received)`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                  {t("procurement.no_deliveries_scheduled") || "No deliveries scheduled"}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </ReactModal>
  );
};

const getStatusColor = (status) => {
  const colors = {
    Scheduled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Partially Delivered": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    Delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Delayed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Cancelled: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const SupplySchedulesList = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("table"); // table or card
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  // Detect RTL languages
  const isRTL = ['he', 'ar', 'iw'].includes(i18n.language);
  const direction = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'text-right' : 'text-left';

  // Fetch schedules with pagination and filters
  const { data: schedulesData, isLoading, isError } = useQuery({
    queryKey: ["supply-schedules", page, filterStatus, filterSupplier, filterStartDate, filterEndDate, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterSupplier !== "all") params.append("supplierId", filterSupplier);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      
      const res = await axiosInstance.get(`/procurement-advanced/supply-schedules?${params}`);
      return res.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["supply-schedules-stats"],
    queryFn: async () => {
      const res = await axiosInstance.get("/procurement-advanced/supply-schedules/stats");
      return res.data.data;
    },
  });

  // Fetch suppliers for filter
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/suppliers");
      return res.data.data || [];
    },
  });

  const schedules = schedulesData?.data || [];
  const pagination = schedulesData?.pagination || { page: 1, limit: 20, total: 0, pages: 1 };

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/procurement-advanced/supply-schedules/${id}`);
    },
    onSuccess: () => {
      toast.success(t("procurement.schedule_deleted") || "Schedule deleted successfully");
      queryClient.invalidateQueries(["supply-schedules"]);
      queryClient.invalidateQueries(["supply-schedules-stats"]);
      setDeleteModalOpen(false);
      setScheduleToDelete(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete schedule");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await axiosInstance.patch(`/procurement-advanced/supply-schedules/${id}/status`, { status });
    },
    onSuccess: () => {
      toast.success(t("procurement.status_updated") || "Status updated successfully");
      queryClient.invalidateQueries(["supply-schedules"]);
      queryClient.invalidateQueries(["supply-schedules-stats"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosInstance.post(`/procurement-advanced/supply-schedules/${id}/duplicate`);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("procurement.schedule_duplicated") || "Schedule duplicated successfully");
      queryClient.invalidateQueries(["supply-schedules"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to duplicate schedule");
    },
  });

  // Helper functions
  const calculateProgress = (schedule) => {
    if (!schedule.schedule || schedule.schedule.length === 0) return 0;
    const delivered = schedule.schedule.filter(d => 
      d.items?.some(item => item.status === "Delivered")
    ).length;
    return Math.round((delivered / schedule.schedule.length) * 100);
  };

  const getUpcomingDeliveries = (schedule) => {
    if (!schedule.schedule) return { count7: 0, count14: 0, count30: 0 };
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let count7 = 0, count14 = 0, count30 = 0;
    schedule.schedule.forEach(delivery => {
      const deliveryDate = new Date(delivery.deliveryDate);
      if (deliveryDate > now && deliveryDate <= sevenDays) count7++;
      else if (deliveryDate > sevenDays && deliveryDate <= fourteenDays) count14++;
      else if (deliveryDate > fourteenDays && deliveryDate <= thirtyDays) count30++;
    });
    return { count7, count14, count30 };
  };

  const getLastDeliveryStatus = (schedule) => {
    if (!schedule.schedule || schedule.schedule.length === 0) return null;
    const sorted = [...schedule.schedule].sort((a, b) => 
      new Date(b.deliveryDate) - new Date(a.deliveryDate)
    );
    const lastDelivery = sorted[0];
    if (lastDelivery.items?.some(item => item.status === "Delivered")) return "Delivered";
    if (new Date(lastDelivery.deliveryDate) < new Date()) return "Delayed";
    return "Scheduled";
  };

  const getTotalAmount = (schedule) => {
    if (schedule.procurementId?.totalCost) {
      return schedule.procurementId.totalCost;
    }
    if (schedule.items && schedule.items.length > 0) {
      return schedule.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    }
    return 0;
  };

  const handleDelete = (schedule) => {
    setScheduleToDelete(schedule);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (scheduleToDelete) {
      deleteMutation.mutate(scheduleToDelete._id);
    }
  };

  const handleViewDetails = (schedule) => {
    setSelectedSchedule(schedule);
    setDetailsModalOpen(true);
  };

  const exportToExcel = () => {
    try {
      const data = filteredSchedules.map(schedule => ({
        [t("procurement.schedule_number") || "Schedule Number"]: schedule.scheduleNumber,
        [t("procurement.supplier") || "Supplier"]: schedule.supplierName,
        [t("procurement.procurement") || "Procurement"]: schedule.procurementId?.PurchaseOrder || "-",
        [t("procurement.start_date") || "Start Date"]: schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : "-",
        [t("procurement.end_date") || "End Date"]: schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : "-",
        [t("procurement.deliveries") || "Deliveries"]: schedule.schedule?.length || 0,
        [t("procurement.progress") || "Progress"]: `${calculateProgress(schedule)}%`,
        [t("procurement.total_amount") || "Total Amount"]: getTotalAmount(schedule),
        [t("procurement.status") || "Status"]: schedule.status,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, t("procurement.supply_schedules") || "Supply Schedules");
      XLSX.writeFile(wb, `supply-schedules-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(t("procurement.export_completed") || "Export completed successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("procurement.export_error") || "Export error");
    }
  };

  const exportToPDF = () => {
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(18);
      pdf.text(t("procurement.supply_schedules") || "Supply Schedules", 14, 20);
      
      pdf.setFontSize(10);
      pdf.text(`${t("procurement.export_date") || "Export Date"}: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableData = filteredSchedules.map(schedule => [
        schedule.scheduleNumber,
        schedule.supplierName,
        schedule.procurementId?.PurchaseOrder || "-",
        schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : "-",
        `${calculateProgress(schedule)}%`,
        schedule.status,
      ]);

      pdf.autoTable({
        startY: 35,
        head: [[
          t("procurement.schedule_number") || "Schedule #",
          t("procurement.supplier") || "Supplier",
          t("procurement.procurement") || "Procurement",
          t("procurement.start_date") || "Start Date",
          t("procurement.progress") || "Progress",
          t("procurement.status") || "Status",
        ]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      pdf.save(`supply-schedules-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(t("procurement.pdf_export_completed") || "PDF export completed successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error(t("procurement.pdf_export_error") || "PDF export error");
    }
  };

  const sendAlert = async (schedule) => {
    try {
      // This would call an API endpoint to send an alert/email
      // For now, we'll just show a toast
      toast.success(t("procurement.alert_sent", { supplier: schedule.supplierName }) || `Alert sent to supplier ${schedule.supplierName}`);
    } catch (error) {
      toast.error(t("procurement.failed_to_send_alert") || "Failed to send alert");
    }
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const matchesSearch =
        schedule.scheduleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.procurementId?.PurchaseOrder?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [schedules, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("procurement.loading") || "Loading..."}</p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {t("procurement.error_loading_schedules") || "Error loading schedules"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }} dir={direction}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className={textAlign}>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("procurement.supply_schedules") || "Supply Schedules"}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("procurement.supply_schedules_description") || "Manage and track supply schedules"}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/procurement/supply-schedules/add")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={20} />
            {t("procurement.add_schedule") || "Add Schedule"}
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t("procurement.active") || "Active"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.totalActive || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <TrendingUp size={24} style={{ color: '#3b82f6' }} />
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t("procurement.upcoming_7_days") || "Upcoming (7 days)"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.upcoming7Days || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>
                  <Clock size={24} style={{ color: '#eab308' }} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t("procurement.delayed") || "Delayed"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.delayed || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <AlertTriangle size={24} style={{ color: '#ef4444' }} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t("procurement.completion") || "Completion"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {stats.completionRate?.toFixed(0) || 0}%
                  </p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                  <CheckCircle size={24} style={{ color: '#22c55e' }} />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="rounded-2xl shadow-md border overflow-hidden mb-6" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="lg:col-span-2 relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2`} size={20} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={t("procurement.search_schedules") || "Search schedules..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 rounded-lg border`}
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <select
              value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">{t("procurement.all_statuses") || "All Statuses"}</option>
              <option value="Scheduled">{t("procurement.scheduled") || "Scheduled"}</option>
              <option value="In Progress">{t("procurement.in_progress") || "In Progress"}</option>
              <option value="Partially Delivered">{t("procurement.partially_delivered") || "Partially Delivered"}</option>
              <option value="Delivered">{t("procurement.delivered") || "Delivered"}</option>
              <option value="Delayed">{t("procurement.delayed") || "Delayed"}</option>
                <option value="Cancelled">{t("procurement.cancelled") || "Cancelled"}</option>
              </select>
              <select
                value={filterSupplier}
                onChange={(e) => {
                  setFilterSupplier(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              >
                <option value="all">{t("procurement.all_suppliers") || "All Suppliers"}</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.SupplierName}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => {
                    setFilterStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("procurement.from_date") || "From Date"}
                />
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => {
                    setFilterEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("procurement.to_date") || "To Date"}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg transition ${viewMode === "table" ? 'bg-blue-100' : ''}`}
                  style={{ color: viewMode === "table" ? 'var(--color-primary)' : 'var(--text-secondary)' }}
                  title={t("procurement.table_view") || "Table View"}
                >
                  <List size={20} />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-2 rounded-lg transition ${viewMode === "card" ? 'bg-blue-100' : ''}`}
                  style={{ color: viewMode === "card" ? 'var(--color-primary)' : 'var(--text-secondary)' }}
                  title={t("procurement.card_view") || "Card View"}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={exportToExcel}
                  className="p-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                  title={t("procurement.export_to_excel") || "Export to Excel"}
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={exportToPDF}
                  className="p-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                  title={t("procurement.export_to_pdf") || "Export to PDF"}
                >
                  <Download size={20} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="px-4 py-2 rounded-lg border text-sm"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                >
                  <option value="startDate-desc">{t("procurement.start_date_newest") || "Start Date (Newest)"}</option>
                  <option value="startDate-asc">{t("procurement.start_date_oldest") || "Start Date (Oldest)"}</option>
                  <option value="scheduleNumber-asc">{t("procurement.schedule_number_sort") || "Schedule Number"}</option>
                  <option value="status-asc">{t("procurement.status_sort") || "Status"}</option>
            </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          {filteredSchedules.length === 0 ? (
            <div className="px-6 pb-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                <Calendar size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                    {searchTerm 
                      ? (isRTL ? "לא נמצאו תוצאות" : "No results found")
                      : (isRTL ? "אין לוחות זמנים" : "No schedules found")}
                </p>
              </div>
            </div>
          ) : (
              <>
            <div className="overflow-x-auto border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <table className="w-full" dir={direction}>
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <th className={`${textAlign} p-3 font-semibold text-sm`} style={{ color: 'var(--text-color)' }}>
                      {t("procurement.schedule_number") || "Schedule #"}
                    </th>
                        <th className={`${textAlign} p-3 font-semibold text-sm`} style={{ color: 'var(--text-color)' }}>
                      {t("procurement.supplier") || "Supplier"}
                    </th>
                        <th className={`${textAlign} p-3 font-semibold text-sm`} style={{ color: 'var(--text-color)' }}>
                          {t("procurement.procurement") || "Procurement"}
                        </th>
                        <th className={`${textAlign} p-3 font-semibold text-sm`} style={{ color: 'var(--text-color)' }}>
                      {t("procurement.start_date") || "Start Date"}
                    </th>
                        <th className={`${textAlign} p-3 font-semibold text-sm`} style={{ color: 'var(--text-color)' }}>
                          {t("procurement.progress") || "Progress"}
                        </th>
                        <th className={`${textAlign} p-3 font-semibold text-sm`} style={{ color: 'var(--text-color)' }}>
                          {t("procurement.upcoming") || "Upcoming"}
                    </th>
                        <th className={`${textAlign} p-3 font-semibold text-sm`} style={{ color: 'var(--text-color)' }}>
                          {t("procurement.total_amount") || "Total Amount"}
                    </th>
                        <th className={`${textAlign} p-3 font-semibold text-sm`} style={{ color: 'var(--text-color)' }}>
                      {t("procurement.status") || "Status"}
                    </th>
                        <th className={`${textAlign} p-3 font-semibold text-sm`} style={{ color: 'var(--text-color)' }}>
                      {t("procurement.actions") || "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                      {filteredSchedules.map((schedule) => {
                        const progress = calculateProgress(schedule);
                        const upcoming = getUpcomingDeliveries(schedule);
                        const totalAmount = getTotalAmount(schedule);
                        const lastStatus = getLastDeliveryStatus(schedule);
                        
                        return (
                    <motion.tr
                      key={schedule._id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                            <td className={`p-3 font-mono text-sm ${textAlign}`} style={{ color: 'var(--text-color)' }}>
                        {schedule.scheduleNumber}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Truck size={16} />
                                <span className="text-sm">{schedule.supplierName}</span>
                        </div>
                      </td>
                            <td className={`p-3 ${textAlign}`} style={{ color: 'var(--text-color)' }}>
                              {schedule.procurementId ? (
                                <button
                                  onClick={() => navigate(`/dashboard/procurement/by/${schedule.procurementId.PurchaseOrder}`)}
                                  className="flex items-center gap-1 text-blue-500 hover:underline text-sm"
                                >
                                  {schedule.procurementId.PurchaseOrder}
                                  <ExternalLink size={12} />
                                </button>
                              ) : (
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>-</span>
                              )}
                            </td>
                            <td className={`p-3 text-sm ${textAlign}`} style={{ color: 'var(--text-color)' }}>
                        {schedule.startDate
                                ? new Date(schedule.startDate).toLocaleDateString(i18n.language)
                          : "-"}
                      </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs" style={{ color: 'var(--text-color)' }}>{progress}%</span>
                              </div>
                            </td>
                            <td className={`p-3 text-sm ${textAlign}`} style={{ color: 'var(--text-color)' }}>
                              {upcoming.count7 > 0 && (
                                <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                                  {upcoming.count7} {t("procurement.7_days") || "7d"}
                                </span>
                              )}
                              {upcoming.count14 > 0 && (
                                <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 ml-1">
                                  {upcoming.count14} {t("procurement.14_days") || "14d"}
                                </span>
                              )}
                              {upcoming.count7 === 0 && upcoming.count14 === 0 && (
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>-</span>
                              )}
                      </td>
                            <td className={`p-3 text-sm ${textAlign}`} style={{ color: 'var(--text-color)' }}>
                              {totalAmount > 0 ? (
                        <span className="flex items-center gap-1">
                                  <DollarSign size={14} />
                                  {totalAmount.toLocaleString()} {schedule.procurementId?.currency || "ILS"}
                        </span>
                              ) : (
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>-</span>
                              )}
                      </td>
                            <td className={`p-3 ${textAlign}`}>
                              <select
                                value={schedule.status}
                                onChange={(e) => updateStatusMutation.mutate({ id: schedule._id, status: e.target.value })}
                                className={`px-2 py-1 rounded text-xs border ${getStatusColor(schedule.status)}`}
                                style={{ borderColor: 'var(--border-color)' }}
                              >
                                <option value="Scheduled">{t("procurement.scheduled") || "Scheduled"}</option>
                                <option value="In Progress">{t("procurement.in_progress") || "In Progress"}</option>
                                <option value="Partially Delivered">{t("procurement.partially_delivered") || "Partially Delivered"}</option>
                                <option value="Delivered">{t("procurement.delivered") || "Delivered"}</option>
                                <option value="Delayed">{t("procurement.delayed") || "Delayed"}</option>
                                <option value="Cancelled">{t("procurement.cancelled") || "Cancelled"}</option>
                              </select>
                      </td>
                      <td className="p-3">
                              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <button
                                  onClick={() => handleViewDetails(schedule)}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                  style={{ color: 'var(--color-primary)' }}
                                  title={t("procurement.view_details") || "View Details"}
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => navigate(`/dashboard/procurement/supply-schedules/${schedule._id}`)}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                  style={{ color: 'var(--color-primary)' }}
                                  title={t("procurement.edit") || "Edit"}
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => duplicateMutation.mutate(schedule._id)}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                  style={{ color: 'var(--text-color)' }}
                                  title={t("procurement.duplicate") || "Duplicate"}
                                >
                                  <Copy size={18} />
                                </button>
                                <button
                                  onClick={() => sendAlert(schedule)}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                  style={{ color: 'var(--text-color)' }}
                                  title={t("procurement.send_alert") || "Send Alert"}
                                >
                                  <Mail size={18} />
                                </button>
                                <button
                                  onClick={() => handleDelete(schedule)}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                  title={t("procurement.delete") || "Delete"}
                                >
                                  <Trash2 size={18} className="text-red-500" />
                                </button>
                        </div>
                      </td>
                    </motion.tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
                
                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className={`flex items-center justify-between p-4 border-t ${isRTL ? 'flex-row-reverse' : ''}`} style={{ borderColor: 'var(--border-color)' }}>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {t("procurement.showing_results", {
                        start: (pagination.page - 1) * pagination.limit + 1,
                        end: Math.min(pagination.page * pagination.limit, pagination.total),
                        total: pagination.total
                      }) || `Showing ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={pagination.page === 1}
                        className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <span className="px-4 py-2 text-sm" style={{ color: 'var(--text-color)' }}>
                        {pagination.page} / {pagination.pages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        disabled={pagination.page === pagination.pages}
                        className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Card View */}
        {viewMode === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.length === 0 ? (
              <div className="col-span-full">
                <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                  <Calendar size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {searchTerm 
                      ? (isRTL ? "לא נמצאו תוצאות" : "No results found")
                      : (isRTL ? "אין לוחות זמנים" : "No schedules found")}
                  </p>
                </div>
              </div>
            ) : (
              filteredSchedules.map((schedule) => {
                const progress = calculateProgress(schedule);
                const upcoming = getUpcomingDeliveries(schedule);
                const totalAmount = getTotalAmount(schedule);
                
                return (
                  <motion.div
                    key={schedule._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border hover:shadow-lg transition"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-mono font-semibold" style={{ color: 'var(--text-color)' }}>
                        {schedule.scheduleNumber}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Truck size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-color)' }}>{schedule.supplierName}</span>
                      </div>
                      {schedule.procurementId && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package size={16} style={{ color: 'var(--text-secondary)' }} />
                          <button
                            onClick={() => navigate(`/dashboard/procurement/by/${schedule.procurementId.PurchaseOrder}`)}
                            className="text-blue-500 hover:underline"
                          >
                            {schedule.procurementId.PurchaseOrder}
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-color)' }}>
                          {schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : "-"}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {t("procurement.progress") || "Progress"}
                        </span>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-color)' }}>
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''} mb-4`}>
                      <button
                        onClick={() => handleViewDetails(schedule)}
                        className="flex-1 px-3 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                      >
                        <Eye size={16} className="inline mr-1" />
                        {t("procurement.view_details") || "Details"}
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/procurement/supply-schedules/${schedule._id}`)}
                        className="flex-1 px-3 py-2 rounded-lg text-white hover:opacity-90 transition text-sm"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        <Edit size={16} className="inline mr-1" />
                        {t("procurement.edit") || "Edit"}
                      </button>
                    </div>
                  </motion.div>
                );
              })
          )}
        </div>
        )}

        {/* Modals */}
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setScheduleToDelete(null);
          }}
          onConfirm={confirmDelete}
          scheduleNumber={scheduleToDelete?.scheduleNumber || ""}
          isRTL={isRTL}
          t={t}
        />

        <ScheduleDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedSchedule(null);
          }}
          schedule={selectedSchedule}
          isRTL={isRTL}
          textAlign={textAlign}
          t={t}
        />
      </motion.div>
    </div>
  );
};

export default SupplySchedulesList;
