import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "./lib/axios";
import "../src/components/layout/i18n.js"; // וודא שזה נמצא בתחילת הקובץ

import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import CreateCompanyPage from "./pages/auth/CreateCompanyPage";
import PricingPlans from "./pages/payment/PricingPlans";
import Success from "./pages/payment/Success";
import Fail from "./pages/payment/Fail";
import NexoraAdmin from "./pages/NexoraAdmin";
import SignUpPage from "./pages/auth/SignUpPage";
import LoginPage from "./pages/auth/LoginPage";
import Dashboard from "./pages/AdminPanel/Dashboard";
import EmployeeSignup from "./pages/AdminPanel/SignupEmployee/SignupEmployee";
import ProductList from "./pages/AdminPanel/Products/ProductList";
import AddProduct from "./pages/AdminPanel/Products/AddProduct";
import Supplier from "./pages/AdminPanel/Supplier/Supplier";
import AddSupplier from "./pages/AdminPanel/Supplier/AddSupplier";
import Finance from "./pages/AdminPanel/finance/Finance";
import AddFinance from "./pages/AdminPanel/Finance/AddFinance";
import Users from "./pages/AdminPanel/Users/Users";
import AddProcurment from "./pages/AdminPanel/Procurement/AddProcurment";
import Procurement from "./pages/AdminPanel/Procurement/Procurment";
import ReceiptPurchase from "./pages/AdminPanel/Procurement/ReceiptPurchase.jsx";
import HistorySignature from "./pages/AdminPanel/HistorySignature/HistorySignature";
import AllSignatures from "./pages/AdminPanel/HistorySignature/AllSignatures";
import UpdateForSupplier from "./pages/SupplierPage/updateForSupplier";
import Budgets from "./pages/AdminPanel/finance/Budgets";
import AddOrEditBudget from "./pages/AdminPanel/finance/AddOrEditBudget";
import BudgetDetails from "./pages/AdminPanel/finance/BudgetDetails";
import Products from "./pages/employeePages/manageProducts/Products";
import Events from "./pages/AdminPanel/events/Events.jsx";
import CreateTask from "./pages/AdminPanel/Tasks/CreateTask.jsx";
import Add_Department from "./pages/AdminPanel/departments/Add_Department.jsx";
import TasksList from "./pages/AdminPanel/Tasks/TasksList.jsx";

const App = () => {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        return res.data;
      } catch (error) {
        if (error.response?.status === 401) {
          return null;
        }
        toast.error(
          error.response?.data?.message ||
            "An error occurred. Please try again."
        );
      }
    },
  });

  // Protect Admin Routes
  const AdminRoute = ({ authUser }) => {
    return authUser?.user?.role === "Admin" ? <Outlet /> : <Navigate to="/" />;
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            authUser?.user?.role === "Admin" ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <HomePage />
            )
          }
        />
        <Route path="/create-company" element={<CreateCompanyPage />} />
        <Route
          path="/supplier/updateProcurement/:purchaseOrder"
          element={<UpdateForSupplier />}
        />

        <Route path="/pricing-plans" element={<PricingPlans />} />
        <Route path="/payment/completed" element={<Success />} />
        <Route path="/payment/cancelled" element={<Fail />} />
        <Route path="/nexora" element={<NexoraAdmin />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/products/manage" element={<Products />} />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />

        {/* Dashboard and Admin-only Routes */}
        <Route path="/dashboard" element={<AdminRoute authUser={authUser} />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductList />} />
          <Route path="Events" element={<Events />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="add-supplier" element={<AddSupplier />} />
          <Route path="supplier" element={<Supplier />} />
          <Route path="finance" element={<Finance />} />
          <Route path="finance/Budgets" element={<Budgets />} />
          <Route path="finance/add-budget" element={<AddOrEditBudget />} />
          <Route
            path="finance/budget-details/:id"
            element={<BudgetDetails />}
          />
          <Route path="add-finance-record" element={<AddFinance />} />
          <Route path="employees" element={<Users />} />
          <Route path="add-procurement-record" element={<AddProcurment />} />
          <Route path="signup" element={<EmployeeSignup />} />
          <Route path="procurement" element={<Procurement />} />
          <Route
            path="procurement/approveProcurment"
            element={<ReceiptPurchase />}
          />
          <Route path="historySignature" element={<HistorySignature />} />
          <Route path="historyAllSignature" element={<AllSignatures />} />
          <Route path="tasks/Add-Tasks" element={<CreateTask />} />
          <Route path="tasks" element={<TasksList />} />
          <Route
            path="department/Add-Department"
            element={<Add_Department />}
          />
        </Route>
      </Routes>
      <Toaster />
    </Layout>
  );
};

export default App;
