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
  const sessionId = query.get("session_id");

  console.log("Sending session ID:", sessionId);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  const navigate = useNavigate();

  const savePayment = async () => {
    if (!sessionId) {
      setError("Session ID not found. Payment verification failed.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post("/payment/save-payment", {
        sessionId,
      });
      console.log("Server response:", response.data);

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
      hasFetched.current = true;
    }
  }, [sessionId]);

  const handleReturnHome = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-secondary to-accent opacity-10 animate-fadeIn"></div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-screen animate-fadeIn">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-medium text-text">
            Processing your payment...
          </p>
        </div>
      ) : error ? (
        <div className="text-center animate-fadeIn">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4 mx-auto" />
          <h1 className="text-3xl font-bold text-text mb-4">Payment Failed</h1>
          <p className="text-lg text-secondary mb-8 max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={handleReturnHome}
            className="px-6 py-3 bg-button-bg text-button-text rounded-md hover:bg-secondary transition-all duration-200"
          >
            Return to Home
          </button>
        </div>
      ) : (
        <div className="text-center animate-fadeIn">
          <CheckCircleIcon className="w-16 h-16 text-primary mb-4 mx-auto animate-bounce" />
          <h1 className="text-4xl font-extrabold text-text mb-4">
            Payment Successful!
          </h1>
          <p className="text-lg text-secondary mb-6 max-w-2xl mx-auto">
            Thank you for your purchase. Your transaction has been successfully
            completed, and your subscription is now active.
          </p>
          <p className="text-base text-secondary mb-8 max-w-2xl mx-auto">
            An invoice has been sent to your registered email. Please check your
            inbox for payment details and further instructions.
          </p>
          <button
            onClick={handleReturnHome}
            className="px-6 py-3 bg-button-bg text-button-text rounded-lg font-semibold shadow-lg hover:bg-accent focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default Success;
