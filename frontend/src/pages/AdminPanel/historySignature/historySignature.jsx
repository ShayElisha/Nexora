import { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import Sidebar from "../layouts/Sidebar";

const HistorySignature = () => {
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSignatures = async () => {
      try {
        const response = await axiosInstance.get(`/procurement/signatures`, {
          withCredentials: true,
        });
        console.log("API Response:", response.data.data);

        if (response.data.success) {
          setSignatures(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError("Failed to fetch signatures." + err);
      } finally {
        setLoading(false);
      }
    };

    fetchSignatures();
  }, []);

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setModalContent(null);
    setIsModalOpen(false);
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">
          My Signatures History
        </h2>
        {signatures.length === 0 ? (
          <p className="text-center text-gray-500">No signatures found.</p>
        ) : (
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2">
                  Purchase Order
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  Supplier Name
                </th>
                <th className="border border-gray-300 px-4 py-2">Document</th>
                <th className="border border-gray-300 px-4 py-2">Signature</th>
                <th className="border border-gray-300 px-4 py-2">Signed At</th>
              </tr>
            </thead>
            <tbody>
              {signatures.map((signature, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    {signature.purchaseOrder || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {signature.supplierName || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {signature.documentUrl ? (
                      <button
                        onClick={() =>
                          openModal(
                            <iframe
                              src={signature.documentUrl}
                              className="w-full h-96"
                              title="Document Viewer"
                            />
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
                    {signature.signatureUrl ? (
                      <img
                        src={signature.signatureUrl}
                        alt="Signature"
                        className="w-20 h-auto cursor-pointer"
                        onClick={() =>
                          openModal(
                            <img
                              src={signature.signatureUrl}
                              alt="Signature"
                              className="w-full h-auto"
                            />
                          )
                        }
                      />
                    ) : (
                      "No Signature"
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {signature.signedAt
                      ? new Date(signature.signedAt).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded p-6 max-w-3xl w-full relative">
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                X
              </button>
              {modalContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySignature;
