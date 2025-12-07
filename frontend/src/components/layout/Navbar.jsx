import { useState, useRef, useEffect, useMemo } from "react";
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
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useUserPermissions } from "../../hooks/usePermission";

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
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
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
      try {
      const response = await axiosInstance.get("/auth/me");
        return response.data || null;
      } catch (error) {
        if (error.code === 'ERR_CONNECTION_REFUSED' || error.message?.includes('Network Error')) {
          return null; // Server is not running - return null instead of undefined
        }
        if (error.response?.status === 401) {
          return null; // Not authenticated
        }
        return null; // Always return a value, never undefined
      }
    },
    retry: false, // Don't retry on connection errors
    refetchOnWindowFocus: false, // Don't refetch when window gains focus if server is down
  });

  const authUser = authData?.user;
  const firstName = authUser?.name || "Guest";
  const lastName = authUser?.lastName || "";
  const profileImage = authUser?.profileImage;
  const isLoggedIn = !!authUser;

  // Query: User Permissions
  const { permissions: userPermissions, isLoading: isLoadingPermissions } = useUserPermissions();
  
  // Debug: Log permissions
  useEffect(() => {
    console.log("🔐 [Navbar] Permissions State:", {
      isLoadingPermissions,
      hasPermissions: !!userPermissions,
      permissions: userPermissions,
      userRole: authUser?.role,
      permissionKeys: userPermissions ? Object.keys(userPermissions) : [],
    });
  }, [userPermissions, isLoadingPermissions, authUser?.role]);

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
    enabled: isLoggedIn, // Only fetch if user is logged in
    retry: false, // Don't retry on error
  });

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
    if (isError && isLoggedIn) {
      console.error("Error fetching employee details:", error);
      // Silently handle the error - user might not have employee record yet
    }
  }, [users, isError, error, isLoggedIn]);

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
        (signer) => {
          // Handle both ObjectId and string comparison
          const signerEmployeeId = signer.employeeId?._id 
            ? signer.employeeId._id.toString() 
            : signer.employeeId?.toString() || signer.employeeId;
          const userEmployeeId = authUser?.employeeId?._id 
            ? authUser.employeeId._id.toString() 
            : authUser?.employeeId?.toString() || authUser?.employeeId;
          return signerEmployeeId === userEmployeeId && !signer.hasSigned;
        }
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
      // בדיקה ש-authUser קיים ויש לו employeeId
      if (!authUser || !authUser.employeeId) {
        toast.error(t("navbar.Signatures.userNotAuthenticated") || "User not authenticated. Please log in again.");
        console.error("Auth user or employeeId is missing:", { authUser, employeeId: authUser?.employeeId });
        return;
      }

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
        // קבלת employeeId - יכול להיות string או object עם _id
        const employeeId = authUser.employeeId?._id 
          ? authUser.employeeId._id.toString() 
          : authUser.employeeId?.toString() || authUser.employeeId;

        if (!employeeId) {
          toast.error(t("navbar.Signatures.employeeIdMissing") || "Employee ID is missing. Please contact support.");
          return;
        }

        await axiosInstance.post(endpoint, {
          employeeId: employeeId,
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
      
      // Try to get product from metadata (new format)
      let productData = null;
      let reorderQuantity = 0;
      
      if (notification?.metadata?.products && notification.metadata.products.length > 0) {
        // New format - get all data from metadata
        const firstProduct = notification.metadata.products[0];
        productData = {
          productId: firstProduct.productId,
          productName: firstProduct.productName,
          quantity: firstProduct.quantity,
          minStockLevel: firstProduct.minStockLevel,
          reorderQuantity: firstProduct.reorderQuantity || 0,
        };
        reorderQuantity = firstProduct.reorderQuantity || 0;
        
        // Fetch full product details
        try {
          const productResponse = await axiosInstance.get(`/product/${firstProduct.productId}`);
          if (productResponse.data.success) {
            const fullProduct = productResponse.data.data;
            productData = {
              ...productData,
              unitPrice: fullProduct.unitPrice || 0,
              sku: fullProduct.sku || "",
              category: fullProduct.category || "",
              supplierId: fullProduct.supplierId || "",
            };
          }
        } catch (err) {
          console.warn("לא ניתן לטעון פרטי מוצר מלאים:", err);
        }
      } else {
        // Fallback to old format (extract from content)
        const productNameMatch = notification?.content.match(
          /The quantity of the product "?([^"]*)"?(?= is below the minimum stock level)/
        );
        const productName = productNameMatch ? productNameMatch[1] : null;
        if (!productName) {
          throw new Error("לא ניתן לחלץ את שם המוצר מההתראה");
        }
        
        // Search for product by name
        const productSearchResp = await axiosInstance.get(
          `/product/search-by-name`,
          { params: { name: productName } }
        );
        
        if (!productSearchResp.data.success || !productSearchResp.data.data?.length) {
          throw new Error("לא נמצא מוצר עם השם הזה");
        }
        
        const product = productSearchResp.data.data[0];
        productData = {
          productId: product._id,
          productName: product.productName,
          unitPrice: product.unitPrice || 0,
          sku: product.sku || "",
          category: product.category || "",
          supplierId: product.supplierId || "",
        };
        
        // Get reorder quantity from inventory
        try {
          const inventoryResponse = await axiosInstance.get(`/inventory/${product._id}`);
          reorderQuantity = inventoryResponse.data.data?.reorderQuantity || 0;
        } catch (err) {
          console.warn(`הבאת מלאי נכשלה:`, err);
        }
      }
      
      if (!productData?.productId) {
        throw new Error("מזהה המוצר חסר");
      }

      // Fetch supplier details
      let supplier = {};
      if (productData.supplierId) {
        try {
          const supplierResponse = await axiosInstance.get(
            `/suppliers/${productData.supplierId}`
          );
          if (supplierResponse.data.success) {
            supplier = supplierResponse.data.data;
          } else {
            throw new Error("נכשל בהבאת פרטי הספק");
          }
        } catch (err) {
          console.error(`הבאת ספק נכשלה:`, err.message);
          supplier = {
            _id: productData.supplierId,
            SupplierName: "ספק לא ידוע",
            baseCurrency: "USD",
          };
        }
      } else {
        supplier = { SupplierName: "ספק לא ידוע", baseCurrency: "USD" };
      }

      // Mark notification as read
      await axiosInstance.post(`/notifications/mark-as-read`, {
        notificationId,
      });

      // Navigate with all data
      const stateData = {
        productId: productData.productId,
        productName: productData.productName,
        supplierId: supplier._id || productData.supplierId,
        supplierName: supplier.SupplierName || "ספק לא ידוע",
        baseCurrency: supplier.baseCurrency || "USD",
        quantity: reorderQuantity || productData.reorderQuantity || 10,
        unitPrice: productData.unitPrice || 0,
        sku: productData.sku || "",
        category: productData.category || "",
        currentQuantity: productData.quantity || 0,
        minStockLevel: productData.minStockLevel || 0,
      };
      
      console.log("📦 Navigating to procurement with data:", stateData);
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
    { 
      label: t("navbar.dashboard"), 
      to: "/dashboard",
      // Dashboard is always accessible for Admin, Manager, and Employee
      // No permission check needed for dashboard
    },
    {
      label: t("navbar.products"),
      requiredPermission: { module: "products", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/products", 
          text: t("navbar.all_products"),
          requiredPermission: { module: "products", action: "view" },
        },
        { 
          to: "/dashboard/add-product", 
          text: t("navbar.add_product"),
          requiredPermission: { module: "products", action: "create" },
        },
        { 
          to: "/dashboard/inventory", 
          text: t("navbar.inventory_management"),
          requiredPermission: { module: "inventory", action: "view" },
        },
        { 
          to: "/dashboard/production", 
          text: "הזמנות ייצור",
          requiredPermission: { module: "products", action: "view" },
        },
        { 
          to: "/dashboard/production/create", 
          text: "יצירת הזמנת ייצור",
          requiredPermission: { module: "products", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.supplier"),
      requiredPermission: { module: "suppliers", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/supplier", 
          text: t("navbar.all_suppliers"),
          requiredPermission: { module: "suppliers", action: "view" },
        },
        { 
          to: "/dashboard/add-supplier", 
          text: t("navbar.add_supplier"),
          requiredPermission: { module: "suppliers", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.warehouses", { defaultValue: "Warehouses" }),
      requiredPermission: { module: "inventory", action: "view" },
      subMenu: [
        {
          to: "/dashboard/warehouses",
          text: t("navbar.warehouse_management", { defaultValue: "Warehouse Management" }),
          requiredPermission: { module: "inventory", action: "view" },
        },
        {
          to: "/dashboard/inventory/transfer",
          text: t("navbar.inventory_transfer", { defaultValue: "Inventory Transfer" }),
          requiredPermission: { module: "inventory", action: "view" },
        },
        {
          label: t("navbar.inventory_advanced", { defaultValue: "Inventory Advanced" }),
          requiredPermission: { module: "inventory", action: "view" },
          subMenu: [
            {
              to: "/dashboard/inventory/stock-counts",
              text: t("navbar.stock_counts", { defaultValue: "Stock Counts" }),
              requiredPermission: { module: "inventory", action: "view" },
            },
            {
              to: "/dashboard/inventory/movements",
              text: t("navbar.inventory_movements", { defaultValue: "Inventory Movements" }),
              requiredPermission: { module: "inventory", action: "view" },
            },
            {
              to: "/dashboard/inventory/quality",
              text: t("navbar.quality_checks", { defaultValue: "Quality Checks" }),
              requiredPermission: { module: "inventory", action: "view" },
            },
            {
              to: "/dashboard/inventory/stock-counts/add",
              text: t("navbar.add_stock_count", { defaultValue: "Add Stock Count" }),
              requiredPermission: { module: "inventory", action: "create" },
            },
            {
              to: "/dashboard/inventory/movements/add",
              text: t("navbar.add_inventory_movement", { defaultValue: "Add Inventory Movement" }),
              requiredPermission: { module: "inventory", action: "create" },
            },
            {
              to: "/dashboard/inventory/quality/add",
              text: t("navbar.add_quality_check", { defaultValue: "Add Quality Check" }),
              requiredPermission: { module: "inventory", action: "create" },
            },
          ],
        },
      ],
    },
    {
      label: t("navbar.assets", { defaultValue: "Assets" }),
      requiredPermission: { module: "assets", action: "view" },
      subMenu: [
        {
          to: "/dashboard/assets",
          text: t("navbar.all_assets", { defaultValue: "All Assets" }),
          requiredPermission: { module: "assets", action: "view" },
        },
        {
          to: "/dashboard/assets/add",
          text: t("navbar.add_asset", { defaultValue: "Add Asset" }),
          requiredPermission: { module: "assets", action: "create" },
        },
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
      requiredPermission: { module: "finance", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/finance", 
          text: t("navbar.finance_records"),
          requiredPermission: { module: "finance", action: "view" },
        },
        {
          to: "/dashboard/finance/cash-flow",
          text: t("navbar.cash_flow"),
          requiredPermission: { module: "finance", action: "view" },
        },
        {
          to: "/dashboard/add-finance-record",
          text: t("navbar.create_finance_record"),
          requiredPermission: { module: "finance", action: "create" },
        },
        {
          to: "/dashboard/payroll/automation",
          text: "אוטומציה של משכורות",
          requiredPermission: { module: "finance", action: "view" },
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
          requiredPermission: { module: "budgets", action: "view" },
          subMenu: [
            {
              to: "/dashboard/finance/budgets",
              text: t("navbar.budget_records"),
              requiredPermission: { module: "budgets", action: "view" },
            },
            {
              to: "/dashboard/finance/add-budget",
              text: t("navbar.create_budget_record"),
              requiredPermission: { module: "budgets", action: "create" },
            },
          ],
        },
        {
          label: t("navbar.accounting", { defaultValue: "Accounting" }),
          requiredPermission: { module: "finance", action: "view" },
          subMenu: [
            {
              to: "/dashboard/accounting/accounts",
              text: t("navbar.accounts", { defaultValue: "Accounts" }),
              requiredPermission: { module: "finance", action: "view" },
            },
            {
              to: "/dashboard/accounting/accounts/add",
              text: t("navbar.add_account", { defaultValue: "Add Account" }),
              requiredPermission: { module: "finance", action: "create" },
            },
            {
              to: "/dashboard/accounting/reports",
              text: t("navbar.financial_reports", { defaultValue: "Financial Reports" }),
              requiredPermission: { module: "finance", action: "view" },
            },
          ],
        },
        {
          label: t("navbar.banks", { defaultValue: "Banks" }),
          requiredPermission: { module: "finance", action: "view" },
          subMenu: [
            {
              to: "/dashboard/banks/accounts",
              text: t("navbar.bank_accounts", { defaultValue: "Bank Accounts" }),
              requiredPermission: { module: "finance", action: "view" },
            },
            {
              to: "/dashboard/banks/accounts/add",
              text: t("navbar.add_bank_account", { defaultValue: "Add Bank Account" }),
              requiredPermission: { module: "finance", action: "create" },
            },
            {
              to: "/dashboard/accounting/accounts/add",
              text: t("navbar.add_account", { defaultValue: "Add Account" }),
              requiredPermission: { module: "finance", action: "create" },
            },
          ],
        },
      ],
    },
    {
      label: t("navbar.procurement"),
      requiredPermission: { module: "procurement", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/procurement", 
          text: t("navbar.procurement"),
          requiredPermission: { module: "procurement", action: "view" },
        },
        {
          to: "/dashboard/add-procurement-record",
          text: t("navbar.create_procurement_record"),
          requiredPermission: { module: "procurement", action: "create" },
        },
        {
          to: "/dashboard/procurement/approveProcurment",
          text: t("navbar.receipt_purchase"),
          requiredPermission: { module: "procurement", action: "approve" },
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
        {
          label: t("navbar.procurement_advanced", { defaultValue: "Procurement Advanced" }),
          requiredPermission: { module: "procurement", action: "view" },
          subMenu: [
            {
              to: "/dashboard/procurement/purchase-requests",
              text: t("navbar.purchase_requests", { defaultValue: "Purchase Requests" }),
              requiredPermission: { module: "procurement", action: "view" },
            },
            {
              to: "/dashboard/procurement/tenders",
              text: t("navbar.tenders", { defaultValue: "Tenders" }),
              requiredPermission: { module: "procurement", action: "view" },
            },
            {
              to: "/dashboard/procurement/supplier-contracts",
              text: t("navbar.supplier_contracts", { defaultValue: "Supplier Contracts" }),
              requiredPermission: { module: "procurement", action: "view" },
            },
            {
              to: "/dashboard/procurement/price-lists",
              text: t("navbar.price_lists", { defaultValue: "Price Lists" }),
              requiredPermission: { module: "procurement", action: "view" },
            },
            {
              to: "/dashboard/procurement/supplier-invoices",
              text: t("navbar.supplier_invoices", { defaultValue: "Supplier Invoices" }),
              requiredPermission: { module: "procurement", action: "view" },
            },
            {
              to: "/dashboard/procurement/supply-schedules",
              text: t("navbar.supply_schedules", { defaultValue: "Supply Schedules" }),
              requiredPermission: { module: "procurement", action: "view" },
            },
          ],
        },
      ],
    },
    {
      label: t("navbar.Projects"),
      requiredPermission: { module: "projects", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/projects", 
          text: t("navbar.Projects_List"),
          requiredPermission: { module: "projects", action: "view" },
        },
        {
          to: "/dashboard/projects/add-project",
          text: t("navbar.Add_Project"),
          requiredPermission: { module: "projects", action: "create" },
        },
        {
          to: "/dashboard/projects/gantt",
          text: t("navbar.Project_Gantt", { defaultValue: "Gantt Chart" }),
          requiredPermission: { module: "projects", action: "view" },
        },
        {
          to: "/dashboard/projects/timeline",
          text: t("navbar.Project_Timeline", { defaultValue: "Timeline" }),
          requiredPermission: { module: "projects", action: "view" },
        },
        {
          to: "/dashboard/projects/resources",
          text: t("navbar.Project_Resources", { defaultValue: "Resources" }),
          requiredPermission: { module: "projects", action: "view" },
        },
        {
          to: "/dashboard/projects/portfolio",
          text: t("navbar.Project_Portfolio", { defaultValue: "Portfolio" }),
          requiredPermission: { module: "projects", action: "view" },
        },
        {
          to: "/dashboard/projects/capacity",
          text: t("navbar.Resource_Capacity", { defaultValue: "Resource Capacity" }),
          requiredPermission: { module: "projects", action: "view" },
        },
        {
          to: "/dashboard/projects/templates",
          text: t("navbar.Project_Templates", { defaultValue: "Templates" }),
          requiredPermission: { module: "projects", action: "view" },
        },
        {
          to: "/dashboard/projects/risks",
          text: t("navbar.Project_Risks", { defaultValue: "Risk Management" }),
          requiredPermission: { module: "projects", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.employees"),
      requiredPermission: { module: "employees", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/employees", 
          text: t("navbar.all_employees"),
          requiredPermission: { module: "employees", action: "view" },
        },
        { 
          to: "/dashboard/employees/directory", 
          text: "ספריית עובדים",
          requiredPermission: { module: "employees", action: "view" },
        },
        { 
          to: "/dashboard/signup", 
          text: t("navbar.new_employee"),
          requiredPermission: { module: "employees", action: "create" },
        },
        { 
          to: "/dashboard/roles", 
          text: t("navbar.permissions_management") || "ניהול הרשאות",
          requiredPermission: { module: "employees", action: "view" }, // Only Admin can see this
        },
      ],
    },
    {
      label: t("navbar.hr") || "HR Management",
      requiredPermission: { module: "employees", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/hr/analytics", 
          text: t("navbar.hr_analytics") || "HR Analytics",
          requiredPermission: { module: "employees", action: "view" },
        },
        { 
          to: "/dashboard/hr/ats/job-postings", 
          text: t("navbar.job_postings") || "Job Postings",
          requiredPermission: { module: "employees", action: "view" },
        },
        { 
          to: "/dashboard/hr/ats/applicants", 
          text: t("navbar.applicants") || "Applicants",
          requiredPermission: { module: "employees", action: "view" },
        },
        { 
          to: "/dashboard/hr/lms/courses", 
          text: t("navbar.courses") || "Courses",
          requiredPermission: { module: "employees", action: "view" },
        },
        { 
          to: "/dashboard/hr/attendance", 
          text: t("navbar.attendance") || "Attendance",
          requiredPermission: { module: "employees", action: "view" },
        },
        { 
          to: "/dashboard/hr/leave/requests", 
          text: t("navbar.leave_requests") || "Leave Requests",
          requiredPermission: { module: "employees", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.signatures"),
      requiredPermission: { module: "signatures", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/historySignature", 
          text: t("navbar.my_signature"),
          requiredPermission: { module: "signatures", action: "view" },
        },
        {
          to: "/dashboard/historyAllSignature",
          text: t("navbar.all_signatures"),
          requiredPermission: { module: "signatures", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.department"),
      requiredPermission: { module: "departments", action: "view" },
      subMenu: [
        {
          to: "/dashboard/department/Add-Department",
          text: t("navbar.add_department"),
          requiredPermission: { module: "departments", action: "create" },
        },
        {
          to: "/dashboard/department/DepartmentList",
          text: t("navbar.departmentList"),
          requiredPermission: { module: "departments", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.review"),
      requiredPermission: { module: "reports", action: "view" },
      subMenu: [
        {
          to: "/dashboard/AddPerformanceReview",
          text: t("navbar.add_reviewForm"),
          requiredPermission: { module: "reports", action: "create" },
        },
        { 
          to: "/dashboard/performance-reviews", 
          text: t("navbar.review_List"),
          requiredPermission: { module: "reports", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.tasks"),
      requiredPermission: { module: "tasks", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/tasks", 
          text: t("navbar.tasks"),
          requiredPermission: { module: "tasks", action: "view" },
        },
        { 
          to: "/dashboard/tasks/Add-Tasks", 
          text: t("navbar.add_tasks"),
          requiredPermission: { module: "tasks", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.Orders"),
      requiredPermission: { module: "customers", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/Customers/Orders", 
          text: t("navbar.Orders List"),
          requiredPermission: { module: "customers", action: "view" },
        },
        { 
          to: "/dashboard/Customers/AddOrder", 
          text: t("navbar.Add-Orders"),
          requiredPermission: { module: "customers", action: "create" },
        },
        { 
          to: "/dashboard/orders/preparation", 
          text: "הזמנות להכנה",
          requiredPermission: { module: "customers", action: "view" },
        },
        { 
          to: "/dashboard/orders/tracking", 
          text: "מעקב משלוחים",
          requiredPermission: { module: "customers", action: "view" },
        },
        {
          label: t("navbar.customer"),
          requiredPermission: { module: "customers", action: "view" },
          subMenu: [
            { 
              to: "/dashboard/Customers", 
              text: t("navbar.customer_list"),
              requiredPermission: { module: "customers", action: "view" },
            },
            {
              to: "/dashboard/Customers/Add-Customer",
              text: t("navbar.add_customer"),
              requiredPermission: { module: "customers", action: "create" },
            },
            {
              to: "/dashboard/leads",
              text: t("navbar.leads_management") || "ניהול לידים",
              requiredPermission: { module: "customers", action: "view" },
            },
            {
              to: "/dashboard/activities",
              text: t("navbar.activities") || "פעילויות",
              requiredPermission: { module: "customers", action: "view" },
            },
            {
              to: "/dashboard/leads/analytics",
              text: t("navbar.leads_analytics") || "אנליטיקת לידים",
              requiredPermission: { module: "customers", action: "view" },
            },
            {
              label: t("navbar.advanced_crm") || "Advanced CRM",
              requiredPermission: { module: "customers", action: "view" },
              subMenu: [
                {
                  to: "/dashboard/Customers/Segmentation",
                  text: t("navbar.customer_segmentation") || "Customer Segmentation",
                  requiredPermission: { module: "customers", action: "view" },
                },
                {
                  to: "/dashboard/Customers/Satisfaction",
                  text: t("navbar.customer_satisfaction") || "Customer Satisfaction",
                  requiredPermission: { module: "customers", action: "view" },
                },
                {
                  to: "/dashboard/Customers/Retention",
                  text: t("navbar.customer_retention") || "Customer Retention",
                  requiredPermission: { module: "customers", action: "view" },
                },
              ],
            },
          ],
        },
        {
          label: t("navbar.sales", { defaultValue: "Sales" }),
          requiredPermission: { module: "customers", action: "view" },
          subMenu: [
            {
              to: "/dashboard/sales/opportunities",
              text: t("navbar.sales_opportunities", { defaultValue: "Sales Opportunities" }),
              requiredPermission: { module: "customers", action: "view" },
            },
            {
              to: "/dashboard/sales/opportunities/add",
              text: t("navbar.add_opportunity", { defaultValue: "Add Opportunity" }),
              requiredPermission: { module: "customers", action: "create" },
            },
            {
              to: "/dashboard/sales/pipeline",
              text: t("navbar.sales_pipeline", { defaultValue: "Sales Pipeline" }),
              requiredPermission: { module: "customers", action: "view" },
            },
          ],
        },
        {
          label: t("navbar.contracts", { defaultValue: "Contracts" }),
          requiredPermission: { module: "customers", action: "view" },
          subMenu: [
            {
              to: "/dashboard/contracts",
              text: t("navbar.all_contracts", { defaultValue: "All Contracts" }),
              requiredPermission: { module: "customers", action: "view" },
            },
            {
              to: "/dashboard/contracts/add",
              text: t("navbar.add_contract", { defaultValue: "Add Contract" }),
              requiredPermission: { module: "customers", action: "create" },
            },
          ],
        },
        {
          label: t("navbar.customer_service", { defaultValue: "Customer Service" }),
          requiredPermission: { module: "customers", action: "view" },
          subMenu: [
            {
              to: "/dashboard/customer-service/tickets",
              text: t("navbar.service_tickets", { defaultValue: "Service Tickets" }),
              requiredPermission: { module: "customers", action: "view" },
            },
            {
              to: "/dashboard/customer-service/tickets/add",
              text: t("navbar.add_service_ticket", { defaultValue: "Add Service Ticket" }),
              requiredPermission: { module: "customers", action: "create" },
            },
            {
              to: "/dashboard/sales/opportunities/add",
              text: t("navbar.add_opportunity", { defaultValue: "Add Opportunity" }),
              requiredPermission: { module: "customers", action: "create" },
            },
            {
              to: "/dashboard/contracts/add",
              text: t("navbar.add_contract", { defaultValue: "Add Contract" }),
              requiredPermission: { module: "customers", action: "create" },
            },
          ],
        },
      ],
    },
    {
      label: t("navbar.calendar"),
      requiredPermission: { module: "events", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/Events", 
          text: t("navbar.events"),
          requiredPermission: { module: "events", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.support_tickets"),
      requiredPermission: { module: "settings", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/support-tickets", 
          text: t("navbar.support_tickets_list"),
          requiredPermission: { module: "settings", action: "view" },
        },
        { 
          to: "/dashboard/support-tickets/create", 
          text: t("navbar.create_support_ticket"),
          requiredPermission: { module: "settings", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.invoices"),
      requiredPermission: { module: "invoices", action: "view" },
      subMenu: [
        { 
          to: "/dashboard/invoices", 
          text: t("navbar.invoices_list"),
          requiredPermission: { module: "invoices", action: "view" },
        },
        { 
          to: "/dashboard/invoices/create", 
          text: t("navbar.create_invoice"),
          requiredPermission: { module: "invoices", action: "create" },
        },
      ],
    },
  ];

  const managerLinks = [
    { 
      label: t("navbar.dashboard"), 
      to: "/employee",
      // Dashboard is always accessible
    },
    {
      label: t("navbar.products"),
      requiredPermission: { module: "products", action: "view" },
      subMenu: [
        { 
          to: "/employee/products", 
          text: t("navbar.all_products"),
          requiredPermission: { module: "products", action: "view" },
        },
        { 
          to: "/employee/add-product", 
          text: t("navbar.add_product"),
          requiredPermission: { module: "products", action: "create" },
        },
        { 
          to: "/dashboard/inventory", 
          text: t("navbar.inventory_management"),
          requiredPermission: { module: "inventory", action: "view" },
        },
        { 
          to: "/dashboard/production", 
          text: "הזמנות ייצור",
          requiredPermission: { module: "products", action: "view" },
        },
        { 
          to: "/dashboard/production/create", 
          text: "יצירת הזמנת ייצור",
          requiredPermission: { module: "products", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.supplier"),
      requiredPermission: { module: "suppliers", action: "view" },
      subMenu: [
        { 
          to: "/employee/supplier", 
          text: t("navbar.all_suppliers"),
          requiredPermission: { module: "suppliers", action: "view" },
        },
        { 
          to: "/employee/add-supplier", 
          text: t("navbar.add_supplier"),
          requiredPermission: { module: "suppliers", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.shifts"),
      requiredPermission: { module: "shifts", action: "view" },
      subMenu: [
        { 
          to: "/employee/Shifts-List", 
          text: t("navbar.Shifts-List"),
          requiredPermission: { module: "shifts", action: "view" },
        },
        { 
          to: "/employee/My-Shifts", 
          text: t("navbar.My-Shifts"),
          requiredPermission: { module: "shifts", action: "view" },
        },
        { 
          to: "/employee/job-percentages", 
          text: t("navbar.job-percentages"),
          requiredPermission: { module: "shifts", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.finance"),
      requiredPermission: { module: "finance", action: "view" },
      subMenu: [
        { 
          to: "/employee/finance", 
          text: t("navbar.finance_records"),
          requiredPermission: { module: "finance", action: "view" },
        },
        {
          to: "/employee/add-finance-record",
          text: t("navbar.create_finance_record"),
          requiredPermission: { module: "finance", action: "create" },
        },
        {
          to: "/employee/salary",
          text: t("navbar.salary"),
        },
        {
          to: "/employee/TaxConfig",
          text: t("navbar.TaxConfig"),
        },
        {
          to: "/employee/Vacation",
          text: t("navbar.Vacation"),
        },
      ],
    },
    {
      label: t("navbar.Budget"),
      requiredPermission: { module: "budgets", action: "view" },
      subMenu: [
        {
          to: "/employee/finance/Budgets",
          text: t("navbar.budget_records"),
          requiredPermission: { module: "budgets", action: "view" },
        },
        {
          to: "/employee/finance/add-budget",
          text: t("navbar.create_budget_record"),
          requiredPermission: { module: "budgets", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.procurement"),
      requiredPermission: { module: "procurement", action: "view" },
      subMenu: [
        { 
          to: "/employee/procurement", 
          text: t("navbar.procurement"),
          requiredPermission: { module: "procurement", action: "view" },
        },
        {
          to: "/employee/add-procurement-record",
          text: t("navbar.create_procurement_record"),
          requiredPermission: { module: "procurement", action: "create" },
        },
        {
          to: "/employee/procurement/approveProcurment",
          text: t("navbar.receipt_purchase"),
          requiredPermission: { module: "procurement", action: "approve" },
        },
        {
          label: t("navbar.ProcurementProposals"),
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
      ],
    },
    {
      label: t("navbar.Projects"),
      requiredPermission: { module: "projects", action: "view" },
      subMenu: [
        { 
          to: "/employee/projects", 
          text: t("navbar.Projects_List"),
          requiredPermission: { module: "projects", action: "view" },
        },
        {
          to: "/employee/projects/add-project",
          text: t("navbar.Add_Project"),
          requiredPermission: { module: "projects", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.employees"),
      requiredPermission: { module: "employees", action: "view" },
      subMenu: [
        { 
          to: "/employee/employees", 
          text: t("navbar.all_employees"),
          requiredPermission: { module: "employees", action: "view" },
        },
        { 
          to: "/employee/signup", 
          text: t("navbar.new_employee"),
          requiredPermission: { module: "employees", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.hr") || "HR",
      requiredPermission: { module: "employees", action: "view" },
      subMenu: [
        { 
          to: "/employee/self-service", 
          text: t("navbar.self_service") || "Self Service",
          requiredPermission: { module: "employees", action: "view" },
        },
        { 
          to: "/employee/hr/leave/request", 
          text: t("navbar.request_leave") || "Request Leave",
          requiredPermission: { module: "employees", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.signatures"),
      requiredPermission: { module: "signatures", action: "view" },
      subMenu: [
        { 
          to: "/employee/historySignature", 
          text: t("navbar.my_signature"),
          requiredPermission: { module: "signatures", action: "view" },
        },
        {
          to: "/employee/historyAllSignature",
          text: t("navbar.all_signatures"),
          requiredPermission: { module: "signatures", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.department"),
      requiredPermission: { module: "departments", action: "view" },
      subMenu: [
        {
          to: "/employee/department/Add-Department",
          text: t("navbar.add_department"),
          requiredPermission: { module: "departments", action: "create" },
        },
        {
          to: "/employee/department/DepartmentList",
          text: t("navbar.departmentList"),
          requiredPermission: { module: "departments", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.review"),
      requiredPermission: { module: "reports", action: "view" },
      subMenu: [
        {
          to: "/employee/AddPerformanceReview",
          text: t("navbar.add_reviewForm"),
          requiredPermission: { module: "reports", action: "create" },
        },
        { 
          to: "/employee/performance-reviews", 
          text: t("navbar.review_List"),
          requiredPermission: { module: "reports", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.tasks"),
      requiredPermission: { module: "tasks", action: "view" },
      subMenu: [
        { 
          to: "/employee/tasks", 
          text: t("navbar.tasks"),
          requiredPermission: { module: "tasks", action: "view" },
        },
        { 
          to: "/employee/tasks/Add-Tasks", 
          text: t("navbar.add_tasks"),
          requiredPermission: { module: "tasks", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.Orders"),
      requiredPermission: { module: "customers", action: "view" },
      subMenu: [
        { 
          to: "/employee/Customers/Orders", 
          text: t("navbar.Orders List"),
          requiredPermission: { module: "customers", action: "view" },
        },
        { 
          to: "/employee/Customers/AddOrder", 
          text: t("navbar.Add-Orders"),
          requiredPermission: { module: "customers", action: "create" },
        },
        { 
          to: "/dashboard/orders/preparation", 
          text: "הזמנות להכנה",
          requiredPermission: { module: "customers", action: "view" },
        },
        { 
          to: "/dashboard/orders/tracking", 
          text: "מעקב משלוחים",
          requiredPermission: { module: "customers", action: "view" },
        },
        {
          label: t("navbar.customer"),
          requiredPermission: { module: "customers", action: "view" },
          subMenu: [
            { 
              to: "/employee/Customers", 
              text: t("navbar.customer_list"),
              requiredPermission: { module: "customers", action: "view" },
            },
            {
              to: "/employee/Customers/Add-Customer",
              text: t("navbar.add_customer"),
              requiredPermission: { module: "customers", action: "create" },
            },
          ],
        },
      ],
    },
    {
      label: t("navbar.calendar"),
      requiredPermission: { module: "events", action: "view" },
      subMenu: [
        { 
          to: "/employee/Events", 
          text: t("navbar.events"),
          requiredPermission: { module: "events", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.support_tickets") || "כרטיסי תמיכה",
      requiredPermission: { module: "settings", action: "view" },
      subMenu: [
        { 
          to: "/employee/support-tickets", 
          text: t("navbar.support_tickets_list") || "רשימת כרטיסי תמיכה",
          requiredPermission: { module: "settings", action: "view" },
        },
        { 
          to: "/employee/support-tickets/create", 
          text: t("navbar.create_support_ticket") || "צור כרטיס תמיכה",
          requiredPermission: { module: "settings", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.invoices"),
      requiredPermission: { module: "invoices", action: "view" },
      subMenu: [
        { 
          to: "/employee/invoices", 
          text: t("navbar.invoices_list"),
          requiredPermission: { module: "invoices", action: "view" },
        },
        { 
          to: "/employee/invoices/create", 
          text: t("navbar.create_invoice"),
          requiredPermission: { module: "invoices", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.analytics") || "אנליטיקה",
      requiredPermission: { module: "analytics", action: "view" },
      to: "/employee/analytics",
    },
  ];

  const employeeLinks = [
    { 
      label: t("navbar.dashboard"), 
      to: "/employee",
      // Dashboard is always accessible
    },
    {
      label: t("navbar.products"),
      requiredPermission: { module: "products", action: "view" },
      subMenu: [
        { 
          to: "/employee/products", 
          text: t("navbar.all_products"),
          requiredPermission: { module: "products", action: "view" },
        },
        { 
          to: "/dashboard/inventory", 
          text: t("navbar.inventory_management"),
          requiredPermission: { module: "inventory", action: "view" },
        },
        { 
          to: "/dashboard/production", 
          text: "הזמנות ייצור",
          requiredPermission: { module: "products", action: "view" },
        },
        { 
          to: "/dashboard/production/create", 
          text: "יצירת הזמנת ייצור",
          requiredPermission: { module: "products", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.supplier"),
      requiredPermission: { module: "suppliers", action: "view" },
      subMenu: [
        { 
          to: "/employee/supplier", 
          text: t("navbar.all_suppliers"),
          requiredPermission: { module: "suppliers", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.shifts"),
      requiredPermission: { module: "shifts", action: "view" },
      subMenu: [
        { 
          to: "/employee/Shifts-List", 
          text: t("navbar.Shifts-List"),
          requiredPermission: { module: "shifts", action: "view" },
        },
        { 
          to: "/employee/My-Shifts", 
          text: t("navbar.My-Shifts"),
          requiredPermission: { module: "shifts", action: "view" },
        },
        { 
          to: "/employee/job-percentages", 
          text: t("navbar.job-percentages"),
          requiredPermission: { module: "shifts", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.finance"),
      requiredPermission: { module: "finance", action: "view" },
      subMenu: [
        { 
          to: "/employee/finance", 
          text: t("navbar.finance_records"),
          requiredPermission: { module: "finance", action: "view" },
        },
        { 
          to: "/employee/AddFinance", 
          text: t("navbar.create_finance_record"),
          requiredPermission: { module: "finance", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.Budget"),
      requiredPermission: { module: "budgets", action: "view" },
      subMenu: [
        {
          to: "/employee/finance/Budgets",
          text: t("navbar.budget_records"),
          requiredPermission: { module: "budgets", action: "view" },
        },
        {
          to: "/employee/finance/add-budget",
          text: t("navbar.create_budget_record"),
          requiredPermission: { module: "budgets", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.procurement"),
      requiredPermission: { module: "procurement", action: "view" },
      subMenu: [
        {
          to: "/employee/ProcurementProposals",
          text: t("navbar.ProcurementProposals"),
          requiredPermission: { module: "procurement", action: "view" },
        },
        {
          to: "/employee/ProcurementProposalsList",
          text: t("navbar.ProcurementProposalsList"),
          requiredPermission: { module: "procurement", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.Projects"),
      requiredPermission: { module: "projects", action: "view" },
      subMenu: [
        { 
          to: "/employee/projects", 
          text: t("navbar.Projects_List"),
          requiredPermission: { module: "projects", action: "view" },
        },
        {
          to: "/employee/projects/add-project",
          text: t("navbar.Add_Project"),
          requiredPermission: { module: "projects", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.employees"),
      requiredPermission: { module: "employees", action: "view" },
      subMenu: [
        { 
          to: "/employee/employees", 
          text: t("navbar.all_employees"),
          requiredPermission: { module: "employees", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.hr") || "HR",
      requiredPermission: { module: "employees", action: "view" },
      subMenu: [
        { 
          to: "/employee/self-service", 
          text: t("navbar.self_service") || "Self Service",
          requiredPermission: { module: "employees", action: "view" },
        },
        { 
          to: "/employee/hr/leave/request", 
          text: t("navbar.request_leave") || "Request Leave",
          requiredPermission: { module: "employees", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.signatures"),
      requiredPermission: { module: "signatures", action: "view" },
      subMenu: [
        { 
          to: "/employee/historySignature", 
          text: t("navbar.my_signature"),
          requiredPermission: { module: "signatures", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.department"),
      requiredPermission: { module: "departments", action: "view" },
      subMenu: [
        {
          to: "/employee/department/DepartmentList",
          text: t("navbar.departmentList"),
          requiredPermission: { module: "departments", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.review"),
      requiredPermission: { module: "reports", action: "view" },
      subMenu: [
        { 
          to: "/employee/performance-reviews", 
          text: t("navbar.review_List"),
          requiredPermission: { module: "reports", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.tasks"),
      requiredPermission: { module: "tasks", action: "view" },
      subMenu: [
        { 
          to: "/employee/tasks", 
          text: t("navbar.tasks"),
          requiredPermission: { module: "tasks", action: "view" },
        },
        { 
          to: "/employee/tasks/Add-Tasks", 
          text: t("navbar.add_tasks"),
          requiredPermission: { module: "tasks", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.Orders"),
      requiredPermission: { module: "customers", action: "view" },
      subMenu: [
        { 
          to: "/employee/Customers/Orders", 
          text: t("navbar.Orders List"),
          requiredPermission: { module: "customers", action: "view" },
        },
        { 
          to: "/dashboard/orders/preparation", 
          text: "הזמנות להכנה",
          requiredPermission: { module: "customers", action: "view" },
        },
        { 
          to: "/dashboard/orders/tracking", 
          text: "מעקב משלוחים",
          requiredPermission: { module: "customers", action: "view" },
        },
        {
          label: t("navbar.customer"),
          requiredPermission: { module: "customers", action: "view" },
          subMenu: [
            { 
              to: "/employee/Customers", 
              text: t("navbar.customer_list"),
              requiredPermission: { module: "customers", action: "view" },
            },
          ],
        },
      ],
    },
    {
      label: t("navbar.calendar"),
      requiredPermission: { module: "events", action: "view" },
      subMenu: [
        { 
          to: "/employee/Events", 
          text: t("navbar.events"),
          requiredPermission: { module: "events", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.support_tickets") || "כרטיסי תמיכה",
      requiredPermission: { module: "settings", action: "view" },
      subMenu: [
        { 
          to: "/employee/support-tickets", 
          text: t("navbar.support_tickets_list") || "רשימת כרטיסי תמיכה",
          requiredPermission: { module: "settings", action: "view" },
        },
        { 
          to: "/employee/support-tickets/create", 
          text: t("navbar.create_support_ticket") || "צור כרטיס תמיכה",
          requiredPermission: { module: "settings", action: "create" },
        },
      ],
    },
    {
      label: t("navbar.invoices"),
      requiredPermission: { module: "invoices", action: "view" },
      subMenu: [
        { 
          to: "/employee/invoices", 
          text: t("navbar.invoices_list"),
          requiredPermission: { module: "invoices", action: "view" },
        },
      ],
    },
    {
      label: t("navbar.analytics") || "אנליטיקה",
      requiredPermission: { module: "analytics", action: "view" },
      to: "/employee/analytics",
    },
  ];

  // Helper function to check if user has permission
  const hasPermission = (module, action) => {
    // Admin always has all permissions
  if (authUser?.role === "Admin") {
      return true;
    }
    
    // Wait for permissions to load
    if (isLoadingPermissions) {
      return false;
    }
    
    // Check if permission exists in userPermissions
    if (!userPermissions || !module || !action) {
      console.log("🔍 [hasPermission] No permission:", { module, action, hasUserPermissions: !!userPermissions });
      return false;
    }
    
    // Handle both object format {view: true, create: true, ...} and array format ['view', 'create', ...]
    const modulePerms = userPermissions[module];
    
    let hasPerm = false;
    if (Array.isArray(modulePerms)) {
      // Array format: check if action is in the array
      hasPerm = modulePerms.includes(action);
    } else if (modulePerms && typeof modulePerms === 'object') {
      // Object format: check if modulePerms[action] === true
      hasPerm = modulePerms[action] === true;
    }
    
    console.log("🔍 [hasPermission] Check:", { 
      module, 
      action, 
      hasPerm, 
      modulePermsType: typeof modulePerms,
      modulePermsIsArray: Array.isArray(modulePerms),
      modulePerms: modulePerms
    });
    
    return hasPerm;
  };

  // Helper function to filter menu items based on permissions
  const filterMenuItems = (items) => {
    return items
      .filter((item) => {
        // If no permission required, always show
        if (!item.requiredPermission) {
          return true;
        }
        
        // Check permission
        return hasPermission(
          item.requiredPermission.module,
          item.requiredPermission.action
        );
      })
      .map((item) => {
        // If has subMenu, filter it recursively
        if (item.subMenu) {
          const filteredSubMenu = item.subMenu
            .filter((subItem) => {
              // If subItem is a nested subMenu (has label)
              if (subItem.label && subItem.subMenu) {
                const filteredNestedSubMenu = subItem.subMenu.filter((nestedItem) => {
                  if (!nestedItem.requiredPermission) return true;
                  return hasPermission(
                    nestedItem.requiredPermission.module,
                    nestedItem.requiredPermission.action
                  );
                });
                // Only include nested subMenu if it has items
                return filteredNestedSubMenu.length > 0;
              }
              
              // Regular subMenu item
              if (!subItem.requiredPermission) {
                return true;
              }
              return hasPermission(
                subItem.requiredPermission.module,
                subItem.requiredPermission.action
              );
            });
          
          // Only include menu item if it has subMenu items or no subMenu at all
          if (filteredSubMenu.length === 0 && item.subMenu.length > 0) {
            return null; // Exclude this item
          }
          
          // Update nested subMenus
          const updatedSubMenu = filteredSubMenu.map((subItem) => {
            if (subItem.label && subItem.subMenu) {
              const filteredNestedSubMenu = subItem.subMenu.filter((nestedItem) => {
                if (!nestedItem.requiredPermission) return true;
                return hasPermission(
                  nestedItem.requiredPermission.module,
                  nestedItem.requiredPermission.action
                );
              });
              return {
                ...subItem,
                subMenu: filteredNestedSubMenu,
              };
            }
            return subItem;
          });
          
          return {
            ...item,
            subMenu: updatedSubMenu,
          };
        }
        
        return item;
      })
      .filter((item) => item !== null); // Remove null items
  };

  // Build dynamic navigation links based on role and permissions
  const navigationLinks = useMemo(() => {
    const labelProducts = t("navbar.products");
    const labelSupplier = t("navbar.supplier");
    const labelWarehouses = t("navbar.warehouses", { defaultValue: "Warehouses" });
    const labelProcurement = t("navbar.procurement");
    const labelProjects = t("navbar.Projects");
    const labelTasks = t("navbar.tasks");
    const labelOrders = t("navbar.Orders");
    const labelEmployees = t("navbar.employees");
    const labelDepartment = t("navbar.department");
    const labelShifts = t("navbar.shifts");
    const labelReview = t("navbar.review");
    const labelSignatures = t("navbar.signatures");
    const labelFinance = t("navbar.finance");
    const labelInvoices = t("navbar.invoices");
    const labelSupport = t("navbar.support_tickets");
    const labelCalendar = t("navbar.calendar");

    const groupDefinitions = [
      {
        key: "operations",
        label: t("navbar.groups.operations", { defaultValue: "Operations" }),
        order: 1,
        members: [
          labelProducts,
          labelSupplier,
          labelWarehouses,
          labelProcurement,
          labelProjects,
          labelTasks,
          labelOrders,
        ],
      },
      {
        key: "people",
        label: t("navbar.groups.people", { defaultValue: "People & HR" }),
        order: 2,
        members: [
          labelEmployees,
          labelDepartment,
          labelShifts,
          labelReview,
          labelSignatures,
        ],
      },
      {
        key: "finance",
        label: t("navbar.groups.finance", { defaultValue: "Finance" }),
        order: 3,
        members: [labelFinance, labelInvoices],
      },
      {
        key: "engagement",
        label: t("navbar.groups.engagement", { defaultValue: "Engagement" }),
        order: 4,
        members: [labelSupport, labelCalendar],
      },
    ];

    const buildGroupedLinks = (links) => {
      const groups = groupDefinitions.map((def) => ({
        label: def.label,
        order: def.order,
        members: def.members,
        items: [],
      }));

      const leftovers = [];

      links.forEach((item) => {
        const group = groups.find((g) => g.members.includes(item.label));
        if (group) {
          group.items.push(item);
        } else {
          leftovers.push(item);
        }
      });

      const grouped = [
        ...leftovers,
        ...groups
          .filter((g) => g.items.length > 0)
          .sort((a, b) => a.order - b.order)
          .map((g) => ({
            label: g.label,
            subMenu: g.items,
          })),
      ];

      return grouped;
    };

    // Admin always sees all links grouped by category
    if (authUser?.role === "Admin") {
      return buildGroupedLinks(adminLinks);
    }
    
    // For Manager and Employee, filter based on permissions
    let baseLinks = [];
    if (authUser?.role === "Manager") {
      baseLinks = managerLinks;
    } else if (authUser?.role === "Employee") {
      baseLinks = employeeLinks;
    } else {
      baseLinks = [];
    }
    
    // Transform paths for Manager/Employee (change /dashboard to /employee)
    const transformPaths = (links) => {
      return links.map((link) => ({
        ...link,
        to: link.to?.replace("/dashboard", "/employee"),
        subMenu: link.subMenu
          ? link.subMenu.map((subItem) => {
              // Handle nested subMenus
              if (subItem.subMenu) {
                return {
                  ...subItem,
                  subMenu: subItem.subMenu.map((nestedItem) => ({
                    ...nestedItem,
                    to: nestedItem.to?.replace("/dashboard", "/employee"),
                  })),
                };
              }
              return {
                ...subItem,
                to: subItem.to?.replace("/dashboard", "/employee"),
              };
            })
          : undefined,
      }));
    };
    
    // Filter and transform
    const filtered = filterMenuItems(baseLinks);
    const transformed = transformPaths(filtered);
    
    console.log("🔗 [Navbar] Navigation Links Built:", {
      userRole: authUser?.role,
      baseLinksCount: baseLinks.length,
      filteredCount: filtered.length,
      transformedCount: transformed.length,
      transformedLinks: transformed.map(link => ({
        label: link.label,
        hasSubMenu: !!link.subMenu,
        subMenuCount: link.subMenu?.length || 0,
      })),
      userPermissions: userPermissions,
    });
    
    // Ensure at least dashboard is shown
    if (transformed.length === 0) {
      console.log("⚠️ [Navbar] No links found, showing dashboard only");
      return [
        {
          label: t("navbar.dashboard"),
          to: "/employee",
        },
      ];
    }
    
    return buildGroupedLinks(transformed);
  }, [authUser?.role, userPermissions, isLoadingPermissions, t]);


  
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
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    // Check if this submenu or any of its children is currently open
                    const isCurrentlyOpen = openSubDropdown === uniqueSubIndex || 
                      (openSubDropdown && openSubDropdown.startsWith(uniqueSubIndex + "-"));
                    
                    if (isCurrentlyOpen) {
                      // Close this submenu and all its children, but keep parent levels open
                      const parts = uniqueSubIndex.split('-');
                      const parentLevel = parts.slice(0, -1).join('-');
                      
                      if (parentLevel) {
                        // Simply set to parent level - this will keep the parent open
                        // and close this submenu and all its children
                        setOpenSubDropdown(parentLevel);
                      } else {
                        // Top level, close all
                        setOpenSubDropdown(null);
                      }
                    } else {
                      // Open this submenu (this will automatically close any other submenu at the same level)
                      setOpenSubDropdown(uniqueSubIndex);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                  }}
                  className={`w-full py-1.5 text-[var(--color-primary)] font-medium hover:text-[var(--color-accent)] transition-all duration-300 ease-in-out relative flex items-center justify-between group ${
                    isRTL ? "text-right " : "text-left"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs transition-transform duration-300">
                    {(openSubDropdown === uniqueSubIndex || 
                      (openSubDropdown && openSubDropdown.startsWith(uniqueSubIndex + "-"))) ? "▲" : "▼"}
                  </span>
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[var(--color-accent)] scale-x-0 origin-center transition-transform duration-300 ease-in-out group-hover:scale-x-100"></span>
                </button>
                {(openSubDropdown === uniqueSubIndex || 
                  (openSubDropdown && openSubDropdown.startsWith(uniqueSubIndex + "-"))) && (
                  <div 
                    className="ps-4"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                  >
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
                      onClick={(e) => {
                        e.stopPropagation();
                        if (openDropdown === index) {
                          // Closing the current dropdown - reset subdropdown
                          setOpenDropdown(null);
                          setOpenSubDropdown(null);
                        } else {
                          // Opening a different dropdown - reset subdropdown only if switching to different main menu
                          setOpenDropdown(index);
                          // Only reset subdropdown if switching to a different main menu item
                          if (openDropdown !== null && openDropdown !== index) {
                            setOpenSubDropdown(null);
                          }
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
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
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
                  {/* Enhanced Badge with Animation */}
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 z-50 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse border-2 border-white/30 backdrop-blur-sm">
                    {itemsRequiringSignature.length +
                      budgetRequiringSignature.length}
                  </span>
                  {/* Enhanced Sign Now Button */}
                  <button
                    onClick={handleSignature}
                    className="relative ml-4 px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm group"
                  >
                    {/* Pen Icon */}
                    <FaEdit className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12" />
                    {t("navbar.Signatures.sign_now")}
                    {/* Shine Effect */}
                    <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
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
                          // Handle both ObjectId and string comparison
                          const nextSignerEmployeeId = nextSigner?.employeeId?._id 
                            ? nextSigner.employeeId._id.toString() 
                            : nextSigner?.employeeId?.toString() || nextSigner?.employeeId;
                          const userEmployeeId = authUser?.employeeId?._id 
                            ? authUser.employeeId._id.toString() 
                            : authUser?.employeeId?.toString() || authUser?.employeeId;
                          const isMyTurn = nextSignerEmployeeId === userEmployeeId;
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
                                {item.departmentOrProjectName || item.budgetName || "Budget"}
                              </div>
                              <div className="text-sm">
                                <strong>
                                  {t("navbar.Signatures.amount")}:
                                </strong>{" "}
                                {item.currency || "$"}{item.amount}
                              </div>
                              {isMyTurn ? (
                                <button
                                  onClick={() =>
                                    handleOpenModal(
                                      null, // Budget doesn't have a PDF document URL
                                      item._id,
                                      "budget",
                                      {
                                        budgetName: item.departmentOrProjectName || item.budgetName || "Budget",
                                        amount: item.amount,
                                        department: item.departmentId?.name || item.department || "N/A",
                                        description: item.notes || item.description || "",
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
                      } mt-2 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl w-96 lg:w-[28rem] z-50 max-h-[32rem] overflow-y-auto border border-gray-200/50 animate-slide-down`}
                    >
                      <div className="flex justify-between items-center mb-3 pb-3 border-b-2 border-gray-200">
                        <h3 className="font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                          <FaBell className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                          {t("notifications.title")}
                        </h3>
                        <button
                          className="text-xs px-3 py-1 rounded-full font-medium transition-all hover:scale-105"
                          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                          onClick={markNotificationAsReadAll}
                        >
                          {t("notifications.readAll")}
                        </button>
                      </div>
                      {isLoadingNotifications ? (
                        <p className="text-sm">{t("notifications.loading")}</p>
                      ) : adminNotifications.length > 0 ? (
                        adminNotifications.map((notification) => {
                          // Category icons & colors
                          const categoryConfig = {
                            procurement: { icon: "📦", color: "blue" },
                            finance: { icon: "💰", color: "green" },
                            inventory: { icon: "📦", color: "purple" },
                            tasks: { icon: "✅", color: "indigo" },
                            projects: { icon: "🎯", color: "cyan" },
                            customers: { icon: "🛒", color: "pink" },
                            hr: { icon: "👥", color: "teal" },
                            system: { icon: "🔔", color: "gray" },
                            approval: { icon: "✍️", color: "orange" },
                          };

                          const priorityConfig = {
                            critical: { border: "border-red-500", bg: "from-red-50 to-red-100", dot: "bg-red-500" },
                            high: { border: "border-orange-500", bg: "from-orange-50 to-orange-100", dot: "bg-orange-500" },
                            medium: { border: "border-blue-500", bg: "from-blue-50 to-blue-100", dot: "bg-blue-500" },
                            low: { border: "border-gray-400", bg: "from-gray-50 to-gray-100", dot: "bg-gray-400" },
                          };

                          const category = notification.category || "system";
                          const priority = notification.priority || "medium";
                          const config = categoryConfig[category] || categoryConfig.system;
                          const priorityStyle = priorityConfig[priority] || priorityConfig.medium;

                          // Check for inventory notification 
                          const isInventoryNotification = 
                            notification.category === "inventory" || 
                            notification.PurchaseOrder === "Inventory";
                          
                          // Check for details notification (old format)
                          const isDetailsNotification = notification.PurchaseOrder === "details";
                          
                          // Extract product ID for inventory notifications
                          const productIdMatch = notification.content.match(/product (.*) is below/);
                          const productId = isInventoryNotification && productIdMatch ? productIdMatch[1] : null;
                          
                          // Extract employee ID for details notifications
                          const employeeIdMatch = notification.content.match(/מזהה: ([a-fA-F0-9]{24})/);
                          const employeeId = isDetailsNotification && employeeIdMatch ? employeeIdMatch[1] : null;

                          return (
                            <div
                              key={notification._id}
                              onClick={() =>
                                !notification.isRead &&
                                markNotificationAsRead(notification._id)
                              }
                              className={`relative mb-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                                notification.isRead
                                  ? "bg-gray-50 border-gray-200 opacity-60"
                                  : `bg-gradient-to-r ${priorityStyle.bg} ${priorityStyle.border} hover:shadow-lg hover:scale-[1.02]`
                              }`}
                            >
                              {/* Delete Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification._id);
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-10"
                              >
                                ×
                              </button>

                              {/* Unread indicator */}
                              {!notification.isRead && (
                                <div className={`absolute top-3 left-3 w-2 h-2 ${priorityStyle.dot} rounded-full animate-pulse`}></div>
                              )}

                              {/* Content */}
                              <div className="pr-6" style={{ paddingLeft: !notification.isRead ? '12px' : '0' }}>
                                {/* Title with icon */}
                                {notification.title && (
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base">{config.icon}</span>
                                    <h4 className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>
                                      {notification.title}
                                    </h4>
                                    {notification.priority === "critical" && (
                                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                        דחוף!
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Content */}
                                <p className="text-xs text-gray-700 mb-1">
                                  {notification.content}
                                </p>

                                {/* Time */}
                                <span className="text-xs block" style={{ color: 'var(--color-secondary)' }}>
                                  {new Date(notification.createdAt).toLocaleString('he-IL')}
                                </span>

                                {/* Action Buttons */}
                                <div className="mt-2 flex justify-end gap-2">
                                  {/* Inventory special button - יצירת תעודת רכש */}
                                  {isInventoryNotification && !notification.isRead && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOrderClick(notification._id);
                                      }}
                                      className="px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 text-xs transition-all duration-300 shadow-sm"
                                    >
                                      🛒 {t("navbar.notifications.order") || "הזמן מלאי"}
                                    </button>
                                  )}
                                  
                                  {/* Details notification button */}
                                  {isDetailsNotification && !notification.isRead && employeeId && (
                                    <a
                                      href={`/dashboard/employees?editEmployee=${employeeId}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markNotificationAsRead(notification._id);
                                      }}
                                      className="px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-xs transition-all duration-300 shadow-sm"
                                    >
                                      {t("notifications.fillDetails") || "מלא פרטים"}
                                    </a>
                                  )}
                                  
                                  {/* General action button */}
                                  {notification.actionUrl && notification.actionLabel && !notification.isRead && (
                                    <a
                                      href={notification.actionUrl}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markNotificationAsRead(notification._id);
                                      }}
                                      className="px-3 py-1 bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-secondary)] text-xs transition-all duration-300 shadow-sm"
                                    >
                                      {notification.actionLabel}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm">
                          {t("navbar.notifications.no_notifications")}
                        </p>
                      )}
                      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-center">
                        <Link
                          to="/dashboard/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-secondary)] underline flex items-center gap-2"
                        >
                          {t("navbar.notifications.manageNotifications") ||
                            "עבור לניהול התראות"}
                        </Link>
                      </div>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      if (openDropdown === index) {
                        // Closing the current dropdown - reset subdropdown
                        setOpenDropdown(null);
                        setOpenSubDropdown(null);
                      } else {
                        // Opening a different dropdown - reset subdropdown only if switching to different main menu
                        setOpenDropdown(index);
                        // Only reset subdropdown if switching to a different main menu item
                        if (openDropdown !== null && openDropdown !== index) {
                          setOpenSubDropdown(null);
                        }
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

      {/* Signature Modal - Enhanced Design */}
      {showModal && (
        <div 
          className="fixed inset-0 mt-[550px] bg-gradient-to-br from-black/80 via-gray-900/90 to-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8 animate-fade-in"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 w-full max-w-2xl lg:max-w-4xl relative border-2 border-indigo-200/50 transform transition-all duration-300 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 hover:rotate-90 z-10"
              aria-label="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            {/* Header with Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-4 shadow-lg transform hover:scale-110 transition-transform duration-300">
                <FaEdit className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {selectedDocumentType === "budget"
                  ? t("navbar.Signatures.budgetDocument")
                  : t("navbar.Signatures.procurementDocument")}
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                {t("navbar.Signatures.digital-Signature")}
              </p>
            </div>

            {/* Document Summary - Enhanced */}
            {selectedDocumentType === "budget" && selectedBudget && (
              <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200/50 shadow-lg">
                <h3 className="text-lg font-bold mb-3 text-indigo-700 flex items-center gap-2">
                  <FaEdit className="w-5 h-5" />
                  {t("navbar.Signatures.budgetSummary")} - {selectedBudget.budgetName}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <strong className="text-indigo-600">{t("navbar.Signatures.amount")}:</strong>
                    <span className="text-gray-700 font-semibold">${selectedBudget.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-indigo-600">{t("navbar.Signatures.department")}:</strong>
                    <span className="text-gray-700">
                      {selectedBudget.departmentId?.name ||
                        selectedBudget.departmentId}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <strong className="text-indigo-600">{t("navbar.Signatures.description")}:</strong>
                    <p className="text-gray-700 mt-1">{selectedBudget.description}</p>
                  </div>
                </div>
              </div>
            )}
            {selectedPDF && (
              <div className="mb-6 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
                <iframe
                  src={selectedPDF}
                  title="Document PDF"
                  className="w-full h-32 sm:h-48 lg:h-64"
                />
              </div>
            )}
            {/* Signature Canvas - Enhanced */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("navbar.Signatures.digital-Signature")}:
              </label>
              <div className="rounded-xl border-2 border-indigo-200 shadow-lg p-2 bg-white">
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
                    className: "border-2 border-gray-300 rounded-lg w-full shadow-inner bg-white",
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (signaturePadRef.current) {
                    signaturePadRef.current.clear();
                  }
                }}
                className="mt-2 text-xs text-gray-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-1"
              >
                <FaEdit className="w-3 h-3" />
                {t("navbar.Signatures.clear") || "נקה"}
              </button>
            </div>
            {/* Action Buttons - Enhanced */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl text-sm lg:text-base font-semibold hover:from-gray-500 hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                <FaTimes className="w-4 h-4" />
                {t("events.cancel")}
              </button>
              <button
                onClick={handleSaveSignature}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl text-sm lg:text-base font-semibold hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                <FaEdit className="w-4 h-4" />
                {t("navbar.Signatures.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personal Details Modal */}
      {showPersonalModal && (
        <div className="fixed inset-0 bg-black mt-[550px] bg-opacity-60 flex items-center justify-center z-[99999] px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaUserEdit className="w-5 h-5" />
                {t("navbar.profile.updatePersonal")}
              </h2>
              <button
                onClick={handleClosePersonalModal}
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Picture Section */}
              <div className="col-span-1 md:col-span-2 flex justify-center mb-6">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-4 border-blue-200 overflow-hidden shadow-lg mb-3 ring-4 ring-blue-100 transition-all duration-300 group-hover:scale-105 group-hover:ring-blue-300">
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
                          className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600`}
                        >
                          <span className="text-white text-4xl font-bold">
                            {authUser?.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                      <FaUserEdit className="w-5 h-5 text-white" />
                    </div>
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
                    className="cursor-pointer px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    {t("navbar.profile.uploadImage")}
                  </label>
                </div>
              </div>
              {/* Personal Information Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-100">
                <h3 className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <FaUserEdit className="w-4 h-4 text-blue-600" />
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
                    <div key={field.name}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 text-sm">*</span>
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
                          className={`block w-full px-4 py-2.5 border-2 rounded-xl text-sm font-medium transition-all duration-200 text-gray-900 ${
                            editableFields[field.name]
                              ? "border-blue-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              : "border-gray-200 bg-gray-50 cursor-not-allowed"
                          }`}
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
                          className={`block w-full px-4 py-2.5 border-2 rounded-xl text-sm font-medium transition-all duration-200 text-gray-900 ${
                            editableFields[field.name]
                              ? "border-blue-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              : "border-gray-200 bg-gray-50 cursor-not-allowed"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {/* Address and Password Sections */}
              <div className="space-y-4">
                {/* Address Section */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-100">
                  <h3 className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                    <FaBuilding className="w-4 h-4 text-purple-600" />
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
                      <div key={field.name}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 text-sm">*</span>
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
                          className={`block w-full px-4 py-2.5 border-2 rounded-xl text-sm font-medium transition-all duration-200 text-gray-900 ${
                            editableFields[field.name]
                              ? "border-purple-300 bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                              : "border-gray-200 bg-gray-50 cursor-not-allowed"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Password Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-100">
                  <h3 className="text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3 flex items-center gap-2">
                    <FaEdit className="w-4 h-4 text-green-600" />
                    {t("navbar.profile.passwordInfo")}
                  </h3>
                  <button
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FaEdit className="w-4 h-4" />
                    {t("navbar.profile.updatePassword")}
                  </button>
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
                        <div key={field.name}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 text-sm">*</span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords[field.name] ? "text" : "password"}
                              name={field.name}
                              value={personalForm[field.name]}
                              onChange={handlePersonalFormChange}
                              required={field.required}
                              aria-label={field.label}
                              aria-describedby={`${field.name}-error`}
                              tabIndex={0}
                              className="block w-full px-4 py-2.5 pr-12 border-2 border-green-300 bg-white rounded-xl text-sm font-medium transition-all duration-200 text-gray-900 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({
                                ...prev,
                                [field.name]: !prev[field.name]
                              }))}
                              className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-500 hover:text-green-600 transition-colors"
                            >
                              {showPasswords[field.name] ? (
                                <FaEyeSlash className="w-5 h-5" />
                              ) : (
                                <FaEye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleClosePersonalModal}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-300 transition-all duration-200 hover:scale-105"
              >
                {t("events.cancel")}
              </button>
              <button
                onClick={handlePersonalFormSubmit}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                {t("navbar.profile.save")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Company Details Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black mt-[600px] bg-opacity-60 flex items-center justify-center z-[99999] px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaBuilding className="w-5 h-5" />
                {t("navbar.profile.updateCompany")}
              </h2>
              <button
                onClick={handleCloseCompanyModal}
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div key={field.name} className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-100 relative">
                  <label className="block text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
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
                      className={`block w-full px-4 py-2.5 border-2 rounded-xl text-sm font-medium transition-all duration-200 text-gray-900 ${
                        editableFields[field.name]
                          ? "border-purple-300 bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                          : "border-gray-200 bg-gray-50 cursor-not-allowed"
                      }`}
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
                      className={`block w-full px-4 py-2.5 border-2 rounded-xl text-sm font-medium transition-all duration-200 text-gray-900 ${
                        editableFields[field.name]
                          ? "border-purple-300 bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                          : "border-gray-200 bg-gray-50 cursor-not-allowed"
                      }`}
                    />
                  )}
                  <button
                    onClick={() => toggleFieldEdit(field.name)}
                    className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-2 rounded-full transition-all duration-200 ${
                      editableFields[field.name]
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                    }`}
                    title={
                      editableFields[field.name]
                        ? t("navbar.profile.lock")
                        : t("navbar.profile.edit")
                    }
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseCompanyModal}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-300 transition-all duration-200 hover:scale-105"
              >
                {t("events.cancel")}
              </button>
              <button
                onClick={handleCompanyFormSubmit}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
