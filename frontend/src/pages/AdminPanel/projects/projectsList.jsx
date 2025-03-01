import React from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const ProjectsList = () => {
  const { t } = useTranslation();

  // שליפת רשימת הפרויקטים מה-API
  const {
    data: projects = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await axiosInstance.get("/projects");
      return res.data.data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("projects.error_fetch"));
    },
  });

  if (isLoading)
    return (
      <div className="text-center p-4 text-text">{t("projects.loading")}</div>
    );
  if (isError)
    return (
      <div className="text-center p-4 text-red-500">
        {t("projects.error_loading")}
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 bg-bg text-text">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">
        {t("projects.title")}
      </h1>
      {projects.length === 0 ? (
        <p className="text-center text-secondary">
          {t("projects.no_projects")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="rounded-lg shadow-lg overflow-hidden flex flex-col border border-border-color bg-bg"
            >
              {/* כותרת הכרטיס */}
              <div className="p-4 border-b border-border-color">
                <h2 className="text-xl font-semibold text-primary">
                  {project.name}
                </h2>
              </div>

              {/* גוף הכרטיס – פרטים עיקריים */}
              <div className="p-4 flex-grow">
                <p className="mb-2 text-secondary">
                  {project.description || t("projects.no_description")}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm text-text">
                  <div>
                    <p>
                      <strong>{t("projects.company")}:</strong>{" "}
                      {project.companyId}
                    </p>
                    <p>
                      <strong>{t("projects.department")}:</strong>{" "}
                      {project.department?.name || t("projects.not_available")}
                    </p>
                    <p>
                      <strong>{t("projects.start")}:</strong>{" "}
                      {project.startDate
                        ? format(new Date(project.startDate), "MMM d, yyyy")
                        : t("projects.not_available")}
                    </p>
                    <p>
                      <strong>{t("projects.end")}:</strong>{" "}
                      {project.endDate
                        ? format(new Date(project.endDate), "MMM d, yyyy")
                        : t("projects.not_available")}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>{t("projects.status")}:</strong> {project.status}
                    </p>
                    <p>
                      <strong>{t("projects.budget")}:</strong> ${project.budget}
                    </p>
                    <p>
                      <strong>{t("projects.priority")}:</strong>{" "}
                      {project.priority}
                    </p>
                    <p>
                      <strong>{t("projects.progress")}:</strong>{" "}
                      {project.progress}%
                    </p>
                  </div>
                </div>

                {project.tags?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm">
                      <strong>{t("projects.tags")}:</strong>{" "}
                      {project.tags.join(", ")}
                    </p>
                  </div>
                )}

                {project.teamMembers?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-primary">
                      {t("projects.team_members")}:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.teamMembers.map((member, idx) => (
                        <span
                          key={idx}
                          className="bg-accent text-button-text px-2 py-1 rounded text-xs"
                        >
                          {member.employeeId.name} {member.employeeId.lastName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* תחתית הכרטיס */}
              <div className="p-4 border-t border-border-color bg-bg text-xs">
                <p>
                  <strong>{t("projects.created")}:</strong>{" "}
                  {project.createdAt
                    ? format(new Date(project.createdAt), "MMM d, yyyy h:mm a")
                    : t("projects.not_available")}
                </p>
                <p>
                  <strong>{t("projects.updated")}:</strong>{" "}
                  {project.updatedAt
                    ? format(new Date(project.updatedAt), "MMM d, yyyy h:mm a")
                    : t("projects.not_available")}
                </p>
              </div>

              {/* מידע נוסף */}
              {(project.tasks?.length > 0 ||
                project.documents?.length > 0 ||
                project.comments?.length > 0) && (
                <div className="p-4 border-t border-border-color">
                  {project.tasks?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-primary">
                        {t("projects.tasks")}:
                      </p>
                      <ul className="list-disc ml-5 text-sm text-text">
                        {project.tasks.map((task, idx) => (
                          <li key={idx}>{task.title || task}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {project.documents?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-primary">
                        {t("projects.documents")}:
                      </p>
                      <ul className="list-disc ml-5 text-sm text-text">
                        {project.documents.map((doc, idx) => (
                          <li key={idx}>{doc.name || doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {project.comments?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {t("projects.comments")}:
                      </p>
                      <ul className="list-disc ml-5 text-xs text-text">
                        {project.comments.map((comment, idx) => (
                          <li key={idx} className="mb-2">
                            <p>
                              <strong>{t("projects.comment_user")}:</strong>{" "}
                              {comment.user?.name || comment.user}
                            </p>
                            <p>
                              <strong>{t("projects.comment_text")}:</strong>{" "}
                              {comment.text}
                            </p>
                            <p>
                              <strong>{t("projects.comment_created")}:</strong>{" "}
                              {comment.createdAt
                                ? format(
                                    new Date(comment.createdAt),
                                    "MMM d, yyyy h:mm a"
                                  )
                                : t("projects.not_available")}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
