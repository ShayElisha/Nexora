import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";
import { GrUpdate } from "react-icons/gr";
import { X, Clock, Play, Square, Loader2, Zap, Crown, TrendingUp } from "lucide-react";
import Flag from "react-world-flags";
import PricingPlans from "../../pages/payment/PricingPlans";
import axiosInstance from "../../lib/axios";
import DesignBox from "./DesignBox";
import toast from "react-hot-toast";
import AiChat from "../Ai/AiChat";
import PaymentStatusBanner from "../PaymentStatusBanner";

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
  const queryClient = useQueryClient();
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/auth/me");
        return response.data || null;
      } catch (error) {
        if (error.code === 'ERR_CONNECTION_REFUSED' || error.message?.includes('Network Error')) {
          return null; // Server is not running
        }
        if (error.response?.status === 401) {
          return null; // Not authenticated
        }
        return null; // Always return a value
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
  const authUser = authData?.user;
  const isAdmin = authUser?.role === "Admin";
  
  // Fetch current subscription plan
  const { data: currentPlanData } = useQuery({
    queryKey: ["currentPlan", authUser?.company],
    queryFn: async () => {
      if (!authUser?.company) return null;
      try {
        const response = await axiosInstance.get(
          `/payment/get-latest-payment/${authUser.company}`,
          { withCredentials: true }
        );
        if (response.data.success && response.data.payment) {
          const { planName, startDate, endDate } = response.data.payment;
          const durationInMonths =
            (new Date(endDate) - new Date(startDate)) /
            (1000 * 60 * 60 * 24 * 30);
          const inferredDuration = durationInMonths > 11 ? "Yearly" : "Monthly";
          return { planName, duration: inferredDuration };
        }
        return null;
      } catch (error) {
        console.error("Error fetching current plan:", error);
        return null;
      }
    },
    enabled: !!authUser?.company,
  });
  
  const currentPlan = currentPlanData?.planName || "No Plan";

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
  const [isShiftLoading, setIsShiftLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);

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

  // Check active shift on page load - first from server, then localStorage
  useEffect(() => {
    const checkActiveShift = async () => {
      if (!authUser) {
        console.log("No authenticated user, skipping shift check");
        return;
      }

      try {
        // First, check server for active shift
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const response = await axiosInstance.get("/shifts", {
          params: {
            startDate: today.toISOString(),
            endDate: tomorrow.toISOString(),
            employeeId: authUser.employeeId,
          },
        });

        const shifts = response.data.data || [];
        const activeShift = shifts.find(
          (shift) => !shift.endTime && new Date(shift.shiftDate).toDateString() === today.toDateString()
        );

        if (activeShift) {
          // Found active shift on server
          setIsShiftStarted(true);
          setCurrentShiftId(activeShift._id);
          setShiftStartTime(new Date(activeShift.startTime));
          setCurrentShift(activeShift);
          localStorage.setItem(
            "activeShift",
            JSON.stringify({
              isShiftStarted: true,
              shiftId: activeShift._id,
              startTime: activeShift.startTime,
            })
          );
          console.log(
            `Active shift found on server: ID=${activeShift._id}, StartTime=${activeShift.startTime}`
          );
        } else {
          // Check localStorage as fallback
          const storedShift = JSON.parse(localStorage.getItem("activeShift"));
          if (storedShift?.isShiftStarted && storedShift?.shiftId) {
            // Verify shift still exists on server
            try {
              const shiftResponse = await axiosInstance.get(`/shifts/${storedShift.shiftId}`);
              const shift = shiftResponse.data.data;
              if (shift && !shift.endTime) {
                setIsShiftStarted(true);
                setCurrentShiftId(shift._id);
                setShiftStartTime(new Date(shift.startTime));
                setCurrentShift(shift);
                console.log(
                  `Active shift found in localStorage and verified: ID=${shift._id}`
                );
              } else {
                // Shift ended on server
                localStorage.removeItem("activeShift");
                setIsShiftStarted(false);
                setCurrentShiftId(null);
                setShiftStartTime(null);
                setCurrentShift(null);
                console.log("Shift ended on server, cleared localStorage");
              }
            } catch (error) {
              // Shift doesn't exist on server, clear localStorage
              localStorage.removeItem("activeShift");
              setIsShiftStarted(false);
              setCurrentShiftId(null);
              setShiftStartTime(null);
              setCurrentShift(null);
              console.log("Shift not found on server, cleared localStorage");
            }
          } else {
            localStorage.removeItem("activeShift");
            setIsShiftStarted(false);
            setCurrentShiftId(null);
            setShiftStartTime(null);
            setCurrentShift(null);
            console.log("No active shift found");
          }
        }
      } catch (error) {
        console.error("Error checking active shift:", error);
        // Fallback to localStorage if server check fails
        const storedShift = JSON.parse(localStorage.getItem("activeShift"));
        if (storedShift?.isShiftStarted && storedShift?.shiftId) {
          setIsShiftStarted(true);
          setCurrentShiftId(storedShift.shiftId);
          setShiftStartTime(new Date(storedShift.startTime));
          console.log("Using localStorage fallback due to server error");
        }
      }
    };

    checkActiveShift();
  }, [authUser]);

  // Update timer in real-time and check for long shifts
  useEffect(() => {
    let timer;
    if (isShiftStarted && shiftStartTime) {
      const updateTimer = () => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now - shiftStartTime) / 1000);
        setShiftTime(elapsedSeconds);
        
        // Warn if shift is longer than 12 hours
        const hours = elapsedSeconds / 3600;
        if (hours >= 12 && hours < 12.01) {
          toast.warning(t("shift.long_shift_warning") || "המשמרת ארוכה מ-12 שעות!", {
            position: isRTL ? "top-left" : "top-right",
            duration: 5000,
          });
        }
      };

      updateTimer();
      timer = setInterval(updateTimer, 1000);
    }
    return () => {
      clearInterval(timer);
      console.log("Shift timer cleared");
    };
  }, [isShiftStarted, shiftStartTime, isRTL, t]);

  // Periodic revalidation of shift status from server
  useEffect(() => {
    if (!isShiftStarted || !currentShiftId) return;

    const revalidateShift = async () => {
      try {
        const response = await axiosInstance.get(`/shifts/${currentShiftId}`);
        const shift = response.data.data;
        
        if (shift && shift.endTime) {
          // Shift ended on server
          setIsShiftStarted(false);
          setShiftTime(0);
          setCurrentShiftId(null);
          setShiftStartTime(null);
          setCurrentShift(null);
          localStorage.removeItem("activeShift");
          toast.info(t("shift.ended_on_server") || "המשמרת הסתיימה בשרת", {
            position: isRTL ? "top-left" : "top-right",
            duration: 3000,
          });
        } else if (shift) {
          // Update current shift data
          setCurrentShift(shift);
        }
      } catch (error) {
        console.error("Error revalidating shift:", error);
        // Don't show error to user, just log it
      }
    };

    // Revalidate every 60 seconds
    const interval = setInterval(revalidateShift, 60000);
    return () => clearInterval(interval);
  }, [isShiftStarted, currentShiftId, isRTL, t]);

  // Warn before closing page if shift is active
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isShiftStarted) {
        e.preventDefault();
        e.returnValue = t("shift.warning_close") || "יש לך משמרת פעילה! האם אתה בטוח שברצונך לעזוב?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isShiftStarted, t]);

  const toggleLanguageMenu = () => {
    setIsLanguageOpen(!isLanguageOpen);
    setIsColorOpen(false);
    console.log(
      `Language menu toggled: ${isLanguageOpen ? "closed" : "opened"}`
    );
  };

  const handleShiftToggle = async () => {
    if (!authUser) {
      toast.error(t("shift.unauthenticated") || "לא מאומת", {
        position: isRTL ? "top-left" : "top-right",
        duration: 3000,
      });
      console.log("Shift toggle failed: No authenticated user");
      return;
    }

    setIsShiftLoading(true);

    if (!isShiftStarted) {
      try {
        // Check for overlapping shifts before creating new one
        const now = new Date();
        const checkResponse = await axiosInstance.get("/shifts", {
          params: {
            startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Check last 7 days
            endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // And next 24 hours
            employeeId: authUser.employeeId,
          },
        });

        const existingShifts = checkResponse.data.data || [];
        
        // Check for active shift (no endTime)
        const activeShift = existingShifts.find((shift) => !shift.endTime);
        if (activeShift) {
          const activeStart = new Date(activeShift.startTime).toLocaleString('he-IL');
          toast.error(
            t("shift.already_active") || `יש לך כבר משמרת פעילה שהתחילה ב-${activeStart}`,
            {
              position: isRTL ? "top-left" : "top-right",
              duration: 6000,
            }
          );
          setIsShiftLoading(false);
          return;
        }

        // Check for overlapping shifts
        // Two shifts overlap if: start1 < end2 AND start2 < end1
        // For active shifts (endTime = null), treat as infinite end time
        const overlappingShifts = existingShifts.filter((shift) => {
          const shiftStart = new Date(shift.startTime);
          const shiftEnd = shift.endTime ? new Date(shift.endTime) : null;
          
          // New shift starts at 'now' and has no end (will be active)
          // Existing shift overlaps if:
          // 1. Existing shift starts before new shift ends (new shift has no end, so always true if shift started)
          // 2. Existing shift ends after new shift starts (now) OR existing shift has no end
          return shiftStart < now && // Existing shift started before now
                 (shiftEnd ? shiftEnd > now : true); // Existing shift ends after now OR has no end
        });

        if (overlappingShifts.length > 0) {
          const overlappingShift = overlappingShifts[0];
          const overlapStart = new Date(overlappingShift.startTime).toLocaleString('he-IL');
          const overlapEnd = overlappingShift.endTime 
            ? new Date(overlappingShift.endTime).toLocaleString('he-IL')
            : 'משמרת פעילה';
          
          toast.error(
            t("shift.overlapping_error") || 
            `לא ניתן להתחיל משמרת - קיימת משמרת חופפת: ${overlapStart} - ${overlapEnd}`,
            {
              position: isRTL ? "top-left" : "top-right",
              duration: 7000,
            }
          );
          setIsShiftLoading(false);
          return;
        }

        // Create new shift
        const response = await axiosInstance.post("/shifts", {
          shiftDate: now.toISOString(),
          startTime: now.toISOString(),
          notes: t("shift.started_note") || "משמרת התחילה",
        });
        const shift = response.data.data;
        console.log("Shift started successfully:", shift);

        setCurrentShiftId(shift._id);
        setShiftStartTime(new Date(shift.startTime));
        setIsShiftStarted(true);
        setCurrentShift(shift);
        localStorage.setItem(
          "activeShift",
          JSON.stringify({
            isShiftStarted: true,
            shiftId: shift._id,
            startTime: shift.startTime,
          })
        );
        toast.success(t("shift.started") || "המשמרת התחילה", {
          position: isRTL ? "top-left" : "top-right",
          duration: 3000,
        });
      } catch (error) {
        console.error(
          "Failed to start shift:",
          error.response?.data || error.message
        );
        
        // Handle overlap error from server
        if (error.response?.status === 400 && error.response?.data?.overlappingShift) {
          const overlap = error.response.data.overlappingShift;
          const overlapStart = new Date(overlap.startTime).toLocaleString('he-IL');
          const overlapEnd = overlap.endTime 
            ? new Date(overlap.endTime).toLocaleString('he-IL')
            : 'משמרת פעילה';
          
          toast.error(
            error.response.data.message || 
            `לא ניתן להתחיל משמרת - קיימת משמרת חופפת: ${overlapStart} - ${overlapEnd}`,
            {
              position: isRTL ? "top-left" : "top-right",
              duration: 7000,
            }
          );
        } else if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
          toast.error(t("shift.network_error") || "שגיאת רשת. אנא בדוק את החיבור לאינטרנט.", {
            position: isRTL ? "top-left" : "top-right",
            duration: 5000,
          });
        } else {
          toast.error(error.response?.data?.message || t("shift.start_failed") || "נכשל בהתחלת המשמרת", {
            position: isRTL ? "top-left" : "top-right",
            duration: 5000,
          });
        }
      } finally {
        setIsShiftLoading(false);
      }
    } else {
      try {
        // Calculate hours worked using server time (from shift startTime)
        if (!shiftStartTime) {
          throw new Error("Shift start time not available");
        }

        // Get current time from server response to ensure accuracy
        const endTime = new Date();
        const startTime = new Date(shiftStartTime);
        const hoursWorked = (endTime - startTime) / (1000 * 60 * 60);

        if (hoursWorked < 0) {
          throw new Error("Invalid shift duration");
        }

        const response = await axiosInstance.put(`/shifts/${currentShiftId}`, {
          hoursWorked: parseFloat(hoursWorked.toFixed(2)),
          endTime: endTime.toISOString(),
          notes: t("shift.ended_note") || "משמרת הסתיימה",
        });
        
        const updatedShift = response.data.data;
        console.log(
          `Shift ended successfully: ID=${currentShiftId}, Hours=${hoursWorked.toFixed(2)}`
        );

        setIsShiftStarted(false);
        setShiftTime(0);
        setCurrentShiftId(null);
        setShiftStartTime(null);
        setCurrentShift(null);
        localStorage.removeItem("activeShift");
        
        // Show shift summary if available
        if (updatedShift?.totalPay) {
          toast.success(
            t("shift.ended_with_pay", { 
              hours: hoursWorked.toFixed(2),
              pay: updatedShift.totalPay.toFixed(2)
            }) || `המשמרת הסתיימה: ${hoursWorked.toFixed(2)} שעות, ${updatedShift.totalPay.toFixed(2)} ₪`,
            {
              position: isRTL ? "top-left" : "top-right",
              duration: 5000,
            }
          );
        } else {
          toast.success(t("shift.ended") || "המשמרת הסתיימה", {
            position: isRTL ? "top-left" : "top-right",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error(
          "Failed to end shift:",
          error.response?.data || error.message
        );
        
        // Handle network errors
        if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
          toast.error(t("shift.network_error") || "שגיאת רשת. אנא בדוק את החיבור לאינטרנט.", {
            position: isRTL ? "top-left" : "top-right",
            duration: 5000,
          });
        } else {
          toast.error(error.response?.data?.message || t("shift.end_failed") || "נכשל בסיום המשמרת", {
            position: isRTL ? "top-left" : "top-right",
            duration: 5000,
          });
        }
      } finally {
        setIsShiftLoading(false);
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

      {/* Payment Status Banner - shows when payment failed */}
      <div className="w-full">
        <PaymentStatusBanner />
      </div>

      {ReactDOM.createPortal(
        <DesignBox setIsLanguageOpen={setIsLanguageOpen} isRTL={isRTL} />,
        document.body
      )}

      {ReactDOM.createPortal(
        <div
          className={`fixed ${isRTL ? "left-4" : "right-4"} z-50`}
          style={{ bottom: '5.5rem' }}
        >
          <button
            onClick={toggleLanguageMenu}
            className="p-3 bg-gradient-to-r from-primary to-secondary text-button-text rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            title={t("design.change_language")}
          >
            <FaGlobe className="w-5 h-5" />
          </button>
          {isLanguageOpen && (
            <div
              className={`absolute ${
                isRTL ? "left-0" : "right-0"
              } bottom-full mb-2 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl w-64 sm:w-72 xl:w-80 max-h-80 overflow-y-auto border border-gray-200/50 animate-slide-up z-[1000]`}
            >
              <div className="p-4 border-b border-gray-200/50">
                <h3 className="text-lg font-bold text-gray-800 text-center">{t("design.select_language")}</h3>
                <p className="text-sm text-gray-600 text-center mt-1">{t("design.choose_language")}</p>
              </div>
              <div className="p-2">
                {Object.keys(flagMap).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => changeLanguage(lng)}
                    className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full ${
                      isRTL ? "text-right" : "text-left"
                    } text-sm sm:text-base transition-all duration-200 rounded-xl mb-1 group`}
                  >
                    <Flag
                      code={flagMap[lng]}
                      className={`w-6 h-6 sm:w-7 sm:h-7 ${
                        isRTL ? "ml-3" : "mr-3"
                      } rounded-full shadow-md ring-2 ring-white group-hover:ring-4 group-hover:ring-opacity-50 transition-all duration-200`}
                    />
                    <span className="truncate font-medium capitalize">{t(`${lng}`)}</span>
                    {i18n.language === lng && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      <div className="flex flex-grow h-auto w-full relative z-10">
        <main className="flex-grow w-full relative transition-all duration-300">
          {/* Overlay for main content when modal is open */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 pointer-events-none" />
          )}
          <div className="relative overflow-hidden">
            {authUser && <AiChat isRTL={isRTL} />}

            {/* Upgrade Button (Admin Only) */}
            {isAdmin && authUser && (
              <div
                className={`fixed top-60 ${isRTL ? "left-4" : "right-4"} z-50`}
              >
                <button
                  type="button"
                  className="group relative inline-flex items-center px-5 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm overflow-hidden"
                  onClick={() => setIsPricingModalOpen(true)}
                >
                  {/* Background Animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Content */}
                  <div className="relative flex items-center gap-2">
                    <Crown className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                    <span className="font-bold text-sm sm:text-base">
                      {t("layout.upgrade")}
                    </span>
                    <span className="hidden sm:inline px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs font-bold">
                      {currentPlan}
                    </span>
                  </div>
                  
                  {/* Sparkle Effect */}
                  <Zap className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-bounce" />
                </button>
              </div>
            )}

            {isPricingModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4 overflow-hidden">
                <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden relative shadow-2xl flex flex-col">
                  <button
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
                    onClick={() => setIsPricingModalOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="overflow-y-auto flex-1">
                    <PricingPlans 
                      currentPlan={currentPlanData} 
                      onPlanUpdate={() => {
                        queryClient.invalidateQueries(["currentPlan"]);
                        setIsPricingModalOpen(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Shift Button and Timer */}
            {authUser && (
              <div
                className={`fixed ${isRTL ? "left-4" : "right-4"} z-50`}
                style={{ top: 'calc(11rem - 50px)' }}
              >
                <button
                  onClick={handleShiftToggle}
                  className={`px-5 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm font-bold flex items-center gap-2 ${
                    isShiftStarted
                      ? "bg-gradient-to-r from-red-500 to-orange-600 text-white animate-pulse"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  } ${isShiftLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                  disabled={isShiftLoading || isCompanyLoading}
                >
                  {isShiftLoading || isCompanyLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t("shift.loading") || "טוען..."}</span>
                    </>
                  ) : isShiftStarted ? (
                    <>
                      <Square className="w-5 h-5" />
                      <div className="flex flex-col items-start">
                        <span className="font-mono text-lg">{formatTime(shiftTime)}</span>
                        <span className="text-xs opacity-75">
                          {t("shift.click_to_end") || "לחץ לסיום"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>{t("shift.start")}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className={isRTL ? "text-right" : "text-left"}>{children}</div>
          </div>
        </main>
      </div>

      <Footer isRTL={isRTL} />

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
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
        .animate-slide-down { animation: slideDown 0.3s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }

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
