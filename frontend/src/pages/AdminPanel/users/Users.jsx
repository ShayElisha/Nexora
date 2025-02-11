// src/components/procurement/Users.jsx
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";

const Users = () => {
  const { t } = useTranslation(); // שימוש במילון 'users'

  // שליפת משתמשים עם useQuery
  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/employees");
        return response.data.data;
      } catch (err) {
        // במקרה של 404 נחזיר מערך ריק כדי למנוע מצב שגיאה
        if (err.response?.status === 404) {
          return [];
        }
        throw err;
      }
    },
  });

  return (
    <div className="min-h-screen bg-bg text-text flex justify-center items-start py-8">
      {/* עיטוף מרכזי עם רוחב 80% */}
      <div className="w-4/5 bg-bg p-6 rounded-lg shadow-xl border border-border-color">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">
          {t("users.users_list")}
        </h1>

        {/* מצבים: טעינה, שגיאה, או הצגת טבלה */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>{t("users.loading")}</p>
          </div>
        ) : isError ? (
          <div className="flex justify-center items-center h-64 text-red-500">
            {error?.message || t("users.failed_to_load_users")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-bg text-text rounded-lg overflow-hidden text-center border border-border-color">
              <thead>
                <tr className="bg-secondary">
                  <th className="py-2 px-4">{t("users.profile_image")}</th>
                  <th className="py-2 px-4">{t("users.name")}</th>
                  <th className="py-2 px-4">{t("users.last_name")}</th>
                  <th className="py-2 px-4">{t("users.email")}</th>
                  <th className="py-2 px-4">{t("users.phone")}</th>
                  <th className="py-2 px-4">{t("users.role")}</th>
                  <th className="py-2 px-4">{t("users.address")}</th>
                  <th className="py-2 px-4">{t("users.projects")}</th>
                  <th className="py-2 px-4">{t("users.performance_reviews")}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 px-4 text-center text-gray-400">
                      {t("users.no_users")}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.email}
                      className="border-b border-border-color hover:bg-secondary transition-colors"
                    >
                      <td className="py-2 px-4">
                        <img
                          src={user.profileImage}
                          alt={`${user.name} ${user.lastName}`}
                          className="w-16 h-16 rounded-full object-cover mx-auto"
                        />
                      </td>
                      <td className="py-2 px-4">{user.name}</td>
                      <td className="py-2 px-4">{user.lastName}</td>
                      <td className="py-2 px-4">{user.email}</td>
                      <td className="py-2 px-4">{user.phone}</td>
                      <td className="py-2 px-4">{user.role}</td>
                      <td className="py-2 px-4">
                        {user.address?.deletedAt ? t("users.deleted") : t("users.active")}
                      </td>
                      <td className="py-2 px-4">
                        {user.projects && user.projects.length > 0
                          ? user.projects
                              .map((proj) => proj.projectId?.name)
                              .filter(Boolean)
                              .join(", ")
                          : t("users.no_projects")}
                      </td>
                      <td className="py-2 px-4">
                        {user.performanceReviews.length > 0
                          ? `${user.performanceReviews.length} ${t("users.reviews")}`
                          : t("users.no_reviews")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
