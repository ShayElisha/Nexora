import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import Sidebar from "../layouts/Sidebar";
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
      const response = await axiosInstance.get(`/budget`, {});
      return response.data.data;
    },
    onError: (err) => {
      toast.error(`${t("budget.error_create_budget")}: ${err.message}`);
    },
  });

  if (isLoading) return <div>{t("loading")}</div>;
  if (error)
    return (
      <div className="text-red-500">
        {t("error")}: {error.message}
      </div>
    );

  return (
    <div className="flex">
      <Sidebar />
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">{t("budget.budgets")}</h1>
        <Link to="/add-budget" className="btn btn-primary mb-4">
          {t("budget.add_budget")}
        </Link>
        <table className="min-w-full bg-gray-800 text-white">
          <thead>
            <tr>
              <th className="py-2 px-4">
                {t("budget.department_project_name")}
              </th>
              <th className="py-2 px-4">{t("budget.budget_amount")}</th>
              <th className="py-2 px-4">{t("budget.currency")}</th>
              <th className="py-2 px-4">{t("budget.period")}</th>
              <th className="py-2 px-4">{t("budget.status")}</th>
              <th className="py-2 px-4">{t("created_at")}</th>
              <th className="py-2 px-4">{t("updated_at")}</th>
              <th className="py-2 px-4">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((budget) => (
              <tr key={budget._id}>
                <td className="py-2 px-4">{budget.departmentOrProjectName}</td>
                <td className="py-2 px-4">{budget.amount}</td>
                <td className="py-2 px-4">{budget.currency}</td>
                <td className="py-2 px-4">{budget.period}</td>
                <td className="py-2 px-4">{t(`budget.${budget.status}`)}</td>
                <td className="py-2 px-4">
                  {new Date(budget.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2 px-4">
                  {new Date(budget.updatedAt).toLocaleDateString()}
                </td>
                <td className="py-2 px-4">
                  <Link
                    to={`/dashboard/finance/budget-details/${budget._id}`}
                    className="text-blue-400"
                  >
                    {t("details")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Budgets;
