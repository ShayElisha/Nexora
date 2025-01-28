import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../lib/axios";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas"; // ייבוא ספריית החתימה
import toast from "react-hot-toast";
// אייקון פעמון
import { FaBell } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const Navbar = () => {
  const { t } = useTranslation();
  // הגדרות useState ו-useRef
  const [showPopup, setShowPopup] = useState(false); // מצב הצגת חלונית חתימות
  const [selectedPDF, setSelectedPDF] = useState(null); // PDF to display in modal
  const [showModal, setShowModal] = useState(false); // Modal state
  const signaturePadRef = useRef(null); // Reference to signature canvas
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [hoveredDropdown, setHoveredDropdown] = useState(null);

  const queryClient = useQueryClient();

  // Fetch authenticated user data
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
  const profileImage =
    authUser?.profileImage || "https://via.placeholder.com/150";

  const isLoggedIn = !!authUser;

  // Dropdown hover state
  let hoverTimeout = null;

  const handleMouseEnter = (label) => {
    clearTimeout(hoverTimeout);
    setHoveredDropdown(label);
  };

  const handleMouseLeave = () => {
    hoverTimeout = setTimeout(() => setHoveredDropdown(null), 300); // Delay of 300ms
  };

  // Logout mutation
  const { mutate: logout, isLoading: isLoggingOut } = useMutation({
    mutationFn: async () => {
      await axiosInstance.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear(); // מנקה את כל המטמון, כולל המשתמש
      localStorage.removeItem("authUser"); // הסר נתוני משתמש אם מאוחסנים מקומית
      window.location.href = "/login"; // ניתוב מיידי לדף ההתחברות
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      toast.error("Failed to log out. Please try again.");
    },
  });

  // Fetch procurement data, enabled only if user is logged in
  const {
    data: procurementData,
    error: procurementError,
    isLoading: procurementLoading,
  } = useQuery({
    queryKey: ["procurement"],
    queryFn: async () => {
      const response = await axiosInstance.get("/procurement");
      return response.data.data;
    },
    enabled: isLoggedIn, // Only fetch if logged in
  });

  // Fetch budget data, enabled only if user is logged in
  const {
    data: badgerData,
    error: budgetError,
    isLoading: budgetLoading,
  } = useQuery({
    queryKey: ["budget"],
    queryFn: async () => {
      const response = await axiosInstance.get("/budget");
      return response.data.data;
    },
    enabled: isLoggedIn, // Only fetch if logged in
  });

  // Fetch admin notifications, enabled only if user is admin
  const {
    data: adminNotifications,
    isLoading: isLoadingNotifications,
    refetch: refetchAdminNotifications,
  } = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/notifications/admin-notifications"
      );
      console.log("not ", response.data.data);
      return response.data.data;
    },
    enabled: isLoggedIn && authUser?.role === "Admin",
  });

  const unreadCount = adminNotifications?.filter((n) => !n.isRead).length || 0;

  // Filter procurement items requiring signature
  const itemsRequiringSignature =
    procurementData?.filter(
      (item) =>
        item.approvalStatus === "Pending Approval" &&
        item.signers?.some(
          (signer) =>
            signer.employeeId === authUser?.employeeId && !signer.hasSigned
        )
    ) || [];

  console.log("badgerData:", badgerData);

  // Filter budget items requiring signature
  const budgetRequiringSignature = badgerData?.filter(
    (item) =>
      item.status === "Draft" &&
      item.signers?.some(
        (signer) =>
          signer.employeeId === authUser?.employeeId && !signer.hasSigned
      )
  );

  console.log("budgetRequiringSignature:", budgetRequiringSignature);

  const isSigner =
    !!itemsRequiringSignature.length || !!budgetRequiringSignature?.length;

  // Functions to control signature modal
  const togglePopup = () => setShowPopup((prev) => !prev);

  const handleSignature = async () => {
    togglePopup(); // Open the popup
    setShowNotifications(false); // סגירת התראות כאשר נפתח פופאפ חתימות
  };

  const handleOpenModal = (pdfUrl, itemId, type, budgetDetails = null) => {
    setSelectedPDF(pdfUrl);
    setSelectedItemId(itemId);
    setSelectedDocumentType(type); // Set document type to 'budget' or 'procurement'

    if (type === "budget") {
      setSelectedBudget(budgetDetails); // Store budget details for modal
    } else {
      setSelectedBudget(null); // Clear budget details when procurement is selected
    }

    setShowModal(true);

    // סגירת פופאפים אחרים בעת פתיחת מודאל
    setShowPopup(false);
    setShowNotifications(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPDF(null);
  };

  const handleSaveSignature = async () => {
    if (signaturePadRef.current && selectedItemId) {
      const signatureData = signaturePadRef.current.toDataURL(); // Get signature as a data URL

      let endpoint = "";

      if (selectedDocumentType === "procurement") {
        endpoint = `/procurement/${selectedItemId}/sign`;
      } else if (selectedDocumentType === "budget") {
        endpoint = `/budget/${selectedItemId}/sign`;
      }

      if (!endpoint) {
        toast.error("Invalid document type.");
        return;
      }

      try {
        await axiosInstance.post(endpoint, {
          employeeId: authUser.employeeId,
          signature: signatureData,
        });

        toast.success("Signature saved successfully!");
        queryClient.invalidateQueries(["procurement", "budget"]); // Refresh cache for both types
        handleCloseModal(); // Close the modal
      } catch (error) {
        console.error("Error saving signature:", error);
        const serverMessage =
          error.response?.data?.message ||
          "An error occurred while saving the signature.";
        toast.error(serverMessage);
      }
    } else {
      toast.error("No item selected for signing.");
    }
  };

  // Filter my procurements based on current signer
  const myProcurements = procurementData?.filter((item) =>
    item.signers.some(
      (signer) =>
        signer.employeeId === authUser?.employeeId && !signer.hasSigned
    )
  );

  function getNextSigner(item) {
    const sorted = [...(item.signers || [])].sort((a, b) => a.order - b.order);
    return sorted.find((signer) => signer.order === item.currentSignerIndex);
  }

  // Functions to handle notifications
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNotificationsClick = () => {
    setShowNotifications((prev) => !prev);
    setShowPopup(false); // סגירת פופאפ חתימות כאשר נפתח פופאפ התראות
    // Refetch to ensure updated notifications
    refetchAdminNotifications();
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axiosInstance.delete(`/notifications/delete`, {
        data: { notificationId },
      });
      toast.success("Notification deleted successfully!");
      refetchAdminNotifications(); // Refresh notification list
    } catch (error) {
      console.error("Error deleting notification:", error);
      const serverMessage =
        error.response?.data?.message ||
        "An error occurred while deleting the notification.";
      toast.error(serverMessage);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axiosInstance.post(`/notifications/mark-as-read`, {
        notificationId,
      });
      toast.success("Notification marked as read!");
      refetchAdminNotifications(); // Refresh notification list
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read.");
    }
  };

  // ניקוי timeout בעת unmount
  useEffect(() => {
    return () => {
      clearTimeout(hoverTimeout);
    };
  }, []);

  // אין החזרות מוקדמות, כל ה-hooks נקראים תמיד

  return (
    <nav className="bg-gray-800 text-white px-8 py-4 shadow-md sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-3xl font-extrabold tracking-wide text-blue-400 hover:text-blue-500 transition duration-300"
        >
          Nexora
        </Link>

        {/* Navigation Links */}
        {isLoggedIn && authUser?.role === "Admin" && (
          <ul className="hidden md:flex items-center space-x-6 text-lg">
            <li>
              <Link
                to="/dashboard"
                className="hover:text-blue-400 ml-2 transition duration-300"
              >
                {t("navbar.dashboard")}
              </Link>
            </li>

            {/* Dropdowns */}
            {[
              {
                label: t("navbar.products"),
                links: [
                  { to: "/dashboard/products", text: t("navbar.all_products") },
                  {
                    to: "/dashboard/add-product",
                    text: t("navbar.add_product"),
                  },
                ],
              },
              {
                label: t("navbar.supplier"),
                links: [
                  {
                    to: "/dashboard/supplier",
                    text: t("navbar.all_suppliers"),
                  },
                  {
                    to: "/dashboard/add-supplier",
                    text: t("navbar.add_supplier"),
                  },
                ],
              },
              {
                label: t("navbar.finance"),
                links: [
                  {
                    to: "/dashboard/finance",
                    text: t("navbar.finance_records"),
                  },
                  {
                    to: "/dashboard/add-finance-record",
                    text: t("navbar.create_finance_record"),
                  },
                ],
              },
              {
                label: t("navbar.budget"),
                links: [
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
              {
                label: t("navbar.procurement"),
                links: [
                  {
                    to: "/dashboard/procurement",
                    text: t("navbar.procurement"),
                  },
                  {
                    to: "/dashboard/add-procurement-record",
                    text: t("navbar.create_procurement_record"),
                  },
                ],
              },
              {
                label: t("navbar.employees"),
                links: [
                  {
                    to: "/dashboard/employees",
                    text: t("navbar.all_employees"),
                  },
                  { to: "/dashboard/signup", text: t("navbar.new_employee") },
                ],
              },
              {
                label: t("navbar.signatures"),
                links: [
                  {
                    to: "/dashboard/historySignature",
                    text: t("navbar.my_signature"),
                  },
                  {
                    to: "/dashboard/historyAllSignature",
                    text: t("navbar.all_signatures"),
                  },
                ],
              },
            ].map((dropdown, index) => (
              <li
                key={index}
                className="relative"
                onMouseEnter={() => handleMouseEnter(dropdown.label)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="cursor-pointer flex items-center hover:text-blue-400 transition duration-300">
                  {dropdown.label}
                  <span className="ml-1 text-sm">▼</span>
                </div>
                {hoveredDropdown === dropdown.label && (
                  <ul className="absolute mt-2 bg-white text-gray-800 shadow-lg rounded-md overflow-hidden w-56">
                    {dropdown.links.map((link, i) => (
                      <li key={i}>
                        <Link
                          to={link.to}
                          onClick={() => {
                            setShowPopup(false);
                            setShowNotifications(false);
                          }}
                          className="block px-4 py-2 hover:bg-blue-500 hover:text-white transition duration-200"
                        >
                          {link.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* User Info & Logout */}
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              {/* כפתור חתימות: מציג כמות מסמכים שדורשים חתימה */}
              {(itemsRequiringSignature.length > 0 ||
                (budgetRequiringSignature &&
                  budgetRequiringSignature.length > 0)) && (
                <div className="relative">
                  <span className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemsRequiringSignature.length +
                      (budgetRequiringSignature?.length || 0)}
                  </span>
                  <button
                    onClick={handleSignature}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
                  >
                    Sign Now
                  </button>

                  {showPopup && (
                    <div className="absolute mt-2 bg-white text-gray-800 shadow-lg rounded-md p-4 w-96">
                      <h3 className="text-lg font-bold mb-2">
                        {t("navbar.Signatures.documents_requiring_signature")}
                      </h3>
                      <ul>
                        {/* Procurement Documents */}
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
                              `PurchaseOrder is missing for procurement ${item._id}`
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

                        {/* Budget Documents */}
                        {budgetRequiringSignature?.map((item) => {
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

              {/* כפתור התראות (Notifications) */}
              {authUser?.role === "Admin" && (
                <div className="relative">
                  <button
                    onClick={handleNotificationsClick}
                    className="relative mr-4"
                  >
                    <FaBell size={24} />
                    {/* Badge לכמות התראות לא נקראו (אם יש) */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div
                      className={`absolute ${
                        i18n.language === "he" || i18n.language === "ar"
                          ? "-left-7"
                          : "right-0 translate-x-4"
                      } mt-2 bg-white p-3 rounded shadow-md w-[500px] z-50 text-gray-800`}
                      style={{ maxHeight: "500px", overflowY: "auto" }}
                    >
                      <h3 className="font-bold mb-2 text-lg border-b pb-2">
                        {t("notifications.title")}
                      </h3>
                      {isLoadingNotifications ? (
                        <p>{t("notifications.loading")}</p>
                      ) : adminNotifications?.length > 0 ? (
                        adminNotifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() =>
                              !notification.isRead &&
                              markNotificationAsRead(notification._id)
                            }
                            className={`relative border-b border-gray-200 mb-2 mr-2 pb-2 px-3 py-2 cursor-pointer rounded ${
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
                              className="absolute top-0.5 right-1 px-1 py-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs"
                              aria-label={t(
                                "navbar.notifications.notification_deleted"
                              )}
                            >
                              &times;
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

              <div className="w-10 h-10 rounded-full border-2 border-blue-400 overflow-hidden">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden md:block font-medium">
                {t("navbar.profile.hello", { firstName, lastName })}{" "}
              </span>
              <button
                onClick={() => logout()}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
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

      {/* Modal חתימה */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 text-center">
              {selectedDocumentType === "budget" ? "Budget" : "Procurement"}{" "}
              Digital Signature
            </h2>

            {/* Budget details when selected */}
            {selectedDocumentType === "budget" && selectedBudget && (
              <div className="mb-6 p-5 border border-gray-300 rounded-lg bg-gray-50 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Budget Summary - {selectedBudget.budgetName}
                </h3>
                <p className="text-lg text-gray-800 mb-2">
                  <strong className="font-semibold">Amount:</strong> $
                  {selectedBudget.amount}
                </p>
                <p className="text-lg text-gray-800 mb-2">
                  <strong className="font-semibold">Department:</strong>{" "}
                  {selectedBudget.department}
                </p>
                <p className="text-lg text-gray-800">
                  <strong className="font-semibold">Description:</strong>{" "}
                  {selectedBudget.description}
                </p>
              </div>
            )}

            {/* Display the procurement or budget PDF */}
            {selectedPDF && (
              <iframe
                src={selectedPDF}
                title="Document PDF"
                className="w-full h-80 mb-6 border border-gray-400 rounded-lg shadow-sm"
              ></iframe>
            )}

            {/* Signature Canvas */}
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
                Cancel
              </button>
              <button
                onClick={handleSaveSignature}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition duration-300 shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
