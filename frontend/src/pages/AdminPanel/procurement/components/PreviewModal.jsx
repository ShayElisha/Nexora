// src/components/procurement/PreviewModal.jsx
const PreviewModal = ({
  showModal,
  onClose,
  onSubmit,
  pdfBlobUrl,
  totalCost,
  supplierName,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-gray-900 p-6 rounded shadow-lg w-2/4">
        <h2 className="text-lg font-bold text-blue-300 mb-4">
          Procurement Summary
        </h2>
        <div>
          <p>
            <strong>Supplier:</strong> {supplierName || "N/A"}
          </p>
          <p>
            <strong>Total Cost:</strong> {totalCost} ₪
          </p>
        </div>
        <div className="mt-4 border-2 border-gray-600 rounded">
          <iframe
            id="pdfPreview"
            title="Procurement PDF"
            src={pdfBlobUrl}
            className="w-full h-96"
          ></iframe>
        </div>

        <button
          onClick={onSubmit}
          className="bg-blue-600 py-2 px-4 text-white rounded mt-4"
        >
          Confirm and Submit
        </button>
        <button
          onClick={onClose}
          className="bg-gray-600 py-2 px-4 text-white rounded mt-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PreviewModal;
