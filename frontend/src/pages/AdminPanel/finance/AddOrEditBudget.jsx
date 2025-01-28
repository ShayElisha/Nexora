import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "../layouts/Sidebar";
import SignaturesModal from "../Procurement/components/SignaturesModal";
import { useTranslation } from "react-i18next";

const AddBudget = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch logged-in user

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  console.log("authUser:", authUser);

  // Fetch employees and signatures
  const { data: employeesData = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await axiosInstance.get("/employees");
      return response.data.data;
    },
  });

  const { data: signatureListsData = [], isLoading: signatureListsLoading } =
    useQuery({
      queryKey: ["signatures"],
      queryFn: async () => {
        const response = await axiosInstance.get("/signatures");
        return response.data.data;
      },
    });

  // State management
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newRequirement, setNewRequirement] = useState("");
  const [newSigners, setNewSigners] = useState([]);
  const [newSignersListName, setNewSignersListName] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    departmentOrProjectName: "",
    amount: 0,
    currency: "USD",
    period: "",
    startDate: "",
    endDate: "",
    status: "Draft",
    notes: "",
    companyId: authUser?.company || "",
  });

  // Update companyId when authData is available
  useState(() => {
    if (authUser?.companyId) {
      setFormData((prev) => ({ ...prev, companyId: authUser.companyId }));
    }
  }, [authUser]);

  // Mutation to save budget
  const mutation = useMutation({
    mutationFn: async (newBudget) => {
      return await axiosInstance.post("/budget", {
        ...newBudget,
        signers: newSigners,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast.success("Budget created successfully");
      navigate("/budgets");
    },
    onError: (err) => {
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    },
  });

  // Mutation to save a new signers list
  const saveSignersListMutation = useMutation({
    mutationFn: async () => {
      return await axiosInstance.post("/signatures", {
        name: newSignersListName,
        signers: newSigners,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatures"] });
      setNewSigners([]);
      setNewSignersListName("");
      toast.success("Signers list saved successfully");
    },
  });

  // Mutation to delete a signers list
  const deleteSignersListMutation = useMutation({
    mutationFn: async (id) => {
      return await axiosInstance.delete(`/signatures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatures"] });
      toast.success("Signers list deleted successfully");
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data being sent:", formData);

    if (newSigners.length === 0) {
      toast.error("Please add at least one signer before submitting.");
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-700 mb-6">
          {t("budget.create_budget")}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium">
              {t("budget.department_project_name")}:
            </label>
            <input
              type="text"
              name="departmentOrProjectName"
              value={formData.departmentOrProjectName}
              onChange={handleChange}
              required
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium">
              {t("budget.budget_amount")}:
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              className="input-class"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium">
              {" "}
              {t("budget.currency")}: :
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium">
                {t("budget.start_date")}:
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">
                {t("budget.end_date")}:
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium">
              {" "}
              {t("budget.status")}: :
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
            >
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium">
              {" "}
              {t("budget.notes")}: :
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowSignatureModal(true)}
            className="bg-purple-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-purple-700 transition"
          >
            {t("budget.select_signers")}
          </button>

          {newSigners.length > 0 && (
            <div className="mt-6 p-4 border border-purple-500 bg-purple-50 rounded-lg">
              <h4 className="text-lg font-bold text-purple-700 mb-2">
                Selected Signers:
              </h4>
              <ul className="list-disc list-inside">
                {newSigners.map((signer, index) => (
                  <li key={index} className="text-purple-800">
                    {signer.name} - {signer.role}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg shadow-lg hover:bg-green-700 transition"
          >
            {t("budget.create_budget")}
          </button>
        </form>
      </div>

      {/* Signatures Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              Select Signers
            </h2>
            <SignaturesModal
              isOpen={showSignatureModal}
              onClose={() => {
                setShowSignatureModal(false);
                setIsCreatingNewList(false);
              }}
              isCreatingNewList={isCreatingNewList}
              setIsCreatingNewList={setIsCreatingNewList}
              newRequirement={newRequirement}
              setNewRequirement={setNewRequirement}
              newSigners={newSigners}
              setNewSigners={setNewSigners}
              employees={employeesData}
              signatureLists={signatureListsData}
              deleteSignatureList={(id) => deleteSignersListMutation.mutate(id)}
              createSignatureList={() => saveSignersListMutation.mutate()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBudget;
