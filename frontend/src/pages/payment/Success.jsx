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

  console.log("Sending session ID:", sessionId);

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
      console.log("Server response:", response.data);

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
    <div
      className="flex flex-col items-center justify-center min-h-screen px-4"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <div
        className="text-center p-8 rounded-2xl shadow-lg max-w-2xl w-full border"
        style={{
          backgroundColor: "var(--surface-color)",
          borderColor: "var(--border-color)",
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
            ></div>
            <p
              className="mt-4 text-lg font-medium"
              style={{ color: "var(--text-color)" }}
            >
              Processing your payment...
            </p>
          </div>
        ) : error ? (
          <>
            <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4 mx-auto" />
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              Payment Failed
            </h1>
            <p className="text-lg mb-8" style={{ color: "var(--text-color)" }}>
              {error}
            </p>
            <button
              onClick={handleReturnHome}
              className="px-4 py-2 rounded-lg font-semibold text-sm"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-color)",
              }}
            >
              Return to Home
            </button>
          </>
        ) : (
          <>
            <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4 mx-auto animate-bounce" />
            <h1
              className="text-4xl font-extrabold mb-4"
              style={{ color: "var(--text-color)" }}
            >
              Payment Successful!
            </h1>
            <p
              className="text-lg mb-6 text-center max-w-2xl mx-auto"
              style={{ color: "var(--text-color)" }}
            >
              Thank you for your purchase. Your transaction has been successfully
              completed, and your subscription is now active.
            </p>
            <p
              className="text-base mb-8 text-center max-w-2xl mx-auto"
              style={{ color: "var(--color-secondary)" }}
            >
              An invoice has been sent to your registered email. Please check your
              inbox for payment details and further instructions.
            </p>
            <button
              onClick={handleReturnHome}
              className="px-4 py-2 rounded-lg font-semibold text-sm shadow transition-all"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Success;
