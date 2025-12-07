import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Save,
  X,
  Package,
  Wrench,
  DollarSign,
  Shield,
  MapPin,
  FileText,
  Settings,
  Calendar,
  Building2,
  User,
} from "lucide-react";

const AddAsset = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    assetType: "Equipment",
    category: "",
    subCategory: "",
    tags: [],
    description: "",
    manufacturer: "",
    model: "",
    year: null,

    // Identification
    serialNumber: "",
    barcode: "",
    rfidTag: "",

    // Purchase Info
    purchaseDate: "",
    purchasePrice: 0,
    purchaseCurrency: "ILS",
    supplierId: "",

    // Warranty
    warrantyStartDate: "",
    warrantyEndDate: "",
    warrantyProvider: "",
    warrantyDetails: "",

    // Location
    departmentId: "",
    location: {
      building: "",
      floor: "",
      room: "",
      address: "",
    },

    // Depreciation
    depreciation: {
      method: "Straight Line",
      usefulLife: 0,
      salvageValue: 0,
    },

    // Status
    status: "Active",
    lifecycle: {
      stage: "New",
    },
  });

  // Fetch asset if editing
  const { data: assetData, isLoading: loadingAsset } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/assets/${id}`);
      return response.data.data;
    },
    enabled: isEdit,
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await axiosInstance.get("/departments");
      return response.data?.data || [];
    },
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await axiosInstance.get("/suppliers");
      return response.data?.data || [];
    },
  });

  useEffect(() => {
    if (assetData && isEdit) {
      setFormData({
        name: assetData.name || "",
        assetType: assetData.assetType || "Equipment",
        category: assetData.category || "",
        subCategory: assetData.subCategory || "",
        tags: assetData.tags || [],
        description: assetData.description || "",
        manufacturer: assetData.manufacturer || "",
        model: assetData.model || "",
        year: assetData.year || null,
        serialNumber: assetData.serialNumber || "",
        barcode: assetData.barcode || "",
        rfidTag: assetData.rfidTag || "",
        purchaseDate: assetData.purchaseDate
          ? new Date(assetData.purchaseDate).toISOString().split("T")[0]
          : "",
        purchasePrice: assetData.purchasePrice || 0,
        purchaseCurrency: assetData.purchaseCurrency || "ILS",
        supplierId: assetData.supplierId?._id || "",
        warrantyStartDate: assetData.warrantyStartDate
          ? new Date(assetData.warrantyStartDate).toISOString().split("T")[0]
          : "",
        warrantyEndDate: assetData.warrantyEndDate
          ? new Date(assetData.warrantyEndDate).toISOString().split("T")[0]
          : "",
        warrantyProvider: assetData.warrantyProvider || "",
        warrantyDetails: assetData.warrantyDetails || "",
        departmentId: assetData.departmentId?._id || "",
        location: assetData.location || {
          building: "",
          floor: "",
          room: "",
          address: "",
        },
        depreciation: assetData.depreciation || {
          method: "Straight Line",
          usefulLife: 0,
          salvageValue: 0,
        },
        status: assetData.status || "Active",
        lifecycle: assetData.lifecycle || {
          stage: "New",
        },
      });
    }
  }, [assetData, isEdit]);

  // Create/Update mutation
  const { mutate: saveAsset, isLoading: saving } = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        const response = await axiosInstance.put(`/assets/${id}`, data);
        return response.data;
      } else {
        const response = await axiosInstance.post("/assets", data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(isEdit ? t("assets.update_success") : t("assets.create_success"));
      navigate("/dashboard/assets");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("assets.save_error"));
    },
  });

  const handleChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveAsset(formData);
  };

  const tabs = [
    { id: "basic", label: t("assets.tabs.basic"), icon: Package },
    { id: "purchase", label: t("assets.tabs.purchase"), icon: DollarSign },
    { id: "warranty", label: t("assets.tabs.warranty"), icon: Shield },
    { id: "location", label: t("assets.tabs.location"), icon: MapPin },
    { id: "depreciation", label: t("assets.tabs.depreciation"), icon: Settings },
  ];

  if (loadingAsset) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Package size={28} color="white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                  {isEdit ? t("assets.edit_asset") : t("assets.add_asset")}
                </h1>
                <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                  {isEdit ? t("assets.edit_asset") : t("assets.add_asset")}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard/assets")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
              style={{
                backgroundColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              <X size={20} />
              {t("assets.cancel")}
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="rounded-2xl shadow-lg border mb-6"
          style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex border-b" style={{ borderColor: "var(--border-color)" }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-6 py-4 border-b-2 transition-colors"
                  style={{
                    borderBottomColor: activeTab === tab.id ? "var(--color-primary)" : "transparent",
                    color: activeTab === tab.id ? "var(--color-primary)" : "var(--color-secondary)",
                  }}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("assets.fields.name")} *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("assets.fields.asset_type")} *
                    </label>
                    <select
                      value={formData.assetType}
                      onChange={(e) => handleChange("assetType", e.target.value)}
                      required
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="Equipment">{t("assets.types.equipment")}</option>
                      <option value="Machinery">{t("assets.types.machinery")}</option>
                      <option value="Vehicle">{t("assets.types.vehicle")}</option>
                      <option value="Furniture">{t("assets.types.furniture")}</option>
                      <option value="IT">{t("assets.types.it")}</option>
                      <option value="Office Equipment">{t("assets.types.office_equipment")}</option>
                      <option value="Building">{t("assets.types.building")}</option>
                      <option value="Land">{t("assets.types.land")}</option>
                      <option value="Other">{t("assets.types.other")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("assets.fields.category")}
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.sub_category")}</label>
                    <input
                      type="text"
                      value={formData.subCategory}
                      onChange={(e) => handleChange("subCategory", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.manufacturer")}</label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => handleChange("manufacturer", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.model")}</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => handleChange("model", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.year")}</label>
                    <input
                      type="number"
                      value={formData.year || ""}
                      onChange={(e) => handleChange("year", e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.status")}</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="Active">{t("assets.statuses.active")}</option>
                      <option value="In Maintenance">{t("assets.statuses.in_maintenance")}</option>
                      <option value="Out of Service">{t("assets.statuses.out_of_service")}</option>
                      <option value="Retired">{t("assets.statuses.retired")}</option>
                      <option value="Sold">{t("assets.statuses.sold")}</option>
                      <option value="Stolen">{t("assets.statuses.stolen")}</option>
                      <option value="Disposed">{t("assets.statuses.disposed")}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.description")}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.serial_number")}</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => handleChange("serialNumber", e.target.value)}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.barcode")}</label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => handleChange("barcode", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.rfid_tag")}</label>
                    <input
                      type="text"
                      value={formData.rfidTag}
                      onChange={(e) => handleChange("rfidTag", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Tab */}
            {activeTab === "purchase" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.purchase_date")}</label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => handleChange("purchaseDate", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.purchase_price")}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => handleChange("purchasePrice", parseFloat(e.target.value) || 0)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.currency")}</label>
                    <select
                      value={formData.purchaseCurrency}
                      onChange={(e) => handleChange("purchaseCurrency", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="ILS">ILS</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.supplier")}</label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => handleChange("supplierId", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="">{t("assets.fields.supplier")}</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.SupplierName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Warranty Tab */}
            {activeTab === "warranty" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.warranty_start")}</label>
                    <input
                      type="date"
                      value={formData.warrantyStartDate}
                      onChange={(e) => handleChange("warrantyStartDate", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.warranty_end")}</label>
                    <input
                      type="date"
                      value={formData.warrantyEndDate}
                      onChange={(e) => handleChange("warrantyEndDate", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.warranty_provider")}</label>
                    <input
                      type="text"
                      value={formData.warrantyProvider}
                      onChange={(e) => handleChange("warrantyProvider", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.warranty_details")}</label>
                  <textarea
                    value={formData.warrantyDetails}
                    onChange={(e) => handleChange("warrantyDetails", e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === "location" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.department")}</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => handleChange("departmentId", e.target.value)}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    <option value="">{t("assets.fields.department")}</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.building")}</label>
                    <input
                      type="text"
                      value={formData.location.building}
                      onChange={(e) => handleChange("location.building", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.floor")}</label>
                    <input
                      type="text"
                      value={formData.location.floor}
                      onChange={(e) => handleChange("location.floor", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.room")}</label>
                    <input
                      type="text"
                      value={formData.location.room}
                      onChange={(e) => handleChange("location.room", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.address")}</label>
                    <input
                      type="text"
                      value={formData.location.address}
                      onChange={(e) => handleChange("location.address", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Depreciation Tab */}
            {activeTab === "depreciation" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.depreciation_method")}</label>
                    <select
                      value={formData.depreciation.method}
                      onChange={(e) => handleChange("depreciation.method", e.target.value)}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="Straight Line">{t("assets.depreciation_methods.straight_line")}</option>
                      <option value="Accelerated">{t("assets.depreciation_methods.accelerated")}</option>
                      <option value="Custom">{t("assets.depreciation_methods.custom")}</option>
                      <option value="None">{t("assets.depreciation_methods.none")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.useful_life")}</label>
                    <input
                      type="number"
                      value={formData.depreciation.usefulLife || ""}
                      onChange={(e) =>
                        handleChange("depreciation.usefulLife", parseInt(e.target.value) || 0)
                      }
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>{t("assets.fields.salvage_value")}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.depreciation.salvageValue || ""}
                      onChange={(e) =>
                        handleChange("depreciation.salvageValue", parseFloat(e.target.value) || 0)
                      }
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t" style={{ borderColor: "var(--border-color)" }}>
              <button
                type="button"
                onClick={() => navigate("/dashboard/assets")}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
                style={{
                  backgroundColor: "var(--border-color)",
                  color: "var(--text-color)",
                }}
              >
                <X size={20} />
                {t("assets.cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "var(--button-text)",
                }}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-t-2 border-white rounded-full animate-spin" />
                    {t("assets.saving")}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {isEdit ? t("assets.update") : t("assets.create")}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddAsset;

