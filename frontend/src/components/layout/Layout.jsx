import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SideBar from "../../pages/AdminPanel/layouts/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";
import { GrUpdate } from "react-icons/gr";
import Flag from "react-world-flags";
import PricingPlans from "../../pages/payment/PricingPlans";
import axiosInstance from "../../lib/axios";
import DesignBox from "./DesignBox";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import ChatBot from "./ChatBot";

// Function to format address object into a string (kept for potential future use)
const formatAddress = (addressObj = false, useEnglish = false) => {
  if (!addressObj || typeof addressObj !== "object") {
    return "";
  }

  const { street, city, state, postalCode, country } = addressObj;
  const parts = [street, city, state, postalCode, country].filter(Boolean);

  if (useEnglish) {
    const transliterationMap = {
      "באר שבע": "Beer Sheva",
      ישראל: "Israel",
    };
    return parts.map((part) => transliterationMap[part] || part).join(", ");
  }

  return parts.join(", ");
};

const Layout = ({ children }) => {
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const isAdmin = authUser?.role === "Admin";
  const currentPlan = authUser?.pack || "No Plan";

  // Fetch company data (kept for potential future use)
  const { data: companyData, isLoading: isCompanyLoading } = useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const response = await axiosInstance.get("/company/get-company");
      return response.data.data;
    },
    enabled: !!authUser,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isShiftStarted, setIsShiftStarted] = useState(false);
  const [shiftTime, setShiftTime] = useState(0);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [shiftStartTime, setShiftStartTime] = useState(null);

  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsLanguageOpen(false);
    console.log(`Language changed to: ${lng}`);
  };

  const directionMap = {
    en: "ltr",
    he: "rtl",
    ru: "ltr",
    es: "ltr",
    fr: "ltr",
    ar: "rtl",
    ja: "ltr",
  };

  const flagMap = {
    en: "us",
    he: "il",
    ru: "ru",
    es: "es",
    fr: "fr",
    ar: "sa",
    ja: "jp",
  };

  const isRTL = directionMap[i18n.language] === "rtl";

  useEffect(() => {
    const currentLang = i18n.language;
    const direction = directionMap[currentLang] || "ltr";
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLang;
    console.log(
      `Document direction set to: ${direction}, language: ${currentLang}`
    );
  }, [i18n.language]);

  // Check active shift on page load using localStorage
  useEffect(() => {
    const checkActiveShift = () => {
      if (!authUser) {
        console.log("No authenticated user, skipping shift check");
        return;
      }

      const storedShift = JSON.parse(localStorage.getItem("activeShift"));
      console.log("Stored shift in localStorage:", storedShift);

      if (storedShift?.isShiftStarted && storedShift?.shiftId) {
        setIsShiftStarted(true);
        setCurrentShiftId(storedShift.shiftId);
        setShiftStartTime(new Date(storedShift.startTime));
        console.log(
          `Active shift found: ID=${storedShift.shiftId}, StartTime=${storedShift.startTime}`
        );
      } else {
        localStorage.removeItem("activeShift");
        setIsShiftStarted(false);
        setCurrentShiftId(null);
        setShiftStartTime(null);
        console.log("No active shift found, cleared localStorage");
      }
    };

    checkActiveShift();
  }, [authUser]);

  // Update timer in real-time
  useEffect(() => {
    let timer;
    if (isShiftStarted && shiftStartTime) {
      const updateTimer = () => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now - shiftStartTime) / 1000);
        setShiftTime(elapsedSeconds);
        console.log(`Shift timer updated: ${elapsedSeconds} seconds`);
      };

      updateTimer();
      timer = setInterval(updateTimer, 1000);
    }
    return () => {
      clearInterval(timer);
      console.log("Shift timer cleared");
    };
  }, [isShiftStarted, shiftStartTime]);

  const toggleLanguageMenu = () => {
    setIsLanguageOpen(!isLanguageOpen);
    setIsColorOpen(false);
    console.log(
      `Language menu toggled: ${isLanguageOpen ? "closed" : "opened"}`
    );
  };

  const handleShiftToggle = async () => {
    if (!authUser) {
      toast.error(t("shift.unauthenticated"), {
        position: isRTL ? "top-left" : "top-right",
        duration: 3000,
      });
      console.log("Shift toggle failed: No authenticated user");
      return;
    }

    if (!isShiftStarted) {
      try {
        const response = await axiosInstance.post("/shifts", {
          shiftDate: new Date().toISOString(),
          startTime: new Date().toISOString(),
          notes: "משמרת התחילה",
        });
        const shift = response.data.data;
        console.log("Shift started successfully:", shift);

        setCurrentShiftId(shift._id);
        setShiftStartTime(new Date(shift.startTime));
        setIsShiftStarted(true);
        localStorage.setItem(
          "activeShift",
          JSON.stringify({
            isShiftStarted: true,
            shiftId: shift._id,
            startTime: shift.startTime,
          })
        );
        toast.success(t("shift.started"), {
          position: isRTL ? "top-left" : "top-right",
          duration: 3000,
        });
      } catch (error) {
        console.error(
          "Failed to start shift:",
          error.response?.data || error.message
        );
        toast.error(error.response?.data?.message || t("shift.start_failed"), {
          position: isRTL ? "top-left" : "top-right",
          duration: 5000,
        });
      }
    } else {
      try {
        const hoursWorked = shiftTime / 3600;
        await axiosInstance.put(`/shifts/${currentShiftId}`, {
          hoursWorked,
          endTime: new Date().toISOString(),
          notes: "משמרת הסתיימה",
        });
        console.log(
          `Shift ended successfully: ID=${currentShiftId}, Hours=${hoursWorked.toFixed(
            2
          )}`
        );

        setIsShiftStarted(false);
        setShiftTime(0);
        setCurrentShiftId(null);
        setShiftStartTime(null);
        localStorage.removeItem("activeShift");
        toast.success(t("shift.ended"), {
          position: isRTL ? "top-left" : "top-right",
          duration: 3000,
        });
      } catch (error) {
        console.error(
          "Failed to end shift:",
          error.response?.data || error.message
        );
        toast.error(error.response?.data?.message || t("shift.end_failed"), {
          position: isRTL ? "top-left" : "top-right",
          duration: 3000,
        });
      }
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Callback to update modal state
  const handleModalStateChange = (isOpen) => {
    setIsModalOpen(isOpen);
  };

  return (
    <div
      className={`flex flex-col min-h-screen w-full animate-fade-in ${
        isRTL ? "font-hebrew" : "font-sans"
      } ${isMenuOpen || isModalOpen ? "bg-gray-900 bg-opacity-70" : ""}`}
    >
      <Navbar
        isRTL={isRTL}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onModalStateChange={handleModalStateChange}
      />

      {ReactDOM.createPortal(
        <DesignBox setIsLanguageOpen={setIsLanguageOpen} isRTL={isRTL} />,
        document.body
      )}

      <div className="flex flex-grow h-auto w-full relative z-10">
        {isAdmin && (
          <div
            className={`hidden xl:block fixed top-0 bottom-0 ${
              isRTL ? "right-0" : "left-0"
            } w-64 shadow-xl animate-slide-in z-50`}
          >
            <SideBar isRTL={isRTL} />
          </div>
        )}
        <main
          className={`flex-grow w-full relative ${
            isAdmin
              ? isRTL
                ? "md:pr-0 lg:pr-0 xl:pr-64 2xl:pr-64"
                : "md:pl-0 lg:pl-0 xl:pl-64 2xl:pl-64"
              : ""
          }`}
        >
          {/* Overlay for main content when modal is open */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 pointer-events-none" />
          )}
          <div className="relative overflow-hidden">
            {authUser && <ChatBot />}

            {/* Language Button */}
            <div
              className={`fixed top-20 ${isRTL ? "left-4" : "right-4"} z-50`}
            >
              <div className="relative">
                <button
                  type="button"
                  className="p-2 bg-primary text-button-text rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                  onClick={toggleLanguageMenu}
                >
                  <FaGlobe className="w-5 h-5" />
                </button>
                {isLanguageOpen && (
                  <div
                    className={`absolute ${
                      isRTL ? "left-0" : "right-0"
                    } top-full mt-2 bg-white shadow-2xl rounded-xl w-48 sm:w-56 xl:w-64 max-h-64 overflow-y-auto border border-border-color animate-slide-down z-[10000]`}
                  >
                    {Object.keys(flagMap).map((lng) => (
                      <button
                        key={lng}
                        onClick={() => changeLanguage(lng)}
                        className={`flex items-center px-3 py-2 sm:px-4 sm:py-3 xl:px-5 xl:py-3 text-text hover:bg-accent hover:text-button-text w-full ${
                          isRTL ? "text-right" : "text-left"
                        } text-sm sm:text-base xl:text-lg transition-all duration-200`}
                      >
                        <Flag
                          code={flagMap[lng]}
                          className={`w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7 ${
                            isRTL ? "ml-2" : "mr-2"
                          } rounded-full shadow-sm`}
                        />
                        <span className="truncate">{t(`${lng}`)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upgrade Button (Admin Only) */}
            {isAdmin && authUser && (
              <div
                className={`fixed top-60 ${isRTL ? "left-4" : "right-4"} z-50`}
              >
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-3 bg-primary text-button-text rounded-full shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in"
                  onClick={() => setIsPricingModalOpen(true)}
                >
                  <GrUpdate
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      isRTL ? "ml-2" : "mr-2"
                    }`}
                  />
                  <span className="truncate font-semibold">
                    {t("layout.upgrade")} {currentPlan}
                  </span>
                </button>
              </div>
            )}

            {isPricingModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-down relative">
                  <button
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                    onClick={() => setIsPricingModalOpen(false)}
                  >
                    ✕
                  </button>
                  <PricingPlans currentPlan={currentPlan} />
                </div>
              </div>
            )}

            {/* Shift Button and Timer */}
            {authUser && (
              <div
                className={`fixed top-44 ${isRTL ? "left-4" : "right-4"} z-50`}
              >
                <button
                  onClick={handleShiftToggle}
                  className="bg-primary text-button-text px-6 py-3 rounded-full shadow-lg hover:bg-secondary transition-colors duration-200 animate-fade-in"
                  disabled={isCompanyLoading}
                >
                  {isCompanyLoading
                    ? t("shift.loading")
                    : isShiftStarted
                    ? formatTime(shiftTime)
                    : t("shift.start")}
                </button>
              </div>
            )}

            <div className={isRTL ? "text-right" : "text-left"}>{children}</div>
          </div>
        </main>
      </div>

      <Footer isRTL={isRTL} />
      <Toaster position={isRTL ? "top-left" : "top-right"} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(${
            isRTL ? "20px" : "-20px"
          }); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
        .animate-slide-down { animation: slideDown 0.3s ease-out forwards; }

        :root {
          --color-primary: #1D4ED8;
          --color-secondary: #6B7280;
          --color-accent: #10B981;
          --bg-color: #F9FAFB;
          --text-color: #111827;
          --button-bg: #1D4ED8;
          --button-text: #FFFFFF;
          --border-color: #E5E7EB;
          --footer-bg: #F3F4F6;
        }
      `}</style>
    </div>
  );
};

export default Layout;
