import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import { FaEdit, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

const TaxConfig = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    countryCode: "",
    taxName: t("taxConfig.incomeTax"),
    taxBrackets: [{ limit: "", rate: "" }],
    otherTaxes: [{ name: "", rate: "", fixedAmount: "" }],
    currency: "ILS",
  });
  const [taxConfigs, setTaxConfigs] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // Fetch all tax configs
  useEffect(() => {
    const fetchAllTaxConfigs = async () => {
      setTableLoading(true);
      try {
        const response = await axiosInstance.get("/tax-config");
        setTaxConfigs(response.data.data);
      } catch (err) {
        toast.error(t("taxConfig.errorFetchingConfigs") + " " + err.message);
      } finally {
        setTableLoading(false);
      }
    };
    fetchAllTaxConfigs();
  }, [t]);

  // Handle input changes
  const handleInputChange = (e, field, index, subField) => {
    if (index !== undefined && subField) {
      const updatedArray = [...formData[field]];
      updatedArray[index][subField] = e.target.value;
      setFormData({ ...formData, [field]: updatedArray });
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }
  };

  // Add new tax bracket
  const addTaxBracket = () => {
    setFormData({
      ...formData,
      taxBrackets: [...formData.taxBrackets, { limit: "", rate: "" }],
    });
  };

  // Remove tax bracket
  const removeTaxBracket = (index) => {
    if (formData.taxBrackets.length > 1) {
      const updatedBrackets = formData.taxBrackets.filter(
        (_, i) => i !== index
      );
      setFormData({ ...formData, taxBrackets: updatedBrackets });
    } else {
      toast.error(t("taxConfig.minBracketRequired"));
    }
  };

  // Add new other tax
  const addOtherTax = () => {
    setFormData({
      ...formData,
      otherTaxes: [
        ...formData.otherTaxes,
        { name: "", rate: "", fixedAmount: "" },
      ],
    });
  };

  // Remove other tax
  const removeOtherTax = (index) => {
    if (formData.otherTaxes.length > 1) {
      const updatedTaxes = formData.otherTaxes.filter((_, i) => i !== index);
      setFormData({ ...formData, otherTaxes: updatedTaxes });
    } else {
      toast.error(t("taxConfig.minOtherTaxRequired"));
    }
  };

  // Validate form
  const validateForm = () => {
    if (!formData.countryCode) return t("taxConfig.countryCodeRequired");
    if (!/^[A-Z]{2}$/.test(formData.countryCode))
      return t("taxConfig.invalidCountryCode");
    if (
      !formData.taxBrackets.every(
        (b) =>
          Number(b.limit) >= 0 && Number(b.rate) >= 0 && Number(b.rate) <= 1
      )
    ) {
      return t("taxConfig.invalidTaxBrackets");
    }
    if (
      !formData.otherTaxes.every(
        (t) => t.name && (Number(t.rate) >= 0 || Number(t.fixedAmount) >= 0)
      )
    ) {
      return t("taxConfig.invalidOtherTaxes");
    }
    if (!formData.currency) return t("taxConfig.currencyRequired");
    return "";
  };

  // Handle form submission
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
        toast.success(t("taxConfig.updatedSuccess"));
      } else {
        await axiosInstance.post("/tax-config", payload);
        toast.success(t("taxConfig.createdSuccess"));
      }

      const response = await axiosInstance.get("/tax-config");
      setTaxConfigs(response.data.data);
      setFormData({
        countryCode: "",
        taxName: t("taxConfig.incomeTax"),
        taxBrackets: [{ limit: "", rate: "" }],
        otherTaxes: [{ name: "", rate: "", fixedAmount: "" }],
        currency: "ILS",
      });
      setEditId(null);
    } catch (err) {
      let errorMessage = "";
      if (err.response?.status === 400) {
        errorMessage =
          t("taxConfig.invalidData") +
          (err.response?.data?.message || t("taxConfig.checkData"));
      } else if (err.response?.status === 404) {
        errorMessage = t("taxConfig.configNotFound");
      } else {
        errorMessage =
          t("taxConfig.errorSavingConfig") +
          (err.response?.data?.message || err.message);
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      countryCode: "",
      taxName: t("taxConfig.incomeTax"),
      taxBrackets: [{ limit: "", rate: "" }],
      otherTaxes: [{ name: "", rate: "", fixedAmount: "" }],
      currency: "ILS",
    });
    setEditId(null);
    toast(t("taxConfig.cancelled"));
  };

  // Handle row click to toggle details
  const toggleRow = (configId) => {
    setExpandedRow(expandedRow === configId ? null : configId);
  };

  // Handle edit button click
  const handleEdit = (taxConfigId) => {
    const config = taxConfigs.find((c) => c._id === taxConfigId);
    if (config) {
      setFormData({
        countryCode: config.countryCode,
        taxName: config.taxName,
        taxBrackets: config.taxBrackets.length
          ? config.taxBrackets.map((b) => ({
              limit: b.limit === Infinity ? "" : b.limit,
              rate: b.rate,
            }))
          : [{ limit: "", rate: "" }],
        otherTaxes: config.otherTaxes.length
          ? config.otherTaxes
          : [{ name: "", rate: "", fixedAmount: "" }],
        currency: config.currency,
      });
      setEditId(taxConfigId);

      toast(t("taxConfig.editMode"));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {editId ? t("taxConfig.editTaxConfig") : t("taxConfig.createTaxConfig")}
      </h2>

      {loading ? (
        <div className="text-center text-gray-500">
          {t("taxConfig.loading")}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 mb-8"
        >
          {/* Country Code */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("taxConfig.countryCode")}
            </label>
            <select
              value={formData.countryCode}
              onChange={(e) => handleInputChange(e, "countryCode")}
              className="border p-2 rounded w-full"
              required
              disabled={editId}
            >
              <option value="">{t("taxConfig.selectCountry")}</option>
              <option value="IL">{t("taxConfig.countries.IL")}</option>
              <option value="US">{t("taxConfig.countries.US")}</option>
              <option value="UK">{t("taxConfig.countries.UK")}</option>
              <option value="EU">{t("taxConfig.countries.EU")}</option>
            </select>
          </div>

          {/* Tax Name */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("taxConfig.taxName")}
            </label>
            <input
              type="text"
              value={formData.taxName}
              onChange={(e) => handleInputChange(e, "taxName")}
              className="border p-2 rounded w-full"
              placeholder={t("taxConfig.taxNamePlaceholder")}
            />
          </div>

          {/* Tax Brackets */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("taxConfig.taxBrackets")}
            </label>
            {formData.taxBrackets.map((bracket, index) => (
              <div key={index} className="flex gap-4 mb-2">
                <input
                  type="number"
                  step="0.01"
                  value={bracket.limit}
                  onChange={(e) =>
                    handleInputChange(e, "taxBrackets", index, "limit")
                  }
                  className="border p-2 rounded w-1/2"
                  placeholder={t("taxConfig.limitPlaceholder")}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  value={bracket.rate}
                  onChange={(e) =>
                    handleInputChange(e, "taxBrackets", index, "rate")
                  }
                  className="border p-2 rounded w-1/2"
                  placeholder={t("taxConfig.ratePlaceholder")}
                  required
                />
                {formData.taxBrackets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTaxBracket(index)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    {t("taxConfig.remove")}
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTaxBracket}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
            >
              {t("taxConfig.addTaxBracket")}
            </button>
          </div>

          {/* Other Taxes */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("taxConfig.otherTaxes")}
            </label>
            {formData.otherTaxes.map((tax, index) => (
              <div key={index} className="flex gap-4 mb-2">
                <input
                  type="text"
                  value={tax.name}
                  onChange={(e) =>
                    handleInputChange(e, "otherTaxes", index, "name")
                  }
                  className="border p-2 rounded w-1/3"
                  placeholder={t("taxConfig.otherTaxNamePlaceholder")}
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  value={tax.rate}
                  onChange={(e) =>
                    handleInputChange(e, "otherTaxes", index, "rate")
                  }
                  className="border p-2 rounded w-1/3"
                  placeholder={t("taxConfig.otherTaxRatePlaceholder")}
                />
                <input
                  type="number"
                  step="0.01"
                  value={tax.fixedAmount}
                  onChange={(e) =>
                    handleInputChange(e, "otherTaxes", index, "fixedAmount")
                  }
                  className="border p-2 rounded w-1/3"
                  placeholder={t("taxConfig.fixedAmountPlaceholder")}
                />
                {formData.otherTaxes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOtherTax(index)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    {t("taxConfig.remove")}
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOtherTax}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
            >
              {t("taxConfig.addOtherTax")}
            </button>
          </div>

          {/* Currency */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("taxConfig.currency")}
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange(e, "currency")}
              className="border p-2 rounded w-full"
              required
            >
              <option value="">{t("taxConfig.selectCurrency")}</option>
              <option value="ILS">{t("taxConfig.currencies.ILS")}</option>
              <option value="USD">{t("taxConfig.currencies.USD")}</option>
              <option value="EUR">{t("taxConfig.currencies.EUR")}</option>
              <option value="GBP">{t("taxConfig.currencies.GBP")}</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              disabled={loading}
            >
              {loading ? t("taxConfig.saving") : t("taxConfig.save")}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              {t("taxConfig.cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Tax Configs Table */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">
          {t("taxConfig.taxConfigsList")}
        </h3>
        {tableLoading ? (
          <div className="text-center text-gray-500">
            {t("taxConfig.loading")}
          </div>
        ) : taxConfigs.length === 0 ? (
          <div className="text-center text-gray-500">
            {t("taxConfig.noConfigsFound")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-right">
                    {t("taxConfig.countryCode")}
                  </th>
                  <th className="py-3 px-6 text-right">
                    {t("taxConfig.taxName")}
                  </th>
                  <th className="py-3 px-6 text-right">
                    {t("taxConfig.currency")}
                  </th>
                  <th className="py-3 px-6 text-right">
                    {t("taxConfig.active")}
                  </th>
                  <th className="py-3 px-6 text-right">
                    {t("taxConfig.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {taxConfigs.map((config) => (
                  <React.Fragment key={config._id}>
                    <tr
                      onClick={() => toggleRow(config._id)}
                      className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                    >
                      <td className="py-3 px-6 text-right">
                        {config.countryCode}
                      </td>
                      <td className="py-3 px-6 text-right">{config.taxName}</td>
                      <td className="py-3 px-6 text-right">
                        {config.currency}
                      </td>
                      <td className="py-3 px-6 text-right">
                        {config.isActive
                          ? t("taxConfig.activeStatus")
                          : t("taxConfig.inactiveStatus")}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <FaEdit
                          className="text-blue-500 cursor-pointer hover:text-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(config._id);
                          }}
                        />
                      </td>
                    </tr>
                    {expandedRow === config._id && (
                      <tr>
                        <td colSpan="5" className="bg-gray-50 p-4">
                          <div className="relative bg-white shadow-md rounded-lg p-6">
                            <button
                              onClick={() => setExpandedRow(null)}
                              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            >
                              <FaTimes />
                            </button>
                            <h4 className="text-lg font-semibold mb-4">
                              {t("taxConfig.taxConfigDetails")}
                            </h4>
                            {/* Tax Brackets Table */}
                            <div className="mb-6">
                              <h5 className="text-md font-bold mb-2">
                                {t("taxConfig.taxBrackets")}
                              </h5>
                              {config.taxBrackets.length > 0 ? (
                                <table className="w-full text-sm border">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="py-2 px-4 text-right border-b">
                                        {t("taxConfig.limit")}
                                      </th>
                                      <th className="py-2 px-4 text-right border-b">
                                        {t("taxConfig.rate")}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {config.taxBrackets.map(
                                      (bracket, index) => (
                                        <tr
                                          key={index}
                                          className="border-b hover:bg-gray-50"
                                        >
                                          <td className="py-2 px-4 text-right">
                                            {bracket.limit === Infinity
                                              ? t("taxConfig.infinity")
                                              : bracket.limit}
                                          </td>
                                          <td className="py-2 px-4 text-right">
                                            {(bracket.rate * 100).toFixed(2)}%
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-gray-500">
                                  {t("taxConfig.noTaxBrackets")}
                                </p>
                              )}
                            </div>
                            {/* Other Taxes Table */}
                            <div>
                              <h5 className="text-md font-bold mb-2">
                                {t("taxConfig.otherTaxes")}
                              </h5>
                              {config.otherTaxes.length > 0 ? (
                                <table className="w-full text-sm border">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="py-2 px-4 text-right border-b">
                                        {t("taxConfig.name")}
                                      </th>
                                      <th className="py-2 px-4 text-right border-b">
                                        {t("taxConfig.rate")}
                                      </th>
                                      <th className="py-2 px-4 text-right border-b">
                                        {t("taxConfig.fixedAmount")}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {config.otherTaxes.map((tax, index) => (
                                      <tr
                                        key={index}
                                        className="border-b hover:bg-gray-50"
                                      >
                                        <td className="py-2 px-4 text-right">
                                          {tax.name}
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                          {tax.rate
                                            ? `${(tax.rate * 100).toFixed(2)}%`
                                            : "-"}
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                          {tax.fixedAmount
                                            ? `${tax.fixedAmount} ${config.currency}`
                                            : "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-gray-500">
                                  {t("taxConfig.noOtherTaxes")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxConfig;
