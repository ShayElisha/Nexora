import { useNavigate } from "react-router-dom";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

const Fail = () => {
  const navigate = useNavigate();

  // קריאת הטוקן מ-localStorage ושמירתו במשתנה
  const token = localStorage.getItem("token");

  // פונקציה לניווט מחדש
  const handleTryAgain = () => {
    if (token) {
      navigate(`/PricingPlans/?token=${token}`, { replace: true }); // מונע שמירת דף זה בהיסטוריה
    } else {
      navigate("/PricingPlans", { replace: true });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
      <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Failed</h1>
      <p className="text-lg text-gray-700 mb-6">
        Unfortunately, your payment could not be processed. Please try again or
        use a different payment method.
      </p>
      <button
        onClick={handleTryAgain}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
};

export default Fail;
