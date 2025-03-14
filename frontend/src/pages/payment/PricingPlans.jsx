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
  const [isProcessing, setIsProcessing] = useState(false); // Add loading state for updates
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
      setIsProcessing(true); // Show loading state
      console.log("Initiating payment for:", planName, duration);

      if (!currentPlan) {
        const response = await axiosInstance.post(
          "/payment/create-subscription",
          { plan_name: planName, duration },
          { withCredentials: true }
        );
        console.log("New subscription response:", response.data);
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
        console.log("Update response:", response.data);
        if (response.data.success) {
          setCurrentPlan({ planName, duration }); // Update local state
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
      setIsProcessing(false); // Reset loading state
    }
  };

  const getButtonText = (planName) => {
    if (!currentPlan) return "Buy this plan";
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
      ? "Upgrade"
      : "Downgrade";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen py-20">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold">Pricing that works for you</h2>
        <p className="text-gray-400 mt-2">
          Choose a plan that fits your team’s needs and scales with you.
        </p>
        <div className="flex justify-center mt-4">
          <div className="flex bg-gray-700 p-1 rounded-full">
            <button
              onClick={() => setDuration("Monthly")}
              className={`px-4 py-2 text-sm rounded-full ${
                duration === "Monthly" ? "bg-indigo-500" : "text-gray-300"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setDuration("Yearly")}
              className={`px-4 py-2 text-sm rounded-full ${
                duration === "Yearly" ? "bg-indigo-500" : "text-gray-300"
              }`}
            >
              Annually
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {tiers[duration].map((plan) => {
          const isCurrentPlan =
            currentPlan?.planName === plan.planName &&
            currentPlan?.duration === duration;
          return (
            <div
              key={plan.id}
              className={`relative p-8 rounded-2xl shadow-lg flex flex-col ${
                plan.isFeatured
                  ? "bg-white text-gray-900 scale-110 ring-2 ring-indigo-500 shadow-2xl"
                  : "bg-gray-800"
              } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.isFeatured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-indigo-600 text-xs uppercase text-white px-3 py-1 rounded-b-lg">
                  Best Value
                </div>
              )}
              <h3 className="text-2xl font-bold text-center">
                {plan.planName}
              </h3>
              <p className="mt-2 text-5xl font-medium text-center">
                {plan.price}
              </p>
              <p className="text-gray-400 text-sm text-center mt-1">
                Billed {duration.toLowerCase()}
              </p>
              <p className="mt-4 text-gray-400 text-center">
                {plan.description || " "}
              </p>
              <div className="mt-6 flex justify-center">
                <ul className="space-y-3 text-sm text-gray-500 flex-grow max-w-sm">
                  {plan.features.map((feature, index) => (
                    <React.Fragment key={index}>
                      <li className="flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 text-indigo-500 mr-2" />
                        <span>{feature}</span>
                      </li>
                      {index < plan.features.length - 1 && (
                        <hr className="border-gray-300 my-2" />
                      )}
                    </React.Fragment>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handlePayment(plan.planName)}
                  disabled={isCurrentPlan || isProcessing}
                  className={`w-full py-2 rounded-lg font-medium text-white ${
                    isCurrentPlan || isProcessing
                      ? "bg-gray-500 cursor-not-allowed"
                      : plan.isFeatured
                      ? "bg-indigo-600 hover:bg-indigo-500"
                      : "bg-indigo-500 hover:bg-indigo-400"
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
