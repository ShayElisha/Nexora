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
  Truck,
  Filter,
  AlertCircle,
  Loader2,
} from "lucide-react";

const SupplierContractsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: contracts = [], isLoading, isError } = useQuery({
    queryKey: ["supplier-contracts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/procurement-advanced/supplier-contracts");
      return res.data.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/procurement-advanced/supplier-contracts/${id}`);
    },
    onSuccess: () => {
      toast.success(t("procurement.contract_deleted") || "Contract deleted successfully");
      queryClient.invalidateQueries(["supplier-contracts"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete contract");
    },
  });

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.contractName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || contract.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      Draft: "bg-gray-100 text-gray-800",
      Active: "bg-green-100 text-green-800",
      Expired: "bg-red-100 text-red-800",
      Terminated: "bg-orange-100 text-orange-800",
      Renewed: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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
            {t("procurement.error_loading_contracts") || "Error loading contracts"}
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
              {t("procurement.supplier_contracts") || "Supplier Contracts"}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t("procurement.supplier_contracts_description") || "Manage and track supplier contracts"}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/procurement/supplier-contracts/add")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus size={20} />
            {t("procurement.add_contract") || "Add Contract"}
          </button>
        </div>

        <div className="rounded-2xl shadow-md border overflow-hidden" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder={t("procurement.search_contracts") || "Search contracts..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                  style={{ 
                    borderColor: 'var(--border-color)', 
                    backgroundColor: 'var(--bg-color)', 
                    color: 'var(--text-color)',
                    '--tw-ring-color': 'var(--color-primary)'
                  }}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition"
                style={{ 
                  borderColor: 'var(--border-color)', 
                  backgroundColor: 'var(--bg-color)', 
                  color: 'var(--text-color)',
                  '--tw-ring-color': 'var(--color-primary)'
                }}
              >
                <option value="all">{t("procurement.all_statuses") || "All Statuses"}</option>
                <option value="Draft">{t("procurement.draft") || "Draft"}</option>
                <option value="Active">{t("procurement.active") || "Active"}</option>
                <option value="Expired">{t("procurement.expired") || "Expired"}</option>
                <option value="Terminated">{t("procurement.terminated") || "Terminated"}</option>
                <option value="Renewed">{t("procurement.renewed") || "Renewed"}</option>
              </select>
            </div>
          </div>

          {filteredContracts.length === 0 ? (
            <div className="px-6 pb-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                <FileText size={64} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  {t("procurement.no_contracts") || "No contracts found"}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border-t" style={{ borderColor: 'var(--border-color)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <th className="text-left p-3 font-semibold text-sm" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.contract_number") || "Contract #"}
                    </th>
                    <th className="text-left p-3 font-semibold text-sm" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.contract_name") || "Contract Name"}
                    </th>
                    <th className="text-left p-3 font-semibold text-sm" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.supplier") || "Supplier"}
                    </th>
                    <th className="text-left p-3 font-semibold text-sm" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.start_date") || "Start Date"}
                    </th>
                    <th className="text-left p-3 font-semibold text-sm" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.end_date") || "End Date"}
                    </th>
                    <th className="text-left p-3 font-semibold text-sm" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.value") || "Value"}
                    </th>
                    <th className="text-left p-3 font-semibold text-sm" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.status") || "Status"}
                    </th>
                    <th className="text-left p-3 font-semibold text-sm" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.actions") || "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <motion.tr
                      key={contract._id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="p-3 font-mono text-sm" style={{ color: 'var(--text-color)' }}>
                        {contract.contractNumber}
                      </td>
                      <td className="p-3 font-semibold text-sm" style={{ color: 'var(--text-color)' }}>
                        {contract.contractName}
                      </td>
                      <td className="p-3 text-sm" style={{ color: 'var(--text-color)' }}>
                        <div className="flex items-center gap-2">
                          <Truck size={16} />
                          {contract.supplierName}
                        </div>
                      </td>
                      <td className="p-3 text-sm" style={{ color: 'var(--text-color)' }}>
                        {contract.startDate
                          ? new Date(contract.startDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-3 text-sm" style={{ color: 'var(--text-color)' }}>
                        {contract.endDate
                          ? new Date(contract.endDate).toLocaleDateString()
                          : t("procurement.no_end_date") || "No end date"}
                      </td>
                      <td className="p-3 text-sm" style={{ color: 'var(--text-color)' }}>
                        {contract.contractValue?.toLocaleString()} {contract.currency || "USD"}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(contract.status)}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/procurement/supplier-contracts/${contract._id}`)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              const confirmMessage = t("procurement.confirm_delete") || "Are you sure you want to delete this contract?";
                              if (window.confirm(confirmMessage)) {
                                deleteMutation.mutate(contract._id);
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

export default SupplierContractsList;

