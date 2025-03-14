import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useProductAdminStore } from "../../../stores/useProductAdminStore";
import { useSupplierStore } from "../../../stores/useSupplierStore";
import axiosInstance from "../../../lib/axios";
import ProductForm from "../components/ProductForm";
import { useTranslation } from "react-i18next";

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
    <div className="col-span-full mt-8 bg-bg p-6 rounded-xl border border-border-color shadow-sm animate-fadeIn">
      <h2 className="text-xl font-semibold text-text mb-4 tracking-tight">
        {t("product.bom.title")}
      </h2>
      <button
        type="button"
        onClick={handleAddComponent}
        className="mb-6 px-4 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200 transform hover:scale-105"
      >
        {t("product.bom.add_component")}
      </button>
      {bomComponents.map((component, index) => (
        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 bg-bg p-4 rounded-lg shadow-sm border border-border-color"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text">
              {t("product.bom.component")}
            </label>
            <select
              value={component.componentId}
              onChange={(e) =>
                handleComponentChange(index, "componentId", e.target.value)
              }
              className="mt-1 w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200 disabled:bg-accent disabled:opacity-50"
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
            <label className="block text-sm font-medium text-text">
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
              className="mt-1 w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text">
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
              className="mt-1 w-full p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-bg text-text transition-all duration-200"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => handleRemoveComponent(index)}
              className="px-4 py-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
            >
              {t("product.bom.remove")}
            </button>
          </div>
        </div>
      ))}
    </div>
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
    <div className="flex min-h-screen  animate-fade-in">
      <div className="container mx-auto max-w-4xl p-8 bg-bg rounded-2xl shadow-2xl border border-border-color transform transition-all duration-500 hover:shadow-3xl">
        <h1 className="text-3xl font-extrabold text-text mb-6 text-center tracking-tight drop-shadow-md">
          {t("product.add_new_product")}
        </h1>

        {suppliersError && (
          <div className="mb-6 text-red-500 text-center font-medium bg-bg p-4 rounded-lg shadow-sm border border-border-color">
            {t("product.errors.load_suppliers_failed")}: {suppliersError}
          </div>
        )}

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

        <div className="mt-6 text-center text-text font-medium bg-secondary p-4 rounded-lg shadow-sm border border-border-color">
          {t("product.fields.volume")}: {calculateVolume().toFixed(3)} m³
        </div>

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
