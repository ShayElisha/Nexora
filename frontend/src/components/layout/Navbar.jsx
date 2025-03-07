import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";
import SignatureCanvas from "react-signature-canvas";
import { FaBell, FaBars, FaTimes } from "react-icons/fa";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

// Random Background Colors
const colorArray = [
  "bg-red-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-indigo-500",
];

const getRandomColorClass = () => {
  const randomIndex = Math.floor(Math.random() * colorArray.length);
  return colorArray[randomIndex];
};

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const signaturePadRef = useRef(null);

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarColorClass, setAvatarColorClass] = useState("");

  useEffect(() => {
    setAvatarColorClass(getRandomColorClass());
  }, []);

  // Query: Authenticated User
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const response = await axiosInstance.get("/auth/me");
      return response.data;
    },
  });

  const authUser = authData?.user;
  const firstName = authUser?.name || "Guest";
  const lastName = authUser?.lastName || "";
  const profileImage = authUser?.profileImage;
  const isLoggedIn = !!authUser;

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

  // Queries: Procurement, Budget, Notifications
  const { data: procurementData = [] } = useQuery({
    queryKey: ["procurement"],
    queryFn: async () => {
      const response = await axiosInstance.get("/procurement");
      return response.data.data;
    },
    enabled: isLoggedIn,
  });

  const { data: badgerData = [] } = useQuery({
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

  const budgetRequiringSignature = badgerData.filter(
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

  // Handlers: Hamburger Menu
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    setShowPopup(false);
    setShowNotifications(false);
    setOpenDropdown(null);
    setOpenSubDropdown(null);
  };

  // Role-Based Links & Colors
  const roleLinkColor = (() => {
    switch (authUser?.role) {
      case "Admin":
        return "text-red-400 hover:text-red-600";
      case "Manager":
        return "text-green-400 hover:text-green-600";
      case "Employee":
        return "text-blue-400 hover:text-blue-600";
      default:
        return "text-white hover:text-secondary";
    }
  })();

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
      label: t("navbar.finance"),
      subMenu: [
        { to: "/dashboard/finance", text: t("navbar.finance_records") },
        {
          to: "/dashboard/add-finance-record",
          text: t("navbar.create_finance_record"),
        },
        {
          label: t("navbar.budget"),
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
          text: "Receipt Purchase",
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
          text: t("navbar.ProcurementProposalsList"),
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
      <ul className="mt-1 space-y-1 pl-2 sm:pl-4 text-xs sm:text-sm lg:text-base">
        {subMenu.map((item, subIndex) => {
          const uniqueSubIndex = `${parentIndex}-${subIndex}`;
          if (item.subMenu) {
            return (
              <li key={uniqueSubIndex} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubDropdown(
                      openSubDropdown === uniqueSubIndex ? null : uniqueSubIndex
                    );
                  }}
                  className={`flex justify-between items-center w-full px-1 sm:px-2 py-1 rounded transition-colors ${roleLinkColor}`}
                >
                  <span>{item.label}</span>
                  <span className="ml-1 sm:ml-2 text-xs">
                    {openSubDropdown === uniqueSubIndex ? "▲" : "▼"}
                  </span>
                </button>
                {openSubDropdown === uniqueSubIndex && (
                  <div className="ml-1 sm:ml-2">
                    {renderSubMenu(item.subMenu, uniqueSubIndex)}
                  </div>
                )}
              </li>
            );
          } else {
            return (
              <li key={uniqueSubIndex}>
                <Link
                  to={item.to}
                  onClick={() => {
                    setOpenDropdown(null);
                    setOpenSubDropdown(null);
                    setShowPopup(false);
                    setShowNotifications(false);
                    setIsMenuOpen(false);
                  }}
                  className={`block px-1 sm:px-2 py-1 rounded hover:bg-gray-200 transition-colors ${roleLinkColor}`}
                >
                  {item.text || item.label}
                </Link>
              </li>
            );
          }
        })}
      </ul>
    );
  };

  return (
    <nav className="bg-gradient-to-r from-blue-900 via-purple-900 to-gray-900 text-white px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 shadow-lg sticky top-0 z-50 w-full min-w-full">
      <div className="w-full flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-wide text-white hover:scale-105 transition-transform flex-shrink-0"
        >
          Nexora
        </Link>

        {/* Hamburger Menu Button */}
        {isLoggedIn && (
          <button
            onClick={toggleMenu}
            className="xl:hidden text-white focus:outline-none flex-shrink-0"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <FaTimes className="w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7" />
            ) : (
              <FaBars className="w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7" />
            )}
          </button>
        )}

        {/* Desktop Navigation Links */}
        {isLoggedIn && (
          <div className="hidden xl:flex flex-1 justify-center items-center space-x-1 sm:space-x-2 lg:space-x-3 xl:space-x-4 px-2 sm:px-4 lg:px-6">
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
                      }}
                      className={`flex items-center space-x-0.5 px-1 sm:px-2 lg:px-3 py-1 rounded-md hover:bg-black/10 transition-colors text-xs sm:text-sm lg:text-base ${roleLinkColor}`}
                    >
                      <span>{navItem.label}</span>
                      <span className="text-xs">
                        {openDropdown === index ? "▲" : "▼"}
                      </span>
                    </button>
                    {openDropdown === index && (
                      <div className="absolute left-0 mt-2 bg-white text-gray-700 rounded-md shadow-lg p-2 w-40 sm:w-48 lg:w-56 xl:w-64 z-50">
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
                    className={`px-1 sm:px-2 lg:px-3 py-1 rounded-md hover:bg-black/10 transition-colors text-xs sm:text-sm lg:text-base ${roleLinkColor}`}
                    onClick={() => {
                      setOpenDropdown(null);
                      setOpenSubDropdown(null);
                      setShowPopup(false);
                      setShowNotifications(false);
                    }}
                  >
                    {navItem.label}
                  </Link>
                );
              }
            })}
          </div>
        )}

        {/* Right Side: Profile, Signatures, Notifications, Logout */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
          {isLoggedIn ? (
            <>
              {(itemsRequiringSignature.length > 0 ||
                budgetRequiringSignature.length > 0) && (
                <div className="relative">
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center">
                    {itemsRequiringSignature.length +
                      budgetRequiringSignature.length}
                  </span>
                  <button
                    onClick={handleSignature}
                    className="px-1 sm:px-2 py-1 bg-accent text-white rounded hover:bg-green-600 text-xs sm:text-sm lg:text-base transition duration-300"
                  >
                    {t("navbar.Signatures.sign_now")}
                  </button>
                  {showPopup && (
                    <div className="absolute right-0 mt-2 bg-white text-gray-800 shadow-lg rounded-md p-2 sm:p-3 w-60 sm:w-72 lg:w-96 z-50 max-h-64 overflow-y-auto">
                      <h3 className="text-xs sm:text-sm lg:text-base font-bold mb-2">
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
                              <div className="text-xs sm:text-sm">
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
                                  className="mt-1 px-1 sm:px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm transition duration-300"
                                >
                                  {t("navbar.Signatures.sign_now")}
                                </button>
                              ) : (
                                <>
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    {t("navbar.Signatures.next_signer")}:{" "}
                                    {nextSigner
                                      ? `${nextSigner.name} (${nextSigner.role})`
                                      : t("navbar.Signatures.no_next_signer")}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600">
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
                              <div className="text-xs sm:text-sm">
                                <strong>
                                  {t("navbar.Signatures.budget_name")}:
                                </strong>{" "}
                                {item.departmentOrProjectName}
                              </div>
                              <div className="text-xs sm:text-sm">
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
                                  className="mt-1 px-1 sm:px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs sm:text-sm transition duration-300"
                                >
                                  {t("navbar.Signatures.sign_now")}
                                </button>
                              ) : (
                                <>
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    {t("navbar.Signatures.next_signer")}:{" "}
                                    {nextSigner
                                      ? `${nextSigner.name} (${nextSigner.role})`
                                      : t("navbar.Signatures.no_next_signer")}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600">
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
                        className="mt-2 px-1 sm:px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs sm:text-sm"
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
                    className="relative"
                  >
                    <FaBell className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 sm:px-1.5">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div
                      className={`absolute ${
                        i18n.language === "he" || i18n.language === "ar"
                          ? "left-0"
                          : "right-0"
                      } mt-2 bg-white p-2 sm:p-3 rounded shadow-md w-56 sm:w-72 lg:w-96 z-50 text-gray-800 max-h-64 overflow-y-auto`}
                    >
                      <h3 className="font-bold text-xs sm:text-sm lg:text-base mb-2 border-b pb-1 flex justify-between items-center">
                        {t("notifications.title")}
                        <button
                          className="text-xs sm:text-sm hover:underline"
                          onClick={markNotificationAsReadAll}
                        >
                          {t("notifications.readAll")}
                        </button>
                      </h3>
                      {isLoadingNotifications ? (
                        <p className="text-xs sm:text-sm">
                          {t("notifications.loading")}
                        </p>
                      ) : adminNotifications.length > 0 ? (
                        adminNotifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() =>
                              !notification.isRead &&
                              markNotificationAsRead(notification._id)
                            }
                            className={`relative border-b mb-1 pb-1 pl-2 pr-4 cursor-pointer rounded ${
                              notification.isRead
                                ? "bg-gray-100 opacity-70"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                              className="absolute top-0 right-0 px-1 py-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs"
                            >
                              ×
                            </button>
                            <p className="text-xs sm:text-sm">
                              {notification.content}
                            </p>
                            <span className="text-xs sm:text-sm text-gray-500 block">
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs sm:text-sm">
                          {t("navbar.notifications.no_notifications")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full border-2 border-secondary overflow-hidden flex-shrink-0">
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
                    <span className="text-white text-sm sm:text-base lg:text-lg font-bold">
                      {authUser?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </div>

              <span className="hidden xl:block text-xs sm:text-sm lg:text-base font-medium truncate max-w-[100px] sm:max-w-[150px]">
                {t("navbar.profile.hello", { firstName, lastName })}
              </span>
              <button
                onClick={() => logout()}
                className="px-1 sm:px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm lg:text-base transition duration-300"
                disabled={isLoggingOut}
              >
                {isLoggingOut
                  ? t("navbar.profile.logging_out")
                  : t("navbar.profile.logout")}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-1 sm:px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm lg:text-base transition duration-300"
            >
              {t("navbar.profile.login")}
            </Link>
          )}
        </div>
      </div>

      {/* Hamburger Menu (Mobile - below 1400px) */}
      {isLoggedIn && isMenuOpen && (
        <div className="xl:hidden mt-1 sm:mt-2 bg-white text-gray-800 rounded-md shadow-lg p-2 sm:p-3 w-full max-h-[80vh] overflow-y-auto">
          {navigationLinks.map((navItem, index) => (
            <div key={index} className="mb-1 sm:mb-2">
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
                    className={`flex justify-between items-center w-full px-1 sm:px-2 py-1 rounded text-xs sm:text-sm ${roleLinkColor}`}
                  >
                    <span>{navItem.label}</span>
                    <span className="text-xs">
                      {openDropdown === index ? "▲" : "▼"}
                    </span>
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
                  }}
                  className={`block px-1 sm:px-2 py-1 rounded hover:bg-gray-200 text-xs sm:text-sm ${roleLinkColor}`}
                >
                  {navItem.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Signature Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-2 sm:px-4">
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 w-full max-w-xs sm:max-w-md lg:max-w-2xl relative">
            <h2 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-800 mb-2 sm:mb-4 text-center">
              {selectedDocumentType === "budget"
                ? t("navbar.Signatures.budgetDocument")
                : t("navbar.Signatures.procurementDocument")}{" "}
              {t("navbar.Signatures.digitalSignature")}
            </h2>
            {selectedDocumentType === "budget" && selectedBudget && (
              <div className="mb-2 sm:mb-4 p-1 sm:p-2 lg:p-3 border rounded bg-gray-50 text-xs sm:text-sm lg:text-base">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-1 sm:mb-2">
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
                className="w-full h-32 sm:h-48 lg:h-64 mb-2 sm:mb-4 border rounded"
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
                className: "border rounded w-full",
              }}
            />
            <div className="flex justify-end mt-2 sm:mt-4 space-x-1 sm:space-x-2">
              <button
                onClick={handleCloseModal}
                className="px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 bg-red-600 text-white rounded text-xs sm:text-sm lg:text-base hover:bg-red-700 transition duration-300"
              >
                {t("events.cancel")}
              </button>
              <button
                onClick={handleSaveSignature}
                className="px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 bg-green-600 text-white rounded text-xs sm:text-sm lg:text-base hover:bg-red-700 transition duration-300"
              >
                {t("navbar.Signatures.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
