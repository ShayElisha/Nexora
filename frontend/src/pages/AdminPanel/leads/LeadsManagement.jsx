import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  Eye,
  Loader2,
  AlertCircle,
  Tag,
  Target,
  Clock,
  X,
  MapPin,
  Globe,
  Briefcase,
  User,
  CheckCircle,
  MessageSquare,
  ShoppingCart,
} from "lucide-react";

const LeadsManagement = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [viewMode, setViewMode] = useState("pipeline"); // pipeline or list
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    website: "",
    industry: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    status: "New",
    source: "Other",
    estimatedValue: 0,
    currency: "ILS",
    probability: 10,
    expectedCloseDate: "",
    leadScore: 0,
    assignedTo: "",
    tags: [],
    notes: "",
    preferredContactMethod: "Email",
    nextFollowUp: "",
    // Order fields
    orderItems: [],
    deliveryDate: "",
    globalDiscount: 0,
    taxRate: 0,
    orderNotes: "",
  });
  const [tagInput, setTagInput] = useState("");

  // Fetch products for order items
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/inventory/productsInfo");
        return res.data?.data?.products || [];
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
  });

  // Fetch leads
  const {
    data: leads = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["leads", statusFilter, sourceFilter, searchTerm],
    queryFn: async () => {
      try {
        const params = {};
        if (statusFilter !== "all") params.status = statusFilter;
        if (sourceFilter !== "all") params.source = sourceFilter;
        if (searchTerm) params.search = searchTerm;
        const res = await axiosInstance.get("/leads", { params });
        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch leads");
        }
        return res.data.data || [];
      } catch (err) {
        console.error("Error fetching leads:", err);
        throw err;
      }
    },
    onError: (err) => {
      console.error("Leads query error:", err);
      toast.error(err.response?.data?.message || t("leads.error_loading") || "Error loading leads");
    },
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ["leadsStatistics"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/leads/statistics");
        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch statistics");
        }
        return res.data.data || {};
      } catch (err) {
        console.error("Error fetching statistics:", err);
        return {};
      }
    },
  });

  // Delete lead
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leads"]);
      queryClient.invalidateQueries(["leadsStatistics"]);
      toast.success(t("leads.deleted_success") || "Lead deleted successfully");
    },
    onError: () => {
      toast.error(t("leads.deleted_error") || "Failed to delete lead");
    },
  });

  // Update lead
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await axiosInstance.put(`/leads/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leads"]);
      queryClient.invalidateQueries(["leadsStatistics"]);
      toast.success(t("leads.updated_success") || "Lead updated successfully");
      setShowEditModal(false);
      setEditingLead(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("leads.updated_error") || "Failed to update lead");
    },
  });

  // Update lead status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await axiosInstance.put(`/leads/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leads"]);
      queryClient.invalidateQueries(["leadsStatistics"]);
      toast.success(t("leads.status_updated") || "Status updated");
    },
    onError: () => {
      toast.error(t("leads.status_update_error") || "Failed to update status");
    },
  });

  // Convert to customer
  const convertMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.post(`/leads/${id}/convert`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leads"]);
      queryClient.invalidateQueries(["customers"]);
      toast.success(t("leads.converted_success") || "Lead converted to customer");
      setShowLeadModal(false);
    },
    onError: () => {
      toast.error(t("leads.converted_error") || "Failed to convert lead");
    },
  });

  // Create order from lead manually
  const createOrderMutation = useMutation({
    mutationFn: async (leadId) => {
      const res = await axiosInstance.post(`/leads/${leadId}/create-order`);
      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to create order");
      }
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["leads"]);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["finance"]);
      toast.success(t("leads.order_created_success") || `Order created successfully! Order ID: ${data.data?.orderId}`);
      setShowLeadModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("leads.order_created_error") || "Failed to create order");
    },
  });

  // Create new lead
  const createLeadMutation = useMutation({
    mutationFn: async (leadData) => {
      const res = await axiosInstance.post("/leads", leadData);
      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to create lead");
      }
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leads"]);
      queryClient.invalidateQueries(["leadsStatistics"]);
      toast.success(t("leads.created_success") || "Lead created successfully");
      setShowAddModal(false);
      setNewLead({
        name: "",
        email: "",
        phone: "",
        company: "",
        position: "",
        website: "",
        industry: "",
        address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
        status: "New",
        source: "Other",
        estimatedValue: 0,
        currency: "ILS",
        probability: 10,
        expectedCloseDate: "",
        leadScore: 0,
        assignedTo: "",
        tags: [],
        notes: "",
        preferredContactMethod: "Email",
        nextFollowUp: "",
        // Order fields
        orderItems: [],
        deliveryDate: "",
        globalDiscount: 0,
        taxRate: 0,
        orderNotes: "",
        paymentTerms: "Net 30",
      });
      setTagInput("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("leads.created_error") || "Failed to create lead");
    },
  });

  const handleLeadChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setNewLead((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setNewLead((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newLead.tags.includes(tagInput.trim())) {
      setNewLead((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewLead((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      New: { bg: "rgba(59, 130, 246, 0.1)", text: "rgb(59, 130, 246)" },
      Contacted: { bg: "rgba(139, 92, 246, 0.1)", text: "rgb(139, 92, 246)" },
      Qualified: { bg: "rgba(16, 185, 129, 0.1)", text: "rgb(16, 185, 129)" },
      Proposal: { bg: "rgba(245, 158, 11, 0.1)", text: "rgb(245, 158, 11)" },
      Negotiation: { bg: "rgba(236, 72, 153, 0.1)", text: "rgb(236, 72, 153)" },
      "Closed Won": { bg: "rgba(16, 185, 129, 0.1)", text: "rgb(16, 185, 129)" },
      "Closed Lost": { bg: "rgba(239, 68, 68, 0.1)", text: "rgb(239, 68, 68)" },
    };
    return colors[status] || { bg: "rgba(107, 114, 128, 0.1)", text: "rgb(107, 114, 128)" };
  };

  const handleSubmitLead = (e) => {
    e.preventDefault();
    if (!newLead.name || !newLead.email) {
      toast.error(t("leads.name_email_required") || "Name and email are required");
      return;
    }
    
    // Prepare data for API - convert empty strings to null/undefined for optional fields
    const leadData = {
      ...newLead,
      phone: newLead.phone || undefined,
      company: newLead.company || undefined,
      position: newLead.position || undefined,
      website: newLead.website || undefined,
      industry: newLead.industry || undefined,
      address: Object.values(newLead.address).some(v => v) ? newLead.address : undefined,
      expectedCloseDate: newLead.expectedCloseDate || undefined,
      nextFollowUp: newLead.nextFollowUp || undefined,
      assignedTo: newLead.assignedTo || undefined,
      tags: newLead.tags.length > 0 ? newLead.tags : undefined,
      notes: newLead.notes || undefined,
      // Order fields
      orderItems: newLead.orderItems && newLead.orderItems.length > 0 ? newLead.orderItems.filter(item => item.product) : undefined,
      deliveryDate: newLead.deliveryDate || undefined,
      globalDiscount: newLead.globalDiscount || 0,
      taxRate: newLead.taxRate || 0,
      orderNotes: newLead.orderNotes || undefined,
      paymentTerms: newLead.paymentTerms || "Net 30",
    };
    
    createLeadMutation.mutate(leadData);
  };

  const pipelineStages = [
    { id: "New", label: t("leads.stage_new") || "New", color: "bg-gray-500" },
    {
      id: "Contacted",
      label: t("leads.stage_contacted") || "Contacted",
      color: "bg-blue-500",
    },
    {
      id: "Qualified",
      label: t("leads.stage_qualified") || "Qualified",
      color: "bg-yellow-500",
    },
    {
      id: "Proposal",
      label: t("leads.stage_proposal") || "Proposal",
      color: "bg-orange-500",
    },
    {
      id: "Negotiation",
      label: t("leads.stage_negotiation") || "Negotiation",
      color: "bg-purple-500",
    },
    {
      id: "Closed Won",
      label: t("leads.stage_won") || "Closed Won",
      color: "bg-green-500",
    },
    {
      id: "Closed Lost",
      label: t("leads.stage_lost") || "Closed Lost",
      color: "bg-red-500",
    },
  ];

  const filteredLeads = leads.filter((lead) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.company?.toLowerCase().includes(searchLower) ||
        lead.phone?.includes(searchTerm)
      );
    }
    return true;
  });

  const leadsByStage = pipelineStages.reduce((acc, stage) => {
    acc[stage.id] = filteredLeads.filter((lead) => lead.status === stage.id);
    return acc;
  }, {});

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
          <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-primary)" }} />
          <p style={{ color: "var(--text-color)" }}>
            {t("leads.loading") || "Loading leads..."}
          </p>
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
          <p className="text-red-500 font-medium text-lg mb-2">
            {t("leads.error_loading") || "Error loading leads"}
          </p>
          <p className="text-red-400 text-sm">
            {error?.response?.data?.message || error?.message || "Please check your connection and try again"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {t("leads.reload") || "Reload Page"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Target size={28} color="white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                  {t("leads.title") || "Leads Management"}
                </h1>
                <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                  {t("leads.subtitle") || "Manage and track your sales pipeline"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
            >
              <Plus size={20} />
              {t("leads.add_lead") || "Add Lead"}
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div
              className="bg-bg rounded-xl p-4 shadow-lg border border-border-color"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                    {t("leads.total_leads") || "Total Leads"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {statistics?.totalLeads || leads.length}
                  </p>
                </div>
                <Users className="text-blue-500" size={32} />
              </div>
            </div>
            <div
              className="bg-bg rounded-xl p-4 shadow-lg border border-border-color"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                    {t("leads.total_value") || "Total Value"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    ₪{statistics?.totalValue?.toLocaleString() || 0}
                  </p>
                </div>
                <DollarSign className="text-green-500" size={32} />
              </div>
            </div>
            <div
              className="bg-bg rounded-xl p-4 shadow-lg border border-border-color"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                    {t("leads.new_leads") || "New Leads"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {leadsByStage["New"]?.length || 0}
                  </p>
                </div>
                <TrendingUp className="text-orange-500" size={32} />
              </div>
            </div>
            <div
              className="bg-bg rounded-xl p-4 shadow-lg border border-border-color"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                    {t("leads.won_leads") || "Won"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {leadsByStage["Closed Won"]?.length || 0}
                  </p>
                </div>
                <UserCheck className="text-green-500" size={32} />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  size={20}
                  style={{ color: "var(--color-secondary)" }}
                />
                <input
                  type="text"
                  placeholder={t("leads.search_placeholder") || "Search leads..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("leads.all_statuses") || "All Statuses"}</option>
              {pipelineStages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("leads.all_sources") || "All Sources"}</option>
              <option value="Website">{t("leads.source_website") || "Website"}</option>
              <option value="Referral">{t("leads.source_referral") || "Referral"}</option>
              <option value="Social Media">{t("leads.source_social") || "Social Media"}</option>
              <option value="Email Campaign">{t("leads.source_email") || "Email Campaign"}</option>
              <option value="Trade Show">{t("leads.source_tradeshow") || "Trade Show"}</option>
              <option value="Cold Call">{t("leads.source_coldcall") || "Cold Call"}</option>
              <option value="Partner">{t("leads.source_partner") || "Partner"}</option>
              <option value="Other">{t("leads.source_other") || "Other"}</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("pipeline")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === "pipeline"
                    ? "bg-blue-500 text-white"
                    : "bg-bg-secondary text-text-secondary"
                }`}
                style={
                  viewMode === "pipeline"
                    ? {}
                    : {
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--color-secondary)",
                      }
                }
              >
                {t("leads.pipeline_view") || "Pipeline"}
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-blue-500 text-white"
                    : "bg-bg-secondary text-text-secondary"
                }`}
                style={
                  viewMode === "list"
                    ? {}
                    : {
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--color-secondary)",
                      }
                }
              >
                {t("leads.list_view") || "List"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* No Leads Message */}
        {!isLoading && !isError && filteredLeads.length === 0 && (
          <div className="bg-bg rounded-xl p-12 text-center shadow-lg border border-border-color" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
            <Users size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
            <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
              {t("leads.no_leads") || "No Leads Found"}
            </h3>
            <p className="mb-6" style={{ color: "var(--color-secondary)" }}>
              {t("leads.no_leads_message") || "Start by adding your first lead to track your sales pipeline"}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
            >
              <Plus size={20} className="inline mr-2" />
              {t("leads.add_lead") || "Add Lead"}
            </button>
          </div>
        )}

        {/* Pipeline View */}
        {viewMode === "pipeline" && filteredLeads.length > 0 && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {pipelineStages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex-shrink-0 w-80"
                  style={{ direction: isRTL ? "rtl" : "ltr" }}
                >
                  <div
                    className="bg-bg rounded-xl p-4 shadow-lg border border-border-color mb-4"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                        <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                          {stage.label}
                        </h3>
                      </div>
                      <span
                        className="px-2 py-1 rounded-lg text-sm font-medium"
                        style={{
                          backgroundColor: "var(--bg-color)",
                          color: "var(--text-color)",
                        }}
                      >
                        {leadsByStage[stage.id]?.length || 0}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {leadsByStage[stage.id]?.map((lead) => (
                      <motion.div
                        key={lead._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowLeadModal(true);
                        }}
                        className="bg-bg rounded-xl p-4 shadow-md border border-border-color cursor-pointer hover:shadow-lg transition-all"
                        style={{
                          backgroundColor: "var(--bg-color)",
                          borderColor: "var(--border-color)",
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1" style={{ color: "var(--text-color)" }}>
                              {lead.name}
                            </h4>
                            {lead.company && (
                              <p className="text-sm flex items-center gap-1 mb-1" style={{ color: "var(--color-secondary)" }}>
                                <Building size={14} />
                                {lead.company}
                              </p>
                            )}
                          </div>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Show dropdown menu
                              }}
                              className="p-1 rounded hover:bg-bg-secondary"
                            >
                              <MoreVertical size={16} style={{ color: "var(--text-color)" }} />
                            </button>
                          </div>
                        </div>
                        {lead.email && (
                          <p className="text-sm flex items-center gap-1 mb-1" style={{ color: "var(--color-secondary)" }}>
                            <Mail size={14} />
                            {lead.email}
                          </p>
                        )}
                        {lead.estimatedValue > 0 && (
                          <p className="text-sm font-semibold flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                            <DollarSign size={14} />
                            ₪{lead.estimatedValue.toLocaleString()}
                          </p>
                        )}
                        {lead.probability > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span style={{ color: "var(--color-secondary)" }}>
                                {t("leads.probability") || "Probability"}
                              </span>
                              <span style={{ color: "var(--text-color)" }}>{lead.probability}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full" style={{ backgroundColor: "var(--bg-secondary)" }}>
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${lead.probability}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && filteredLeads.length > 0 && (
          <div className="bg-bg rounded-xl shadow-lg border border-border-color overflow-hidden" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <th className="px-6 py-4 text-right font-semibold" style={{ color: "var(--text-color)" }}>
                      {t("leads.name") || "Name"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold" style={{ color: "var(--text-color)" }}>
                      {t("leads.company") || "Company"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold" style={{ color: "var(--text-color)" }}>
                      {t("leads.email") || "Email"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold" style={{ color: "var(--text-color)" }}>
                      {t("leads.status") || "Status"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold" style={{ color: "var(--text-color)" }}>
                      {t("leads.source") || "Source"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold" style={{ color: "var(--text-color)" }}>
                      {t("leads.value") || "Value"}
                    </th>
                    <th className="px-6 py-4 text-right font-semibold" style={{ color: "var(--text-color)" }}>
                      {t("leads.actions") || "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead._id}
                      className="hover:bg-bg-secondary transition-colors"
                      style={{ borderBottom: "1px solid var(--border-color)" }}
                    >
                      <td className="px-6 py-4" style={{ color: "var(--text-color)" }}>
                        {lead.name}
                      </td>
                      <td className="px-6 py-4" style={{ color: "var(--text-color)" }}>
                        {lead.company || "-"}
                      </td>
                      <td className="px-6 py-4" style={{ color: "var(--text-color)" }}>
                        {lead.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-lg text-sm font-medium"
                          style={{
                            backgroundColor: pipelineStages.find((s) => s.id === lead.status)?.color || "bg-gray-500",
                            color: "white",
                          }}
                        >
                          {pipelineStages.find((s) => s.id === lead.status)?.label || lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ color: "var(--text-color)" }}>
                        {lead.source || "-"}
                      </td>
                      <td className="px-6 py-4 font-semibold" style={{ color: "var(--color-primary)" }}>
                        ₪{lead.estimatedValue?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowLeadModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
                          >
                            <Eye size={16} style={{ color: "var(--text-color)" }} />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(lead._id)}
                            className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-bg rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-color)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                  {t("leads.add_lead") || "Add New Lead"}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-text-secondary hover:text-text text-2xl"
                  style={{ color: "var(--color-secondary)" }}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitLead} className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                    <User size={20} />
                    {t("leads.basic_info") || "Basic Information"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.name") || "Name"} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newLead.name}
                        onChange={handleLeadChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.email") || "Email"} *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={newLead.email}
                        onChange={handleLeadChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.phone") || "Phone"}
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={newLead.phone}
                        onChange={handleLeadChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.company") || "Company"}
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={newLead.company}
                        onChange={handleLeadChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.position") || "Position"}
                      </label>
                      <input
                        type="text"
                        name="position"
                        value={newLead.position}
                        onChange={handleLeadChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.website") || "Website"}
                      </label>
                      <input
                        type="text"
                        name="website"
                        value={newLead.website}
                        onChange={handleLeadChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.industry") || "Industry"}
                      </label>
                      <input
                        type="text"
                        name="industry"
                        value={newLead.industry}
                        onChange={handleLeadChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pipeline Info */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                    <Target size={20} />
                    {t("leads.pipeline_info") || "Pipeline Information"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.status") || "Status"}
                      </label>
                      <select
                        name="status"
                        value={newLead.status}
                        onChange={handleLeadChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      >
                        {pipelineStages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.source") || "Source"}
                      </label>
                      <select
                        name="source"
                        value={newLead.source}
                        onChange={handleLeadChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      >
                        <option value="Website">{t("leads.source_website") || "Website"}</option>
                        <option value="Referral">{t("leads.source_referral") || "Referral"}</option>
                        <option value="Social Media">{t("leads.source_social") || "Social Media"}</option>
                        <option value="Email Campaign">{t("leads.source_email") || "Email Campaign"}</option>
                        <option value="Trade Show">{t("leads.source_tradeshow") || "Trade Show"}</option>
                        <option value="Cold Call">{t("leads.source_coldcall") || "Cold Call"}</option>
                        <option value="Partner">{t("leads.source_partner") || "Partner"}</option>
                        <option value="Other">{t("leads.source_other") || "Other"}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.estimated_value") || "Estimated Value"}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          name="estimatedValue"
                          value={newLead.estimatedValue}
                          onChange={handleLeadChange}
                          min="0"
                          step="0.01"
                          className="flex-1 p-3 rounded-xl border focus:outline-none focus:ring-2"
                          style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-color)",
                          }}
                        />
                        <select
                          name="currency"
                          value={newLead.currency}
                          onChange={handleLeadChange}
                          className="w-24 p-3 rounded-xl border focus:outline-none focus:ring-2"
                          style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-color)",
                          }}
                        >
                          <option value="ILS">ILS</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.probability") || "Probability"} (%)
                      </label>
                      <input
                        type="number"
                        name="probability"
                        value={newLead.probability}
                        onChange={handleLeadChange}
                        min="0"
                        max="100"
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.expected_close_date") || "Expected Close Date"}
                      </label>
                      <input
                        type="date"
                        name="expectedCloseDate"
                        value={newLead.expectedCloseDate}
                        onChange={handleLeadChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.next_follow_up") || "Next Follow Up"}
                      </label>
                      <input
                        type="date"
                        name="nextFollowUp"
                        value={newLead.nextFollowUp}
                        onChange={handleLeadChange}
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("leads.tags") || "Tags"}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-color)",
                      }}
                      placeholder={t("leads.add_tag") || "Add tag and press Enter"}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-3 rounded-xl font-medium"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        color: "white",
                      }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newLead.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-lg text-sm flex items-center gap-2"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                    <MessageSquare className="inline mr-2" size={16} />
                    {t("leads.notes") || "Notes"}
                  </label>
                  <textarea
                    name="notes"
                    value={newLead.notes}
                    onChange={handleLeadChange}
                    rows="4"
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-color)",
                    }}
                    placeholder={t("leads.enter_notes") || "Enter notes..."}
                  />
                </div>

                {/* Order Information Section */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                    <ShoppingCart size={20} />
                    {t("leads.order_information") || "Order Information"}
                  </h3>
                  
                  {/* Delivery Date */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("leads.delivery_date") || "Delivery Date"}
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={newLead.deliveryDate}
                      onChange={handleLeadChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("leads.order_items") || "Order Items"}
                    </label>
                    {newLead.orderItems.map((item, index) => (
                      <div key={index} className="mb-4 p-4 rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-color)" }}>
                              {t("leads.product") || "Product"}
                            </label>
                            <select
                              value={item.product || ""}
                              onChange={(e) => {
                                const updatedItems = [...newLead.orderItems];
                                updatedItems[index].product = e.target.value;
                                const selectedProduct = products.find(p => p._id === e.target.value);
                                if (selectedProduct) {
                                  updatedItems[index].unitPrice = selectedProduct.unitPrice || 0;
                                }
                                setNewLead((prev) => ({ ...prev, orderItems: updatedItems }));
                              }}
                              className="w-full p-2 rounded-lg border text-sm"
                              style={{
                                borderColor: "var(--border-color)",
                                backgroundColor: "var(--bg-color)",
                                color: "var(--text-color)",
                              }}
                            >
                              <option value="">{t("leads.select_product") || "Select Product"}</option>
                              {products.map((product) => (
                                <option key={product._id} value={product._id}>
                                  {product.productName || product.name} - ₪{product.unitPrice || 0}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-color)" }}>
                              {t("leads.quantity") || "Quantity"}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity || 1}
                              onChange={(e) => {
                                const updatedItems = [...newLead.orderItems];
                                updatedItems[index].quantity = Number(e.target.value);
                                setNewLead((prev) => ({ ...prev, orderItems: updatedItems }));
                              }}
                              className="w-full p-2 rounded-lg border text-sm"
                              style={{
                                borderColor: "var(--border-color)",
                                backgroundColor: "var(--bg-color)",
                                color: "var(--text-color)",
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-color)" }}>
                              {t("leads.unit_price") || "Unit Price"}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice || 0}
                              onChange={(e) => {
                                const updatedItems = [...newLead.orderItems];
                                updatedItems[index].unitPrice = Number(e.target.value);
                                setNewLead((prev) => ({ ...prev, orderItems: updatedItems }));
                              }}
                              className="w-full p-2 rounded-lg border text-sm"
                              style={{
                                borderColor: "var(--border-color)",
                                backgroundColor: "var(--bg-color)",
                                color: "var(--text-color)",
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-color)" }}>
                              {t("leads.discount") || "Discount"} (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount || 0}
                              onChange={(e) => {
                                const updatedItems = [...newLead.orderItems];
                                updatedItems[index].discount = Number(e.target.value);
                                setNewLead((prev) => ({ ...prev, orderItems: updatedItems }));
                              }}
                              className="w-full p-2 rounded-lg border text-sm"
                              style={{
                                borderColor: "var(--border-color)",
                                backgroundColor: "var(--bg-color)",
                                color: "var(--text-color)",
                              }}
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedItems = newLead.orderItems.filter((_, i) => i !== index);
                                setNewLead((prev) => ({ ...prev, orderItems: updatedItems }));
                              }}
                              className="w-full p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              style={{ color: "var(--color-danger)" }}
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setNewLead((prev) => ({
                          ...prev,
                          orderItems: [...prev.orderItems, { product: "", quantity: 1, unitPrice: 0, discount: 0, notes: "" }],
                        }));
                      }}
                      className="w-full p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 hover:border-solid transition-all"
                      style={{
                        borderColor: "var(--border-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <Plus size={20} />
                      {t("leads.add_order_item") || "Add Order Item"}
                    </button>
                  </div>

                  {/* Global Discount and Tax Rate */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.global_discount") || "Global Discount"} (%)
                      </label>
                      <input
                        type="number"
                        name="globalDiscount"
                        value={newLead.globalDiscount}
                        onChange={handleLeadChange}
                        min="0"
                        max="100"
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.tax_rate") || "Tax Rate"} (%)
                      </label>
                      <input
                        type="number"
                        name="taxRate"
                        value={newLead.taxRate}
                        onChange={handleLeadChange}
                        min="0"
                        max="100"
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Payment Terms */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("leads.payment_terms") || "Payment Terms"}
                    </label>
                    <select
                      name="paymentTerms"
                      value={newLead.paymentTerms}
                      onChange={handleLeadChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="Immediate">{t("leads.payment_immediate") || "Immediate Payment"}</option>
                      <option value="Net 30">{t("leads.payment_net_30") || "Net 30 Days"}</option>
                      <option value="Net 45">{t("leads.payment_net_45") || "Net 45 Days"}</option>
                      <option value="Net 60">{t("leads.payment_net_60") || "Net 60 Days"}</option>
                      <option value="Net 90">{t("leads.payment_net_90") || "Net 90 Days"}</option>
                    </select>
                  </div>

                  {/* Order Notes */}
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("leads.order_notes") || "Order Notes"}
                    </label>
                    <textarea
                      name="orderNotes"
                      value={newLead.orderNotes}
                      onChange={handleLeadChange}
                      rows="3"
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-color)",
                      }}
                      placeholder={t("leads.enter_order_notes") || "Enter order notes..."}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold border"
                    style={{
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    {t("leads.cancel") || "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={createLeadMutation.isPending}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {createLeadMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        {t("leads.creating") || "Creating..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        {t("leads.create") || "Create Lead"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-bg rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-color)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-color)" }}>
                    {selectedLead.name}
                  </h2>
                  {selectedLead.company && (
                    <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                      {selectedLead.company}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowLeadModal(false)}
                  className="text-text-secondary hover:text-text"
                  style={{ color: "var(--color-secondary)" }}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div
                  className="bg-bg-secondary rounded-xl p-4 border border-border-color"
                  style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
                >
                  <h3 className="font-semibold mb-3" style={{ color: "var(--text-color)" }}>
                    {t("leads.contact_info") || "Contact Information"}
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedLead.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={16} style={{ color: "var(--color-secondary)" }} />
                        <span style={{ color: "var(--text-color)" }}>{selectedLead.email}</span>
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} style={{ color: "var(--color-secondary)" }} />
                        <span style={{ color: "var(--text-color)" }}>{selectedLead.phone}</span>
                      </div>
                    )}
                    {selectedLead.website && (
                      <div className="flex items-center gap-2">
                        <Globe size={16} style={{ color: "var(--color-secondary)" }} />
                        <a
                          href={selectedLead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {selectedLead.website}
                        </a>
                      </div>
                    )}
                    {selectedLead.position && (
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} style={{ color: "var(--color-secondary)" }} />
                        <span style={{ color: "var(--text-color)" }}>{selectedLead.position}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="bg-bg-secondary rounded-xl p-4 border border-border-color"
                  style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
                >
                  <h3 className="font-semibold mb-3" style={{ color: "var(--text-color)" }}>
                    {t("leads.pipeline_info") || "Pipeline Information"}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--color-secondary)" }}>
                        {t("leads.status") || "Status"}:
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: getStatusColor(selectedLead.status).bg,
                          color: getStatusColor(selectedLead.status).text,
                        }}
                      >
                        {selectedLead.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--color-secondary)" }}>
                        {t("leads.source") || "Source"}:
                      </span>
                      <span style={{ color: "var(--text-color)" }}>{selectedLead.source}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--color-secondary)" }}>
                        {t("leads.probability") || "Probability"}:
                      </span>
                      <span style={{ color: "var(--text-color)" }}>{selectedLead.probability}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--color-secondary)" }}>
                        {t("leads.estimated_value") || "Estimated Value"}:
                      </span>
                      <span className="font-semibold" style={{ color: "var(--text-color)" }}>
                        {selectedLead.estimatedValue?.toLocaleString() || 0} {selectedLead.currency || "ILS"}
                      </span>
                    </div>
                    {selectedLead.expectedCloseDate && (
                      <div className="flex items-center justify-between">
                        <span style={{ color: "var(--color-secondary)" }}>
                          {t("leads.expected_close_date") || "Expected Close Date"}:
                        </span>
                        <span style={{ color: "var(--text-color)" }}>
                          {new Date(selectedLead.expectedCloseDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedLead.leadScore > 0 && (
                      <div className="flex items-center justify-between">
                        <span style={{ color: "var(--color-secondary)" }}>
                          {t("leads.lead_score") || "Lead Score"}:
                        </span>
                        <span style={{ color: "var(--text-color)" }}>{selectedLead.leadScore}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedLead.notes && (
                <div
                  className="bg-bg-secondary rounded-xl p-4 border border-border-color mb-6"
                  style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
                >
                  <h3 className="font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("leads.notes") || "Notes"}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--text-color)" }}>
                    {selectedLead.notes}
                  </p>
                </div>
              )}

              {selectedLead.tags && selectedLead.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("leads.tags") || "Tags"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLead.assignedTo && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("leads.assigned_to") || "Assigned To"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <User size={16} style={{ color: "var(--color-secondary)" }} />
                    <span style={{ color: "var(--text-color)" }}>
                      {selectedLead.assignedTo?.name || "Unassigned"}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 flex-wrap">
                <button
                  onClick={() => {
                    setShowLeadModal(false);
                    // Navigate to activities page with lead filter
                    navigate(`/dashboard/activities?leadId=${selectedLead._id}&relatedToType=Lead`);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all"
                >
                  {t("leads.view_activities") || "View Activities"}
                </button>
                <button
                  onClick={() => {
                    setEditingLead(selectedLead);
                    setShowLeadModal(false);
                    setShowEditModal(true);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold border"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                >
                  {t("leads.edit") || "Edit Lead"}
                </button>
                {/* Create Order Button - Show only if lead is Closed Won and has order items */}
                {selectedLead.status === "Closed Won" && 
                 selectedLead.orderItems && 
                 selectedLead.orderItems.length > 0 && 
                 !selectedLead.createdOrderId && (
                  <button
                    onClick={() => {
                      createOrderMutation.mutate(selectedLead._id);
                    }}
                    disabled={createOrderMutation.isPending}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        {t("leads.creating_order") || "Creating Order..."}
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={20} />
                        {t("leads.create_order") || "Create Order"}
                      </>
                    )}
                  </button>
                )}
                {/* Show order link if order already exists */}
                {selectedLead.createdOrderId && (
                  <button
                    onClick={() => {
                      navigate(`/dashboard/orders/${selectedLead.createdOrderId}`);
                    }}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={20} />
                    {t("leads.view_order") || "View Order"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {showEditModal && editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-bg rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-color)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                  {t("leads.edit_lead") || "Edit Lead"}
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingLead(null);
                  }}
                  className="text-text-secondary hover:text-text"
                  style={{ color: "var(--color-secondary)" }}
                >
                  <X size={24} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const leadData = {
                    ...editingLead,
                    phone: editingLead.phone || undefined,
                    company: editingLead.company || undefined,
                    position: editingLead.position || undefined,
                    website: editingLead.website || undefined,
                    industry: editingLead.industry || undefined,
                    address: Object.values(editingLead.address || {}).some((v) => v)
                      ? editingLead.address
                      : undefined,
                    expectedCloseDate: editingLead.expectedCloseDate || undefined,
                    nextFollowUp: editingLead.nextFollowUp || undefined,
                    assignedTo: editingLead.assignedTo?._id || editingLead.assignedTo || undefined,
                    tags: editingLead.tags?.length > 0 ? editingLead.tags : undefined,
                    notes: editingLead.notes || undefined,
                    // Order fields
                    orderItems: editingLead.orderItems || [],
                    deliveryDate: editingLead.deliveryDate || undefined,
                    globalDiscount: editingLead.globalDiscount || 0,
                    taxRate: editingLead.taxRate || 0,
                    orderNotes: editingLead.orderNotes || undefined,
                    paymentTerms: editingLead.paymentTerms || "Net 30",
                  };
                  updateLeadMutation.mutate({ id: editingLead._id, data: leadData });
                }}
                className="space-y-6"
              >
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                    {t("leads.basic_info") || "Basic Information"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.name") || "Name"} *
                      </label>
                      <input
                        type="text"
                        value={editingLead.name || ""}
                        onChange={(e) =>
                          setEditingLead({ ...editingLead, name: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border"
                        required
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.email") || "Email"} *
                      </label>
                      <input
                        type="email"
                        value={editingLead.email || ""}
                        onChange={(e) =>
                          setEditingLead({ ...editingLead, email: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border"
                        required
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.phone") || "Phone"}
                      </label>
                      <input
                        type="tel"
                        value={editingLead.phone || ""}
                        onChange={(e) =>
                          setEditingLead({ ...editingLead, phone: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.company") || "Company"}
                      </label>
                      <input
                        type="text"
                        value={editingLead.company || ""}
                        onChange={(e) =>
                          setEditingLead({ ...editingLead, company: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pipeline Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-color)" }}>
                    {t("leads.pipeline_info") || "Pipeline Information"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.status") || "Status"}
                      </label>
                      <select
                        value={editingLead.status || "New"}
                        onChange={(e) =>
                          setEditingLead({ ...editingLead, status: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      >
                        {pipelineStages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.source") || "Source"}
                      </label>
                      <select
                        value={editingLead.source || "Other"}
                        onChange={(e) =>
                          setEditingLead({ ...editingLead, source: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      >
                        <option value="Website">{t("leads.source_website") || "Website"}</option>
                        <option value="Referral">{t("leads.source_referral") || "Referral"}</option>
                        <option value="Social Media">{t("leads.source_social") || "Social Media"}</option>
                        <option value="Email Campaign">{t("leads.source_email") || "Email Campaign"}</option>
                        <option value="Trade Show">{t("leads.source_tradeshow") || "Trade Show"}</option>
                        <option value="Cold Call">{t("leads.source_coldcall") || "Cold Call"}</option>
                        <option value="Partner">{t("leads.source_partner") || "Partner"}</option>
                        <option value="Other">{t("leads.source_other") || "Other"}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.estimated_value") || "Estimated Value"}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editingLead.estimatedValue || 0}
                          onChange={(e) =>
                            setEditingLead({
                              ...editingLead,
                              estimatedValue: parseFloat(e.target.value) || 0,
                            })
                          }
                          min="0"
                          step="0.01"
                          className="flex-1 p-3 rounded-xl border"
                          style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-color)",
                          }}
                        />
                        <select
                          value={editingLead.currency || "ILS"}
                          onChange={(e) =>
                            setEditingLead({ ...editingLead, currency: e.target.value })
                          }
                          className="w-24 p-3 rounded-xl border"
                          style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-color)",
                          }}
                        >
                          <option value="ILS">ILS</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.probability") || "Probability"} (%)
                      </label>
                      <input
                        type="number"
                        value={editingLead.probability || 0}
                        onChange={(e) =>
                          setEditingLead({
                            ...editingLead,
                            probability: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        max="100"
                        className="w-full p-3 rounded-xl border"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("leads.notes") || "Notes"}
                  </label>
                  <textarea
                    value={editingLead.notes || ""}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, notes: e.target.value })
                    }
                    rows={4}
                    className="w-full p-3 rounded-xl border"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-color)",
                    }}
                  />
                </div>

                {/* Order Information Section */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                    <ShoppingCart size={20} />
                    {t("leads.order_information") || "Order Information"}
                  </h3>
                  
                  {/* Delivery Date */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("leads.delivery_date") || "Delivery Date"}
                    </label>
                    <input
                      type="date"
                      value={editingLead.deliveryDate ? new Date(editingLead.deliveryDate).toISOString().split('T')[0] : ""}
                      onChange={(e) => setEditingLead({ ...editingLead, deliveryDate: e.target.value })}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("leads.order_items") || "Order Items"}
                    </label>
                    {(editingLead.orderItems || []).map((item, index) => (
                      <div key={index} className="mb-4 p-4 rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-color)" }}>
                              {t("leads.product") || "Product"}
                            </label>
                            <select
                              value={item.product || ""}
                              onChange={(e) => {
                                const updatedItems = [...(editingLead.orderItems || [])];
                                updatedItems[index].product = e.target.value;
                                const selectedProduct = products.find(p => p._id === e.target.value);
                                if (selectedProduct) {
                                  updatedItems[index].unitPrice = selectedProduct.unitPrice || 0;
                                }
                                setEditingLead({ ...editingLead, orderItems: updatedItems });
                              }}
                              className="w-full p-2 rounded-lg border text-sm"
                              style={{
                                borderColor: "var(--border-color)",
                                backgroundColor: "var(--bg-color)",
                                color: "var(--text-color)",
                              }}
                            >
                              <option value="">{t("leads.select_product") || "Select Product"}</option>
                              {products.map((product) => (
                                <option key={product._id} value={product._id}>
                                  {product.productName || product.name} - ₪{product.unitPrice || 0}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-color)" }}>
                              {t("leads.quantity") || "Quantity"}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity || 1}
                              onChange={(e) => {
                                const updatedItems = [...(editingLead.orderItems || [])];
                                updatedItems[index].quantity = Number(e.target.value);
                                setEditingLead({ ...editingLead, orderItems: updatedItems });
                              }}
                              className="w-full p-2 rounded-lg border text-sm"
                              style={{
                                borderColor: "var(--border-color)",
                                backgroundColor: "var(--bg-color)",
                                color: "var(--text-color)",
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-color)" }}>
                              {t("leads.unit_price") || "Unit Price"}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice || 0}
                              onChange={(e) => {
                                const updatedItems = [...(editingLead.orderItems || [])];
                                updatedItems[index].unitPrice = Number(e.target.value);
                                setEditingLead({ ...editingLead, orderItems: updatedItems });
                              }}
                              className="w-full p-2 rounded-lg border text-sm"
                              style={{
                                borderColor: "var(--border-color)",
                                backgroundColor: "var(--bg-color)",
                                color: "var(--text-color)",
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-color)" }}>
                              {t("leads.discount") || "Discount"} (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount || 0}
                              onChange={(e) => {
                                const updatedItems = [...(editingLead.orderItems || [])];
                                updatedItems[index].discount = Number(e.target.value);
                                setEditingLead({ ...editingLead, orderItems: updatedItems });
                              }}
                              className="w-full p-2 rounded-lg border text-sm"
                              style={{
                                borderColor: "var(--border-color)",
                                backgroundColor: "var(--bg-color)",
                                color: "var(--text-color)",
                              }}
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedItems = (editingLead.orderItems || []).filter((_, i) => i !== index);
                                setEditingLead({ ...editingLead, orderItems: updatedItems });
                              }}
                              className="w-full p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              style={{ color: "var(--color-danger)" }}
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLead({
                          ...editingLead,
                          orderItems: [...(editingLead.orderItems || []), { product: "", quantity: 1, unitPrice: 0, discount: 0, notes: "" }],
                        });
                      }}
                      className="w-full p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 hover:border-solid transition-all"
                      style={{
                        borderColor: "var(--border-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <Plus size={20} />
                      {t("leads.add_order_item") || "Add Order Item"}
                    </button>
                  </div>

                  {/* Global Discount and Tax Rate */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.global_discount") || "Global Discount"} (%)
                      </label>
                      <input
                        type="number"
                        value={editingLead.globalDiscount || 0}
                        onChange={(e) => setEditingLead({ ...editingLead, globalDiscount: Number(e.target.value) })}
                        min="0"
                        max="100"
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("leads.tax_rate") || "Tax Rate"} (%)
                      </label>
                      <input
                        type="number"
                        value={editingLead.taxRate || 0}
                        onChange={(e) => setEditingLead({ ...editingLead, taxRate: Number(e.target.value) })}
                        min="0"
                        max="100"
                        className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-color)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Payment Terms */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("leads.payment_terms") || "Payment Terms"}
                    </label>
                    <select
                      value={editingLead.paymentTerms || "Net 30"}
                      onChange={(e) => setEditingLead({ ...editingLead, paymentTerms: e.target.value })}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="Immediate">{t("leads.payment_immediate") || "Immediate Payment"}</option>
                      <option value="Net 30">{t("leads.payment_net_30") || "Net 30 Days"}</option>
                      <option value="Net 45">{t("leads.payment_net_45") || "Net 45 Days"}</option>
                      <option value="Net 60">{t("leads.payment_net_60") || "Net 60 Days"}</option>
                      <option value="Net 90">{t("leads.payment_net_90") || "Net 90 Days"}</option>
                    </select>
                  </div>

                  {/* Order Notes */}
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("leads.order_notes") || "Order Notes"}
                    </label>
                    <textarea
                      value={editingLead.orderNotes || ""}
                      onChange={(e) => setEditingLead({ ...editingLead, orderNotes: e.target.value })}
                      rows="3"
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-color)",
                      }}
                      placeholder={t("leads.enter_order_notes") || "Enter order notes..."}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingLead(null);
                    }}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold border"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    {t("leads.cancel") || "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={updateLeadMutation.isLoading}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50"
                  >
                    {updateLeadMutation.isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        {t("leads.updating") || "Updating..."}
                      </span>
                    ) : (
                      t("leads.update") || "Update Lead"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsManagement;

