// src/pages/procurement/AddBudget.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios"; // עדכן את הנתיב במידת הצורך
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SignaturesModal from "../Procurement/components/SignaturesModal";

// ---------- AddDepartmentModal Component ----------
const AddDepartmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/departments", formData);
      toast.success("Department created successfully!");
      setFormData({ name: "", description: "" });
      onSuccess(); // Refresh department options
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
      {/* Semi-transparent background */}
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative bg-bg rounded-lg shadow-lg p-6 w-full max-w-lg z-10">
        <h2 className="text-2xl font-bold mb-4 text-primary">
          Add New Department
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1 text-text">
              Department Name:
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-text">
              Description:
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full border border-border-color p-2 rounded bg-bg text-text"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-secondary text-button-text px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-button-bg text-button-text px-4 py-2 rounded"
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

  // Get authenticated user via react-query
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
    status: "Draft",
    notes: "",
    companyId: authUser?.companyId || "",
  });

  // State for department options (loaded from /departments)
  const [departmentOptions, setDepartmentOptions] = useState([]);
  // Budget for the selected department (if available)
  const [budget, setBudget] = useState(null);
  // Employees (if needed)
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  // Control modal states
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  // For managing signature lists
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newRequirement, setNewRequirement] = useState("");
  const [newSigners, setNewSigners] = useState([]);
  const [newSignersListName, setNewSignersListName] = useState("");
  // State for the selected signature list
  const [selectedSignatureList, setSelectedSignatureList] = useState(null);

  // Query for employees (for signatures modal)
  const { data: employeesData = [] } = useQuery({
    queryKey: ["employeesForSignatures"],
    queryFn: async () => {
      const res = await axiosInstance.get("/employees");
      return res.data.data;
    },
  });

  // Query for existing signature lists
  const { data: signatureListsData = [] } = useQuery({
    queryKey: ["signatureLists"],
    queryFn: async () => {
      const res = await axiosInstance.get("/signatures");
      return res.data.data;
    },
  });

  // Mutation to delete a signature list
  const deleteSignersListMutation = useMutation({
    mutationFn: async (id) => await axiosInstance.delete(`/signatures/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatureLists"] });
      toast.success("Signers list deleted successfully");
    },
  });

  // Mutation to save a signature list
  const saveSignersListMutation = useMutation({
    mutationFn: async (data) =>
      await axiosInstance.post("/signatures/create", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatureLists"] });
      toast.success("Signers list saved successfully");
    },
  });

  // Set companyId from localStorage when authUser is available
  useEffect(() => {
    const companyId = localStorage.getItem("companyId") || "";
    setFormData((prev) => ({ ...prev, companyId }));
  }, [authUser]);

  // --- חדש: טעינת רשימת המחלקות ---
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

  // פונקציה לבחירת מחלקה – מעדכנת גם את מזהה המחלקה וגם את שמו
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

  // useEffect לטענת התקציב וסינון העובדים לפי המחלקה (מבוסס על departmentId)
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

  // טעינת העובדים מהשרת
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

  // Handle changes to the form inputs (לשדות שאינם בחירת מחלקה)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission to create a budget.
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

      const res = await axiosInstance.post("/budget", budgetData);
      toast.success("Budget created successfully!");

      // Reset form state
      setFormData({
        departmentOrProjectName: "",
        departmentId: "",
        amount: 0,
        currency: "USD",
        period: "",
        startDate: "",
        endDate: "",
        status: "Draft",
        notes: "",
        companyId: authUser?.companyId || "",
      });
      console.log(res.data);

      setBudget(null);
      setSelectedSignatureList(null);
    } catch (error) {
      console.error("Error creating budget:", error);
      toast.error("Error creating budget");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="container mx-auto p-8 bg-bg shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-primary mb-6">
          {t("budget.create_budget")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Department Dropdown */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-text font-medium mb-1">
                {t("budget.department_project_name")}:
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleDepartmentSelect}
                required
                className="w-full mt-2 p-3 border border-border-color rounded-lg bg-bg text-text"
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
            {/* Button to open the Add Department modal */}
            <button
              type="button"
              onClick={() => setShowAddDepartmentModal(true)}
              className="bg-primary text-button-text py-3 px-4 rounded-lg shadow-lg hover:bg-primary/90 transition"
            >
              {t("budget.add_department")}
            </button>
          </div>

          {/* Display the department budget if available */}
          {budget && (
            <div className="mb-4 p-4 border border-border-color bg-bg rounded">
              <h3 className="font-bold mb-2 text-primary">Department Budget</h3>
              <p>Allocated Amount: {budget.amount}</p>
              <p>Spent Amount: {budget.spentAmount}</p>
              <p>Remaining: {budget.amount - budget.spentAmount}</p>
            </div>
          )}

          {/* Budget Amount */}
          <div>
            <label className="block text-text font-medium">
              {t("budget.budget_amount")}:
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              className="w-full mt-2 p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-text font-medium">
              {t("budget.currency")}:
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full mt-2 p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:outline-none"
              required
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-text font-medium">
                {t("budget.start_date")}:
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full mt-2 p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-text font-medium">
                {t("budget.end_date")}:
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full mt-2 p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-text font-medium">
              {t("budget.status")}:
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full mt-2 p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:outline-none"
              required
            >
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-text font-medium">
              {t("budget.notes")}:
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full mt-2 p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:outline-none"
              rows="4"
            ></textarea>
          </div>

          {/* Button to open the Signatures Modal */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="bg-purple-600 text-button-text py-3 px-6 rounded-lg shadow-lg hover:bg-purple-700 transition"
            >
              {t("budget.select_signers")}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-button-text py-3 rounded-lg shadow-lg hover:bg-green-700 transition"
          >
            {t("budget.create_budget")}
          </button>
        </form>
      </div>

      {/* Add Department Modal */}
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

      {/* Signatures Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-text mb-4">Select Signers</h2>
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
              onUseList={(list) => {
                setSelectedSignatureList(list);
                setShowSignatureModal(false);
                setIsCreatingNewList(false);
              }}
              t={t}
            />
          </div>
        </div>
      )}

      {/* Display the selected signature list */}
      {selectedSignatureList && (
        <div className="mt-4 p-4 border border-primary bg-primary/10 rounded">
          <h3 className="font-bold text-primary mb-2">
            Selected Signature List
          </h3>
          <p className="text-primary">Name: {selectedSignatureList.name}</p>
          <div className="mt-2">
            {selectedSignatureList.signers.map((signer, index) => (
              <span
                key={index}
                className="inline-block bg-primary/20 text-primary px-2 py-1 rounded mr-2 mb-2"
              >
                {signer.name} ({signer.role})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBudget;
