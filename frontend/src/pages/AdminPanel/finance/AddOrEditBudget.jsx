import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SignaturesModal from "../Procurement/components/SignaturesModal";
import currency from "./currency.json";
import {
  Plus,
  Wallet,
  Building,
  DollarSign,
  Calendar,
  FileText,
  Users,
  Save,
  X,
} from "lucide-react";

// Add Department Modal
const AddDepartmentModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/departments", formData);
      toast.success(t("finance.budget.department_created"));
      setFormData({ name: "", description: "" });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(t("finance.budget.error_creating_department"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60" />
      <motion.div
        className="relative rounded-2xl p-6 w-full max-w-md z-10 shadow-2xl border"
        style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>
          {t("finance.budget.add_department")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("finance.budget.department_name")}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {t("finance.budget.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
            />
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
            >
              {t("finance.budget.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              {loading ? t("finance.budget.creating") : t("finance.budget.create_department")}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Main AddBudget Component
const AddBudget = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newRequirement, setNewRequirement] = useState("");
  const [newSigners, setNewSigners] = useState([]);
  const [selectedSignatureList, setSelectedSignatureList] = useState(null);

  const { data: authData } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await axiosInstance.get("/auth/me");
      return res.data;
    },
  });
  const authUser = authData?.user;

  const [formData, setFormData] = useState({
    departmentId: "",
    departmentOrProjectName: "",
    amount: 0,
    currency: "ILS",
    period: "",
    startDate: "",
    endDate: "",
    notes: "",
    companyId: authUser?.companyId || "",
  });

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const { data: employeesData = [] } = useQuery({
    queryKey: ["employeesForSignatures"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees");
      return res.data.data;
    },
  });

  const { data: signatureListsData = [] } = useQuery({
    queryKey: ["signatureLists"],
    queryFn: async () => {
      const res = await axiosInstance.get("/signatures");
      return res.data.data;
    },
  });

  useEffect(() => {
    const companyId = localStorage.getItem("companyId") || "";
    setFormData((prev) => ({ ...prev, companyId }));
  }, [authUser]);

  useEffect(() => {
    const fetchDepartmentOptions = async () => {
      try {
        const res = await axiosInstance.get("/departments");
        const options = res.data.data.map((dept) => ({
          id: dept._id,
          name: dept.name,
        }));
        setDepartmentOptions(options);
      } catch (error) {
        toast.error(t("finance.budget.error_loading_departments"));
      }
    };
    fetchDepartmentOptions();
  }, [t]);

  const handleDepartmentSelect = (e) => {
    const selectedDeptId = e.target.value;
    const selectedDept = departmentOptions.find((dept) => dept.id === selectedDeptId);
    setFormData((prev) => ({
      ...prev,
      departmentId: selectedDeptId,
      departmentOrProjectName: selectedDept ? selectedDept.name : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSignatureList) {
      toast.error(t("finance.budget.please_add_signer"));
      return;
    }

    try {
      const budgetData = {
        ...formData,
        signatureListId: selectedSignatureList._id,
      };
      await axiosInstance.post("/budget", budgetData);
      toast.success(t("finance.budget.success_create_budget"));
      setFormData({
        departmentId: "",
        departmentOrProjectName: "",
        amount: 0,
        currency: "ILS",
        period: "",
        startDate: "",
        endDate: "",
        notes: "",
        companyId: authUser?.companyId || "",
      });
      setSelectedSignatureList(null);
    } catch (error) {
      toast.error(t("finance.budget.error_create_budget"));
    }
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-4xl mx-auto">
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Plus size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("finance.budget.create_budget")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("finance.budget.createNewBudget")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl shadow-lg p-6 lg:p-8 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Department Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                  <Building className="inline mr-2" size={18} />
                  {t("finance.budget.department_project_name")}
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddDepartmentModal(true)}
                  className="text-sm px-3 py-1 rounded-lg font-medium transition-all hover:scale-105"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                >
                  + {t("finance.budget.add_department")}
                </button>
              </div>
              <select
                value={formData.departmentId}
                onChange={handleDepartmentSelect}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                required
              >
                <option value="">{t("finance.budget.select_department")}</option>
                {departmentOptions.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <DollarSign className="inline mr-2" size={18} />
                  {t("finance.budget.budget_amount")}
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("finance.budget.currency")}
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                >
                  {currency.map((c) => (
                    <option key={c.currencyCode} value={c.currencyCode}>
                      {c.currencyName} ({c.currencyCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Calendar className="inline mr-2" size={18} />
                  {t("finance.budget.start_date")}
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Calendar className="inline mr-2" size={18} />
                  {t("finance.budget.end_date")}
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <FileText className="inline mr-2" size={18} />
                {t("finance.budget.notes")}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                placeholder={t("finance.budget.notes_placeholder")}
              />
            </div>

            {/* Signers */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                  <Users className="inline mr-2" size={18} />
                  {t("finance.budget.select_signers")}
                </label>
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(true)}
                  className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                >
                  <Plus size={16} />
                  {t("finance.budget.add_signers")}
                </button>
              </div>
              {selectedSignatureList && (
                <motion.div
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <p className="font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    {selectedSignatureList.requirement}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSignatureList.signers.map((signer, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
                      >
                        {signer.name}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              <Save size={24} />
              {t("finance.budget.create_budget")}
            </button>
          </form>
        </motion.div>

        {/* Modals */}
        {showAddDepartmentModal && (
          <AddDepartmentModal
            isOpen={showAddDepartmentModal}
            onClose={() => setShowAddDepartmentModal(false)}
            onSuccess={() => {
              const fetchDepartments = async () => {
                const res = await axiosInstance.get("/departments");
                const options = res.data.data.map((dept) => ({ id: dept._id, name: dept.name }));
                setDepartmentOptions(options);
              };
              fetchDepartments();
            }}
          />
        )}

        {showSignatureModal && (
          <SignaturesModal
            isOpen={showSignatureModal}
            employeesData={employeesData}
            signatureListsData={signatureListsData}
            onClose={() => setShowSignatureModal(false)}
            onSelectList={(list) => {
              setSelectedSignatureList(list);
              setShowSignatureModal(false);
            }}
            onSaveList={(data) => {
              axiosInstance.post("/signatures/create", data).then(() => {
                queryClient.invalidateQueries({ queryKey: ["signatureLists"] });
                toast.success(t("finance.budget.signers_saved"));
              });
            }}
            onDeleteList={(id) => {
              axiosInstance.delete(`/signatures/${id}`).then(() => {
                queryClient.invalidateQueries({ queryKey: ["signatureLists"] });
                toast.success(t("finance.budget.signers_deleted"));
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AddBudget;
