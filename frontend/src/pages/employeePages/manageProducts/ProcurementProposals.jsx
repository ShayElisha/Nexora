import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  X,
  Package,
  DollarSign,
  Calendar,
  Save,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Tag,
  Hash,
  Loader2
} from "lucide-react";

const ProcurementProposals = () => {
  const { t } = useTranslation();

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;

  const [newProposal, setNewProposal] = useState({
    companyId: authUser?.company || "",
    title: "",
    description: "",
    items: [],
    expectedDeliveryDate: "",
    notes: "",
    attachments: "",
  });

  const [proposals, setProposals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser?.company) {
      setNewProposal(prev => ({ ...prev, companyId: authUser.company }));
    }
  }, [authUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const proposalsResponse = await axiosInstance.get("/proposals");
        setProposals(
          Array.isArray(proposalsResponse.data) ? proposalsResponse.data : []
        );

        const productsResponse = await axiosInstance.get("/product");
        const allProducts = Array.isArray(productsResponse.data?.data)
          ? productsResponse.data.data
          : [];
        const filteredProducts = allProducts.filter(
          (prod) =>
            prod.productType === "purchase" || prod.productType === "both"
        );
        setProducts(filteredProducts);
      } catch (error) {
        setProposals([]);
        setProducts([]);
        toast.error(t("procurement.error_loading_data"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProposal((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...newProposal.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]:
        name === "quantity" || name === "unitPrice" ? Number(value) : value,
    };
    setNewProposal((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleProductSelect = (index, e) => {
    const productId = e.target.value;
    const selectedProduct = products.find((p) => p._id === productId);
    const updatedItems = [...newProposal.items];

    if (selectedProduct) {
      updatedItems[index] = {
        ...updatedItems[index],
        productId: selectedProduct._id,
        productName:
          selectedProduct.productName || t("procurement.not_available"),
        sku: selectedProduct.sku || t("procurement.not_available"),
        category: selectedProduct.category || t("procurement.not_available"),
        unitPrice: selectedProduct.unitPrice || 0,
        quantity: updatedItems[index].quantity || 1,
        isNew: false,
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        productId: null,
        productName: "",
        sku: t("procurement.not_available"),
        category: t("procurement.not_available"),
        unitPrice: 0,
        isNew: true,
      };
    }

    setNewProposal((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setNewProposal((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: null,
          productName: "",
          sku: t("procurement.not_available"),
          category: t("procurement.not_available"),
          unitPrice: 0,
          quantity: 1,
          isNew: true,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    const updatedItems = [...newProposal.items];
    updatedItems.splice(index, 1);
    setNewProposal((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const attachmentsArray = newProposal.attachments
      ? newProposal.attachments
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url)
      : [];

    const proposalData = {
      ...newProposal,
      items: newProposal.items.map((item) => ({
        productId: item.productId || null,
        productName: item.productName || t("procurement.not_available"),
        sku: item.sku || t("procurement.not_available"),
        category: item.category || t("procurement.not_available"),
        unitPrice: item.unitPrice || 0,
        quantity: item.quantity || 0,
        total: (item.quantity || 0) * (item.unitPrice || 0),
      })),
      attachments: attachmentsArray,
      expectedDeliveryDate: newProposal.expectedDeliveryDate
        ? new Date(newProposal.expectedDeliveryDate)
        : undefined,
    };

    try {
      const response = await axiosInstance.post("/proposals", proposalData);
      setProposals([...proposals, response.data]);
      setNewProposal({
        companyId: authUser?.company || "",
        title: "",
        description: "",
        items: [],
        expectedDeliveryDate: "",
        notes: "",
        attachments: "",
      });
      toast.success(t("procurement.proposal_created_successfully"));
    } catch (error) {
      toast.error(t("procurement.error_creating_proposal"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--text-color)' }}>{t("procurement.loading_proposals")}</p>
        </motion.div>
      </div>
    );
  }

  const totalEstimatedCost = newProposal.items.reduce((sum, item) => 
    sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <FileText size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("procurement.proposals")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("procurement.create_and_manage_proposals")}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create New Proposal Form */}
          <motion.div
            className="lg:col-span-2 rounded-2xl shadow-lg border p-6 lg:p-8"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Plus size={24} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("procurement.create_new_proposal")}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <FileText className="inline mr-2" size={16} />
                  {t("procurement.title")}
                </label>
                <input
                  type="text"
                  name="title"
                  value={newProposal.title}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("procurement.enter_proposal_title")}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("procurement.description")}
                </label>
                <textarea
                  name="description"
                  value={newProposal.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("procurement.enter_description")}
                />
              </div>

              {/* Products */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                    <Package size={18} />
                    {t("procurement.products_to_purchase")}
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-2"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                  >
                    <Plus size={16} />
                    {t("procurement.add_product")}
                  </button>
                </div>

                <div className="space-y-4">
                  <AnimatePresence>
                    {newProposal.items.map((item, index) => (
                      <motion.div
                        key={index}
                        className="p-4 border rounded-xl"
                        style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>
                            {t("procurement.product")} #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1 rounded-lg hover:scale-110 transition-all text-red-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <select
                            value={item.productId || ""}
                            onChange={(e) => handleProductSelect(index, e)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                          >
                            <option value="">
                              {t("procurement.new_or_undefined_product")}
                            </option>
                            {products.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.productName} - {product.sku}
                              </option>
                            ))}
                          </select>

                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              name="productName"
                              value={item.productName}
                              onChange={(e) => handleItemChange(index, e)}
                              disabled={!item.isNew}
                              placeholder={t("procurement.product_name")}
                              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                            />
                            <input
                              type="text"
                              name="sku"
                              value={item.sku}
                              onChange={(e) => handleItemChange(index, e)}
                              disabled={!item.isNew}
                              placeholder={t("procurement.sku")}
                              className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                            />
                          </div>

                          <input
                            type="text"
                            name="category"
                            value={item.category}
                            onChange={(e) => handleItemChange(index, e)}
                            disabled={!item.isNew}
                            placeholder={t("procurement.category")}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-secondary)' }}>
                                {t("procurement.unit_price")}
                              </label>
                              <input
                                type="number"
                                name="unitPrice"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, e)}
                                min="0"
                                step="0.01"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-secondary)' }}>
                                {t("procurement.quantity")}
                              </label>
                              <input
                                type="number"
                                name="quantity"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, e)}
                                min="1"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                              {t("procurement.total")}: {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()} ₪
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {newProposal.items.length === 0 && (
                    <motion.div
                      className="text-center py-8 rounded-xl border-2 border-dashed"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Package size={48} className="mx-auto mb-3" style={{ color: 'var(--color-secondary)' }} />
                      <p style={{ color: 'var(--color-secondary)' }}>
                        {t("procurement.no_products_added")}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Expected Delivery Date */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Calendar className="inline mr-2" size={16} />
                  {t("procurement.expected_delivery_date")}
                </label>
                <input
                  type="date"
                  name="expectedDeliveryDate"
                  value={newProposal.expectedDeliveryDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("procurement.notes")}
                </label>
                <textarea
                  name="notes"
                  value={newProposal.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("procurement.enter_notes")}
                />
              </div>

              {/* Total Summary */}
              {newProposal.items.length > 0 && (
                <motion.div
                  className="p-4 rounded-xl border-2"
                  style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--color-primary)' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.total_estimated_cost")}:
                    </span>
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                      {totalEstimatedCost.toLocaleString()} ₪
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={newProposal.items.length === 0}
                className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
              >
                <Save size={24} />
                {t("procurement.create_proposal")}
              </button>
            </form>
          </motion.div>

          {/* Existing Proposals */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="rounded-2xl shadow-lg border p-6 sticky top-6" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>
                {t("procurement.existing_proposals")}
              </h2>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {proposals.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--color-secondary)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                      {t("procurement.no_proposals")}
                    </p>
                  </div>
                ) : (
                  proposals.map((proposal, index) => (
                    <motion.div
                      key={proposal._id}
                      className="p-4 border rounded-xl hover:shadow-md transition-all"
                      style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold" style={{ color: 'var(--text-color)' }}>
                          {proposal.title || t("procurement.no_title")}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          proposal.status === "approved" ? 'bg-green-100 text-green-700' :
                          proposal.status === "pending" ? 'bg-yellow-100 text-yellow-700' :
                          proposal.status === "rejected" ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {proposal.status === "approved" ? <CheckCircle size={12} className="inline mr-1" /> :
                           proposal.status === "pending" ? <Clock size={12} className="inline mr-1" /> :
                           proposal.status === "rejected" ? <XCircle size={12} className="inline mr-1" /> : null}
                          {proposal.status || t("procurement.not_defined")}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--color-secondary)' }}>
                        {proposal.description?.substring(0, 80)}
                        {proposal.description?.length > 80 ? "..." : ""}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: 'var(--color-secondary)' }}>
                          {proposal.items?.length || 0} {t("procurement.products")}
                        </span>
                        <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
                          {proposal.totalEstimatedCost?.toLocaleString() || 0} ₪
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementProposals;
