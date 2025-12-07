import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { Save, X } from "lucide-react";

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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--text-color)" }}>
          {isEdit
            ? t("customerService.edit_ticket") || "Edit Service Ticket"
            : t("customerService.add_ticket") || "Add Service Ticket"}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block mb-2">{t("customerService.title") || "Title"} *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-2">{t("customerService.customer") || "Customer"} *</label>
              <select
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">{t("customerService.category") || "Category"} *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Technical">Technical</option>
                <option value="Billing">Billing</option>
                <option value="Sales">Sales</option>
                <option value="Support">Support</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">{t("customerService.priority") || "Priority"} *</label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">{t("customerService.status") || "Status"} *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting for Customer">Waiting for Customer</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">{t("customerService.assigned_to") || "Assigned To"}</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-2">{t("customerService.description") || "Description"} *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={5}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">{t("customerService.notes") || "Notes"}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={20} />
              {mutation.isLoading ? "Saving..." : t("customerService.save") || "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/customer-service/tickets")}
              className="flex items-center gap-2 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              <X size={20} />
              {t("customerService.cancel") || "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceTicket;

