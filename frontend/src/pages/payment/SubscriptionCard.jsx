import { axiosInstance } from "../../lib/axios";

const SubscriptionCard = ({ type, price, duration, features }) => {
  const handlePayment = async (duration, pkg) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axiosInstance.post("/payment/create-subscription", {
        plan_name: pkg,
        duration,
        token,
      });
      if (res.data) {
        window.location.href = res.data.session.url;
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105">
      <h2 className="text-xl font-semibold text-gray-800">{type}</h2>
      <p className="text-gray-600">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-sm">/{duration}</span>
      </p>
      <ul className="mt-4 space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-600">
            <svg
              className="w-5 h-5 text-indigo-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={() => handlePayment(duration, type)}
        className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
      >
        Choose {type}
      </button>
    </div>
  );
};

export default SubscriptionCard;
