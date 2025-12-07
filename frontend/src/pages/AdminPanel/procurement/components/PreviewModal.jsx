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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText size={28} />
                  <div>
                    <h2 className="text-2xl font-bold">תצוגה מקדימה - תעודת רכש</h2>
                    <p className="text-sm text-blue-100 mt-1">בדוק את הפרטים לפני השליחה</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="p-6 bg-gray-50 border-b">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">ספק:</p>
                  <p className="font-bold text-lg text-gray-900">{supplierName || "N/A"}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-1">סה״כ לתשלום:</p>
                  <p className="font-bold text-lg text-green-600">
                    ₪{totalCost?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>
            </div>

            {/* PDF Preview */}
            <div className="flex-1 p-6 overflow-auto">
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-inner bg-gray-100">
                {pdfBlobUrl ? (
                  <iframe
                    id="pdfPreview"
                    title="Procurement PDF Preview"
                    src={pdfBlobUrl}
                    className="w-full h-[500px] bg-white"
                  />
                ) : (
                  <div className="w-full h-[500px] flex flex-col items-center justify-center bg-gray-50">
                    <FileText size={64} className="text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">⚠️ PDF לא נוצר</p>
                    <p className="text-gray-400 text-sm mt-2">אנא נסה שנית או בדוק את הנתונים</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                ביטול
              </button>
              <button
                onClick={onSubmit}
                disabled={!pdfBlobUrl}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
