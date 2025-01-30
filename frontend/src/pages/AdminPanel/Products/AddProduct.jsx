import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../layouts/Sidebar";
import toast from "react-hot-toast";
import { useProductAdminStore } from "../../../stores/useProductAdminStore";
import { useSupplierStore } from "../../../stores/useSupplierStore";
import axiosInstance from "../../../lib/axios";
import ProductForm from "../components/ProductForm";
import { useTranslation } from "react-i18next";

const AddProduct = () => {
  const { t } = useTranslation();

  // Zustand for products
  const { createProduct, isLoading: productIsLoading } = useProductAdminStore();

  // Zustand for suppliers
  const {
    suppliers,
    isLoading: suppliersIsLoading,
    error: suppliersError,
    fetchSuppliers,
  } = useSupplierStore();

  // React Query for user auth
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });
  const authUser = authData?.user;

  // Local form state for product
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
    length: "",
    width: "",
    height: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const queryClient = useQueryClient();

  const { mutate: createNewProduct } = useMutation({
    mutationFn: async (productData) => {
      const response = await axiosInstance.post("/product", productData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["products"]);
      toast.success(t("product.success_message"));

      // איפוס הטופס
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
        length: "",
        width: "",
        height: "",
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
        .then(() => {
          console.log("Default inventory created.");
        })
        .catch((error) => {
          console.error("Error creating default inventory:", error);
        });
    },
    onError: (error) => {
      toast.error(
        `${t("product.error_message")}: ${
          error.response?.data?.error || error.message
        }`
      );
    },
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.supplierId)
      newErrors.supplierId = t("product.errors.supplier_required");
    if (!formData.productName)
      newErrors.productName = t("product.errors.name_required");
    if (!formData.unitPrice)
      newErrors.unitPrice = t("product.errors.price_required");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      companyId: formData.companyId,
      sku: formData.sku,
      barcode: formData.barcode,
      productName: formData.productName,
      productDescription: formData.productDescription,
      unitPrice: formData.unitPrice,
      category: formData.category,
      supplierId: formData.supplierId,
      supplierName:
        suppliers.find((s) => s._id === formData.supplierId)?.SupplierName ||
        "",
      length: formData.length,
      width: formData.width,
      height: formData.height,
    };

    console.log("payload: " + JSON.stringify(payload, null, 2));
    if (formData.productImage) {
      const reader = new FileReader();
      reader.readAsDataURL(formData.productImage);
      reader.onloadend = () => {
        payload.productImage = reader.result;
        createNewProduct(payload);
      };
      reader.onerror = () => {
        toast.error(t("product.errors.image_upload_failed"));
      };
    } else {
      createNewProduct(payload);
    }
  };

  useEffect(() => {
    if (authUser?.company) {
      setFormData((prev) => ({
        ...prev,
        companyId: authUser.company,
      }));
    }
  }, [authUser]);

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
    {
      name: "productImage",
      type: "file",
      label: t("product.fields.image"),
    },
    { name: "length", type: "number", label: t("product.fields.length") }, // Added field
    { name: "width", type: "number", label: t("product.fields.width") }, // Added field
    { name: "height", type: "number", label: t("product.fields.height") }, // Added field
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <div className="container mx-auto max-w-4xl p-8 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          {t("product.add_new_product")}
        </h1>

        {suppliersError && (
          <div className="mb-4 text-red-500 text-center">
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
        />

        <div className="mt-6 text-center text-blue-300">
          {t("product.fields.volume")}: {calculateVolume().toFixed(3)} m³
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
