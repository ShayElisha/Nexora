import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { toast } from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  ShoppingCart,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Search,
  Filter,
  TrendingUp,
  Package,
  DollarSign,
  AlertCircle,
  Building2,
  Calendar,
  Users
} from "lucide-react";

// Zustand Stores
import { useSupplierStore } from "../../../stores/useSupplierStore";
import { useSignatureStore } from "../../../stores/useSignatureStore";
import { useEmployeeStore } from "../../../stores/useEmployeeStore";
import { useProductStore } from "../../../stores/useProductStore";

const ProcurementProposals = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;

  // Fetch company details to get company name
  const { data: companyData } = useQuery({
    queryKey: ["companyDetails"],
    queryFn: async () => {
      const response = await axiosInstance.get("/company/get-company");
      return response.data.data;
    },
    enabled: !!authUser,
  });

  const companyName = companyData?.name || authUser?.company || "N/A";

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { suppliers, fetchSuppliers } = useSupplierStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const { signatureLists, fetchSignatureLists } = useSignatureStore();
  const { fetchProductsBySupplier } = useProductStore();

  useEffect(() => {
    fetchProposals();
    fetchSuppliers();
    fetchEmployees();
    fetchSignatureLists();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/proposals");
      setProposals(response.data.data);
    } catch (error) {
      toast.error(t("procurement.error_fetching_proposals"));
    } finally {
      setLoading(false);
    }
  };

  const { mutate: updateProposalMutation } = useMutation({
    mutationFn: async ({ proposalId, newStatus }) => {
      const response = await axiosInstance.put(`/proposals/${proposalId}`, { status: newStatus });
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("procurement.status_updated"));
      fetchProposals();
    },
    onError: (error) => {
      toast.error(t("procurement.update_status_failed"));
    },
  });

  const generatePDF = (proposal) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header with gradient
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(companyName, 15, 15);
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'normal');
    doc.text("PROCUREMENT PROPOSAL", 15, 25);
    
    // Info boxes
    let yPos = 55;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPos, 85, 30, 2, 2, 'S');
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text("SUPPLIER", 20, yPos + 7);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(proposal.supplierName || "N/A", 20, yPos + 14);
    
    doc.roundedRect(110, yPos, 85, 30, 2, 2, 'S');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text("STATUS", 115, yPos + 7);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text((proposal.status || "Pending").toUpperCase(), 115, yPos + 14);
    
    // Products table
    yPos = 95;
    const tableData = proposal.products?.map((p) => [
      p.productName || "N/A",
      p.quantity || 0,
      `${p.price || 0} ${proposal.currency || ""}`,
      `${p.totalCost || 0} ${proposal.currency || ""}`,
    ]) || [];

    doc.autoTable({
      startY: yPos,
      head: [[t("procurement.product"), t("procurement.quantity"), t("procurement.price"), t("procurement.total")]],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontStyle: 'bold',
      },
    });

    // Total
    const finalY = doc.autoTable.previous.finalY + 10;
    doc.setFillColor(37, 99, 235);
    doc.rect(pageWidth - 95, finalY, 80, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("TOTAL:", pageWidth - 90, finalY + 8);
    doc.text(`${proposal.totalCost?.toLocaleString()} ${proposal.currency}`, pageWidth - 20, finalY + 8, { align: 'right' });

    doc.save(`proposal_${proposal.PurchaseOrder || proposal._id}.pdf`);
    toast.success(t("procurement.pdf_downloaded"));
  };

  const filteredProposals = (proposals || []).filter((p) => {
    const matchesSearch =
      p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.PurchaseOrder?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: (proposals || []).length,
    pending: (proposals || []).filter(p => p.status === "pending").length,
    approved: (proposals || []).filter(p => p.status === "approved").length,
    rejected: (proposals || []).filter(p => p.status === "rejected").length,
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8" 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <ShoppingCart size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("procurement.procurement_proposals")}
      </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("procurement.manageProposals")}
              </p>
            </div>
                </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: t("procurement.totalProposals"), value: stats.total, icon: Package, color: "#3b82f6" },
            { label: t("procurement.pending"), value: stats.pending, icon: Clock, color: "#f59e0b" },
            { label: t("procurement.approved"), value: stats.approved, icon: CheckCircle, color: "#10b981" },
            { label: t("procurement.rejected"), value: stats.rejected, icon: XCircle, color: "#ef4444" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                  <stat.icon size={24} color={stat.color} />
                </div>
                </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                {stat.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
            </div>

        {/* Search & Filter */}
        <motion.div
          className="mb-8 rounded-2xl shadow-lg p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder={t("procurement.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
              />
            </div>
            <div className="flex gap-2">
              {["all", "pending", "approved", "rejected"].map((status) => (
            <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                    filterStatus === status ? 'shadow-lg scale-105' : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: filterStatus === status ? 'var(--color-primary)' : 'var(--border-color)',
                    color: filterStatus === status ? 'var(--button-text)' : 'var(--text-color)'
                  }}
                >
                  {t(`procurement.${status}`)}
            </button>
              ))}
            </div>
              </div>
        </motion.div>

        {/* Proposals List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              className="w-16 h-16 border-4 border-t-4 rounded-full"
              style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--color-primary)' }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </div>
        ) : filteredProposals.length === 0 ? (
          <motion.div
            className="text-center py-16 rounded-2xl shadow-lg"
            style={{ backgroundColor: 'var(--bg-color)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <p className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
              {t("procurement.no_proposals_found")}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProposals.map((proposal, index) => (
              <motion.div
                key={proposal._id}
                variants={cardVariant}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl shadow-lg overflow-hidden border hover:shadow-xl transition-all"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              >
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Supplier Info */}
                    <div className="lg:col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500">
                          <Building2 size={24} color="white" />
                        </div>
                        <div>
                          <p className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>
                            {proposal.supplierName}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                            {proposal.PurchaseOrder || t("procurement.no_po")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Total Cost */}
                    <div className="lg:col-span-3 text-center">
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                        {t("procurement.total_cost")}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {proposal.totalCost?.toLocaleString()} {proposal.currency}
              </p>
            </div>

                    {/* Products Count */}
                    <div className="lg:col-span-2 text-center">
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                        {t("procurement.products")}
                      </p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                        {proposal.products?.length || 0}
                      </p>
                    </div>

                    {/* Status & Actions */}
                    <div className="lg:col-span-3 flex items-center justify-end gap-2">
                      <span className={`px-3 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 ${
                        proposal.status === "approved" ? 'bg-green-100 text-green-700' :
                        proposal.status === "pending" ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {proposal.status === "approved" ? <CheckCircle size={16} /> :
                         proposal.status === "pending" ? <Clock size={16} /> :
                         <XCircle size={16} />}
                        {t(`procurement.${proposal.status}`)}
                      </span>
              <button
                        onClick={() => generatePDF(proposal)}
                        className="p-2 rounded-lg hover:scale-110 transition-all"
                        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                        title={t("procurement.download_pdf")}
                      >
                        <Download size={20} />
              </button>
            </div>
          </div>
                </div>
              </motion.div>
            ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default ProcurementProposals;
