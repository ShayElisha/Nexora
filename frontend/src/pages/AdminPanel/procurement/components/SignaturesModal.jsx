// src/components/procurement/SignaturesModal.jsx
import toast from "react-hot-toast";

const SignaturesModal = ({
  isOpen,
  onClose,
  isCreatingNewList,
  setIsCreatingNewList,
  newRequirement,
  setNewRequirement,
  newSigners,
  setNewSigners,
  employees,
  signatureLists,
  deleteSignatureList,
  createSignatureList,
}) => {
  if (!isOpen) return null;

  const handleSaveSignatureList = async () => {
    if (!newRequirement || newSigners.length === 0) {
      toast.error("Please provide a valid list name and at least one signer.");
      return;
    }
    try {
      await createSignatureList({
        name: newRequirement,
        signers: newSigners,
        employeeId: "",
      });
      toast.success("Signature list saved successfully!");
      setNewRequirement("");
      setNewSigners([]);
    } catch (error) {
      console.error("Failed to save signature list:", error);
      toast.error("Failed to save signature list.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-3/4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">
          Signature Requirements Management
        </h2>

        {/* כפתור יצירת רשימה חדשה */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setIsCreatingNewList(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mr-4"
          >
            Create New Signature List
          </button>
        </div>

        {/* יצירת רשימה חדשה */}
        {isCreatingNewList && (
          <div className="mb-8 pb-6 border-b border-gray-700">
            <h3 className="text-xl text-blue-300 font-semibold mb-4">
              Create New Signature List
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="Enter list name"
                className="w-full p-3 rounded bg-gray-800 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {/* בחירת עובדים להוספה */}
              <div>
                <h4 className="text-blue-400 font-medium mb-2">
                  Select Employees to Add:
                </h4>
                <select
                  onChange={(e) => {
                    const employeeId = e.target.value;
                    const employee = employees.find(
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
                  className="bg-gray-800 text-gray-200 p-2 rounded"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.lastName} - {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* רשימת חתימות חדשה */}
              {newSigners.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-blue-400 font-medium">
                    New List Signers:
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {newSigners.map((signer, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-800 rounded-lg shadow-md"
                      >
                        <span className="text-gray-300">
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
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={handleSaveSignatureList}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-lg mt-6 shadow-lg transform transition-transform duration-300 hover:scale-105"
            >
              Save Signature List
            </button>
          </div>
        )}

        <div>
          <h3 className="text-xl text-blue-300 font-semibold mb-4">
            Existing Signature Lists
          </h3>
          {signatureLists.length > 0 ? (
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow-md">
              <thead>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-200">
                  <th className="p-4">List Name</th>
                  <th className="p-4">Signers</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {signatureLists.map((list, index) => (
                  <tr
                    key={index}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors duration-200"
                  >
                    <td className="p-4">{list.name}</td>
                    <td className="p-4">
                      {list.signers.map((signer, i) => (
                        <span
                          key={i}
                          className="inline-block bg-gray-800 text-blue-300 text-xs px-2 py-1 rounded-lg mr-2"
                        >
                          {signer.name} ({signer.role})
                        </span>
                      ))}
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => deleteSignatureList(list._id)}
                        className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white py-1 px-4 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          setNewSigners(list.signers);
                          onClose();
                          setIsCreatingNewList(false);
                        }}
                        className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white py-1 px-4 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105"
                      >
                        Use This List
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-center text-lg">
              No signature lists available.
            </p>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white py-2 px-6 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturesModal;
