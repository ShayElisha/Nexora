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
      <div className="bg-bg p-6 rounded shadow-lg w-2/4">
        <h2 className="text-lg font-bold text-primary mb-4">
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
        <div className="mt-4 border-2 border-border-color rounded">
          <iframe
            id="pdfPreview"
            title="Procurement PDF"
            src={pdfBlobUrl}
            className="w-full h-96"
          ></iframe>
        </div>

        <button
          onClick={onSubmit}
          className="bg-button-bg py-2 px-4 text-button-text rounded mt-4"
        >
          Confirm and Submit
        </button>
        <button
          onClick={onClose}
          className="bg-secondary py-2 px-4 text-text rounded mt-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PreviewModal;
