import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../layouts/Sidebar";
import toast from "react-hot-toast";

import { useProductAdminStore } from "../../../stores/useProductAdminStore";
import { useSupplierStore } from "../../../stores/useSupplierStore";
import axiosInstance from "../../../lib/axios";
import ProductForm from "../components/ProductForm";

const AddProduct = () => {
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
    SKU: "",
    barcode: "",
    productName: "",
    productDescription: "",
    unitPrice: "",
    category: "",
    supplierId: "",
    supplierName: "",
    productImage: "", // Updated for file upload
  });

  console.log(formData);
  const [errors, setErrors] = useState({});

  // Fetch suppliers once on mount
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // React Query client for refreshing cache
  const queryClient = useQueryClient();

  // Mutation to create product and upload image
  const { mutate: createNewProduct } = useMutation({
    mutationFn: async (productData) => {
      const response = await axiosInstance.post("/product", productData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product added successfully");

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
        `Failed to create product: ${
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

    // Basic validations
    const newErrors = {};
    if (!formData.supplierId) newErrors.supplierId = "Supplier is required.";
    if (!formData.productName)
      newErrors.productName = "Product Name is required.";
    if (!formData.unitPrice) newErrors.unitPrice = "Unit Price is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // בניית payload לשליחה כ־JSON
    const payload = {
      companyId: formData.companyId,
      SKU: formData.SKU,
      barcode: formData.barcode,
      productName: formData.productName,
      productDescription: formData.productDescription,
      unitPrice: formData.unitPrice,
      category: formData.category,
      supplierId: formData.supplierId,
      supplierName:
        suppliers.find((s) => s._id === formData.supplierId)?.SupplierName ||
        "",
    };

    if (formData.productImage) {
      const reader = new FileReader();
      reader.readAsDataURL(formData.productImage);
      reader.onloadend = () => {
        payload.productImage = reader.result; // מחרוזת Base64
        createNewProduct(payload);
      };
      reader.onerror = () => {
        toast.error("Failed to read the image file.");
      };
    } else {
      createNewProduct(payload);
    }
  };

  // Keep companyId in sync with the user data
  useEffect(() => {
    if (authUser?.company) {
      setFormData((prev) => ({
        ...prev,
        companyId: authUser.company,
      }));
    }
  }, [authUser]);

  // Form fields
  const fieldDefinitions = [
    { name: "SKU", type: "text", label: "SKU" },
    { name: "barcode", type: "text", label: "Barcode" },
    { name: "productName", type: "text", label: "Product Name" },
    { name: "unitPrice", type: "number", label: "Unit Price" },
    { name: "category", type: "text", label: "Category" },
    {
      name: "productDescription",
      type: "textarea",
      label: "Product Description",
    },
    {
      name: "productImage",
      type: "file",
      label: "Product Image",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <div className="container mx-auto max-w-4xl p-8 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          Add New Product
        </h1>

        {/* Show supplier fetch errors if needed */}
        {suppliersError && (
          <div className="mb-4 text-red-500 text-center">
            Failed to load suppliers: {suppliersError}
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
      </div>
    </div>
  );
};

export default AddProduct;
