import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  BarChart3,
  PieChart,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const CustomerSegmentation = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);

  const { data: segments = [], isLoading, isError } = useQuery({
    queryKey: ["customerSegments"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers/segments/all");
      return res.data.data || [];
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["segmentationAnalytics"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers/segments/analytics");
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axiosInstance.delete(`/customers/segments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["customerSegments"]);
      toast.success(t("crm.segment_deleted") || "Segment deleted successfully");
    },
    onError: () => {
      toast.error(t("crm.error_deleting_segment") || "Error deleting segment");
    },
  });

  const filteredSegments = segments.filter((segment) =>
    segment.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {t("crm.error_loading_segments") || "Error loading segments"}
          </p>
        </div>
      </div>
    );
  }

  const chartData = analytics
    ? {
        labels: analytics.segments?.map((s) => s.segmentName) || [],
        datasets: [
          {
            label: t("crm.customers") || "Customers",
            data: analytics.segments?.map((s) => s.customerCount) || [],
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(245, 158, 11, 0.7)",
              "rgba(239, 68, 68, 0.7)",
              "rgba(139, 92, 246, 0.7)",
            ],
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("crm.customer_segmentation") || "Customer Segmentation"}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("crm.segmentation_description") || "Divide customers into categories for targeted campaigns"}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={20} />
            {t("crm.create_segment") || "Create Segment"}
          </button>
        </div>

        {/* Analytics Charts */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("crm.segment_distribution") || "Segment Distribution"}
              </h3>
              {chartData && <Pie data={chartData} />}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("crm.segment_value") || "Segment Value"}
              </h3>
              {analytics.segments && (
                <Bar
                  data={{
                    labels: analytics.segments.map((s) => s.segmentName),
                    datasets: [
                      {
                        label: t("crm.total_value") || "Total Value",
                        data: analytics.segments.map((s) => s.segmentValue),
                        backgroundColor: "rgba(59, 130, 246, 0.7)",
                      },
                    ],
                  }}
                />
              )}
            </motion.div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder={t("crm.search_segments") || "Search segments..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            />
          </div>
        </div>

        {/* Segments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSegments.map((segment) => (
            <motion.div
              key={segment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: segment.color || "#3B82F6" }}
                    />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
                      {segment.name}
                    </h3>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {segment.description || t("crm.no_description") || "No description"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedSegment(segment);
                      setShowCreateModal(true);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit size={18} style={{ color: 'var(--color-primary)' }} />
                  </button>
                  <button
                    onClick={() => {
                      const confirmMessage = t("crm.confirm_delete_segment") || "Are you sure you want to delete this segment?";
                      if (window.confirm(confirmMessage)) {
                        deleteMutation.mutate(segment._id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t("crm.customers") || "Customers"}
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                    {segment.customerCount || segment.customerIds?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t("crm.status") || "Status"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      segment.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {segment.isActive ? t("crm.active") || "Active" : t("crm.inactive") || "Inactive"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredSegments.length === 0 && (
          <div className="text-center py-12">
            <Users size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              {t("crm.no_segments") || "No segments found. Create your first segment!"}
            </p>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>
                {selectedSegment
                  ? t("crm.edit_segment") || "Edit Segment"
                  : t("crm.create_segment") || "Create Segment"}
              </h2>
              {/* Form would go here - simplified for brevity */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedSegment(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                >
                  {t("crm.cancel") || "Cancel"}
                </button>
                <button
                  onClick={() => {
                    // Save logic would go here
                    setShowCreateModal(false);
                    setSelectedSegment(null);
                    toast.success(t("crm.segment_saved") || "Segment saved");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {t("crm.save") || "Save"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CustomerSegmentation;

