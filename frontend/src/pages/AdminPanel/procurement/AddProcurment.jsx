// src/pages/procurement/AddProcurement.jsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Zustand Stores
import { useSupplierStore } from "../../../stores/useSupplierStore";
import { useSignatureStore } from "../../../stores/useSignatureStore";
import { useEmployeeStore } from "../../../stores/useEmployeeStore";
import { useProductStore } from "../../../stores/useProductStore";

// Components
import Sidebar from "../layouts/Sidebar";
import SupplierSelect from "./components/SupplierSelect";
import PaymentAndShipping from "./components/PaymentAndShipping";
import SignaturesModal from "./components/SignaturesModal";
import ProductSelector from "./components/ProductSelector";
import PreviewModal from "./components/PreviewModal";

// JSON
import currency from "../finance/currency.json";
import { useTranslation } from "react-i18next";

import axiosInstance from "../../../lib/axios";

const AddProcurement = () => {
  const { t } = useTranslation();

  const queryClient = useQueryClient();
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;

  // ----------------- Form Data ----------------- //
  const [formData, setFormData] = useState({
    companyId: authUser?.company || "",
    supplierId: "",
    supplierName: "",
    PurchaseOrder: generatePurchaseOrderNumber(),
    PaymentMethod: "",
    PaymentTerms: "",
    DeliveryAddress: "",
    ShippingMethod: "",
    currency: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    warrantyExpiration: "",
    receivedDate: "",
    notes: "",
    shippingCost: 0,
    requiresCustoms: false,
    products: [],
    totalCost: 0,
    summeryProcurement: "",
    status: "pending",
    currentSignatures: 0,
    currentSignerIndex: 0,
    signers: [],
  });

  // ----------------- Local States ----------------- //
  const [products, setProducts] = useState([]);
  const [totalCost, setTotalCost] = useState(0);

  const [productData, setProductData] = useState({
    productName: "",
    SKU: "",
    category: "",
    unitPrice: "",
    quantity: "",
    baseUnitPrice: 0,
  });

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(""); // להצגת ה-PDF
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newRequirement, setNewRequirement] = useState("");
  const [newSigners, setNewSigners] = useState([]);

  // ----------------- Zustand Stores ----------------- //
  const { suppliers, fetchSuppliers } = useSupplierStore((state) => state);

  const {
    employees,
    fetchEmployees, // => טעינת עובדים
  } = useEmployeeStore((state) => state);

  const {
    signatureLists,
    fetchSignatureLists,
    deleteSignatureList,
    createSignatureList,
  } = useSignatureStore((state) => state);

  const {
    productsBySupplier,
    fetchProductsBySupplier, // => טעינת מוצרים לפי ספק
  } = useProductStore((state) => state);

  // ----------------- useEffect ----------------- //
  useEffect(() => {
    fetchSuppliers().catch(() =>
      toast.error(t("procurement.failed_to_load_suppliers"))
    );
    fetchEmployees().catch(() =>
      toast.error(t("procurement.failed_to_load_employees"))
    );
    fetchSignatureLists().catch(() =>
      toast.error(t("procurement.failed_to_load_signatures"))
    );
  }, [fetchSuppliers, fetchEmployees, fetchSignatureLists, t]);

  // ----------------- Mutations ----------------- //
  const { mutate: addProcurementMutation } = useMutation({
    mutationFn: async (procurementData) => {
      const response = await axiosInstance.post(
        "/procurement",
        procurementData,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("procurement.procurement_created_successfully"));
      queryClient.invalidateQueries(["procurement"]);
      resetForm();
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          t("procurement.failed_to_create_procurement")
      );
    },
  });

  // ----------------- Helpers ----------------- //
  function generatePurchaseOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
    return `PO-${year}${month}${day}-${randomNumber}`;
  }

  const getCurrencySymbol = (currencyCode) => {
    const selected = currency.find((cur) => cur.currencyCode === currencyCode);
    return selected ? selected.symbol : "";
  };

  const fetchExchangeRate = async (base, to) => {
    try {
      const APP_ID = "c0a27335761440d6a00427823918124b";
      const response = await axios.get(
        `https://openexchangerates.org/api/latest.json?app_id=${APP_ID}`
      );
      const rates = response.data.rates;

      if (!rates[base]) {
        throw new Error(t("procurement.base_currency_not_supported", { base }));
      }
      if (!rates[to]) {
        throw new Error(t("procurement.target_currency_not_supported", { to }));
      }

      const finalRate = rates[to] / rates[base];
      return finalRate;
    } catch (error) {
      toast.error(t("procurement.fetch_conversion_error"));
      throw error;
    }
  };
  useEffect(() => {
    if (authUser) {
      setFormData((prev) => ({
        ...prev,
        companyId: authUser.company,
      }));
    }
  }, [authUser]);

  const [previousSupplierId, setPreviousSupplierId] = useState(null);

  useEffect(() => {
    // אם לא נבחר ספק כלל
    if (!selectedSupplier) {
      return;
    }

    // אם המזהה של הספק החדש שווה למזהה של הספק הקודם, אל תאפס
    if (previousSupplierId === selectedSupplier._id) {
      return;
    }

    // במידה וזה ספק *חדש* – עשה איפוס
    setFormData(() => ({
      companyId: authUser?.company || "",
      supplierId: selectedSupplier._id,
      supplierName: selectedSupplier.SupplierName,
      PurchaseOrder: generatePurchaseOrderNumber(),
      purchaseDate: new Date().toISOString().split("T")[0],
    }));

    // איפוס מוצרים ועלויות
    setProducts([]);
    setTotalCost(0);

    // עדכון previousSupplierId בסוף
    setPreviousSupplierId(selectedSupplier._id);
  }, [selectedSupplier, previousSupplierId, authUser?.company]);

  // ----------------- Convert Currency ----------------- //
  const convertAllProductsForSelectedSupplier = async (selectedCurrency) => {
    try {
      // אם לא נבחר ספק, אין מה להמיר
      if (!selectedSupplier) {
        toast.error(t("procurement.please_select_supplier_first"));
        return;
      }

      // שליפת מטבע הבסיס של הספק
      const supplierBaseCurrency = selectedSupplier.baseCurrency || "USD";

      // סינון כל המוצרים השייכים לספק
      const supplierProducts = products.filter(
        (product) => product.supplierId === selectedSupplier._id
      );

      const updatedProducts = await Promise.all(
        supplierProducts.map(async (product) => {
          const basePrice = product.baseUnitPrice || product.unitPrice;
          const qty = product.quantity;

          // אם המטבע הנבחר זהה למטבע הבסיס של הספק
          if (supplierBaseCurrency === selectedCurrency) {
            return {
              ...product,
              unitPrice: basePrice,
              total: basePrice * qty,
            };
          }

          // חישוב שער המרה
          const rate = await fetchExchangeRate(
            supplierBaseCurrency,
            selectedCurrency
          );
          const convertedPrice = (basePrice * rate).toFixed(2);
          const convertedTotal = (convertedPrice * qty).toFixed(2);

          return {
            ...product,
            unitPrice: parseFloat(convertedPrice),
            total: parseFloat(convertedTotal),
          };
        })
      );

      // החלפת המוצרים שסוננו במוצרים המעודכנים
      const updatedProductList = products.map((product) => {
        if (product.supplierId === selectedSupplier._id) {
          const updatedProduct = updatedProducts.find(
            (upd) => upd.SKU === product.SKU
          );
          return updatedProduct || product;
        }
        return product;
      });

      // חישוב עלות כוללת חדשה לספק הנוכחי
      const newTotalCost = updatedProductList
        .filter((p) => p.supplierId === selectedSupplier._id)
        .reduce((acc, p) => acc + p.total, 0);

      // עדכון State
      setProducts(updatedProductList);
      setTotalCost(parseFloat(newTotalCost.toFixed(2)));
    } catch (error) {
      toast.error(t("procurement.failed_to_convert_currency"));
      console.error("Currency conversion error:", error);
    }
  };

  const calculateTotalCost = (products) => {
    return products.reduce((acc, product) => acc + (product.total || 0), 0);
  };

  useEffect(() => {
    const updatedTotalCost = calculateTotalCost(products);
    setTotalCost(updatedTotalCost);
  }, [products]);
  // ----------------- Create PDF ----------------- //
  const createPDF = async () => {
    const currencySymbol = getCurrencySymbol(formData.currency);
    const pdf = new jsPDF();

    // כותרת
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
      `${t("procurement.address")}: ${formData.DeliveryAddress || "N/A"}`,
      10,
      30
    );

    // פרטי ספק
    pdf.text(
      `${t("procurement.supplier")}: ${formData.supplierName || "N/A"}`,
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

    // טבלת מוצרים
    const columns = [
      { header: t("procurement.product_name"), dataKey: "productName" },
      { header: t("procurement.sku"), dataKey: "SKU" },
      { header: t("procurement.category"), dataKey: "category" },
      { header: t("procurement.quantity"), dataKey: "quantity" },
      { header: t("procurement.unit_price"), dataKey: "unitPrice" },
      { header: t("procurement.total"), dataKey: "total" },
    ];

    const rows = products.map((prod) => ({
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
      `${t("procurement.total_cost")}: ${totalCost} ${currencySymbol}`,
      10,
      pdf.autoTable.previous.finalY + 10
    );

    // הפיכת PDF ל-Blob ול-Base64
    const pdfBlob = pdf.output("blob");
    const base64PDF = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    // שמירה ב-formData לצורך שליחה לשרת
    setFormData((prev) => ({
      ...prev,
      summeryProcurement: base64PDF,
    }));

    // החזרת כתובת Blob לצורך תצוגה מקדימה
    return URL.createObjectURL(pdfBlob);
  };

  // ----------------- Handlers ----------------- //

  // 1) handleFormChange
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 2) handleCurrencyChange
  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    setFormData((prev) => ({ ...prev, currency: newCurrency }));
    await convertAllProductsForSelectedSupplier(newCurrency);
  };

  // 3) handleSupplierSelect
  const handleSupplierSelect = (supplierId) => {
    const selected = suppliers.find((s) => s._id === supplierId) || null;
    setSelectedSupplier(selected);

    // עדכון פרטי הספק + מטבע הבסיס
    setFormData((prev) => ({
      ...prev,
      supplierId,
      supplierName: selected?.SupplierName || "",
      currency: selected?.baseCurrency || "", // מטבע בסיס של הספק
    }));

    // טוען מוצרים של הספק
    if (supplierId) {
      fetchProductsBySupplier(supplierId).catch(() =>
        toast.error(t("procurement.failed_to_load_products"))
      );
    }
  };
  const handleAddProduct = () => {
    const { productName, SKU, category, unitPrice, quantity, baseUnitPrice } =
      productData;

    // בדיקה אם כל השדות נדרשים מולאו
    if (!productName || !SKU || !category || unitPrice <= 0 || quantity <= 0) {
      toast.error(t("procurement.please_fill_all_product_fields"));
      return;
    }

    const qty = parseInt(quantity, 10);

    // בדיקה אם המוצר כבר קיים ברשימה
    const existingProductIndex = products.findIndex(
      (product) => product.SKU === SKU
    );

    if (existingProductIndex > -1) {
      // אם המוצר כבר קיים, עדכן את הכמות בלבד
      const updatedProducts = [...products];
      updatedProducts[existingProductIndex].quantity += qty;

      // עדכון השדה "total" למוצר הקיים
      updatedProducts[existingProductIndex].total =
        updatedProducts[existingProductIndex].quantity *
        updatedProducts[existingProductIndex].unitPrice;

      setProducts(updatedProducts);
      toast.success(t("procurement.product_quantity_updated_successfully"));
    } else {
      // אם המוצר לא קיים, הוסף אותו למערך המוצרים
      const finalPrice = parseFloat(unitPrice);
      const finalTotal = finalPrice * qty;

      const newProduct = {
        productName,
        SKU,
        category,
        quantity: qty,
        unitPrice: finalPrice,
        total: parseFloat(finalTotal.toFixed(2)), // חישוב מדויק
        baseUnitPrice: parseFloat(baseUnitPrice),
        supplierId: formData.supplierId,
      };

      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      toast.success(t("procurement.product_added_successfully"));
    }

    // עדכון העלות הכוללת
    const updatedTotalCost = calculateTotalCost(products);
    setTotalCost(updatedTotalCost);

    // איפוס שדות המוצר שנבחר
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

  // 5) handlePreview
  const handlePreview = async () => {
    if (
      !formData.supplierId ||
      !formData.PaymentMethod ||
      !formData.DeliveryAddress ||
      products.length === 0
    ) {
      toast.error(t("procurement.please_fill_all_required_fields"));
      return;
    }

    // צור PDF
    const blobUrl = await createPDF();
    setPdfBlobUrl(blobUrl);
    setShowPreviewModal(true);
  };

  // 6) handleSubmit
  const handleSubmit = () => {
    if (newSigners.length === 0) {
      toast.error(t("procurement.signature_list_cannot_be_empty"));
      return;
    }
    if (!formData.summeryProcurement) {
      toast.error(t("procurement.pdf_summary_not_generated"));
      return;
    }

    // כאן אפשר להוסיף בדיקות נוספות לדרישות ספציפיות
    if (!formData.supplierId || products.length === 0) {
      toast.error(t("procurement.ensure_supplier_and_products"));
      return;
    }

    const combinedData = {
      ...formData,
      products,
      totalCost,
      signers: newSigners,
    };

    addProcurementMutation(combinedData);
    setShowPreviewModal(false);
  };

  // 7) resetForm
  const resetForm = () => {
    setFormData({
      companyId: authUser?.company || "",
      supplierId: "",
      supplierName: "",
      PurchaseOrder: generatePurchaseOrderNumber(),
      PaymentMethod: "",
      PaymentTerms: "",
      DeliveryAddress: "",
      ShippingMethod: "",
      currency: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      warrantyExpiration: "",
      receivedDate: "",
      notes: "",
      shippingCost: 0,
      requiresCustoms: false,
      products: [],
      summeryProcurement: "",
      status: "pending",
      currentSignatures: 0,
      currentSignerIndex: 0,
      signers: [],
    });
    setProducts([]);
    setTotalCost(0);
  };

  // ----------------- Render ----------------- //
  return (
    <div className="flex min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-800 text-gray-300">
        <h1 className="text-2xl font-bold text-blue-300 mb-6">
          {t("procurement.add_procurement")}
        </h1>

        {/* ספקים */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-blue-400 mb-4">
            {t("procurement.supplier_details")}
          </h2>
          <SupplierSelect
            supplierId={formData.supplierId}
            onChange={handleSupplierSelect}
          />

          {selectedSupplier && (
            <div className="p-4 bg-gray-700 rounded-md mt-2">
              <p>
                <strong>{t("procurement.phone")}:</strong>{" "}
                {selectedSupplier.Phone || "N/A"}
              </p>
              <p>
                <strong>{t("procurement.email")}:</strong>{" "}
                {selectedSupplier.Email || "N/A"}
              </p>
              <p>
                <strong>{t("procurement.address")}:</strong>{" "}
                {selectedSupplier.Address || "N/A"}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <PaymentAndShipping
            formData={formData}
            handleFormChange={handleFormChange}
            handleCurrencyChange={handleCurrencyChange}
          />
        </div>

        <button
          onClick={() => setShowSignatureModal(true)}
          className="bg-purple-600 py-2 px-4 text-white rounded mt-4"
        >
          {t("procurement.select_signature_requirements")}
        </button>

        {newSigners.length > 0 && (
          <div className="p-4 mt-4 bg-gray-700 rounded-md">
            <h4 className="text-blue-400 font-bold mb-2">
              {" "}
              {t("procurement.current_signers")}: :
            </h4>
            <ul className="list-disc list-inside">
              {newSigners.map((signer, index) => (
                <li key={index} className="text-gray-200">
                  {signer.name} - {signer.role}
                </li>
              ))}
            </ul>
          </div>
        )}

        <SignaturesModal
          isOpen={showSignatureModal}
          onClose={() => {
            setShowSignatureModal(false);
            setIsCreatingNewList(false);
          }}
          isCreatingNewList={isCreatingNewList}
          setIsCreatingNewList={setIsCreatingNewList}
          newRequirement={newRequirement}
          setNewRequirement={setNewRequirement}
          newSigners={newSigners}
          setNewSigners={setNewSigners}
          employees={employees}
          signatureLists={signatureLists}
          deleteSignatureList={deleteSignatureList}
          createSignatureList={createSignatureList}
        />

        {/* מוצרים */}
        <div className="mt-4">
          <h2 className="text-lg font-bold text-blue-400 mb-4">
            {" "}
            {t("procurement.products")}
          </h2>
        </div>
        <ProductSelector
          supplierId={formData.supplierId}
          inventoryProducts={products} // שימוש במערך products שנשמר מ־useQuery
          productData={productData}
          setProductData={setProductData}
          selectedSupplier={selectedSupplier}
          onAddProduct={handleAddProduct}
          fetchExchangeRate={fetchExchangeRate}
          handleCurrencyChange={handleCurrencyChange}
          formData={formData}
          products={products}
          setProducts={setProducts}
        />

        {/* טבלת מוצרים שהתווספו */}
        {products.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-blue-400 mb-4">
              {t("procurement.products_list")}
            </h2>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-700 p-2">
                    {t("procurement.name")}
                  </th>
                  <th className="border border-gray-700 p-2">
                    {t("procurement.sku")}
                  </th>
                  <th className="border border-gray-700 p-2">
                    {t("procurement.category")}
                  </th>
                  <th className="border border-gray-700 p-2">
                    {t("procurement.quantity")}
                  </th>
                  <th className="border border-gray-700 p-2">
                    {t("procurement.unit_price")}
                  </th>
                  <th className="border border-gray-700 p-2">
                    {t("procurement.total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, index) => (
                  <tr key={index}>
                    <td className="border border-gray-700 p-2">
                      {p.productName}
                    </td>
                    <td className="border border-gray-700 p-2">{p.SKU}</td>
                    <td className="border border-gray-700 p-2">{p.category}</td>
                    <td className="border border-gray-700 p-2">{p.quantity}</td>
                    <td className="border border-gray-700 p-2">
                      {p.unitPrice} {getCurrencySymbol(formData.currency)}
                    </td>
                    <td className="border border-gray-700 p-2">
                      {p.total} {getCurrencySymbol(formData.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-right mt-4 font-bold">
              {t("procurement.total_cost")}: {totalCost}{" "}
              {getCurrencySymbol(formData.currency)}
            </p>
          </div>
        )}

        {/* Preview & Submit */}
        <button
          type="button"
          onClick={handlePreview}
          className="bg-blue-600 py-2 px-4 text-white rounded mt-4"
        >
          {t("procurement.preview_procurement")}
          </button>

        <PreviewModal
          showModal={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onSubmit={handleSubmit}
          pdfBlobUrl={pdfBlobUrl}
          totalCost={totalCost}
          supplierName={formData.supplierName}
        />
      </div>
    </div>
  );
};

export default AddProcurement;
