// src/pages/procurement/Procurement.jsx
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

// ייבוא jsPDF ו-jspdf-autotable
import jsPDF from "jspdf";
import "jspdf-autotable";

const Procurement = () => {
  const { t } = useTranslation();

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  console.log("authUser:", authUser);

  const { procurements, loading, error, fetchProcurements, deleteProcurement } =
    useProcurementStore();

  const { fetchProductsBySupplier, productsBySupplier } = useProductStore();
  const { fetchSupplierById } = useSupplierStore();

  // Local states
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
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (formData.supplierId) {
      fetchProductsBySupplier(formData.supplierId)
        .then(() => {
          setSupplierProducts(productsBySupplier);
        })
        .catch(() => {
          toast.error("Failed to load products.");
        });
    }
  }, [formData.supplierId, fetchProductsBySupplier, productsBySupplier]);

  // Calculate total cost when products change
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

      if (!rates[base]) {
        throw new Error(`Base currency ${base} not supported`);
      }
      if (!rates[to]) {
        throw new Error(`Target currency ${to} not supported`);
      }

      return rates[to] / rates[base];
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      toast.error("Failed to fetch exchange rate.");
      return null;
    }
  };

  const convertProductPrices = async (
    products,
    supplierCurrency,
    targetCurrency
  ) => {
    console.log("Converting prices:", { supplierCurrency, targetCurrency });

    if (supplierCurrency === targetCurrency) {
      console.log("No conversion needed, currencies are the same.");
      return products;
    }

    const rate = await fetchExchangeRate(supplierCurrency, targetCurrency);
    if (!rate) {
      toast.error("Failed to fetch exchange rate.");
      return products;
    }

    console.log("Conversion rate:", rate);

    return products.map((product) => {
      const basePrice = product.baseUnitPrice || product.unitPrice || 0;
      return {
        ...product,
        unitPrice: parseFloat((basePrice * rate).toFixed(2)),
        total: parseFloat((basePrice * rate * product.quantity).toFixed(2)),
      };
    });
  };

  const handleEditClick = async (procurement) => {
    setSelectedProcurement(procurement);

    try {
      const supplierDetails = await fetchSupplierById(procurement.supplierId);
      setSelectedSupplier(supplierDetails);

      const productsWithPrices = procurement.products.map((p) => {
        const basePrice = p.baseUnitPrice ?? p.unitPrice ?? 0;
        return {
          ...p,
          baseUnitPrice: basePrice,
          convertedUnitPrice: basePrice,
        };
      });

      setFormData({
        ...procurement,
        products: productsWithPrices,
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching supplier details or products:", err);
      toast.error("Failed to fetch supplier details or products.");
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this procurement?")) {
      await deleteProcurement(id);
      toast.success("Procurement deleted successfully!");
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();

    if (!productData.productName) {
      toast.error("Please select a product first.");
      return;
    }
    if (!productData.quantity || +productData.quantity <= 0) {
      toast.error("Please enter a valid quantity.");
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
        toast.success("Product quantity updated successfully!");
      } else {
        const newProduct = {
          ...productData,
          total: productData.quantity * productData.unitPrice,
        };
        updatedProducts = [...(prev.products || []), newProduct];
        toast.success("Product added successfully!");
      }

      return {
        ...prev,
        products: updatedProducts,
      };
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

  // פונקציית יצירת PDF
  const createPDF = async (procurementData) => {
    const currencySymbol = getCurrencySymbol(procurementData.currency);
    const pdf = new jsPDF();

    // כותרת
    pdf.setFontSize(22);
    pdf.setTextColor(0, 0, 128);
    pdf.text("Procurement Order", 105, 15, { align: "center" });

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Company: ${authUser?.company || "N/A"}`, 10, 20);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 10, 25);
    pdf.text(`Address: ${procurementData.DeliveryAddress || "N/A"}`, 10, 30);

    // פרטי ספק
    pdf.text(`Supplier: ${procurementData.supplierName || "N/A"}`, 150, 20);
    pdf.text(`Phone: ${selectedSupplier?.Phone || "N/A"}`, 150, 25);
    pdf.text(`Email: ${selectedSupplier?.Email || "N/A"}`, 150, 30);

    pdf.setDrawColor(200, 200, 200);
    pdf.line(10, 35, 200, 35);

    // טבלת מוצרים
    const columns = [
      { header: "Product Name", dataKey: "productName" },
      { header: "SKU", dataKey: "SKU" },
      { header: "Category", dataKey: "category" },
      { header: "Quantity", dataKey: "quantity" },
      { header: "Unit Price", dataKey: "unitPrice" },
      { header: "Total", dataKey: "total" },
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
        fillColor: [0, 0, 128],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
    });

    // סה"כ
    pdf.setFontSize(14);
    pdf.text(
      `Total Cost: ${procurementData.totalCost} ${currencySymbol}`,
      10,
      pdf.autoTable.previous.finalY + 10
    );

    // המרת PDF ל-Base64
    const base64PDF = pdf.output("datauristring").split(",")[1];

    return base64PDF;
  };

  // פונקציית קבלת סימן מטבע
  const getCurrencySymbol = (currencyCode) => {
    const selected = currency.find((cur) => cur.currencyCode === currencyCode);
    return selected ? selected.symbol : "";
  };

  const handleModalSave = async () => {
    if (!formData.products || formData.products.length === 0) {
      toast.error("You must have at least one product in the procurement.");
      return;
    }

    if (!formData.totalCost || formData.totalCost <= 0) {
      toast.error("Total cost cannot be zero.");
      return;
    }

    try {
      const updatedTotalCost = calculateTotalCost(formData.products || []);
      const updatedData = {
        ...formData,
        totalCost: updatedTotalCost,
        updateStatus: "pending update",
      };

      // יצירת PDF מהנתונים המעודכנים
      const pdfBase64 = await createPDF(updatedData);
      if (!pdfBase64) {
        toast.error("Failed to create PDF.");
        return;
      }

      // הוספת PDF לנתונים הנשלחים לשרת
      const dataToSend = {
        ...updatedData,
        summeryProcurement: pdfBase64, // Assuming the server expects this field
      };

      if (selectedProcurement.status !== "completed") {
        // עדכון ישיר כאשר הסטטוס אינו complete
        const response = await axiosInstance.put(
          `/procurement/${selectedProcurement._id}`,
          dataToSend
        );
        if (response.data.success) {
          toast.success("Procurement updated successfully!");
          setIsModalOpen(false);
          fetchProcurements(); // רענון הנתונים
        } else {
          toast.error("Failed to update procurement: " + response.data.message);
        }
      } else {
        // יצירת pending update כאשר הסטטוס הוא complete
        const response = await axiosInstance.post("/updateProcurement", {
          ProcurementId: selectedProcurement._id,
          updatedData: dataToSend,
        });
        await axiosInstance.put(`/procurement/${selectedProcurement._id}`, {
          statusUpdate: "pending update",
          ProcurementId: selectedProcurement._id,
        });

        if (response.data.success) {
          toast.success("Pending update created successfully!");
          setIsModalOpen(false);
          fetchProcurements(); // רענון הנתונים
        } else {
          toast.error(
            "Failed to create pending update: " + response.data.message
          );
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to process update. " + err.message);
    }
  };

  const supplierId = formData.supplierId;

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="container mx-auto max-w-6xl p-6 text-text">
        <h1 className="text-2xl font-bold text-primary mb-6">
          {t("procurement.records_title")}
        </h1>

        {loading && <p>{t("procurement.loading")}</p>}

        {!loading && procurements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {procurements.map((record) => (
              <div
                key={record._id}
                className="bg-secondary rounded-lg p-4 shadow-lg text-text"
              >
                <h2 className="text-lg font-bold text-primary mb-2">
                  {record.PurchaseOrder}
                </h2>
                <p>
                  <strong>{t("procurement.supplier")}:</strong>{" "}
                  {record.supplierName}
                </p>
                <p>
                  <strong>{t("procurement.total_cost")}:</strong>{" "}
                  {record.totalCost} {record.currency || "₪"}
                </p>
                <p>
                  <strong>{t("procurement.purchase_date")}:</strong>{" "}
                  {new Date(record.purchaseDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>{t("procurement.status")}:</strong>{" "}
                  {record.status || "Pending"}
                </p>

                <button
                  className="mt-4 bg-button-bg text-button-text py-2 px-4 rounded hover:bg-button-bg/90"
                  onClick={() => setSelectedPDF(record.summeryProcurement)}
                >
                  {t("procurement.view_pdf")}
                </button>

                {record.statusUpdate === null &&
                  record.orderStatus !== "Delivered" && (
                    <>
                      <button
                        className="mt-2 bg-accent text-button-text py-2 px-4 rounded hover:bg-accent/90"
                        onClick={() => handleEditClick(record)}
                      >
                        {t("procurement.edit")}
                      </button>
                      <button
                        className="mt-2 bg-secondary text-button-text py-2 px-4 rounded hover:bg-secondary/90"
                        onClick={() => handleDeleteClick(record._id)}
                      >
                        {t("procurement.delete")}
                      </button>
                    </>
                  )}
              </div>
            ))}
          </div>
        ) : (
          !loading && <p>No procurement records found.</p>
        )}

        {selectedPDF && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-bg p-6 rounded shadow-lg w-3/4 h-3/4 flex flex-col">
              <button
                className="self-end bg-button-bg text-button-text py-1 px-3 rounded hover:bg-button-bg/90"
                onClick={() => setSelectedPDF(null)}
              >
                {t("procurement.close")}
              </button>
              <iframe
                src={`${selectedPDF}`}
                title="Procurement PDF"
                className="w-full h-full mt-4 border border-border-color rounded"
              ></iframe>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-bg p-6 rounded shadow-lg w-3/4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-primary mb-4">
                {t("procurement.edit_title")}
              </h2>
              <form>
                {/* שדות עריכה עבור רכישה */}
                <div className="mb-4">
                  <label className="block text-text mb-2">
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
                    className="w-full p-2 rounded bg-secondary text-text border border-border-color"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-text mb-2">
                    {t("procurement.total_cost")}
                  </label>
                  <input
                    type="number"
                    value={formData.totalCost || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, totalCost: e.target.value })
                    }
                    className="w-full p-2 rounded bg-secondary text-text border border-border-color"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-text mb-2">
                    {t("procurement.currency")}
                  </label>
                  <input
                    type="text"
                    value={formData.currency || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="w-full p-2 rounded bg-secondary text-text border border-border-color"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-text mb-2">
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
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                    className="w-full p-2 rounded bg-secondary text-text border border-border-color"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-text mb-2">
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
                      setFormData({ ...formData, deliveryDate: e.target.value })
                    }
                    className="w-full p-2 rounded bg-secondary text-text border border-border-color"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-text mb-2">
                    {t("procurement.notes")}
                  </label>
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full p-2 rounded bg-secondary text-text border border-border-color"
                  ></textarea>
                </div>

                <h3 className="text-lg font-bold text-primary mb-4">
                  {t("procurement.products_in_procurement")}
                </h3>
                <table className="w-full text-text mb-4">
                  <thead>
                    <tr>
                      <th className="border border-border-color p-2">
                        {t("procurement.product_name")}
                      </th>
                      <th className="border border-border-color p-2">
                        {t("procurement.sku")}
                      </th>
                      <th className="border border-border-color p-2">
                        {t("procurement.category")}
                      </th>
                      <th className="border border-border-color p-2">
                        {t("procurement.quantity")}
                      </th>
                      <th className="border border-border-color p-2">
                        {t("procurement.unit_price")}
                      </th>
                      <th className="border border-border-color p-2">
                        {t("procurement.total")}
                      </th>
                      <th className="border border-border-color p-2">
                        {t("procurement.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.products?.map((product, index) => (
                      <tr key={index} className="border-b border-border-color">
                        <td className="border border-border-color p-2">
                          {product.productName}
                        </td>
                        <td className="border border-border-color p-2">
                          {product.SKU}
                        </td>
                        <td className="border border-border-color p-2">
                          {product.category}
                        </td>
                        <td className="border border-border-color p-2">
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
                            className="w-full p-2 bg-secondary rounded"
                          />
                        </td>
                        <td className="border border-border-color p-2">
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
                            className="w-full p-2 bg-secondary rounded"
                          />
                        </td>
                        <td className="border border-border-color p-2">
                          {product.quantity * product.unitPrice || 0}
                        </td>
                        <td className="border border-border-color p-2">
                          <button
                            type="button"
                            onClick={() => {
                              const newProducts = formData.products.filter(
                                (_, i) => i !== index
                              );
                              setFormData({
                                ...formData,
                                products: newProducts,
                              });
                            }}
                            className="bg-secondary text-button-text py-1 px-2 rounded hover:bg-secondary/90"
                          >
                            {t("procurement.Remove")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="text-lg font-bold text-primary mb-4">
                  {t("procurement.AddNewProduct")}
                </h3>
                <div className="bg-secondary p-4 rounded">
                  <label className="block text-text mb-2">
                    {t("procurement.select_product")}{" "}
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

                        if (!supplierBaseCurrency || !selectedCurrency) {
                          toast.error(t("procurement.currency_error"));
                          return;
                        }

                        fetchExchangeRate(
                          supplierBaseCurrency,
                          selectedCurrency
                        )
                          .then((rate) => {
                            if (!rate) {
                              toast.error("Failed to fetch conversion rate.");
                              return;
                            }

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
                          })
                          .catch(() => {
                            toast.error(
                              t("procurement.fetch_conversion_error")
                            );
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
                    className="w-full p-2 rounded bg-secondary"
                  >
                    <option value="">
                      -- {t("procurement.select_product_placeholder")} --
                    </option>
                    {supplierProducts.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.productName ||
                          t("procurement.unnamed_product")}
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-text text-sm">
                        {t("procurement.sku")}
                      </label>
                      <input
                        type="text"
                        value={productData.SKU}
                        readOnly
                        placeholder={t("procurement.sku_placeholder")}
                        className="w-full p-2 rounded bg-secondary"
                      />
                    </div>
                    <div>
                      <label className="text-text text-sm">
                        {t("procurement.category")}
                      </label>
                      <input
                        type="text"
                        value={productData.category}
                        readOnly
                        placeholder={t("procurement.category_placeholder")}
                        className="w-full p-2 rounded bg-secondary"
                      />
                    </div>
                    <div>
                      <label className="text-text text-sm">
                        {t("procurement.unit_price")}{" "}
                      </label>
                      <input
                        type="number"
                        value={productData.unitPrice}
                        readOnly
                        placeholder={t("procurement.unit_price_placeholder")}
                        className="w-full p-2 rounded bg-secondary"
                      />
                    </div>
                    <div>
                      <label className="text-text text-sm">
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
                        placeholder={t("procurement.quantity_placeholder")}
                        className="w-full p-2 rounded bg-secondary"
                        disabled={!supplierId}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddProduct}
                    className="bg-button-bg py-2 px-4 text-button-text rounded mt-4 hover:bg-button-bg/90"
                    disabled={!supplierId}
                  >
                    {t("procurement.add_product")}
                  </button>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    className="bg-secondary text-button-text py-2 px-4 rounded hover:bg-secondary/90 mr-2"
                    onClick={() => setIsModalOpen(false)}
                  >
                    {t("procurement.cancel")}
                  </button>
                  <button
                    type="button"
                    className="bg-button-bg text-button-text py-2 px-4 rounded hover:bg-button-bg/90"
                    onClick={handleModalSave}
                  >
                    {t("procurement.save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Procurement;
