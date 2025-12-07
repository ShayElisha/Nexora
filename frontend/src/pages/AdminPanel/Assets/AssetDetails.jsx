import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Wrench,
  DollarSign,
  Shield,
  MapPin,
  Calendar,
  TrendingUp,
  BarChart3,
  FileText,
  User,
  Building2,
  Settings,
  Plus,
  Trash2,
} from "lucide-react";

const AssetDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch asset
  const { data: asset, isLoading } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/assets/${id}`);
      return response.data.data;
    },
  });

  // Calculate performance
  const { mutate: calculatePerformance } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post(`/assets/${id}/performance`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      toast.success(t("assets.performance.calculate"));
    },
  });

  // Calculate TCO
  const { mutate: calculateTCO } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post(`/assets/${id}/tco`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      toast.success(t("assets.costs.calculate_tco"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{t("assets.no_assets")}</p>
        <button
          onClick={() => navigate("/dashboard/assets")}
          className="mt-4 px-4 py-2 rounded-lg border border-gray-300"
        >
          {t("assets.back")}
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: t("assets.details_tabs.overview"), icon: FileText },
    { id: "maintenance", label: t("assets.details_tabs.maintenance"), icon: Wrench },
    { id: "insurance", label: t("assets.details_tabs.insurance"), icon: Shield },
    { id: "depreciation", label: t("assets.details_tabs.depreciation"), icon: DollarSign },
    { id: "performance", label: t("assets.details_tabs.performance"), icon: TrendingUp },
    { id: "costs", label: t("assets.details_tabs.costs"), icon: BarChart3 },
  ];

  return (
    <div className="p-6" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard/assets")}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
                {asset.name}
              </h1>
              <p className="text-gray-500">{asset.assetType}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/dashboard/assets/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Edit size={20} />
            {t("assets.edit")}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{t("assets.overview.basic_info")}</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">{t("assets.overview.manufacturer")}:</span> {asset.manufacturer || t("assets.overview.not_specified")}
                      </p>
                      <p>
                        <span className="font-medium">{t("assets.overview.model")}:</span> {asset.model || t("assets.overview.not_specified")}
                      </p>
                      <p>
                        <span className="font-medium">{t("assets.overview.year")}:</span> {asset.year || t("assets.overview.not_specified")}
                      </p>
                      <p>
                        <span className="font-medium">{t("assets.overview.serial_number")}:</span> {asset.serialNumber || t("assets.overview.not_specified")}
                      </p>
                      <p>
                        <span className="font-medium">{t("assets.overview.barcode")}:</span> {asset.barcode || t("assets.overview.not_specified")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{t("assets.overview.location")}</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">{t("assets.overview.department")}:</span> {asset.departmentId?.name || t("assets.overview.not_specified")}
                      </p>
                      <p>
                        <span className="font-medium">{t("assets.overview.building")}:</span> {asset.location?.building || t("assets.overview.not_specified")}
                      </p>
                      <p>
                        <span className="font-medium">{t("assets.overview.floor")}:</span> {asset.location?.floor || t("assets.overview.not_specified")}
                      </p>
                      <p>
                        <span className="font-medium">{t("assets.overview.room")}:</span> {asset.location?.room || t("assets.overview.not_specified")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{t("assets.overview.purchase")}</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">{t("assets.overview.purchase_date")}:</span>{" "}
                        {asset.purchaseDate
                          ? new Date(asset.purchaseDate).toLocaleDateString("he-IL")
                          : t("assets.overview.not_specified")}
                      </p>
                      <p>
                        <span className="font-medium">{t("assets.overview.purchase_price")}:</span>{" "}
                        {asset.purchasePrice
                          ? `${asset.purchasePrice.toLocaleString()} ${asset.purchaseCurrency || "ILS"}`
                          : t("assets.overview.not_specified")}
                      </p>
                      <p>
                        <span className="font-medium">{t("assets.overview.supplier")}:</span> {asset.supplierId?.SupplierName || t("assets.overview.not_specified")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{t("assets.overview.depreciation")}</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">{t("assets.overview.method")}:</span> {asset.depreciation?.method || t("assets.overview.not_specified")}
                      </p>
                      <p>
                        <span className="font-medium">{t("assets.overview.current_value")}:</span>{" "}
                        {asset.depreciation?.currentValue
                          ? `${asset.depreciation.currentValue.toLocaleString()} ${asset.purchaseCurrency || "ILS"}`
                          : t("assets.depreciation.not_calculated")}
                      </p>
                      <p>
                        <span className="font-medium">{t("assets.overview.accumulated_depreciation")}:</span>{" "}
                        {asset.depreciation?.accumulatedDepreciation
                          ? `${asset.depreciation.accumulatedDepreciation.toLocaleString()} ${asset.purchaseCurrency || "ILS"}`
                          : "0"}
                      </p>
                    </div>
                  </div>
                </div>

                {asset.description && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{t("assets.fields.description")}</h3>
                    <p className="text-sm">{asset.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === "maintenance" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">{t("assets.maintenance.title")}</h3>
                  <button
                    onClick={() => navigate(`/dashboard/assets/${id}/maintenance/add`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    <Plus size={20} />
                    {t("assets.maintenance.add_maintenance")}
                  </button>
                </div>

                {asset.maintenanceSchedule?.nextMaintenanceDate && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-yellow-600" size={20} />
                      <div>
                        <p className="font-semibold text-yellow-800">{t("assets.maintenance.next_maintenance")}</p>
                        <p className="text-sm text-yellow-700">
                          {new Date(asset.maintenanceSchedule.nextMaintenanceDate).toLocaleDateString("he-IL")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {asset.maintenanceHistory && asset.maintenanceHistory.length > 0 ? (
                  <div className="space-y-4">
                    {asset.maintenanceHistory.map((maintenance, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{maintenance.maintenanceType}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(maintenance.date).toLocaleDateString("he-IL")}
                            </p>
                          </div>
                          {maintenance.cost > 0 && (
                            <p className="font-semibold">
                              {maintenance.cost.toLocaleString()} {maintenance.currency || "ILS"}
                            </p>
                          )}
                        </div>
                        {maintenance.description && (
                          <p className="text-sm text-gray-600 mt-2">{maintenance.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">{t("assets.maintenance.no_history")}</p>
                )}
              </div>
            )}

            {/* Insurance Tab */}
            {activeTab === "insurance" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">{t("assets.insurance.title")}</h3>
                  <button
                    onClick={() => navigate(`/dashboard/assets/${id}/insurance/add`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    <Plus size={20} />
                    {t("assets.insurance.add_policy")}
                  </button>
                </div>

                {asset.insurancePolicies && asset.insurancePolicies.length > 0 ? (
                  <div className="space-y-4">
                    {asset.insurancePolicies.map((policy, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{policy.insuranceCompany}</p>
                            <p className="text-sm text-gray-500">מספר פוליסה: {policy.policyNumber}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              policy.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {policy.isActive ? t("assets.insurance.active") : t("assets.insurance.inactive")}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                          <p>
                            <span className="font-medium">כיסוי:</span> {policy.coverageAmount.toLocaleString()}{" "}
                            {policy.currency}
                          </p>
                          <p>
                            <span className="font-medium">פרמיה:</span> {policy.premium.toLocaleString()}{" "}
                            {policy.currency}
                          </p>
                          <p>
                            <span className="font-medium">תאריך התחלה:</span>{" "}
                            {new Date(policy.startDate).toLocaleDateString("he-IL")}
                          </p>
                          <p>
                            <span className="font-medium">תאריך סיום:</span>{" "}
                            {new Date(policy.endDate).toLocaleDateString("he-IL")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">{t("assets.insurance.no_policies")}</p>
                )}
              </div>
            )}

            {/* Depreciation Tab */}
            {activeTab === "depreciation" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">{t("assets.depreciation.title")}</h3>
                  <button
                    onClick={() => calculatePerformance()}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    {t("assets.depreciation.calculate")}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t("assets.depreciation.purchase_price")}</p>
                    <p className="text-2xl font-bold">
                      {asset.purchasePrice?.toLocaleString() || 0} {asset.purchaseCurrency || "ILS"}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t("assets.depreciation.current_value")}</p>
                    <p className="text-2xl font-bold">
                      {asset.depreciation?.currentValue?.toLocaleString() || asset.purchasePrice?.toLocaleString() || 0}{" "}
                      {asset.purchaseCurrency || "ILS"}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t("assets.depreciation.accumulated")}</p>
                    <p className="text-2xl font-bold">
                      {asset.depreciation?.accumulatedDepreciation?.toLocaleString() || 0}{" "}
                      {asset.purchaseCurrency || "ILS"}
                    </p>
                  </div>
                </div>

                {asset.depreciationHistory && asset.depreciationHistory.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-4">היסטוריית פחת</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-right">תקופה</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">סכום פחת</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">פחת מצטבר</th>
                            <th className="border border-gray-300 px-4 py-2 text-right">ערך נוכחי</th>
                          </tr>
                        </thead>
                        <tbody>
                          {asset.depreciationHistory.map((entry, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-4 py-2">{entry.period}</td>
                              <td className="border border-gray-300 px-4 py-2">
                                {entry.depreciationAmount?.toLocaleString() || 0}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {entry.accumulatedDepreciation?.toLocaleString() || 0}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {entry.currentValue?.toLocaleString() || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === "performance" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">{t("assets.performance.title")}</h3>
                  <button
                    onClick={() => calculatePerformance()}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    {t("assets.performance.calculate")}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t("assets.performance.utilization_rate")}</p>
                    <p className="text-3xl font-bold">
                      {asset.performance?.utilizationRate?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t("assets.performance.efficiency")}</p>
                    <p className="text-3xl font-bold">{asset.performance?.efficiency?.toFixed(1) || 0}%</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t("assets.performance.downtime")}</p>
                    <p className="text-3xl font-bold">{asset.performance?.downtime || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t("assets.performance.mtbf")}</p>
                    <p className="text-3xl font-bold">{asset.performance?.mtbf?.toFixed(1) || 0}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">{t("assets.performance.usage_data")}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p>
                      <span className="font-medium">{t("assets.performance.total_hours")}:</span> {asset.usageData?.totalHours || 0}
                    </p>
                    <p>
                      <span className="font-medium">{t("assets.performance.total_kilometers")}:</span> {asset.usageData?.totalKilometers || 0}
                    </p>
                    <p>
                      <span className="font-medium">{t("assets.performance.usage_rate")}:</span> {asset.usageData?.usageRate || 0}%
                    </p>
                    <p>
                      <span className="font-medium">{t("assets.performance.last_used")}:</span>{" "}
                      {asset.usageData?.lastUsedDate
                        ? new Date(asset.usageData.lastUsedDate).toLocaleDateString("he-IL")
                        : t("assets.overview.not_specified")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Costs Tab */}
            {activeTab === "costs" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">{t("assets.costs.title")}</h3>
                  <button
                    onClick={() => calculateTCO()}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    {t("assets.costs.calculate_tco")}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t("assets.costs.purchase_cost")}</p>
                    <p className="text-2xl font-bold">
                      {asset.costs?.totalPurchaseCost?.toLocaleString() || asset.purchasePrice?.toLocaleString() || 0}{" "}
                      {asset.purchaseCurrency || "ILS"}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t("assets.costs.maintenance_cost")}</p>
                    <p className="text-2xl font-bold">
                      {asset.costs?.totalMaintenanceCost?.toLocaleString() || 0}{" "}
                      {asset.purchaseCurrency || "ILS"}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t("assets.costs.operating_cost")}</p>
                    <p className="text-2xl font-bold">
                      {asset.costs?.totalOperatingCost?.toLocaleString() || 0}{" "}
                      {asset.purchaseCurrency || "ILS"}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t("assets.costs.tco")}</p>
                    <p className="text-2xl font-bold">
                      {asset.costs?.tco?.toLocaleString() || 0} {asset.purchaseCurrency || "ILS"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetails;

