import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Sparkles, ArrowRight, Home, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";

const Success = () => {
  const { t } = useTranslation();
  const query = new URLSearchParams(window.location.search);
  const sessionId = query.get("session_id");

  console.log("Sending session ID:", sessionId);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
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
        setPaymentData(response.data.payment);
        toast.success("Payment verified successfully!");
      } else {
        throw new Error(
          response.data.message || "Payment verification failed."
        );
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Failed to save payment. Please contact support.";
      setError(errorMsg);
      toast.error(errorMsg);
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

  // Confetti animation effect
  useEffect(() => {
    if (!isLoading && !error) {
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      });
    }
  }, [isLoading, error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center animate-fadeIn relative z-10">
          <div className="relative">
            <div className="w-24 h-24 border-8 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-blue-600 animate-pulse" />
          </div>
          <p className="mt-8 text-xl font-bold text-gray-700 animate-pulse">
            Processing your payment...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we verify your transaction
          </p>
        </div>
      ) : error ? (
        <div className="text-center animate-fadeIn relative z-10 bg-white p-12 rounded-3xl shadow-2xl max-w-2xl">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-red-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <XCircle className="relative w-24 h-24 text-red-500 mb-6 mx-auto" />
          </div>
          
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Payment Verification Failed
          </h1>
          
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
            <p className="text-lg text-red-700 font-medium">
              {error}
            </p>
          </div>

          <p className="text-gray-600 mb-8">
            Please contact our support team if you believe this is an error.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate("/pricing-plans")}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              Try Again
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleReturnHome}
              className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Return Home
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center animate-fadeIn relative z-10 bg-white p-12 rounded-3xl shadow-2xl max-w-3xl">
          {/* Success Icon with Animation */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-green-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-6 shadow-xl">
              <CheckCircle className="w-20 h-20 text-white animate-bounce" strokeWidth={2.5} />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Payment Successful!
            </span>
          </h1>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <p className="text-xl text-gray-600 font-medium">
              Welcome to your new plan!
            </p>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>

          {/* Payment Details Card */}
          {paymentData && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border-2 border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">Transaction Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <p className="text-gray-500 font-medium">Plan</p>
                  <p className="text-gray-900 font-bold text-lg">{paymentData.planName}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 font-medium">Amount</p>
                  <p className="text-gray-900 font-bold text-lg">
                    ${paymentData.amount} {paymentData.currency?.toUpperCase()}
                  </p>
                </div>
                <div className="text-left col-span-2">
                  <p className="text-gray-500 font-medium">Payment Date</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(paymentData.paymentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Messages */}
          <div className="space-y-4 mb-8">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-medium">
                ✓ Your subscription is now active
              </p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 font-medium">
                📧 Invoice sent to your registered email
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleReturnHome}
              className="px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Footer Note */}
          <p className="mt-8 text-sm text-gray-500">
            Thank you for choosing our service! 🎉
          </p>
        </div>
      )}

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Success;
