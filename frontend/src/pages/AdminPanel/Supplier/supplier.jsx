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
  // שדות לעדכון פרטי הספק (טקסט)
  const [formData, setFormData] = useState({});
  // מצב כרטיסיות במודל – "details" או "files"
  const [activeTab, setActiveTab] = useState("details");
  // state לקבצים
  const [files, setFiles] = useState(null);
  // state למודל של רשימת הקבצים
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [attachmentsSupplier, setAttachmentsSupplier] = useState(null);

  // שליפת משתמש מאומת
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;

  // שליפת ספקים
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

  // שינוי סטטוס פעילות ספק
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
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || t("supplier.status_update_failed")
      );
    },
  });

  // עדכון ספק – קריאה אחת שמשלבת נתונים וקבצים
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
    setActiveTab("details");
    setIsModalOpen(true);
  };

  // פתיחת מודל לקבצים נלווים
  const openAttachmentsModal = (supplier) => {
    setAttachmentsSupplier(supplier);
    setIsAttachmentsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // פונקציית עדכון שמשלבת נתונים וקבצים
  const handleUpdate = () => {
    if (selectedSupplier) {
      const formDataObj = new FormData();
      // הוספת שדות טקסטואליים ל־FormData
      for (const key in formData) {
        formDataObj.append(key, formData[key]);
      }
      // הוספת קבצים אם קיימים
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
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-primary"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-red-500">{t("supplier.not_authenticated")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div
        className="flex flex-col md:flex-row w-full min-h-screen bg-bg text-text"
        dir={direction}
      >
        <div className="flex-1 py-12 px-6">
          <h2 className="text-3xl font-bold text-primary mb-6 text-center">
            {t("supplier.list_title")}
          </h2>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {suppliers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <div
                  key={supplier._id}
                  className="relative bg-bg rounded-lg p-4 shadow-lg hover:scale-105 transition-transform duration-300 border border-border-color"
                >
                  {/* כפתור להצגת קבצים נלווים – המיקום תלוי בכיוון השפה */}
                  <button
                    onClick={() => openAttachmentsModal(supplier)}
                    className="absolute top-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                    style={
                      direction === "rtl" ? { left: "2px" } : { right: "2px" }
                    }
                    title={t("supplier.view_attachments")}
                  >
                    {/* ניתן להחליף באייקון SVG או ספריית אייקונים */}
                    📄
                  </button>
                  <h3 className="text-primary font-semibold mb-2">
                    {supplier.SupplierName}
                  </h3>
                  <p>
                    {t("supplier.contact")}:{" "}
                    {supplier.Contact || t("supplier.not_available")}
                  </p>
                  <p>
                    {t("supplier.email")}:{" "}
                    {supplier.Email || t("supplier.not_available")}
                  </p>
                  <p>
                    {t("supplier.phone")}:{" "}
                    {supplier.Phone || t("supplier.not_available")}
                  </p>
                  <p>
                    {t("supplier.rating")}:{" "}
                    {supplier.Rating || t("supplier.not_available")}
                  </p>
                  <div className="flex items-center mt-2">
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
                          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${
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
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300 w-full"
                  >
                    {t("supplier.update")}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">
              {t("supplier.no_suppliers")}
            </p>
          )}
        </div>

        {/* מודל לעדכון פרטי ספק */}
        {isModalOpen && selectedSupplier && (
          <div
            dir={direction}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                {t("supplier.update_supplier")} -{" "}
                {selectedSupplier.SupplierName}
              </h2>
              <div className="flex justify-center space-x-4 mb-4">
                <button
                  onClick={() => handleTabChange("details")}
                  className={`px-4 py-2 rounded ${
                    activeTab === "details"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {t("supplier.details")}
                </button>
                <button
                  onClick={() => handleTabChange("files")}
                  className={`px-4 py-2 rounded ${
                    activeTab === "files"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {t("supplier.attachments")}
                </button>
              </div>
              {activeTab === "details" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("supplier.name")}
                    </label>
                    <input
                      type="text"
                      name="SupplierName"
                      value={formData.SupplierName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("supplier.contact")}
                    </label>
                    <input
                      type="text"
                      name="Contact"
                      value={formData.Contact}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("supplier.email")}
                    </label>
                    <input
                      type="email"
                      name="Email"
                      value={formData.Email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("supplier.phone")}
                    </label>
                    <input
                      type="text"
                      name="Phone"
                      value={formData.Phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("supplier.rating")}
                    </label>
                    <input
                      type="text"
                      name="Rating"
                      value={formData.Rating}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div className="flex justify-end mt-6 space-x-2">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-300"
                    >
                      {t("supplier.cancel")}
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
                    >
                      {t("supplier.save")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("supplier.select_files")}
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="mt-1 block w-full"
                    />
                  </div>
                  <div className="flex justify-end mt-6 space-x-2">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-300"
                    >
                      {t("supplier.cancel")}
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <div
                className={`flex ${
                  direction === "rtl" ? "flex-row-reverse" : ""
                } justify-between items-center mb-4`}
              >
                <h2 className="text-xl font-bold text-gray-800">
                  {t("supplier.attachments_for")}{" "}
                  {attachmentsSupplier.SupplierName}
                </h2>
                <button
                  onClick={() => setIsAttachmentsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              <div className={direction === "rtl" ? "text-right" : "text-left"}>
                {attachmentsSupplier.attachments &&
                attachmentsSupplier.attachments.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {attachmentsSupplier.attachments.map((file, index) => (
                      <li key={index} className="mb-1">
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {file.fileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">
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
