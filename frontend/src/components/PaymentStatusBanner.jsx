import { useQuery, useMutation } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const PaymentStatusBanner = () => {
  const navigate = useNavigate();
  
  const { data: company, isLoading } = useQuery({
    queryKey: ['company', 'current'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/company/current', {
          withCredentials: true
        });
        return res.data.data;
      } catch (error) {
        // If not logged in or no company, return null
        if (error.response?.status === 401 || error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const retryPaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post(
        "/payment/retry-payment",
        {
          plan_name: company?.subscription?.plan || "Basic",
          duration: "Monthly"
        },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success && data.session?.url) {
        toast.success("Redirecting to payment page...");
        window.location.href = data.session.url;
      } else {
        toast.error(data.message || "Failed to create retry session");
      }
    },
    onError: (error) => {
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Failed to retry payment. Please try again.";
      toast.error(errorMessage);
    }
  });

  if (isLoading) {
    return null;
  }

  if (!company || company.subscription?.paymentStatus !== 'Failed') {
    return null;
  }

  const handleRetryPayment = () => {
    retryPaymentMutation.mutate();
  };

  const handleGoToPricing = () => {
    navigate('/pricing-plans');
  };

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 shadow-md">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-bold text-lg">Payment Failed</h3>
            <p className="text-red-600 text-sm mt-1">
              Your payment failed. Please update your payment method to continue using our service.
            </p>
            {company.subscription?.failedAttempts > 0 && (
              <p className="text-red-500 text-xs mt-1">
                Failed attempts: {company.subscription.failedAttempts}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleRetryPayment}
            disabled={retryPaymentMutation.isPending}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {retryPaymentMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Retry Payment
              </>
            )}
          </button>
          <button
            onClick={handleGoToPricing}
            className="bg-white text-red-600 border-2 border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            Choose Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusBanner;

