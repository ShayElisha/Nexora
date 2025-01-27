import { useEffect, useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { axiosInstance } from "../../lib/axios";
import React from "react";

const PricingPlans = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState("Monthly");

  const tiers = {
    Monthly: [
      {
        name: "Basic",
        id: "tier-basic",
        price: "$199",
        description: "Perfect for individuals or small teams.",
        features: ["1 User", "Basic Features", "Email Support"],
        planName: "Basic",
      },
      {
        name: "Pro",
        id: "tier-pro",
        price: "$399",
        description: "Best for growing teams needing more control.",
        features: ["5 Users", "Pro Features", "Priority Support"],
        planName: "Pro",
      },
      {
        name: "Enterprise",
        id: "tier-enterprise",
        price: "$599",
        description: "Ideal for enterprises with custom needs.",
        features: ["Unlimited Users", "All Features", "24/7 Support"],
        planName: "Enterprise",
        isFeatured: true,
      },
    ],
    Yearly: [
      {
        name: "Basic",
        id: "tier-basic",
        price: "$1999",
        description: "Save more with yearly billing.",
        features: ["1 User", "Basic Features", "Email Support"],
        planName: "Basic",
        savePerMonth: "$166",
      },
      {
        name: "Pro",
        id: "tier-pro",
        price: "$3999",
        description: "Great for growing teams on a yearly plan.",
        features: ["5 Users", "Pro Features", "Priority Support"],
        planName: "Pro",
        savePerMonth: "$333",
      },
      {
        name: "Enterprise",
        id: "tier-enterprise",
        price: "$5999",
        description: "Save big with an annual subscription.",
        features: ["Unlimited Users", "All Features", "24/7 Support"],
        planName: "Enterprise",
        savePerMonth: "$499",
        isFeatured: true,
      },
    ],
  };

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const handlePayment = async (planName) => {
    try {
      const response = await axiosInstance.post(
        "/payment/create-subscription",
        { plan_name: planName, duration },
        { withCredentials: true } // וודא שהעוגיה נשלחת
      );
      window.location.href = response.data.session.url;
    } catch (error) {
      console.error("Error creating payment session:", error.response?.data);
    }
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
      {/* Header */}
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

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {tiers[duration].map((plan) => (
          <div
            key={plan.id}
            className={`relative p-8 rounded-2xl shadow-lg flex flex-col ${
              plan.isFeatured
                ? "bg-white text-gray-900 scale-110 ring-2 ring-indigo-500 shadow-2xl"
                : "bg-gray-800"
            }`}
          >
            {/* Best Value Tag */}
            {plan.isFeatured && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-indigo-600 text-xs uppercase text-white px-3 py-1 rounded-b-lg">
                Best Value
              </div>
            )}

            {/* Plan Name */}
            <h3 className="text-2xl font-bold text-center">{plan.name}</h3>

            {/* Price */}
            <p className="mt-2 text-5xl font-medium text-center">
              {plan.price}
            </p>
            <p className="text-gray-400 text-sm text-center mt-1">
              Billed {duration.toLowerCase()}
            </p>

            {/* Description */}
            <p className="mt-4 text-gray-400 text-center">{plan.description}</p>

            {/* Features List */}
            <div className="mt-6 flex justify-center">
              <ul className="space-y-3 text-sm text-gray-500 flex-grow max-w-sm">
                {plan.features.map((feature, index) => (
                  <React.Fragment key={index}>
                    <li className="flex  items-center justify-center">
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

            {/* Button */}
            <div className="mt-6">
              <button
                onClick={() => handlePayment(plan.planName)}
                className={`w-full py-2 rounded-lg font-medium text-white ${
                  plan.isFeatured
                    ? "bg-indigo-600 hover:bg-indigo-500"
                    : "bg-indigo-500 hover:bg-indigo-400"
                }`}
              >
                Buy this plan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPlans;
