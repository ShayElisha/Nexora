import { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { plans } from "../../lib/plans.js";
import { Check, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import PublicPageHero from "../../components/home/PublicPageHero";
import PublicPageLayout from "../../components/home/PublicPageLayout";
import { usePageLocale } from "../../hooks/usePageLocale";

const groupPlansByDuration = (plansArray) => {
  const grouped = { Monthly: [], Yearly: [] };
  plansArray.forEach((plan) => {
    const isEnterprise = plan.plan_name === "Enterprise";
    grouped[plan.duration].push({
      id: `tier-${plan.plan_name.toLowerCase()}`,
      planName: plan.plan_name,
      price: plan.price,
      description: "",
      features: plan.features,
      isFeatured: isEnterprise,
    });
  });
  return grouped;
};

const PricingPlans = ({ currentPlan: propCurrentPlan, onPlanUpdate }) => {
  const { t } = usePageLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState("Monthly");
  const [currentPlan, setCurrentPlan] = useState(propCurrentPlan || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const tiers = groupPlansByDuration(plans);

  useEffect(() => {
    if (propCurrentPlan) {
      setCurrentPlan(propCurrentPlan);
    }
  }, [propCurrentPlan]);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        console.log("Fetching current plan...");
        
        // Try to get user info first
        let companyId = null;
        try {
          const userResponse = await axiosInstance.get("/auth/me", {
            withCredentials: true,
          });
          console.log("User response:", userResponse.data);
          
          if (userResponse.data.success && userResponse.data.user?.company) {
            companyId = userResponse.data.user.company;
            console.log("Company ID from user:", companyId);
          }
        } catch (userError) {
          console.log("No user found, checking for company token...");
          
          // If no user, try to get company payment directly (using company_jwt cookie)
          try {
            const paymentResponse = await axiosInstance.get(
              `/payment/get-latest-payment/current`,
              { withCredentials: true }
            );
            console.log("Direct payment response:", paymentResponse.data);
            
            if (paymentResponse.data.success && paymentResponse.data.payment) {
              const { planName, startDate, endDate } = paymentResponse.data.payment;
              const durationInMonths =
                (new Date(endDate) - new Date(startDate)) /
                (1000 * 60 * 60 * 24 * 30);
              const inferredDuration = durationInMonths > 11 ? "Yearly" : "Monthly";
              setCurrentPlan({ planName, duration: inferredDuration });
            }
            setIsLoading(false);
            return;
          } catch (directError) {
            console.log("No company token either:", directError.response?.data);
          }
        }

        // If we have companyId from user, fetch payment
        if (companyId) {
          const paymentResponse = await axiosInstance.get(
            `/payment/get-latest-payment/${companyId}`,
            { withCredentials: true }
          );
          console.log("Payment response:", paymentResponse.data);

          if (paymentResponse.data.success && paymentResponse.data.payment) {
            const { planName, startDate, endDate } = paymentResponse.data.payment;
            const durationInMonths =
              (new Date(endDate) - new Date(startDate)) /
              (1000 * 60 * 60 * 24 * 30);
            const inferredDuration = durationInMonths > 11 ? "Yearly" : "Monthly";
            setCurrentPlan({ planName, duration: inferredDuration });
          }
        }
      } catch (error) {
        console.error("Error fetching current plan:", error);
        console.error("Error response:", error.response?.data);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!propCurrentPlan) {
      fetchCurrentPlan();
    } else {
      setIsLoading(false);
    }
  }, [propCurrentPlan]);

  const handlePayment = async (planName) => {
    try {
      setIsProcessing(true);
      console.log("Initiating payment for:", planName, duration);

      if (!currentPlan) {
        const response = await axiosInstance.post(
          "/payment/create-subscription",
          { plan_name: planName, duration },
          { withCredentials: true }
        );
        if (response.data.success && response.data.session?.url) {
          toast.success(t("public.pricing.toasts.redirecting"));
          window.location.href = response.data.session.url;
        } else {
          const errorMsg = response.data.message || t("public.pricing.toasts.genericError");
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
      } else if (
        currentPlan.planName !== planName ||
        currentPlan.duration !== duration
      ) {
        const response = await axiosInstance.put(
          "/payment/update-subscription",
          { plan_name: planName, duration },
          { withCredentials: true }
        );
        if (response.data.success) {
          toast.success(t("public.pricing.toasts.updated"));
          setCurrentPlan({ planName, duration });
          if (onPlanUpdate) {
            onPlanUpdate();
          }
        } else {
          const errorMsg = response.data.message || t("public.pricing.toasts.genericError");
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
      }
    } catch (error) {
      console.error(
        "Error handling payment:",
        error.response?.data || error.message
      );
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        t("public.pricing.toasts.genericError");
      
      if (error.response?.status === 401) {
        toast.error(
          t("public.pricing.toasts.loginRequired") ||
            "אין הרשאת חברה פעילה. צרו חברה מחדש או השתמשו בקישור מהמייל."
        );
        setTimeout(() => {
          window.location.href = "/create-company";
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = (planName) => {
    if (!currentPlan) return t("public.pricing.actions.getStarted");
    if (
      currentPlan.planName === planName &&
      currentPlan.duration === duration
    ) {
      return t("public.pricing.actions.currentPlan");
    }
    const currentPrice = tiers[currentPlan.duration]
      ?.find((p) => p.planName === currentPlan.planName)
      ?.price.replace("$", "");
    const newPrice = tiers[duration]
      .find((p) => p.planName === planName)
      ?.price.replace("$", "");
    return parseInt(newPrice) > parseInt(currentPrice)
      ? t("public.pricing.actions.upgrade")
      : t("public.pricing.actions.switch");
  };

  if (isLoading) {
    return (
      <PublicPageLayout>
        <PublicPageHero
          badge={t("public.pricing.badge")}
          title={t("public.pricing.title")}
          subtitle={t("public.pricing.subtitle")}
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout>
      <PublicPageHero
        badge={t("public.pricing.badge")}
        title={t("public.pricing.title")}
        subtitle={t("public.pricing.subtitle")}
      />

      <section className="py-8 px-4 pb-16 md:pb-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold flex items-center justify-center gap-2" style={{ color: "var(--text-color)" }}>
            <Sparkles className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
            {t("public.pricing.heading")}
          </h2>
          <p className="mt-2 text-base" style={{ color: "var(--color-secondary)" }}>
            {t("public.pricing.description")}
          </p>

          <div className="mt-4 flex justify-center">
            <div
              className="inline-flex rounded-full p-1 border"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
            >
              <button
                onClick={() => setDuration("Monthly")}
                className="px-6 py-2 text-sm font-bold rounded-full transition-all duration-200"
                style={{
                  backgroundColor: duration === "Monthly" ? "var(--color-primary)" : "transparent",
                  color: duration === "Monthly" ? "var(--button-text)" : "var(--text-color)",
                }}
              >
                {t("public.pricing.duration.monthly")}
              </button>
              <button
                onClick={() => setDuration("Yearly")}
                className="px-6 py-2 text-sm font-bold rounded-full transition-all duration-200"
                style={{
                  backgroundColor: duration === "Yearly" ? "var(--color-primary)" : "transparent",
                  color: duration === "Yearly" ? "var(--button-text)" : "var(--text-color)",
                }}
              >
                {t("public.pricing.duration.yearly")}
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: "var(--border-color)" }}>
                  {t("public.pricing.duration.save")}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
          {tiers[duration].map((plan) => {
            const isCurrentPlan = currentPlan?.planName === plan.planName && currentPlan?.duration === duration;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl p-5 flex flex-col transition-all duration-300 border-2 ${
                  plan.isFeatured ? "scale-[1.02]" : ""
                }`}
                style={{
                  borderColor: plan.isFeatured ? "var(--color-primary)" : "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  boxShadow: isCurrentPlan ? "0 0 0 2px var(--color-primary)" : "none",
                }}
              >
                {plan.isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="text-xs font-bold px-4 py-1 rounded-full border inline-flex items-center gap-1"
                      style={{
                        borderColor: "var(--color-primary)",
                        backgroundColor: "var(--color-primary)",
                        color: "var(--button-text)",
                      }}
                    >
                      <Sparkles size={12} />
                      {t("public.pricing.labels.mostPopular")}
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full border"
                      style={{
                        borderColor: "var(--color-primary)",
                        backgroundColor: "var(--color-primary)",
                        color: "var(--button-text)",
                      }}
                    >
                      {t("public.pricing.labels.active")}
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                    {plan.planName}
                  </h3>
                  <div className="mt-3">
                    <span className="text-4xl font-extrabold" style={{ color: "var(--text-color)" }}>
                      {plan.price}
                    </span>
                    <span className="text-base font-medium" style={{ color: "var(--color-secondary)" }}>
                      /{duration === "Monthly" ? t("public.pricing.labels.perMonth") : t("public.pricing.labels.perYear")}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--color-secondary)" }}>
                    {duration === "Monthly" ? t("public.pricing.labels.billedMonthly") : t("public.pricing.labels.billedYearly")}
                  </p>
                </div>

                <ul className="space-y-2 text-sm flex-grow mb-4">
                  {plan.features.slice(0, 6).map((feature, index) => (
                    <li key={`${plan.id}-${index}`} className="flex items-start">
                      <Check className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
                      <span style={{ color: "var(--text-color)" }}>{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 6 && (
                    <li className="text-xs text-center pt-1" style={{ color: "var(--color-secondary)" }}>
                      {t("public.pricing.labels.moreFeatures", { count: plan.features.length - 6 })}
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handlePayment(plan.planName)}
                  disabled={isCurrentPlan || isProcessing}
                  className="w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 disabled:opacity-60"
                  style={{
                    backgroundColor: isCurrentPlan || isProcessing ? "var(--border-color)" : "var(--color-primary)",
                    color: isCurrentPlan || isProcessing ? "var(--text-color)" : "var(--button-text)",
                  }}
                >
                  {isProcessing ? t("public.pricing.actions.processing") : getButtonText(plan.planName)}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default PricingPlans;
