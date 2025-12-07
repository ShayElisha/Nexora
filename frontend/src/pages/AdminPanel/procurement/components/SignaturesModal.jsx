// src/components/procurement/SignaturesModal.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const SignaturesModal = ({
  isOpen,
  onClose,
  isCreatingNewList: externalIsCreatingNewList,
  setIsCreatingNewList: externalSetIsCreatingNewList,
  newRequirement: externalNewRequirement,
  setNewRequirement: externalSetNewRequirement,
  newSigners: externalNewSigners,
  setNewSigners: externalSetNewSigners,
  employees,
  signatureLists,
  deleteSignatureList,
  createSignatureList,
  // New props for budget usage
  employeesData,
  signatureListsData,
  onSelectList,
  onSaveList,
  onDeleteList,
}) => {
  const { t } = useTranslation();
  
  // Internal state for budget mode
  const [internalIsCreatingNewList, setInternalIsCreatingNewList] = useState(false);
  const [internalNewRequirement, setInternalNewRequirement] = useState("");
  const [internalNewSigners, setInternalNewSigners] = useState([]);

  // Determine which props to use
  const isBudgetMode = !!employeesData;
  const isCreatingNewList = isBudgetMode ? internalIsCreatingNewList : externalIsCreatingNewList;
  const setIsCreatingNewList = isBudgetMode ? setInternalIsCreatingNewList : externalSetIsCreatingNewList;
  const newRequirement = isBudgetMode ? internalNewRequirement : externalNewRequirement;
  const setNewRequirement = isBudgetMode ? setInternalNewRequirement : externalSetNewRequirement;
  const newSigners = isBudgetMode ? internalNewSigners : externalNewSigners;
  const setNewSigners = isBudgetMode ? setInternalNewSigners : externalSetNewSigners;
  const employeesList = isBudgetMode ? employeesData : employees;
  const signatureListsList = isBudgetMode ? signatureListsData : signatureLists;

  if (isOpen === false) return null;

  const handleSaveSignatureList = async () => {
    if (!newRequirement || newSigners.length === 0) {
      toast.error("Please provide a valid list name and at least one signer.");
      return;
    }
    try {
      const data = {
        requirement: newRequirement,
        name: newRequirement,
        signers: newSigners,
      };
      
      if (isBudgetMode && onSaveList) {
        await onSaveList(data);
      } else if (createSignatureList) {
        await createSignatureList(data);
      }
      
      toast.success("Signature list saved successfully!");
      setNewRequirement("");
      setNewSigners([]);
      setIsCreatingNewList(false);
    } catch (error) {
      console.error("Failed to save signature list:", error);
      toast.error("Failed to save signature list.");
    }
  };

  const handleDeleteList = async (listId) => {
    try {
      if (isBudgetMode && onDeleteList) {
        await onDeleteList(listId);
      } else if (deleteSignatureList) {
        await deleteSignatureList(listId);
      }
    } catch (error) {
      console.error("Failed to delete signature list:", error);
      toast.error("Failed to delete signature list.");
    }
  };

  const handleSelectList = (list) => {
    if (isBudgetMode && onSelectList) {
      onSelectList(list);
    } else {
      setNewSigners(list.signers);
      onClose();
      setIsCreatingNewList(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-bg p-8 rounded-lg shadow-xl w-3/4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">
          {t("signature_modal.title")}
        </h2>

        {/* Button to create a new list */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setIsCreatingNewList(true)}
            className="bg-button-bg hover:bg-button-bg text-button-text py-2 px-4 rounded mr-4"
          >
            {t("signature_modal.create_new_list")}
          </button>
        </div>

        {/* New list creation section */}
        {isCreatingNewList && (
          <div className="mb-8 pb-6 border-b border-border-color">
            <h3 className="text-xl text-secondary font-semibold mb-4">
              {t("signature_modal.new_list_title")}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="Enter list name"
                className="w-full p-3 rounded bg-bg text-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
              />

              {/* Employee selection for adding signers */}
              <div>
                <h4 className="text-secondary font-medium mb-2">
                  {t("signature_modal.select_employees")}
                </h4>
                <select
                  onChange={(e) => {
                    const employeeId = e.target.value;
                    const employee = employeesList.find(
                      (emp) => emp._id === employeeId
                    );
                    if (employee) {
                      setNewSigners((prev) => [
                        ...prev,
                        {
                          name: employee.name + " " + employee.lastName,
                          employeeId: employee._id,
                          role: employee.role,
                          order: prev.length + 1,
                        },
                      ]);
                    }
                  }}
                  className="bg-bg text-text p-2 rounded"
                >
                  <option value="">
                    {t("signature_modal.select_employee")}
                  </option>
                  {employeesList && employeesList.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.lastName} - {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* New signature list display */}
              {newSigners.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-secondary font-medium">
                    {t("signature_modal.new_list_signers")}
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {newSigners.map((signer, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center p-2 bg-bg rounded-lg shadow-md"
                      >
                        <span className="text-text">
                          {signer.name} - {signer.role}
                        </span>
                        <button
                          onClick={() =>
                            setNewSigners((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                          className="text-red-500 font-bold hover:underline"
                        >
                          {t("signature_modal.remove")}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={handleSaveSignatureList}
              className="bg-button-bg hover:bg-button-bg text-button-text font-bold py-3 px-6 rounded-lg mt-6 shadow-lg transform transition-transform duration-300 hover:scale-105"
            >
              {t("signature_modal.save_list")}
            </button>
          </div>
        )}

        <div>
          <h3 className="text-xl text-secondary font-semibold mb-4">
            {t("signature_modal.existing_lists_title")}
          </h3>
          {signatureListsList && signatureListsList.length > 0 ? (
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow-md">
              <thead>
                <tr className="bg-gradient-to-r from-border-color to-border-color text-text">
                  <th className="p-4">{t("signature_modal.list_name")}</th>
                  <th className="p-4">{t("signature_modal.signers")}</th>
                  <th className="p-4 text-center">
                    {t("signature_modal.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {signatureListsList.map((list, index) => (
                  <tr
                    key={index}
                    className="bg-bg hover:bg-border-color text-text transition-colors duration-200"
                  >
                    <td className="p-4">{list.requirement || list.name}</td>
                    <td className="p-4">
                      {list?.signers && list.signers.length > 0 ? (
                        list.signers.map((signer, i) => {
                          return (
                            <span
                              key={signer?.employeeId || i}
                              className="inline-block bg-bg text-primary text-xs px-2 py-1 rounded-lg mr-2"
                            >
                              {signer?.name || t("signature_modal.no_name")} (
                              {signer?.role || ""})
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-text">
                          {t("signature_modal.no_signers")}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => handleDeleteList(list._id)}
                        className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-button-text py-1 px-4 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105"
                      >
                        {t("signature_modal.delete")}
                      </button>
                      <button
                        onClick={() => handleSelectList(list)}
                        className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-button-text py-1 px-4 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105"
                      >
                        {t("signature_modal.use_list")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-text text-center text-lg">
              {t("signature_modal.no_lists_available")}
            </p>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-border-color to-border-color hover:from-gray-600 hover:to-gray-800 text-button-text py-2 px-6 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-105"
          >
            {t("signature_modal.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturesModal;
