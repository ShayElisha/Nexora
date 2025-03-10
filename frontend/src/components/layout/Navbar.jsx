import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";
import SignatureCanvas from "react-signature-canvas";
import { FaBell, FaBars, FaTimes } from "react-icons/fa";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const Navbar = ({ isRTL }) => {
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
    setAvatarColorClass(
      `bg-[var(--color-${
        ["primary", "secondary", "accent"][Math.floor(Math.random() * 3)]
      })]`
    );
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
      label: t("navbar.review"),
      subMenu: [
        {
          to: "/dashboard/AddPerformanceReview",
          text: t("navbar.add_reviewForm"),
        },
        {
          to: "/dashboard/performance-reviews",
          text: t("navbar.review_List"),
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
      <ul className="mt-2 space-y-1 pl-4 text-sm lg:text-base">
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
                  className={`w-full py-1  text-[var(--color-primary)] font-medium hover:text-[var(--color-accent)] transition-all duration-300 ease-in-out relative ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="absolute top-1/2 left-0 transform -translate-y-1/2 text-xs">
                    {openSubDropdown === uniqueSubIndex ? "▲" : "▼"}
                  </span>
                  <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[var(--color-accent)] transition-all duration-300 ease-in-out group-hover:w-full group-hover:left-0"></span>
                </button>
                {openSubDropdown === uniqueSubIndex && (
                  <div className="ml-2">
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
                  className={`block py-1 text-[var(--color-primary)] font-medium hover:text-[var(--color-accent)] transition-all duration-300 ease-in-out relative group ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {item.text || item.label}
                  <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[var(--color-accent)] transition-all duration-300 ease-in-out group-hover:w-full group-hover:left-0"></span>
                </Link>
              </li>
            );
          }
        })}
      </ul>
    );
  };

  return (
    <nav className="bg-[var(--color-primary)] text-white px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 shadow-2xl sticky w-screen animate-fade-in z-50">
      <div className="w-full flex items-center justify-between">
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
            className="2xl:hidden text-white  focus:outline-none flex-shrink-0 hover:text-[var(--color-accent)] transition-colors duration-200"
            aria-label="Toggle menu"
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
                      }}
                      className={`py-1 text-white font-medium hover:text-[var(--color-accent)] transition-all duration-300 ease-in-out relative group ${
                        index === 0 && isRTL ? "pr-6" : ""
                      }`}
                    >
                      <span>{navItem.label}</span>
                      <span className="ml-1 text-xs">
                        {openDropdown === index ? "▲" : "▼"}
                      </span>
                      <span className="absolute  bottom-0 left-1/2 w-0 h-[2px] bg-[var(--color-accent)] transition-all duration-300 ease-in-out group-hover:w-full group-hover:left-0"></span>
                    </button>
                    {openDropdown === index && (
                      <div
                        className={`absolute ${
                          isRTL ? "right-0" : "left-0"
                        } mt-2  bg-white text-[var(--color-primary)] rounded-lg shadow-lg p-3 w-64 z-50 border border-[var(--color-accent)] animate-slide-down`}
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

        {/* Right Side: Profile, Signatures, Notifications, Logout */}
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
                        adminNotifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() =>
                              !notification.isRead &&
                              markNotificationAsRead(notification._id)
                            }
                            className={`relative border-b mb-1 pb-1 pl-2 pr-4 cursor-pointer rounded-lg ${
                              notification.isRead
                                ? "bg-gray-100 opacity-70"
                                : "bg-white hover:bg-[var(--color-accent)] hover:text-white"
                            } transition-all duration-200`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                              className="absolute top-0 right-0 px-1 py-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs shadow-sm transition-all duration-200"
                            >
                              ×
                            </button>
                            <p className="text-sm">{notification.content}</p>
                            <span className="text-sm text-gray-500 block">
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm">
                          {t("navbar.notifications.no_notifications")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full border-2 border-[var(--color-accent)] overflow-hidden flex-shrink-0 shadow-sm">
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
              </div>

              <span className="hidden 2xl:block text-sm lg:text-base font-semibold truncate max-w-[150px] text-white">
                {t("navbar.profile.hello", { firstName, lastName })}
              </span>
              <button
                onClick={() => logout()}
                className="px-2 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 text-sm lg:text-base transition-all duration-300 shadow-sm disabled:opacity-50"
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
                  }}
                  className={`block py-1 text-[var(--color-primary)] font-medium hover:text-[var(--color-accent)] transition-all duration-300 ease-in-out relative group ${
                    index === 0 && isRTL ? "pr-8" : ""
                  }`}
                >
                  {navItem.label}
                  <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[var(--color-accent)] transition-all duration-300 ease-in-out group-hover:w-full group-hover:left-0"></span>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Signature Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 px-2 sm:px-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-3 sm:p-4 lg:p-6 w-full max-w-xs sm:max-w-md lg:max-w-2xl relative border border-[var(--color-accent)] transform transition-all duration-300 scale-95 hover:scale-100">
            <h2 className="text-sm sm:text-lg lg:text-xl font-bold text-[var(--color-primary)] mb-2 sm:mb-4 text-center tracking-tight drop-shadow-sm">
              {selectedDocumentType === "budget"
                ? t("navbar.Signatures.budgetDocument")
                : t("navbar.Signatures.procurementDocument")}{" "}
              {t("navbar.Signatures.digitalSignature")}
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

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slide-down { animation: slideDown 0.3s ease-out forwards; }
        .group:hover .group-hover\\:w-full { width: 100%; }
        .group:hover .group-hover\\:left-0 { left: 0; }
      `}</style>
    </nav>
  );
};

export default Navbar;
