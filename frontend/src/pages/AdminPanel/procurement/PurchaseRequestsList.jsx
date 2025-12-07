import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ShoppingCart,
  Calendar,
  DollarSign,
  User,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

const PurchaseRequestsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const { data: requests = [], isLoading, isError, error } = useQuery({
    queryKey: ["purchase-requests"],
    queryFn: async () => {
      const res = await axiosInstance.get("/procurement-advanced/purchase-requests");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/procurement-advanced/purchase-requests/${id}`);
    },
    onSuccess: () => {
      toast.success(t("procurement.request_deleted") || "Purchase request deleted successfully");
      queryClient.invalidateQueries(["purchase-requests"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete purchase request");
    },
  });

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    const matchesPriority = filterPriority === "all" || request.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status) => {
    const colors = {
      Draft: "bg-gray-100 text-gray-800",
      Submitted: "bg-blue-100 text-blue-800",
      "Pending Approval": "bg-yellow-100 text-yellow-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      "Converted to PO": "bg-purple-100 text-purple-800",
      Cancelled: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: "bg-gray-100 text-gray-800",
      Medium: "bg-yellow-100 text-yellow-800",
      High: "bg-orange-100 text-orange-800",
      Urgent: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

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
            {t("procurement.error_loading") || "Error loading purchase requests"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("procurement.purchase_requests") || "Purchase Requests"}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("procurement.purchase_requests_description") || "Manage and track purchase requests"}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/procurement/purchase-requests/add")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={20} />
            {t("procurement.add_request") || "Add Request"}
          </button>
        </div>

        <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder={t("procurement.search_requests") || "Search requests..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">{t("procurement.all_statuses") || "All Statuses"}</option>
              <option value="Draft">{t("procurement.draft") || "Draft"}</option>
              <option value="Submitted">{t("procurement.submitted") || "Submitted"}</option>
              <option value="Pending Approval">{t("procurement.pending_approval") || "Pending Approval"}</option>
              <option value="Approved">{t("procurement.approved") || "Approved"}</option>
              <option value="Rejected">{t("procurement.rejected") || "Rejected"}</option>
              <option value="Converted to PO">{t("procurement.converted_to_po") || "Converted to PO"}</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            >
              <option value="all">{t("procurement.all_priorities") || "All Priorities"}</option>
              <option value="Low">{t("procurement.low") || "Low"}</option>
              <option value="Medium">{t("procurement.medium") || "Medium"}</option>
              <option value="High">{t("procurement.high") || "High"}</option>
              <option value="Urgent">{t("procurement.urgent") || "Urgent"}</option>
            </select>
          </div>

          </div>
          {filteredRequests.length === 0 ? (
            <div className="px-6 pb-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                <ShoppingCart size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  {t("procurement.no_requests") || "No purchase requests found"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border-t" style={{ borderColor: 'var(--border-color)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.request_number") || "Request #"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.title") || "Title"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.requested_by") || "Requested By"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.request_date") || "Request Date"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.estimated_total") || "Estimated Total"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.priority") || "Priority"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.status") || "Status"}
                    </th>
                    <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.actions") || "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <motion.tr
                      key={request._id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="p-3 font-mono" style={{ color: 'var(--text-color)' }}>
                        {request.requestNumber}
                      </td>
                      <td className="p-3 font-semibold" style={{ color: 'var(--text-color)' }}>
                        {request.title}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        {request.requestedBy?.name} {request.requestedBy?.lastName}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        {request.requestDate
                          ? new Date(request.requestDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-color)' }}>
                        {request.estimatedTotal?.toLocaleString()} {request.currency || "USD"}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/procurement/purchase-requests/${request._id}`)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              const confirmMessage = t("procurement.confirm_delete") || "Are you sure you want to delete this request?";
                              if (window.confirm(confirmMessage)) {
                                deleteMutation.mutate(request._id);
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PurchaseRequestsList;

