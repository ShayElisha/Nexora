import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import {
  Warehouse,
  MapPin,
  ThermometerSun,
  Droplets,
  Package,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Activity,
  Layers3,
  Plus,
  Edit,
  Trash2,
  X,
  Download,
} from "lucide-react";

const statusStyles = {
  operational: "text-green-600 bg-green-50 border-[var(--border-color)]",
  maintenance: "text-amber-600 bg-amber-50 border-amber-200",
  offline: "text-red-600 bg-red-50 border-red-200",
};

const automationLabels = {
  high: "Autonomous",
  medium: "Hybrid",
  low: "Manual assisted",
};

const emptyWarehouseForm = {
  name: "",
  region: "",
  status: "operational",
  automation: "medium",
  capacity: "",
  utilization: "",
  temperature: "",
  humidity: "",
  inboundToday: "",
  outboundToday: "",
  lastAudit: "",
  address: {
    street: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    contactName: "",
    contactPhone: "",
  },
};

const TEMPERATURE_ALERT = 15;
const HUMIDITY_HIGH = 75;
const HUMIDITY_LOW = 30;

const WarehouseManagement = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [automationFilter, setAutomationFilter] = useState("all");
  const [sortOption, setSortOption] = useState("utilization_desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [formData, setFormData] = useState(emptyWarehouseForm);
  const [activeWarehouseId, setActiveWarehouseId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const {
    data: warehouses = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const response = await axiosInstance.get("/warehouses");
      return response.data?.data || [];
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          t("warehouse.fetch_error", { defaultValue: "Unable to load warehouses." })
      );
    },
  });

  const createWarehouse = useMutation({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post("/warehouses", payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("warehouse.create_success", { defaultValue: "Warehouse created." }));
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("warehouse.create_error", { defaultValue: "Failed to create warehouse." }));
    },
  });

  const updateWarehouse = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await axiosInstance.put(`/warehouses/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("warehouse.update_success", { defaultValue: "Warehouse updated." }));
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("warehouse.update_error", { defaultValue: "Failed to update warehouse." }));
    },
  });

  const quickStatusMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await axiosInstance.put(`/warehouses/${id}`, payload);
      return response.data;
    },
    onMutate: ({ id }) => {
      setStatusUpdatingId(id);
    },
    onSuccess: () => {
      toast.success(t("warehouse.update_success", { defaultValue: "Warehouse updated." }));
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          t("warehouse.update_error", { defaultValue: "Failed to update warehouse." })
      );
    },
    onSettled: () => {
      setStatusUpdatingId(null);
    },
  });

  const deleteWarehouse = useMutation({
    mutationFn: async (id) => {
      const response = await axiosInstance.delete(`/warehouses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t("warehouse.delete_success", { defaultValue: "Warehouse deleted." }));
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("warehouse.delete_error", { defaultValue: "Failed to delete warehouse." }));
    },
  });

  const normalizedWarehouses = useMemo(() => {
    if (!warehouses.length) return [];

    return warehouses.map((warehouse, index) => ({
      id: warehouse.id || warehouse.identifier || warehouse.code || warehouse._id || `WH-${index + 1}`,
      name: warehouse.name || warehouse.title || `Warehouse ${index + 1}`,
      region: warehouse.region || warehouse.location?.region || "Unknown",
      status: warehouse.status || "operational",
      capacity: Number(warehouse.capacity) || 0,
      utilization: Number(warehouse.utilization ?? warehouse.fillRate) || 0,
      temperature: warehouse.conditions?.temperature ?? warehouse.temperature ?? 0,
      humidity: warehouse.conditions?.humidity ?? warehouse.humidity ?? 0,
      automation: warehouse.automationLevel || warehouse.automation || "medium",
      lastAudit: warehouse.lastAudit || warehouse.auditDate || "—",
      inboundToday: warehouse.throughput?.inbound ?? warehouse.inboundToday ?? 0,
      outboundToday: warehouse.throughput?.outbound ?? warehouse.outboundToday ?? 0,
      safetyScore: warehouse.safetyScore || 0,
      alerts: warehouse.alerts || [],
      address: {
        street: warehouse.address?.street || "",
        city: warehouse.address?.city || "",
        state: warehouse.address?.state || "",
        country: warehouse.address?.country || "",
        zipCode: warehouse.address?.zipCode || "",
        contactName: warehouse.address?.contactName || "",
        contactPhone: warehouse.address?.contactPhone || "",
      },
    }));
  }, [warehouses]);

  const stats = useMemo(() => {
    if (!normalizedWarehouses.length) {
      return {
        total: 0,
        totalCapacity: 0,
        avgUtilization: 0,
        alertCount: 0,
        maintenanceCount: 0,
      };
    }

    const totalCapacity = normalizedWarehouses.reduce((acc, wh) => acc + wh.capacity, 0);
    const avgUtilization =
      normalizedWarehouses.reduce((acc, wh) => acc + wh.utilization, 0) /
      normalizedWarehouses.length || 0;
    const alertCount = normalizedWarehouses.reduce((acc, wh) => acc + wh.alerts.length, 0);
    const maintenanceCount = normalizedWarehouses.filter((wh) => wh.status !== "operational").length;

    return {
      total: normalizedWarehouses.length,
      totalCapacity,
      avgUtilization,
      alertCount,
      maintenanceCount,
    };
  }, [normalizedWarehouses]);

  const filteredWarehouses = useMemo(() => {
    let data = normalizedWarehouses;

    if (searchTerm) {
      data = data.filter(
        (wh) =>
          wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wh.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") data = data.filter((wh) => wh.status === statusFilter);
    if (regionFilter !== "all") data = data.filter((wh) => wh.region === regionFilter);
    if (automationFilter !== "all") data = data.filter((wh) => wh.automation === automationFilter);

    if (sortOption) {
      const [field, direction] = sortOption.split("_");
      const dir = direction === "asc" ? 1 : -1;
      data = [...data].sort((a, b) => {
        if (field === "utilization") return (a.utilization - b.utilization) * dir;
        if (field === "capacity") return (a.capacity - b.capacity) * dir;
        if (field === "temperature") return (a.temperature - b.temperature) * dir;
        return 0;
      });
    }

    return data;
  }, [normalizedWarehouses, searchTerm, statusFilter, regionFilter, automationFilter, sortOption]);

  const regions = useMemo(() => {
    return Array.from(new Set(normalizedWarehouses.map((wh) => wh.region).filter(Boolean)));
  }, [normalizedWarehouses]);

  const regionBreakdown = useMemo(() => {
    if (!normalizedWarehouses.length) return [];
    const map = new Map();
    normalizedWarehouses.forEach((wh) => {
      const key = wh.region || t("warehouse.region", { defaultValue: "Region" });
      if (!map.has(key)) {
        map.set(key, { region: key, capacity: 0, count: 0, utilizationSum: 0 });
      }
      const entry = map.get(key);
      entry.capacity += wh.capacity || 0;
      entry.count += 1;
      entry.utilizationSum += wh.utilization || 0;
    });
    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        avgUtilization: entry.count ? entry.utilizationSum / entry.count : 0,
      }))
      .sort((a, b) => b.capacity - a.capacity);
  }, [normalizedWarehouses, t]);

  const topUtilizedWarehouses = useMemo(() => {
    return [...normalizedWarehouses]
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 3);
  }, [normalizedWarehouses]);

  const environmentRisks = useMemo(() => {
    return normalizedWarehouses
      .map((wh) => {
        const reasons = [];
        if (wh.temperature >= TEMPERATURE_ALERT) {
          reasons.push(t("warehouse.temperature_alert", { value: wh.temperature }));
        }
        if (wh.humidity >= HUMIDITY_HIGH) {
          reasons.push(t("warehouse.humidity_alert_high", { value: wh.humidity }));
        } else if (wh.humidity > 0 && wh.humidity <= HUMIDITY_LOW) {
          reasons.push(t("warehouse.humidity_alert_low", { value: wh.humidity }));
        }
        return { ...wh, reasons };
      })
      .filter((item) => item.reasons.length > 0)
      .sort((a, b) => b.reasons.length - a.reasons.length)
      .slice(0, 3);
  }, [normalizedWarehouses, t]);

  const StatusBadge = ({ status }) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
        statusStyles[status] || "bg-[var(--bg-secondary)] text-[var(--color-secondary)] border-[var(--border-color)]"
      }`}
    >
      {status === "operational"
        ? t("warehouse.status_operational", { defaultValue: "Operational" })
        : status === "maintenance"
          ? t("warehouse.status_maintenance", { defaultValue: "Maintenance" })
          : t("warehouse.status_offline", { defaultValue: "Offline" })}
    </span>
  );

  const openCreateModal = () => {
    setFormData(emptyWarehouseForm);
    setActiveWarehouseId(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEditModal = (warehouse) => {
    setFormData({
      name: warehouse.name || "",
      region: warehouse.region || "",
      status: warehouse.status || "operational",
      automation: warehouse.automation || "medium",
      capacity: warehouse.capacity || "",
      utilization: warehouse.utilization || "",
      temperature: warehouse.temperature || "",
      humidity: warehouse.humidity || "",
      inboundToday: warehouse.inboundToday || "",
      outboundToday: warehouse.outboundToday || "",
      lastAudit: warehouse.lastAudit && warehouse.lastAudit !== "—" ? warehouse.lastAudit.slice(0, 10) : "",
      address: {
        street: warehouse.address?.street || "",
        city: warehouse.address?.city || "",
        state: warehouse.address?.state || "",
        country: warehouse.address?.country || "",
        zipCode: warehouse.address?.zipCode || "",
        contactName: warehouse.address?.contactName || "",
        contactPhone: warehouse.address?.contactPhone || "",
      },
    });
    setActiveWarehouseId(warehouse.id);
    setModalMode("edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMode("create");
    setActiveWarehouseId(null);
    setFormData(emptyWarehouseForm);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t("warehouse.form_errors_name", { defaultValue: "Please enter a warehouse name." }));
      return;
    }

    if (!formData.region.trim()) {
      toast.error(t("warehouse.form_errors_region", { defaultValue: "Please enter a region." }));
      return;
    }

    const addressRequiredFields = ["street", "city", "country"];
    const missingAddressFields = addressRequiredFields.filter(
      (field) => !formData.address?.[field]?.trim()
    );

    if (missingAddressFields.length) {
      toast.error(
        t("warehouse.form_errors_address", {
          defaultValue: "Please fill all required address fields.",
        })
      );
      return;
    }

    const payload = {
      name: formData.name.trim(),
      region: formData.region.trim(),
      status: formData.status,
      automation: formData.automation,
      capacity: Number(formData.capacity) || 0,
      utilization: Number(formData.utilization) || 0,
      temperature: Number(formData.temperature) || 0,
      humidity: Number(formData.humidity) || 0,
      inboundToday: Number(formData.inboundToday) || 0,
      outboundToday: Number(formData.outboundToday) || 0,
      lastAudit: formData.lastAudit || undefined,
      address: {
        street: formData.address.street.trim(),
        city: formData.address.city.trim(),
        state: formData.address.state?.trim() || "",
        country: formData.address.country.trim(),
        zipCode: formData.address.zipCode?.trim() || "",
        contactName: formData.address.contactName?.trim() || "",
        contactPhone: formData.address.contactPhone?.trim() || "",
      },
    };

    if (modalMode === "create") {
      createWarehouse.mutate(payload);
    } else if (modalMode === "edit" && activeWarehouseId) {
      updateWarehouse.mutate({ id: activeWarehouseId, payload });
    }
  };

  const handleDelete = (warehouse) => {
    const confirmed = window.confirm(
      t("warehouse.confirm_delete", {
        defaultValue: "Are you sure you want to delete \"{{name}}\"?",
        name: warehouse.name,
      })
    );

    if (!confirmed) return;
    deleteWarehouse.mutate(warehouse.id);
  };

  const statusLabelKey = {
    operational: "warehouse.status_operational",
    maintenance: "warehouse.status_maintenance",
    offline: "warehouse.status_offline",
  };

  const getStatusLabel = (status) =>
    t(statusLabelKey[status] || statusLabelKey.operational, {
      defaultValue: status,
    });

  const buildPayloadFromWarehouse = (warehouse, overrides = {}) => ({
    name: overrides.name ?? warehouse.name ?? "",
    region: overrides.region ?? warehouse.region ?? "",
    status: overrides.status ?? warehouse.status ?? "operational",
    automation: overrides.automation ?? warehouse.automation ?? "medium",
    capacity: overrides.capacity ?? warehouse.capacity ?? 0,
    utilization: overrides.utilization ?? warehouse.utilization ?? 0,
    temperature: overrides.temperature ?? warehouse.temperature ?? 0,
    humidity: overrides.humidity ?? warehouse.humidity ?? 0,
    inboundToday: overrides.inboundToday ?? warehouse.inboundToday ?? 0,
    outboundToday: overrides.outboundToday ?? warehouse.outboundToday ?? 0,
    lastAudit:
      overrides.lastAudit !== undefined
        ? overrides.lastAudit
        : warehouse.lastAudit && warehouse.lastAudit !== "—"
          ? warehouse.lastAudit
          : undefined,
    address: {
      street:
        overrides.address?.street ??
        warehouse.address?.street ??
        "",
      city:
        overrides.address?.city ?? warehouse.address?.city ?? "",
      state:
        overrides.address?.state ?? warehouse.address?.state ?? "",
      country:
        overrides.address?.country ??
        warehouse.address?.country ??
        "",
      zipCode:
        overrides.address?.zipCode ??
        warehouse.address?.zipCode ??
        "",
      contactName:
        overrides.address?.contactName ??
        warehouse.address?.contactName ??
        "",
      contactPhone:
        overrides.address?.contactPhone ??
        warehouse.address?.contactPhone ??
        "",
    },
  });

  const handleQuickStatusChange = (warehouse, nextStatus) => {
    if (warehouse.status === nextStatus) {
      toast(t("warehouse.status_already_set", { name: warehouse.name, statusLabel: getStatusLabel(nextStatus) }));
      return;
    }
    const payload = buildPayloadFromWarehouse(warehouse, { status: nextStatus });
    quickStatusMutation.mutate({ id: warehouse.id, payload });
  };

  const handleExportCsv = () => {
    if (!normalizedWarehouses.length) {
      toast.error(t("warehouse.no_results", { defaultValue: "No warehouses match your filters." }));
      return;
    }
    const headers = [
      "ID",
      "Name",
      "Region",
      "Status",
      "Automation",
      "Capacity",
      "Utilization",
      "Temperature",
      "Humidity",
      "Inbound",
      "Outbound",
      "LastAudit",
    ];
    const rows = normalizedWarehouses.map((wh) => [
      wh.id,
      wh.name,
      wh.region,
      getStatusLabel(wh.status),
      automationLabels[wh.automation] || wh.automation,
      wh.capacity,
      `${wh.utilization}%`,
      `${wh.temperature}°C`,
      `${wh.humidity}%`,
      wh.inboundToday,
      wh.outboundToday,
      wh.lastAudit,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `warehouses-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{ backgroundColor: "var(--bg-color)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-6 shadow-lg border sm:p-8"
          style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}>
                <Warehouse className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                  {t("warehouse.management_title", { defaultValue: "Warehouse Management" })}
                </h1>
                <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                  {t("warehouse.subtitle", {
                    defaultValue: "Monitor utilization, environment and workflows across every facility",
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 h-11 rounded-lg font-medium transition-all"
                style={{ backgroundColor: "var(--border-color)", color: "var(--text-color)" }}
                onClick={() => queryClient.invalidateQueries({ queryKey: ["warehouses"] })}
                disabled={isFetching}
              >
                <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
                {isFetching
                  ? t("warehouse.loading", { defaultValue: "Loading warehouses..." })
                  : t("common.refresh", { defaultValue: "Refresh" })}
              </button>
              <button
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 h-11 rounded-lg font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
                onClick={openCreateModal}
              >
                <Plus size={18} />
                {t("warehouse.add_new", { defaultValue: "Add Warehouse" })}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title={t("warehouse.total_sites", { defaultValue: "Active Warehouses" })}
            value={stats.total}
            icon={<Layers3 size={24} className="text-blue-600" />}
            iconWrapper="bg-blue-50"
          />
          <SummaryCard
            title={t("warehouse.capacity", { defaultValue: "Total Capacity" })}
            value={`${stats.totalCapacity.toLocaleString()} m³`}
            icon={<Package size={24} className="text-purple-600" />}
            iconWrapper="bg-purple-50"
          />
          <SummaryCard
            title={t("warehouse.avg_utilization", { defaultValue: "Average Utilization" })}
            value={`${Math.round(stats.avgUtilization) || 0}%`}
            icon={<Activity size={24} className="text-emerald-600" />}
            iconWrapper="bg-emerald-50"
            progress={stats.avgUtilization}
          />
          <SummaryCard
            title={t("warehouse.pending_actions", { defaultValue: "Critical Alerts" })}
            value={stats.alertCount}
            subtitle={t("warehouse.maintenance_count", {
              defaultValue: "{{count}} sites flagged for maintenance",
              count: stats.maintenanceCount,
            })}
            icon={<AlertTriangle size={24} className="text-amber-600" />}
            iconWrapper="bg-amber-50"
          />
        </div>

        <div className="rounded-2xl p-6 shadow-lg border space-y-4" style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3" style={{ color: "var(--color-secondary)" }}>
              <Filter size={20} />
              <span className="font-semibold">
                {t("warehouse.filters", { defaultValue: "Smart Filters" })}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
              <div className="relative col-span-2 md:col-span-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: "var(--text-secondary)" }} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 ps-10 pe-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                  placeholder={t("warehouse.search_placeholder", {
                    defaultValue: "Search ID, name or region...",
                  })}
                />
              </div>
              <select
                className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">
                  {t("warehouse.status_all", { defaultValue: "Status" })}
                </option>
                <option value="operational">
                  {t("warehouse.status_operational", { defaultValue: "Operational" })}
                </option>
                <option value="maintenance">
                  {t("warehouse.status_maintenance", { defaultValue: "Maintenance" })}
                </option>
                <option value="offline">
                  {t("warehouse.status_offline", { defaultValue: "Offline" })}
                </option>
              </select>
              <select
                className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                <option value="all">{t("warehouse.region", { defaultValue: "Region" })}</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <select
                className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                value={automationFilter}
                onChange={(e) => setAutomationFilter(e.target.value)}
              >
                <option value="all">
                  {t("warehouse.automation", { defaultValue: "Automation" })}
                </option>
                <option value="high">{automationLabels.high}</option>
                <option value="medium">{automationLabels.medium}</option>
                <option value="low">{automationLabels.low}</option>
              </select>
              <select
                className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="utilization_desc">
                  {t("warehouse.sort_util_desc", { defaultValue: "Utilization (High first)" })}
                </option>
                <option value="utilization_asc">
                  {t("warehouse.sort_util_asc", { defaultValue: "Utilization (Low first)" })}
                </option>
                <option value="capacity_desc">
                  {t("warehouse.sort_capacity_desc", { defaultValue: "Capacity (High first)" })}
                </option>
                <option value="temperature_asc">
                  {t("warehouse.sort_temp", { defaultValue: "Lowest temperature" })}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RegionOverviewCard
            data={regionBreakdown}
            totalCapacity={stats.totalCapacity}
            t={t}
          />
          <InsightsPanel
            topUtilized={topUtilizedWarehouses}
            environmentRisks={environmentRisks}
            t={t}
          />
        </div>

        <div className="rounded-2xl p-6 shadow-lg border" style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between mb-4">
    <div>
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-color)" }}>
                {t("warehouse.overview", { defaultValue: "Operational Overview" })}
              </h2>
              <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                {t("warehouse.table_subtitle", {
                  defaultValue: "Live conditions, throughput and alert feed",
                })}
              </p>
            </div>
            <button
              className="px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:opacity-80"
              style={{ borderColor: "var(--border-color)", color: "var(--text-color)" }}
              onClick={handleExportCsv}
              disabled={!normalizedWarehouses.length}
            >
              <Download size={16} />
              {t("warehouse.export_csv", { defaultValue: "Export CSV" })}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wide" style={{ color: "var(--color-secondary)" }}>
                  <th className="pb-3">{t("warehouse.name", { defaultValue: "Warehouse" })}</th>
                  <th className="pb-3">{t("warehouse.region", { defaultValue: "Region" })}</th>
                  <th className="pb-3">{t("warehouse.utilization", { defaultValue: "Utilization" })}</th>
                  <th className="pb-3">{t("warehouse.capacity", { defaultValue: "Capacity" })}</th>
                  <th className="pb-3">{t("warehouse.conditions", { defaultValue: "Conditions" })}</th>
                  <th className="pb-3">{t("warehouse.throughput", { defaultValue: "Throughput" })}</th>
                  <th className="pb-3">{t("warehouse.status", { defaultValue: "Status" })}</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                {filteredWarehouses.map((wh) => (
                  <tr key={wh.id} className="text-sm" style={{ color: "var(--text-color)" }}>
                    <td className="py-4">
                      <p className="font-semibold">{wh.name}</p>
                      <p className="text-xs" style={{ color: "var(--color-secondary)" }}>
                        {t("warehouse.last_audit", { defaultValue: "Audit" })}: {wh.lastAudit}
                      </p>
                    </td>
                    <td className="py-4 flex items-center gap-2" style={{ color: "var(--color-secondary)" }}>
                      <MapPin size={14} />
                      {wh.region}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{wh.utilization}%</span>
                        <ProgressBar value={wh.utilization} />
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="font-semibold">{wh.capacity.toLocaleString()} m³</p>
                      <p className="text-xs" style={{ color: "var(--color-secondary)" }}>{automationLabels[wh.automation]}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1" style={{ color: "var(--color-secondary)" }}>
                          <ThermometerSun size={14} />
                          {wh.temperature}°C
                        </span>
                        <span className="flex items-center gap-1" style={{ color: "var(--color-secondary)" }}>
                          <Droplets size={14} />
                          {wh.humidity}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-xs" style={{ color: "var(--color-secondary)" }}>
                          {t("warehouse.inbound", { defaultValue: "Inbound" })}: <strong>{wh.inboundToday}</strong>
                        </span>
                        <span className="text-xs" style={{ color: "var(--color-secondary)" }}>
                          {t("warehouse.outbound", { defaultValue: "Outbound" })}: <strong>{wh.outboundToday}</strong>
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <StatusBadge status={wh.status} />
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="px-3 py-1 rounded-full border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-50 disabled:opacity-50"
                            onClick={() => handleQuickStatusChange(wh, "maintenance")}
                            disabled={
                              quickStatusMutation.isPending && statusUpdatingId === wh.id
                            }
                          >
                            {t("warehouse.set_maintenance", { defaultValue: "Set maintenance" })}
                          </button>
                          <button
                            className="px-3 py-1 rounded-full border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-50 disabled:opacity-50"
                            onClick={() => handleQuickStatusChange(wh, "operational")}
                            disabled={
                              quickStatusMutation.isPending && statusUpdatingId === wh.id
                            }
                          >
                            {t("warehouse.set_operational", { defaultValue: "Mark operational" })}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-1 rounded-full border border-[var(--border-color)] text-blue-700 text-xs font-medium hover:bg-blue-50 flex items-center gap-1"
                            onClick={() => navigate(`/dashboard/inventory/warehouse/${wh.id}`)}
                            title={t("warehouse.view_inventory", { defaultValue: "View Inventory" })}
                          >
                            <Package size={14} />
                            {t("warehouse.view_inventory", { defaultValue: "View" })}
                          </button>
                          <button
                            className="p-2 rounded-full border hover:opacity-80"
                            style={{ borderColor: "var(--border-color)", color: "var(--text-color)" }}
                            onClick={() => openEditModal(wh)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="p-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(wh)}
                            disabled={deleteWarehouse.isPending}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredWarehouses.length && (
              <div className="text-center py-16 text-sm" style={{ color: "var(--color-secondary)" }}>
                {isFetching
                  ? t("warehouse.loading", { defaultValue: "Loading warehouses..." })
                  : isError
                    ? t("warehouse.fetch_error", { defaultValue: "Unable to load warehouses." })
                    : t("warehouse.no_results", {
                        defaultValue: "No warehouses match your filters.",
                      })}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={closeModal} />
          <div className="relative rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--surface-color)" }}>
            <button
              type="button"
              className="absolute top-4 end-4 hover:opacity-70"
              style={{ color: "var(--color-secondary)" }}
              onClick={closeModal}
              aria-label={t("warehouse.cancel", { defaultValue: "Cancel" })}
            >
              <X size={20} />
            </button>
            <div className="mb-6">
              <h3 className="text-2xl font-semibold" style={{ color: "var(--text-color)" }}>
                {modalMode === "create"
                  ? t("warehouse.custom_form_title", { defaultValue: "Create warehouse" })
                  : t("warehouse.edit_title", { defaultValue: "Edit warehouse" })}
              </h3>
              <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                {t("warehouse.custom_form_description", {
                  defaultValue: "Define live data that will be stored on the server.",
                })}
              </p>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                  {t("warehouse.fields.name", { defaultValue: "Warehouse name" })}
                </label>
                <input
                  className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                  {t("warehouse.fields.region", { defaultValue: "Region" })}
                </label>
                <input
                  className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                  value={formData.region}
                  onChange={(e) => handleFormChange("region", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                    {t("warehouse.fields.street", { defaultValue: "Street" })}
                  </label>
                  <input
                    className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                    value={formData.address?.street}
                    onChange={(e) => handleAddressChange("street", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                    {t("warehouse.fields.city", { defaultValue: "City" })}
                  </label>
                  <input
                    className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                    value={formData.address?.city}
                    onChange={(e) => handleAddressChange("city", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                    {t("warehouse.fields.state", { defaultValue: "State/Region" })}
                  </label>
                  <input
                    className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                    value={formData.address?.state}
                    onChange={(e) => handleAddressChange("state", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                    {t("warehouse.fields.zip", { defaultValue: "ZIP / Postal Code" })}
                  </label>
                  <input
                    className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                    value={formData.address?.zipCode}
                    onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                    {t("warehouse.fields.country", { defaultValue: "Country" })}
                  </label>
                  <input
                    className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                    value={formData.address?.country}
                    onChange={(e) => handleAddressChange("country", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                    {t("warehouse.fields.contactName", { defaultValue: "Contact name" })}
                  </label>
                  <input
                    className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                    value={formData.address?.contactName}
                    onChange={(e) => handleAddressChange("contactName", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                  {t("warehouse.fields.contactPhone", { defaultValue: "Contact phone" })}
                </label>
                <input
                  className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                  value={formData.address?.contactPhone}
                  onChange={(e) => handleAddressChange("contactPhone", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                    {t("warehouse.fields.status", { defaultValue: "Status" })}
                  </label>
                  <select
                    className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                    value={formData.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                  >
                    <option value="operational">{t("warehouse.status_operational", { defaultValue: "Operational" })}</option>
                    <option value="maintenance">{t("warehouse.status_maintenance", { defaultValue: "Maintenance" })}</option>
                    <option value="offline">{t("warehouse.status_offline", { defaultValue: "Offline" })}</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                    {t("warehouse.fields.automation", { defaultValue: "Automation" })}
                  </label>
                  <select
                    className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                    value={formData.automation}
                    onChange={(e) => handleFormChange("automation", e.target.value)}
                  >
                    <option value="high">{automationLabels.high}</option>
                    <option value="medium">{automationLabels.medium}</option>
                    <option value="low">{automationLabels.low}</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput
                  label={t("warehouse.fields.capacity", { defaultValue: "Capacity (m³)" })}
                  value={formData.capacity}
                  onChange={(value) => handleFormChange("capacity", value)}
                />
                <NumberInput
                  label={t("warehouse.fields.utilization", { defaultValue: "Utilization (%)" })}
                  value={formData.utilization}
                  min={0}
                  max={100}
                  onChange={(value) => handleFormChange("utilization", value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput
                  label={t("warehouse.fields.temperature", { defaultValue: "Temperature (°C)" })}
                  value={formData.temperature}
                  onChange={(value) => handleFormChange("temperature", value)}
                />
                <NumberInput
                  label={t("warehouse.fields.humidity", { defaultValue: "Humidity (%)" })}
                  value={formData.humidity}
                  min={0}
                  max={100}
                  onChange={(value) => handleFormChange("humidity", value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberInput
                  label={t("warehouse.fields.inbound", { defaultValue: "Inbound today" })}
                  value={formData.inboundToday}
                  min={0}
                  onChange={(value) => handleFormChange("inboundToday", value)}
                />
                <NumberInput
                  label={t("warehouse.fields.outbound", { defaultValue: "Outbound today" })}
                  value={formData.outboundToday}
                  min={0}
                  onChange={(value) => handleFormChange("outboundToday", value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                  {t("warehouse.fields.lastAudit", { defaultValue: "Last audit" })}
                </label>
                <input
                  type="date"
                  className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
                  value={formData.lastAudit}
                  onChange={(e) => handleFormChange("lastAudit", e.target.value)}
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 h-11 rounded-lg font-medium hover:opacity-90"
                  style={{ backgroundColor: "var(--border-color)", color: "var(--text-color)" }}
                  onClick={closeModal}
                >
                  {t("warehouse.cancel", { defaultValue: "Cancel" })}
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 h-11 rounded-lg font-medium hover:opacity-90"
                  style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
                  disabled={createWarehouse.isPending || updateWarehouse.isPending}
                >
                  {modalMode === "create"
                    ? t("warehouse.create", { defaultValue: "Create" })
                    : t("warehouse.save", { defaultValue: "Save changes" })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ProgressBar = ({ value }) => (
  <div className="w-full h-2 rounded-full" style={{ backgroundColor: "var(--bg-secondary)" }}>
    <div
      className="h-2 rounded-full transition-all"
      style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        backgroundColor: value > 85 ? "#dc2626" : value > 70 ? "#f97316" : "#22c55e",
      }}
    />
  </div>
);

const SummaryCard = ({ title, value, subtitle, icon, iconWrapper, progress }) => (
  <div className="rounded-2xl p-6 shadow-lg border" style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{title}</p>
        <p className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>{value}</p>
        {subtitle && <p className="text-xs mt-1" style={{ color: "var(--color-secondary)" }}>{subtitle}</p>}
        {typeof progress === "number" && (
          <div className="mt-3">
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  backgroundColor: progress > 85 ? "#dc2626" : progress > 70 ? "#f97316" : "#22c55e",
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-2xl ${iconWrapper}`}>{icon}</div>
    </div>
  </div>
);

const NumberInput = ({ label, value, onChange, min, max }) => (
  <div className="grid gap-2">
    <label className="block text-sm font-semibold" style={{ color: "var(--text-color)" }}>{label}</label>
    <input
      type="number"
      min={min}
      max={max}
      className="w-full h-11 px-4 rounded-xl border focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const RegionOverviewCard = ({ data, totalCapacity, t }) => (
  <div className="rounded-2xl p-6 shadow-lg border" style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}>
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase font-semibold" style={{ color: "var(--color-secondary)" }}>
          {t("warehouse.region_overview", { defaultValue: "Regional capacity overview" })}
        </p>
        <h3 className="text-2xl font-semibold" style={{ color: "var(--text-color)" }}>
          {t("warehouse.region_capacity_label", { defaultValue: "Capacity" })}
        </h3>
      </div>
      <div className="text-end">
        <p className="text-xs" style={{ color: "var(--color-secondary)" }}>
          {t("warehouse.capacity", { defaultValue: "Total Capacity" })}
        </p>
        <p className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>{totalCapacity.toLocaleString()} m³</p>
      </div>
    </div>
    {data.length ? (
      <ul className="mt-6 space-y-4">
        {data.map((region) => (
          <li key={region.region} className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold" style={{ color: "var(--text-color)" }}>
              <span>{region.region}</span>
              <span>{region.capacity.toLocaleString()} m³</span>
            </div>
            <ProgressBar value={region.avgUtilization} />
            <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-secondary)" }}>
              <span>
                {t("warehouse.region_utilization_label", { defaultValue: "Avg utilization" })}:{" "}
                {Math.round(region.avgUtilization)}%
              </span>
              <span>
                {region.count} {t("warehouse.total_sites", { defaultValue: "Active Warehouses" })}
              </span>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState message={t("warehouse.no_region_data", { defaultValue: "No regional data yet." })} />
    )}
  </div>
);

const InsightsPanel = ({ topUtilized, environmentRisks, t }) => (
  <div className="rounded-2xl p-6 shadow-lg border" style={{ backgroundColor: "var(--surface-color)", borderColor: "var(--border-color)" }}>
    <h3 className="text-xl font-semibold mb-4" style={{ color: "var(--text-color)" }}>
      {t("warehouse.insights_title", { defaultValue: "Operational insights" })}
    </h3>
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
            {t("warehouse.top_performers", { defaultValue: "Top utilized" })}
          </h4>
        </div>
        {topUtilized.length ? (
          <ul className="space-y-3">
            {topUtilized.map((warehouse) => (
              <li key={`top-${warehouse.id}`} className="flex items-center justify-between text-sm" style={{ color: "var(--text-color)" }}>
                <div>
                  <p className="font-semibold" style={{ color: "var(--text-color)" }}>{warehouse.name}</p>
                  <p className="text-xs" style={{ color: "var(--color-secondary)" }}>{warehouse.region}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-600">{warehouse.utilization}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message={t("warehouse.no_top_data", { defaultValue: "No warehouses to highlight yet." })} />
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
            {t("warehouse.at_risk", { defaultValue: "Environmental risks" })}
          </h4>
        </div>
        {environmentRisks.length ? (
          <ul className="space-y-3">
            {environmentRisks.map((warehouse) => (
              <li key={`risk-${warehouse.id}`} className="text-sm" style={{ color: "var(--text-color)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-color)" }}>{warehouse.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-secondary)" }}>{warehouse.region}</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600">
                    {t("warehouse.status_" + warehouse.status, { defaultValue: warehouse.status })}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--color-secondary)" }}>{warehouse.reasons.join(" · ")}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message={t("warehouse.no_risk", { defaultValue: "No environmental risks detected." })} />
        )}
      </div>
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="py-6 text-center text-sm border border-dashed rounded-2xl" style={{ color: "var(--color-secondary)", borderColor: "var(--border-color)" }}>
    {message}
  </div>
);

export default WarehouseManagement;
