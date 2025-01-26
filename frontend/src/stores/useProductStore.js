// src/stores/useProductStore.js
import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useProductStore = create((set) => ({
  productsBySupplier: [],
  isLoading: false,
  error: null,

  fetchProductsBySupplier: async (supplierId) => {
    console.log("Supplier ID:", supplierId);
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.get(
        `/inventory/products?supplierId=${supplierId}`
      );
      console.log("Products response:", response.data);

      const products = response.data?.data || [];
      set({ productsBySupplier: products, isLoading: false });

      return products; // הוספת החזרת הנתונים לשימוש בהמשך
    } catch (error) {
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
      console.error("Error fetching products by supplier:", error);
      return []; // במקרה של שגיאה, להחזיר מערך ריק
    }
  },
}));
