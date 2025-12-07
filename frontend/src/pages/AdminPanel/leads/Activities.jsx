import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  Activity,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  MessageSquare,
  Clock,
  User,
  Building,
  Loader2,
  AlertCircle,
  X,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Video,
  CheckCircle,
} from "lucide-react";

const Activities = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [relatedToType, setRelatedToType] = useState(searchParams.get("relatedToType") || "all");
  const [leadIdFilter, setLeadIdFilter] = useState(searchParams.get("leadId") || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Update filters from URL params
  useEffect(() => {
    const urlRelatedToType = searchParams.get("relatedToType");
    const urlLeadId = searchParams.get("leadId");
    if (urlRelatedToType) setRelatedToType(urlRelatedToType);
    if (urlLeadId) setLeadIdFilter(urlLeadId);
  }, [searchParams]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // list or timeline
  const [formData, setFormData] = useState({
    type: "Call",
    subject: "",
    description: "",
    relatedToType: "Lead",
    relatedToId: "",
    date: new Date().toISOString().slice(0, 16),
    duration: 0,
    outcome: "",
    nextAction: "",
    nextFollowUp: "",
    details: {},
  });

  // Fetch activities
  const {
    data: activities = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["activities", typeFilter, relatedToType, leadIdFilter, startDate, endDate],
    queryFn: async () => {
      try {
        const params = {};
        if (typeFilter !== "all") params.type = typeFilter;
        if (relatedToType !== "all") params.relatedToType = relatedToType;
        if (leadIdFilter && relatedToType === "Lead") params.leadId = leadIdFilter;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const res = await axiosInstance.get("/activities", { params });
        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch activities");
        }
        return res.data.data || [];
      } catch (err) {
        console.error("Error fetching activities:", err);
        throw err;
      }
    },
    onError: (err) => {
      console.error("Activities query error:", err);
      toast.error(err.response?.data?.message || t("activities.error_loading") || "Error loading activities");
    },
  });

  // Fetch leads for dropdown
  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await axiosInstance.get("/leads");
      return res.data.data || [];
    },
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers");
      return res.data.data || [];
    },
  });

  // Create activity
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/activities", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["activities"]);
      // Invalidate leads query to refresh lead status if it was updated
      queryClient.invalidateQueries(["leads"]);
      queryClient.invalidateQueries(["leadsStatistics"]);
      toast.success(t("activities.created_success") || "Activity created successfully");
      setShowAddModal(false);
      setFormData({
        type: "Call",
        subject: "",
        description: "",
        relatedToType: "Lead",
        relatedToId: "",
        date: new Date().toISOString().slice(0, 16),
        duration: 0,
        outcome: "",
        nextAction: "",
        nextFollowUp: "",
        details: {},
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("activities.created_error") || "Failed to create activity");
    },
  });

  // Delete activity
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["activities"]);
      toast.success(t("activities.deleted_success") || "Activity deleted successfully");
    },
    onError: () => {
      toast.error(t("activities.deleted_error") || "Failed to delete activity");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.relatedToId) {
      toast.error(t("activities.fill_required_fields") || "Please fill all required fields");
      return;
    }

    const activityData = {
      type: formData.type,
      subject: formData.subject,
      description: formData.description,
      relatedTo: {
        type: formData.relatedToType,
        ...(formData.relatedToType === "Lead" ? { leadId: formData.relatedToId } : { customerId: formData.relatedToId }),
      },
      date: formData.date,
      duration: parseInt(formData.duration) || 0,
      outcome: formData.outcome || undefined,
      nextAction: formData.nextAction || undefined,
      nextFollowUp: formData.nextFollowUp || undefined,
      details: formData.details,
    };

    createMutation.mutate(activityData);
  };

  const activityTypes = [
    { id: "Call", label: t("activities.type_call") || "Call", icon: Phone, color: "bg-blue-500" },
    { id: "Email", label: t("activities.type_email") || "Email", icon: Mail, color: "bg-green-500" },
    { id: "Meeting", label: t("activities.type_meeting") || "Meeting", icon: Calendar, color: "bg-purple-500" },
    { id: "Note", label: t("activities.type_note") || "Note", icon: FileText, color: "bg-yellow-500" },
    { id: "Task", label: t("activities.type_task") || "Task", icon: CheckSquare, color: "bg-orange-500" },
    { id: "SMS", label: t("activities.type_sms") || "SMS", icon: MessageSquare, color: "bg-pink-500" },
  ];

  const filteredActivities = activities.filter((activity) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        activity.subject?.toLowerCase().includes(searchLower) ||
        activity.description?.toLowerCase().includes(searchLower) ||
        activity.performedBy?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const stats = {
    total: activities.length,
    calls: activities.filter((a) => a.type === "Call").length,
    emails: activities.filter((a) => a.type === "Email").length,
    meetings: activities.filter((a) => a.type === "Meeting").length,
    notes: activities.filter((a) => a.type === "Note").length,
  };

  const getActivityIcon = (type) => {
    const activityType = activityTypes.find((t) => t.id === type);
    return activityType?.icon || Activity;
  };

  const getActivityColor = (type) => {
    const activityType = activityTypes.find((t) => t.id === type);
    return activityType?.color || "bg-gray-500";
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
          <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-primary)" }} />
          <p style={{ color: "var(--text-color)" }}>
            {t("activities.loading") || "Loading activities..."}
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
            {t("activities.error_loading") || "Error loading activities"}
          </p>
          <p className="text-red-400 text-sm">
            {error?.response?.data?.message || error?.message || "Please check your connection and try again"}
          </p>
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
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
                <Activity size={28} color="white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                  {t("activities.title") || "Activities"}
                </h1>
                <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                  {t("activities.subtitle") || "Track all interactions with leads and customers"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg"
            >
              <Plus size={20} />
              {t("activities.add_activity") || "Add Activity"}
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
                    {t("activities.total_activities") || "Total Activities"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.total}
                  </p>
                </div>
                <Activity className="text-purple-500" size={32} />
              </div>
            </div>
            <div
              className="bg-bg rounded-xl p-4 shadow-lg border border-border-color"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                    {t("activities.calls") || "Calls"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.calls}
                  </p>
                </div>
                <Phone className="text-blue-500" size={32} />
              </div>
            </div>
            <div
              className="bg-bg rounded-xl p-4 shadow-lg border border-border-color"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                    {t("activities.emails") || "Emails"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.emails}
                  </p>
                </div>
                <Mail className="text-green-500" size={32} />
              </div>
            </div>
            <div
              className="bg-bg rounded-xl p-4 shadow-lg border border-border-color"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                    {t("activities.meetings") || "Meetings"}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.meetings}
                  </p>
                </div>
                <Calendar className="text-purple-500" size={32} />
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
                  placeholder={t("activities.search_placeholder") || "Search activities..."}
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("activities.all_types") || "All Types"}</option>
              {activityTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
            <select
              value={relatedToType}
              onChange={(e) => {
                setRelatedToType(e.target.value);
                if (e.target.value === "all") {
                  setLeadIdFilter("");
                  setSearchParams({});
                }
              }}
              className="px-4 py-2 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("activities.all_related") || "All Related"}</option>
              <option value="Lead">{t("activities.leads") || "Leads"}</option>
              <option value="Customer">{t("activities.customers") || "Customers"}</option>
            </select>
            {relatedToType === "Lead" && leadIdFilter && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
                <span className="text-sm" style={{ color: "var(--text-color)" }}>
                  {t("activities.filtered_by_lead") || "Filtered by Lead"}
                </span>
                <button
                  onClick={() => {
                    setLeadIdFilter("");
                    setRelatedToType("all");
                    setSearchParams({});
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
              placeholder={t("activities.start_date") || "Start Date"}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 rounded-xl border"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
              placeholder={t("activities.end_date") || "End Date"}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-purple-500 text-white"
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
                {t("activities.list_view") || "List"}
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === "timeline"
                    ? "bg-purple-500 text-white"
                    : "bg-bg-secondary text-text-secondary"
                }`}
                style={
                  viewMode === "timeline"
                    ? {}
                    : {
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--color-secondary)",
                      }
                }
              >
                {t("activities.timeline_view") || "Timeline"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Activities List */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="bg-bg rounded-xl p-12 text-center shadow-lg border border-border-color" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
                <Activity size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
                <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("activities.no_activities") || "No Activities Found"}
                </h3>
                <p className="mb-6" style={{ color: "var(--color-secondary)" }}>
                  {t("activities.no_activities_message") || "Start by adding your first activity"}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg"
                >
                  <Plus size={20} className="inline mr-2" />
                  {t("activities.add_activity") || "Add Activity"}
                </button>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const color = getActivityColor(activity.type);
                return (
                  <motion.div
                    key={activity._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg rounded-xl p-6 shadow-lg border border-border-color hover:shadow-xl transition-all cursor-pointer"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setShowDetailsModal(true);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon size={24} color="white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-color)" }}>
                              {activity.subject}
                            </h3>
                            {activity.description && (
                              <p className="text-sm mb-2 line-clamp-2" style={{ color: "var(--color-secondary)" }}>
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate(activity._id);
                              }}
                              className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--color-secondary)" }}>
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{activity.performedBy?.name || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{format(new Date(activity.date), "dd/MM/yyyy HH:mm")}</span>
                          </div>
                          {activity.duration > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{activity.duration} {t("activities.minutes") || "minutes"}</span>
                            </div>
                          )}
                          {activity.relatedTo?.leadId && (
                            <div className="flex items-center gap-1">
                              <Building size={14} />
                              <span>{typeof activity.relatedTo.leadId === 'object' ? activity.relatedTo.leadId?.name : "Lead"}</span>
                            </div>
                          )}
                          {activity.relatedTo?.customerId && (
                            <div className="flex items-center gap-1">
                              <Building size={14} />
                              <span>{typeof activity.relatedTo.customerId === 'object' ? activity.relatedTo.customerId?.name : "Customer"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="bg-bg rounded-xl p-12 text-center shadow-lg border border-border-color" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
                <Activity size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
                <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
                  {t("activities.no_activities") || "No Activities Found"}
                </h3>
              </div>
            ) : (
              <div className="relative" style={{ direction: isRTL ? "rtl" : "ltr" }}>
                <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ backgroundColor: "var(--border-color)" }} />
                {filteredActivities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  const color = getActivityColor(activity.type);
                  return (
                    <motion.div
                      key={activity._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative pl-12 pb-8"
                    >
                      <div className={`absolute left-0 top-1 w-8 h-8 rounded-full ${color} flex items-center justify-center border-4`} style={{ borderColor: "var(--bg-color)" }}>
                        <Icon size={16} color="white" />
                      </div>
                      <div
                        className="bg-bg rounded-xl p-4 shadow-lg border border-border-color hover:shadow-xl transition-all cursor-pointer"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          borderColor: "var(--border-color)",
                        }}
                        onClick={() => {
                          setSelectedActivity(activity);
                          setShowDetailsModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold mb-1" style={{ color: "var(--text-color)" }}>
                              {activity.subject}
                            </h3>
                            <p className="text-sm mb-2" style={{ color: "var(--color-secondary)" }}>
                              {format(new Date(activity.date), "dd/MM/yyyy HH:mm")}
                            </p>
                            {activity.description && (
                              <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(activity._id);
                            }}
                            className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-bg rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-color)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                  {t("activities.add_activity") || "Add Activity"}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-text-secondary hover:text-text"
                  style={{ color: "var(--color-secondary)" }}
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("activities.type") || "Type"} *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border"
                    required
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    {activityTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("activities.subject") || "Subject"} *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border"
                    required
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                    placeholder={t("activities.subject_placeholder") || "Enter activity subject"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("activities.description") || "Description"}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border"
                    rows={4}
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                    placeholder={t("activities.description_placeholder") || "Enter activity description"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("activities.related_to") || "Related To"} *
                    </label>
                    <select
                      value={formData.relatedToType}
                      onChange={(e) => {
                        setFormData({ ...formData, relatedToType: e.target.value, relatedToId: "" });
                      }}
                      className="w-full px-4 py-2 rounded-xl border"
                      required
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="Lead">{t("activities.leads") || "Lead"}</option>
                      <option value="Customer">{t("activities.customers") || "Customer"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                      {formData.relatedToType === "Lead" ? t("activities.select_lead") || "Select Lead" : t("activities.select_customer") || "Select Customer"} *
                    </label>
                    <select
                      value={formData.relatedToId}
                      onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border"
                      required
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="">{t("activities.select") || "Select..."}</option>
                      {formData.relatedToType === "Lead"
                        ? leads.map((lead) => (
                            <option key={lead._id} value={lead._id}>
                              {lead.name} {lead.company ? `- ${lead.company}` : ""}
                            </option>
                          ))
                        : customers.map((customer) => (
                            <option key={customer._id} value={customer._id}>
                              {customer.name} {customer.company ? `- ${customer.company}` : ""}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("activities.date") || "Date"} *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border"
                      required
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("activities.duration") || "Duration"} ({t("activities.minutes") || "minutes"})
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border"
                      min="0"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("activities.outcome") || "Outcome"}
                  </label>
                  <select
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    <option value="">{t("activities.select_outcome") || "Select outcome..."}</option>
                    <option value="Successful">{t("activities.outcome_successful") || "Successful"}</option>
                    <option value="No Answer">{t("activities.outcome_no_answer") || "No Answer"}</option>
                    <option value="Busy">{t("activities.outcome_busy") || "Busy"}</option>
                    <option value="Left Message">{t("activities.outcome_left_message") || "Left Message"}</option>
                    <option value="Follow Up Required">{t("activities.outcome_follow_up") || "Follow Up Required"}</option>
                    <option value="Not Interested">{t("activities.outcome_not_interested") || "Not Interested"}</option>
                    <option value="Completed">{t("activities.outcome_completed") || "Completed"}</option>
                    <option value="Cancelled">{t("activities.outcome_cancelled") || "Cancelled"}</option>
                    <option value="Other">{t("activities.outcome_other") || "Other"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("activities.next_action") || "Next Action"}
                  </label>
                  <input
                    type="text"
                    value={formData.nextAction}
                    onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                    placeholder={t("activities.next_action_placeholder") || "What should be done next?"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                    {t("activities.next_follow_up") || "Next Follow Up"}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.nextFollowUp}
                    onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold border"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    {t("activities.cancel") || "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isLoading}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50"
                  >
                    {createMutation.isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        {t("activities.creating") || "Creating..."}
                      </span>
                    ) : (
                      t("activities.create") || "Create Activity"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Activity Details Modal */}
      {showDetailsModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-bg rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-color)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                  {selectedActivity.subject}
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-text-secondary hover:text-text"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--color-secondary)" }}>
                    {t("activities.type") || "Type"}
                  </p>
                  <p style={{ color: "var(--text-color)" }}>{selectedActivity.type}</p>
                </div>
                {selectedActivity.description && (
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: "var(--color-secondary)" }}>
                      {t("activities.description") || "Description"}
                    </p>
                    <p style={{ color: "var(--text-color)" }}>{selectedActivity.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--color-secondary)" }}>
                    {t("activities.date") || "Date"}
                  </p>
                  <p style={{ color: "var(--text-color)" }}>
                    {format(new Date(selectedActivity.date), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                {selectedActivity.duration > 0 && (
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: "var(--color-secondary)" }}>
                      {t("activities.duration") || "Duration"}
                    </p>
                    <p style={{ color: "var(--text-color)" }}>
                      {selectedActivity.duration} {t("activities.minutes") || "minutes"}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--color-secondary)" }}>
                    {t("activities.performed_by") || "Performed By"}
                  </p>
                  <p style={{ color: "var(--text-color)" }}>
                    {selectedActivity.performedBy?.name || "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;

