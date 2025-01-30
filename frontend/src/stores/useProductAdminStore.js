// src/stores/useProductAdminStore.js
import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useProductAdminStore = create((set) => ({
  products: [],
  isLoading: false,
  error: null,

  setProducts: (products) => set({ products }),

  createProduct: async (newProduct) => {
    if (
      !newProduct.companyId ||
      !newProduct.sku ||
      !newProduct.barcode ||
      !newProduct.productName ||
      !newProduct.unitPrice ||
      !newProduct.category
    ) {
      return {
        success: false,
        message: "Required fields are missing",
      };
    }

    try {
      set({ isLoading: true, error: null });

      const response = await axiosInstance.post("/product", newProduct);

      set((state) => ({
        products: [...state.products, response.data.data],
        isLoading: false,
      }));

      return {
        success: true,
        message: "Product created successfully",
        product: response.data.data,
      };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return {
        success: false,
        message: error?.response?.data?.message || error.message,
      };
    }
  },
}));
