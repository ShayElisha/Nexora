import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const Success = () => {
  const query = new URLSearchParams(window.location.search);
  const sessionId = query.get("session_id"); // Extract session ID from the success URL

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false); // Add a ref to prevent multiple calls

  const navigate = useNavigate();

  // Function to send the session ID to the backend and save the payment
  const savePayment = async () => {
    if (!sessionId) {
      setError("Session ID not found. Payment verification failed.");
      setIsLoading(false);
      return;
    }

    try {
      // Send session ID to the backend
      const response = await axiosInstance.post("/payment/save-payment", {
        sessionId,
      });

      // Handle success response
      if (response.data.success) {
        toast.success("Payment saved successfully!");
      } else {
        throw new Error(
          response.data.message || "Payment verification failed."
        );
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      setError("Failed to save payment. Please contact support.");
      toast.error("Error saving payment.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      savePayment();
      hasFetched.current = true; // Prevent multiple calls
    }
  }, [sessionId]);

  const handleReturnHome = () => {
    navigate("/"); // Navigate back to the dashboard
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 opacity-20"></div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-screen">
          {/* Loader */}
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>

          {/* Text */}
          <p className="mt-4 text-lg font-medium text-gray-700">
            Processing your payment...
          </p>
        </div>
      ) : error ? (
        <>
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            Payment Failed
          </h1>
          <p className="text-lg text-gray-700 mb-8">{error}</p>
          <button
            onClick={handleReturnHome}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Return to Home
          </button>
        </>
      ) : (
        <>
          <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-700 mb-6 text-center max-w-2xl">
            Thank you for your purchase. Your transaction has been successfully
            completed, and your subscription is now active.
          </p>
          <p className="text-base text-gray-600 mb-8 text-center max-w-2xl">
            An invoice has been sent to your registered email. Please check your
            inbox for payment details and further instructions.
          </p>
          <button
            onClick={handleReturnHome}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-lg transition-all"
          >
            Return to Dashboard
          </button>
        </>
      )}
    </div>
  );
};

export default Success;
