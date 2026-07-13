import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import {
  AlertTriangle,
  Package,
  Factory,
  Search,
  Loader2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShoppingCart,
  X,
  Check,
} from "lucide-react";
import { useSupplierStore } from "../../../stores/useSupplierStore";
import { useSignatureStore } from "../../../stores/useSignatureStore";
import { useEmployeeStore } from "../../../stores/useEmployeeStore";
import SupplierSelect from "../procurement/components/SupplierSelect";
import PaymentAndShipping from "../procurement/components/PaymentAndShipping";
import SignaturesModal from "../procurement/components/SignaturesModal";
import currency from "../finance/currency.json";

const MissingComponentsManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedComponents, setExpandedComponents] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [newSigners, setNewSigners] = useState([]);
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newRequirement, setNewRequirement] = useState("");
  
  // Zustand stores
  const { suppliers, fetchSuppliers } = useSupplierStore((state) => state);
  const {
    signatureLists,
    fetchSignatureLists,
    deleteSignatureList,
    createSignatureList,
  } = useSignatureStore((state) => state);
  const { employees, fetchEmployees } = useEmployeeStore((state) => state);
  
  // Fetch warehouses
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
        id: warehouse._id || warehouse.id || "",
        name: warehouse.name || warehouse.title || "Warehouse",
        region: warehouse.region || warehouse.location?.region || "",
        address: warehouse.address || {},
      })),
    [warehousesData]
  );

  // Form data for procurement
  const [formData, setFormData] = useState({
    supplierId: "",
    supplierName: "",
    warehouseId: "",
    PaymentMethod: "",
    PaymentTerms: "",
    DeliveryAddress: "",
    ShippingMethod: "",
    currency: "ILS",
    purchaseDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    warrantyExpiration: "",
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
  });

  const [addressMode, setAddressMode] = useState("warehouse");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  const {
    data: missingData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["missing-components"],
    queryFn: async () => {
      const response = await axiosInstance.get("/production-orders/missing-components");
      if (response.data.success) return response.data.data;
      throw new Error(response.data.message || "שגיאה בטעינת חוסרים");
    },
  });

  // Fetch suppliers, employees, and signature lists on mount
  React.useEffect(() => {
    fetchSuppliers();
    fetchEmployees();
    fetchSignatureLists();
  }, [fetchSuppliers, fetchEmployees, fetchSignatureLists]);

  // Auto-select supplier based on selected components
  React.useEffect(() => {
    if (selectedComponents.length > 0 && missingData?.missingComponents && suppliers.length > 0) {
      const selectedComponentsData = missingData.missingComponents.filter((c) =>
        selectedComponents.includes(c.componentId)
      );

      // Try to find a common supplier for all selected components
      // First, get products to find their suppliers
      const componentIds = selectedComponentsData.map((c) => c.componentId);
      
      // Fetch products to get supplier IDs
      Promise.all(
        componentIds.map((id) =>
          axiosInstance.get(`/product/${id}`).catch(() => null)
        )
      ).then((responses) => {
        const products = responses
          .filter((r) => r?.data?.success)
          .map((r) => r.data.data);
        
        // Find most common supplier
        const supplierCounts = {};
        products.forEach((product) => {
          if (product.supplierId) {
            const supplierIdStr = product.supplierId.toString();
            supplierCounts[supplierIdStr] = (supplierCounts[supplierIdStr] || 0) + 1;
          }
        });

        if (Object.keys(supplierCounts).length > 0) {
          const mostCommonSupplierId = Object.keys(supplierCounts).reduce((a, b) =>
            supplierCounts[a] > supplierCounts[b] ? a : b
          );

          // Only set if no supplier is already selected
          if (mostCommonSupplierId && !formData.supplierId) {
            const supplier = suppliers.find((s) => s._id.toString() === mostCommonSupplierId);
            if (supplier) {
              setFormData((prev) => ({
                ...prev,
                supplierId: supplier._id,
                supplierName: supplier.SupplierName,
                currency: supplier.baseCurrency || prev.currency || "ILS",
              }));
              toast.success(`נבחר ספק אוטומטית: ${supplier.SupplierName}`);
            }
          }
        }
      }).catch((error) => {
        console.error("Error fetching products for supplier selection:", error);
      });
    }
  }, [selectedComponents, missingData, suppliers.length]);

  // Toggle component selection
  const toggleComponentSelection = (componentId) => {
    setSelectedComponents((prev) =>
      prev.includes(componentId)
        ? prev.filter((id) => id !== componentId)
        : [...prev, componentId]
    );
  };

  // Create procurement mutation
  const createProcurementMutation = useMutation({
    mutationFn: async (data) => {
      return axiosInstance.post("/production-orders/missing-components/create-procurement", data);
    },
    onSuccess: (response) => {
      toast.success(`הזמנת רכש ${response.data.data.procurement.PurchaseOrder} נוצרה בהצלחה`);
      queryClient.invalidateQueries(["missing-components"]);
      queryClient.invalidateQueries(["procurement"]);
      setShowProcurementModal(false);
      setSelectedComponents([]);
      setFormData({
        supplierId: "",
        supplierName: "",
        warehouseId: "",
        PaymentMethod: "",
        PaymentTerms: "",
        DeliveryAddress: "",
        ShippingMethod: "",
        currency: "ILS",
        purchaseDate: new Date().toISOString().split("T")[0],
        deliveryDate: "",
        warrantyExpiration: "",
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
      });
      navigate(`/dashboard/procurement/${response.data.data.procurement._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "שגיאה ביצירת הזמנת רכש");
    },
  });

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleShippingAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [field]: value,
      },
    }));
  };

  const handleCurrencyChange = (currency) => {
    setFormData((prev) => ({ ...prev, currency }));
  };

  const handleWarehouseSelect = (warehouseId) => {
    setSelectedWarehouseId(warehouseId);
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    if (warehouse && warehouse.address) {
      setFormData((prev) => ({
        ...prev,
        warehouseId,
        shippingAddress: {
          street: warehouse.address.street || "",
          city: warehouse.address.city || "",
          state: warehouse.address.state || "",
          country: warehouse.address.country || "",
          zipCode: warehouse.address.zipCode || "",
          contactName: warehouse.address.contactName || "",
          contactPhone: warehouse.address.contactPhone || "",
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, warehouseId }));
    }
  };

  const formatAddressString = (address) => {
    if (!address) return "";
    const parts = [
      address.street,
      address.city,
      address.state,
      address.country,
      address.zipCode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const createBasicPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const selectedComponentsData = missingData?.missingComponents?.filter((c) =>
      selectedComponents.includes(c.componentId)
    ) || [];

    pdf.setFontSize(16);
    pdf.text("הזמנת רכש", 105, 20, { align: "center" });

    pdf.setFontSize(12);
    let y = 40;

    // Supplier info
    const supplier = suppliers.find((s) => s._id === formData.supplierId);
    if (supplier) {
      pdf.text(`ספק: ${supplier.SupplierName}`, 20, y);
      y += 10;
    }

    // Products
    pdf.text("מוצרים:", 20, y);
    y += 10;
    selectedComponentsData.forEach((component) => {
      pdf.setFontSize(10);
      pdf.text(
        `${component.componentName} - כמות: ${component.totalMissing} - מחיר יחידה: ₪${component.unitPrice?.toFixed(2) || "0.00"}`,
        25,
        y
      );
      y += 8;
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
    });

    // Total
    const total = selectedComponentsData.reduce(
      (sum, c) => sum + (c.totalMissing * (c.unitPrice || 0)),
      0
    );
    pdf.setFontSize(12);
    pdf.text(`סה"כ: ₪${total.toFixed(2)}`, 20, y + 10);

    return pdf.output("datauristring");
  };

  const handleSubmitProcurement = () => {
    if (selectedComponents.length === 0) {
      toast.error("יש לבחור לפחות רכיב אחד");
      return;
    }

    if (!formData.supplierId || !formData.warehouseId) {
      toast.error("יש למלא ספק ומחסן");
      return;
    }

    if (!formData.PaymentMethod || !formData.PaymentTerms) {
      toast.error("יש למלא שיטת תשלום ותנאי תשלום");
      return;
    }

    if (newSigners.length === 0) {
      toast.error("יש לבחור חתימות");
      return;
    }

    // Create PDF
    const pdfData = createBasicPDF();

    const formattedDelivery = formatAddressString(formData.shippingAddress);
    const combinedData = {
      componentIds: selectedComponents,
      supplierId: formData.supplierId,
      warehouseId: formData.warehouseId,
      deliveryDate: formData.deliveryDate,
      notes: formData.notes,
      summeryProcurement: pdfData,
      signers: newSigners,
      currentSignatures: 0,
      currentSignerIndex: 0,
      ...formData,
      DeliveryAddress: formattedDelivery,
    };

    createProcurementMutation.mutate(combinedData);
  };

  const toggleComponent = (componentId) => {
    setExpandedComponents((prev) =>
      prev.includes(componentId)
        ? prev.filter((id) => id !== componentId)
        : [...prev, componentId]
    );
  };

  const filteredComponents = (missingData?.missingComponents || []).filter((component) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      component.componentName?.toLowerCase().includes(searchLower) ||
      component.sku?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="animate-spin" size={48} style={{ color: "var(--color-primary)" }} />
          <p style={{ color: "var(--text-color)" }}>טוען חוסרים...</p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: "var(--bg-color)" }}
      >
        <div className="text-center">
          <AlertTriangle size={64} className="mx-auto mb-4 text-red-500" />
          <p className="text-red-500 font-medium text-lg">
            {error?.message || "שגיאה בטעינת חוסרים"}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:opacity-80"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    totalComponents: missingData?.totalUniqueComponents || 0,
    totalOrders: missingData?.totalProductionOrders || 0,
    totalMissing: (missingData?.missingComponents || []).reduce(
      (sum, comp) => sum + (comp.totalMissing || 0),
      0
    ),
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-orange-600">
              <AlertTriangle size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                ניהול חוסרים
              </h1>
              <p className="text-lg" style={{ color: "var(--text-color-secondary)" }}>
                סקירה מרכזית של כל הרכיבים החסרים בהזמנות ייצור
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                  <Package size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    רכיבים ייחודיים חסרים
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.totalComponents}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100">
                  <Factory size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    הזמנות ייצור מושפעות
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.totalOrders}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-xl shadow-md border"
              style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-100">
                  <TrendingUp size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                    סה"כ יחידות חסרות
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {stats.totalMissing}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                style={{ color: "var(--text-color-secondary)" }}
              />
              <input
                type="text"
                placeholder="חפש לפי שם רכיב או SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-lg border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>
            <button
              onClick={() => {
                if (selectedComponents.length === 0) {
                  toast.error("יש לבחור לפחות רכיב אחד");
                  return;
                }
                setShowProcurementModal(true);
              }}
              disabled={selectedComponents.length === 0}
              className="px-6 py-2 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-2 bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={20} />
              צור הזמנת רכש ({selectedComponents.length})
            </button>
          </div>
        </motion.div>

        {/* Missing Components List */}
        {filteredComponents.length === 0 ? (
          <div className="text-center py-12">
            <Package size={64} className="mx-auto mb-4" style={{ color: "var(--text-color-secondary)" }} />
            <p className="text-lg" style={{ color: "var(--text-color-secondary)" }}>
              {searchTerm
                ? "לא נמצאו רכיבים התואמים לחיפוש"
                : "אין חוסרים כרגע - כל הרכיבים זמינים!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredComponents.map((component) => (
                <motion.div
                  key={component.componentId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-6 rounded-xl border cursor-pointer transition-all hover:shadow-lg"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                  }}
                  onClick={() => toggleComponent(component.componentId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComponentSelection(component.componentId);
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          selectedComponents.includes(component.componentId)
                            ? "bg-green-600 text-white"
                            : "border"
                        }`}
                        style={{
                          borderColor: selectedComponents.includes(component.componentId)
                            ? "transparent"
                            : "var(--border-color)",
                        }}
                      >
                        {selectedComponents.includes(component.componentId) ? (
                          <Check size={20} />
                        ) : (
                          <Package size={20} style={{ color: "var(--text-color)" }} />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg" style={{ color: "var(--text-color)" }}>
                            {component.componentName}
                          </h3>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            SKU: {component.sku}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span style={{ color: "var(--text-color-secondary)" }}>נדרש:</span>
                            <span className="font-medium" style={{ color: "var(--text-color)" }}>
                              {component.totalRequired}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: "var(--text-color-secondary)" }}>זמין:</span>
                            <span className="font-medium" style={{ color: "var(--text-color)" }}>
                              {component.totalAvailable}
                            </span>
                          </div>
                          {component.totalOrdered > 0 && (
                            <div className="flex items-center gap-2">
                              <span style={{ color: "var(--text-color-secondary)" }}>הוזמן:</span>
                              <span className="font-medium text-blue-600">
                                {component.totalOrdered}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span style={{ color: "var(--text-color-secondary)" }}>חסר:</span>
                            <span className={`font-medium ${component.totalMissing > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {component.totalMissing}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: "var(--text-color-secondary)" }}>מחיר יחידה:</span>
                            <span className="font-medium" style={{ color: "var(--text-color)" }}>
                              ₪{component.unitPrice?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: "var(--text-color-secondary)" }}>הזמנות מושפעות:</span>
                            <span className="font-medium" style={{ color: "var(--text-color)" }}>
                              {component.affectedOrders?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedComponents.includes(component.componentId) ? (
                        <ChevronUp size={20} style={{ color: "var(--text-color-secondary)" }} />
                      ) : (
                        <ChevronDown size={20} style={{ color: "var(--text-color-secondary)" }} />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedComponents.includes(component.componentId) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t overflow-hidden"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <div className="space-y-3">
                          <h4 className="font-semibold" style={{ color: "var(--text-color)" }}>
                            הזמנות ייצור מושפעות:
                          </h4>
                          {component.affectedOrders?.map((order, index) => (
                            <div
                              key={index}
                              className="p-3 rounded-lg flex items-center justify-between"
                              style={{ backgroundColor: "var(--border-color)" }}
                            >
                              <div>
                                <p className="font-medium" style={{ color: "var(--text-color)" }}>
                                  {order.orderNumber} - {order.productName}
                                </p>
                                <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                                  נדרש: {order.required} | זמין: {order.available} | חסר: {order.missing}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/production/${order.orderId}`);
                                }}
                                className="p-2 rounded-lg transition-all hover:opacity-80"
                                style={{
                                  backgroundColor: "var(--color-secondary)",
                                  color: "var(--button-text)",
                                }}
                              >
                                <ExternalLink size={16} />
                              </button>
                            </div>
                          ))}
                          
                          {/* Procurement Orders Section */}
                          {component.procurementOrders && component.procurementOrders.length > 0 && (
                            <>
                              <h4 className="font-semibold mt-4" style={{ color: "var(--text-color)" }}>
                                הזמנות רכש קשורות:
                              </h4>
                              {component.procurementOrders.map((procurement, index) => (
                                <div
                                  key={index}
                                  className="p-3 rounded-lg flex items-center justify-between"
                                  style={{ backgroundColor: "var(--border-color)" }}
                                >
                                  <div>
                                    <p className="font-medium" style={{ color: "var(--text-color)" }}>
                                      {procurement.PurchaseOrder}
                                    </p>
                                    <p className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                                      כמות: {procurement.quantity} | סטטוס: {procurement.orderStatus}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/dashboard/procurement/${procurement.procurementId}`);
                                    }}
                                    className="p-2 rounded-lg transition-all hover:opacity-80"
                                    style={{
                                      backgroundColor: "var(--color-secondary)",
                                      color: "var(--button-text)",
                                    }}
                                  >
                                    <ExternalLink size={16} />
                                  </button>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Procurement Modal */}
        {showProcurementModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8"
              style={{ backgroundColor: "var(--bg-color)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                  צור הזמנת רכש מניהול חוסרים
                </h2>
                <button
                  onClick={() => setShowProcurementModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} style={{ color: "var(--text-color)" }} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Selected Components Summary */}
                <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--border-color)" }}>
                  <h3 className="font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                    רכיבים נבחרים ({selectedComponents.length})
                  </h3>
                  <div className="space-y-2">
                    {missingData?.missingComponents
                      ?.filter((c) => selectedComponents.includes(c.componentId))
                      .map((component) => (
                        <div key={component.componentId} className="text-sm" style={{ color: "var(--text-color-secondary)" }}>
                          {component.componentName} - 
                          {component.totalOrdered > 0 && (
                            <span className="text-blue-600"> הוזמן: {component.totalOrdered},</span>
                          )}
                          {" "}חסר: {component.totalMissing} יחידות
                        </div>
                      ))}
                  </div>
                </div>

                {/* Supplier Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-color)" }}>
                    ספק *
                  </label>
                  <SupplierSelect
                    supplierId={formData.supplierId}
                    onChange={(supplierId) => {
                      const supplier = suppliers.find((s) => s._id === supplierId);
                      setFormData((prev) => ({
                        ...prev,
                        supplierId,
                        supplierName: supplier?.SupplierName || "",
                        currency: supplier?.baseCurrency || prev.currency || "ILS",
                      }));
                    }}
                  />
                </div>

                {/* Payment and Shipping */}
                <PaymentAndShipping
                  formData={formData}
                  handleFormChange={handleFormChange}
                  handleCurrencyChange={handleCurrencyChange}
                  handleShippingAddressChange={handleShippingAddressChange}
                  addressMode={addressMode}
                  onAddressModeChange={setAddressMode}
                  warehouses={warehouses}
                  selectedWarehouseId={selectedWarehouseId}
                  onSelectWarehouse={handleWarehouseSelect}
                />

                {/* Signatures Section */}
                <div className="p-4 rounded-lg border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                      חתימות נדרשות *
                    </h3>
                    <button
                      onClick={() => setShowSignatureModal(true)}
                      className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        color: "var(--button-text)",
                      }}
                    >
                      {newSigners.length > 0
                        ? `נבחרו ${newSigners.length} חתימות`
                        : "בחר חתימות"}
                    </button>
                  </div>
                  {newSigners.length > 0 && (
                    <div className="space-y-2">
                      {newSigners.map((signer, index) => (
                        <div
                          key={index}
                          className="p-2 rounded-lg text-sm"
                          style={{ backgroundColor: "var(--border-color)" }}
                        >
                          {index + 1}. {signer.name} ({signer.role})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-color)" }}>
                      תאריך רכישה
                    </label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-color)" }}>
                      תאריך אספקה
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 rounded-lg border"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-color)" }}>
                    הערות
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                    placeholder="הערות נוספות..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                  <button
                    onClick={() => setShowProcurementModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg font-medium border"
                    style={{
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleSubmitProcurement}
                    disabled={createProcurementMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:opacity-80 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {createProcurementMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        צור הזמנת רכש
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Signatures Modal */}
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
    </div>
  );
};

export default MissingComponentsManagement;

