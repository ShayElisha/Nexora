import { useNavigate } from "react-router-dom";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

const Fail = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleTryAgain = () => {
    if (token) {
      navigate(`/PricingPlans/?token=${token}`, { replace: true });
    } else {
      navigate("/PricingPlans", { replace: true });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg px-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-secondary to-accent opacity-10 animate-fadeIn"></div>
      <div className="animate-fadeIn">
        <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4 mx-auto" />
        <h1 className="text-3xl font-bold text-text mb-4">Payment Failed</h1>
        <p className="text-lg text-secondary mb-6 max-w-md mx-auto">
          Unfortunately, your payment could not be processed. Please try again
          or use a different payment method.
        </p>
        <button
          onClick={handleTryAgain}
          className="px-6 py-3 bg-button-bg text-button-text rounded-md hover:bg-secondary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 font-semibold"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default Fail;
