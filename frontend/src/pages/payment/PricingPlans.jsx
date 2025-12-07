import { useEffect, useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { axiosInstance } from "../../lib/axios";
import React from "react";
import { plans } from "../../../../backend/config/lib/payment.js";
import { Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

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
          toast.success("Redirecting to payment page...");
          window.location.href = response.data.session.url;
        } else {
          const errorMsg = response.data.message || "No payment URL received";
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
          toast.success("Plan updated successfully!");
          setCurrentPlan({ planName, duration });
          if (onPlanUpdate) {
            onPlanUpdate();
          }
        } else {
          const errorMsg = response.data.message || "Update failed";
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
      }
    } catch (error) {
      console.error(
        "Error handling payment:",
        error.response?.data || error.message
      );
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to process payment";
      
      if (error.response?.status === 401) {
        toast.error("You need to log in to update your subscription. Redirecting...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = (planName) => {
    if (!currentPlan) return "Get Started";
    if (
      currentPlan.planName === planName &&
      currentPlan.duration === duration
    ) {
      return "Current Plan";
    }
    const currentPrice = tiers[currentPlan.duration]
      ?.find((p) => p.planName === currentPlan.planName)
      ?.price.replace("$", "");
    const newPrice = tiers[duration]
      .find((p) => p.planName === planName)
      ?.price.replace("$", "");
    return parseInt(newPrice) > parseInt(currentPrice)
      ? "Upgrade Now"
      : "Switch Plan";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      {/* Header Section - Compact */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-blue-600" />
          Choose Your Plan
        </h2>
        <p className="mt-2 text-base text-gray-600">
          Flexible plans designed to grow with your business
        </p>
        
        {/* Duration Toggle - Compact */}
        <div className="mt-4 flex justify-center">
          <div className="inline-flex rounded-full shadow-md bg-gray-100 p-1">
            <button
              onClick={() => setDuration("Monthly")}
              className={`px-6 py-2 text-sm font-bold rounded-full transition-all duration-200 ${
                duration === "Monthly"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setDuration("Yearly")}
              className={`px-6 py-2 text-sm font-bold rounded-full transition-all duration-200 ${
                duration === "Yearly"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Yearly
              <span className="ml-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards - Compact Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        {tiers[duration].map((plan, index) => {
          const isCurrentPlan =
            currentPlan?.planName === plan.planName &&
            currentPlan?.duration === duration;
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl shadow-lg p-5 flex flex-col transition-all duration-300 border-2 ${
                plan.isFeatured
                  ? "border-blue-600 transform scale-105"
                  : "border-gray-200 hover:border-blue-300"
              } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.isFeatured && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    ⭐ Most Popular
                  </span>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    ✓ Active
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {plan.planName}
                </h3>
                <div className="mt-3">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /{duration === "Monthly" ? "mo" : "yr"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Billed {duration.toLowerCase()}
                </p>
              </div>

              {/* Features - Compact List */}
              <ul className="space-y-2 text-sm flex-grow mb-4">
                {plan.features.slice(0, 6).map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
                {plan.features.length > 6 && (
                  <li className="text-xs text-gray-500 text-center pt-1">
                    +{plan.features.length - 6} more features
                  </li>
                )}
              </ul>

              <button
                onClick={() => handlePayment(plan.planName)}
                disabled={isCurrentPlan || isProcessing}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all duration-200 ${
                  isCurrentPlan || isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : plan.isFeatured
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105"
                    : "bg-blue-500 hover:bg-blue-600 hover:shadow-lg"
                }`}
              >
                {isProcessing
                  ? "Processing..."
                  : getButtonText(plan.planName)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PricingPlans;
