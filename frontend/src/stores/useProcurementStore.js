// src/stores/useProcurementStore.js
import { create } from "zustand";
import axiosInstance from "../lib/axios";
import { toast } from "react-hot-toast";

const useProcurementStore = create((set) => ({
  procurements: [],
  loading: true,
  error: null,

  // שליפת רשימת הרכשים
  fetchProcurements: async () => {
    try {
      const response = await axiosInstance.get("/procurement", {
        withCredentials: true,
      });
      set({
        procurements: response.data.data || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to load procurements.",
        loading: false,
      });
    }
  },

  // עדכון רכש קיים
  updateProcurement: async (id, updatedData) => {
    try {
      const response = await axiosInstance.put(
        `/procurement/${id}`,
        updatedData
      );
      set((state) => ({
        procurements: state.procurements.map((procurement) =>
          procurement._id === id ? response.data.data : procurement
        ),
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update procurement" + error
      );
    }
  },

  // מחיקת רכש
  deleteProcurement: async (id) => {
    try {
      await axiosInstance.delete(`/procurement/${id}`);
      set((state) => ({
        procurements: state.procurements.filter(
          (procurement) => procurement._id !== id
        ),
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete procurement"
      );
    }
  },
}));

export default useProcurementStore;
