import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";
import SignatureCanvas from "react-signature-canvas";
import {
  FaBell,
  FaBars,
  FaTimes,
  FaUserEdit,
  FaBuilding,
  FaEdit,
} from "react-icons/fa";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const Navbar = ({ isRTL, isMenuOpen, setIsMenuOpen, onModalStateChange }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const signaturePadRef = useRef(null);
  const navigate = useNavigate();

  // States
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubDropdown, setOpenSubDropdown] = useState(null);
  const [avatarColorClass, setAvatarColorClass] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    name: "",
    lastName: "",
    email: "",
    gender: "",
    identity: "",
    phone: "",
    address: {
      street: "",
      city: "",
      country: "",
      postalCode: "",
    },
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    profileImage: "",
    profileImageFile: null,
  });
  const [companyForm, setCompanyForm] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    industry: "",
    taxId: "",
  });
  const [editableFields, setEditableFields] = useState({});

  useEffect(() => {
    setAvatarColorClass(
      `bg-[var(--color-${
        ["primary", "secondary", "accent"][Math.floor(Math.random() * 3)]
      })]`
    );
  }, []);

  // Notify Layout when modals open/close
  useEffect(() => {
    onModalStateChange(showPersonalModal || showCompanyModal);
  }, [showPersonalModal, showCompanyModal, onModalStateChange]);

  // Query: Authenticated User
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const response = await axiosInstance.get("/auth/me");
      return response.data;
    },
  });

  // Query: Employee Details
  const {
    data: users,
    isError,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await axiosInstance.get("/employees/me");
      console.log("Employee details:", response.data);
      return response.data;
    },
  });

  const authUser = authData?.user;
  const firstName = authUser?.name || "Guest";
  const lastName = authUser?.lastName || "";
  const profileImage = authUser?.profileImage;
  const isLoggedIn = !!authUser;

  // Initialize personal form with employee data
  useEffect(() => {
    if (users) {
      const employeeData = users.data || users.employee || users;
      setPersonalForm({
        name: employeeData.name || "",
        lastName: employeeData.lastName || "",
        email: employeeData.email || "",
        gender: employeeData.gender || "",
        identity: employeeData.identity || "",
        phone: employeeData.phone || "",
        address: {
          street: employeeData.address?.street || "",
          city: employeeData.address?.city || "",
          country: employeeData.address?.country || "",
          postalCode: employeeData.address?.postalCode || "",
        },
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
        profileImage: employeeData.profileImage || "",
        profileImageFile: null,
      });
    }
    if (isError) {
      console.error("Error fetching employee details:", error);
      toast.error(t("navbar.profile.employeeFetchError"));
    }
  }, [users, isError, error, t]);

  // Query: Company Details (for Admins)
  const { data: companyData } = useQuery({
    queryKey: ["companyDetails"],
    queryFn: async () => {
      const response = await axiosInstance.get("/company/get-company");
      return response.data.data;
    },
    enabled: isLoggedIn && authUser?.role === "Admin",
  });

  // Initialize company form with company data
  useEffect(() => {
    if (companyData) {
      setCompanyForm({
        name: companyData.name || "",
        email: companyData.email || "",
        phone: companyData.phone || "",
        website: companyData.website || "",
        address: {
          street: companyData.address?.street || "",
          city: companyData.address?.city || "",
          state: companyData.address?.state || "",
          postalCode: companyData.address?.postalCode || "",
          country: companyData.address?.country || "",
        },
        industry: companyData.industry || "",
        taxId: companyData.taxId || "",
      });
    }
  }, [companyData]);

  // Mutation: Logout
  const { mutate: logout, isLoading: isLoggingOut } = useMutation({
    mutationFn: async () => {
      await axiosInstance.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      localStorage.removeItem("authUser");
      window.location.href = "/login";
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      toast.error(t("navbar.profile.logoutError"));
    },
  });

  // Mutation: Update Personal Details
  const { mutate: updatePersonalDetails } = useMutation({
    mutationFn: async (data) => {
      const {
        currentPassword,
        newPassword,
        confirmNewPassword,
        profileImageFile,

        ...profileData
      } = data;
      const formData = new FormData();

      // Append profile data to FormData
      Object.keys(profileData).forEach((key) => {
        if (key === "address") {
          Object.keys(profileData.address).forEach((subKey) => {
            formData.append(`address.${subKey}`, profileData.address[subKey]);
          });
        } else {
          formData.append(key, profileData[key]);
        }
      });

      // Append profile image file if it exists
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      const response = await axiosInstance.put(
        `/employees/${users.data._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (newPassword && currentPassword) {
        await axiosInstance.post("/employees/change-password", {
          currentPassword,
          newPassword,
          confirmNewPassword,
        });
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setShowPersonalModal(false);
      setEditableFields({});
      setShowPasswordFields(false);
      toast.success(t("navbar.profile.updateSuccess"));
    },
    onError: (error) => {
      console.error("Update personal details failed:", error);
      toast.error(
        error.response?.data?.message || t("navbar.profile.updateError")
      );
    },
  });

  // Mutation: Update Company Details
  const { mutate: updateCompanyDetails } = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.put("/company", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["companyDetails"]);
      setShowCompanyModal(false);
      setEditableFields({});
      toast.success(t("navbar.profile.companyUpdateSuccess"));
    },
    onError: (error) => {
      console.error("Update company details failed:", error);
      toast.error(
        error.response?.data?.message || t("navbar.profile.companyUpdateError")
      );
    },
  });

  // Queries: Procurement, Budget, Notifications
  const { data: procurementData = [] } = useQuery({
    queryKey: ["procurement"],
    queryFn: async () => {
      const response = await axiosInstance.get("/procurement");
      return response.data.data;
    },
    enabled: isLoggedIn,
  });

  const { data: budgetData = [] } = useQuery({
    queryKey: ["budget"],
    queryFn: async () => {
      const response = await axiosInstance.get("/budget");
      return response.data.data;
    },
    enabled: isLoggedIn,
  });

  const {
    data: adminNotifications = [],
    isLoading: isLoadingNotifications,
    refetch: refetchAdminNotifications,
  } = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/notifications/admin-notifications"
      );
      return response.data.data;
    },
    enabled: isLoggedIn && authUser?.role === "Admin",
  });
  const unreadCount = adminNotifications.filter((n) => !n.isRead).length || 0;

  // Documents needing signature
  const itemsRequiringSignature = procurementData.filter(
    (item) =>
      item.approvalStatus === "Pending Approval" &&
      item.signers?.some(
        (signer) =>
          signer.employeeId === authUser?.employeeId && !signer.hasSigned
      )
  );

  const budgetRequiringSignature = budgetData.filter(
    (item) =>
      item.status === "Draft" &&
      item.signers?.some(
        (signer) =>
          signer.employeeId === authUser?.employeeId && !signer.hasSigned
      )
  );

  // Handlers: Signatures Popup
  const togglePopup = () => {
    setShowPopup((prev) => !prev);
    setShowNotifications(false);
    setOpenDropdown(null);
    setOpenSubDropdown(null);
    setIsMenuOpen(false);
    setShowProfileDropdown(false);
  };

  const handleSignature = () => {
    togglePopup();
  };

  const handleOpenModal = (pdfUrl, itemId, type, budgetDetails = null) => {
    setSelectedPDF(pdfUrl);
    setSelectedItemId(itemId);
    setSelectedDocumentType(type);
    if (type === "budget") {
      setSelectedBudget(budgetDetails);
    } else {
      setSelectedBudget(null);
    }
    setShowModal(true);
    setShowPopup(false);
    setShowNotifications(false);
    setIsMenuOpen(false);
    setShowProfileDropdown(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPDF(null);
  };

  const handleSaveSignature = async () => {
    if (signaturePadRef.current && selectedItemId) {
      const signatureData = signaturePadRef.current.toDataURL();
      let endpoint = "";
      if (selectedDocumentType === "procurement") {
        endpoint = `/procurement/${selectedItemId}/sign`;
      } else if (selectedDocumentType === "budget") {
        endpoint = `/budget/${selectedItemId}/sign`;
      }
      if (!endpoint) {
        toast.error(t("navbar.Signatures.invalidDocumentType"));
        return;
      }
      try {
        await axiosInstance.post(endpoint, {
          employeeId: authUser.employeeId,
          signature: signatureData,
        });
        toast.success(t("navbar.Signatures.signatureSaved"));
        queryClient.invalidateQueries(["procurement", "budget"]);
        handleCloseModal();
      } catch (error) {
        console.error("Error saving signature:", error);
        const serverMessage =
          error.response?.data?.message ||
          t("navbar.Signatures.signatureSaveError");
        toast.error(serverMessage);
      }
    } else {
      toast.error(t("navbar.Signatures.noItemSelected"));
    }
  };

  // Handlers: Notifications
  const handleNotificationsClick = () => {
    setShowNotifications((prev) => !prev);
    setShowPopup(false);
    setOpenDropdown(null);
    setOpenSubDropdown(null);
    setIsMenuOpen(false);
    setShowProfileDropdown(false);
    refetchAdminNotifications();
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axiosInstance.delete(`/notifications/delete`, {
        data: { notificationId },
      });
      toast.success(t("navbar.notifications.notificationDeleted"));
      refetchAdminNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error(
        error.response?.data?.message ||
          t("navbar.notifications.notificationDeleteError")
      );
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axiosInstance.post(`/notifications/mark-as-read`, {
        notificationId,
      });
      toast.success(t("navbar.notifications.notificationMarkedAsRead"));
      refetchAdminNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error(t("navbar.notifications.notificationMarkReadError"));
    }
  };

  const markNotificationAsReadAll = async () => {
    try {
      await axiosInstance.post(`/notifications/mark-as-read-all`, {});
      refetchAdminNotifications();
      toast.success(t("navbar.notifications.allNotificationsRead"));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      toast.error(t("navbar.notifications.notificationMarkReadError"));
    }
  };

  const handleOrderClick = async (notificationId) => {
    try {
      const notification = adminNotifications.find(
        (n) => n._id === notificationId
      );
      const productNameMatch = notification?.content.match(
        /The quantity of the product "?([^"]*)"?(?= is below the minimum stock level)/
      );
      const productName = productNameMatch ? productNameMatch[1] : null;
      if (!productName) {
        throw new Error("לא ניתן לחלץ את שם המוצר מההתראה");
      }

      const productSearchResp = await axiosInstance.get(
        `/product/search-by-name`,
        {
          params: { name: productName },
        }
      );
      if (
        !productSearchResp.data.success ||
        !productSearchResp.data.data?.length
      ) {
        throw new Error("לא נמצא מוצר עם השם הזה");
      }
      const products = productSearchResp.data.data;

      let product = null;
      for (const p of products) {
        try {
          const inventoryResponse = await axiosInstance.get(
            `/inventory/${p._id}`
          );
          const inventory = inventoryResponse.data.data;
          if (inventory && inventory.quantity < inventory.minStockLevel) {
            product = p;
            break;
          }
        } catch (err) {
          console.warn(`בדיקת מלאי נכשלה עבור מזהה ${p._id}:`, err.message);
        }
      }
      product = product || products[0];

      if (!product?._id) {
        throw new Error("מזהה המוצר חסר בתוצאת החיפוש");
      }

      const {
        unitPrice = 0,
        sku = "",
        category = "",
        supplierId = "",
      } = product;

      let reorderQuantity = 0;
      try {
        const inventoryResponse = await axiosInstance.get(
          `/inventory/${product._id}`
        );
        reorderQuantity = inventoryResponse.data.data?.reorderQuantity || 0;
      } catch (err) {
        console.warn(`הבאת מלאי נכשלה עבור מזהה ${product._id}:`, err.message);
      }

      let supplier = {};
      if (supplierId) {
        try {
          const supplierResponse = await axiosInstance.get(
            `/suppliers/${supplierId}`
          );
          if (!supplierResponse.data.success) {
            throw new Error(
              supplierResponse.data.error || "נכשל בהבאת פרטי הספק"
            );
          }
          supplier = supplierResponse.data.data;
        } catch (err) {
          console.error(`הבאת ספק נכשלה עבור מזהה ${supplierId}:`, err.message);
          supplier = {
            _id: supplierId,
            SupplierName: "ספק לא ידוע",
            baseCurrency: "USD",
          };
        }
      } else {
        supplier = { SupplierName: "ספק לא ידוע", baseCurrency: "USD" };
      }

      await axiosInstance.post(`/notifications/mark-as-read`, {
        notificationId,
      });

      const stateData = {
        productId: product._id,
        productName: product.productName || productName,
        supplierId: supplier._id || supplierId,
        supplierName: supplier.SupplierName || "ספק לא ידוע",
        baseCurrency: supplier.baseCurrency || "USD",
        quantity: reorderQuantity,
        unitPrice: unitPrice || 0,
        sku: sku || "",
        category: category || "",
      };
      navigate("/dashboard/add-procurement-record", { state: stateData });

      refetchAdminNotifications();
    } catch (error) {
      console.error("שגיאה בטיפול בלחיצה על הזמנה:", error);
      let errorMessage = t("navbar.notifications.orderError");
      if (error.response) {
        errorMessage =
          error.response.data.error ||
          error.response.data.message ||
          errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };

  // Handlers: Hamburger Menu
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    setShowPopup(false);
    setShowNotifications(false);
    setOpenDropdown(null);
    setOpenSubDropdown(null);
    setShowProfileDropdown(false);
  };

  // Handlers: Profile Dropdown
  const handleProfileClick = () => {
    setShowProfileDropdown((prev) => !prev);
    setShowPopup(false);
    setShowNotifications(false);
    setOpenDropdown(null);
    setOpenSubDropdown(null);
    setIsMenuOpen(false);
  };

  // Handlers: Personal Details Modal
  const handleOpenPersonalModal = () => {
    setShowCompanyModal(false);
    setShowPersonalModal(true);
    setShowProfileDropdown(false);
    // Enable editing for all fields when opening the modal
    setEditableFields({
      name: true,
      lastName: true,
      email: true,
      gender: true,
      identity: true,
      phone: true,
      "address.street": true,
      "address.city": true,
      "address.country": true,
      "address.postalCode": true,
    });
  };

  const handleClosePersonalModal = () => {
    setShowPersonalModal(false);
    setShowPasswordFields(false);
    setPersonalForm({
      name: users?.data?.name || users?.employee?.name || users?.name || "",
      lastName:
        users?.data?.lastName ||
        users?.employee?.lastName ||
        users?.lastName ||
        "",
      email: users?.data?.email || users?.employee?.email || users?.email || "",
      gender:
        users?.data?.gender || users?.employee?.gender || users?.gender || "",
      identity:
        users?.data?.identity ||
        users?.employee?.identity ||
        users?.identity ||
        "",
      phone: users?.data?.phone || users?.employee?.phone || users?.phone || "",
      address: {
        street:
          users?.data?.address?.street ||
          users?.employee?.address?.street ||
          users?.address?.street ||
          "",
        city:
          users?.data?.address?.city ||
          users?.employee?.address?.city ||
          users?.address?.city ||
          "",
        country:
          users?.data?.address?.country ||
          users?.employee?.address?.country ||
          users?.address?.country ||
          "",
        postalCode:
          users?.data?.address?.postalCode ||
          users?.employee?.address?.postalCode ||
          users?.address?.postalCode ||
          "",
      },
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      profileImage:
        users?.data?.profileImage ||
        users?.employee?.profileImage ||
        users?.profileImage ||
        "",
      profileImageFile: null,
    });
    setEditableFields({});
  };

  const handlePersonalFormChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("address.")) {
      const field = name.split(".")[1];
      setPersonalForm((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setPersonalForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePersonalFormSubmit = () => {
    updatePersonalDetails(personalForm);
  };

  // Handlers: Company Details Modal
  const handleOpenCompanyModal = () => {
    setShowPersonalModal(false);
    setShowCompanyModal(true);
    setShowProfileDropdown(false);
  };

  const handleCloseCompanyModal = () => {
    setShowCompanyModal(false);
    setCompanyForm({
      name: companyData?.name || "",
      email: companyData?.email || "",
      phone: companyData?.phone || "",
      website: companyData?.website || "",
      address: {
        street: companyData?.address?.street || "",
        city: companyData?.address?.city || "",
        state: companyData?.address?.state || "",
        postalCode: companyData?.address?.postalCode || "",
        country: companyData?.address?.country || "",
      },
      industry: companyData?.industry || "",
      taxId: companyData?.taxId || "",
    });
    setEditableFields({});
  };

  const handleCompanyFormChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("address.")) {
      const field = name.split(".")[1];
      setCompanyForm((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setCompanyForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCompanyFormSubmit = () => {
    updateCompanyDetails(companyForm);
  };

  // Toggle field editability
  const toggleFieldEdit = (field) => {
    setEditableFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const adminLinks = [
    { label: t("navbar.dashboard"), to: "/dashboard" },
    {
      label: t("navbar.products"),
      subMenu: [
        { to: "/dashboard/products", text: t("navbar.all_products") },
        { to: "/dashboard/add-product", text: t("navbar.add_product") },
      ],
    },
    {
      label: t("navbar.supplier"),
      subMenu: [
        { to: "/dashboard/supplier", text: t("navbar.all_suppliers") },
        { to: "/dashboard/add-supplier", text: t("navbar.add_supplier") },
      ],
    },
    {
      label: t("navbar.shifts"),
      subMenu: [
        { to: "/dashboard/Shifts-List", text: t("navbar.Shifts-List") },
        { to: "/dashboard/My-Shifts", text: t("navbar.My-Shifts") },
        { to: "/dashboard/job-percentages", text: t("navbar.job-percentages") },
      ],
    },
    {
      label: t("navbar.finance"),
      subMenu: [
        { to: "/dashboard/finance", text: t("navbar.finance_records") },
        {
          to: "/dashboard/add-finance-record",
          text: t("navbar.create_finance_record"),
        },
        {
          to: "/dashboard/salary",
          text: t("navbar.salary"),
        },
        {
          to: "/dashboard/TaxConfig",
          text: t("navbar.TaxConfig"),
        },
        {
          to: "/dashboard/Vacation",
          text: t("navbar.Vacation"),
        },
        {
          label: t("navbar.Vacation"),
          subMenu: [
            {
              to: "/dashboard/Vacation",
              text: t("navbar.Vacation"),
            },
            {
              to: "/dashboard/use-vacationdays",
              text: t("navbar.use-vacationdays"),
            },
          ],
        },
        {
          label: t("navbar.SickDays"),
          subMenu: [
            {
              to: "/dashboard/sick-days",
              text: t("navbar.SickDays"),
            },
            {
              to: "/dashboard/add-sickdays",
              text: t("navbar.add-sickdays"),
            },
            {
              to: "/dashboard/use-sickdays",
              text: t("navbar.use-sickdays"),
            },
          ],
        },
        {
          label: t("navbar.Budget"),
          subMenu: [
            {
              to: "/dashboard/finance/budgets",
              text: t("navbar.budget_records"),
            },
            {
              to: "/dashboard/finance/add-budget",
              text: t("navbar.create_budget_record"),
            },
          ],
        },
      ],
    },
    {
      label: t("navbar.procurement"),
      subMenu: [
        { to: "/dashboard/procurement", text: t("navbar.procurement") },
        {
          to: "/dashboard/add-procurement-record",
          text: t("navbar.create_procurement_record"),
        },
        {
          to: "/dashboard/procurement/approveProcurment",
          text: t("navbar.receipt_purchase"),
        },
        {
          label: t("navbar.ProcurementProposals"),
          subMenu: [
            {
              to: "/dashboard/ProcurementProposals",
              text: t("navbar.ProcurementProposals"),
            },
            {
              to: "/dashboard/ProcurementProposalsList",
              text: t("navbar.ProcurementProposalsList"),
            },
          ],
        },
      ],
    },
    {
      label: t("navbar.Projects"),
      subMenu: [
        { to: "/dashboard/projects", text: t("navbar.Projects_List") },
        {
          to: "/dashboard/projects/add-project",
          text: t("navbar.Add_Project"),
        },
      ],
    },
    {
      label: t("navbar.employees"),
      subMenu: [
        { to: "/dashboard/employees", text: t("navbar.all_employees") },
        { to: "/dashboard/signup", text: t("navbar.new_employee") },
      ],
    },
    {
      label: t("navbar.signatures"),
      subMenu: [
        { to: "/dashboard/historySignature", text: t("navbar.my_signature") },
        {
          to: "/dashboard/historyAllSignature",
          text: t("navbar.all_signatures"),
        },
      ],
    },
    {
      label: t("navbar.department"),
      subMenu: [
        {
          to: "/dashboard/department/Add-Department",
          text: t("navbar.add_department"),
        },
        {
          to: "/dashboard/department/DepartmentList",
          text: t("navbar.departmentList"),
        },
      ],
    },
    {
      label: t("navbar.review"),
      subMenu: [
        {
          to: "/dashboard/AddPerformanceReview",
          text: t("navbar.add_reviewForm"),
        },
        { to: "/dashboard/performance-reviews", text: t("navbar.review_List") },
      ],
    },
    {
      label: t("navbar.tasks"),
      subMenu: [
        { to: "/dashboard/tasks", text: t("navbar.tasks") },
        { to: "/dashboard/tasks/Add-Tasks", text: t("navbar.add_tasks") },
      ],
    },
    {
      label: t("navbar.Orders"),
      subMenu: [
        { to: "/dashboard/Customers/Orders", text: t("navbar.Orders List") },
        { to: "/dashboard/Customers/AddOrder", text: t("navbar.Add-Orders") },
        {
          label: t("navbar.customer"),
          subMenu: [
            { to: "/dashboard/Customers", text: t("navbar.customer_list") },
            {
              to: "/dashboard/Customers/Add-Customer",
              text: t("navbar.add_customer"),
            },
          ],
        },
      ],
    },
    {
      label: t("navbar.calendar"),
      subMenu: [{ to: "/dashboard/Events", text: t("navbar.events") }],
    },
  ];

  const managerLinks = [
    { label: t("navbar.dashboard"), to: "/employee" },
    {
      label: t("navbar.finance"),
      subMenu: [
        { to: "/employee/finance", text: t("navbar.finance_records") },
        { to: "/employee/AddFinance", text: t("navbar.create_finance_record") },
      ],
    },
    {
      label: t("navbar.products"),
      subMenu: [{ to: "/employee/products", text: t("navbar.all_products") }],
    },
    {
      label: t("navbar.procurement"),
      subMenu: [
        {
          to: "/employee/ProcurementProposals",
          text: t("navbar.ProcurementProposals"),
        },
        {
          to: "/employee/ProcurementProposalsList",
          text: t("navbar.ProcurementProposals updating...List"),
        },
      ],
    },
  ];

  const employeeLinks = [
    { label: t("navbar.dashboard"), to: "/employee" },
    {
      label: t("navbar.finance"),
      subMenu: [
        { to: "/employee/finance", text: t("navbar.finance_records") },
        { to: "/employee/AddFinance", text: t("navbar.create_finance_record") },
      ],
    },
    {
      label: t("navbar.products"),
      subMenu: [{ to: "/employee/products", text: t("navbar.all_products") }],
    },
    {
      label: t("navbar.procurement"),
      subMenu: [
        {
          to: "/employee/ProcurementProposals",
          text: t("navbar.ProcurementProposals"),
        },
        {
          to: "/employee/ProcurementProposalsList",
          text: t("navbar.ProcurementProposalsList"),
        },
      ],
    },
  ];

  let navigationLinks = [];
  if (authUser?.role === "Admin") {
    navigationLinks = adminLinks;
  } else if (authUser?.role === "Manager") {
    navigationLinks = managerLinks;
  } else if (authUser?.role === "Employee") {
    navigationLinks = employeeLinks;
  }

  // Render SubMenu
  const renderSubMenu = (subMenu, parentIndex) => {
    return (
      <ul className="mt-2 space-y-1 ps-4 flex flex-col items-start text-sm lg:text-base">
        {subMenu.map((item, subIndex) => {
          const uniqueSubIndex = `${parentIndex}-${subIndex}`;
          if (item.subMenu) {
            return (
              <li key={uniqueSubIndex} className="relative w-full">
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubDropdown(
                      openSubDropdown === uniqueSubIndex ? null : uniqueSubIndex
                    );
                  }}
                  className={`w-full py-1.5 text-[var(--color-primary)] font-medium hover:text-[var(--color-accent)] transition-all duration-300 ease-in-out relative flex items-center justify-between group ${
                    isRTL ? "text-right " : "text-left"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs transition-transform duration-300">
                    {openSubDropdown === uniqueSubIndex ? "▲" : "▼"}
                  </span>
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[var(--color-accent)] scale-x-0 origin-center transition-transform duration-300 ease-in-out group-hover:scale-x-100"></span>
                </button>
                {openSubDropdown === uniqueSubIndex && (
                  <div className="ps-4">
                    {renderSubMenu(item.subMenu, uniqueSubIndex)}
                  </div>
                )}
              </li>
            );
          } else {
            return (
              <li key={uniqueSubIndex} className="w-full">
                <Link
                  to={item.to}
                  onClick={() => {
                    setOpenDropdown(null);
                    setOpenSubDropdown(null);
                    setShowPopup(false);
                    setShowNotifications(false);
                    setIsMenuOpen(false);
                    setShowProfileDropdown(false);
                  }}
                  className={`block py-1.5 text-[var(--color-primary)] font-medium hover:text-[var(--color-accent)] transition-all duration-300 ease-in-out relative group ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {item.text || item.label}
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[var(--color-accent)] scale-x-0 origin-center transition-transform duration-300 ease-in-out group-hover:scale-x-100"></span>
                </Link>
              </li>
            );
          }
        })}
      </ul>
    );
  };

  return (
    <nav className="bg-[var(--color-primary)] text-white px-2 sm:px-4 lg:px-4 py-2 sm:py-3 lg:py-4 shadow-2xl sticky w-screen animate-fade-in z-50">
      <div className="w-full pl-6 2xl:pl-0 xl:pl-10 lg:pl-8 sm:pl-8 xs:pl-5 flex items-center justify-between relative">
        {/* Logo */}
        <Link
          to="/"
          className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-wide text-white hover:text-[var(--color-accent)] transition-colors duration-300 flex-shrink-0 drop-shadow-md"
        >
          Nexora
        </Link>

        {/* Hamburger Menu Button – Visible below 2xl */}
        {isLoggedIn && (
          <button
            onClick={toggleMenu}
            className={`2xl:hidden text-white focus:outline-none flex-shrink-0 hover:text-[var(--color-accent)] transition-colors duration-200 absolute ${
              isRTL ? "left-2" : "right-2"
            } top-1/2 transform -translate-y-1/2`}
            aria-label="Toggle innowenu"
          >
            {isMenuOpen ? (
              <FaTimes className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7" />
            ) : (
              <FaBars className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7" />
            )}
          </button>
        )}

        {/* Desktop Navigation Links – Visible at 2xl and above */}
        {isLoggedIn && (
          <div className="hidden 2xl:flex flex-1 justify-center items-center space-x-6 px-4">
            {navigationLinks.map((navItem, index) => {
              if (navItem.subMenu) {
                return (
                  <div key={index} className="relative">
                    <button
                      onClick={() => {
                        if (openDropdown === index) {
                          setOpenDropdown(null);
                          setOpenSubDropdown(null);
                        } else {
                          setOpenDropdown(index);
                          setOpenSubDropdown(null);
                        }
                        setShowPopup(false);
                        setShowNotifications(false);
                        setShowProfileDropdown(false);
                      }}
                      className={`py-1 text-white font-medium hover:text-[var(--color-accent)] transition-all duration-300 ease-in-out relative group ${
                        index === 0 && isRTL ? "pr-6" : ""
                      }`}
                    >
                      <span>{navItem.label}</span>
                      <span className="ml-1 text-xs">
                        {openDropdown === index ? "▲" : "▼"}
                      </span>
                      <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[var(--color-accent)] transition-all duration-300 ease-in-out group-hover:w-full group-hover:left-0"></span>
                    </button>
                    {openDropdown === index && (
                      <div
                        className={`absolute ${
                          isRTL ? "right-0" : "left-0"
                        } mt-2 bg-white text-[var(--color-primary)] rounded-lg shadow-lg p-3 w-64 z-50 border border-[var(--color-accent)] animate-slide-down`}
                      >
                        {renderSubMenu(navItem.subMenu, index)}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <Link
                    key={index}
                    to={navItem.to}
                    className={`py-1 text-white ml-4 font-medium hover:text-[var(--color-accent)] transition-all duration-300 ease-in-out relative group ${
                      index === 0 && isRTL ? "pr-0" : ""
                    }`}
                    onClick={() => {
                      setOpenDropdown(null);
                      setOpenSubDropdown(null);
                      setShowPopup(false);
                      setShowNotifications(false);
                      setShowProfileDropdown(false);
                    }}
                  >
                    {navItem.label}
                    <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[var(--color-accent)] transition-all duration-300 ease-in-out group-hover:w-full group-hover:left-0"></span>
                  </Link>
                );
              }
            })}
          </div>
        )}

        {/* Right Side: Profile, Signatures, Notifications */}
        <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
          {isLoggedIn ? (
            <>
              {(itemsRequiringSignature.length > 0 ||
                budgetRequiringSignature.length > 0) && (
                <div className="relative">
                  <span className="absolute -top-1 -right-1 bg-[var(--color-accent)] z-50 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                    {itemsRequiringSignature.length +
                      budgetRequiringSignature.length}
                  </span>
                  <button
                    onClick={handleSignature}
                    className="px-2 py-1 bg-[var(--color-accent)] text-white rounded-full hover:bg-[var(--color-primary)] text-sm transition-all duration-300 shadow-sm"
                  >
                    {t("navbar.Signatures.sign_now")}
                  </button>
                  {showPopup && (
                    <div
                      className={`absolute ${
                        isRTL ? "left-0" : "right-0"
                      } mt-2 bg-white text-[var(--color-primary)] shadow-lg rounded-lg p-3 w-72 lg:w-96 z-50 max-h-64 overflow-y-auto border border-[var(--color-accent)] animate-slide-down`}
                    >
                      <h3 className="text-sm font-bold mb-2">
                        {t("navbar.Signatures.documents_requiring_signature")}
                      </h3>
                      <ul>
                        {itemsRequiringSignature.map((item) => {
                          const nextSigner =
                            item.signers[item.currentSignerIndex];
                          const isMyTurn =
                            nextSigner?.employeeId === authUser?.employeeId;
                          const totalSigners = item.signers.length;
                          const signedCount = item.signers.filter(
                            (s) => s.hasSigned
                          ).length;
                          const remainingSigners = totalSigners - signedCount;
                          if (!item.PurchaseOrder) return null;
                          return (
                            <li key={item._id} className="mb-2 border-b pb-2">
                              <div className="text-sm">
                                <strong>
                                  {t("navbar.Signatures.purchase_order")}:
                                </strong>{" "}
                                {item.PurchaseOrder}
                              </div>
                              {isMyTurn ? (
                                <button
                                  onClick={() =>
                                    handleOpenModal(
                                      item.summeryProcurement,
                                      item._id,
                                      "procurement"
                                    )
                                  }
                                  className="mt-1 px-2 py-1 bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-secondary)] text-sm transition-all duration-300 shadow-sm"
                                >
                                  {t("navbar.Signatures.sign_now")}
                                </button>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600">
                                    {t("navbar.Signatures.next_signer")}:{" "}
                                    {nextSigner
                                      ? `${nextSigner.name} (${nextSigner.role})`
                                      : t("navbar.Signatures.no_next_signer")}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {t("navbar.Signatures.remaining_signers", {
                                      count: remainingSigners,
                                    })}
                                  </p>
                                </>
                              )}
                            </li>
                          );
                        })}
                        {budgetRequiringSignature.map((item) => {
                          const nextSigner =
                            item.signers[item.currentSignerIndex];
                          const isMyTurn =
                            nextSigner?.employeeId === authUser?.employeeId;
                          const totalSigners = item.signers.length;
                          const signedCount = item.signers.filter(
                            (s) => s.hasSigned
                          ).length;
                          const remainingSigners = totalSigners - signedCount;
                          return (
                            <li key={item._id} className="mb-2 border-b pb-2">
                              <div className="text-sm">
                                <strong>
                                  {t("navbar.Signatures.budget_name")}:
                                </strong>{" "}
                                {item.departmentOrProjectName}
                              </div>
                              <div className="text-sm">
                                <strong>
                                  {t("navbar.Signatures.amount")}:
                                </strong>{" "}
                                ${item.amount}
                              </div>
                              {isMyTurn ? (
                                <button
                                  onClick={() =>
                                    handleOpenModal(
                                      item.budgetDocument,
                                      item._id,
                                      "budget",
                                      {
                                        budgetName: item.budgetName,
                                        amount: item.amount,
                                        department: item.department,
                                        description: item.description,
                                      }
                                    )
                                  }
                                  className="mt-1 px-2 py-1 bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-secondary)] text-sm transition-all duration-300 shadow-sm"
                                >
                                  {t("navbar.Signatures.sign_now")}
                                </button>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600">
                                    {t("navbar.Signatures.next_signer")}:{" "}
                                    {nextSigner
                                      ? `${nextSigner.name} (${nextSigner.role})`
                                      : t("navbar.Signatures.no_next_signer")}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {t("navbar.Signatures.remaining_signers", {
                                      count: remainingSigners,
                                    })}
                                  </p>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <button
                        onClick={() => setShowPopup(false)}
                        className="mt-2 px-2 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm transition-all duration-300 shadow-sm"
                      >
                        {t("buttons.close")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {authUser?.role === "Admin" && (
                <div className="relative">
                  <button
                    onClick={handleNotificationsClick}
                    className="relative text-white hover:text-[var(--color-accent)] transition-colors duration-200"
                  >
                    <FaBell className="w-5 h-5 ml-2 lg:w-6 lg:h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[var(--color-accent)] text-white text-xs rounded-full px-1.5 shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div
                      className={`absolute ${
                        isRTL ? "left-0" : "right-0"
                      } mt-2 bg-white text-[var(--color-primary)] p-3 rounded-lg shadow-lg w-72 lg:w-96 z-50 max-h-64 overflow-y-auto border border-[var(--color-accent)] animate-slide-down`}
                    >
                      <h3 className="font-bold text-sm mb-2 border-b pb-1 flex justify-between items-center">
                        {t("notifications.title")}
                        <button
                          className="text-sm hover:underline text-[var(--color-secondary)]"
                          onClick={markNotificationAsReadAll}
                        >
                          {t("notifications.readAll")}
                        </button>
                      </h3>
                      {isLoadingNotifications ? (
                        <p className="text-sm">{t("notifications.loading")}</p>
                      ) : adminNotifications.length > 0 ? (
                        adminNotifications.map((notification) => {
                          const isInventoryNotification =
                            notification.PurchaseOrder === "Inventory";
                          const isDetailsNotification =
                            notification.PurchaseOrder === "details";

                          const productIdMatch = notification.content.match(
                            /product (.*) is below/
                          );
                          const productId =
                            isInventoryNotification && productIdMatch
                              ? productIdMatch[1]
                              : null;
                          console.log(productId);
                          // Extract employee ID from content (e.g., "מזהה: 507f1f77bcf86cd799439011")
                          const employeeIdMatch = notification.content.match(
                            /מזהה: ([a-fA-F0-9]{24})/
                          );
                          const employeeId =
                            isDetailsNotification && employeeIdMatch
                              ? employeeIdMatch[1]
                              : null;


                          return (
                            <div
                              key={notification._id}
                              onClick={() =>
                                !notification.isRead &&
                                !isInventoryNotification &&
                                !isDetailsNotification &&

                                markNotificationAsRead(notification._id)
                              }
                              className={`relative border-b mb-1 pb-1 pl-2 pr-4 rounded-lg ${
                                notification.isRead
                                  ? "bg-gray-100 opacity-70"
                                  : "bg-white hover:bg-[var(--color-accent)] hover:text-white"
                              } transition-all duration-200`}
                            >
                              {!isInventoryNotification && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification._id);
                                  }}
                                  className="absolute top-0 right-0 px-1 py-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs shadow-sm transition-all duration-200"
                                >
                                  ×
                                </button>
                              )}
                              <p className="text-sm">{notification.content}</p>
                              <span className="text-sm text-gray-500 block">
                                {new Date(
                                  notification.createdAt
                                ).toLocaleString()}
                              </span>
                              {isInventoryNotification &&
                                !notification.isRead && (
                                  <div className="mt-2 flex justify-end space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOrderClick(notification._id);
                                      }}
                                      className="px-2 py-1 bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-secondary)] text-xs transition-all duration-300"
                                    >
                                      {t("navbar.notifications.order")}
                                    </button>
                                  </div>
                                )}
                              {isDetailsNotification &&
                                !notification.isRead &&
                                employeeId && (
                                  <div className="mt-2 flex justify-end space-x-2">
                                    <a
                                      href={`/dashboard/employees?editEmployee=${employeeId}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markNotificationAsRead(
                                          notification._id
                                        );
                                      }}
                                      className="px-2 py-1 bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-secondary)] text-xs transition-all duration-300"
                                    >
                                      {t("notifications.fillDetails")}
                                    </a>
                                  </div>
                                )}
                              {isDetailsNotification &&
                                !notification.isRead &&
                                !employeeId && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {t("notifications.invalidEmployeeId")}
                                  </p>
                                )}

                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm">
                          {t("navbar.notifications.no_notifications")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="relative">
                <button
                  onClick={handleProfileClick}
                  className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border-2 border-[var(--color-accent)] overflow-hidden flex-shrink-0 shadow-sm hover:scale-105 transition-transform duration-200"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center ${avatarColorClass}`}
                    >
                      <span className="text-white text-base lg:text-lg font-bold">
                        {authUser?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </button>
                {showProfileDropdown && (
                  <div
                    className={`absolute ${
                      isRTL ? "left-0" : "right-0"
                    } mt-2 bg-white text-[var(--color-primary)] rounded-xl shadow-2xl p-4 w-72 z-50 border border-[var(--color-accent)] animate-profile-dropdown bg-gradient-to-b from-white to-gray-50`}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-full border-2 border-[var(--color-accent)] overflow-hidden shadow-sm">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center ${avatarColorClass}`}
                          >
                            <span className="text-white text-xl font-bold">
                              {authUser?.name?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-base font-bold text-[var(--color-primary)] tracking-tight">
                          {firstName} {lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">
                          {authUser?.email}
                        </p>
                        <p className="text-xs font-medium text-[var(--color-accent)]">
                          {t(`navbar.profile.roles.${authUser?.role}`)}
                        </p>
                      </div>
                    </div>
                    <hr className="border-gray-200 mb-3" />
                    <button
                      onClick={handleOpenPersonalModal}
                      className="w-full py-2 px-3 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-md flex items-center justify-center space-x-2 group"
                    >
                      <FaUserEdit className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span>{t("navbar.profile.updatePersonal")}</span>
                    </button>
                    {authUser?.role === "Admin" && (
                      <button
                        onClick={handleOpenCompanyModal}
                        className="w-full mt-2 py-2 px-3 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-md flex items-center justify-center space-x-2 group"
                      >
                        <FaBuilding className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        <span>{t("navbar.profile.updateCompany")}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <span className="hidden 2xl:block text-sm lg:text-base font-semibold truncate max-w-[150px] text-white">
                {t("navbar.profile.hello", { firstName, lastName })}
              </span>

              {/* Logout Button – Visible outside hamburger at 2xl and above */}
              <div className="hidden 2xl:block">
                <button
                  onClick={() => logout()}
                  className="px-2 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm lg:text-base transition-all duration-300 shadow-sm disabled:opacity-50"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut
                    ? t("navbar.profile.logging_out")
                    : t("navbar.profile.logout")}
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="px-2 py-1 bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-secondary)] text-sm lg:text-base transition-all duration-300 shadow-sm"
            >
              {t("navbar.profile.login")}
            </Link>
          )}
        </div>
      </div>

      {/* Hamburger Menu (Mobile – Visible below 2xl) */}
      {isLoggedIn && isMenuOpen && (
        <div className="2xl:hidden mt-2 bg-white text-[var(--color-primary)] rounded-lg shadow-lg p-3 w-full max-h-[80vh] overflow-y-auto border border-[var(--color-accent)] animate-slide-down">
          {navigationLinks.map((navItem, index) => (
            <div key={index} className="mb-2">
              {navItem.subMenu ? (
                <div>
                  <button
                    onClick={() => {
                      if (openDropdown === index) {
                        setOpenDropdown(null);
                        setOpenSubDropdown(null);
                      } else {
                        setOpenDropdown(index);
                        setOpenSubDropdown(null);
                      }
                    }}
                    className={`w-full py-1 text-[var(--color-primary)] font-medium hover:text-[var(--color-accent)] transition-all duration-300 ease-in-out relative group ${
                      index === 0 && isRTL ? "pr-8" : ""
                    }`}
                  >
                    <span>{navItem.label}</span>
                    <span className="absolute top-1/2 right-0 transform -translate-y-1/2 text-xs">
                      {openDropdown === index ? "▲" : "▼"}
                    </span>
                    <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[var(--color-accent)] transition-all duration-300 ease-in-out group-hover:w-full group-hover:left-0"></span>
                  </button>
                  {openDropdown === index &&
                    renderSubMenu(navItem.subMenu, index)}
                </div>
              ) : (
                <Link
                  to={navItem.to}
                  onClick={() => {
                    setOpenDropdown(null);
                    setOpenSubDropdown(null);
                    setIsMenuOpen(false);
                    setShowProfileDropdown(false);
                  }}
                  className={`block py-1 text-[var(--color-primary)] text-center font-medium hover:text-[var(--color-accent)] transition-all duration-300 ease-in-out relative group ${
                    index === 0 && isRTL ? "pr-0" : ""
                  }`}
                >
                  {navItem.label}
                  <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[var(--color-accent)] transition-all duration-300 ease-in-out group-hover:w-full group-hover:left-0"></span>
                </Link>
              )}
            </div>
          ))}
          {/* Logout Item in Hamburger Menu */}
          <div className="mt-2 border-t flex justify-center pt-2">
            <button
              onClick={() => {
                logout();
                setIsMenuOpen(false);
              }}
              className={`block py-1 text-red-600 font-medium hover:text-red-800 transition-all duration-300 ease-in-out relative group ${
                isRTL ? "text-right" : "text-left"
              }`}
              disabled={isLoggingOut}
            >
              {isLoggingOut
                ? t("navbar.profile.logging_out")
                : t("navbar.profile.logout")}
              <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-red-800 transition-all duration-300 ease-in-out group-hover:w-full group-hover:left-0"></span>
            </button>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-start justify-center z-50 px-2 sm:px-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 w-full max-w-xs sm:max-w-md lg:max-w-2xl relative border border-[var(--color-accent)] transform transition-all duration-300 scale-95 hover:scale-100">
            <h2 className="text-sm sm:text-lg lg:text-xl font-bold text-[var(--color-primary)] mb-2 sm:mb-4 text-center tracking-tight drop-shadow-sm">
              {selectedDocumentType === "budget"
                ? t("navbar.Signatures.budgetDocument")
                : t("navbar.Signatures.procurementDocument")}{" "}
              {t("navbar.Signatures.digital-Signature")}
            </h2>
            {selectedDocumentType === "budget" && selectedBudget && (
              <div className="mb-2 sm:mb-4 p-1 sm:p-2 lg:p-3 border rounded-xl bg-gray-50 text-sm lg:text-base shadow-sm">
                <h3 className="text-base lg:text-lg font-bold mb-2 text-[var(--color-primary)]">
                  {t("navbar.Signatures.budgetSummary")} -{" "}
                  {selectedBudget.budgetName}
                </h3>
                <p>
                  <strong>{t("navbar.Signatures.amount")}:</strong> $
                  {selectedBudget.amount}
                </p>
                <p>
                  <strong>{t("navbar.Signatures.department")}:</strong>{" "}
                  {selectedBudget.departmentId?.name ||
                    selectedBudget.departmentId}
                </p>
                <p>
                  <strong>{t("navbar.Signatures.description")}:</strong>{" "}
                  {selectedBudget.description}
                </p>
              </div>
            )}
            {selectedPDF && (
              <iframe
                src={selectedPDF}
                title="Document PDF"
                className="w-full h-32 sm:h-48 lg:h-64 mb-2 sm:mb-4 border rounded-xl shadow-md"
              />
            )}
            <SignatureCanvas
              ref={signaturePadRef}
              penColor="black"
              canvasProps={{
                width:
                  window.innerWidth < 640
                    ? 250
                    : window.innerWidth < 1024
                    ? 350
                    : 500,
                height:
                  window.innerWidth < 640
                    ? 100
                    : window.innerWidth < 1024
                    ? 120
                    : 150,
                className: "border rounded-xl w-full shadow-md",
              }}
            />
            <div className="flex justify-end mt-2 sm:mt-4 space-x-2">
              <button
                onClick={handleCloseModal}
                className="px-3 py-1.5 bg-red-600 text-white rounded-full text-sm lg:text-base hover:bg-red-700 transition-all duration-300 shadow-sm"
              >
                {t("events.cancel")}
              </button>
              <button
                onClick={handleSaveSignature}
                className="px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-full text-sm lg:text-base hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-sm"
              >
                {t("navbar.Signatures.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personal Details Modal */}
      {showPersonalModal && (
        <div className="fixed inset-0 bg-gray-700 top-[500px] bg-opacity-70 flex items-center justify-center z-50 px-2 sm:px-4 animate-fade-in">
          <div className="bg-white p-4 sm:p-6 text-text rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto relative border-2 border-gray-800 transform transition-all duration-300 scale-95 hover:scale-100">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--color-primary)] mb-4 text-center">
              {t("navbar.profile.updatePersonal")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Picture Section */}
              <div className="col-span-1 md:col-span-2 flex justify-center mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-2 border-[var(--color-accent)] overflow-hidden shadow-sm mb-2">
                    {personalForm.profileImage || authUser?.profileImage ? (
                      <img
                        src={
                          personalForm.profileImage || authUser?.profileImage
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center ${avatarColorClass}`}
                      >
                        <span className="text-white text-2xl font-bold">
                          {authUser?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    id="profileImage"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setPersonalForm((prev) => ({
                          ...prev,
                          profileImageFile: file,
                        }));
                        const reader = new FileReader();
                        reader.onload = () => {
                          setPersonalForm((prev) => ({
                            ...prev,
                            profileImage: reader.result,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="profileImage"
                    className="cursor-pointer px-4 py-2 bg-[var(--color-primary)] text-white rounded-full text-sm hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-sm"
                  >
                    {t("navbar.profile.uploadImage")}
                  </label>
                </div>
              </div>
              {/* Personal Information Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {t("navbar.profile.personalInfo")}
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: t("navbar.profile.firstName"),
                      name: "name",
                      type: "text",
                      required: true,
                    },
                    {
                      label: t("navbar.profile.lastName"),
                      name: "lastName",
                      type: "text",
                      required: true,
                    },
                    {
                      label: t("navbar.profile.email"),
                      name: "email",
                      type: "email",
                      required: true,
                    },
                    {
                      label: t("navbar.profile.gender"),
                      name: "gender",
                      type: "select",
                      required: true,
                      options: [
                        { value: "", label: t("navbar.profile.selectGender") },
                        { value: "Male", label: t("navbar.profile.male") },
                        { value: "Female", label: t("navbar.profile.female") },
                        { value: "Other", label: t("navbar.profile.other") },
                      ],
                    },
                    {
                      label: t("navbar.profile.identity"),
                      name: "identity",
                      type: "text",
                      required: true,
                    },
                    {
                      label: t("navbar.profile.phone"),
                      name: "phone",
                      type: "text",
                      required: true,
                    },
                  ].map((field) => (
                    <div
                      key={field.name}
                      className="flex items-center space-x-2"
                    >
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}{" "}
                          {field.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        {field.type === "select" ? (
                          <select
                            name={field.name}
                            value={personalForm[field.name]}
                            onChange={handlePersonalFormChange}
                            disabled={!editableFields[field.name]}
                            required={field.required}
                            aria-label={field.label}
                            tabIndex={0}
                            className={`block w-full px-3 py-2 border-2 ${
                              editableFields[field.name]
                                ? "border-gray-800 bg-white"
                                : "border-gray-400 bg-gray-100"
                            } rounded-lg shadow-lg focus:outline-none focus:ring-[var(--color-accent)] focus:border-gray-800 transition-all duration-200 text-sm`}
                          >
                            {field.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            name={field.name}
                            value={personalForm[field.name]}
                            onChange={handlePersonalFormChange}
                            disabled={!editableFields[field.name]}
                            required={field.required}
                            aria-label={field.label}
                            tabIndex={0}
                            className={`block w-full px-3 py-2 border-2 ${
                              editableFields[field.name]
                                ? "border-gray-800 bg-white"
                                : "border-gray-400 bg-gray-100"
                            } rounded-lg shadow-lg focus:outline-none focus:ring-[var(--color-accent)] focus:border-gray-800 transition-all duration-200 text-sm`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Address and Password Sections */}
              <div>
                {/* Address Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {t("navbar.profile.addressInfo")}
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: t("navbar.profile.address.street"),
                        name: "address.street",
                        type: "text",
                        required: true,
                      },
                      {
                        label: t("navbar.profile.address.city"),
                        name: "address.city",
                        type: "text",
                        required: true,
                      },
                      {
                        label: t("navbar.profile.address.country"),
                        name: "address.country",
                        type: "text",
                        required: true,
                      },
                      {
                        label: t("navbar.profile.address.postalCode"),
                        name: "address.postalCode",
                        type: "text",
                        required: true,
                      },
                    ].map((field) => (
                      <div
                        key={field.name}
                        className="flex items-center space-x-2"
                      >
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}{" "}
                            {field.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <input
                            type={field.type}
                            name={field.name}
                            value={
                              personalForm.address[field.name.split(".")[1]]
                            }
                            onChange={handlePersonalFormChange}
                            disabled={!editableFields[field.name]}
                            required={field.required}
                            aria-label={field.label}
                            tabIndex={0}
                            className={`block w-full px-3 py-2 border-2 ${
                              editableFields[field.name]
                                ? "border-gray-800 bg-white"
                                : "border-gray-400 bg-gray-100"
                            } rounded-lg shadow-lg focus:outline-none focus:ring-[var(--color-accent)] focus:border-gray-800 transition-all duration-200 text-sm`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Password Section */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {t("navbar.profile.passwordInfo")}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowPasswordFields(!showPasswordFields)}
                      className="w-full py-2 px-3 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-md flex items-center justify-center"
                    >
                      {t("navbar.profile.updatePassword")}
                    </button>
                  </div>
                  {showPasswordFields && (
                    <div className="space-y-3 mt-3">
                      {[
                        {
                          label: t("navbar.profile.currentPassword"),
                          name: "currentPassword",
                          type: "password",
                          required: true,
                        },
                        {
                          label: t("navbar.profile.newPassword"),
                          name: "newPassword",
                          type: "password",
                          required: true,
                        },
                        {
                          label: t("navbar.profile.confirmNewPassword"),
                          name: "confirmNewPassword",
                          type: "password",
                          required: true,
                        },
                      ].map((field) => (
                        <div
                          key={field.name}
                          className="flex items-center space-x-2"
                        >
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}{" "}
                              {field.required && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              type={field.type}
                              name={field.name}
                              value={personalForm[field.name]}
                              onChange={handlePersonalFormChange}
                              required={field.required}
                              aria-label={field.label}
                              aria-describedby={`${field.name}-error`}
                              tabIndex={0}
                              className="block w-full px-3 py-2 border-2 border-gray-800 bg-white rounded-lg shadow-lg focus:outline-none focus:ring-[var(--color-accent)] focus:border-gray-800 transition-all duration-200 text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              <button
                onClick={handleClosePersonalModal}
                className="px-4 py-2 bg-red-600 text-white rounded-full text-sm hover:bg-red-700 transition-all duration-300 shadow-sm"
              >
                {t("events.cancel")}
              </button>
              <button
                onClick={handlePersonalFormSubmit}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-full text-sm hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-sm"
              >
                {t("navbar.profile.save")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Company Details Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-gray-700 top-[550px] bg-opacity-70 flex items-center justify-center z-50 px-2 sm:px-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md lg:max-w-lg relative border-2 border-gray-800 transform transition-all duration-300 scale-95 hover:scale-100">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--color-primary)] mb-4 text-center">
              {t("navbar.profile.updateCompany")}
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: t("navbar.profile.companyName"),
                  name: "name",
                  type: "text",
                },
                {
                  label: t("navbar.profile.email"),
                  name: "email",
                  type: "email",
                },
                {
                  label: t("navbar.profile.phone"),
                  name: "phone",
                  type: "text",
                },
                {
                  label: t("navbar.profile.website"),
                  name: "website",
                  type: "text",
                },
                {
                  label: t("navbar.profile.address.street"),
                  name: "address.street",
                  type: "text",
                },
                {
                  label: t("navbar.profile.address.city"),
                  name: "address.city",
                  type: "text",
                },
                {
                  label: t("navbar.profile.address.state"),
                  name: "address.state",
                  type: "text",
                },
                {
                  label: t("navbar.profile.address.postalCode"),
                  name: "address.postalCode",
                  type: "text",
                },
                {
                  label: t("navbar.profile.address.country"),
                  name: "address.country",
                  type: "text",
                },
                {
                  label: t("navbar.profile.industry"),
                  name: "industry",
                  type: "select",
                  options: [
                    { value: "", label: t("navbar.profile.selectIndustry") },
                    ...[
                      "Technology",
                      "Retail",
                      "Finance",
                      "Healthcare",
                      "Education",
                      "Real Estate",
                      "Manufacturing",
                      "Hospitality",
                      "Transportation",
                      "Entertainment",
                      "Energy",
                      "Construction",
                      "Agriculture",
                      "Telecommunications",
                      "Aerospace",
                      "Nonprofit",
                      "Consulting",
                      "Government",
                      "Fashion",
                      "Food & Beverage",
                      "Sports",
                      "E-commerce",
                      "Media",
                      "Legal Services",
                      "Software Development",
                      "Hardware Development",
                      "Biotechnology",
                      "Pharmaceuticals",
                      "Automotive",
                      "Logistics",
                      "Gaming",
                      "Public Relations",
                      "Event Management",
                      "Advertising",
                      "Tourism",
                      "Mining",
                      "Chemical Industry",
                      "Art & Design",
                      "Publishing",
                      "Music & Performing Arts",
                      "Environmental Services",
                      "Security Services",
                      "Research & Development",
                      "Wholesale",
                      "Human Resources",
                      "Insurance",
                      "Digital Marketing",
                      "Data Analytics",
                      "Waste Management",
                      "Marine Industry",
                      "Electronics",
                      "Medical Devices",
                      "Architecture",
                      "Fitness & Wellness",
                      "Agritech",
                      "Fintech",
                      "Edtech",
                      "Healthtech",
                      "Proptech",
                      "SaaS",
                      "Cybersecurity",
                      "Nanotechnology",
                      "Blockchain",
                      "Artificial Intelligence",
                      "Other",
                    ].map((industry) => ({
                      value: industry,
                      label: t(`navbar.profile.industries.${industry}`),
                    })),
                  ],
                },
                {
                  label: t("navbar.profile.taxId"),
                  name: "taxId",
                  type: "text",
                },
              ].map((field) => (
                <div key={field.name} className="flex items-center space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    {field.type === "select" ? (
                      <select
                        name={field.name}
                        value={
                          field.name.includes("address.")
                            ? companyForm.address[field.name.split(".")[1]]
                            : companyForm[field.name]
                        }
                        onChange={handleCompanyFormChange}
                        disabled={!editableFields[field.name]}
                        aria-label={field.label}
                        tabIndex={0}
                        className={`block w-full px-3 py-2 border-2 ${
                          editableFields[field.name]
                            ? "border-gray-800 bg-white"
                            : "border-gray-400 bg-gray-100"
                        } rounded-lg shadow-lg focus:outline-none focus:ring-[var(--color-accent)] focus:border-gray-800 transition-all duration-200 text-sm`}
                      >
                        {field.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={
                          field.name.includes("address.")
                            ? companyForm.address[field.name.split(".")[1]]
                            : companyForm[field.name]
                        }
                        onChange={handleCompanyFormChange}
                        disabled={!editableFields[field.name]}
                        aria-label={field.label}
                        tabIndex={0}
                        className={`block w-full px-3 py-2 border-2 ${
                          editableFields[field.name]
                            ? "border-gray-800 bg-white"
                            : "border-gray-400 bg-gray-100"
                        } rounded-lg shadow-lg focus:outline-none focus:ring-[var(--color-accent)] focus:border-gray-800 transition-all duration-200 text-sm`}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => toggleFieldEdit(field.name)}
                    className="p-2 pt-8 flex text-white rounded-full hover:bg-[var(--color-secondary)] transition-all duration-200 shadow-sm border-none"
                    title={
                      editableFields[field.name]
                        ? t("navbar.profile.lock")
                        : t("navbar.profile.edit")
                    }
                  >
                    <FaEdit className="w-6 h-6 text-[var(--color-accent)]" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              <button
                onClick={handleCloseCompanyModal}
                className="px-4 py-2 bg-red-600 text-white rounded-full text-sm hover:bg-red-700 transition-all duration-300 shadow-sm"
              >
                {t("events.cancel")}
              </button>
              <button
                onClick={handleCompanyFormSubmit}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-full text-sm hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-sm disabled:opacity-50"
                disabled={Object.keys(editableFields).length === 0}
              >
                {t("navbar.profile.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes profileDropdown {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out forwards;
        }
        .animate-profile-dropdown {
          animation: profileDropdown 0.3s ease-out forwards;
        }
        .group:hover .group-hover\\:w-full {
          width: 100%;
        }
        .group:hover .group-hover\\:left-0 {
          left: 0;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
