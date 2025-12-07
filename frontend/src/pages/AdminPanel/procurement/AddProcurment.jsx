import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import html2pdf from "html2pdf.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, 
  Building2, 
  CreditCard, 
  Users, 
  Package, 
  FileText,
  Plus,
  X,
  AlertCircle,
  Eye,
  Truck,
  Trash2,
  CheckCircle,
  Circle
} from "lucide-react";

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
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const hasPreFilled = useRef(false);

  // Fetch company details to get company name
  const { data: companyData } = useQuery({
    queryKey: ["companyDetails"],
    queryFn: async () => {
      const response = await axiosInstance.get("/company/get-company");
      return response.data.data;
    },
    enabled: !!authUser,
  });

  const companyName = companyData?.name || authUser?.company || "N/A";

  const { data: warehousesData = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const response = await axiosInstance.get("/warehouses");
      return response.data?.data || [];
    },
  });

  const warehouses = useMemo(
    () =>
      (warehousesData || []).map((warehouse) => ({
        id:
          warehouse._id ||
          warehouse.id ||
          warehouse.identifier ||
          warehouse.code ||
          "",
        name: warehouse.name || warehouse.title || "Warehouse",
        region: warehouse.region || warehouse.location?.region || "",
        address: warehouse.address || {},
      })),
    [warehousesData]
  );

  // ----------------- Form Data ----------------- //
  const [formData, setFormData] = useState({
    companyId: authUser?.company || "",
    supplierId: "",
    supplierName: "",
    warehouseId: "",
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
    shippingAddress: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
      contactName: "",
      contactPhone: "",
    },
    contactPerson: "",
    contactPhone: "",
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
    discountPercent: 0,
    originalBasePrice: 0,
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
  const [inventoryInfo, setInventoryInfo] = useState(null);
  const [addressMode, setAddressMode] = useState("warehouse");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

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
      currentQuantity,
      minStockLevel,
    } = state;

    // שמירת מידע על המלאי אם קיים
    if (currentQuantity !== undefined && minStockLevel !== undefined) {
      setInventoryInfo({
        currentQuantity,
        minStockLevel,
        reorderQuantity: quantity,
        productName,
      });
    }

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
    if (addressMode === "warehouse" && warehouses.length && !selectedWarehouseId) {
      const first = warehouses[0];
      if (first?.id) {
        handleWarehouseSelect(first.id);
      }
    }
  }, [addressMode, warehouses, selectedWarehouseId]);

  useEffect(() => {
    if (!warehouses.length && addressMode === "warehouse") {
      setAddressMode("manual");
      setSelectedWarehouseId("");
    }
  }, [warehouses, addressMode]);

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

  const calculateTotalCost = (products, shippingCost = 0) => {
    const productsTotal = products.reduce((acc, product) => acc + (product.total || 0), 0);
    return productsTotal + (Number(shippingCost) || 0);
  };

  useEffect(() => {
    const productsSubtotal = products.reduce((acc, product) => acc + (product.total || 0), 0);
    const shippingCost = Number(formData.shippingCost) || 0;
    setTotalCost(productsSubtotal + shippingCost);
  }, [products, formData.shippingCost]);

  // ----------------- Create PDF ----------------- //
  const createPDF = async () => {
    
    const currencySymbol = getCurrencySymbol(formData.currency);
    
    // Detect RTL languages
    const isRTL = ['he', 'ar', 'iw'].includes(i18n.language);
    const textDirection = isRTL ? 'rtl' : 'ltr';
    
    // Calculate values
    const productsSubtotal = products.reduce((acc, product) => acc + (product.total || 0), 0);
    const shippingCost = Number(formData.shippingCost) || 0;
    const grandTotal = productsSubtotal + shippingCost;
    
    // Calculate total discount
    const totalOriginal = products.reduce((acc, p) => {
      const originalPrice = p.originalBasePrice || p.baseUnitPrice || p.unitPrice;
      return acc + (originalPrice * p.quantity);
    }, 0);
    const totalDiscount = totalOriginal > 0 ? ((totalOriginal - productsSubtotal) / totalOriginal * 100) : 0;
    const totalDiscountAmount = totalOriginal - productsSubtotal;
    
    // Format dates
    const generatedDate = new Date().toLocaleDateString(i18n.language || "en", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const generatedTime = new Date().toLocaleTimeString(i18n.language || "en", { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const orderDate = formData.purchaseDate 
      ? new Date(formData.purchaseDate).toLocaleDateString(i18n.language || "en", { year: 'numeric', month: 'short', day: 'numeric' })
      : '';
    const deliveryDate = formData.deliveryDate 
      ? new Date(formData.deliveryDate).toLocaleDateString(i18n.language || "en", { year: 'numeric', month: 'short', day: 'numeric' })
      : '';
    
    // Address formatting
    const address = formData.DeliveryAddress || 
      (formData.shippingAddress ? [
        formData.shippingAddress.street,
        formData.shippingAddress.city,
        formData.shippingAddress.state,
        formData.shippingAddress.zipCode,
        formData.shippingAddress.country
      ].filter(Boolean).join(", ") : t("procurement.not_available", { defaultValue: "N/A" }));
    
    const deliveryAddress = formData.DeliveryAddress || 
      (formData.shippingAddress ? [
        formData.shippingAddress.street,
        formData.shippingAddress.city,
        formData.shippingAddress.state,
        formData.shippingAddress.zipCode,
        formData.shippingAddress.country
      ].filter(Boolean).join(", ") : "");
    
    // Build products table
    const productsTableBody = products.map((prod, index) => [
      (index + 1).toString(),
      prod.productName || '',
      prod.sku || prod.SKU || t("procurement.not_available", { defaultValue: "N/A" }),
      prod.category || t("procurement.not_available", { defaultValue: "N/A" }),
      prod.quantity.toString(),
      `${prod.unitPrice.toFixed(2)} ${currencySymbol}`,
      `${prod.total.toFixed(2)} ${currencySymbol}`
    ]);
    
    // Build supplier info array
    const supplierInfo = [];
    if (selectedSupplier?.Phone) {
      supplierInfo.push({
        text: `${t("procurement.phone", { defaultValue: "Phone" })}: ${selectedSupplier.Phone}`,
        fontSize: 8,
        margin: [0, 2, 0, 0]
      });
    }
    if (selectedSupplier?.Email) {
      supplierInfo.push({
        text: `${t("procurement.email", { defaultValue: "Email" })}: ${selectedSupplier.Email}`,
        fontSize: 8,
        margin: [0, 2, 0, 0]
      });
    }
    if (selectedSupplier?.Address) {
      supplierInfo.push({
        text: selectedSupplier.Address,
        fontSize: 8,
        margin: [0, 2, 0, 0]
      });
    }
    
    // Build payment info array
    const paymentInfo = [];
    if (formData.PaymentMethod) {
      paymentInfo.push({
        text: [
          { text: `${t("procurement.payment_method", { defaultValue: "Method" })}: `, bold: true },
          formData.PaymentMethod
        ],
        fontSize: 8,
        margin: [0, 3, 0, 0]
      });
    }
    if (formData.PaymentTerms) {
      paymentInfo.push({
        text: [
          { text: `${t("procurement.payment_terms", { defaultValue: "Terms" })}: `, bold: true },
          formData.PaymentTerms
        ],
        fontSize: 8,
        margin: [0, 3, 0, 0]
      });
    }
    if (formData.currency) {
      paymentInfo.push({
        text: [
          { text: `${t("procurement.currency", { defaultValue: "Currency" })}: `, bold: true },
          formData.currency
        ],
        fontSize: 8,
        margin: [0, 3, 0, 0]
      });
    }
    if (formData.purchaseDate) {
      paymentInfo.push({
        text: [
          { text: `${t("procurement.order_date", { defaultValue: "Order Date" })}: `, bold: true },
          orderDate
        ],
        fontSize: 8,
        margin: [0, 3, 0, 0]
      });
    }
    
    // Build delivery info array
    const deliveryInfo = [];
    if (formData.ShippingMethod) {
      deliveryInfo.push({
        text: [
          { text: `${t("procurement.shipping_method", { defaultValue: "Method" })}: `, bold: true },
          formData.ShippingMethod
        ],
        fontSize: 8,
        margin: [0, 3, 0, 0]
      });
    }
    if (formData.deliveryDate) {
      deliveryInfo.push({
        text: [
          { text: `${t("procurement.expected_delivery", { defaultValue: "Expected" })}: `, bold: true },
          deliveryDate
        ],
        fontSize: 8,
        margin: [0, 3, 0, 0]
      });
    }
    if (formData.requiresCustoms) {
      deliveryInfo.push({
        text: [
          { text: `${t("procurement.customs", { defaultValue: "Customs" })}: `, bold: true },
          t("procurement.required", { defaultValue: "Required" })
        ],
        fontSize: 8,
        margin: [0, 3, 0, 0]
      });
    }
    
    // Build delivery address info
    const deliveryAddressInfo = [];
    if (formData.contactPerson) {
      deliveryAddressInfo.push({
        text: [
          { text: `${t("procurement.contact_person", { defaultValue: "Contact Person" })}: `, bold: true },
          formData.contactPerson
        ],
        fontSize: 9,
        margin: [0, 3, 0, 0]
      });
    }
    if (formData.contactPhone) {
      deliveryAddressInfo.push({
        text: [
          { text: `${t("procurement.phone", { defaultValue: "Phone" })}: `, bold: true },
          formData.contactPhone
        ],
        fontSize: 9,
        margin: [0, 3, 0, 0]
      });
    }
    if (deliveryAddress) {
      deliveryAddressInfo.push({
        text: deliveryAddress,
        fontSize: 9,
        margin: [0, 3, 0, 0]
      });
    }
    
    // Build summary rows
    const summaryRows = [
      {
        text: [
          { text: `${t("procurement.subtotal", { defaultValue: "Subtotal" })}: `, bold: true },
          `${productsSubtotal.toFixed(2)} ${currencySymbol}`
        ],
        margin: [0, 0, 0, 5],
        fontSize: 9
      }
    ];
    
    if (totalDiscount > 0) {
      summaryRows.push({
        text: [
          { text: `${t("procurement.discount", { defaultValue: "Discount" })} (${totalDiscount.toFixed(2)}%): `, bold: true },
          { text: `-${totalDiscountAmount.toFixed(2)} ${currencySymbol}`, color: '#16a34a' }
        ],
        margin: [0, 0, 0, 5],
        fontSize: 9
      });
    }
    
    if (shippingCost > 0) {
      summaryRows.push({
        text: [
          { text: `${t("procurement.shipping", { defaultValue: "Shipping" })}: `, bold: true },
          `${shippingCost.toFixed(2)} ${currencySymbol}`
        ],
        margin: [0, 0, 0, 5],
        fontSize: 9
      });
    }
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${textDirection}" lang="${i18n.language}">
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: A4;
            margin: 40px 60px;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            direction: ${textDirection};
            text-align: ${textDirection === 'rtl' ? 'right' : 'left'};
            margin: 0;
            padding: 0;
          }
          .header {
            background: #0f172a;
            color: white;
            padding: 20px;
            position: relative;
            border-bottom: 3px solid #2563eb;
          }
          .header h1 {
            margin: 0;
            font-size: 22pt;
            font-weight: bold;
          }
          .header h2 {
            margin: 5px 0 0 0;
            font-size: 14pt;
            color: #cbd5e1;
          }
          .po-badge {
            position: absolute;
            ${isRTL ? 'left: 40px' : 'right: 40px'};
            top: 72px;
            background: white;
            padding: 5px;
            border: 1px solid #e2e8f0;
            width: 75px;
          }
          .section-title {
            font-size: 10pt;
            font-weight: bold;
            color: #334155;
            margin: 20px 0 5px 0;
          }
          .info-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 5px;
            margin: 0 0 20px 0;
          }
          .info-box-title {
            background: #2563eb;
            color: white;
            padding: 5px;
            font-size: 9pt;
            font-weight: bold;
          }
          .info-box-content {
            padding: 5px;
          }
          .info-box-dark {
            background: #0f172a;
            color: white;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background: #0f172a;
            color: white;
            padding: 3px;
            text-align: center;
            font-weight: bold;
            font-size: 10pt;
          }
          td {
            padding: 3px;
            border: 0.2px solid #cbd5e1;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          .summary-box {
            border: 1px solid #cbd5e1;
            width: 200px;
            margin-left: auto;
            margin-right: 0;
          }
          .summary-title {
            background: #0f172a;
            color: white;
            padding: 5px;
            text-align: center;
            font-weight: bold;
            font-size: 10pt;
          }
          .summary-row {
            padding: 5px;
            font-size: 9pt;
          }
          .total-box {
            background: #0f172a;
            color: white;
            padding: 5px;
          }
          .footer {
            background: #f8fafc;
            border-top: 2px solid #2563eb;
            padding: 10px;
            margin-top: 20px;
            font-size: 7pt;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${companyName}</h1>
          <h2>${t("procurement.purchase_order", { defaultValue: "PURCHASE ORDER" }).toUpperCase()}</h2>
          <div class="po-badge">
            <div style="font-size: 8pt; font-weight: bold; color: #64748b;">${t("procurement.purchase_order", { defaultValue: "PURCHASE ORDER" }).toUpperCase()} #</div>
            <div style="font-size: 14pt; font-weight: bold; color: #2563eb;">${formData.PurchaseOrder || t("procurement.not_available", { defaultValue: "N/A" })}</div>
            <div style="font-size: 8pt; color: #475569;">${generatedDate}</div>
          </div>
        </div>
        
        <div class="section-title">${t("procurement.parties_information", { defaultValue: "PARTIES INFORMATION" }).toUpperCase()}</div>
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <div class="info-box" style="flex: 1;">
            <div class="info-box-title">${t("procurement.from_buyer", { defaultValue: "FROM (BUYER)" }).toUpperCase()}</div>
            <div class="info-box-content">
              <div style="font-size: 12pt; font-weight: bold; color: #1e293b; margin: 5px 0;">${companyName}</div>
              <div style="font-size: 9pt; color: #475569;">${address}</div>
            </div>
          </div>
          <div class="info-box" style="flex: 1;">
            <div class="info-box-title info-box-dark">${t("procurement.to_supplier", { defaultValue: "TO (SUPPLIER)" }).toUpperCase()}</div>
            <div class="info-box-content">
              <div style="font-size: 12pt; font-weight: bold; color: #1e293b; margin: 5px 0;">${formData.supplierName || t("procurement.not_available", { defaultValue: "N/A" })}</div>
              ${selectedSupplier?.Phone ? `<div style="font-size: 8pt; margin: 2px 0;">${t("procurement.phone", { defaultValue: "Phone" })}: ${selectedSupplier.Phone}</div>` : ''}
              ${selectedSupplier?.Email ? `<div style="font-size: 8pt; margin: 2px 0;">${t("procurement.email", { defaultValue: "Email" })}: ${selectedSupplier.Email}</div>` : ''}
              ${selectedSupplier?.Address ? `<div style="font-size: 8pt; margin: 2px 0;">${selectedSupplier.Address}</div>` : ''}
            </div>
          </div>
        </div>
        
        <div class="section-title">${t("procurement.items_ordered", { defaultValue: "ITEMS ORDERED" }).toUpperCase()}</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${t("procurement.product_name")}</th>
              <th>${t("procurement.sku")}</th>
              <th>${t("procurement.category")}</th>
              <th>${t("procurement.quantity_short", { defaultValue: "QTY" })}</th>
              <th style="text-align: right;">${t("procurement.unit_price")}</th>
              <th style="text-align: right;">${t("procurement.total")}</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((prod, index) => `
              <tr>
                <td style="text-align: center; color: #475569;">${index + 1}</td>
                <td style="font-weight: bold;">${prod.productName || ''}</td>
                <td style="text-align: center; color: #64748b;">${prod.sku || prod.SKU || t("procurement.not_available", { defaultValue: "N/A" })}</td>
                <td style="text-align: center; color: #64748b;">${prod.category || t("procurement.not_available", { defaultValue: "N/A" })}</td>
                <td style="text-align: center;">${prod.quantity}</td>
                <td style="text-align: right;">${prod.unitPrice.toFixed(2)} ${currencySymbol}</td>
                <td style="text-align: right; font-weight: bold; color: #2563eb;">${prod.total.toFixed(2)} ${currencySymbol}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary-box">
          <div class="summary-title">${t("procurement.order_summary", { defaultValue: "ORDER SUMMARY" }).toUpperCase()}</div>
          <div class="summary-row">
            <strong>${t("procurement.subtotal", { defaultValue: "Subtotal" })}:</strong> ${productsSubtotal.toFixed(2)} ${currencySymbol}
          </div>
          ${totalDiscount > 0 ? `
            <div class="summary-row">
              <strong>${t("procurement.discount", { defaultValue: "Discount" })} (${totalDiscount.toFixed(2)}%):</strong> 
              <span style="color: #16a34a;">-${totalDiscountAmount.toFixed(2)} ${currencySymbol}</span>
            </div>
          ` : ''}
          ${shippingCost > 0 ? `
            <div class="summary-row">
              <strong>${t("procurement.shipping", { defaultValue: "Shipping" })}:</strong> ${shippingCost.toFixed(2)} ${currencySymbol}
            </div>
          ` : ''}
          <hr style="border: 0.5px solid #cbd5e1; margin: 5px;">
          <div class="total-box">
            <div style="font-size: 11pt; font-weight: bold; margin: 5px 0;">${t("procurement.total_amount", { defaultValue: "TOTAL AMOUNT" }).toUpperCase()}</div>
            <div style="font-size: 14pt; font-weight: bold; text-align: right; margin: 5px 0;">${grandTotal.toFixed(2)} ${currencySymbol}</div>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; margin: 20px 0;">
          <div class="info-box" style="flex: 1;">
            <div class="info-box-title">${t("procurement.payment_information", { defaultValue: "PAYMENT INFORMATION" }).toUpperCase()}</div>
            <div class="info-box-content">
              ${formData.PaymentMethod ? `<div style="font-size: 8pt; margin: 3px 0;"><strong>${t("procurement.payment_method", { defaultValue: "Method" })}:</strong> ${formData.PaymentMethod}</div>` : ''}
              ${formData.PaymentTerms ? `<div style="font-size: 8pt; margin: 3px 0;"><strong>${t("procurement.payment_terms", { defaultValue: "Terms" })}:</strong> ${formData.PaymentTerms}</div>` : ''}
              ${formData.currency ? `<div style="font-size: 8pt; margin: 3px 0;"><strong>${t("procurement.currency", { defaultValue: "Currency" })}:</strong> ${formData.currency}</div>` : ''}
              ${formData.purchaseDate ? `<div style="font-size: 8pt; margin: 3px 0;"><strong>${t("procurement.order_date", { defaultValue: "Order Date" })}:</strong> ${orderDate}</div>` : ''}
            </div>
          </div>
          <div class="info-box" style="flex: 1;">
            <div class="info-box-title info-box-dark">${t("procurement.delivery_information", { defaultValue: "DELIVERY INFORMATION" }).toUpperCase()}</div>
            <div class="info-box-content">
              ${formData.ShippingMethod ? `<div style="font-size: 8pt; margin: 3px 0;"><strong>${t("procurement.shipping_method", { defaultValue: "Method" })}:</strong> ${formData.ShippingMethod}</div>` : ''}
              ${formData.deliveryDate ? `<div style="font-size: 8pt; margin: 3px 0;"><strong>${t("procurement.expected_delivery", { defaultValue: "Expected" })}:</strong> ${deliveryDate}</div>` : ''}
              ${formData.requiresCustoms ? `<div style="font-size: 8pt; margin: 3px 0;"><strong>${t("procurement.customs", { defaultValue: "Customs" })}:</strong> ${t("procurement.required", { defaultValue: "Required" })}</div>` : ''}
            </div>
          </div>
        </div>
        
        ${(formData.DeliveryAddress || formData.shippingAddress) ? `
          <div class="info-box">
            <div class="info-box-title" style="background: #f1f5f9; color: #334155;">${t("procurement.delivery_address", { defaultValue: "DELIVERY ADDRESS" }).toUpperCase()}</div>
            <div class="info-box-content">
              ${formData.contactPerson ? `<div style="font-size: 9pt; margin: 3px 0;"><strong>${t("procurement.contact_person", { defaultValue: "Contact Person" })}:</strong> ${formData.contactPerson}</div>` : ''}
              ${formData.contactPhone ? `<div style="font-size: 9pt; margin: 3px 0;"><strong>${t("procurement.phone", { defaultValue: "Phone" })}:</strong> ${formData.contactPhone}</div>` : ''}
              ${deliveryAddress ? `<div style="font-size: 9pt; margin: 3px 0;">${deliveryAddress}</div>` : ''}
            </div>
          </div>
        ` : ''}
        
        ${formData.notes ? `
          <div class="info-box">
            <div class="info-box-title" style="background: #f1f5f9; color: #334155;">${t("procurement.additional_notes", { defaultValue: "ADDITIONAL NOTES" }).toUpperCase()}</div>
            <div class="info-box-content">
              <div style="font-size: 9pt; color: #475569;">${formData.notes}</div>
            </div>
          </div>
        ` : ''}
        
        <div class="footer">
          <div>${t("procurement.document_generated", { 
            date: generatedDate, 
            time: generatedTime,
            defaultValue: `This document was generated on ${generatedDate} at ${generatedTime}`
          })}</div>
          <div>${companyName} | ${t("procurement.purchase_order", { defaultValue: "Purchase Order" })} #${formData.PurchaseOrder || t("procurement.not_available", { defaultValue: "N/A" })} | ${t("procurement.confidential_document", { defaultValue: "Confidential Document" })}</div>
          <div style="text-align: ${isRTL ? 'left' : 'right'}; margin-top: 5px;">${t("procurement.page", { defaultValue: "Page" })} 1</div>
        </div>
      </body>
      </html>
    `;
    
    // Create a temporary div element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.padding = '20px';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.visibility = 'visible';
    tempDiv.style.opacity = '1';
    document.body.appendChild(tempDiv);
    
    // Wait for images and fonts to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Use html2canvas to capture the HTML as an image
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: true, // Enable logging to debug
        letterRendering: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF using jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Get PDF as blob
      const pdfBlob = pdf.output('blob');
      
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => {
          const base64PDF = reader.result.split(",")[1];
          resolve(base64PDF);
        };
      reader.readAsDataURL(pdfBlob);
    });
      
      const base64PDF = await base64Promise;
    setFormData((prev) => ({ ...prev, summeryProcurement: base64PDF }));
      
      // Clean up
      if (tempDiv && tempDiv.parentNode) {
        document.body.removeChild(tempDiv);
      }
      
      // Return blob URL for preview
    return URL.createObjectURL(pdfBlob);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(t("procurement.failed_to_generate_pdf", { defaultValue: "Failed to generate PDF" }));
      if (tempDiv && tempDiv.parentNode) {
        document.body.removeChild(tempDiv);
      }
      return null;
    }
  };

  // ----------------- Handlers ----------------- //

  // ----------------- Handlers ----------------- //
  const formatAddressString = (address) =>
    [
      address?.street,
      address?.city,
      address?.state,
      address?.zipCode,
      address?.country,
    ]
      .filter(Boolean)
      .join(", ");

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleShippingAddressChange = (field, value) => {
    setFormData((prev) => {
      const updatedAddress = {
        ...prev.shippingAddress,
        [field]: value,
      };

      return {
        ...prev,
        shippingAddress: updatedAddress,
        DeliveryAddress: formatAddressString(updatedAddress),
        ...(field === "contactName" ? { contactPerson: value } : {}),
        ...(field === "contactPhone" ? { contactPhone: value } : {}),
      };
    });
  };

  const handleWarehouseSelect = (warehouseId) => {
    setSelectedWarehouseId(warehouseId);
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    setFormData((prev) => ({
      ...prev,
      warehouseId: warehouseId,
    }));
    if (warehouse?.address) {
      const updatedAddress = {
        street: warehouse.address.street || "",
        city: warehouse.address.city || "",
        state: warehouse.address.state || "",
        country: warehouse.address.country || "",
        zipCode: warehouse.address.zipCode || "",
        contactName: warehouse.address.contactName || "",
        contactPhone: warehouse.address.contactPhone || "",
      };
      setFormData((prev) => ({
        ...prev,
        warehouseId: warehouseId,
        shippingAddress: updatedAddress,
        DeliveryAddress: formatAddressString(updatedAddress),
        contactPerson: updatedAddress.contactName,
        contactPhone: updatedAddress.contactPhone,
      }));
    }
  };

  const handleAddressModeChange = (mode) => {
    setAddressMode(mode);
    if (mode === "warehouse") {
      if (warehouses.length) {
        const defaultWarehouse =
          warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];
        if (defaultWarehouse?.id) {
          handleWarehouseSelect(defaultWarehouse.id);
        }
      } else {
        setSelectedWarehouseId("");
      }
    } else {
      setSelectedWarehouseId("");
    }
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
      discountPercent = 0,
      originalBasePrice,
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
        discountPercent: parseFloat(discountPercent) || 0,
        originalBasePrice: originalBasePrice || baseUnitPrice,
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
      discountPercent: 0,
      originalBasePrice: 0,
    });
  };

  const hasShippingAddress =
    addressMode === "warehouse"
      ? Boolean(
          selectedWarehouseId &&
            formData.shippingAddress?.street &&
            formData.shippingAddress?.city &&
            formData.shippingAddress?.country
        )
      : Boolean(
          formData.shippingAddress?.street &&
            formData.shippingAddress?.city &&
            formData.shippingAddress?.country
        );

  const handlePreview = async () => {
    // אם יש מחסנים, ודא שנבחר מחסן
    if (warehouses.length > 0 && addressMode === "warehouse" && !formData.warehouseId) {
      toast.error(
        t("procurement.select_warehouse", {
          defaultValue: "Please select a warehouse.",
        })
      );
      return;
    }
    if (
      !formData.supplierId ||
      !formData.PaymentMethod ||
      !hasShippingAddress ||
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
    // בחירת מחסן היא חובה (גם אם משתמשים בכתובת ידנית)
    if (warehouses.length > 0 && !formData.warehouseId) {
      toast.error(
        t("procurement.select_warehouse", {
          defaultValue: "Please select a warehouse.",
        })
      );
      return;
    }
    // אם בוחרים מחסן לכתובת, ודא שנבחר מחסן
    if (addressMode === "warehouse" && !selectedWarehouseId) {
      toast.error(
        t("procurement.select_warehouse_address", {
          defaultValue: "Please select a warehouse address or switch to manual entry.",
        })
      );
      return;
    }
    if (
      newSigners.length === 0 ||
      !formData.summeryProcurement ||
      !formData.supplierId ||
      products.length === 0 ||
      !hasShippingAddress
    ) {
      toast.error(t("procurement.ensure_all_fields_completed"));
      return;
    }
    const formattedDelivery = formatAddressString(formData.shippingAddress);
    const combinedData = {
      ...formData,
      DeliveryAddress: formattedDelivery,
      products,
      totalCost,
      signers: newSigners,
      contactPerson:
        formData.contactPerson || formData.shippingAddress?.contactName || "",
      contactPhone:
        formData.contactPhone || formData.shippingAddress?.contactPhone || "",
    };
    console.log("📦 Sending procurement data:", {
      warehouseId: combinedData.warehouseId,
      selectedWarehouseId: selectedWarehouseId,
      formDataWarehouseId: formData.warehouseId,
    });
    addProcurementMutation(combinedData);
    setShowPreviewModal(false);
  };

  const resetForm = () => {
    setFormData({
      companyId: authUser?.company || "",
      supplierId: "",
      supplierName: "",
      warehouseId: "",
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
      shippingAddress: {
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
        contactName: "",
        contactPhone: "",
      },
      contactPerson: "",
      contactPhone: "",
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

  const handleRemoveProduct = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    setFormData((prev) => ({ ...prev, products: updatedProducts }));
    toast.success(t("procurement.product_removed"));
  };

  // Calculate form completion percentage
  const getFormCompletionPercentage = () => {
    let completed = 0;
    let total = 5; // Total steps: supplier, payment, signatures, products, preview
    
    if (formData.supplierId) completed++;
    if (formData.PaymentMethod && hasShippingAddress) completed++;
    if (newSigners.length > 0) completed++;
    if (products.length > 0) completed++;
    if (formData.summeryProcurement) completed++;
    
    return Math.round((completed / total) * 100);
  };

  // ----------------- Render ----------------- //
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600">
              <ShoppingCart size={28} color="white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
        {t("procurement.add_procurement")}
      </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("procurement.create_new_procurement")}
              </p>
            </div>
          </div>
          
          {/* Inventory Alert Banner */}
          {inventoryInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-orange-800 mb-2">
                    ⚠️ התראת מלאי נמוך - {inventoryInfo.productName}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-600">מלאי נוכחי:</p>
                      <p className="text-xl font-bold text-red-600">{inventoryInfo.currentQuantity}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-600">מלאי מינימלי:</p>
                      <p className="text-xl font-bold text-orange-600">{inventoryInfo.minStockLevel}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <p className="text-xs text-gray-600">כמות מומלצת להזמנה:</p>
                      <p className="text-xl font-bold text-green-600">{inventoryInfo.reorderQuantity}</p>
                    </div>
                  </div>
                  <p className="text-sm text-orange-700 mt-2">
                    💡 הטופס מולא אוטומטית עם הנתונים המומלצים
                  </p>
                </div>
                <button
                  onClick={() => setInventoryInfo(null)}
                  className="text-orange-600 hover:text-orange-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                {t("procurement.form_progress")}
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                {getFormCompletionPercentage()}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getFormCompletionPercentage()}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs" style={{ color: 'var(--color-secondary)' }}>
              <div className="flex items-center gap-1">
                {formData.supplierId ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} />}
                <span>{t("procurement.supplier")}</span>
              </div>
              <div className="flex items-center gap-1">
                {formData.PaymentMethod && hasShippingAddress ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} />}
                <span>{t("procurement.payment")}</span>
              </div>
              <div className="flex items-center gap-1">
                {newSigners.length > 0 ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} />}
                <span>{t("procurement.signatures")}</span>
              </div>
              <div className="flex items-center gap-1">
                {products.length > 0 ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} />}
                <span>{t("procurement.products")}</span>
              </div>
              <div className="flex items-center gap-1">
                {formData.summeryProcurement ? <CheckCircle size={14} className="text-green-500" /> : <Circle size={14} />}
                <span>{t("procurement.preview")}</span>
              </div>
            </div>
          </div>
        </motion.div>

      {isPreFilled && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} className="text-yellow-600" />
                <p className="text-yellow-800 font-medium">{t("procurement.pre_filled_mode")}</p>
              </div>
          <button
            onClick={handleSwitchToManual}
                className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
          >
            {t("procurement.switch_to_manual_entry")}
          </button>
        </div>
          </motion.div>
      )}

      {error && (
          <motion.div 
            className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className="text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
        </div>
          </motion.div>
      )}

      {/* Supplier Section */}
        <motion.div
          className="mb-6 rounded-2xl shadow-lg p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Building2 size={24} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
          {t("procurement.supplier_details")}
        </h2>
          </div>
        <SupplierSelect
          supplierId={formData.supplierId}
          onChange={handleSupplierSelect}
        />
        {(selectedSupplier || formData.supplierName) && (
            <motion.div
              className="mt-4 p-4 rounded-xl border"
              style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <p style={{ color: 'var(--text-color)' }}>
                  <strong style={{ color: 'var(--color-primary)' }}>
                {t("procurement.supplier")}:
              </strong>{" "}
              {formData.supplierName}
            </p>
            {selectedSupplier && (
              <>
                    <p style={{ color: 'var(--text-color)' }}>
                      <strong style={{ color: 'var(--color-primary)' }}>
                    {t("procurement.phone")}:
                  </strong>{" "}
                  {selectedSupplier.Phone || "N/A"}
                </p>
                    <p style={{ color: 'var(--text-color)' }}>
                      <strong style={{ color: 'var(--color-primary)' }}>
                    {t("procurement.email")}:
                  </strong>{" "}
                  {selectedSupplier.Email || "N/A"}
                </p>
                    <p style={{ color: 'var(--text-color)' }}>
                      <strong style={{ color: 'var(--color-primary)' }}>
                    {t("procurement.address")}:
                  </strong>{" "}
                  {selectedSupplier.Address || "N/A"}
                </p>
              </>
            )}
                <p style={{ color: 'var(--text-color)' }}>
                  <strong style={{ color: 'var(--color-primary)' }}>
                {t("procurement.currency")}:
              </strong>{" "}
              {formData.currency}
            </p>
          </div>
            </motion.div>
        )}
        </motion.div>

      {/* Payment and Shipping Section */}
        <motion.div
          className="mb-6 rounded-2xl shadow-lg p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <CreditCard size={24} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("procurement.payment_shipping")}
            </h2>
          </div>
        <PaymentAndShipping
          formData={formData}
          handleFormChange={handleFormChange}
          handleCurrencyChange={handleCurrencyChange}
          handleShippingAddressChange={handleShippingAddressChange}
          addressMode={addressMode}
          onAddressModeChange={handleAddressModeChange}
          warehouses={warehouses}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={handleWarehouseSelect}
        />
        </motion.div>

      {/* Signatures Section */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
        <button
          onClick={() => setShowSignatureModal(true)}
            className="px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
        >
            <Users size={20} />
          {t("procurement.select_signature_requirements")}
        </button>
        {newSigners.length > 0 && (
            <motion.div
              className="mt-4 rounded-xl shadow-lg p-4 border"
              style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <h4 className="text-lg font-bold mb-3" style={{ color: 'var(--text-color)' }}>
              {t("procurement.current_signers")}:
            </h4>
              <div className="flex flex-wrap gap-2">
              {newSigners.map((signer, index) => (
                  <motion.div
                  key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                >
                  {signer.name} - {signer.role}
                  </motion.div>
              ))}
          </div>
            </motion.div>
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
        </motion.div>

      {/* Products Section */}
        <motion.div
          className="mb-6 rounded-2xl shadow-lg p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Package size={24} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
          {t("procurement.products")}
        </h2>
          </div>
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
            <motion.div
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
              {t("procurement.products_list")}
            </h3>
                <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                    {products.length} {t("procurement.products")}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-blue-500 to-cyan-600">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-bold text-white">
                        #
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-white">
                      {t("procurement.name")}
                    </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-white">
                      {t("procurement.sku")}
                    </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-white">
                      {t("procurement.category")}
                    </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-white">
                      {t("procurement.quantity")}
                    </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-white">
                      {t("procurement.unit_price")}
                    </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-white">
                      {t("procurement.total")}
                    </th>
                      <th className="py-3 px-4 text-center text-sm font-bold text-white">
                        {t("procurement.actions")}
                    </th>
                  </tr>
                </thead>
                  <tbody style={{ backgroundColor: 'var(--bg-color)' }}>
                    <AnimatePresence>
                  {products.map((p, index) => (
                        <motion.tr
                      key={index}
                          className="border-b transition-colors hover:bg-opacity-50"
                          style={{ borderColor: 'var(--border-color)' }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td className="py-3 px-4 font-bold text-sm" style={{ color: 'var(--color-secondary)' }}>
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-color)' }}>
                        {p.productName}
                      </td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-color)' }}>
                            {p.sku}
                          </td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-color)' }}>
                            {p.category}
                          </td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-color)' }}>
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                              {p.quantity}x
                            </span>
                          </td>
                          <td className="py-3 px-4" style={{ color: 'var(--text-color)' }}>
                        {p.unitPrice} {getCurrencySymbol(formData.currency)}
                      </td>
                          <td className="py-3 px-4 font-bold" style={{ color: 'var(--color-primary)' }}>
                        {p.total} {getCurrencySymbol(formData.currency)}
                      </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleRemoveProduct(index)}
                              className="p-2 rounded-lg bg-red-500 text-white transition-all hover:scale-110 hover:bg-red-600"
                              title={t("procurement.remove")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                </tbody>
              </table>
            </div>
              <div className="mt-4 text-right">
                <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                  {t("procurement.total_cost")}: {" "}
                  <span style={{ color: 'var(--color-primary)' }}>
                    {totalCost} {getCurrencySymbol(formData.currency)}
                  </span>
            </p>
          </div>
            </motion.div>
          )}
        </motion.div>

        {/* Summary Card */}
        {products.length > 0 && (
          <motion.div
            className="mb-6 rounded-2xl shadow-lg p-6 border"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText size={24} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("procurement.order_summary")}
              </h2>
      </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--border-color)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                  {t("procurement.supplier")}
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
                  {formData.supplierName || '-'}
                </p>
              </div>
              
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--border-color)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                  {t("procurement.total_products")}
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
                  {products.length} {t("procurement.products")}
                </p>
              </div>
              
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--border-color)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                  {t("procurement.total_discount", { defaultValue: "Total Discount" })}
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                  {(() => {
                    const totalOriginal = products.reduce((acc, p) => {
                      const originalPrice = p.originalBasePrice || p.baseUnitPrice || p.unitPrice;
                      return acc + (originalPrice * p.quantity);
                    }, 0);
                    const totalCurrent = products.reduce((acc, p) => acc + (p.total || 0), 0);
                    const totalDiscount = totalOriginal > 0 ? ((totalOriginal - totalCurrent) / totalOriginal * 100) : 0;
                    return `${totalDiscount.toFixed(2)}%`;
                  })()}
                </p>
              </div>
              
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--border-color)' }}>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                  {t("procurement.total_cost")}
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {totalCost.toLocaleString()} {formData.currency}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-color)' }}>
                <p className="text-sm" style={{ color: 'var(--text-color)' }}>
                  <strong>{t("procurement.payment_method")}:</strong> {formData.PaymentMethod || '-'}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-color)' }}>
                <p className="text-sm" style={{ color: 'var(--text-color)' }}>
                  <strong>{t("procurement.signers")}:</strong> {newSigners.length || 0}
                </p>
              </div>
            </div>
          </motion.div>
        )}

      {/* Preview Button */}
        <motion.div
          className="flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
        <button
          type="button"
          onClick={handlePreview}
            disabled={
              !formData.supplierId ||
              !formData.PaymentMethod ||
              !hasShippingAddress ||
              products.length === 0
            }
            className="px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
        >
            <Eye size={24} />
          {t("procurement.preview_procurement")}
        </button>
        </motion.div>

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
