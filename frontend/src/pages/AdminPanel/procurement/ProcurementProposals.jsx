import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { toast } from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import { useTranslation } from "react-i18next";

// Zustand Stores
import { useSupplierStore } from "../../../stores/useSupplierStore";
import { useSignatureStore } from "../../../stores/useSignatureStore";
import { useEmployeeStore } from "../../../stores/useEmployeeStore";
import { useProductStore } from "../../../stores/useProductStore";

// Components
import SupplierSelect from "./components/SupplierSelect";
import PaymentAndShipping from "./components/PaymentAndShipping";
import SignaturesModal from "./components/SignaturesModal";
import PreviewModal from "./components/PreviewModal";

// JSON
import currency from "../finance/currency.json";

const ProcurementProposals = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // מקבל מידע על המשתמש המחובר
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  // להצגת מודל יצירת תעודת רכש
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // States עבור יצירת תעודת רכש
  const [formData, setFormData] = useState({
    companyId: authUser?.company || "",
    supplierId: "",
    supplierName: "",
    PurchaseOrder: "",
    PaymentMethod: "",
    PaymentTerms: "",
    DeliveryAddress: "",
    ShippingMethod: "",
    currency: "ILS",
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

  const [products, setProducts] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newRequirement, setNewRequirement] = useState("");
  const [newSigners, setNewSigners] = useState([]);
  const [previousSupplierId, setPreviousSupplierId] = useState(null);

  // Zustand Stores
  const { suppliers, fetchSuppliers } = useSupplierStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const {
    signatureLists,
    fetchSignatureLists,
    deleteSignatureList,
    createSignatureList,
  } = useSignatureStore();
  const { fetchProductsBySupplier } = useProductStore();

  // -----------------------------------------------------
  // 1) מוטציית עדכון הצעת רכש (Update Proposal Status)
  // -----------------------------------------------------
  const { mutate: updateProposalMutation } = useMutation({
    mutationFn: async ({ proposalId, newStatus }) => {
      const response = await axiosInstance.put(`/proposals/${proposalId}`, {
        status: newStatus,
      });
      return response.data;
    },
    onSuccess: (updatedProposal) => {
      toast.success(t("procurement.procurement_created_successfully"));
      setProposals((prev) =>
        prev.map((p) => (p._id === updatedProposal._id ? updatedProposal : p))
      );
    },
    onError: (error) => {
      toast.error(
        t("procurement.update_status_failed") +
          ": " +
          (error?.response?.data?.message || "")
      );
    },
  });

  // -----------------------------------------------------
  // 2) מוטציית יצירת תעודת רכש
  // -----------------------------------------------------
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

      if (selectedProposal) {
        updateProposalMutation({
          proposalId: selectedProposal._id,
          newStatus: "approved",
        });
      }

      setShowModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          t("procurement.failed_to_create_procurement")
      );
    },
  });

  // -----------------------------------------------------
  // שליפת ההצעות (Proposals) מהשרת
  // -----------------------------------------------------
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await axiosInstance.get("/proposals/all");
        setProposals(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setProposals([]);
        toast.error(t("procurement.error_loading_proposals"));
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  // -----------------------------------------------------
  // שליפת נתונים ראשוניים עבור יצירת תעודת רכש
  // -----------------------------------------------------
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

  // -----------------------------------------------------
  // handleStatusChange: "approved" => confirm, אחר -> עדכן ישירות
  // -----------------------------------------------------
  const handleStatusChange = (proposal, newStatus) => {
    if (newStatus === "approved") {
      const wantsToCreateNow = window.confirm(
        t("procurement.create_procurement_now_confirm")
      );
      if (wantsToCreateNow) {
        setSelectedProposal(proposal);
        const proposalProducts = proposal.items.map((item) => ({
          productId: item.productId || "",
          productName: item.productName || t("procurement.no_product_name"),
          sku: item.sku || "",
          category: item.category || t("procurement.uncategorized"),
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          total: (item.quantity || 0) * (item.unitPrice || 0),
          baseUnitPrice: item.unitPrice || 0,
          supplierId: item.supplierId || "",
        }));

        setFormData((prev) => ({
          ...prev,
          companyId: authUser?.company || "",
          PurchaseOrder: generatePurchaseOrderNumber(),
          products: proposalProducts,
          totalCost: proposal.totalEstimatedCost || 0,
          notes: proposal.notes || "",
          deliveryDate: proposal.expectedDeliveryDate || "",
        }));
        setProducts(proposalProducts);
        setTotalCost(proposal.totalEstimatedCost || 0);

        setShowModal(true);
      } else {
        updateProposalMutation({
          proposalId: proposal._id,
          newStatus: "approved and waiting order",
        });
      }
    } else {
      // pending / rejected
      updateProposalMutation({ proposalId: proposal._id, newStatus });
    }
  };

  // -----------------------------------------------------
  // פונקציות עזר
  // -----------------------------------------------------
  const generatePurchaseOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
    return `PO-${year}${month}${day}-${randomNumber}`;
  };

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
      if (!rates[base] || !rates[to]) throw new Error("Currency not supported");
      return rates[to] / rates[base];
    } catch (error) {
      toast.error(t("procurement.fetch_conversion_error"));
      throw error;
    }
  };

  useEffect(() => {
    if (authUser) {
      setFormData((prev) => ({ ...prev, companyId: authUser.company }));
    }
  }, [authUser]);

  // בחירת ספק חדש
  useEffect(() => {
    if (!selectedSupplier) return;
    if (previousSupplierId === selectedSupplier._id) return;

    setFormData((prev) => ({
      ...prev,
      supplierId: selectedSupplier._id,
      supplierName: selectedSupplier.SupplierName,
      currency: selectedSupplier.baseCurrency || "ILS",
    }));
    setPreviousSupplierId(selectedSupplier._id);

    if (selectedSupplier._id) {
      fetchProductsBySupplier(selectedSupplier._id).catch(() =>
        toast.error(t("procurement.failed_to_load_products"))
      );
    }
  }, [
    selectedSupplier,
    previousSupplierId,
    authUser?.company,
    fetchProductsBySupplier,
    t,
  ]);

  // המרה לכל המוצרים עבור הספק הנבחר
  const convertAllProductsForSelectedSupplier = async (selectedCurrency) => {
    if (!selectedSupplier) {
      toast.error(t("procurement.please_select_supplier_first"));
      return;
    }
    const supplierBaseCurrency = selectedSupplier.baseCurrency || "USD";
    const supplierProducts = products.filter(
      (p) => p.supplierId === selectedSupplier._id
    );

    try {
      const updatedProducts = await Promise.all(
        supplierProducts.map(async (product) => {
          const basePrice = product.baseUnitPrice || product.unitPrice;
          if (supplierBaseCurrency === selectedCurrency) {
            return {
              ...product,
              unitPrice: basePrice,
              total: basePrice * product.quantity,
            };
          }
          const rate = await fetchExchangeRate(
            supplierBaseCurrency,
            selectedCurrency
          );
          const convertedPrice = (basePrice * rate).toFixed(2);
          const convertedTotal = (convertedPrice * product.quantity).toFixed(2);
          return {
            ...product,
            unitPrice: parseFloat(convertedPrice),
            total: parseFloat(convertedTotal),
          };
        })
      );

      const updatedProductList = products.map((p) =>
        p.supplierId === selectedSupplier._id
          ? updatedProducts.find((upd) => upd.sku === p.sku) || p
          : p
      );

      const newTotalCost = updatedProductList
        .filter((p) => p.supplierId === selectedSupplier._id)
        .reduce((acc, p) => acc + p.total, 0);

      setProducts(updatedProductList);
      setTotalCost(parseFloat(newTotalCost.toFixed(2)));
    } catch {
      // error handling
    }
  };

  const calculateTotalCost = (prods) =>
    prods.reduce((acc, product) => acc + (product.total || 0), 0);

  useEffect(() => {
    setTotalCost(calculateTotalCost(products));
  }, [products]);

  // -----------------------------------------------------
  // מיון לפי סטטוס ותאריך יעד
  // -----------------------------------------------------
  const statusOrder = {
    pending: 1,
    "approved and waiting order": 2,
    approved: 3,
    rejected: 4,
  };

  const sortedProposals = [...proposals].sort((a, b) => {
    const statusA = a.status || "pending";
    const statusB = b.status || "pending";
    if (statusA !== statusB) {
      return (statusOrder[statusA] || 999) - (statusOrder[statusB] || 999);
    }
    const dateA = a.expectedDeliveryDate
      ? new Date(a.expectedDeliveryDate)
      : null;
    const dateB = b.expectedDeliveryDate
      ? new Date(b.expectedDeliveryDate)
      : null;

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return dateA - dateB;
  });

  // יצירת PDF
  const createPDF = async () => {
    const currencySymbol = getCurrencySymbol(formData.currency);
    const pdf = new jsPDF();

    pdf.setFontSize(10);
    pdf.text(
      `${t("procurement.company", { lng: "en" })}: ${
        authUser?.company || t("procurement.not_available")
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
        formData.DeliveryAddress || t("procurement.not_available")
      }`,
      10,
      30
    );

    pdf.text(
      `${t("procurement.supplier", { lng: "en" })}: ${
        formData.supplierName || t("procurement.not_available")
      }`,
      150,
      20
    );
    pdf.text(
      `${t("procurement.phone", { lng: "en" })}: ${
        selectedSupplier?.Phone || t("procurement.not_available")
      }`,
      150,
      25
    );
    pdf.text(
      `${t("procurement.email", { lng: "en" })}: ${
        selectedSupplier?.Email || t("procurement.not_available")
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
      { header: t("procurement.sku", { lng: "en" }), dataKey: "SKU" },
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
      SKU: prod.sku,
      category: prod.category,
      quantity: prod.quantity,
      unitPrice: `${prod.unitPrice} ${currencySymbol}`,
      total: `${(prod.unitPrice * prod.quantity).toFixed(2)} ${currencySymbol}`,
    }));

    pdf.autoTable({
      startY: 40,
      head: [columns.map((c) => c.header)],
      body: rows.map((r) => Object.values(r)),
      styles: { fontSize: 10, textColor: [0, 0, 0] },
      headStyles: { fillColor: [0, 0, 128], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    pdf.setFontSize(14);
    pdf.text(
      `${t("procurement.total_cost", { lng: "en" })}: ${totalCost.toFixed(
        2
      )} ${currencySymbol}`,
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
      currency: selected?.baseCurrency || "ILS",
    }));
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
    if (newSigners.length === 0) {
      toast.error(t("procurement.signature_list_cannot_be_empty"));
      return;
    }
    if (!formData.summeryProcurement) {
      toast.error(t("procurement.pdf_summary_not_generated"));
      return;
    }

    const combinedData = {
      ...formData,
      products: products.map((prod) => ({
        productId: prod.productId || "",
        productName: prod.productName,
        sku: prod.sku,
        category: prod.category,
        quantity: prod.quantity,
        unitPrice: prod.unitPrice,
        total: prod.total,
        baseUnitPrice: prod.baseUnitPrice,
        supplierId: prod.supplierId,
      })),
      totalCost,
      signers: newSigners,
      proposalId: selectedProposal._id,
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
      currency: "ILS",
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
    setProducts([]);
    setTotalCost(0);
  };

  // Function to open the modal for creating a purchase order
  const openPurchaseOrderModal = (proposal) => {
    setSelectedProposal(proposal);
    const proposalProducts = proposal.items.map((item) => ({
      productId: item.productId || "",
      productName: item.productName || t("procurement.no_product_name"),
      sku: item.sku || "",
      category: item.category || t("procurement.uncategorized"),
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      total: (item.quantity || 0) * (item.unitPrice || 0),
      baseUnitPrice: item.unitPrice || 0,
      supplierId: item.supplierId || "",
    }));

    setFormData((prev) => ({
      ...prev,
      companyId: authUser?.company || "",
      PurchaseOrder: generatePurchaseOrderNumber(),
      products: proposalProducts,
      totalCost: proposal.totalEstimatedCost || 0,
      notes: proposal.notes || "",
      deliveryDate: proposal.expectedDeliveryDate || "",
    }));
    setProducts(proposalProducts);
    setTotalCost(proposal.totalEstimatedCost || 0);

    setShowModal(true);
  };

  // Check if the user is an Admin or Manager
  const canCreatePurchaseOrder =
    authUser?.role === "Admin" || authUser?.role === "Manager";

  if (loading) {
    return (
      <div className="text-center text-gray-500">
        {t("procurement.loading_proposals")}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-8 bg-bg rounded-2xl shadow-2xl border border-border-color transform transition-all duration-500 hover:shadow-3xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {t("procurement.proposals")}
      </h1>

      <section>
        {sortedProposals.length === 0 ? (
          <p className="text-gray-500 text-center">
            {t("procurement.no_proposals")}
          </p>
        ) : (
          <ul className="space-y-6">
            {sortedProposals.map((proposal) => (
              <li
                key={proposal._id || Math.random()}
                className="p-4 border border-gray-200 rounded-md shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-medium text-gray-800">
                    {proposal.title || t("procurement.no_title")}
                  </h2>
                  {proposal.status === "approved and waiting order" &&
                    canCreatePurchaseOrder && (
                      <button
                        onClick={() => openPurchaseOrderModal(proposal)}
                        className="text-blue-600 hover:text-blue-800"
                        title={t("procurement.create_procurement")}
                      >
                        📦
                      </button>
                    )}
                </div>
                <p className="text-gray-600 mt-1">
                  {proposal.description || t("procurement.no_description")}
                </p>

                <p className="text-gray-700 mt-2">
                  <strong>{t("procurement.created_by")}:</strong>{" "}
                  {proposal.createdBy?.name ||
                    proposal.createdBy?._id ||
                    t("procurement.not_available")}
                </p>
                <p className="text-gray-700">
                  <strong>{t("procurement.request_date")}:</strong>{" "}
                  {proposal.requestedDate
                    ? new Date(proposal.requestedDate).toLocaleDateString()
                    : t("procurement.not_available")}
                </p>

                <div className="mt-2 flex items-center">
                  <label className="text-gray-700 font-medium mr-2">
                    {t("procurement.status")}:
                  </label>
                  {proposal.status === "pending" ? (
                    <select
                      value={proposal.status || "pending"}
                      onChange={(e) =>
                        handleStatusChange(proposal, e.target.value)
                      }
                      className="border border-gray-300 rounded-md p-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">
                        {t("procurement.pending")}
                      </option>
                      <option value="approved">
                        {t("procurement.approved")}
                      </option>
                      <option value="rejected">
                        {t("procurement.rejected")}
                      </option>
                    </select>
                  ) : (
                    <span className="font-semibold text-blue-600">
                      {proposal.status}
                    </span>
                  )}
                </div>

                <p className="text-gray-700 mt-2">
                  <strong>{t("procurement.estimated_cost")}:</strong>{" "}
                  {proposal.totalEstimatedCost ||
                    t("procurement.not_available")}
                </p>

                <div className="mt-2">
                  <strong className="text-gray-700">
                    {t("procurement.products_for_purchase")}:
                  </strong>
                  <ul className="list-disc pl-5 mt-1">
                    {Array.isArray(proposal.items) &&
                    proposal.items.length > 0 ? (
                      proposal.items.map((item, idx) => (
                        <li key={idx} className="text-gray-600">
                          {item.productName || t("procurement.no_product_name")}{" "}
                          | {t("procurement.sku")}: {item.sku} |{" "}
                          {t("procurement.category")}: {item.category} |{" "}
                          {t("procurement.quantity")}: {item.quantity} |{" "}
                          {t("procurement.received_quantity")}:{" "}
                          {item.receivedQuantity || 0} |{" "}
                          {t("procurement.unit_price")}: {item.unitPrice} |{" "}
                          {t("procurement.total")}: {item.total}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">
                        {t("procurement.no_products")}
                      </li>
                    )}
                  </ul>
                </div>

                {proposal.expectedDeliveryDate &&
                  !isNaN(new Date(proposal.expectedDeliveryDate).getTime()) && (
                    <p className="text-gray-700 mt-2">
                      <strong>
                        {t("procurement.expected_delivery_date")}:
                      </strong>{" "}
                      {new Date(
                        proposal.expectedDeliveryDate
                      ).toLocaleDateString()}
                    </p>
                  )}

                {proposal.notes && (
                  <p className="text-gray-700 mt-2">
                    <strong>{t("procurement.notes")}:</strong> {proposal.notes}
                  </p>
                )}

                {Array.isArray(proposal.attachments) &&
                  proposal.attachments.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-gray-700">
                        {t("procurement.attachments")}:
                      </strong>
                      <ul className="list-disc pl-5 mt-1">
                        {proposal.attachments.map((url, idx) => (
                          <li key={idx}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {showModal && selectedProposal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h1 className="text-2xl font-bold text-primary mb-6">
              {t("procurement.add_procurement")}
            </h1>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-secondary mb-4">
                {t("procurement.supplier_details")}
              </h2>
              <SupplierSelect
                supplierId={formData.supplierId}
                onChange={handleSupplierSelect}
              />
              {selectedSupplier && (
                <div className="p-4 bg-secondary rounded-md mt-2">
                  <p>
                    <strong>{t("procurement.phone")}:</strong>{" "}
                    {selectedSupplier.Phone || t("procurement.not_available")}
                  </p>
                  <p>
                    <strong>{t("procurement.email")}:</strong>{" "}
                    {selectedSupplier.Email || t("procurement.not_available")}
                  </p>
                  <p>
                    <strong>{t("procurement.address")}:</strong>{" "}
                    {selectedSupplier.Address || t("procurement.not_available")}
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
              className="bg-blue-600 py-2 px-4 text-white rounded mt-4 hover:bg-blue-700"
            >
              {t("procurement.select_signature_requirements")}
            </button>

            {newSigners.length > 0 && (
              <div className="p-4 mt-4 bg-gray-100 rounded-md">
                <h4 className="text-secondary font-bold mb-2">
                  {t("procurement.current_signers")}:
                </h4>
                <ul className="list-disc list-inside">
                  {newSigners.map((signer, index) => (
                    <li key={index} className="text-gray-700">
                      {signer.name} - {signer.role}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <SignaturesModal
              isOpen={showSignatureModal}
              onClose={() => setShowSignatureModal(false)}
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

            <div className="mt-4">
              <h2 className="text-lg font-bold text-secondary mb-4">
                {t("procurement.products_list")}
              </h2>
              {products.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2">
                        {t("procurement.name")}
                      </th>
                      <th className="border border-gray-300 p-2">
                        {t("procurement.sku")}
                      </th>
                      <th className="border border-gray-300 p-2">
                        {t("procurement.category")}
                      </th>
                      <th className="border border-gray-300 p-2">
                        {t("procurement.quantity")}
                      </th>
                      <th className="border border-gray-300 p-2">
                        {t("procurement.unit_price")}
                      </th>
                      <th className="border border-gray-300 p-2">
                        {t("procurement.total")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-2">
                          {p.productName}
                        </td>
                        <td className="border border-gray-300 p-2">{p.sku}</td>
                        <td className="border border-gray-300 p-2">
                          {p.category}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {p.quantity}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {p.unitPrice} {getCurrencySymbol(formData.currency)}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {p.total} {getCurrencySymbol(formData.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">{t("procurement.no_products")}</p>
              )}
              <p className="text-right mt-4 font-bold">
                {t("procurement.total_cost")}: {totalCost}{" "}
                {getCurrencySymbol(formData.currency)}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePreview}
              className="bg-blue-600 py-2 px-4 text-white rounded mt-4 hover:bg-blue-700"
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

            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                {t("procurement.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementProposals;
