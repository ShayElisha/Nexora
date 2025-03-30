import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaExclamationTriangle } from "react-icons/fa";

// Zustand Stores
import { useSupplierStore } from "../../../stores/useSupplierStore";
import { useSignatureStore } from "../../../stores/useSignatureStore";
import { useEmployeeStore } from "../../../stores/useEmployeeStore";
import { useProductStore } from "../../../stores/useProductStore";

// Components
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
  const location = useLocation();
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const hasPreFilled = useRef(false);

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
    productId: "",
    productName: "",
    sku: "",
    category: "",
    unitPrice: "",
    quantity: "",
    baseUnitPrice: 0,
  });
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newRequirement, setNewRequirement] = useState("");
  const [newSigners, setNewSigners] = useState([]);
  const [previousSupplierId, setPreviousSupplierId] = useState(null);
  const [error, setError] = useState("");
  const [isPreFilled, setIsPreFilled] = useState(!!location.state);

  // ----------------- Zustand Stores ----------------- //
  const { suppliers, fetchSuppliers } = useSupplierStore((state) => state);
  const { employees, fetchEmployees } = useEmployeeStore((state) => state);
  const {
    signatureLists,
    fetchSignatureLists,
    deleteSignatureList,
    createSignatureList,
  } = useSignatureStore((state) => state);
  const { fetchProductsBySupplier } = useProductStore((state) => state);

  // ----------------- Pre-populate from Location State ----------------- //
  const preFillForm = async (state) => {
    if (!state || hasPreFilled.current) return;

    const {
      productId,
      productName,
      supplierId,
      supplierName,
      baseCurrency,
      quantity,
      unitPrice,
      sku,
      category,
    } = state;

    const newProduct = {
      productId: productId || "",
      productName: productName || "Unknown Product",
      sku: sku || "",
      category: category || "",
      quantity: parseInt(quantity, 10) || 0,
      unitPrice: parseFloat(unitPrice) || 0,
      total: parseFloat((unitPrice * quantity).toFixed(2)) || 0,
      baseUnitPrice: parseFloat(unitPrice) || 0,
      supplierId: supplierId || "",
    };

    const supplier = suppliers.find((s) => s._id === supplierId);
    const updatedFormData = {
      ...formData,
      companyId: authUser?.company || "",
      supplierId: supplierId || "",
      supplierName: supplierName || "",
      currency: baseCurrency || "USD",
      products: [newProduct],
    };

    setFormData(updatedFormData);
    setProducts([newProduct]);
    setTotalCost(newProduct.total);
    setSelectedSupplier(
      supplier || {
        _id: supplierId || "",
        SupplierName: supplierName || "Unknown Supplier",
      }
    );
    setPreviousSupplierId(supplierId);

    if (productId && /^[0-9a-fA-F]{24}$/.test(productId)) {
      try {
        const response = await axiosInstance.get(`/products/${productId}`);
        const product = response.data.data;
        const updatedProduct = {
          ...newProduct,
          productName: product.productName || newProduct.productName,
          sku: product.SKU || product.sku || newProduct.sku,
          category: product.category || newProduct.category,
          unitPrice: parseFloat(product.unitPrice) || newProduct.unitPrice,
          baseUnitPrice:
            parseFloat(product.unitPrice) || newProduct.baseUnitPrice,
          total:
            parseFloat((product.unitPrice * quantity).toFixed(2)) ||
            newProduct.total,
          supplierId: product.supplierId || newProduct.supplierId,
        };
        setProducts([updatedProduct]);
        setTotalCost(updatedProduct.total);
        setFormData((prev) => ({
          ...prev,
          products: [updatedProduct],
          supplierId: product.supplierId || prev.supplierId,
          supplierName: product.supplierName || prev.supplierName,
        }));
        if (product.supplierId && !supplier) {
          const supplierResponse = await axiosInstance.get(
            `/suppliers/${product.supplierId}`
          );
          setSelectedSupplier(supplierResponse.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch product details:", err);
        toast.error(t("procurement.failed_to_fetch_product_details"));
      }
    } else if (productId) {
      console.warn("Invalid productId format, skipping fetch:", productId);
    }
    hasPreFilled.current = true;
  };

  useEffect(() => {
    if (location.state && isPreFilled) {
      preFillForm(location.state);
    } else {
      resetForm();
      setSelectedSupplier(null);
      setPreviousSupplierId(null);
      setProducts([]);
      setTotalCost(0);
      hasPreFilled.current = false;
    }
  }, [location.state, isPreFilled, authUser]);

  // ----------------- useEffect ----------------- //
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchSuppliers(),
          fetchEmployees(),
          fetchSignatureLists(),
        ]);
      } catch (err) {
        setError(
          t("procurement.failed_to_load_data") +
            (err.response?.data?.message || err.message)
        );
      }
    };
    fetchData();
  }, [fetchSuppliers, fetchEmployees, fetchSignatureLists]);

  useEffect(() => {
    if (authUser) {
      setFormData((prev) => ({ ...prev, companyId: authUser.company }));
    }
  }, [authUser]);

  useEffect(() => {
    if (!selectedSupplier || previousSupplierId === selectedSupplier._id)
      return;
    setFormData((prev) => ({
      ...prev,
      supplierId: selectedSupplier._id,
      supplierName: selectedSupplier.SupplierName,
      currency: selectedSupplier.baseCurrency || prev.currency,
    }));
    setPreviousSupplierId(selectedSupplier._id);
  }, [selectedSupplier, previousSupplierId]);

  // ----------------- Mutations ----------------- //
  const { mutate: addProcurementMutation } = useMutation({
    mutationFn: async (procurementData) => {
      const response = await axiosInstance.post(
        "/procurement",
        procurementData,
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("procurement.procurement_created_successfully"));
      queryClient.invalidateQueries(["procurement"]);
      resetForm();
    },
    onError: (error) => {
      setError(
        t("procurement.failed_to_create_procurement") +
          (error.response?.data?.message || error.message)
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
      if (!rates[base] || !rates[to])
        throw new Error(t("procurement.currency_not_supported"));
      return rates[to] / rates[base];
    } catch (error) {
      toast.error(t("procurement.fetch_conversion_error"));
      throw error;
    }
  };

  const convertAllProductsForSelectedSupplier = async (selectedCurrency) => {
    if (!selectedSupplier) {
      toast.error(t("procurement.please_select_supplier_first"));
      return;
    }
    try {
      const supplierBaseCurrency =
        selectedSupplier.baseCurrency || formData.currency || "USD";
      const supplierProducts = products.filter(
        (p) => p.supplierId === selectedSupplier._id
      );
      const updatedProducts = await Promise.all(
        supplierProducts.map(async (product) => {
          const basePrice = product.baseUnitPrice || product.unitPrice;
          const qty = product.quantity;
          if (supplierBaseCurrency === selectedCurrency) {
            return { ...product, unitPrice: basePrice, total: basePrice * qty };
          }
          const rate = await fetchExchangeRate(
            supplierBaseCurrency,
            selectedCurrency
          );
          const convertedPrice = (basePrice * rate).toFixed(2);
          return {
            ...product,
            unitPrice: parseFloat(convertedPrice),
            total: parseFloat((convertedPrice * qty).toFixed(2)),
          };
        })
      );
      const updatedProductList = products.map((p) =>
        p.supplierId === selectedSupplier._id
          ? updatedProducts.find((upd) => upd.sku === p.sku) || p
          : p
      );
      setProducts(updatedProductList);
      setTotalCost(
        parseFloat(calculateTotalCost(updatedProductList).toFixed(2))
      );
      setFormData((prev) => ({ ...prev, products: updatedProductList }));
    } catch (error) {
      toast.error(t("procurement.failed_to_convert_currency"));
    }
  };

  const calculateTotalCost = (products) =>
    products.reduce((acc, product) => acc + (product.total || 0), 0);

  useEffect(() => {
    setTotalCost(calculateTotalCost(products));
  }, [products]);

  // ----------------- Create PDF ----------------- //
  const createPDF = async () => {
    const currencySymbol = getCurrencySymbol(formData.currency);
    const pdf = new jsPDF();
    pdf.setFontSize(10);
    pdf.text(
      `${t("procurement.company", { lng: "en" })}: ${
        authUser?.company || "N/A"
      }`,
      10,
      20
    );
    pdf.text(
      `${t("procurement.date", { lng: "en" })}: ${new Date().toLocaleDateString(
        "en-US"
      )}`,
      10,
      25
    );
    pdf.text(
      `${t("procurement.address", { lng: "en" })}: ${
        formData.DeliveryAddress || "N/A"
      }`,
      10,
      30
    );
    pdf.text(
      `${t("procurement.supplier", { lng: "en" })}: ${
        formData.supplierName || "N/A"
      }`,
      150,
      20
    );
    pdf.text(
      `${t("procurement.phone", { lng: "en" })}: ${
        selectedSupplier?.Phone || "N/A"
      }`,
      150,
      25
    );
    pdf.text(
      `${t("procurement.email", { lng: "en" })}: ${
        selectedSupplier?.Email || "N/A"
      }`,
      150,
      30
    );
    pdf.setDrawColor(200, 200, 200);
    pdf.line(10, 35, 200, 35);

    const columns = [
      {
        header: t("procurement.product_name", { lng: "en" }),
        dataKey: "productName",
      },
      { header: t("procurement.sku", { lng: "en" }), dataKey: "sku" },
      { header: t("procurement.category", { lng: "en" }), dataKey: "category" },
      { header: t("procurement.quantity", { lng: "en" }), dataKey: "quantity" },
      {
        header: t("procurement.unit_price", { lng: "en" }),
        dataKey: "unitPrice",
      },
      { header: t("procurement.total", { lng: "en" }), dataKey: "total" },
    ];
    const rows = products.map((prod) => ({
      productName: prod.productName,
      sku: prod.sku || prod.SKU,
      category: prod.category,
      quantity: prod.quantity,
      unitPrice: `${prod.unitPrice} ${currencySymbol}`,
      total: `${prod.total} ${currencySymbol}`,
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
    pdf.setFontSize(14);
    pdf.text(
      `${t("procurement.total_cost", {
        lng: "en",
      })}: ${totalCost} ${currencySymbol}`,
      10,
      pdf.autoTable.previous.finalY + 10
    );

    const pdfBlob = pdf.output("blob");
    const base64PDF = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(pdfBlob);
    });
    setFormData((prev) => ({ ...prev, summeryProcurement: base64PDF }));
    return URL.createObjectURL(pdfBlob);
  };

  // ----------------- Handlers ----------------- //
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    setFormData((prev) => ({ ...prev, currency: newCurrency }));
    await convertAllProductsForSelectedSupplier(newCurrency);
  };

  const handleSupplierSelect = (supplierId) => {
    const selected = suppliers.find((s) => s._id === supplierId) || null;
    setSelectedSupplier(selected);
    setFormData((prev) => ({
      ...prev,
      supplierId,
      supplierName: selected?.SupplierName || "",
      currency: selected?.baseCurrency || formData.currency,
    }));
    if (supplierId && !isPreFilled) {
      setProducts([]);
      setTotalCost(0);
    }
    if (supplierId) {
      fetchProductsBySupplier(supplierId).catch(() =>
        toast.error(t("procurement.failed_to_load_products"))
      );
    }
  };

  const handleAddProduct = () => {
    const {
      productId,
      productName,
      sku,
      category,
      unitPrice,
      quantity,
      baseUnitPrice,
    } = productData;
    if (
      !productId ||
      !productName ||
      !sku ||
      !category ||
      unitPrice <= 0 ||
      quantity <= 0
    ) {
      toast.error(t("procurement.please_fill_all_product_fields"));
      return;
    }
    const qty = parseInt(quantity, 10);
    const existingProductIndex = products.findIndex((p) => p.sku === sku);
    if (existingProductIndex > -1) {
      const updatedProducts = [...products];
      updatedProducts[existingProductIndex].quantity += qty;
      updatedProducts[existingProductIndex].total =
        updatedProducts[existingProductIndex].quantity *
        updatedProducts[existingProductIndex].unitPrice;
      setProducts(updatedProducts);
      setFormData((prev) => ({ ...prev, products: updatedProducts }));
      toast.success(t("procurement.product_quantity_updated_successfully"));
    } else {
      const finalPrice = parseFloat(unitPrice);
      const newProduct = {
        productId,
        productName,
        sku,
        category,
        quantity: qty,
        unitPrice: finalPrice,
        total: parseFloat((finalPrice * qty).toFixed(2)),
        baseUnitPrice: parseFloat(baseUnitPrice),
        supplierId: formData.supplierId,
      };
      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      setFormData((prev) => ({ ...prev, products: updatedProducts }));
      toast.success(t("procurement.product_added_successfully"));
    }
    setTotalCost(calculateTotalCost(products));
    setProductData({
      productName: "",
      sku: "",
      category: "",
      baseUnitPrice: 0,
      unitPrice: 0,
      quantity: 0,
    });
  };

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
    const blobUrl = await createPDF();
    setPdfBlobUrl(blobUrl);
    setShowPreviewModal(true);
  };

  const handleSubmit = () => {
    if (
      newSigners.length === 0 ||
      !formData.summeryProcurement ||
      !formData.supplierId ||
      products.length === 0
    ) {
      toast.error(t("procurement.ensure_all_fields_completed"));
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

  const handleSwitchToManual = () => {
    setIsPreFilled(false);
    resetForm();
    setProducts([]);
    setTotalCost(0);
    setSelectedSupplier(null);
    toast.success(t("procurement.switched_to_manual_entry"));
  };

  // ----------------- Render ----------------- //
  return (
    <div className="container mx-auto p-8 min-h-screen animate-fade-in">
      <h1 className="text-4xl font-extrabold text-text mb-8 text-center tracking-tight drop-shadow-md">
        {t("procurement.add_procurement")}
      </h1>

      {isPreFilled && (
        <div className="mb-8 flex justify-end">
          <button
            onClick={handleSwitchToManual}
            className="bg-yellow-500 text-white py-2 px-4 rounded-full font-semibold transition-all duration-300 hover:bg-yellow-600"
          >
            {t("procurement.switch_to_manual_entry")}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-4 mb-8 rounded-lg shadow-lg animate-slide-in">
          <p className="flex items-center">
            <FaExclamationTriangle className="mr-2" /> {error}
          </p>
        </div>
      )}

      {/* Supplier Section */}
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-2xl transform transition-all duration-500 hover:shadow-3xl">
        <h2 className="text-2xl font-bold text-secondary mb-4 tracking-tight">
          {t("procurement.supplier_details")}
        </h2>
        <SupplierSelect
          supplierId={formData.supplierId}
          onChange={handleSupplierSelect}
        />
        {(selectedSupplier || formData.supplierName) && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-inner animate-slide-up">
            <p className="text-text">
              <strong className="text-primary">
                {t("procurement.supplier")}:
              </strong>{" "}
              {formData.supplierName}
            </p>
            {selectedSupplier && (
              <>
                <p className="text-text">
                  <strong className="text-primary">
                    {t("procurement.phone")}:
                  </strong>{" "}
                  {selectedSupplier.Phone || "N/A"}
                </p>
                <p className="text-text">
                  <strong className="text-primary">
                    {t("procurement.email")}:
                  </strong>{" "}
                  {selectedSupplier.Email || "N/A"}
                </p>
                <p className="text-text">
                  <strong className="text-primary">
                    {t("procurement.address")}:
                  </strong>{" "}
                  {selectedSupplier.Address || "N/A"}
                </p>
              </>
            )}
            <p className="text-text">
              <strong className="text-primary">
                {t("procurement.currency")}:
              </strong>{" "}
              {formData.currency}
            </p>
          </div>
        )}
      </div>

      {/* Payment and Shipping Section */}
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-2xl transform transition-all duration-500 hover:shadow-3xl">
        <PaymentAndShipping
          formData={formData}
          handleFormChange={handleFormChange}
          handleCurrencyChange={handleCurrencyChange}
        />
      </div>

      {/* Signatures Section */}
      <div className="mb-8">
        <button
          onClick={() => setShowSignatureModal(true)}
          className="bg-gradient-to-r from-primary to-secondary text-button-text py-3 px-6 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
        >
          {t("procurement.select_signature_requirements")}
        </button>
        {newSigners.length > 0 && (
          <div className="mt-6 bg-white p-6 rounded-2xl shadow-2xl animate-slide-up">
            <h4 className="text-xl font-bold text-secondary mb-4">
              {t("procurement.current_signers")}:
            </h4>
            <ul className="list-disc pl-5 text-text">
              {newSigners.map((signer, index) => (
                <li
                  key={index}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
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
      </div>

      {/* Products Section */}
      <div className="mb-8 bg-white p-6 rounded-2xl shadow-2xl transform transition-all duration-500 hover:shadow-3xl">
        <h2 className="text-2xl font-bold text-secondary mb-4 tracking-tight">
          {t("procurement.products")}
        </h2>
        <ProductSelector
          supplierId={formData.supplierId}
          inventoryProducts={products}
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

        {products.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-secondary mb-4">
              {t("procurement.products_list")}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow-lg">
                <thead className="bg-gradient-to-r from-primary to-secondary text-button-text">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                      {t("procurement.name")}
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                      {t("procurement.sku")}
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                      {t("procurement.category")}
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                      {t("procurement.quantity")}
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                      {t("procurement.unit_price")}
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-bold tracking-wider">
                      {t("procurement.total")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, index) => (
                    <tr
                      key={index}
                      className={`border-b border-border-color transition-all duration-300 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-accent hover:shadow-inner animate-slide-up`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-4 px-6 text-text font-medium">
                        {p.productName}
                      </td>
                      <td className="py-4 px-6 text-text">{p.sku}</td>
                      <td className="py-4 px-6 text-text">{p.category}</td>
                      <td className="py-4 px-6 text-text">{p.quantity}</td>
                      <td className="py-4 px-6 text-text">
                        {p.unitPrice} {getCurrencySymbol(formData.currency)}
                      </td>
                      <td className="py-4 px-6 text-text">
                        {p.total} {getCurrencySymbol(formData.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-right mt-4 text-xl font-bold text-text">
              {t("procurement.total_cost")}: {totalCost}{" "}
              {getCurrencySymbol(formData.currency)}
            </p>
          </div>
        )}
      </div>

      {/* Preview Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handlePreview}
          className="bg-gradient-to-r from-button-bg to-accent text-button-text py-3 px-8 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
        >
          {t("procurement.preview_procurement")}
        </button>
      </div>

      <PreviewModal
        showModal={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onSubmit={handleSubmit}
        pdfBlobUrl={pdfBlobUrl}
        totalCost={totalCost}
        supplierName={formData.supplierName}
      />

      {/* Custom Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.4s ease-out;
        }
        .animate-slide-in {
          animation: slideIn 0.4s ease-out;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AddProcurement;
