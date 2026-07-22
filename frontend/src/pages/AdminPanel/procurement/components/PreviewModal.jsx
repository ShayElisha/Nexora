// src/components/procurement/PreviewModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, CheckCircle } from "lucide-react";

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
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{ backgroundColor: "var(--surface-color)" }}
          >
            {/* Header */}
            <div
              className="p-6"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                color: "var(--button-text)",
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText size={28} />
                  <div>
                    <h2 className="text-2xl font-bold">תצוגה מקדימה - תעודת רכש</h2>
                    <p className="text-sm opacity-80 mt-1">בדוק את הפרטים לפני השליחה</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="hover:bg-white/20 rounded-full p-2 transition-all"
                  style={{ color: "var(--button-text)" }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div
              className="p-6 border-b"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            >
              <div className="grid grid-cols-2 gap-6">
                <div
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}
                >
                  <p className="text-sm mb-1" style={{ color: "var(--color-secondary)" }}>ספק:</p>
                  <p className="font-bold text-lg" style={{ color: "var(--text-color)" }}>{supplierName || "N/A"}</p>
                </div>
                <div
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}
                >
                  <p className="text-sm mb-1" style={{ color: "var(--color-secondary)" }}>סה״כ לתשלום:</p>
                  <p className="font-bold text-lg text-green-600">
                    ₪{totalCost?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>
            </div>

            {/* PDF Preview */}
            <div className="flex-1 p-6 overflow-auto">
              <div
                className="border rounded-lg overflow-hidden shadow-inner"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}
              >
                {pdfBlobUrl ? (
                  <iframe
                    id="pdfPreview"
                    title="Procurement PDF Preview"
                    src={pdfBlobUrl}
                    className="w-full h-[500px] bg-[var(--surface-color)]"
                  />
                ) : (
                  <div
                    className="w-full h-[500px] flex flex-col items-center justify-center"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    <FileText size={64} className="mb-4" style={{ color: "var(--color-secondary)" }} />
                    <p className="text-lg" style={{ color: "var(--color-secondary)" }}>⚠️ PDF לא נוצר</p>
                    <p className="text-sm mt-2" style={{ color: "var(--color-secondary)" }}>אנא נסה שנית או בדוק את הנתונים</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div
              className="p-6 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-3"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            >
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 h-11 rounded-lg font-medium transition-all"
                style={{ backgroundColor: "var(--border-color)", color: "var(--text-color)" }}
              >
                ביטול
              </button>
              <button
                onClick={onSubmit}
                disabled={!pdfBlobUrl}
                className="w-full sm:w-auto px-6 h-11 rounded-lg font-medium transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
              >
                <CheckCircle size={20} />
                אשר ושלח
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PreviewModal;
