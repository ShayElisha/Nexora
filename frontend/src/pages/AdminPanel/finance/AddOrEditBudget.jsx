import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SignaturesModal from "../Procurement/components/SignaturesModal";
import currency from "./currency.json";

// ---------- AddDepartmentModal Component ----------
const AddDepartmentModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/departments", formData);
      toast.success(t("budget.department_created"));
      setFormData({ name: "", description: "" });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error(t("budget.error_creating_department"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black bg-opacity-60 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative bg-accent rounded-xl p-6 w-full max-w-md z-10 shadow-2xl transform transition-all duration-300">
        <h2 className="text-2xl font-bold text-text mb-6 text-center tracking-tight drop-shadow-md">
          {t("budget.add_department")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
              {t("budget.department_name")}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
              {t("budget.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-bg border border-border-color text-text rounded-full shadow-md hover:bg-gray-200 transition-all duration-200"
            >
              {t("budget.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-button-bg text-button-text rounded-full shadow-lg hover:bg-secondary transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? t("budget.creating") : t("budget.create_department")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------- AddBudget Component ----------
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
    currency: "USD",
    period: "",
    startDate: "",
    endDate: "",
    notes: "",
    companyId: authUser?.companyId || "",
  });

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [budget, setBudget] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const deleteSignersListMutation = useMutation({
    mutationFn: async (id) => await axiosInstance.delete(`/signatures/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatureLists"] });
      toast.success(t("budget.signers_deleted"));
    },
  });

  const saveSignersListMutation = useMutation({
    mutationFn: async (data) =>
      await axiosInstance.post("/signatures/create", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatureLists"] });
      toast.success(t("budget.signers_saved"));
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
        console.error("Error fetching department options:", error);
        toast.error(t("budget.error_loading_departments"));
      }
    };
    fetchDepartmentOptions();
  }, []);

  const handleDepartmentSelect = (e) => {
    const selectedDeptId = e.target.value;
    const selectedDept = departmentOptions.find(
      (dept) => dept.id === selectedDeptId
    );
    setFormData((prev) => ({
      ...prev,
      departmentId: selectedDeptId,
      departmentOrProjectName: selectedDept ? selectedDept.name : "",
    }));
  };

  useEffect(() => {
    if (formData.departmentId) {
      const fetchBudget = async () => {
        try {
          const res = await axiosInstance.get(
            `/budget/by-department/${formData.departmentId}`
          );
          setBudget(res.data.data);
        } catch (error) {
          console.error("Error fetching budget:", error);
          toast.error(t("budget.error_loading_budget") + ": " + error.message);
        }
      };
      fetchBudget();

      const filtered = employees.filter(
        (emp) => String(emp.department) === formData.departmentId
      );
      setFilteredEmployees(filtered);
    } else {
      setBudget(null);
      setFilteredEmployees([]);
    }
  }, [formData.departmentId, employees]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axiosInstance.get("/employees");
        setEmployees(res.data.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error(t("budget.error_loading_employees"));
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const budgetData = {
        ...formData,
        signers: selectedSignatureList
          ? selectedSignatureList.signers
          : newSigners,
      };
      await axiosInstance.post("/budget", budgetData);
      toast.success(t("budget.created_successfully"));
      setFormData({
        departmentOrProjectName: "",
        departmentId: "",
        amount: 0,
        currency: "USD",
        period: "",
        startDate: "",
        endDate: "",
        notes: "",
        companyId: authUser?.companyId || "",
      });
      setBudget(null);
      setSelectedSignatureList(null);
      setNewSigners([]);
    } catch (error) {
      console.error("Error creating budget:", error);
      const errorMsg =
        error.response && error.response.data && error.response.data.error
          ? error.response.data.error
          : t("budget.error_creating_budget");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (newSigners && newSigners.length > 0) {
      setSelectedSignatureList({ signers: newSigners });
    }
  }, [newSigners]);

  const onUseList = (list) => {
    if (list === undefined || list === null) {
      setSelectedSignatureList(null);
    } else if (Array.isArray(list)) {
      setSelectedSignatureList({ signers: list });
    } else if (list.signers && Array.isArray(list.signers)) {
      setSelectedSignatureList(list);
    } else if (typeof list === "object") {
      setSelectedSignatureList({ signers: [list] });
    } else {
      console.error("Invalid format:", list);
      setSelectedSignatureList(null);
    }
    setShowSignatureModal(false);
    setIsCreatingNewList(false);
  };

  return (
    <div className="min-h-screen  flex justify-center py-10 animate-fade-in">
      <div className="w-full max-w-4xl p-8 bg-bg rounded-xl shadow-xl border border-border-color">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text mb-8 text-center tracking-tight drop-shadow-md">
          {t("budget.create_budget")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
                {t("budget.department_project_name")}
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleDepartmentSelect}
                required
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
              >
                <option value="">
                  {t("budget.select_department_project")}
                </option>
                {departmentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowAddDepartmentModal(true)}
              className="px-6 py-3 bg-button-bg text-button-text rounded-full shadow-lg hover:bg-secondary transition-all duration-200"
            >
              {t("budget.add_department")}
            </button>
          </div>

          {budget && (
            <div className="p-4 bg-bg border border-border-color rounded-lg shadow-md">
              <h3 className="text-sm font-semibold text-text mb-2 drop-shadow-sm">
                {t("budget.department_budget")}
              </h3>
              <p className="text-sm text-text">
                {t("budget.allocated")}: {budget.amount}
              </p>
              <p className="text-sm text-text">
                {t("budget.spent")}: {budget.spentAmount}
              </p>
              <p className="text-sm text-text">
                {t("budget.remaining")}: {budget.amount - budget.spentAmount}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
              {t("budget.budget_amount")}
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
              {t("budget.currency")}
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              required
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
            >
              {currency.map((cur) => (
                <option key={cur.currencyCode} value={cur.currencyCode}>
                  {cur.currencyName} ({cur.currencyCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
                {t("budget.start_date")}
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
                {t("budget.end_date")}
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-2 drop-shadow-sm">
              {t("budget.notes")}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full p-3 border border-border-color rounded-lg bg-bg text-text shadow-md focus:ring-2 focus:ring-primary transition-all duration-200"
            />
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="px-6 py-3 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-all duration-200"
            >
              {t("budget.select_signers")}
            </button>
            {selectedSignatureList && (
              <div className="p-4 bg-bg border border-border-color rounded-lg shadow-md">
                <p className="text-sm font-semibold text-text mb-2 drop-shadow-sm">
                  {t("budget.selected_signers")}:
                </p>
                {selectedSignatureList.signers &&
                selectedSignatureList.signers.length > 0 ? (
                  selectedSignatureList.signers.map((signer, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-sm text-text"
                    >
                      <span className="font-semibold">
                        {signer.name || t("budget.unknown_name")}
                      </span>
                      <span className="opacity-70">
                        {signer.role || t("budget.no_role")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text opacity-70">
                    {t("budget.empty_signers_list")}
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-button-bg text-button-text rounded-full shadow-lg hover:bg-secondary transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? t("budget.creating") : t("budget.create_budget")}
          </button>
        </form>
      </div>

      {showAddDepartmentModal && (
        <AddDepartmentModal
          isOpen={showAddDepartmentModal}
          onClose={() => setShowAddDepartmentModal(false)}
          onSuccess={() => {
            axiosInstance.get("/departments").then((res) => {
              const options = res.data.data.map((dept) => ({
                id: dept._id,
                name: dept.name,
              }));
              setDepartmentOptions(options);
              toast.success(t("budget.department_added"));
            });
          }}
        />
      )}

      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-accent rounded-xl p-6 w-full max-w-4xl shadow-2xl transform transition-all duration-300">
            <h2 className="text-2xl font-bold text-text mb-6 text-center tracking-tight drop-shadow-md">
              {t("budget.select_signers")}
            </h2>
            <SignaturesModal
              isOpen={showSignatureModal}
              onClose={() => setShowSignatureModal(false)}
              isCreatingNewList={isCreatingNewList}
              setIsCreatingNewList={setIsCreatingNewList}
              newRequirement={newRequirement}
              setNewRequirement={setNewRequirement}
              newSigners={newSigners}
              setNewSigners={setNewSigners}
              employees={employeesData || []}
              signatureLists={signatureListsData || []}
              deleteSignatureList={(id) => deleteSignersListMutation.mutate(id)}
              createSignatureList={(payload) =>
                saveSignersListMutation.mutate(payload)
              }
              onUseList={onUseList}
              t={t}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AddBudget;
