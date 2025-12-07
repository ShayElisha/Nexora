import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Globe,
  Percent,
  DollarSign,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

const TaxConfig = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    countryCode: "",
    taxName: t("finance.taxConfig.incomeTax"),
    taxBrackets: [{ limit: "", rate: "" }],
    otherTaxes: [{ name: "", rate: "", fixedAmount: "" }],
    currency: "ILS",
  });
  const [taxConfigs, setTaxConfigs] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    const fetchAllTaxConfigs = async () => {
      setTableLoading(true);
      try {
        const response = await axiosInstance.get("/tax-config");
        setTaxConfigs(response.data.data);
      } catch (err) {
        toast.error(t("finance.taxConfig.errorFetchingConfigs") + " " + err.message);
      } finally {
        setTableLoading(false);
      }
    };
    fetchAllTaxConfigs();
  }, [t]);

  const handleInputChange = (e, field, index, subField) => {
    if (index !== undefined && subField) {
      const updatedArray = [...formData[field]];
      updatedArray[index][subField] = e.target.value;
      setFormData({ ...formData, [field]: updatedArray });
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }
  };

  const addTaxBracket = () => {
    setFormData({
      ...formData,
      taxBrackets: [...formData.taxBrackets, { limit: "", rate: "" }],
    });
  };

  const removeTaxBracket = (index) => {
    if (formData.taxBrackets.length > 1) {
      const updatedBrackets = formData.taxBrackets.filter((_, i) => i !== index);
      setFormData({ ...formData, taxBrackets: updatedBrackets });
    } else {
      toast.error(t("finance.taxConfig.minBracketRequired"));
    }
  };

  const addOtherTax = () => {
    setFormData({
      ...formData,
      otherTaxes: [...formData.otherTaxes, { name: "", rate: "", fixedAmount: "" }],
    });
  };

  const removeOtherTax = (index) => {
    if (formData.otherTaxes.length > 1) {
      const updatedTaxes = formData.otherTaxes.filter((_, i) => i !== index);
      setFormData({ ...formData, otherTaxes: updatedTaxes });
    } else {
      toast.error(t("finance.taxConfig.minOtherTaxRequired"));
    }
  };

  const validateForm = () => {
    if (!formData.countryCode) return t("finance.taxConfig.countryCodeRequired");
    if (!/^[A-Z]{2}$/.test(formData.countryCode)) return t("finance.taxConfig.invalidCountryCode");
    if (!formData.taxBrackets.every((b) => Number(b.limit) >= 0 && Number(b.rate) >= 0 && Number(b.rate) <= 1)) {
      return t("finance.taxConfig.invalidTaxBrackets");
    }
    if (!formData.otherTaxes.every((t) => t.name && (Number(t.rate) >= 0 || Number(t.fixedAmount) >= 0))) {
      return t("finance.taxConfig.invalidOtherTaxes");
    }
    if (!formData.currency) return t("finance.taxConfig.currencyRequired");
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...(editId ? {} : { countryCode: formData.countryCode }),
        taxName: formData.taxName,
        taxBrackets: formData.taxBrackets.map((b) => ({
          limit: Number(b.limit) || Infinity,
          rate: Number(b.rate) || 0,
        })),
        otherTaxes: formData.otherTaxes.map((t) => ({
          name: t.name,
          rate: Number(t.rate) || 0,
          fixedAmount: Number(t.fixedAmount) || 0,
        })),
        currency: formData.currency,
      };

      if (editId) {
        await axiosInstance.put(`/tax-config/${editId}`, payload);
        toast.success(t("finance.taxConfig.updatedSuccess"));
      } else {
        await axiosInstance.post("/tax-config", payload);
        toast.success(t("finance.taxConfig.createdSuccess"));
      }

      const response = await axiosInstance.get("/tax-config");
      setTaxConfigs(response.data.data);
      setFormData({
        countryCode: "",
        taxName: t("finance.taxConfig.incomeTax"),
        taxBrackets: [{ limit: "", rate: "" }],
        otherTaxes: [{ name: "", rate: "", fixedAmount: "" }],
        currency: "ILS",
      });
      setEditId(null);
    } catch (err) {
      toast.error(t("finance.taxConfig.errorSavingConfig") + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      countryCode: "",
      taxName: t("finance.taxConfig.incomeTax"),
      taxBrackets: [{ limit: "", rate: "" }],
      otherTaxes: [{ name: "", rate: "", fixedAmount: "" }],
      currency: "ILS",
    });
    setEditId(null);
    toast(t("finance.taxConfig.cancelled"));
  };

  const toggleRow = (configId) => {
    setExpandedRow(expandedRow === configId ? null : configId);
  };

  const handleEdit = (taxConfigId) => {
    const config = taxConfigs.find((c) => c._id === taxConfigId);
    if (config) {
      setFormData({
        countryCode: config.countryCode,
        taxName: config.taxName,
        taxBrackets: config.taxBrackets.length
          ? config.taxBrackets.map((b) => ({ limit: b.limit === Infinity ? "" : b.limit, rate: b.rate }))
          : [{ limit: "", rate: "" }],
        otherTaxes: config.otherTaxes.length ? config.otherTaxes : [{ name: "", rate: "", fixedAmount: "" }],
        currency: config.currency,
      });
      setEditId(taxConfigId);
      toast(t("finance.taxConfig.editMode"));
    }
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-orange-500 to-red-600">
              <Settings size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {editId ? t("finance.taxConfig.editTaxConfig") : t("finance.taxConfig.createTaxConfig")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("finance.taxConfig.manageTaxSettings")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="mb-8 rounded-2xl shadow-lg p-6 lg:p-8 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Globe className="inline mr-2" size={16} />
                  {t("finance.taxConfig.countryCode")}
                </label>
                <select
                  value={formData.countryCode}
                  onChange={(e) => handleInputChange(e, "countryCode")}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  required
                  disabled={editId}
                >
                  <option value="">{t("finance.taxConfig.selectCountry")}</option>
                  <option value="IL">{t("finance.taxConfig.countries.IL")}</option>
                  <option value="US">{t("finance.taxConfig.countries.US")}</option>
                  <option value="UK">{t("finance.taxConfig.countries.UK")}</option>
                  <option value="EU">{t("finance.taxConfig.countries.EU")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("finance.taxConfig.taxName")}
                </label>
                <input
                  type="text"
                  value={formData.taxName}
                  onChange={(e) => handleInputChange(e, "taxName")}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("finance.taxConfig.taxNamePlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <DollarSign className="inline mr-2" size={16} />
                  {t("finance.taxConfig.currency")}
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange(e, "currency")}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  required
                >
                  <option value="ILS">₪ ILS</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
              </div>
            </div>

            {/* Tax Brackets */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <Percent size={20} />
                  {t("finance.taxConfig.taxBrackets")}
                </label>
                <button
                  type="button"
                  onClick={addTaxBracket}
                  className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                >
                  <Plus size={18} />
                  {t("finance.taxConfig.addBracket")}
                </button>
              </div>
              <div className="space-y-3">
                {formData.taxBrackets.map((bracket, index) => (
                  <motion.div
                    key={index}
                    className="flex gap-3 p-4 rounded-xl border"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <input
                      type="number"
                      step="0.01"
                      value={bracket.limit}
                      onChange={(e) => handleInputChange(e, "taxBrackets", index, "limit")}
                      className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                      placeholder={t("finance.taxConfig.limitPlaceholder")}
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={bracket.rate}
                      onChange={(e) => handleInputChange(e, "taxBrackets", index, "rate")}
                      className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                      placeholder={t("finance.taxConfig.ratePlaceholder")}
                      required
                    />
                    {formData.taxBrackets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTaxBracket(index)}
                        className="p-3 rounded-xl transition-all hover:scale-110 bg-red-500 text-white"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Other Taxes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
                  {t("finance.taxConfig.otherTaxes")}
                </label>
                <button
                  type="button"
                  onClick={addOtherTax}
                  className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                >
                  <Plus size={18} />
                  {t("finance.taxConfig.addOtherTax")}
                </button>
              </div>
              <div className="space-y-3">
                {formData.otherTaxes.map((tax, index) => (
                  <motion.div
                    key={index}
                    className="flex gap-3 p-4 rounded-xl border"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <input
                      type="text"
                      value={tax.name}
                      onChange={(e) => handleInputChange(e, "otherTaxes", index, "name")}
                      className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                      placeholder={t("finance.taxConfig.namePlaceholder")}
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={tax.rate}
                      onChange={(e) => handleInputChange(e, "otherTaxes", index, "rate")}
                      className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                      placeholder={t("finance.taxConfig.ratePlaceholder")}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={tax.fixedAmount}
                      onChange={(e) => handleInputChange(e, "otherTaxes", index, "fixedAmount")}
                      className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                      placeholder={t("finance.taxConfig.fixedAmountPlaceholder")}
                    />
                    {formData.otherTaxes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOtherTax(index)}
                        className="p-3 rounded-xl transition-all hover:scale-110 bg-red-500 text-white"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-t-2 border-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    {t("finance.taxConfig.saving")}
                  </>
                ) : (
                  <>
                    <Save size={24} />
                    {editId ? t("finance.taxConfig.update") : t("finance.taxConfig.create")}
                  </>
                )}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                >
                  <X size={24} />
                  {t("finance.taxConfig.cancel")}
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Existing Configs */}
        <motion.div
          className="rounded-2xl shadow-lg p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>
            {t("finance.taxConfig.existingConfigs")}
          </h3>
          {tableLoading ? (
            <div className="flex items-center justify-center h-32">
              <motion.div
                className="w-12 h-12 border-4 border-t-4 rounded-full"
                style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--color-primary)' }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            </div>
          ) : taxConfigs.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
              <p className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                {t("finance.taxConfig.noConfigs")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {taxConfigs.map((config, index) => (
                <motion.div
                  key={config._id}
                  variants={cardVariant}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl shadow-md overflow-hidden border hover:shadow-lg transition-all"
                  style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => toggleRow(config._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500">
                          <Globe size={24} color="white" />
                        </div>
                        <div>
                          <p className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
                            {config.taxName}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                            {t(`taxConfig.countries.${config.countryCode}`)} ({config.currency})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(config._id);
                          }}
                          className="p-2 rounded-lg hover:scale-110 transition-all"
                          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                        >
                          <Edit2 size={20} />
                        </button>
                        {expandedRow === config._id ? (
                          <ChevronUp size={24} style={{ color: 'var(--color-primary)' }} />
                        ) : (
                          <ChevronDown size={24} style={{ color: 'var(--color-primary)' }} />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedRow === config._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t p-6"
                      style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', opacity: 0.95 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-bold mb-3" style={{ color: 'var(--text-color)' }}>
                            {t("finance.taxConfig.taxBrackets")}
                          </h4>
                          <div className="space-y-2">
                            {config.taxBrackets.map((bracket, idx) => (
                              <div key={idx} className="flex justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
                                <span style={{ color: 'var(--text-color)' }}>
                                  Up to {bracket.limit === Infinity ? '∞' : bracket.limit}
                                </span>
                                <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
                                  {(bracket.rate * 100).toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold mb-3" style={{ color: 'var(--text-color)' }}>
                            {t("finance.taxConfig.otherTaxes")}
                          </h4>
                          <div className="space-y-2">
                            {config.otherTaxes.map((tax, idx) => (
                              <div key={idx} className="flex justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
                                <span style={{ color: 'var(--text-color)' }}>{tax.name}</span>
                                <span className="font-bold" style={{ color: 'var(--color-accent)' }}>
                                  {tax.rate > 0 && `${(tax.rate * 100).toFixed(1)}%`}
                                  {tax.fixedAmount > 0 && ` ${tax.fixedAmount} ${config.currency}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TaxConfig;
