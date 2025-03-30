import { useEffect, useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { axiosInstance } from "../../lib/axios";
import React from "react";
import { plans } from "../../../../backend/config/lib/payment.js";

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

const PricingPlans = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState("Monthly");
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const tiers = groupPlansByDuration(plans);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const userResponse = await axiosInstance.get("/auth/me", {
          withCredentials: true,
        });
        if (!userResponse.data.success || !userResponse.data.user.company) {
          setIsLoading(false);
          return;
        }

        const companyId = userResponse.data.user.company;
        const paymentResponse = await axiosInstance.get(
          `/payment/get-latest-payment/${companyId}`,
          { withCredentials: true }
        );

        if (paymentResponse.data.success && paymentResponse.data.payment) {
          const { planName, startDate, endDate } = paymentResponse.data.payment;
          const durationInMonths =
            (new Date(endDate) - new Date(startDate)) /
            (1000 * 60 * 60 * 24 * 30);
          const inferredDuration = durationInMonths > 11 ? "Yearly" : "Monthly";
          setCurrentPlan({ planName, duration: inferredDuration });
        }
      } catch (error) {
        console.error("Error fetching current plan:", error.response?.data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrentPlan();
  }, []);

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
          window.location.href = response.data.session.url;
        } else {
          throw new Error("No payment URL received");
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
          setCurrentPlan({ planName, duration });
          alert("Subscription updated successfully!");
        } else {
          throw new Error(response.data.message || "Update failed");
        }
      }
    } catch (error) {
      console.error(
        "Error handling payment:",
        error.response?.data || error.message
      );
      alert("Failed to process payment. Please try again.");
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
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-bg min-h-screen py-16">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12 animate-fadeIn">
        <h2 className="text-4xl font-extrabold text-text sm:text-5xl">
          Simple, Transparent Pricing
        </h2>
        <p className="mt-4 text-lg text-secondary">
          Flexible plans designed to grow with your business.
        </p>
        <div className="mt-6 flex justify-center">
          <div className="inline-flex rounded-full shadow-sm bg-secondary p-1">
            <button
              onClick={() => setDuration("Monthly")}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                duration === "Monthly"
                  ? "bg-primary text-button-text shadow-md"
                  : "text-text hover:bg-accent"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setDuration("Yearly")}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                duration === "Yearly"
                  ? "bg-primary text-button-text shadow-md"
                  : "text-text hover:bg-accent"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers[duration].map((plan, index) => {
          const isCurrentPlan =
            currentPlan?.planName === plan.planName &&
            currentPlan?.duration === duration;
          return (
            <div
              key={plan.id}
              className={`relative bg-bg rounded-xl shadow-lg p-6 flex flex-col transition-all duration-300 border border-border-color animate-fadeIn ${
                plan.isFeatured
                  ? "border-2 border-accent scale-105 z-10"
                  : "hover:shadow-xl"
              } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.isFeatured && (
                <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent text-button-text text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-semibold text-text text-center">
                {plan.planName}
              </h3>
              <p className="mt-4 text-4xl font-bold text-text text-center">
                {plan.price}
                <span className="text-base font-normal text-secondary">
                  /{duration === "Monthly" ? "mo" : "yr"}
                </span>
              </p>
              <p className="mt-2 text-sm text-secondary text-center">
                Billed {duration.toLowerCase()}
              </p>
              <ul className="mt-6 space-y-4 text-text text-sm flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-primary mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <button
                  onClick={() => handlePayment(plan.planName)}
                  disabled={isCurrentPlan || isProcessing}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-button-text transition-all duration-200 ${
                    isCurrentPlan || isProcessing
                      ? "bg-gray-400 cursor-not-allowed"
                      : plan.isFeatured
                      ? "bg-accent hover:bg-primary"
                      : "bg-button-bg hover:bg-secondary"
                  }`}
                >
                  {isProcessing && plan.planName === currentPlan?.planName
                    ? "Processing..."
                    : getButtonText(plan.planName)}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PricingPlans;
