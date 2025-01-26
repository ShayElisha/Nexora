// src/stores/useEmployeeStore.js
import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useEmployeeStore = create((set) => ({
  employees: [],
  isLoading: false,
  error: null,

  fetchEmployees: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.get("/employees");
      // => GET http://localhost:5000/api/employees
      set({
        employees: response.data?.data || [],
        isLoading: false,
      });
      console.log("Employees:", response.data.data);
    } catch (error) {
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },
}));
