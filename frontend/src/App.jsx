import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "./lib/axios";
import "../src/components/layout/i18n.js"; // Ensure i18n is initialized

import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import CreateCompanyPage from "./pages/auth/CreateCompanyPage";
import PricingPlans from "./pages/payment/PricingPlans";
import Success from "./pages/payment/Success";
import Fail from "./pages/payment/Fail";
import NexoraAdmin from "./pages/NexoraAdmin";
import SignUpPage from "./pages/auth/SignUpPage";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import Dashboard from "./pages/AdminPanel/Dashboard";
import EmployeeSignup from "./pages/AdminPanel/SignupEmployee/SignupEmployee";
import ProductList from "./pages/AdminPanel/Products/ProductList";
import AddProduct from "./pages/AdminPanel/Products/AddProduct";
import InventoryManagement from "./pages/AdminPanel/Inventory/InventoryManagement";
import WarehouseManagement from "./pages/AdminPanel/Inventory/WarehouseManagement.jsx";
import WarehouseInventoryView from "./pages/AdminPanel/Inventory/WarehouseInventoryView.jsx";
import InventoryTransfer from "./pages/AdminPanel/Inventory/InventoryTransfer.jsx";
import Supplier from "./pages/AdminPanel/Supplier/Supplier";
import AddSupplier from "./pages/AdminPanel/Supplier/AddSupplier";
import Finance from "./pages/AdminPanel/finance/Finance";
import CashFlow from "./pages/AdminPanel/finance/CashFlow";
import AddFinance from "./pages/AdminPanel/Finance/AddFinance";
import Users from "./pages/AdminPanel/Users/Users";
import EmployeeDirectory from "./pages/AdminPanel/employees/EmployeeDirectory";
import EmployeeDetails from "./pages/AdminPanel/employees/EmployeeDetails";
import AddProcurment from "./pages/AdminPanel/procurement/AddProcurment";
import Procurement from "./pages/AdminPanel/procurement/Procurment";
import ReceiptPurchase from "./pages/AdminPanel/procurement/ReceiptPurchase.jsx";
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
import DepartmentList from "./pages/AdminPanel/departments/DepartmentList.jsx";
import TasksList from "./pages/AdminPanel/Tasks/TasksList.jsx";
import SupportTicketsList from "./pages/AdminPanel/SupportTickets/SupportTicketsList.jsx";
import CreateSupportTicket from "./pages/AdminPanel/SupportTickets/CreateSupportTicket.jsx";
import SupportTicketDetails from "./pages/AdminPanel/SupportTickets/SupportTicketDetails.jsx";
import InvoicesList from "./pages/AdminPanel/Invoices/InvoicesList.jsx";
import CreateInvoice from "./pages/AdminPanel/Invoices/CreateInvoice.jsx";
import InvoiceDetails from "./pages/AdminPanel/Invoices/InvoiceDetails.jsx";
import EmployeeDashboard from "./pages/employeePages/EmployeeDashboard.jsx";
import AddProject from "./pages/AdminPanel/projects/AddProjact.jsx";
import ProjectsList from "./pages/AdminPanel/projects/projectsList.jsx";
import ProjectGanttChart from "./pages/AdminPanel/projects/ProjectGanttChart.jsx";
import ProjectTimeline from "./pages/AdminPanel/projects/ProjectTimeline.jsx";
import ProjectResourcesAllocation from "./pages/AdminPanel/projects/ProjectResourcesAllocation.jsx";
import ProjectPortfolio from "./pages/AdminPanel/projects/ProjectPortfolio.jsx";
import ResourceCapacityPlanning from "./pages/AdminPanel/projects/ResourceCapacityPlanning.jsx";
import ProjectTemplates from "./pages/AdminPanel/projects/ProjectTemplates.jsx";
import ProjectRiskManagement from "./pages/AdminPanel/projects/ProjectRiskManagement.jsx";
import AddCustomers from "./pages/AdminPanel/customers/AddCusomers.jsx";
import CustomersList from "./pages/AdminPanel/customers/CusomersList.jsx";
import AddOrders from "./pages/AdminPanel/customers/AddOrders.jsx";
import OrdersList from "./pages/AdminPanel/customers/OrdersList.jsx";
import Customer360 from "./pages/AdminPanel/customers/Customer360.jsx";
import CustomerSegmentation from "./pages/AdminPanel/customers/CustomerSegmentation.jsx";
import CustomerSatisfaction from "./pages/AdminPanel/customers/CustomerSatisfaction.jsx";
import CustomerRetention from "./pages/AdminPanel/customers/CustomerRetention.jsx";
import LeadsManagement from "./pages/AdminPanel/leads/LeadsManagement.jsx";
import Activities from "./pages/AdminPanel/leads/Activities.jsx";
import LeadsAnalytics from "./pages/AdminPanel/leads/LeadsAnalytics.jsx";
import NotificationsManagement from "./pages/AdminPanel/Notifications/NotificationsManagement.jsx";
import OrderManagement from "./pages/AdminPanel/orders/OrderManagement.jsx";
import DeliveryTracking from "./pages/AdminPanel/orders/DeliveryTracking.jsx";
import OrdersPreparation from "./pages/AdminPanel/orders/OrdersPreparation.jsx";
import TrackingDetails from "./pages/AdminPanel/orders/TrackingDetails.jsx";
import TrackDelivery from "./pages/TrackDelivery.jsx";
import PrivacyPolicy from "./pages/private.jsx";
import Services from "./pages/Services.jsx";
import Contact from "./pages/Contact.jsx";
import Features from "./pages/Features.jsx";
import Security from "./pages/Security.jsx";
import Integrations from "./pages/Integrations.jsx";
import About from "./pages/About.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import Cookies from "./pages/Cookies.jsx";
import Blog from "./pages/Blog.jsx";
import Careers from "./pages/Careers.jsx";
import Help from "./pages/Help.jsx";
import API from "./pages/API.jsx";
import Customers from "./pages/Customers.jsx";
import Partners from "./pages/Partners.jsx";
import Docs from "./pages/Docs.jsx";
import Status from "./pages/Status.jsx";
import Report from "./pages/Report.jsx";
import FinanceList from "./pages/employeePages/financePages/financeList.jsx";
import FinanceAdd from "./pages/employeePages/financePages/AddFinance.jsx";
import ProcurementProposals from "./pages/employeePages/manageProducts/ProcurementProposals.jsx";
import ProcurementProposalsList from "./pages/AdminPanel/procurement/ProcurementProposals.jsx";
import AddPerformanceReview from "./pages/AdminPanel/performanceReview/AddPerformanceReview.jsx";
import PerformanceReview from "./pages/AdminPanel/performanceReview/PerformanceReview.jsx";
import JobPercentages from "./pages/AdminPanel/shifts/JobPercentages.jsx";
import ShiftsList from "./pages/AdminPanel/shifts/ShiftsList.jsx";
import MyShifts from "./pages/AdminPanel/shifts/MyShifts.jsx";
import Salary from "./pages/AdminPanel/Salary/Salary.jsx";
import SalaryManagement from "./pages/AdminPanel/Salary/SalaryManagement.jsx";
import TaxConfig from "./pages/AdminPanel/Salary/TaxConfig.jsx";
import GlobalVacationCalculator from "./pages/AdminPanel/Salary/GlobalVacationCalculator.jsx";
import SickDays from "./pages/AdminPanel/Salary/sickDays.jsx";
import AddSickDay from "./pages/AdminPanel/Salary/AddSickDay.jsx";
import UseSickDay from "./pages/AdminPanel/Salary/UseSickDay.jsx";
import UseVacationDay from "./pages/AdminPanel/Salary/UseVocationDay.jsx";
import PayrollAutomation from "./pages/AdminPanel/payroll/PayrollAutomation.jsx";
import RolesManagement from "./pages/AdminPanel/roles/RolesManagement.jsx";
import ProductionOrdersList from "./pages/AdminPanel/production/ProductionOrdersList.jsx";
import CreateProductionOrder from "./pages/AdminPanel/production/CreateProductionOrder.jsx";
import ProductionOrderDetails from "./pages/AdminPanel/production/ProductionOrderDetails.jsx";
import AssetList from "./pages/AdminPanel/Assets/AssetList.jsx";
import AddAsset from "./pages/AdminPanel/Assets/AddAsset.jsx";
import AssetDetails from "./pages/AdminPanel/Assets/AssetDetails.jsx";
import AccountList from "./pages/AdminPanel/Accounting/AccountList.jsx";
import AddAccount from "./pages/AdminPanel/Accounting/AddAccount.jsx";
import FinancialReports from "./pages/AdminPanel/Accounting/FinancialReports.jsx";
import BankAccountList from "./pages/AdminPanel/Banks/BankAccountList.jsx";
import SalesOpportunitiesList from "./pages/AdminPanel/Sales/SalesOpportunitiesList.jsx";
import ContractsList from "./pages/AdminPanel/Contracts/ContractsList.jsx";
import StockCountsList from "./pages/AdminPanel/Inventory/StockCountsList.jsx";
import PurchaseRequestsList from "./pages/AdminPanel/Procurement/PurchaseRequestsList.jsx";
import TendersList from "./pages/AdminPanel/Procurement/TendersList.jsx";
import SupplierContractsList from "./pages/AdminPanel/Procurement/SupplierContractsList.jsx";
import ServiceTicketsList from "./pages/AdminPanel/CustomerService/ServiceTicketsList.jsx";
import InventoryMovementsList from "./pages/AdminPanel/Inventory/InventoryMovementsList.jsx";
import InventoryQualityList from "./pages/AdminPanel/Inventory/InventoryQualityList.jsx";
import PriceListsList from "./pages/AdminPanel/Procurement/PriceListsList.jsx";
import SupplierInvoicesList from "./pages/AdminPanel/Procurement/SupplierInvoicesList.jsx";
import SupplySchedulesList from "./pages/AdminPanel/Procurement/SupplySchedulesList.jsx";
import AddBankAccount from "./pages/AdminPanel/Banks/AddBankAccount.jsx";
import BankTransactionsList from "./pages/AdminPanel/Banks/BankTransactionsList.jsx";
import AddSalesOpportunity from "./pages/AdminPanel/Sales/AddSalesOpportunity.jsx";
import SalesPipeline from "./pages/AdminPanel/Sales/SalesPipeline.jsx";
import AddStockCount from "./pages/AdminPanel/Inventory/AddStockCount.jsx";
import AddPurchaseRequest from "./pages/AdminPanel/Procurement/AddPurchaseRequest.jsx";
import AddContract from "./pages/AdminPanel/Contracts/AddContract.jsx";
import AddServiceTicket from "./pages/AdminPanel/CustomerService/AddServiceTicket.jsx";
import AddInventoryMovement from "./pages/AdminPanel/Inventory/AddInventoryMovement.jsx";
import AddInventoryQuality from "./pages/AdminPanel/Inventory/AddInventoryQuality.jsx";
import AddTender from "./pages/AdminPanel/Procurement/AddTender.jsx";
import AddSupplierContract from "./pages/AdminPanel/Procurement/AddSupplierContract.jsx";
import AddPriceList from "./pages/AdminPanel/Procurement/AddPriceList.jsx";
import AddSupplierInvoice from "./pages/AdminPanel/Procurement/AddSupplierInvoice.jsx";
import AddSupplySchedule from "./pages/AdminPanel/Procurement/AddSupplySchedule.jsx";
// HR Module Imports
import JobPostingsList from "./pages/AdminPanel/HR/ATS/JobPostingsList.jsx";
import CreateJobPosting from "./pages/AdminPanel/HR/ATS/CreateJobPosting.jsx";
import ApplicantsList from "./pages/AdminPanel/HR/ATS/ApplicantsList.jsx";
import CoursesList from "./pages/AdminPanel/HR/LMS/CoursesList.jsx";
import CreateCourse from "./pages/AdminPanel/HR/LMS/CreateCourse.jsx";
import AttendanceManagement from "./pages/AdminPanel/HR/Attendance/AttendanceManagement.jsx";
import LeaveRequestsList from "./pages/AdminPanel/HR/Leave/LeaveRequestsList.jsx";
import CreateLeaveRequest from "./pages/AdminPanel/HR/Leave/CreateLeaveRequest.jsx";
import HRAnalyticsDashboard from "./pages/AdminPanel/HR/Analytics/HRAnalyticsDashboard.jsx";
import EmployeeSelfService from "./pages/employeePages/EmployeeSelfService.jsx";


