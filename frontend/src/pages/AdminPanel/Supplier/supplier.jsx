import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const SupplierList = () => {
  const { t, i18n } = useTranslation();
  const direction = i18n.dir(); // "rtl" או "ltr"
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState("details");
  const [files, setFiles] = useState(null);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [attachmentsSupplier, setAttachmentsSupplier] = useState(null);

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
    setFiles(null); // איפוס קבצים בעת פתיחת המודל
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div
        className="flex flex-col md:flex-row w-full min-h-screen  text-text animate-fade-in"
        dir={direction}
      >
        <div className="flex-1 py-12 px-6">
          <h2 className="text-3xl font-extrabold text-text mb-6 text-center tracking-tight drop-shadow-md">
            {t("supplier.list_title")}
          </h2>
          {error && (
            <p className="text-red-500 text-center mb-6 font-medium bg-accent p-4 rounded-lg shadow-sm border border-border-color">
              {error}
            </p>
          )}
          {suppliers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <div
                  key={supplier._id}
                  className="relative bg-bg rounded-xl p-6 shadow-lg hover:scale-105 hover:shadow-neutral-800 hover:shadow-2xl transition-transform duration-300 border border-border-color"
                >
                  <button
                    onClick={() => openAttachmentsModal(supplier)}
                    className="absolute top-2 p-2 bg-bg rounded-full shadow-md hover:bg-secondary hover:text-button-text transition-all duration-200 transform hover:scale-110"
                    style={
                      direction === "rtl" ? { left: "8px" } : { right: "8px" }
                    }
                    title={t("supplier.view_attachments")}
                  >
                    📄
                  </button>
                  <h3 className="text-primary font-semibold text-lg mb-3 tracking-tight">
                    {supplier.SupplierName}
                  </h3>
                  <p className="text-text text-sm">
                    {t("supplier.contact")}:{" "}
                    {supplier.Contact || t("supplier.not_available")}
                  </p>
                  <p className="text-text text-sm">
                    {t("supplier.email")}:{" "}
                    {supplier.Email || t("supplier.not_available")}
                  </p>
                  <p className="text-text text-sm">
                    {t("supplier.phone")}:{" "}
                    {supplier.Phone || t("supplier.not_available")}
                  </p>
                  <p className="text-text text-sm">
                    {t("supplier.rating")}:{" "}
                    {supplier.Rating || t("supplier.not_available")}
                  </p>
                  <div className="flex items-center mt-4">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={supplier.IsActive}
                          onChange={() =>
                            handleToggle(supplier._id, supplier.IsActive)
                          }
                          className="sr-only"
                        />
                        <div
                          className={`block w-10 h-6 rounded-full transition-colors duration-300 ${
                            supplier.IsActive ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        <div
                          className={`absolute left-1 top-1 bg-button-text w-4 h-4 rounded-full transition-transform duration-300 ${
                            supplier.IsActive ? "translate-x-4" : ""
                          }`}
                        ></div>
                      </div>
                      <span
                        className={`ml-2 text-sm font-semibold ${
                          supplier.IsActive ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {supplier.IsActive
                          ? t("supplier.active")
                          : t("supplier.inactive")}
                      </span>
                    </label>
                  </div>
                  <button
                    onClick={() => openModal(supplier)}
                    className="mt-4 px-4 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 transform hover:scale-105 w-full"
                  >
                    {t("supplier.update")}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text opacity-70 text-lg mt-6">
              {t("supplier.no_suppliers")}
            </p>
          )}
        </div>

        {/* מודל לעדכון פרטי ספק */}
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

        {/* מודל להצגת קבצים נלווים */}
        {isAttachmentsModalOpen && attachmentsSupplier && (
          <div
            dir={direction}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn"
          >
            <div className="bg-bg rounded-2xl shadow-2xl p-6 w-full max-w-md border border-border-color">
              <div
                className={`flex ${
                  direction === "rtl" ? "flex-row-reverse" : ""
                } justify-between items-center mb-4`}
              >
                <h2 className="text-xl font-bold text-text tracking-tight">
                  {t("supplier.attachments_for")}{" "}
                  {attachmentsSupplier.SupplierName}
                </h2>
                <button
                  onClick={() => setIsAttachmentsModalOpen(false)}
                  className="text-text hover:text-gray-800 text-xl transition-all duration-200 transform hover:scale-110"
                >
                  ×
                </button>
              </div>
              <div className={direction === "rtl" ? "text-right" : "text-left"}>
                {attachmentsSupplier.attachments &&
                attachmentsSupplier.attachments.length > 0 ? (
                  <ul className="space-y-2">
                    {attachmentsSupplier.attachments.map((file, index) => (
                      <li
                        key={index}
                        className="bg-accent p-3 rounded-lg shadow-sm border border-border-color hover:bg-primary hover:text-button-text transition-all duration-200"
                      >
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          {file.fileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-text text-center text-lg opacity-70">
                    {t("supplier.no_attachments")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierList;
