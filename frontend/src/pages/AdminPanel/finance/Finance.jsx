// src/pages/procurement/Finance.jsx
import { useEffect, useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import Sidebar from "../layouts/Sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const Finance = () => {
  const { t } = useTranslation();
  const [financeData, setFinanceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();

  // Fetch authenticated user data
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;

  // Fetch finance data
  const {
    mutate: getFinanceData,
    isLoading,
    isError,
    error,
  } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get("/finance");
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["finance"]);
      setFinanceData(data);
    },
  });

  useEffect(() => {
    if (isLoggedIn) {
      getFinanceData();
    }
  }, [isLoggedIn, getFinanceData]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen text-text">
        {t("auth.please_login")}
      </div>
    );
  }

  const filteredData = financeData.filter((doc) =>
    doc._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="flex-1 container mx-auto max-w-full p-8">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">
          {t("finance.title")}
        </h1>

        <div className="mb-4 flex justify-between">
          <input
            type="text"
            placeholder={t("finance.search_placeholder")}
            className="p-2 rounded bg-secondary text-text w-full focus:outline-none focus:ring-2 focus:ring-primary"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="ml-4 bg-primary text-button-text px-4 py-2 rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => getFinanceData()}
          >
            {t("buttons.refresh")}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center text-text">
            {t("loading")}
          </div>
        ) : isError ? (
          <div className="text-red-500 text-center">
            {t("errors.loading_error")} {error.message}
          </div>
        ) : (
          <div className="bg-secondary rounded-lg shadow-xl p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-bg text-text rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-border-color">
                    <th className="py-2 px-4">{t("finance.transaction_id")}</th>
                    <th className="py-2 px-4">
                      {t("finance.transaction_date")}
                    </th>
                    <th className="py-2 px-4">
                      {t("finance.transaction_type")}
                    </th>
                    <th className="py-2 px-4">
                      {t("finance.transaction_amount")}
                    </th>
                    <th className="py-2 px-4">
                      {t("finance.transaction_currency")}
                    </th>
                    <th className="py-2 px-4">
                      {t("finance.transaction_status")}
                    </th>
                    <th className="py-2 px-4">{t("finance.category")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((doc) => (
                    <tr key={doc._id} className="border-b border-border-color">
                      <td className="py-2 px-4">{doc._id}</td>
                      <td className="py-2 px-4">
                        {new Date(doc.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4">
                        {t(
                          `finance.transaction_types.${doc.transactionType.toLowerCase()}`,
                          { defaultValue: doc.transactionType }
                        )}
                      </td>
                      <td className="py-2 px-4">{doc.transactionAmount}</td>
                      <td className="py-2 px-4">{doc.transactionCurrency}</td>
                      <td
                        className={`py-2 px-4 ${
                          doc.transactionStatus === t("finance.completed")
                            ? "text-green-400"
                            : doc.transactionStatus === t("finance.pending")
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        {t(`finance.${doc.transactionStatus.toLowerCase()}`)}
                      </td>
                      <td className="py-2 px-4">{doc.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <div className="text-center text-text mt-4">
                  {t("finance.no_data_found")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;
