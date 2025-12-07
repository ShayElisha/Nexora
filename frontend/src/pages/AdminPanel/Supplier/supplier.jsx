import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Truck, 
  Mail, 
  Phone, 
  User, 
  Star, 
  Edit, 
  FileText, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus
} from "lucide-react"; 
const SupplierList = () => {
  const { t, i18n } = useTranslation();
  const direction = i18n.dir(); // "rtl" or "ltr"
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState("details");
  const [files, setFiles] = useState(null);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [attachmentsSupplier, setAttachmentsSupplier] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const suppliersPerPage = 12; // 12 suppliers per page

  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;

  const { mutate: fetchSuppliers, isLoading: suppliersLoading } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get("/suppliers");
      return response.data.data;
    },
    onSuccess: (data) => {
      setSuppliers(data);
      setError(null);
    },
    onError: (err) => {
      if (err.response && err.response.status === 404) {
        setSuppliers([]);
        setError(null);
      } else {
        toast.error(err.response?.data?.message || t("supplier.fetch_failed"));
        setError(err.message);
      }
    },
  });

  const { mutate: toggleSupplierStatus } = useMutation({
    mutationFn: async ({ supplierId, isActive }) => {
      const response = await axiosInstance.put(`/suppliers/${supplierId}`, {
        IsActive: isActive,
      });
      return response.data.data;
    },
    onSuccess: (updatedSupplier) => {
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier._id === updatedSupplier._id ? updatedSupplier : supplier
        )
      );
      toast.success(t("supplier.status_updated"));
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || t("supplier.status_update_failed")
      );
    },
  });

  const { mutate: updateSupplier } = useMutation({
    mutationFn: async ({ supplierId, formData }) => {
      const response = await axiosInstance.put(
        `/suppliers/${supplierId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data.data;
    },
    onSuccess: (updatedSupplier) => {
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier._id === updatedSupplier._id ? updatedSupplier : supplier
        )
      );
      setIsModalOpen(false);
      toast.success(t("supplier.updated_success"));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("supplier.update_failed"));
    },
  });

  useEffect(() => {
    if (authUser?.company) {
      fetchSuppliers();
    }
  }, [fetchSuppliers, authUser]);

  const handleToggle = (supplierId, currentStatus) => {
    toggleSupplierStatus({ supplierId, isActive: !currentStatus });
  };

  const openModal = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      SupplierName: supplier.SupplierName || "",
      Contact: supplier.Contact || "",
      Email: supplier.Email || "",
      Phone: supplier.Phone || "",
      Rating: supplier.Rating || "",
    });
    setFiles(null);
    setActiveTab("details");
    setIsModalOpen(true);
  };

  const openAttachmentsModal = (supplier) => {
    setAttachmentsSupplier(supplier);
    setIsAttachmentsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    if (selectedSupplier) {
      const formDataObj = new FormData();
      for (const key in formData) {
        formDataObj.append(key, formData[key]);
      }
      if (files) {
        for (let i = 0; i < files.length; i++) {
          formDataObj.append("attachments", files[i]);
        }
      }
      updateSupplier({
        supplierId: selectedSupplier._id,
        formData: formDataObj,
      });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  // Pagination logic
  const totalPages = Math.ceil(suppliers.length / suppliersPerPage);
  const indexOfLastSupplier = currentPage * suppliersPerPage;
  const indexOfFirstSupplier = indexOfLastSupplier - suppliersPerPage;
  const currentSuppliers = suppliers.slice(
    indexOfFirstSupplier,
    indexOfLastSupplier
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
                    className="min-w-[40px] px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                    style={
                      currentPage === i
                        ? {
                            background: "linear-gradient(to right, #6366f1, #a855f7)",
                            color: "var(--button-text)",
                          }
                        : {
                            backgroundColor: "var(--border-color)",
                            color: "var(--text-color)",
                          }
                    }
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
            className={`min-w-[40px] px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              currentPage === 1
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-105"
                : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
            }`}
          >
            1
          </button>
        );
        if (startPage > 2) {
          pageNumbers.push(
            <span key="start-dots" className="mx-1">
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
                    className="min-w-[40px] px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                    style={
                      currentPage === i
                        ? {
                            background: "linear-gradient(to right, #6366f1, #a855f7)",
                            color: "var(--button-text)",
                          }
                        : {
                            backgroundColor: "var(--border-color)",
                            color: "var(--text-color)",
                          }
                    }
          >
            {i}
          </button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(
            <span key="end-dots" className="px-2 text-gray-400 font-bold">
              ...
            </span>
          );
        }
        pageNumbers.push(
          <button
            key={totalPages}
            onClick={() => paginate(totalPages)}
            className={`min-w-[40px] px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              currentPage === totalPages
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-105"
                : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
            }`}
          >
            {totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  if (suppliersLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-bg">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-primary"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex justify-center items-center h-96 bg-bg">
        <p className="text-red-500 text-lg font-semibold">
          {t("supplier.not_authenticated")}
        </p>
      </div>
    );
  }

  // Calculate stats
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.IsActive).length;
  const inactiveSuppliers = suppliers.filter(s => !s.IsActive).length;
  const avgRating = suppliers.length > 0 
    ? (suppliers.reduce((sum, s) => sum + (parseFloat(s.Rating) || 0), 0) / suppliers.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }} dir={direction}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Truck size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("supplier.list_title")}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("supplier.list_title")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            className="mb-6 rounded-xl p-4 flex items-start gap-3 shadow-md border"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.3)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle className="flex-shrink-0 mt-0.5" size={24} style={{ color: "#ef4444" }} />
            <div>
              <h3 className="font-semibold mb-1" style={{ color: "#991b1b" }}>שגיאה</h3>
              <p style={{ color: "#dc2626" }}>{error}</p>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="rounded-2xl p-6 shadow-lg border transition-all hover:scale-105"
            style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-secondary)" }}>סה"כ ספקים</p>
                <p className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>{totalSuppliers}</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: "rgba(99, 102, 241, 0.1)" }}>
                <Truck style={{ color: "#6366f1" }} size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl p-6 shadow-lg border transition-all hover:scale-105"
            style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-secondary)" }}>ספקים פעילים</p>
                <p className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>{activeSuppliers}</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}>
                <CheckCircle style={{ color: "#22c55e" }} size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl p-6 shadow-lg border transition-all hover:scale-105"
            style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-secondary)" }}>ספקים לא פעילים</p>
                <p className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>{inactiveSuppliers}</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                <XCircle style={{ color: "#ef4444" }} size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl p-6 shadow-lg border transition-all hover:scale-105"
            style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-secondary)" }}>דירוג ממוצע</p>
                <p className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>{avgRating}</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: "rgba(234, 179, 8, 0.1)" }}>
                <Star style={{ color: "#eab308" }} size={24} />
              </div>
            </div>
          </motion.div>
        </div>
          {suppliers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentSuppliers.map((supplier) => (
                  <motion.div
                    key={supplier._id}
                    className="relative rounded-2xl p-6 shadow-lg border transition-all hover:scale-105"
                    style={{
                      backgroundColor: "var(--bg-color)",
                      borderColor: "var(--border-color)",
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                        style={
                          supplier.IsActive
                            ? { backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#16a34a" }
                            : { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#dc2626" }
                        }
                      >
                        {supplier.IsActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {supplier.IsActive ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </div>

                    {/* Attachments Button */}
                    <button
                      onClick={() => openAttachmentsModal(supplier)}
                      className="absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                      style={{
                        backgroundColor: "var(--border-color)",
                        color: "var(--text-color)",
                      }}
                      title={t("supplier.view_attachments")}
                    >
                      <FileText size={18} />
                    </button>

                    {/* Supplier Name */}
                    <div className="mt-8 mb-4">
                      <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                        <Truck style={{ color: "#6366f1" }} size={20} />
                        {supplier.SupplierName}
                      </h3>
                    </div>

                    {/* Supplier Details */}
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                        <User style={{ color: "var(--color-secondary)" }} size={16} />
                        <span className="text-sm">{supplier.Contact || t("supplier.not_available")}</span>
                      </div>
                      <div className="flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                        <Mail style={{ color: "var(--color-secondary)" }} size={16} />
                        <span className="text-sm truncate">{supplier.Email || t("supplier.not_available")}</span>
                      </div>
                      <div className="flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                        <Phone style={{ color: "var(--color-secondary)" }} size={16} />
                        <span className="text-sm">{supplier.Phone || t("supplier.not_available")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const displayRating = supplier.averageRating && supplier.averageRating > 0 
                              ? supplier.averageRating 
                              : 1;
                            return (
                              <Star
                                key={star}
                                size={14}
                                className={
                                  star <= displayRating
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }
                              />
                            );
                          })}
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                          {supplier.averageRating && supplier.averageRating > 0
                            ? `${supplier.averageRating.toFixed(1)}/5` 
                            : "1.0/5"}
                          {supplier.Rating && supplier.Rating.length > 0 && (
                            <span className="text-xs ml-1" style={{ color: "var(--color-secondary)" }}>
                              ({supplier.Rating.length})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="border-t-2 pt-4 mt-4 space-y-3" style={{ borderColor: "var(--border-color)" }}>
                      {/* Toggle Switch */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: "var(--text-color)" }}>סטטוס</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={supplier.IsActive}
                            onChange={() => handleToggle(supplier._id, supplier.IsActive)}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                        </label>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => openModal(supplier)}
                        className="w-full font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                        style={{
                          background: "linear-gradient(to right, #6366f1, #a855f7)",
                          color: "var(--button-text)",
                        }}
                      >
                        <Edit size={18} />
                        {t("supplier.update")}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-10 gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={
                      currentPage === 1
                        ? {
                            backgroundColor: "var(--border-color)",
                            color: "var(--color-secondary)",
                          }
                        : {
                            backgroundColor: "var(--bg-color)",
                            color: "var(--text-color)",
                            borderColor: "var(--border-color)",
                          }
                    }
                  >
                    {direction === "rtl" ? "→" : "←"}
                  </button>
                  {renderPageNumbers()}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-indigo-600 hover:text-white shadow-md hover:shadow-lg transform hover:scale-105"
                    }`}
                  >
                    {direction === "rtl" ? "←" : "→"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Truck className="text-gray-400" size={40} />
              </div>
              <p className="text-gray-600 text-lg font-medium">{t("supplier.no_suppliers")}</p>
            </div>
          )}

        {/* Supplier Update Modal */}
        {isModalOpen && selectedSupplier && (
          <div
            dir={direction}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn"
          >
            <div className="bg-bg rounded-2xl shadow-2xl p-6 w-full max-w-md border border-border-color">
              <h2 className="text-xl font-bold text-text mb-4 text-center tracking-tight drop-shadow-md">
                {t("supplier.update_supplier")} -{" "}
                {selectedSupplier.SupplierName}
              </h2>
              <div className="flex justify-center space-x-4 mb-6">
                <button
                  onClick={() => handleTabChange("details")}
                  className={`px-4 py-2 rounded-full shadow-md transition-all duration-200 ${
                    activeTab === "details"
                      ? "bg-button-bg text-button-text"
                      : "bg-accent text-text hover:bg-secondary hover:text-button-text"
                  }`}
                >
                  {t("supplier.details")}
                </button>
                <button
                  onClick={() => handleTabChange("files")}
                  className={`px-4 py-2 rounded-full shadow-md transition-all duration-200 ${
                    activeTab === "files"
                      ? "bg-button-bg text-button-text"
                      : "bg-accent text-text hover:bg-secondary hover:text-button-text"
                  }`}
                >
                  {t("supplier.attachments")}
                </button>
              </div>
              {activeTab === "details" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("supplier.name")}
                    </label>
                    <input
                      type="text"
                      name="SupplierName"
                      value={formData.SupplierName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("supplier.contact")}
                    </label>
                    <input
                      type="text"
                      name="Contact"
                      value={formData.Contact}
                      onChange={handleInputChange}
                      className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("supplier.email")}
                    </label>
                    <input
                      type="email"
                      name="Email"
                      value={formData.Email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("supplier.phone")}
                    </label>
                    <input
                      type="text"
                      name="Phone"
                      value={formData.Phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("supplier.rating")}
                    </label>
                    <input
                      type="text"
                      name="Rating"
                      value={formData.Rating}
                      onChange={handleInputChange}
                      className="mt-1 block w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
                    />
                  </div>
                  <div className="flex justify-end mt-6 space-x-2">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-full shadow-md hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
                    >
                      {t("supplier.cancel")}
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="px-4 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 transform hover:scale-105"
                    >
                      {t("supplier.save")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text">
                      {t("supplier.select_files")}
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="mt-1 block w-full p-2 border border-border-color rounded-lg text-sm text-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-button-text hover:file:bg-secondary transition-all duration-200"
                    />
                  </div>
                  <div className="flex justify-end mt-6 space-x-2">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-full shadow-md hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
                    >
                      {t("supplier.cancel")}
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="px-4 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 transform hover:scale-105"
                    >
                      {t("supplier.upload_files")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attachments Modal */}
        {isAttachmentsModalOpen && attachmentsSupplier && (
          <div
            dir={direction}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                {t("supplier.attachments")} - {attachmentsSupplier.SupplierName}
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {attachmentsSupplier.attachments && attachmentsSupplier.attachments.length > 0 ? (
                  attachmentsSupplier.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                    >
                      <a
                        href={file.fileUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2"
                      >
                        <FileText size={16} />
                        {file.fileName || `File ${index + 1}`}
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6">
                    {t("supplier.no_attachments")}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsAttachmentsModalOpen(false)}
                className="mt-6 w-full bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-xl hover:bg-gray-300 transition-all duration-200"
              >
                סגור
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierList;
