import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProductStore } from "../../../stores/useProductStore.js";
import useProcurementStore from "../../../stores/useProcurementStore.js";
import { useSupplierStore } from "../../../stores/useSupplierStore.js";
import toast from "react-hot-toast";
import axios from "axios";
import axiosInstance from "../../../lib/axios.js";
import currency from "../finance/currency.json";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Procurement = () => {
  const { t } = useTranslation();

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;

  const { procurements, loading, error, fetchProcurements, deleteProcurement } =
    useProcurementStore();
  const { fetchProductsBySupplier, productsBySupplier } = useProductStore();
  const { fetchSupplierById } = useSupplierStore();

  const [selectedPDF, setSelectedPDF] = useState(null);
  const [selectedProcurement, setSelectedProcurement] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [productData, setProductData] = useState({
    productName: "",
    SKU: "",
    category: "",
    baseUnitPrice: 0,
    baseCurrency: "USD",
    unitPrice: 0,
    quantity: 0,
  });

  const calculateTotalCost = (products) =>
    products.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0);

  useEffect(() => {
    fetchProcurements();
  }, [fetchProcurements]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (formData.supplierId) {
      fetchProductsBySupplier(formData.supplierId)
        .then(() => setSupplierProducts(productsBySupplier))
        .catch(() => toast.error(t("procurement.fetch_products_failed")));
    }
  }, [formData.supplierId, fetchProductsBySupplier, productsBySupplier]);

  useEffect(() => {
    if (formData.products) {
      const newTotalCost = calculateTotalCost(formData.products);
      if (newTotalCost !== formData.totalCost) {
        setFormData((prev) => ({ ...prev, totalCost: newTotalCost }));
      }
    }
  }, [formData.products]);

  const fetchExchangeRate = async (base, to) => {
    try {
      const APP_ID = "c0a27335761440d6a00427823918124b";
      const response = await axios.get(
        `https://openexchangerates.org/api/latest.json?app_id=${APP_ID}`
      );
      const rates = response.data.rates;
      return rates[to] / rates[base];
    } catch (error) {
      toast.error(t("procurement.fetch_exchange_rate_failed"));
      return null;
    }
  };

  const convertProductPrices = async (
    products,
    supplierCurrency,
    targetCurrency
  ) => {
    if (supplierCurrency === targetCurrency) return products;
    const rate = await fetchExchangeRate(supplierCurrency, targetCurrency);
    if (!rate) return products;

    return products.map((product) => ({
      ...product,
      unitPrice: parseFloat((product.baseUnitPrice * rate).toFixed(2)),
      total: parseFloat(
        (product.baseUnitPrice * rate * product.quantity).toFixed(2)
      ),
    }));
  };

  const handleEditClick = async (procurement) => {
    setSelectedProcurement(procurement);
    try {
      const supplierDetails = await fetchSupplierById(procurement.supplierId);
      setSelectedSupplier(supplierDetails);

      const productsWithPrices = procurement.products.map((p) => ({
        ...p,
        baseUnitPrice: p.baseUnitPrice ?? p.unitPrice ?? 0,
        convertedUnitPrice: p.unitPrice,
      }));

      setFormData({ ...procurement, products: productsWithPrices });
      setIsModalOpen(true);
    } catch (err) {
      toast.error(t("procurement.fetch_supplier_failed"));
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm(t("procurement.confirm_delete"))) {
      await deleteProcurement(id);
      toast.success(t("procurement.delete_success"));
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!productData.productName) {
      toast.error(t("procurement.no_product_selected"));
      return;
    }
    if (!productData.quantity || +productData.quantity <= 0) {
      toast.error(t("procurement.invalid_quantity"));
      return;
    }

    setFormData((prev) => {
      const existingIndex = (prev.products || []).findIndex(
        (p) => p.SKU === productData.SKU
      );
      let updatedProducts;
      if (existingIndex !== -1) {
        updatedProducts = [...prev.products];
        const existingProduct = updatedProducts[existingIndex];
        const newQuantity = existingProduct.quantity + productData.quantity;
        updatedProducts[existingIndex] = {
          ...existingProduct,
          quantity: newQuantity,
          total: newQuantity * existingProduct.unitPrice,
        };
        toast.success(t("procurement.quantity_updated"));
      } else {
        updatedProducts = [
          ...(prev.products || []),
          {
            ...productData,
            total: productData.quantity * productData.unitPrice,
          },
        ];
        toast.success(t("procurement.product_added"));
      }
      return { ...prev, products: updatedProducts };
    });

    setProductData({
      productName: "",
      SKU: "",
      category: "",
      baseUnitPrice: 0,
      baseCurrency: "USD",
      unitPrice: 0,
      quantity: 0,
    });
  };

  const createPDF = async (procurementData) => {
    const currencySymbol = getCurrencySymbol(procurementData.currency);
    const pdf = new jsPDF();
    pdf.setFontSize(22);
    pdf.setTextColor(0, 0, 128);
    pdf.text(t("procurement.order_title"), 105, 15, { align: "center" });

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `${t("procurement.company")}: ${authUser?.company || "N/A"}`,
      10,
      20
    );
    pdf.text(
      `${t("procurement.date")}: ${new Date().toLocaleDateString()}`,
      10,
      25
    );
    pdf.text(
      `${t("procurement.address")}: ${
        procurementData.DeliveryAddress || "N/A"
      }`,
      10,
      30
    );

    pdf.text(
      `${t("procurement.supplier")}: ${procurementData.supplierName || "N/A"}`,
      150,
      20
    );
    pdf.text(
      `${t("procurement.phone")}: ${selectedSupplier?.Phone || "N/A"}`,
      150,
      25
    );
    pdf.text(
      `${t("procurement.email")}: ${selectedSupplier?.Email || "N/A"}`,
      150,
      30
    );

    pdf.setDrawColor(200, 200, 200);
    pdf.line(10, 35, 200, 35);

    const columns = [
      { header: t("procurement.product_name"), dataKey: "productName" },
      { header: t("procurement.sku"), dataKey: "SKU" },
      { header: t("procurement.category"), dataKey: "category" },
      { header: t("procurement.quantity"), dataKey: "quantity" },
      { header: t("procurement.unit_price"), dataKey: "unitPrice" },
      { header: t("procurement.total"), dataKey: "total" },
    ];

    const rows = procurementData.products.map((prod) => ({
      productName: prod.productName,
      SKU: prod.SKU,
      category: prod.category,
      quantity: prod.quantity,
      unitPrice: `${prod.unitPrice} ${currencySymbol}`,
      total: `${prod.unitPrice * prod.quantity} ${currencySymbol}`,
    }));

    pdf.autoTable({
      startY: 40,
      head: [columns.map((c) => c.header)],
      body: rows.map((r) => Object.values(r)),
      styles: { fontSize: 10, textColor: [0, 0, 0] },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
    });

    pdf.setFontSize(14);
    pdf.text(
      `${t("procurement.total_cost")}: ${
        procurementData.totalCost
      } ${currencySymbol}`,
      10,
      pdf.autoTable.previous.finalY + 10
    );

    return pdf.output("datauristring").split(",")[1];
  };

  const getCurrencySymbol = (currencyCode) =>
    currency.find((cur) => cur.currencyCode === currencyCode)?.symbol || "";

  const handleModalSave = async () => {
    if (!formData.products || formData.products.length === 0) {
      toast.error(t("procurement.no_products"));
      return;
    }
    if (!formData.totalCost || formData.totalCost <= 0) {
      toast.error(t("procurement.invalid_total_cost"));
      return;
    }

    try {
      const updatedTotalCost = calculateTotalCost(formData.products || []);
      const updatedData = {
        ...formData,
        totalCost: updatedTotalCost,
        updateStatus: "pending update",
      };
      const pdfBase64 = await createPDF(updatedData);

      const dataToSend = { ...updatedData, summeryProcurement: pdfBase64 };

      if (selectedProcurement.status !== "completed") {
        const response = await axiosInstance.put(
          `/procurement/${selectedProcurement._id}`,
          dataToSend
        );
        if (response.data.success) {
          toast.success(t("procurement.update_success"));
          setIsModalOpen(false);
          fetchProcurements();
        } else {
          toast.error(t("procurement.update_failed"));
        }
      } else {
        const response = await axiosInstance.post("/updateProcurement", {
          ProcurementId: selectedProcurement._id,
          updatedData: dataToSend,
        });
        await axiosInstance.put(`/procurement/${selectedProcurement._id}`, {
          statusUpdate: "pending update",
          ProcurementId: selectedProcurement._id,
        });

        if (response.data.success) {
          toast.success(t("procurement.pending_update_success"));
          setIsModalOpen(false);
          fetchProcurements();
        } else {
          toast.error(t("procurement.pending_update_failed"));
        }
      }
    } catch (err) {
      toast.error(t("procurement.process_failed"));
    }
  };

  const supplierId = formData.supplierId;

  return (
    <div className="flex min-h-screen bg-bg animate-fade-in">
      <div className="container mx-auto max-w-6xl p-6 text-text">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-center mb-6 text-text tracking-tight drop-shadow-md">
          {t("procurement.records_title")}
        </h1>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-primary"></div>
          </div>
        ) : procurements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {procurements.map((record) => (
              <div
                key={record._id}
                className="bg-accent rounded-xl p-6 shadow-lg border border-border-color"
              >
                <h2 className="text-lg font-bold text-primary mb-3 tracking-tight">
                  {record.PurchaseOrder}
                </h2>
                <p className="text-sm">
                  <strong>{t("procurement.supplier")}:</strong>{" "}
                  {record.supplierName}
                </p>
                <p className="text-sm">
                  <strong>{t("procurement.total_cost")}:</strong>{" "}
                  {record.totalCost} {record.currency || "₪"}
                </p>
                <p className="text-sm">
                  <strong>{t("procurement.purchase_date")}:</strong>{" "}
                  {new Date(record.purchaseDate).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <strong>{t("procurement.status")}:</strong>{" "}
                  <span
                    className={`font-medium ${
                      record.status === "completed"
                        ? "text-green-500"
                        : record.status === "pending"
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {record.status || "Pending"}
                  </span>
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="bg-button-bg text-button-text py-2 px-4 rounded-full shadow-md hover:bg-secondary transition-all duration-200"
                    onClick={() => setSelectedPDF(record.summeryProcurement)}
                  >
                    {t("procurement.view_pdf")}
                  </button>
                  {record.statusUpdate === null &&
                    record.orderStatus !== "Delivered" && (
                      <>
                        <button
                          className="bg-primary text-button-text py-2 px-4 rounded-full shadow-md hover:bg-secondary transition-all duration-200"
                          onClick={() => handleEditClick(record)}
                        >
                          {t("procurement.edit")}
                        </button>
                        <button
                          className="bg-red-500 text-button-text py-2 px-4 rounded-full shadow-md hover:bg-red-600 transition-all duration-200"
                          onClick={() => handleDeleteClick(record._id)}
                        >
                          {t("procurement.delete")}
                        </button>
                      </>
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-text opacity-70 text-lg font-semibold">
            {t("procurement.no_records")}
          </p>
        )}

        {/* PDF Modal */}
        {selectedPDF && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-bg p-6 rounded-2xl shadow-2xl w-11/12 sm:w-3/4 h-3/4 flex flex-col border border-border-color">
              <button
                className="self-end bg-button-bg text-button-text py-1 px-3 rounded-full shadow-md hover:bg-secondary transition-all duration-200"
                onClick={() => setSelectedPDF(null)}
              >
                {t("procurement.close")}
              </button>
              <iframe
                src={`${selectedPDF}`}
                title="Procurement PDF"
                className="w-full h-full mt-4 border border-border-color rounded-lg"
              ></iframe>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-accent p-6 rounded-2xl shadow-2xl w-11/12 sm:w-3/4 max-h-[90vh] overflow-y-auto border border-border-color">
              <h2 className="text-xl sm:text-2xl font-bold text-text mb-6 tracking-tight drop-shadow-md">
                {t("procurement.edit_title")}
              </h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2 tracking-wide">
                      {t("procurement.purchase_order")}
                    </label>
                    <input
                      type="text"
                      value={formData.PurchaseOrder || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          PurchaseOrder: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2 tracking-wide">
                      {t("procurement.total_cost")}
                    </label>
                    <input
                      type="number"
                      value={formData.totalCost || ""}
                      readOnly
                      className="w-full p-3 border border-border-color rounded-lg bg-bg text-text opacity-70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2 tracking-wide">
                      {t("procurement.currency")}
                    </label>
                    <input
                      type="text"
                      value={formData.currency || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2 tracking-wide">
                      {t("procurement.purchase_date")}
                    </label>
                    <input
                      type="date"
                      value={
                        formData.purchaseDate
                          ? formData.purchaseDate.slice(0, 10)
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchaseDate: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-2 tracking-wide">
                      {t("procurement.delivery_date")}
                    </label>
                    <input
                      type="date"
                      value={
                        formData.deliveryDate
                          ? formData.deliveryDate.slice(0, 10)
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryDate: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-2 tracking-wide">
                    {t("procurement.notes")}
                  </label>
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition-all duration-200"
                    rows="3"
                  />
                </div>

                <h3 className="text-lg font-semibold text-text mb-4 tracking-tight drop-shadow-sm">
                  {t("procurement.products_in_procurement")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-text rounded-lg shadow-md border border-border-color">
                    <thead>
                      <tr className="bg-button-bg text-button-text">
                        <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                          {t("procurement.product_name")}
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                          {t("procurement.sku")}
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                          {t("procurement.category")}
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                          {t("procurement.quantity")}
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                          {t("procurement.unit_price")}
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                          {t("procurement.total")}
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold tracking-wide">
                          {t("procurement.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.products?.map((product, index) => (
                        <tr
                          key={index}
                          className="border-b border-border-color hover:bg-accent"
                        >
                          <td className="py-3 px-4 text-sm">
                            {product.productName}
                          </td>
                          <td className="py-3 px-4 text-sm">{product.SKU}</td>
                          <td className="py-3 px-4 text-sm">
                            {product.category}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <input
                              type="number"
                              value={product.quantity}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  products: formData.products.map((p, i) =>
                                    i === index
                                      ? { ...p, quantity: +e.target.value }
                                      : p
                                  ),
                                })
                              }
                              className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition-all duration-200"
                            />
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <input
                              type="number"
                              value={product.unitPrice || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  products: formData.products.map((p, i) =>
                                    i === index
                                      ? { ...p, unitPrice: +e.target.value }
                                      : p
                                  ),
                                })
                              }
                              className="w-full p-2 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition-all duration-200"
                            />
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {(product.quantity * product.unitPrice).toFixed(
                              2
                            ) || 0}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  products: formData.products.filter(
                                    (_, i) => i !== index
                                  ),
                                })
                              }
                              className="bg-red-500 text-button-text py-1 px-3 rounded-full shadow-md hover:bg-red-600 transition-all duration-200"
                            >
                              {t("procurement.Remove")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-semibold text-text mb-4 tracking-tight drop-shadow-sm">
                  {t("procurement.AddNewProduct")}
                </h3>
                <div className="bg-accent p-4 rounded-xl shadow-md border border-border-color">
                  <label className="block text-sm font-semibold text-text mb-2 tracking-wide">
                    {t("procurement.select_product")}
                  </label>
                  <select
                    disabled={!supplierId}
                    value={
                      supplierProducts.find((p) => p.SKU === productData.SKU)
                        ?._id || ""
                    }
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const prod = supplierProducts.find(
                        (p) => p._id === selectedId
                      );
                      if (prod) {
                        const supplierBaseCurrency =
                          selectedSupplier?.baseCurrency || "USD";
                        const selectedCurrency = formData.currency || "USD";
                        fetchExchangeRate(
                          supplierBaseCurrency,
                          selectedCurrency
                        ).then((rate) => {
                          if (!rate) return;
                          const convertedPrice = (
                            prod.unitPrice * rate
                          ).toFixed(2);
                          setProductData({
                            productName: prod.productName,
                            SKU: prod.SKU,
                            category: prod.category,
                            baseUnitPrice: prod.unitPrice || 0,
                            baseCurrency: supplierBaseCurrency,
                            unitPrice: parseFloat(convertedPrice),
                            quantity: 1,
                          });
                        });
                      } else {
                        setProductData({
                          productName: "",
                          SKU: "",
                          category: "",
                          baseUnitPrice: 0,
                          baseCurrency: "USD",
                          unitPrice: 0,
                          quantity: 0,
                        });
                      }
                    }}
                    className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition-all duration-200 disabled:opacity-50"
                  >
                    <option value="">
                      {t("procurement.select_product_placeholder")}
                    </option>
                    {supplierProducts.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.productName ||
                          t("procurement.unnamed_product")}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-text mb-2 tracking-wide">
                        {t("procurement.sku")}
                      </label>
                      <input
                        type="text"
                        value={productData.SKU}
                        readOnly
                        className="w-full p-3 border border-border-color rounded-lg bg-bg text-text opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text mb-2 tracking-wide">
                        {t("procurement.category")}
                      </label>
                      <input
                        type="text"
                        value={productData.category}
                        readOnly
                        className="w-full p-3 border border-border-color rounded-lg bg-bg text-text opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text mb-2 tracking-wide">
                        {t("procurement.unit_price")}
                      </label>
                      <input
                        type="number"
                        value={productData.unitPrice}
                        readOnly
                        className="w-full p-3 border border-border-color rounded-lg bg-bg text-text opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text mb-2 tracking-wide">
                        {t("procurement.quantity")}
                      </label>
                      <input
                        type="number"
                        value={productData.quantity}
                        onChange={(e) =>
                          setProductData((prev) => ({
                            ...prev,
                            quantity: +e.target.value,
                          }))
                        }
                        className="w-full p-3 border border-border-color rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary transition-all duration-200 disabled:opacity-50"
                        disabled={!supplierId}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddProduct}
                    className="mt-4 w-full bg-button-bg text-button-text py-2 px-4 rounded-full shadow-md hover:bg-secondary transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!supplierId}
                  >
                    {t("procurement.add_product")}
                  </button>
                </div>

                <div className="flex justify-end mt-6 gap-4">
                  <button
                    type="button"
                    className="bg-gray-500 text-button-text py-2 px-4 rounded-full shadow-md hover:bg-gray-600 transition-all duration-200"
                    onClick={() => setIsModalOpen(false)}
                  >
                    {t("procurement.cancel")}
                  </button>
                  <button
                    type="button"
                    className="bg-button-bg text-button-text py-2 px-4 rounded-full shadow-md hover:bg-secondary transition-all duration-200"
                    onClick={handleModalSave}
                  >
                    {t("procurement.save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        `}</style>
      </div>
    </div>
  );
};

export default Procurement;
