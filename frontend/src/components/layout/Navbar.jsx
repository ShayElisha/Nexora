import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../lib/axios";
import toast from "react-hot-toast";
import SignatureCanvas from "react-signature-canvas";
import { FaBell } from "react-icons/fa";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

// ----- מערך צבעים לפונקציית רקע רנדומלית -----
const colorArray = [
  "bg-red-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-indigo-500",
];

// פונקציית עזר לקבלת כיתה (className) עם צבע רנדומלי
const getRandomColorClass = () => {
  const randomIndex = Math.floor(Math.random() * colorArray.length);
  return colorArray[randomIndex];
};

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const signaturePadRef = useRef(null);

  // ======= States =======
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubDropdown, setOpenSubDropdown] = useState(null);

  // State עבור צבע האוואטר במקרה שאין תמונה
  const [avatarColorClass, setAvatarColorClass] = useState("");

  // נגריל צבע רקע עבור האוואטר פעם אחת בכל טעינת הקומפוננטה
  useEffect(() => {
    setAvatarColorClass(getRandomColorClass());
  }, []);

  // ======= Query: Authenticated User =======
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

  // **הסרנו את ה־placeholder** כדי לאפשר הצגת הרקע הרנדומלי באמת
  const profileImage = authUser?.profileImage;

  const isLoggedIn = !!authUser;

  // ======= Mutation: Logout =======
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

  // ======= Queries: Procurement & Budget & Notifications =======
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

  // ======= Documents needing signature =======
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

  // ======= Handlers: Signatures Popup =======
  const togglePopup = () => {
    setShowPopup((prev) => !prev);
    setShowNotifications(false);
    setOpenDropdown(null);
    setOpenSubDropdown(null);
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

  // ======= Handlers: Notifications =======
  const handleNotificationsClick = () => {
    setShowNotifications((prev) => !prev);
    setShowPopup(false);
    setOpenDropdown(null);
    setOpenSubDropdown(null);
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
      const serverMessage =
        error.response?.data?.message ||
        t("navbar.notifications.notificationDeleteError");
      toast.error(serverMessage);
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

  // =============================================
  //       ROLE-BASED COLOR & MENU DATA
  // =============================================
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
      label: "Orders",
      subMenu: [
        { to: "/dashboard/Customers/Orders", text: "Orders List" },
        { to: "/dashboard/Customers/AddOrder", text: "Add-Orders" },
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
        {
          to: "/employee/AddFinance",
          text: t("navbar.create_finance_record"),
        },
      ],
    },
    {
      label: t("navbar.products"),
      subMenu: [
        { to: "/employee/products", text: t("navbar.all_products") },
        { to: "/employee/add-product", text: t("navbar.add_product") },
      ],
    },
    {
      label: t("navbar.procurement"),
      subMenu: [
        {
          to: "/employee/ProcurementProposals",
          text: t("navbar.ProcurementProposals"),
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
        {
          to: "/employee/AddFinance",
          text: t("navbar.create_finance_record"),
        },
      ],
    },
    {
      label: t("navbar.products"),
      subMenu: [
        { to: "/employee/products", text: t("navbar.all_products") },
        { to: "/employee/add-product", text: t("navbar.add_product") },
      ],
    },
    {
      label: t("navbar.procurement"),
      subMenu: [
        {
          to: "/employee/ProcurementProposals",
          text: t("navbar.ProcurementProposals"),
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

  // =============================================
  //       RENDER FUNCTION FOR DROPDOWNS
  // =============================================
  const renderSubMenu = (subMenu, parentIndex) => {
    return (
      <ul className="mt-2 space-y-1">
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
                  className={`flex justify-between items-center w-full px-3 py-2 rounded-md transition-colors
                              bg-gray-100 hover:bg-gray-200 focus:outline-none ${roleLinkColor}`}
                >
                  <span>{item.label}</span>
                  <span className="ml-2 text-xs">
                    {openSubDropdown === uniqueSubIndex ? "▲" : "▼"}
                  </span>
                </button>
                {openSubDropdown === uniqueSubIndex && (
                  <div className="ml-4 border-l-2 border-gray-200 pl-2">
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
                  }}
                  className={`block px-3 py-2 rounded-md hover:bg-gray-200 transition-colors ${roleLinkColor}`}
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
    <nav className="bg-gradient-to-r from-blue-900 via-purple-900 to-gray-900 text-white px-6 py-3 shadow-lg sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Left Side: Logo */}
        <Link
          to="/"
          className="text-3xl font-extrabold tracking-wide text-white hover:scale-105 transition-transform"
        >
          Nexora
        </Link>

        {/* Center: Navigation Links */}
        {isLoggedIn && (
          <div className="flex-1 flex justify-center items-center space-x-4 hidden md:flex">
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
                      className={`flex items-center space-x-0.5 px-2 py-2 rounded-md hover:bg-black/10 transition-colors ${roleLinkColor}`}
                    >
                      <span>{navItem.label}</span>
                      <span className="text-xs">
                        {openDropdown === index ? "▲" : "▼"}
                      </span>
                    </button>
                    {openDropdown === index && (
                      <div
                        className="absolute left-0 mt-2 bg-white text-gray-700 rounded-md shadow-lg p-3 w-56 z-50"
                        onMouseLeave={() => {
                          // ניתן להסיר את האירוע אם לא רוצים שייסגר אוטומטית
                          // setOpenDropdown(null);
                          // setOpenSubDropdown(null);
                        }}
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
                    className={`px-4 py-2 rounded-md hover:bg-black/10 transition-colors ${roleLinkColor}`}
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

        {/* Right Side: Signatures, Notifications, Profile, Logout/Login */}
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              {(itemsRequiringSignature.length > 0 ||
                budgetRequiringSignature.length > 0) && (
                <div className="relative">
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemsRequiringSignature.length +
                      budgetRequiringSignature.length}
                  </span>
                  <button
                    onClick={handleSignature}
                    className="px-3 py-2 bg-accent text-white rounded hover:bg-green-600 transition duration-300"
                  >
                    {t("navbar.Signatures.sign_now")}
                  </button>
                  {showPopup && (
                    <div className="absolute right-0 mt-2 bg-white text-gray-800 shadow-lg rounded-md p-4 w-96 z-50">
                      <h3 className="text-lg font-bold mb-2">
                        {t("navbar.Signatures.documents_requiring_signature")}
                      </h3>
                      <ul className="max-h-64 overflow-y-auto">
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
                          if (!item.PurchaseOrder) {
                            console.warn(
                              `PurchaseOrder missing for procurement ${item._id}`
                            );
                            return null;
                          }
                          return (
                            <li key={item._id} className="mb-3 border-b pb-2">
                              <div>
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
                                  className="mt-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
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
                            <li key={item._id} className="mb-3 border-b pb-2">
                              <div>
                                <strong>
                                  {t("navbar.Signatures.budget_name")}:
                                </strong>{" "}
                                {item.departmentOrProjectName}
                              </div>
                              <div>
                                <strong>
                                  {t("navbar.Signatures.amount")}:
                                </strong>{" "}
                                ${item.amount}
                              </div>
                              <div>
                                <strong>
                                  {t("navbar.Signatures.department")}:
                                </strong>{" "}
                                {item.department}
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
                                  className="mt-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
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
                        onClick={() => {
                          setShowPopup(false);
                          setShowNotifications(false);
                        }}
                        className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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
                    className="relative mr-2"
                  >
                    <FaBell size={24} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div
                      className={`absolute ${
                        i18n.language === "he" || i18n.language === "ar"
                          ? "-left-7"
                          : "right-0"
                      } mt-2 bg-white p-3 rounded shadow-md w-[500px] z-50 text-gray-800`}
                      style={{ maxHeight: "500px", overflowY: "auto" }}
                    >
                      <h3 className="font-bold mb-2 text-lg border-b pb-2 flex justify-between items-center">
                        {t("notifications.title")}
                        <span className="text-sm text-gray-500">
                          <button
                            className="hover:underline"
                            onClick={markNotificationAsReadAll}
                          >
                            {t("notifications.readAll")}
                          </button>
                        </span>
                      </h3>
                      {isLoadingNotifications ? (
                        <p>{t("notifications.loading")}</p>
                      ) : adminNotifications.length > 0 ? (
                        adminNotifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() =>
                              !notification.isRead &&
                              markNotificationAsRead(notification._id)
                            }
                            className={`relative border-b border-gray-200 mb-2 pb-2 pl-3 pr-6 cursor-pointer rounded ${
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
                              className="absolute top-1 right-1 px-1 py-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs"
                              aria-label={t(
                                "navbar.notifications.notificationDeleted"
                              )}
                            >
                              ×
                            </button>
                            <p className="text-sm text-gray-700">
                              {notification.content}
                            </p>
                            <span className="text-xs text-gray-500 block">
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p>{t("navbar.notifications.no_notifications")}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* כאן מציגים תמונת פרופיל או אוואטר טקסטואלי */}
              <div className="w-10 h-10 rounded-full border-2 border-secondary overflow-hidden">
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

              <span className="hidden md:block font-medium">
                {t("navbar.profile.hello", { firstName, lastName })}
              </span>
              <button
                onClick={() => logout()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
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
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
            >
              {t("navbar.profile.login")}
            </Link>
          )}
        </div>
      </div>

      {/* ===== Signature Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 text-center">
              {selectedDocumentType === "budget"
                ? t("navbar.Signatures.budgetDocument")
                : t("navbar.Signatures.procurementDocument")}{" "}
              {t("navbar.Signatures.digitalSignature")}
            </h2>
            {selectedDocumentType === "budget" && selectedBudget && (
              <div className="mb-6 p-5 border border-gray-300 rounded-lg bg-gray-50 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {t("navbar.Signatures.budgetSummary")} -{" "}
                  {selectedBudget.budgetName}
                </h3>
                <p className="text-lg text-gray-800 mb-2">
                  <strong className="font-semibold">
                    {t("navbar.Signatures.amount")}:
                  </strong>{" "}
                  ${selectedBudget.amount}
                </p>
                <p className="text-lg text-gray-800 mb-2">
                  <strong className="font-semibold">
                    {t("navbar.Signatures.department")}:
                  </strong>{" "}
                  {selectedBudget.departmentId?.name ||
                    selectedBudget.departmentId}
                </p>
                <p className="text-lg text-gray-800">
                  <strong className="font-semibold">
                    {t("navbar.Signatures.description")}:
                  </strong>{" "}
                  {selectedBudget.description}
                </p>
              </div>
            )}
            {selectedPDF && (
              <iframe
                src={selectedPDF}
                title="Document PDF"
                className="w-full h-80 mb-6 border border-gray-400 rounded-lg shadow-sm"
              />
            )}
            <SignatureCanvas
              ref={signaturePadRef}
              penColor="black"
              canvasProps={{
                width: 600,
                height: 200,
                className: "border border-gray-400 rounded-lg shadow-sm",
              }}
            />
            <div className="flex justify-end mt-6">
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition duration-300 mr-4 shadow-md"
              >
                {t("events.cancel")}
              </button>
              <button
                onClick={handleSaveSignature}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition duration-300 shadow-md"
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
