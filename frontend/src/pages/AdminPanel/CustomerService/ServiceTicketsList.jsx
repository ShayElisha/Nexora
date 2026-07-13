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
  Headphones,
  Calendar,
  User,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

const ServiceTicketsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["service-tickets"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customer-service/tickets");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/customer-service/tickets/${id}`);
    },
    onSuccess: () => {
      toast.success(t("customerService.ticket_deleted") || "Ticket deleted successfully");
      queryClient.invalidateQueries(["service-tickets"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete ticket");
    },
  });

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status) => {
    const colors = {
      Open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "Waiting for Customer": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return colors[status] || colors.Open;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      High: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[priority] || colors.Low;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Open":
        return <Clock className="text-blue-600" size={16} />;
      case "In Progress":
        return <Clock className="text-yellow-600" size={16} />;
      case "Resolved":
        return <CheckCircle className="text-green-600" size={16} />;
      case "Closed":
        return <XCircle className="text-gray-600" size={16} />;
      default:
        return <AlertCircle className="text-orange-600" size={16} />;
    }
  };

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("customerService.service_tickets") || "Service Tickets"}
            </h1>
            <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
              {t("customerService.manage_tickets") || "Manage and track customer service tickets"}
            </p>
          </div>
          <motion.button
            onClick={() => navigate("/dashboard/customer-service/tickets/add")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{
              backgroundColor: "var(--button-bg)",
              color: "var(--button-text)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={20} />
            {t("customerService.add_ticket") || "Add Ticket"}
          </motion.button>
        </motion.div>

        {/* Filters Card */}
        <motion.div
          className="rounded-2xl shadow-lg border p-6 mb-6"
          style={{
            backgroundColor: "var(--bg-color)",
            borderColor: "var(--border-color)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2"
                style={{ color: "var(--color-secondary)" }}
                size={20}
              />
              <input
                type="text"
                placeholder={t("customerService.search_tickets") || "Search tickets..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("customerService.all_statuses") || "All Statuses"}</option>
              <option value="Open">{t("customerService.open") || "Open"}</option>
              <option value="In Progress">{t("customerService.in_progress") || "In Progress"}</option>
              <option value="Waiting for Customer">{t("customerService.waiting_for_customer") || "Waiting for Customer"}</option>
              <option value="Resolved">{t("customerService.resolved") || "Resolved"}</option>
              <option value="Closed">{t("customerService.closed") || "Closed"}</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("customerService.all_priorities") || "All Priorities"}</option>
              <option value="Low">{t("customerService.low") || "Low"}</option>
              <option value="Medium">{t("customerService.medium") || "Medium"}</option>
              <option value="High">{t("customerService.high") || "High"}</option>
              <option value="Urgent">{t("customerService.urgent") || "Urgent"}</option>
            </select>
          </div>
        </motion.div>

        {/* Tickets Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: "var(--color-primary)" }}></div>
            <p className="mt-4" style={{ color: "var(--text-color)" }}>
              {t("common.loading") || "Loading..."}
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Headphones size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
            <p className="text-xl mb-2" style={{ color: "var(--text-color)" }}>
              {t("customerService.no_tickets") || "No tickets found"}
            </p>
            <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
              {t("customerService.create_first_ticket") || "Create your first ticket to get started"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket._id}
                className="rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300"
                style={{
                  backgroundColor: "var(--bg-color)",
                  borderColor: "var(--border-color)",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                {/* Card Header */}
                <div
                  className="p-5 border-b"
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Headphones className="text-white" size={20} />
                        <span className="font-mono text-white text-sm font-semibold">
                          {ticket.ticketNumber}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white line-clamp-2">
                        {ticket.title}
                      </h3>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => navigate(`/dashboard/customer-service/tickets/${ticket._id}`)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                        title={t("common.edit") || "Edit"}
                      >
                        <Edit size={16} className="text-white" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t("customerService.confirm_delete") || "Are you sure?")) {
                            deleteMutation.mutate(ticket._id);
                          }
                        }}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                        title={t("common.delete") || "Delete"}
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(ticket.status)}
                        {ticket.status}
                      </div>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-color)" }}>
                    <User size={16} style={{ color: "var(--color-secondary)" }} />
                    <span className="truncate">
                      {ticket.customerId?.name || t("customerService.no_customer") || "No Customer"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-color)" }}>
                    <span
                      className="px-2 py-1 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        color: "white",
                      }}
                    >
                      {ticket.category}
                    </span>
                  </div>

                  {ticket.openedAt && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-color)" }}>
                      <Calendar size={16} style={{ color: "var(--color-secondary)" }} />
                      <span>
                        {t("customerService.opened_at") || "Opened At"}:{" "}
                        {new Date(ticket.openedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {ticket.description && (
                    <p
                      className="text-sm line-clamp-2"
                      style={{ color: "var(--color-secondary)" }}
                    >
                      {ticket.description}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceTicketsList;
