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
      Draft: "bg-gray-100 text-gray-800",
      Active: "bg-green-100 text-green-800",
      Expired: "bg-red-100 text-red-800",
      Terminated: "bg-orange-100 text-orange-800",
      Renewed: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
            {t("contracts.contracts") || "Contracts"}
          </h1>
          <button
            onClick={() => navigate("/dashboard/contracts/add")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            {t("contracts.add_contract") || "Add Contract"}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t("contracts.search_contracts") || "Search contracts..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">{t("contracts.all_types") || "All Types"}</option>
              {contractTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">{t("contracts.all_statuses") || "All Statuses"}</option>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Terminated">Terminated</option>
              <option value="Renewed">Renewed</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">{t("contracts.contract_number") || "Contract #"}</th>
                    <th className="text-left p-3">{t("contracts.contract_name") || "Contract Name"}</th>
                    <th className="text-left p-3">{t("contracts.type") || "Type"}</th>
                    <th className="text-left p-3">{t("contracts.start_date") || "Start Date"}</th>
                    <th className="text-left p-3">{t("contracts.end_date") || "End Date"}</th>
                    <th className="text-left p-3">{t("contracts.value") || "Value"}</th>
                    <th className="text-left p-3">{t("contracts.status") || "Status"}</th>
                    <th className="text-left p-3">{t("contracts.actions") || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <motion.tr
                      key={contract._id}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="p-3 font-mono">{contract.contractNumber}</td>
                      <td className="p-3 font-semibold">{contract.contractName}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-sm">
                          {contract.contractType}
                        </span>
                      </td>
                      <td className="p-3">
                        {contract.startDate
                          ? new Date(contract.startDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-3">
                        {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "No end date"}
                      </td>
                      <td className="p-3">
                        {contract.contractValue?.toLocaleString()} {contract.currency}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${getStatusColor(contract.status)}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/contracts/${contract._id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t("contracts.confirm_delete") || "Are you sure?")) {
                                deleteMutation.mutate(contract._id);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
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
      </div>
    </div>
  );
};

export default ContractsList;

