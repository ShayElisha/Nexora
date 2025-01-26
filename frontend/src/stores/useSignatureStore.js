// src/stores/useSignatureStore.js
import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useSignatureStore = create((set) => ({
  signatureLists: [],
  isLoading: false,
  error: null,

  fetchSignatureLists: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.get("/signatures");
      set({
        signatureLists: response.data.data || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },

  deleteSignatureList: async (id) => {
    try {
      set({ isLoading: true });
      await axiosInstance.delete(`/signatures/${id}`);
      set((state) => ({
        signatureLists: state.signatureLists.filter((s) => s._id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },

  createSignatureList: async ({ name, signers, employeeId }) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.post("/signatures/create", {
        name,
        signers,
        employeeId,
      });
      // Append new list
      set((state) => ({
        signatureLists: [...state.signatureLists, response.data.data],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },
}));
