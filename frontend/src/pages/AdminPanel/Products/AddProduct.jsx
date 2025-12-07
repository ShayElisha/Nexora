import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useProductAdminStore } from "../../../stores/useProductAdminStore";
import { useSupplierStore } from "../../../stores/useSupplierStore";
import axiosInstance from "../../../lib/axios";
import ProductForm from "../components/ProductForm";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Package, 
  Plus, 
  Trash2, 
  Layers, 
  AlertCircle,
  CheckCircle,
  Box
} from "lucide-react";

// רכיב משנה ל-BOM
const BOMBuilder = ({
  bomComponents,
  setBomComponents,
  productsList,
  isLoadingProducts,
}) => {
  const { t } = useTranslation();

  const handleAddComponent = () => {
    setBomComponents((prev) => [
      ...prev,
      {
        quantity: 1,
        unitCost: 0,
      },
    ]);
  };

  const handleComponentChange = (index, field, value) => {
    setBomComponents((prev) =>
      prev.map((comp, i) => (i === index ? { ...comp, [field]: value } : comp))
    );
  };

  const handleRemoveComponent = (index) => {
    setBomComponents((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      className="col-span-full mt-8 p-6 rounded-2xl border shadow-lg"
      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(168, 85, 247, 0.1)" }}>
          <Layers style={{ color: "#a855f7" }} size={24} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
          {t("product.bom.title")}
        </h2>
      </div>
      <button
        type="button"
        onClick={handleAddComponent}
        className="mb-6 px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 font-medium"
        style={{
          background: "linear-gradient(to right, var(--color-primary), #a855f7)",
          color: "var(--button-text)",
        }}
      >
        <Plus size={20} />
        {t("product.bom.add_component")}
      </button>
      {bomComponents.map((component, index) => (
        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-5 rounded-xl shadow-md border transition-all duration-200"
          style={{
            backgroundColor: "var(--bg-color)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
              {t("product.bom.component")}
            </label>
            <select
              value={component.componentId}
              onChange={(e) =>
                handleComponentChange(index, "componentId", e.target.value)
              }
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
              disabled={isLoadingProducts}
            >
              <option value="">{t("product.bom.select_product")}</option>
              {productsList?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.productName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
              {t("product.bom.quantity")}
            </label>
            <input
              type="number"
              value={component.quantity}
              onChange={(e) =>
                handleComponentChange(
                  index,
                  "quantity",
                  parseFloat(e.target.value)
                )
              }
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-color)" }}>
              {t("product.bom.unit_cost")}
            </label>
            <input
              type="number"
              value={component.unitCost}
              onChange={(e) =>
                handleComponentChange(
                  index,
                  "unitCost",
                  parseFloat(e.target.value)
                )
              }
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => handleRemoveComponent(index)}
              className="w-full md:w-auto px-4 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 font-medium border"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
            >
              <Trash2 size={18} />
              {t("product.bom.remove")}
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

const AddProduct = () => {
  const { t } = useTranslation();
  const { createProduct, isLoading: productIsLoading } = useProductAdminStore();
  const {
    suppliers,
    isLoading: suppliersIsLoading,
    error: suppliersError,
    fetchSuppliers,
  } = useSupplierStore();
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });
  const authUser = authData?.user;

  const [formData, setFormData] = useState({
    companyId: authUser?.company,
    sku: "",
    barcode: "",
    productName: "",
    productDescription: "",
    unitPrice: "",
    category: "",
    supplierId: "",
    supplierName: "",
    productImage: "",
    attachments: [],
    length: "",
    width: "",
    height: "",
    productType: "purchase",
  });
  const [errors, setErrors] = useState({});
  const [bomComponents, setBomComponents] = useState([]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ["productsList"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product");
      return res.data;
    },
  });
  const productsList = productsData?.data || [];

  useEffect(() => {
    if (authUser?.company) {
      setFormData((prev) => ({
        ...prev,
        companyId: authUser.company,
      }));
    }
  }, [authUser]);

  const queryClient = useQueryClient();

  const { mutate: createNewProduct } = useMutation({
    mutationFn: async (payload) => {
      const response = await axiosInstance.post("/product", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries(["products"]);
      toast.success(t("product.success_message"));
      setFormData({
        companyId: authUser?.company,
        sku: "",
        barcode: "",
        productName: "",
        productDescription: "",
        unitPrice: "",
        category: "",
        supplierId: "",
        supplierName: "",
        productImage: "",
        attachments: [],
        length: "",
        width: "",
        height: "",
        productType: "purchase",
      });
      const product = data.data;
      const defaultInventory = {
        companyId: product.companyId,
        productId: product._id,
        quantity: 0,
        minStockLevel: 10,
        reorderQuantity: 20,
      };
      axiosInstance
        .post("/inventory", defaultInventory)
        .then(() => console.log("Default inventory created."))
        .catch((error) =>
          console.error("Error creating default inventory:", error)
        );
      if (formData.productType === "sale" && bomComponents.length > 0) {
        const bomPayload = {
          productId: product._id,
          components: bomComponents,
          notes: "",
        };
        try {
          const bomRes = await axiosInstance.post("/product-trees", bomPayload);
          toast.success(t("product.bom.creation_success"));
        } catch (err) {
          console.error("Error creating BOM:", err);
          toast.error(t("product.bom.creation_error"));
        }
      }
      setBomComponents([]);
    },
    onError: (error) => {
      toast.error(
        `${t("product.error_message")}: ${
          error.response?.data?.error || error.message
        }`
      );
    },
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      if (name === "attachments") {
        setFormData((prev) => ({ ...prev, [name]: Array.from(files) }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: files[0] }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (formData.productType !== "sale" && !formData.supplierId) {
      newErrors.supplierId = t("product.errors.supplier_required");
    }
    if (!formData.productName)
      newErrors.productName = t("product.errors.name_required");
    if (!formData.unitPrice)
      newErrors.unitPrice = t("product.errors.price_required");
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = new FormData();
    payload.append("companyId", formData.companyId);
    payload.append("sku", formData.sku);
    payload.append("barcode", formData.barcode);
    payload.append("productName", formData.productName);
    payload.append("productDescription", formData.productDescription);
    payload.append("unitPrice", formData.unitPrice);
    payload.append("category", formData.category);
    if (formData.supplierId) {
      payload.append("supplierId", formData.supplierId);
      payload.append(
        "supplierName",
        suppliers.find((s) => s._id === formData.supplierId)?.SupplierName || ""
      );
    }
    payload.append("length", formData.length);
    payload.append("width", formData.width);
    payload.append("height", formData.height);
    payload.append("productType", formData.productType);
    if (formData.productImage) {
      payload.append("productImage", formData.productImage);
    }
    if (formData.attachments && formData.attachments.length > 0) {
      formData.attachments.forEach((file) => {
        payload.append("attachments", file);
      });
    }
    createNewProduct(payload);
  };

  const calculateVolume = () => {
    const length = parseFloat(formData.length) || 0;
    const width = parseFloat(formData.width) || 0;
    const height = parseFloat(formData.height) || 0;
    return length * width * height;
  };

  const fieldDefinitions = [
    { name: "sku", type: "text", label: t("product.fields.sku") },
    { name: "barcode", type: "text", label: t("product.fields.barcode") },
    { name: "productName", type: "text", label: t("product.fields.name") },
    { name: "unitPrice", type: "number", label: t("product.fields.price") },
    { name: "category", type: "text", label: t("product.fields.category") },
    {
      name: "productDescription",
      type: "textarea",
      label: t("product.fields.description"),
    },
    { name: "productImage", type: "file", label: t("product.fields.image") },
    {
      name: "attachments",
      type: "file",
      label: t("product.fields.attachments"),
      multiple: true,
    },
    { name: "length", type: "number", label: t("product.fields.length") },
    { name: "width", type: "number", label: t("product.fields.width") },
    { name: "height", type: "number", label: t("product.fields.height") },
    {
      name: "productType",
      type: "select",
      label: t("product.fields.productType"),
      options: [
        { value: "purchase", label: "purchase" },
        { value: "sale", label: "sale" },
        { value: "both", label: "both" },
      ],
    },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Package size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("product.add_new_product")}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("product.add_new_product")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {suppliersError && (
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
              <h3 className="font-semibold mb-1" style={{ color: "#991b1b" }}>שגיאה בטעינת ספקים</h3>
              <p style={{ color: "#dc2626" }}>{suppliersError}</p>
            </div>
          </motion.div>
        )}

        {/* Main Form Card */}
        <motion.div
          className="rounded-2xl shadow-lg border p-6 sm:p-8"
          style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ProductForm
          fieldDefinitions={fieldDefinitions}
          formData={formData}
          errors={errors}
          isLoading={productIsLoading}
          suppliers={suppliers}
          suppliersIsLoading={suppliersIsLoading}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          isSale={formData.productType === "sale"}
        />

          <div
            className="mt-6 rounded-xl p-6 shadow-md border"
            style={{
              background: "linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-lg shadow-sm" style={{ backgroundColor: "var(--bg-color)" }}>
                <Box style={{ color: "var(--color-primary)" }} size={28} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-secondary)" }}>
                  {t("product.fields.volume")}
                </p>
                <p className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
                  {calculateVolume().toFixed(3)} m³
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {(formData.productType === "sale" ||
          formData.productType === "both") && (
          <BOMBuilder
            bomComponents={bomComponents}
            setBomComponents={setBomComponents}
            productsList={productsList}
            isLoadingProducts={isLoadingProducts}
          />
        )}
      </div>
    </div>
  );
};

export default AddProduct;