const App = () => {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        return res.data || null;
      } catch (error) {
        if (error.response?.status === 401 || error.code === 'ERR_CONNECTION_REFUSED' || error.message?.includes('Network Error')) {
          return null; // Return null instead of undefined
        }
        toast.error(
          error.response?.data?.message ||
            "An error occurred. Please try again."
        );
        return null; // Always return a value, never undefined
      }
    },
    retry: false, // Don't retry on connection errors
    refetchOnWindowFocus: false, // Don't refetch when window gains focus if server is down
  });

  const AdminRoute = ({ authUser }) => {
    if (!authUser?.user) {
      return <Navigate to="/login" replace />;
    }

    // Only Admin can access /dashboard route
    // Manager and Employee should use /employee route
    if (authUser.user.role === "Admin") {
      return <Outlet />;
    }

    // Manager and Employee are redirected to /employee
    if (authUser.user.role === "Manager" || authUser.user.role === "Employee") {
      return <Navigate to="/employee" replace />;
    }

    // If not Admin/Manager/Employee, redirect to home
    return <Navigate to="/" replace />;
  };

  const EmployeeRoute = ({ authUser }) => {
    if (!authUser?.user) {
      return <Navigate to="/login" replace />;
    }

    // Check if user is Manager or Employee
    if (authUser.user.role !== "Employee" && authUser.user.role !== "Manager") {
      return <Navigate to="/" replace />;
    }

    // Allow access for Manager and Employee
    return <Outlet />;
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              authUser?.user?.role === "Admin" ? (
                <Navigate to="/dashboard" replace />
              ) : authUser?.user?.role === "Employee" ||
                authUser?.user?.role === "Manager" ? (
                <Navigate to="/employee" replace />
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
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/features" element={<Features />} />
          <Route path="/security" element={<Security />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/api" element={<API />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/help" element={<Help />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/status" element={<Status />} />
          <Route path="/report" element={<Report />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/payment/completed" element={<Success />} />
          <Route path="/payment/cancelled" element={<Fail />} />
          <Route path="/nexora1" element={<NexoraAdmin />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/track/:trackingNumber" element={<TrackDelivery />} />
          <Route path="/track" element={<TrackDelivery />} />

          <Route

            path="/employee"
            element={<EmployeeRoute authUser={authUser} />}
          >
            <Route index element={<EmployeeDashboard />} />
            <Route path="finance" element={<FinanceList />} />
            <Route path="AddFinance" element={<FinanceAdd />} />
            <Route
              path="ProcurementProposals"
              element={<ProcurementProposals />}
            />
            <Route
              path="ProcurementProposalsList"
              element={<ProcurementProposalsList />}
            />
            <Route path="products" element={<Products />} />
            {/* Routes for Manager/Employee based on permissions - dynamically accessible */}
            <Route path="employees/:id" element={<Users />} />
            <Route path="employees" element={<Users />} />
            <Route path="signup" element={<EmployeeSignup />} />
            <Route path="projects/gantt" element={<ProjectGanttChart />} />
            <Route path="projects/timeline" element={<ProjectTimeline />} />
            <Route path="projects/resources" element={<ProjectResourcesAllocation />} />
            <Route path="projects/portfolio" element={<ProjectPortfolio />} />
            <Route path="projects/capacity" element={<ResourceCapacityPlanning />} />
            <Route path="projects/templates" element={<ProjectTemplates />} />
            <Route path="projects/risks" element={<ProjectRiskManagement />} />
            <Route path="projects/add-project" element={<AddProject />} />
            <Route path="projects/:id" element={<ProjectsList />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="Events" element={<Events />} />
            <Route path="procurement/:id" element={<Procurement />} />
            <Route path="procurement" element={<Procurement />} />
            <Route path="add-procurement-record" element={<AddProcurment />} />
            <Route path="procurement/approveProcurment" element={<ReceiptPurchase />} />
            <Route path="add-product" element={<AddProduct />} />
            <Route path="tasks/:id" element={<TasksList />} />
            <Route path="tasks" element={<TasksList />} />
            <Route path="tasks/Add-Tasks" element={<CreateTask />} />
            <Route path="Customers/Orders/:id" element={<OrderManagement />} />
            <Route path="Customers/Orders" element={<OrdersList />} />
            <Route path="Customers/AddOrder" element={<AddOrders />} />
            <Route path="Customers" element={<CustomersList />} />
            <Route path="Customers/Add-Customer" element={<AddCustomers />} />
            <Route path="Customers/360/:customerId" element={<Customer360 />} />
            <Route path="Customers/Segmentation" element={<CustomerSegmentation />} />
            <Route path="Customers/Satisfaction" element={<CustomerSatisfaction />} />
            <Route path="Customers/Retention" element={<CustomerRetention />} />
            <Route path="leads" element={<LeadsManagement />} />
            <Route path="activities" element={<Activities />} />
            <Route path="leads/analytics" element={<LeadsAnalytics />} />
            <Route path="supplier" element={<Supplier />} />
            <Route path="add-supplier" element={<AddSupplier authUser={authUser} />} />
            <Route path="department/DepartmentList" element={<DepartmentList />} />
            <Route path="department/Add-Department" element={<Add_Department />} />
            <Route path="performance-reviews" element={<PerformanceReview />} />
            <Route path="AddPerformanceReview" element={<AddPerformanceReview />} />
            <Route path="historySignature" element={<HistorySignature />} />
            <Route path="historyAllSignature" element={<AllSignatures />} />
            <Route path="Shifts-List" element={<ShiftsList />} />
            <Route path="My-Shifts" element={<MyShifts />} />
            <Route path="job-percentages" element={<JobPercentages />} />
            <Route path="salary" element={<SalaryManagement />} />
            <Route path="payroll/automation" element={<SalaryManagement />} />
            <Route path="TaxConfig" element={<TaxConfig />} />
            <Route path="Vacation" element={<GlobalVacationCalculator />} />
            <Route path="sick-days" element={<SickDays />} />
            <Route path="add-sickdays" element={<AddSickDay />} />
            <Route path="use-sickdays" element={<UseSickDay />} />
            <Route path="use-vacationdays" element={<UseVacationDay />} />
            <Route path="support-tickets" element={<SupportTicketsList />} />
            <Route path="support-tickets/create" element={<CreateSupportTicket />} />
            <Route path="support-tickets/:id" element={<SupportTicketDetails />} />
            <Route path="analytics" element={<Dashboard />} />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="invoices/create" element={<CreateInvoice />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="finance/Budgets" element={<Budgets />} />
            <Route path="finance/add-budget" element={<AddOrEditBudget />} />
            <Route path="finance/budget-details/:id" element={<BudgetDetails />} />
            <Route path="finance/cash-flow" element={<CashFlow />} />
            <Route path="add-finance-record" element={<AddFinance />} />
            {/* HR Module Routes for Employees */}
            <Route path="self-service" element={<EmployeeSelfService />} />
            <Route path="hr/leave/request" element={<CreateLeaveRequest />} />
          </Route>

          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/forgot-password"
            element={!authUser ? <ForgotPasswordPage /> : <Navigate to="/" />}
          />
          <Route
            path="/reset-password"
            element={!authUser ? <ResetPasswordPage /> : <Navigate to="/" />}
          />

          <Route path="/dashboard" element={<AdminRoute authUser={authUser} />}>
            <Route index element={<Dashboard />} />
            <Route
              path="ProcurementProposals"
              element={<ProcurementProposals />}
            />
            <Route
              path="ProcurementProposalsList"
              element={<ProcurementProposalsList />}
            />
            <Route
              path="AddPerformanceReview"
              element={<AddPerformanceReview />}
            />
            <Route path="performance-reviews" element={<PerformanceReview />} />
            <Route path="products" element={<ProductList />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="inventory/warehouse/:warehouseId" element={<WarehouseInventoryView />} />
            <Route path="inventory/transfer" element={<InventoryTransfer />} />
            <Route path="warehouses" element={<WarehouseManagement />} />
            <Route path="assets" element={<AssetList />} />
            <Route path="assets/add" element={<AddAsset />} />
            <Route path="assets/:id" element={<AssetDetails />} />
            <Route path="assets/:id/edit" element={<AddAsset />} />
            <Route path="accounting/accounts" element={<AccountList />} />
            <Route path="accounting/accounts/add" element={<AddAccount />} />
            <Route path="accounting/accounts/:id/edit" element={<AddAccount />} />
            <Route path="accounting/reports" element={<FinancialReports />} />
            <Route path="banks/accounts" element={<BankAccountList />} />
            <Route path="banks/accounts/add" element={<AddBankAccount />} />
            <Route path="banks/accounts/:id/edit" element={<AddBankAccount />} />
            <Route path="banks/accounts/:id/transactions" element={<BankTransactionsList />} />
            <Route path="sales/opportunities" element={<SalesOpportunitiesList />} />
            <Route path="sales/opportunities/add" element={<AddSalesOpportunity />} />
            <Route path="sales/opportunities/:id" element={<AddSalesOpportunity />} />
            <Route path="sales/pipeline" element={<SalesPipeline />} />
            <Route path="contracts" element={<ContractsList />} />
            <Route path="contracts/add" element={<AddContract />} />
            <Route path="contracts/:id" element={<AddContract />} />
            <Route path="customer-service/tickets" element={<ServiceTicketsList />} />
            <Route path="customer-service/tickets/add" element={<AddServiceTicket />} />
            <Route path="customer-service/tickets/:id" element={<AddServiceTicket />} />
            <Route path="inventory/stock-counts" element={<StockCountsList />} />
            <Route path="inventory/stock-counts/add" element={<AddStockCount />} />
            <Route path="inventory/stock-counts/:id" element={<AddStockCount />} />
            <Route path="procurement/purchase-requests" element={<PurchaseRequestsList />} />
            <Route path="procurement/purchase-requests/add" element={<AddPurchaseRequest />} />
            <Route path="procurement/purchase-requests/:id" element={<AddPurchaseRequest />} />
            <Route path="procurement/tenders" element={<TendersList />} />
            <Route path="procurement/tenders/add" element={<AddTender />} />
            <Route path="procurement/tenders/:id" element={<AddTender />} />
            <Route path="procurement/supplier-contracts" element={<SupplierContractsList />} />
            <Route path="procurement/supplier-contracts/add" element={<AddSupplierContract />} />
            <Route path="procurement/supplier-contracts/:id" element={<AddSupplierContract />} />
            <Route path="customer-service/tickets" element={<ServiceTicketsList />} />
            <Route path="inventory/movements" element={<InventoryMovementsList />} />
            <Route path="inventory/movements/add" element={<AddInventoryMovement />} />
            <Route path="inventory/movements/:id" element={<AddInventoryMovement />} />
            <Route path="inventory/quality" element={<InventoryQualityList />} />
            <Route path="inventory/quality/add" element={<AddInventoryQuality />} />
            <Route path="inventory/quality/:id" element={<AddInventoryQuality />} />
            <Route path="procurement/price-lists" element={<PriceListsList />} />
            <Route path="procurement/price-lists/add" element={<AddPriceList />} />
            <Route path="procurement/price-lists/:id/edit" element={<AddPriceList />} />
            <Route path="procurement/price-lists/:id" element={<AddPriceList />} />
            <Route path="procurement/supplier-invoices" element={<SupplierInvoicesList />} />
            <Route path="procurement/supplier-invoices/add" element={<AddSupplierInvoice />} />
            <Route path="procurement/supplier-invoices/:id" element={<AddSupplierInvoice />} />
            <Route path="procurement/supply-schedules" element={<SupplySchedulesList />} />
            <Route path="procurement/supply-schedules/add" element={<AddSupplySchedule />} />
            <Route path="procurement/supply-schedules/:id" element={<AddSupplySchedule />} />
            <Route path="Events" element={<Events />} />
            <Route path="add-product" element={<AddProduct />} />
            <Route path="job-percentages" element={<JobPercentages />} />
            <Route path="Shifts-List" element={<ShiftsList />} />
            <Route path="My-Shifts" element={<MyShifts />} />
            <Route path="salary" element={<SalaryManagement />} />
            <Route path="payroll/automation" element={<SalaryManagement />} />
            <Route path="TaxConfig" element={<TaxConfig />} />
            <Route path="Vacation" element={<GlobalVacationCalculator />} />
            <Route path="sick-days" element={<SickDays />} />
            <Route path="add-sickdays" element={<AddSickDay />} />
            <Route path="use-sickdays" element={<UseSickDay />} />
            <Route path="use-vacationdays" element={<UseVacationDay />} />
            <Route
              path="add-supplier"
              element={<AddSupplier authUser={authUser} />}
            />
            <Route path="supplier" element={<Supplier />} />
            <Route path="finance" element={<Finance />} />
            <Route path="finance/Budgets" element={<Budgets />} />
            <Route path="finance/add-budget" element={<AddOrEditBudget />} />
            <Route path="finance/cash-flow" element={<CashFlow />} />
            <Route path="projects/gantt" element={<ProjectGanttChart />} />
            <Route path="projects/timeline" element={<ProjectTimeline />} />
            <Route path="projects/resources" element={<ProjectResourcesAllocation />} />
            <Route path="projects/portfolio" element={<ProjectPortfolio />} />
            <Route path="projects/capacity" element={<ResourceCapacityPlanning />} />
            <Route path="projects/templates" element={<ProjectTemplates />} />
            <Route path="projects/risks" element={<ProjectRiskManagement />} />
            <Route path="projects/add-project" element={<AddProject />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="production" element={<ProductionOrdersList />} />
            <Route path="production/create" element={<CreateProductionOrder />} />
            <Route path="production/:id" element={<ProductionOrderDetails />} />
            <Route path="roles" element={<RolesManagement />} />
            <Route
              path="finance/budget-details/:id"
              element={<BudgetDetails />}
            />
            <Route path="add-finance-record" element={<AddFinance />} />
            <Route path="employees/directory" element={<EmployeeDirectory />} />
            <Route path="employees/:id/details" element={<EmployeeDetails />} />
            <Route path="employees/:id" element={<Users />} />
            <Route path="employees" element={<Users />} />
            <Route path="add-procurement-record" element={<AddProcurment />} />
            <Route path="signup" element={<EmployeeSignup />} />
            <Route path="notifications" element={<NotificationsManagement />} />
            <Route path="procurement/:id" element={<Procurement />} />
            <Route path="procurement" element={<Procurement />} />
            <Route
              path="procurement/approveProcurment"
              element={<ReceiptPurchase />}
            />
            <Route path="historySignature" element={<HistorySignature />} />
            <Route path="historyAllSignature" element={<AllSignatures />} />
            <Route path="tasks/Add-Tasks" element={<CreateTask />} />
            <Route path="tasks/:id" element={<TasksList />} />
            <Route path="tasks" element={<TasksList />} />
            <Route path="support-tickets" element={<SupportTicketsList />} />
            <Route
              path="support-tickets/create"
              element={<CreateSupportTicket />}
            />
            <Route
              path="support-tickets/:id"
              element={<SupportTicketDetails />}
            />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="invoices/create" element={<CreateInvoice />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route
              path="department/Add-Department"
              element={<Add_Department />}
            />
            <Route
              path="department/DepartmentList"
              element={<DepartmentList />}
            />
            <Route path="Customers/Add-Customer" element={<AddCustomers />} />
            <Route path="Customers" element={<CustomersList />} />
            <Route path="Customers/Orders/:id" element={<OrderManagement />} />
            <Route path="Customers/Orders" element={<OrdersList />} />
            <Route path="Customers/AddOrder" element={<AddOrders />} />
            <Route path="Customers/360/:customerId" element={<Customer360 />} />
            <Route path="Customers/Segmentation" element={<CustomerSegmentation />} />
            <Route path="Customers/Satisfaction" element={<CustomerSatisfaction />} />
            <Route path="Customers/Retention" element={<CustomerRetention />} />
            <Route path="leads" element={<LeadsManagement />} />
            <Route path="activities" element={<Activities />} />
            <Route path="leads/analytics" element={<LeadsAnalytics />} />
            <Route path="orders/management/:orderId" element={<OrderManagement />} />
            <Route path="orders/tracking" element={<DeliveryTracking />} />
            <Route path="orders/tracking/:id" element={<TrackingDetails />} />
            <Route path="orders/preparation" element={<OrdersPreparation />} />
            {/* HR Module Routes */}
            <Route path="hr/ats/job-postings" element={<JobPostingsList />} />
            <Route path="hr/ats/job-postings/new" element={<CreateJobPosting />} />
            <Route path="hr/ats/applicants" element={<ApplicantsList />} />
            <Route path="hr/lms/courses" element={<CoursesList />} />
            <Route path="hr/lms/courses/new" element={<CreateCourse />} />
            <Route path="hr/attendance" element={<AttendanceManagement />} />
            <Route path="hr/leave/requests" element={<LeaveRequestsList />} />
            <Route path="hr/leave/requests/new" element={<CreateLeaveRequest />} />
            <Route path="hr/analytics" element={<HRAnalyticsDashboard />} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee" element={<EmployeeRoute authUser={authUser} />}>
            <Route index element={<EmployeeDashboard />} />
            <Route path="self-service" element={<EmployeeSelfService />} />
            <Route path="hr/leave/request" element={<CreateLeaveRequest />} />
          </Route>
        </Routes>
      </Layout>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            zIndex: 10000,
            background: "#ffffff",
            color: "#333333",
            padding: "20px 25px",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
          },
          success: {
            style: {
              borderLeft: "4px solid #22c55e", // Green for success
            },
            iconTheme: {
              primary: "#22c55e", // Green icon
              secondary: "#ffffff", // White background for icon
            },
          },
          error: {
            style: {
              borderLeft: "4px solid #ef4444", // Red for errors
            },
            iconTheme: {
              primary: "#ef4444", // Red icon
              secondary: "#ffffff", // White background for icon
            },
          },
        }}
      />
    </>
  );
};

export default App;
