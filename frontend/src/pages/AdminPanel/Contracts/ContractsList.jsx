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
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Filter,
  User,
  Building,
} from "lucide-react";

const ContractsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/contracts");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/contracts/${id}`);
    },
    onSuccess: () => {
      toast.success(t("contracts.contract_deleted") || "Contract deleted successfully");
      queryClient.invalidateQueries(["contracts"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete contract");
    },
  });

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.contractName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || contract.contractType === filterType;
    const matchesStatus = filterStatus === "all" || contract.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const contractTypes = [
    "Customer",
    "Supplier",
    "Employee",
    "Service",
    "Lease",
    "Partnership",
    "NDA",
    "Other",
  ];

  const getStatusColor = (status) => {
    const colors = {
      Draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      Terminated: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Renewed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return colors[status] || colors.Draft;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="text-green-600" size={16} />;
      case "Expired":
        return <AlertCircle className="text-red-600" size={16} />;
      case "Terminated":
        return <AlertCircle className="text-orange-600" size={16} />;
      case "Renewed":
        return <CheckCircle className="text-blue-600" size={16} />;
      default:
        return <FileText className="text-gray-600" size={16} />;
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
              {t("contracts.contracts") || "Contracts"}
            </h1>
            <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
              {t("contracts.manage_contracts") || "Manage and track your contracts"}
            </p>
          </div>
          <motion.button
            onClick={() => navigate("/dashboard/contracts/add")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{
              backgroundColor: "var(--button-bg)",
              color: "var(--button-text)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={20} />
            {t("contracts.add_contract") || "Add Contract"}
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
                placeholder={t("contracts.search_contracts") || "Search contracts..."}
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="all">{t("contracts.all_types") || "All Types"}</option>
              {contractTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`contracts.${type.toLowerCase()}`) || type}
                </option>
              ))}
            </select>
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
              <option value="all">{t("contracts.all_statuses") || "All Statuses"}</option>
              <option value="Draft">{t("contracts.draft") || "Draft"}</option>
              <option value="Active">{t("contracts.active") || "Active"}</option>
              <option value="Expired">{t("contracts.expired") || "Expired"}</option>
              <option value="Terminated">{t("contracts.terminated") || "Terminated"}</option>
              <option value="Renewed">{t("contracts.renewed") || "Renewed"}</option>
            </select>
          </div>
        </motion.div>

        {/* Contracts Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: "var(--color-primary)" }}></div>
            <p className="mt-4" style={{ color: "var(--text-color)" }}>
              {t("common.loading") || "Loading..."}
            </p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FileText size={64} className="mx-auto mb-4" style={{ color: "var(--color-secondary)" }} />
            <p className="text-xl mb-2" style={{ color: "var(--text-color)" }}>
              {t("contracts.no_contracts") || "No contracts found"}
            </p>
            <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
              {t("contracts.create_first_contract") || "Create your first contract to get started"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContracts.map((contract, index) => (
              <motion.div
                key={contract._id}
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
                        <FileText className="text-white" size={20} />
                        <span className="font-mono text-white text-sm font-semibold">
                          {contract.contractNumber}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white line-clamp-2">
                        {contract.contractName}
                      </h3>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => navigate(`/dashboard/contracts/${contract._id}`)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                        title={t("common.edit") || "Edit"}
                      >
                        <Edit size={16} className="text-white" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t("contracts.confirm_delete") || "Are you sure?")) {
                            deleteMutation.mutate(contract._id);
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(contract.status)}`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(contract.status)}
                        {contract.status}
                      </div>
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      {contract.contractType}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  {contract.contractType === "Customer" && contract.customerId && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-color)" }}>
                      <User size={16} style={{ color: "var(--color-secondary)" }} />
                      <span className="truncate">
                        {contract.customerId?.name || t("contracts.no_customer") || "No Customer"}
                      </span>
                    </div>
                  )}
                  {contract.contractType === "Supplier" && contract.supplierId && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-color)" }}>
                      <Building size={16} style={{ color: "var(--color-secondary)" }} />
                      <span className="truncate">
                        {contract.supplierId?.name || t("contracts.no_supplier") || "No Supplier"}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs mb-1" style={{ color: "var(--color-secondary)" }}>
                        {t("contracts.start_date") || "Start Date"}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--text-color)" }}>
                        <Calendar size={14} style={{ color: "var(--color-secondary)" }} />
                        {contract.startDate
                          ? new Date(contract.startDate).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: "var(--color-secondary)" }}>
                        {t("contracts.end_date") || "End Date"}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--text-color)" }}>
                        <Calendar size={14} style={{ color: "var(--color-secondary)" }} />
                        {contract.endDate
                          ? new Date(contract.endDate).toLocaleDateString()
                          : t("contracts.no_end_date") || "No end date"}
                      </div>
                    </div>
                  </div>

                  {contract.contractValue > 0 && (
                    <div className="flex items-center gap-2 text-sm pt-2 border-t" style={{ borderColor: "var(--border-color)" }}>
                      <DollarSign size={16} style={{ color: "var(--color-accent)" }} />
                      <span className="font-bold" style={{ color: "var(--text-color)" }}>
                        {contract.contractValue?.toLocaleString() || 0} {contract.currency || "ILS"}
                      </span>
                    </div>
                  )}

                  {contract.autoRenewal && (
                    <div className="text-xs pt-2 border-t" style={{ borderColor: "var(--border-color)" }}>
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium">
                        {t("contracts.auto_renewal") || "Auto Renewal"}
                      </span>
                    </div>
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

export default ContractsList;
