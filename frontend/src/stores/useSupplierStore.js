// src/stores/useSupplierStore.js
import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useSupplierStore = create((set) => ({
  suppliers: [],
  isLoading: false,
  error: null,

  // Fetch all suppliers
  fetchSuppliers: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.get("/suppliers");
      set({
        suppliers: response.data.data || [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },
  fetchSupplierById: async (supplierId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.get(`/suppliers/${supplierId}`);
      return response.data.data; // החזרת פרטי הספק
    } catch (error) {
      console.error(`Error fetching supplier with ID ${supplierId}:`, error);
      set({
        error: error?.response?.data?.message || error.message,
      });
      throw error; // זריקת השגיאה כדי לטפל בה בקומפוננטה
    } finally {
      set({ isLoading: false });
    }
  },

  // Example for creating a new supplier if needed
  createSupplier: async (supplierData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.post("/suppliers", supplierData);
      const newSupplier = response.data.data;
      // Add new supplier to the local suppliers array
      set((state) => ({
        suppliers: [...state.suppliers, newSupplier],
        isLoading: false,
      }));
      return { success: true, data: newSupplier };
    } catch (error) {
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
      return {
        success: false,
        message: error?.response?.data?.message || error.message,
      };
    }
  },

  // Example for updating a supplier
  updateSupplier: async (supplierId, updateData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.put(
        `/suppliers/${supplierId}`,
        updateData
      );
      const updatedSupplier = response.data.data;
      // Update the local array
      set((state) => ({
        suppliers: state.suppliers.map((sup) =>
          sup._id === updatedSupplier._id ? updatedSupplier : sup
        ),
        isLoading: false,
      }));
      return { success: true, data: updatedSupplier };
    } catch (error) {
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
      return {
        success: false,
        message: error?.response?.data?.message || error.message,
      };
    }
  },

  // Example for deleting a supplier
  deleteSupplier: async (supplierId) => {
    try {
      set({ isLoading: true, error: null });
      await axiosInstance.delete(`/suppliers/${supplierId}`);
      // Remove it from the local array
      set((state) => ({
        suppliers: state.suppliers.filter((s) => s._id !== supplierId),
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
      return {
        success: false,
        message: error?.response?.data?.message || error.message,
      };
    }
  },
}));
