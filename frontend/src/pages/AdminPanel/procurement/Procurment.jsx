import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  FileText,
  Edit3,
  Trash2,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Save,
  Settings
} from "lucide-react";

const Procurement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;

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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const procurementsPerPage = 12;

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
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // === HEADER SECTION WITH GRADIENT EFFECT ===
    pdf.setFillColor(37, 99, 235); // Primary blue
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    // Company Name - Large and Bold
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text(companyName, 15, 15);
    
    // Document Title
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'normal');
    pdf.text("PURCHASE ORDER", 15, 25);
    
    // PO Number Badge
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(pageWidth - 70, 10, 60, 15, 3, 3, 'F');
    pdf.setTextColor(37, 99, 235);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text("PO NUMBER", pageWidth - 67, 16);
    pdf.setFontSize(12);
    pdf.text(procurementData.PurchaseOrder || "N/A", pageWidth - 67, 22);
    
    // Date Badge
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(pageWidth - 70, 30, 60, 10, 2, 2, 'F');
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(8);
    pdf.text(new Date().toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), pageWidth - 67, 37);

    // === INFORMATION BOXES ===
    let yPos = 55;
    
    // Left Box - Company Info
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(15, yPos, 85, 35, 2, 2, 'S');
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.text("FROM", 20, yPos + 7);
    
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text(companyName, 20, yPos + 14);
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(71, 85, 105);
    const formattedShippingAddress = procurementData.shippingAddress
      ? [
          procurementData.shippingAddress.street,
          procurementData.shippingAddress.city,
          procurementData.shippingAddress.state,
          procurementData.shippingAddress.zipCode,
          procurementData.shippingAddress.country,
        ]
          .filter(Boolean)
          .join(", ")
      : null;
    const address = formattedShippingAddress || procurementData.DeliveryAddress || "N/A";
    const addressLines = pdf.splitTextToSize(address, 75);
    pdf.text(addressLines, 20, yPos + 20);
    
    // Right Box - Supplier Info
    const supplierBoxHeight = 45;
    pdf.roundedRect(110, yPos, 85, supplierBoxHeight, 2, 2, 'S');
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.text("TO", 115, yPos + 7);
    
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    const supplierNameLines = pdf.splitTextToSize(procurementData.supplierName || "N/A", 80);
    pdf.text(supplierNameLines, 115, yPos + 14);
    
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(71, 85, 105);
    let supplierInfoY = yPos + 20;
    
    if (selectedSupplier?.Phone) {
      pdf.text(`Tel: ${selectedSupplier.Phone}`, 115, supplierInfoY);
      supplierInfoY += 5;
    }
    if (selectedSupplier?.Email) {
      pdf.text(`Email: ${selectedSupplier.Email}`, 115, supplierInfoY);
      supplierInfoY += 5;
    }
    if (selectedSupplier?.Address) {
      const supplierAddressLines = pdf.splitTextToSize(selectedSupplier.Address, 80);
      pdf.text(supplierAddressLines, 115, supplierInfoY);
    }
    
    // === PRODUCTS TABLE ===
    yPos = 105;

    const columns = [
      { header: "#", dataKey: "no" },
      { header: t("procurement.product_name"), dataKey: "productName" },
      { header: t("procurement.sku"), dataKey: "SKU" },
      { header: t("procurement.category"), dataKey: "category" },
      { header: "QTY", dataKey: "quantity" },
      { header: t("procurement.unit_price"), dataKey: "unitPrice" },
      { header: t("procurement.total"), dataKey: "total" },
    ];

    const rows = procurementData.products.map((prod, index) => ({
      no: index + 1,
      productName: prod.productName,
      SKU: prod.SKU || "N/A",
      category: prod.category || "N/A",
      quantity: prod.quantity,
      unitPrice: `${prod.unitPrice.toFixed(2)} ${currencySymbol}`,
      total: `${(prod.unitPrice * prod.quantity).toFixed(2)} ${currencySymbol}`,
    }));

    pdf.autoTable({
      startY: yPos,
      head: [columns.map((c) => c.header)],
      body: rows.map((r) => Object.values(r)),
      theme: 'grid',
      styles: {
        fontSize: 9,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 50 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 30 },
        6: { halign: 'right', cellWidth: 30 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 15, right: 15 },
    });

    // === SUMMARY BOX ===
    const finalY = pdf.autoTable.previous.finalY + 10;
    const boxWidth = 90;
    const boxX = pageWidth - boxWidth - 15;
    
    // Calculate subtotal (products only, without shipping)
    // Note: totalCost already includes shippingCost after our fix, so we need to subtract it
    const shippingCost = Number(procurementData.shippingCost) || 0;
    const productsSubtotal = procurementData.totalCost - shippingCost;
    const grandTotal = procurementData.totalCost; // Already includes shipping
    
    // Subtotal (Products)
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(boxX, finalY, boxWidth, 12, 2, 2, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(boxX, finalY, boxWidth, 12, 2, 2, 'S');
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text("Subtotal:", boxX + 5, finalY + 8);
    pdf.setFont(undefined, 'normal');
    pdf.text(`${productsSubtotal.toFixed(2)} ${currencySymbol}`, boxX + boxWidth - 5, finalY + 8, { align: 'right' });
    
    // Shipping (if any)
    let totalY = finalY + 12;
    if (shippingCost > 0) {
      pdf.setFillColor(252, 250, 247);
      pdf.roundedRect(boxX, totalY, boxWidth, 12, 2, 2, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(boxX, totalY, boxWidth, 12, 2, 2, 'S');
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text("Shipping:", boxX + 5, totalY + 8);
      pdf.setFont(undefined, 'normal');
      pdf.text(`${shippingCost.toFixed(2)} ${currencySymbol}`, boxX + boxWidth - 5, totalY + 8, { align: 'right' });
      totalY += 12;
    }
    
    // Total - Bold and colored
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(boxX, totalY, boxWidth, 15, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.text("TOTAL:", boxX + 5, totalY + 10);
    pdf.text(`${grandTotal.toFixed(2)} ${currencySymbol}`, boxX + boxWidth - 5, totalY + 10, { align: 'right' });

    // === PAYMENT & SHIPPING INFO ===
    const infoY = totalY + 20;
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(15, infoY, pageWidth - 30, 45, 3, 3, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(15, infoY, pageWidth - 30, 45, 3, 3, 'S');
    
    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text("PAYMENT & DELIVERY INFORMATION", 20, infoY + 8);
    
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    
    let infoLines = [];
    if (procurementData.PaymentMethod) {
      infoLines.push(`Payment Method: ${procurementData.PaymentMethod}`);
    }
    if (procurementData.PaymentTerms) {
      infoLines.push(`Payment Terms: ${procurementData.PaymentTerms}`);
    }
    if (procurementData.ShippingMethod) {
      infoLines.push(`Shipping Method: ${procurementData.ShippingMethod}`);
    }
    if (procurementData.purchaseDate) {
      infoLines.push(`Order Date: ${new Date(procurementData.purchaseDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    if (procurementData.deliveryDate) {
      infoLines.push(`Expected Delivery: ${new Date(procurementData.deliveryDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    if (procurementData.currency) {
      infoLines.push(`Currency: ${procurementData.currency}`);
    }
    if (procurementData.requiresCustoms) {
      infoLines.push(`Customs Required: Yes`);
    }
    
    infoLines.forEach((line, index) => {
      pdf.text(line, 20, infoY + 16 + (index * 5));
    });

    // === DELIVERY ADDRESS SECTION ===
    const deliveryY = infoY + 50;
    if (procurementData.DeliveryAddress || procurementData.shippingAddress) {
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(15, deliveryY, pageWidth - 30, 30, 3, 3, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(15, deliveryY, pageWidth - 30, 30, 3, 3, 'S');
      
      pdf.setTextColor(51, 65, 85);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text("DELIVERY ADDRESS", 20, deliveryY + 8);
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      
      const deliveryAddress = procurementData.DeliveryAddress || 
        (procurementData.shippingAddress ? [
          procurementData.shippingAddress.street,
          procurementData.shippingAddress.city,
          procurementData.shippingAddress.state,
          procurementData.shippingAddress.zipCode,
          procurementData.shippingAddress.country
        ].filter(Boolean).join(", ") : "");
      
      if (procurementData.contactPerson) {
        pdf.text(`Contact: ${procurementData.contactPerson}`, 20, deliveryY + 15);
      }
      if (procurementData.contactPhone) {
        pdf.text(`Phone: ${procurementData.contactPhone}`, 20, deliveryY + 20);
      }
      const addressLines = pdf.splitTextToSize(deliveryAddress, pageWidth - 40);
      pdf.text(addressLines, 20, deliveryY + (procurementData.contactPerson || procurementData.contactPhone ? 25 : 15));
    }
    
    // === NOTES SECTION ===
    const notesY = (procurementData.DeliveryAddress || procurementData.shippingAddress) ? deliveryY + 35 : infoY + 50;
    if (procurementData.notes) {
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(15, notesY, pageWidth - 30, 25, 3, 3, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(15, notesY, pageWidth - 30, 25, 3, 3, 'S');
      
      pdf.setTextColor(51, 65, 85);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text("ADDITIONAL NOTES", 20, notesY + 8);
      
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      const notesLines = pdf.splitTextToSize(procurementData.notes, pageWidth - 40);
      pdf.text(notesLines, 20, notesY + 15);
    }

    // === FOOTER ===
    const footerY = pageHeight - 25;
    pdf.setFillColor(30, 41, 59);
    pdf.rect(0, footerY, pageWidth, 25, 'F');
    
    // Top border line
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.5);
    pdf.line(0, footerY, pageWidth, footerY);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.text(
      `Generated on ${new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}`,
      pageWidth / 2,
      footerY + 10,
      { align: 'center' }
    );
    pdf.setFontSize(7);
    pdf.setTextColor(203, 213, 225);
    pdf.text(
      `${companyName} - Purchase Order Document | PO Number: ${procurementData.PurchaseOrder || "N/A"}`,
      pageWidth / 2,
      footerY + 18,
      { align: 'center' }
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

  // Search, Sort, and Filter Logic
  let filteredProcurements = procurements.filter((record) => {
    const term = searchTerm.toLowerCase();
    const purchaseDateStr = new Date(record.purchaseDate)
      .toLocaleDateString()
      .toLowerCase();
    return (
      record.PurchaseOrder?.toLowerCase().includes(term) ||
      record.supplierName?.toLowerCase().includes(term) ||
      record.totalCost?.toString().toLowerCase().includes(term) ||
      record.currency?.toLowerCase().includes(term) ||
      purchaseDateStr.includes(term) ||
      record.status?.toLowerCase().includes(term)
    );
  });

  if (filterStatus !== "all") {
    filteredProcurements = filteredProcurements.filter(
      (record) => record.status?.toLowerCase() === filterStatus
    );
  }

  if (sortOption) {
    filteredProcurements.sort((a, b) => {
      switch (sortOption) {
        case "PurchaseOrder_asc":
          return a.PurchaseOrder.localeCompare(b.PurchaseOrder);
        case "PurchaseOrder_desc":
          return b.PurchaseOrder.localeCompare(a.PurchaseOrder);
        case "supplierName_asc":
          return a.supplierName.localeCompare(b.supplierName);
        case "supplierName_desc":
          return b.supplierName.localeCompare(a.supplierName);
        case "totalCost_asc":
          return a.totalCost - b.totalCost;
        case "totalCost_desc":
          return b.totalCost - a.totalCost;
        case "currency_asc":
          return a.currency.localeCompare(b.currency);
        case "currency_desc":
          return b.currency.localeCompare(a.currency);
        case "purchaseDate_asc":
          return new Date(a.purchaseDate) - new Date(b.purchaseDate);
        case "purchaseDate_desc":
          return new Date(b.purchaseDate) - new Date(a.purchaseDate);
        case "status_asc":
          return a.status.localeCompare(b.status);
        case "status_desc":
          return b.status.localeCompare(a.status);
        default:
          return 0;
      }
    });
  }

  // Calculate statistics
  const stats = {
    total: filteredProcurements.length,
    completed: filteredProcurements.filter(p => p.status === "completed").length,
    pending: filteredProcurements.filter(p => p.status === "pending").length,
    totalCost: filteredProcurements.reduce((sum, p) => sum + (p.totalCost || 0), 0)
  };

  // Pagination Logic
  const totalPages = Math.ceil(
    filteredProcurements.length / procurementsPerPage
  );
  const indexOfLastProcurement = currentPage * procurementsPerPage;
  const indexOfFirstProcurement = indexOfLastProcurement - procurementsPerPage;
  const currentProcurements = filteredProcurements.slice(
    indexOfFirstProcurement,
    indexOfLastProcurement
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`px-3 py-1 rounded-lg mx-1 transition-all ${
              currentPage === i
                ? "font-bold shadow-lg"
                : "hover:scale-105"
            }`}
            style={{
              backgroundColor: currentPage === i ? 'var(--color-primary)' : 'var(--border-color)',
              color: currentPage === i ? 'var(--button-text)' : 'var(--text-color)'
            }}
          >
            {i}
          </button>
        );
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (startPage > 1) {
        pageNumbers.push(
          <button
            key={1}
            onClick={() => paginate(1)}
            className={`px-3 py-1 rounded-lg mx-1 transition-all ${
              currentPage === 1
                ? "font-bold shadow-lg"
                : "hover:scale-105"
            }`}
            style={{
              backgroundColor: currentPage === 1 ? 'var(--color-primary)' : 'var(--border-color)',
              color: currentPage === 1 ? 'var(--button-text)' : 'var(--text-color)'
            }}
          >
            1
          </button>
        );
        if (startPage > 2) {
          pageNumbers.push(
            <span key="start-dots" className="mx-1" style={{ color: 'var(--text-color)' }}>
              ...
            </span>
          );
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`px-3 py-1 rounded-lg mx-1 transition-all ${
              currentPage === i
                ? "font-bold shadow-lg"
                : "hover:scale-105"
            }`}
            style={{
              backgroundColor: currentPage === i ? 'var(--color-primary)' : 'var(--border-color)',
              color: currentPage === i ? 'var(--button-text)' : 'var(--text-color)'
            }}
          >
            {i}
          </button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(
            <span key="end-dots" className="mx-1" style={{ color: 'var(--text-color)' }}>
              ...
            </span>
          );
        }
        pageNumbers.push(
          <button
            key={totalPages}
            onClick={() => paginate(totalPages)}
            className={`px-3 py-1 rounded-lg mx-1 transition-all ${
              currentPage === totalPages
                ? "font-bold shadow-lg"
                : "hover:scale-105"
            }`}
            style={{
              backgroundColor: currentPage === totalPages ? 'var(--color-primary)' : 'var(--border-color)',
              color: currentPage === totalPages ? 'var(--button-text)' : 'var(--text-color)'
            }}
          >
            {totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  const supplierId = formData.supplierId;

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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Package size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
          {t("procurement.records_title")}
        </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("procurement.manage_procurement_records")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="rounded-2xl shadow-lg p-6 border"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                  {t("procurement.total_procurements")}
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-color)' }}>
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                <ShoppingCart size={24} className="text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl shadow-lg p-6 border"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                  {t("procurement.completed")}
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-color)' }}>
                  {stats.completed}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl shadow-lg p-6 border"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                  {t("procurement.pending")}
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-color)' }}>
                  {stats.pending}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl shadow-lg p-6 border"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                  {t("procurement.total_value")}
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-color)' }}>
                  {stats.totalCost.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100">
                <DollarSign size={24} className="text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search, Sort, and Filter */}
        <motion.div
          className="mb-6 rounded-2xl shadow-lg p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t("procurement.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ 
                  borderColor: 'var(--border-color)', 
                  backgroundColor: 'var(--bg-color)', 
                  color: 'var(--text-color)' 
                }}
              />
            </div>
            <div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ 
                  borderColor: 'var(--border-color)', 
                  backgroundColor: 'var(--bg-color)', 
                  color: 'var(--text-color)' 
                }}
          >
            <option value="">{t("procurement.sort_by")}</option>
            <option value="PurchaseOrder_asc">
              {t("procurement.sort_po_asc")}
            </option>
            <option value="PurchaseOrder_desc">
              {t("procurement.sort_po_desc")}
            </option>
            <option value="supplierName_asc">
              {t("procurement.sort_supplier_asc")}
            </option>
            <option value="supplierName_desc">
              {t("procurement.sort_supplier_desc")}
            </option>
            <option value="totalCost_asc">
              {t("procurement.sort_total_cost_asc")}
            </option>
            <option value="totalCost_desc">
              {t("procurement.sort_total_cost_desc")}
            </option>
            <option value="purchaseDate_asc">
              {t("procurement.sort_date_asc")}
            </option>
            <option value="purchaseDate_desc">
              {t("procurement.sort_date_desc")}
            </option>
          </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3.5 text-gray-400" size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ 
                  borderColor: 'var(--border-color)', 
                  backgroundColor: 'var(--bg-color)', 
                  color: 'var(--text-color)' 
                }}
          >
            <option value="all">{t("procurement.filter_status_all")}</option>
            <option value="completed">{t("procurement.completed")}</option>
            <option value="pending">{t("procurement.pending")}</option>
            <option value="cancelled">{t("procurement.cancelled")}</option>
          </select>
        </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <motion.div
              className="w-16 h-16 border-4 border-t-4 rounded-full"
              style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--color-primary)' }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </div>
        ) : filteredProcurements.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {currentProcurements.map((record, index) => (
                  <motion.div
                  key={record._id}
                    className="rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-shadow"
                    style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                    {record.PurchaseOrder}
                  </h2>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        record.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : record.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {record.status === "completed" ? <CheckCircle size={14} /> : 
                         record.status === "pending" ? <Clock size={14} /> : <XCircle size={14} />}
                        {record.status || "Pending"}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                        <Package size={16} style={{ color: 'var(--color-secondary)' }} />
                        <strong>{t("procurement.supplier")}:</strong> {record.supplierName}
                      </p>
                      <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                        <DollarSign size={16} style={{ color: 'var(--color-secondary)' }} />
                        <strong>{t("procurement.total_cost")}:</strong> {record.totalCost} {record.currency || "₪"}
                      </p>
                      <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                        <Calendar size={16} style={{ color: 'var(--color-secondary)' }} />
                    <strong>{t("procurement.purchase_date")}:</strong>{" "}
                    {new Date(record.purchaseDate).toLocaleDateString()}
                  </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                    <button
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all hover:scale-105"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                      onClick={() => setSelectedPDF(record.summeryProcurement)}
                    >
                        <Eye size={16} />
                      {t("procurement.view_pdf")}
                    </button>
                    {record.statusUpdate === null &&
                      record.orderStatus !== "Delivered" && (
                        <>
                          <button
                              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all hover:scale-105"
                              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                            onClick={() => handleEditClick(record)}
                          >
                              <Edit3 size={16} />
                          </button>
                          <button
                              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white font-medium transition-all hover:scale-105 hover:bg-red-600"
                            onClick={() => handleDeleteClick(record._id)}
                          >
                              <Trash2 size={16} />
                          </button>
                        </>
                      )}
                  </div>
                  </motion.div>
              ))}
              </AnimatePresence>
            </div>
            
            {totalPages > 1 && (
              <motion.div
                className="flex justify-center items-center mt-8 gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
                  style={{ 
                    backgroundColor: 'var(--border-color)', 
                    color: 'var(--text-color)' 
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                {renderPageNumbers()}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
                  style={{ 
                    backgroundColor: 'var(--border-color)', 
                    color: 'var(--text-color)' 
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Package size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
            <p className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
            {t("procurement.no_records")}
          </p>
          </motion.div>
        )}

        {/* PDF Modal */}
        <AnimatePresence>
        {selectedPDF && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPDF(null)}
            >
              <motion.div
                className="rounded-2xl shadow-2xl w-full max-w-4xl h-5/6 flex flex-col border"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.view_pdf")}
                  </h3>
              <button
                    className="p-2 rounded-lg transition-all hover:scale-110"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                onClick={() => setSelectedPDF(null)}
              >
                    <X size={20} />
              </button>
                </div>
              <iframe
                src={`${selectedPDF}`}
                title="Procurement PDF"
                  className="w-full flex-1 rounded-b-2xl"
              ></iframe>
              </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Edit Modal - keeping the original functionality but with improved styling */}
        <AnimatePresence>
        {isModalOpen && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-color)' }}>
                      <Edit3 size={28} style={{ color: 'var(--color-primary)' }} />
                {t("procurement.edit_title")}
              </h2>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
              <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
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
                          className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          style={{ 
                            borderColor: 'var(--border-color)', 
                            backgroundColor: 'var(--bg-color)', 
                            color: 'var(--text-color)' 
                          }}
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.total_cost")}
                    </label>
                    <input
                      type="number"
                      value={formData.totalCost || ""}
                      readOnly
                          className="w-full p-3 border rounded-xl opacity-70"
                          style={{ 
                            borderColor: 'var(--border-color)', 
                            backgroundColor: 'var(--bg-color)', 
                            color: 'var(--text-color)' 
                          }}
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                      {t("procurement.currency")}
                    </label>
                    <input
                      type="text"
                      value={formData.currency || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                          className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          style={{ 
                            borderColor: 'var(--border-color)', 
                            backgroundColor: 'var(--bg-color)', 
                            color: 'var(--text-color)' 
                          }}
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
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
                          className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          style={{ 
                            borderColor: 'var(--border-color)', 
                            backgroundColor: 'var(--bg-color)', 
                            color: 'var(--text-color)' 
                          }}
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
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
                          className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          style={{ 
                            borderColor: 'var(--border-color)', 
                            backgroundColor: 'var(--bg-color)', 
                            color: 'var(--text-color)' 
                          }}
                    />
                  </div>
                </div>

                <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.notes")}
                  </label>
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                        className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        style={{ 
                          borderColor: 'var(--border-color)', 
                          backgroundColor: 'var(--bg-color)', 
                          color: 'var(--text-color)' 
                        }}
                    rows="3"
                  />
                </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
                  {t("procurement.products_in_procurement")}
                </h3>
                      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-purple-500 to-pink-600">
                            <tr>
                              <th className="py-3 px-4 text-sm font-semibold text-white text-left">
                          {t("procurement.product_name")}
                        </th>
                              <th className="py-3 px-4 text-sm font-semibold text-white text-left">
                          {t("procurement.sku")}
                        </th>
                              <th className="py-3 px-4 text-sm font-semibold text-white text-left">
                          {t("procurement.category")}
                        </th>
                              <th className="py-3 px-4 text-sm font-semibold text-white text-left">
                          {t("procurement.quantity")}
                        </th>
                              <th className="py-3 px-4 text-sm font-semibold text-white text-left">
                          {t("procurement.unit_price")}
                        </th>
                              <th className="py-3 px-4 text-sm font-semibold text-white text-left">
                          {t("procurement.total")}
                        </th>
                              <th className="py-3 px-4 text-sm font-semibold text-white text-left">
                          {t("procurement.actions")}
                        </th>
                      </tr>
                    </thead>
                          <tbody style={{ backgroundColor: 'var(--bg-color)' }}>
                      {formData.products?.map((product, index) => (
                        <tr
                          key={index}
                                className="border-b hover:bg-opacity-50 transition-colors"
                                style={{ borderColor: 'var(--border-color)' }}
                        >
                                <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-color)' }}>
                            {product.productName}
                          </td>
                                <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-color)' }}>
                                  {product.SKU}
                                </td>
                                <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-color)' }}>
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
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    style={{ 
                                      borderColor: 'var(--border-color)', 
                                      backgroundColor: 'var(--bg-color)', 
                                      color: 'var(--text-color)' 
                                    }}
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
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    style={{ 
                                      borderColor: 'var(--border-color)', 
                                      backgroundColor: 'var(--bg-color)', 
                                      color: 'var(--text-color)' 
                                    }}
                            />
                          </td>
                                <td className="py-3 px-4 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                                  {(product.quantity * product.unitPrice).toFixed(2) || 0}
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
                                    className="p-2 rounded-lg bg-red-500 text-white transition-all hover:scale-110 hover:bg-red-600"
                            >
                                    <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                      </div>
                </div>

                    <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                        <Plus size={20} />
                  {t("procurement.AddNewProduct")}
                </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
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
                            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                            style={{ 
                              borderColor: 'var(--border-color)', 
                              backgroundColor: 'var(--bg-color)', 
                              color: 'var(--text-color)' 
                            }}
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                        {t("procurement.sku")}
                      </label>
                      <input
                        type="text"
                        value={productData.SKU}
                        readOnly
                              className="w-full p-3 border rounded-xl opacity-70"
                              style={{ 
                                borderColor: 'var(--border-color)', 
                                backgroundColor: 'var(--bg-color)', 
                                color: 'var(--text-color)' 
                              }}
                      />
                    </div>
                    <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                        {t("procurement.category")}
                      </label>
                      <input
                        type="text"
                        value={productData.category}
                        readOnly
                              className="w-full p-3 border rounded-xl opacity-70"
                              style={{ 
                                borderColor: 'var(--border-color)', 
                                backgroundColor: 'var(--bg-color)', 
                                color: 'var(--text-color)' 
                              }}
                      />
                    </div>
                    <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                        {t("procurement.unit_price")}
                      </label>
                      <input
                        type="number"
                        value={productData.unitPrice}
                        readOnly
                              className="w-full p-3 border rounded-xl opacity-70"
                              style={{ 
                                borderColor: 'var(--border-color)', 
                                backgroundColor: 'var(--bg-color)', 
                                color: 'var(--text-color)' 
                              }}
                      />
                    </div>
                    <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
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
                              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                              style={{ 
                                borderColor: 'var(--border-color)', 
                                backgroundColor: 'var(--bg-color)', 
                                color: 'var(--text-color)' 
                              }}
                        disabled={!supplierId}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddProduct}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                    disabled={!supplierId}
                  >
                          <Plus size={20} />
                    {t("procurement.add_product")}
                  </button>
                      </div>
                </div>

                    <div className="flex justify-end gap-4">
                  <button
                    type="button"
                        className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2"
                        style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-color)' }}
                    onClick={() => setIsModalOpen(false)}
                  >
                        <X size={20} />
                    {t("procurement.cancel")}
                  </button>
                  <button
                    type="button"
                        className="px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                    onClick={handleModalSave}
                  >
                        <Save size={20} />
                    {t("procurement.save")}
                  </button>
                </div>
              </form>
            </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Procurement;
