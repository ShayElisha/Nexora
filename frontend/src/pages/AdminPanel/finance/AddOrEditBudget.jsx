// src/pages/procurement/AddBudget.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SignaturesModal from "../Procurement/components/SignaturesModal";
import currency from "./currency.json";

// ---------- AddDepartmentModal Component ----------
const AddDepartmentModal = ({ isOpen, onClose, onSuccess }) => {
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
      toast.success("Department created successfully!");
      setFormData({ name: "", description: "" });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error("Error creating department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-xl p-8 w-full max-w-md z-10 shadow-2xl transform transition-all duration-300">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Add New Department
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">
              Department Name:
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">
              Description:
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-transform transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-transform transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Department"}
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

  // State declarations
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
      toast.success("Signers list deleted successfully");
    },
  });

  const saveSignersListMutation = useMutation({
    mutationFn: async (data) =>
      await axiosInstance.post("/signatures/create", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatureLists"] });
      toast.success("Signers list saved successfully");
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
        toast.error("Error loading department options");
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
          toast.error("Error loading department budget: " + error.message);
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
        toast.error("Error loading employees");
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
      toast.success("Budget created successfully!");

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
          : "Error creating budget";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // עדכון: סנכרון newSigners עם selectedSignatureList
  useEffect(() => {
    if (newSigners && newSigners.length > 0) {
      setSelectedSignatureList({ signers: newSigners });
    }
  }, [newSigners]);

  const onUseList = (list) => {
    console.log("Selected list from modal:", list);
    if (list === undefined || list === null) {
      console.warn("קיבלנו undefined או null מהמודל");
      setSelectedSignatureList(null);
    } else if (Array.isArray(list)) {
      setSelectedSignatureList({ signers: list });
    } else if (list.signers && Array.isArray(list.signers)) {
      setSelectedSignatureList(list);
    } else if (typeof list === "object") {
      setSelectedSignatureList({ signers: [list] });
    } else {
      console.error("פורמט לא תקין:", list);
      setSelectedSignatureList(null);
    }
    setShowSignatureModal(false);
    setIsCreatingNewList(false);
  };

  // Debugging: Log selectedSignatureList whenever it changes
  useEffect(() => {
    console.log("selectedSignatureList updated to:", selectedSignatureList);
  }, [selectedSignatureList]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <div className="w-full max-w-4xl p-10 bg-white rounded-xl shadow-2xl border border-gray-200">
        <h1 className="text-4xl font-bold text-gray-800 mb-10 text-center">
          {t("budget.create_budget")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Department Dropdown and Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-end space-y-6 sm:space-y-0 sm:space-x-6">
            <div className="flex-1">
              <label className="block text-lg font-medium text-gray-700 mb-2">
                {t("budget.department_project_name")}
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleDepartmentSelect}
                required
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
              className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-transform transform hover:scale-105"
            >
              {t("budget.add_department")}
            </button>
          </div>

          {budget && (
            <div className="p-6 bg-gray-50 border border-gray-300 rounded-xl text-gray-700">
              <h3 className="font-semibold mb-3 text-gray-800">
                Department Budget
              </h3>
              <p className="mb-1">Allocated: {budget.amount}</p>
              <p className="mb-1">Spent: {budget.spentAmount}</p>
              <p>Remaining: {budget.amount - budget.spentAmount}</p>
            </div>
          )}

          {/* Budget Amount */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              {t("budget.budget_amount")}
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              {t("budget.currency")}
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              required
              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {currency.map((cur) => (
                <option key={cur.currencyCode} value={cur.currencyCode}>
                  {cur.currencyName} ({cur.currencyCode})
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                {t("budget.start_date")}
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                {t("budget.end_date")}
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              {t("budget.notes")}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            ></textarea>
          </div>

          {/* Signatures Section */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:from-purple-600 hover:to-purple-700 transition-transform transform hover:scale-105 self-start"
            >
              {t("budget.select_signers")}
            </button>
            {selectedSignatureList && (
              <div className="mt-6 p-6 bg-gray-50 border border-gray-300 rounded-xl">
                <p className="font-semibold text-gray-800 mb-3">
                  חותמים נבחרים:
                </p>
                {selectedSignatureList.signers &&
                selectedSignatureList.signers.length > 0 ? (
                  selectedSignatureList.signers.map((signer, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <span className="text-xl font-semibold text-gray-800">
                        {signer.name || "שם לא ידוע"}
                      </span>
                      <span className="text-lg text-gray-500">
                        {signer.role || "ללא תפקיד"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">רשימת החותמים ריקה.</p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-2xl hover:from-blue-700 hover:to-blue-800 transition-transform transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? "Creating..." : t("budget.create_budget")}
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
              toast.success("Department added successfully!");
            });
          }}
        />
      )}

      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-8xl shadow-2xl transform transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Select Signers
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
    </div>
  );
};

export default AddBudget;
