import { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import Sidebar from "../layouts/Sidebar";

const AllSignatures = () => {
  const [documents, setDocuments] = useState([]);
  const [budgetSignatures, setBudgetSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch procurement signatures
        const procurementResponse = await axiosInstance.get(
          "/procurement/all-signatures",
          { withCredentials: true }
        );
        console.log("procurementResponse.data => ", procurementResponse.data);

        if (procurementResponse.data.success) {
          setDocuments(procurementResponse.data.data);
        } else {
          // If success is false, append or set an error message
          setError((prevError) =>
            prevError
              ? prevError +
                " | " +
                (procurementResponse.data.message || "Procurement error")
              : procurementResponse.data.message || "Procurement error"
          );
        }

        // 2. Fetch budget signatures
        const budgetResponse = await axiosInstance.get("/budget", {
          withCredentials: true,
        });
        console.log("budgetResponse.data => ", budgetResponse.data);

        if (budgetResponse.data.success) {
          setBudgetSignatures(budgetResponse.data.data);
        } else {
          setError((prevError) =>
            prevError
              ? prevError +
                " | " +
                (budgetResponse.data.message || "Budget error")
              : budgetResponse.data.message || "Budget error"
          );
        }
      } catch (err) {
        // Catch any request or network errors
        setError("Failed to fetch documents: " + err.message);
      } finally {
        // Always hide the loading indicator
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setModalContent(null);
    setIsModalOpen(false);
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-6 max-w-7xl mx-auto">
        {/* ===================== Procurement Signatures Table ===================== */}
        <h2 className="text-2xl font-bold mb-6 text-center">All Documents</h2>

        {documents.length === 0 ? (
          <p className="text-center text-gray-500">No documents found.</p>
        ) : (
          <div className="max-h-[600px] overflow-auto mb-8 border border-gray-300">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2">
                    Purchase Order
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Supplier Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Approval Status
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Signers</th>
                  <th className="border border-gray-300 px-4 py-2">Document</th>
                  <th className="border border-gray-300 px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      {doc.PurchaseOrder || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {doc.supplierName || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {doc.approvalStatus || "Pending"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <ul className="max-h-20 overflow-y-scroll space-y-4">
                        {doc.signers.map((signer, i) => (
                          <li
                            key={i}
                            className="flex items-center space-x-4 bg-gray-100 p-3 rounded-lg shadow"
                          >
                            <div className="flex-shrink-0">
                              {signer.signatureUrl ? (
                                <img
                                  src={signer.signatureUrl}
                                  alt="Signature"
                                  className="w-12 h-12 object-contain border border-gray-300 rounded-md cursor-pointer"
                                  onClick={() =>
                                    openModal(
                                      <img
                                        src={signer.signatureUrl}
                                        alt="Signature"
                                        className="w-full h-auto"
                                      />
                                    )
                                  }
                                />
                              ) : (
                                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-500 text-sm border border-gray-300 rounded-md">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">
                                {signer.name || "Unknown"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {signer.hasSigned ? "Signed" : "Pending"}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {doc.summeryProcurement ? (
                        <button
                          onClick={() =>
                            openModal(
                              <iframe
                                src={doc.summeryProcurement}
                                title="Document Viewer"
                                className="w-full h-96"
                              ></iframe>
                            )
                          }
                          className="text-blue-500 hover:underline"
                        >
                          View Document
                        </button>
                      ) : (
                        "No Document"
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {doc.status || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================== Budget Signatures Table ===================== */}
        <h2 className="text-2xl font-bold mb-6 text-center">
          Budget Signatures
        </h2>
        {budgetSignatures.length === 0 ? (
          <p className="text-center text-gray-500">
            No budget signatures found.
          </p>
        ) : (
          <div className="max-h-[600px] overflow-auto border border-gray-300">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2">
                    Budget Item
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    start Date
                  </th>
                  <th className="border border-gray-300 px-4 py-2">endDate</th>
                  <th className="border border-gray-300 px-4 py-2">Amount</th>
                  <th className="border border-gray-300 px-4 py-2">Signers</th>
                  <th className="border border-gray-300 px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {budgetSignatures.map((budgetItem, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      {budgetItem.departmentOrProjectName || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {budgetItem.startDate
                        ? new Date(budgetItem.startDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {budgetItem.endDate
                        ? new Date(budgetItem.startDate).toLocaleDateString()
                        : "N/A"}{" "}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {budgetItem.amount || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <ul className="max-h-20 overflow-y-scroll space-y-4">
                        {budgetItem.signers?.map((signer, i) => (
                          <li
                            key={i}
                            className="flex items-center space-x-4 bg-gray-100 p-3 rounded-lg shadow"
                          >
                            <div className="flex-shrink-0">
                              {signer.signatureUrl ? (
                                <img
                                  src={signer.signatureUrl}
                                  alt="Signature"
                                  className="w-12 h-12 object-contain border border-gray-300 rounded-md cursor-pointer"
                                  onClick={() =>
                                    openModal(
                                      <img
                                        src={signer.signatureUrl}
                                        alt="Signature"
                                        className="w-full h-auto"
                                      />
                                    )
                                  }
                                />
                              ) : (
                                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-500 text-sm border border-gray-300 rounded-md">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">
                                {signer.name || "Unknown"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {signer.hasSigned ? "Signed" : "Pending"}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {budgetItem.status || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================== Modal ===================== */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full relative">
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                ✖
              </button>
              {modalContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllSignatures;
