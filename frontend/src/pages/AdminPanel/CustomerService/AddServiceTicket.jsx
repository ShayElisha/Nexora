import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X, ArrowLeft } from "lucide-react";

const AddServiceTicket = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    customerId: "",
    category: "Technical",
    priority: "Medium",
    status: "Open",
    assignedTo: "",
    tags: [],
    notes: "",
  });

  const { data: ticket } = useQuery({
    queryKey: ["service-ticket", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/customer-service/tickets/${id}`);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers");
      return res.data.data || [];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees");
      return res.data.data || [];
    },
  });

  useEffect(() => {
    if (ticket && isEdit) {
      setFormData({
        title: ticket.title || "",
        description: ticket.description || "",
        customerId: ticket.customerId?._id || "",
        category: ticket.category || "Technical",
        priority: ticket.priority || "Medium",
        status: ticket.status || "Open",
        assignedTo: ticket.assignedTo?._id || "",
        tags: ticket.tags || [],
        notes: ticket.notes || "",
      });
    }
  }, [ticket, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return axiosInstance.put(`/customer-service/tickets/${id}`, data);
      }
      return axiosInstance.post("/customer-service/tickets", data);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("customerService.ticket_updated") || "Ticket updated successfully"
          : t("customerService.ticket_created") || "Ticket created successfully"
      );
      queryClient.invalidateQueries(["service-tickets"]);
      navigate("/dashboard/customer-service/tickets");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Operation failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate("/dashboard/customer-service/tickets")}
            className="flex items-center gap-2 mb-4 text-sm hover:underline"
            style={{ color: "var(--color-secondary)" }}
          >
            <ArrowLeft size={18} />
            {t("common.back") || "Back"}
          </button>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {isEdit
              ? t("customerService.edit_ticket") || "Edit Service Ticket"
              : t("customerService.add_ticket") || "Add Service Ticket"}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
            {isEdit
              ? t("customerService.update_ticket_desc") || "Update ticket details"
              : t("customerService.create_ticket_desc") || "Create a new service ticket"}
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.form
          onSubmit={handleSubmit}
          className="rounded-2xl shadow-lg border p-6 md:p-8"
          style={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b" style={{ color: "var(--text-color)", borderColor: "var(--border-color)" }}>
              {t("customerService.basic_information") || "Basic Information"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("customerService.title") || "Title"} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder={t("customerService.enter_title") || "Enter ticket title"}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("customerService.customer") || "Customer"} *
                </label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="">{t("customerService.select_customer") || "Select Customer"}</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("customerService.category") || "Category"} *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="Technical">{t("customerService.technical") || "Technical"}</option>
                  <option value="Billing">{t("customerService.billing") || "Billing"}</option>
                  <option value="Sales">{t("customerService.sales") || "Sales"}</option>
                  <option value="Support">{t("customerService.support") || "Support"}</option>
                  <option value="Other">{t("customerService.other") || "Other"}</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("customerService.priority") || "Priority"} *
                </label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="Low">{t("customerService.low") || "Low"}</option>
                  <option value="Medium">{t("customerService.medium") || "Medium"}</option>
                  <option value="High">{t("customerService.high") || "High"}</option>
                  <option value="Urgent">{t("customerService.urgent") || "Urgent"}</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("customerService.status") || "Status"} *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="Open">{t("customerService.open") || "Open"}</option>
                  <option value="In Progress">{t("customerService.in_progress") || "In Progress"}</option>
                  <option value="Waiting for Customer">{t("customerService.waiting_for_customer") || "Waiting for Customer"}</option>
                  <option value="Resolved">{t("customerService.resolved") || "Resolved"}</option>
                  <option value="Closed">{t("customerService.closed") || "Closed"}</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("customerService.assigned_to") || "Assigned To"}
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  <option value="">{t("customerService.unassigned") || "Unassigned"}</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b" style={{ color: "var(--text-color)", borderColor: "var(--border-color)" }}>
              {t("customerService.ticket_details") || "Ticket Details"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("customerService.description") || "Description"} *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  rows={5}
                  placeholder={t("customerService.enter_description") || "Enter ticket description..."}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: "var(--text-color)" }}>
                  {t("customerService.notes") || "Notes"}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  rows={3}
                  placeholder={t("customerService.enter_notes") || "Enter any additional notes..."}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t" style={{ borderColor: "var(--border-color)" }}>
            <motion.button
              type="submit"
              disabled={mutation.isLoading}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--button-bg)",
                color: "var(--button-text)",
              }}
              whileHover={{ scale: mutation.isLoading ? 1 : 1.02 }}
              whileTap={{ scale: mutation.isLoading ? 1 : 0.98 }}
            >
              <Save size={20} />
              {mutation.isLoading
                ? t("common.saving") || "Saving..."
                : t("customerService.save") || "Save"}
            </motion.button>
            <motion.button
              type="button"
              onClick={() => navigate("/dashboard/customer-service/tickets")}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl border shadow-md hover:shadow-lg transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--surface-color)",
                color: "var(--text-color)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X size={20} />
              {t("customerService.cancel") || "Cancel"}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AddServiceTicket;
