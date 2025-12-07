import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Ticket,
  Search,
  Plus,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Filter,
} from "lucide-react";

const getStatusColor = (status) => {
  switch (status) {
    case "Open":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "Resolved":
      return "bg-green-100 text-green-700 border-green-300";
    case "Closed":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "Urgent":
      return "text-red-600 font-bold";
    case "High":
      return "text-orange-600 font-semibold";
    case "Medium":
      return "text-yellow-600";
    case "Low":
      return "text-gray-500";
    default:
      return "text-gray-400";
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "Bug Report":
      return "🐛";
    case "Feature Request":
      return "✨";
    case "Technical Support":
      return "🔧";
    case "Billing":
      return "💳";
    case "General Question":
      return "❓";
    case "Account Issue":
      return "👤";
    default:
      return "📋";
  }
};

const SupportTicketsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 12;

  // Fetch support tickets
  const {
    data: tickets = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["supportTickets"],
    queryFn: async () => {
      const res = await axiosInstance.get("/support-tickets");
      return res.data.data;
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to fetch tickets");
    },
  });


  // Filtering
  let filteredTickets = tickets.filter((ticket) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      ticket.title?.toLowerCase().includes(term) ||
      ticket.description?.toLowerCase().includes(term) ||
      ticket.category?.toLowerCase().includes(term) ||
      ticket.createdBy?.name?.toLowerCase().includes(term);

    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesCategory =
      filterCategory === "all" || ticket.category === filterCategory;
    const matchesPriority =
      filterPriority === "all" || ticket.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate statistics
  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "Open").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    resolved: tickets.filter((t) => t.status === "Resolved").length,
    closed: tickets.filter((t) => t.status === "Closed").length,
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2
            className="animate-spin"
            size={48}
            style={{ color: "var(--color-primary)" }}
          />
          <p style={{ color: "var(--text-color)" }}>{t("supportTickets.loading")}</p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {error?.message || t("supportTickets.failedToLoadTickets")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Ticket size={32} style={{ color: "var(--color-primary)" }} />
              {t("supportTickets.title")}
            </h1>
            <p className="text-gray-500 mt-1">
              {t("supportTickets.subtitle")}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard/support-tickets/create")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Plus size={20} />
            {t("supportTickets.createTicket")}
          </motion.button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
            }}
          >
            <p className="text-sm text-gray-500">{t("supportTickets.total")}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-lg border border-yellow-300 bg-yellow-50"
          >
            <p className="text-sm text-yellow-700">{t("supportTickets.open")}</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.open}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-lg border border-blue-300 bg-blue-50"
          >
            <p className="text-sm text-blue-700">{t("supportTickets.inProgress")}</p>
            <p className="text-2xl font-bold text-blue-700">
              {stats.inProgress}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-lg border border-green-300 bg-green-50"
          >
            <p className="text-sm text-green-700">{t("supportTickets.resolved")}</p>
            <p className="text-2xl font-bold text-green-700">
              {stats.resolved}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 rounded-lg border border-gray-300 bg-gray-50"
          >
            <p className="text-sm text-gray-700">{t("supportTickets.closed")}</p>
            <p className="text-2xl font-bold text-gray-700">{stats.closed}</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter size={20} />
              <span className="font-semibold">{t("supportTickets.filters")}:</span>
            </div>
            
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder={t("supportTickets.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("supportTickets.allStatus")}</option>
              <option value="Open">{t("supportTickets.open")}</option>
              <option value="In Progress">{t("supportTickets.inProgress")}</option>
              <option value="Resolved">{t("supportTickets.resolved")}</option>
              <option value="Closed">{t("supportTickets.closed")}</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("supportTickets.allCategories")}</option>
              <option value="Bug Report">{t("supportTickets.bugReport")}</option>
              <option value="Feature Request">{t("supportTickets.featureRequest")}</option>
              <option value="Technical Support">{t("supportTickets.technicalSupport")}</option>
              <option value="Billing">{t("supportTickets.billing")}</option>
              <option value="General Question">{t("supportTickets.generalQuestion")}</option>
              <option value="Account Issue">{t("supportTickets.accountIssue")}</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("supportTickets.allPriorities")}</option>
              <option value="Low">{t("supportTickets.low")}</option>
              <option value="Medium">{t("supportTickets.medium")}</option>
              <option value="High">{t("supportTickets.high")}</option>
              <option value="Urgent">{t("supportTickets.urgent")}</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">{t("supportTickets.noTickets")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {currentTickets.map((ticket) => (
              <motion.div
                key={ticket._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/dashboard/support-tickets/${ticket._id}`)}
                className="p-4 rounded-lg border cursor-pointer transition-all"
                style={{
                  backgroundColor: "var(--bg-color)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {getCategoryIcon(ticket.category)}
                      </span>
                      <h3 className="text-lg font-semibold">{ticket.title}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {t(`supportTickets.status.${ticket.status.toLowerCase().replace(' ', '')}`)}
                      </span>
                      <span
                        className={`text-sm ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {t(`supportTickets.priority.${ticket.priority.toLowerCase()}`)}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-2 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {t("supportTickets.createdBy")}: {ticket.createdBy?.name || t("supportTickets.unknown")}
                      </span>
                      <span>
                        {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                      </span>
                      {ticket.comments?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare size={16} />
                            {ticket.comments.length} {t("supportTickets.comments")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded border disabled:opacity-50"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              {t("supportTickets.previous")}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`px-4 py-2 rounded ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "border"
                  }`}
                  style={
                    currentPage !== page
                      ? {
                          backgroundColor: "var(--bg-color)",
                          borderColor: "var(--border-color)",
                          color: "var(--text-color)",
                        }
                      : {}
                  }
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded border disabled:opacity-50"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              {t("supportTickets.next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTicketsList;

