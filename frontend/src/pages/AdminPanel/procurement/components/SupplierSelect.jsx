// src/components/procurement/SupplierSelect.jsx
import { useState, useEffect } from "react";
import { useSupplierStore } from "../../../../stores/useSupplierStore.js";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Search,
  ChevronDown,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Star,
  TrendingUp,
  Globe,
  Loader2
} from "lucide-react";

const SupplierSelect = ({ supplierId, onChange }) => {
  const { t } = useTranslation();
  const { suppliers, isLoading, error } = useSupplierStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    if (supplierId && suppliers.length > 0) {
      const supplier = suppliers.find(s => s._id === supplierId);
      setSelectedSupplier(supplier);
    }
  }, [supplierId, suppliers]);

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.SupplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.Phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (supplier) => {
    setSelectedSupplier(supplier);
    onChange(supplier._id);
    setIsOpen(false);
    setSearchTerm("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin mr-3" size={24} style={{ color: 'var(--color-primary)' }} />
        <p style={{ color: 'var(--text-color)' }}>{t("procurement.loading_suppliers")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-200 bg-red-50">
        <p className="text-red-600 flex items-center gap-2">
          <Building2 size={20} />
          {t("procurement.error_loading_suppliers")}: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Supplier Display */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-4 border rounded-xl flex items-center justify-between transition-all hover:shadow-md"
          style={{
            borderColor: isOpen ? 'var(--color-primary)' : 'var(--border-color)',
            backgroundColor: 'var(--bg-color)',
            color: 'var(--text-color)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600">
              <Building2 size={20} color="white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>
                {t("procurement.selected_supplier")}
              </p>
              <p className="font-bold" style={{ color: 'var(--text-color)' }}>
                {selectedSupplier ? selectedSupplier.SupplierName : t("procurement.select_supplier")}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={20} style={{ color: 'var(--color-secondary)' }} />
          </motion.div>
        </button>

        {/* Selected Supplier Details */}
        <AnimatePresence>
          {selectedSupplier && !isOpen && (
            <motion.div
              className="mt-3 p-4 rounded-xl border"
              style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {selectedSupplier.Email && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                    <Mail size={16} style={{ color: 'var(--color-primary)' }} />
                    <span>{selectedSupplier.Email}</span>
                  </div>
                )}
                {selectedSupplier.Phone && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                    <Phone size={16} style={{ color: 'var(--color-primary)' }} />
                    <span>{selectedSupplier.Phone}</span>
                  </div>
                )}
                {selectedSupplier.Address && (
                  <div className="flex items-center gap-2 col-span-2" style={{ color: 'var(--text-color)' }}>
                    <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
                    <span className="text-xs">{selectedSupplier.Address}</span>
                  </div>
                )}
                {selectedSupplier.baseCurrency && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                    <Globe size={16} style={{ color: 'var(--color-primary)' }} />
                    <span>{t("procurement.currency")}: {selectedSupplier.baseCurrency}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="rounded-xl border shadow-xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Search Bar */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={t("procurement.search_suppliers")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Suppliers List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredSuppliers.length > 0 ? (
                <div className="p-2">
                  {filteredSuppliers.map((supplier, index) => (
                    <motion.button
                      key={supplier._id}
                      type="button"
                      onClick={() => handleSelect(supplier)}
                      className="w-full p-4 rounded-xl mb-2 text-left transition-all hover:shadow-md"
                      style={{
                        backgroundColor: selectedSupplier?._id === supplier._id 
                          ? 'var(--border-color)' 
                          : 'var(--bg-color)',
                        borderColor: 'var(--border-color)',
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 flex-shrink-0">
                            <Building2 size={24} color="white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-base truncate" style={{ color: 'var(--text-color)' }}>
          {supplier.SupplierName}
                              </h3>
                              {selectedSupplier?._id === supplier._id && (
                                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="space-y-1">
                              {supplier.Email && (
                                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-secondary)' }}>
                                  <Mail size={12} />
                                  <span className="truncate">{supplier.Email}</span>
                                </div>
                              )}
                              {supplier.Phone && (
                                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-secondary)' }}>
                                  <Phone size={12} />
                                  <span>{supplier.Phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                {supplier.baseCurrency && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                    {supplier.baseCurrency}
                                  </span>
                                )}
                                <div className="flex items-center gap-1">
                                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs font-bold text-yellow-700">
                                    {supplier.averageRating && supplier.averageRating > 0 
                                      ? supplier.averageRating.toFixed(1) 
                                      : "1.0"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Building2 size={48} className="mx-auto mb-3" style={{ color: 'var(--color-secondary)' }} />
                  <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.no_suppliers_found")}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-secondary)' }}>
                    {t("procurement.try_different_search")}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--border-color)' }}>
              <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                {filteredSuppliers.length} {t("procurement.suppliers_available")}
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium px-3 py-1 rounded-lg transition-all hover:scale-105"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
              >
                {t("procurement.close")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupplierSelect;
