// src/pages/procurement/ProjectsList.jsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";

const ProjectsList = () => {
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
      toast.error(error.response?.data?.message || "Error fetching projects.");
    },
  });

  if (isLoading)
    return <div className="text-center p-4 text-text">Loading projects...</div>;
  if (isError)
    return (
      <div className="text-center p-4 text-red-500">
        Error loading projects.
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 bg-bg text-text">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">
        Projects List
      </h1>
      {projects.length === 0 ? (
        <p className="text-center text-secondary">No projects available.</p>
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
                  {project.description || "No description provided."}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm text-text">
                  <div>
                    <p>
                      <strong>Company:</strong> {project.companyId}
                    </p>
                    <p>
                      <strong>Department:</strong>{" "}
                      {project.department && project.department.name
                        ? project.department.name
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Start:</strong>{" "}
                      {project.startDate
                        ? format(new Date(project.startDate), "MMM d, yyyy")
                        : "N/A"}
                    </p>
                    <p>
                      <strong>End:</strong>{" "}
                      {project.endDate
                        ? format(new Date(project.endDate), "MMM d, yyyy")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Status:</strong> {project.status}
                    </p>
                    <p>
                      <strong>Budget:</strong> ${project.budget}
                    </p>
                    <p>
                      <strong>Priority:</strong> {project.priority}
                    </p>
                    <p>
                      <strong>Progress:</strong> {project.progress}%
                    </p>
                  </div>
                </div>

                {project.tags && project.tags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm">
                      <strong>Tags:</strong> {project.tags.join(", ")}
                    </p>
                  </div>
                )}

                {project.teamMembers && project.teamMembers.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-primary">
                      Team Members:
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

              {/* תחתית הכרטיס – תאריכים ונתונים נוספים */}
              <div className="p-4 border-t border-border-color bg-bg text-xs">
                <p>
                  <strong>Created:</strong>{" "}
                  {project.createdAt
                    ? format(new Date(project.createdAt), "MMM d, yyyy h:mm a")
                    : "N/A"}
                </p>
                <p>
                  <strong>Updated:</strong>{" "}
                  {project.updatedAt
                    ? format(new Date(project.updatedAt), "MMM d, yyyy h:mm a")
                    : "N/A"}
                </p>
              </div>

              {/* מידע נוסף: משימות, מסמכים, הערות */}
              {(project.tasks?.length > 0 ||
                project.documents?.length > 0 ||
                (project.comments && project.comments.length > 0)) && (
                <div className="p-4 border-t border-border-color">
                  {project.tasks && project.tasks.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-primary">
                        Tasks:
                      </p>
                      <ul className="list-disc ml-5 text-sm text-text">
                        {project.tasks.map((task, idx) => (
                          <li key={idx}>{task.title ? task.title : task}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {project.documents && project.documents.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-primary">
                        Documents:
                      </p>
                      <ul className="list-disc ml-5 text-sm text-text">
                        {project.documents.map((doc, idx) => (
                          <li key={idx}>{doc.name ? doc.name : doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {project.comments && project.comments.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        Comments:
                      </p>
                      <ul className="list-disc ml-5 text-xs text-text">
                        {project.comments.map((comment, idx) => (
                          <li key={idx} className="mb-2">
                            <p>
                              <strong>User:</strong>{" "}
                              {comment.user && comment.user.name
                                ? comment.user.name
                                : comment.user}
                            </p>
                            <p>
                              <strong>Text:</strong> {comment.text}
                            </p>
                            <p>
                              <strong>Created:</strong>{" "}
                              {comment.createdAt
                                ? format(
                                    new Date(comment.createdAt),
                                    "MMM d, yyyy h:mm a"
                                  )
                                : "N/A"}
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
