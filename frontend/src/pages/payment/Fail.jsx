import { useNavigate } from "react-router-dom";
import { XCircle, AlertTriangle, RefreshCw, Home, ArrowRight, CreditCard, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

const Fail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = new URLSearchParams(window.location.search);
  const sessionId = query.get("session_id");

  useEffect(() => {
    console.log("Payment cancelled. Session ID:", sessionId);
  }, [sessionId]);

  const handleTryAgain = () => {
    navigate("/pricing-plans", { replace: true });
  };

  const handleReturnHome = () => {
    navigate("/");
  };

  const handleContactSupport = () => {
    // Navigate to support or open email
    window.location.href = "mailto:support@nexora.com";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="text-center animate-fadeIn relative z-10 bg-white p-12 rounded-3xl shadow-2xl max-w-3xl">
        {/* Failed Icon with Animation */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-red-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-red-400 to-pink-500 rounded-full p-6 shadow-xl">
            <XCircle className="w-20 h-20 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-extrabold mb-4">
          <span className="bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Payment Cancelled
          </span>
        </h1>

        <div className="flex items-center justify-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <p className="text-xl text-gray-600 font-medium">
            No charges were made
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 mb-8 border-2 border-orange-200">
          <p className="text-lg text-gray-700 mb-4">
            Your payment was not completed. This could happen for several reasons:
          </p>
          <ul className="text-left space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>You cancelled the transaction</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Payment method was declined</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>Session timeout occurred</span>
            </li>
          </ul>
        </div>

        {/* Info Messages */}
        <div className="space-y-4 mb-8">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <p className="text-blue-800 font-medium text-left">
              Your card was not charged. You can try again anytime.
            </p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-purple-600" />
            <p className="text-purple-800 font-medium text-left">
              Need help? Our support team is here for you 24/7
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleTryAgain}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          <button
            onClick={handleContactSupport}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            Contact Support
          </button>
          <button
            onClick={handleReturnHome}
            className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Return Home
          </button>
        </div>

        {/* Footer Note */}
        <p className="mt-8 text-sm text-gray-500">
          Don't worry - you can always upgrade your plan later!
        </p>
      </div>

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

export default Fail;
