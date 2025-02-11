import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const Budgets = () => {
  const { t } = useTranslation(); // ייבוא הפונקציה לשימוש בתרגומים
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const queryClient = useQueryClient();

  const {
    data: budgets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["budget"],
    queryFn: async () => {
      const response = await axiosInstance.get(`/budget`);
      return response.data.data;
    },
    onError: (err) => {
      toast.error(`${t("budget.error_create_budget")}: ${err.message}`);
    },
  });

  if (isLoading) return <div className="text-center">{t("loading")}</div>;

  if (error) {
    return (
      <div className="text-center text-red-500">
        {t("error")}: {error.message}
      </div>
    );
  }

  return (
    <div className="flex bg-bg min-h-screen">
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4 text-primary">
          {t("budget.budgets")}
        </h1>

        <Link
          to="/add-budget"
          className="inline-block bg-primary text-button-text mb-4 py-2 px-4 rounded"
        >
          {t("budget.add_budget")}
        </Link>

        <table className="min-w-full bg-bg text-text border border-border-color">
          <thead className="bg-secondary">
            <tr>
              <th className="py-2 px-4 border border-border-color">
                {t("budget.department_project_name")}
              </th>
              <th className="py-2 px-4 border border-border-color">
                {t("budget.budget_amount")}
              </th>
              <th className="py-2 px-4 border border-border-color">
                {t("budget.currency")}
              </th>
              <th className="py-2 px-4 border border-border-color">
                {t("budget.period")}
              </th>
              <th className="py-2 px-4 border border-border-color">
                {t("budget.status")}
              </th>
              <th className="py-2 px-4 border border-border-color">
                {t("created_at")}
              </th>
              <th className="py-2 px-4 border border-border-color">
                {t("updated_at")}
              </th>
              <th className="py-2 px-4 border border-border-color">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {!budgets || budgets.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="py-4 px-4 text-center text-gray-400 border border-border-color"
                >
                  {t("budget.no_budgets_available")}
                </td>
              </tr>
            ) : (
              budgets.map((budget) => (
                <tr
                  key={budget._id}
                  className="border-b border-border-color hover:bg-secondary/20"
                >
                  <td className="py-2 px-4 border border-border-color">
                    {budget.departmentOrProjectName}
                  </td>
                  <td className="py-2 px-4 border border-border-color">
                    {budget.amount}
                  </td>
                  <td className="py-2 px-4 border border-border-color">
                    {budget.currency}
                  </td>
                  <td className="py-2 px-4 border border-border-color">
                    {budget.period}
                  </td>
                  <td className="py-2 px-4 border border-border-color">
                    {t(`budget.${budget.status}`)}
                  </td>
                  <td className="py-2 px-4 border border-border-color">
                    {new Date(budget.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border border-border-color">
                    {new Date(budget.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border border-border-color">
                    <Link
                      to={`/dashboard/finance/budget-details/${budget._id}`}
                      className="text-primary hover:underline"
                    >
                      {t("details")}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Budgets;
