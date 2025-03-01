import { useState, useEffect } from "react";
import axiosInstance from "../../lib/axios";
import { useQuery } from "@tanstack/react-query";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const EmployeeDashboard = () => {
  // קבלת המשתמש המאומת
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });
  const authUser = authData?.user;
  const isLoggedIn = !!authUser;
  console.log("authUser:", authUser);

  const toStringId = (id) => {
    if (!id) return "";
    return typeof id === "object" && id.toString ? id.toString() : String(id);
  };

  // פונקציה לסינון משימות פעילות בהתאם לתפקיד העובד
  const filterActiveTasksForRole = (tasksArray) => {
    if (employee) {
      if (employee.role === "Employee") {
        return tasksArray.filter((task) => task.status === "in progress");
      } else {
        return tasksArray.filter(
          (task) => task.status === "pending" || task.status === "in progress"
        );
      }
    }
    return tasksArray;
  };

  // states למשימות ועובד
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  const [employee, setEmployee] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState(null);

  // states לעריכת פרופיל
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState({});

  // סקשנים שונים של משימות
  const activeTasks = employee ? filterActiveTasksForRole(tasks) : [];
  const archivedTasks = tasks.filter(
    (task) => task.status === "completed" || task.status === "cancelled"
  );
  const tasksNoProjectAssignedToUser = employee
    ? tasks.filter((task) => {
        return (
          (!task.projectId || task.projectId === "") &&
          task.assignedTo &&
          task.assignedTo.some(
            (assignee) =>
              toStringId(assignee._id ? assignee._id : assignee) ===
              toStringId(employee._id)
          )
        );
      })
    : [];
  const projectTasksForUser = employee
    ? tasks.filter((task) => {
        const userProjectIds =
          employee.projects?.map((p) => toStringId(p.projectId)) || [];
        return (
          task.projectId && userProjectIds.includes(toStringId(task.projectId))
        );
      })
    : [];

  // נתונים סטטיסטיים – התפלגות סטטוס המשימות
  const statusCount = tasks.reduce((acc, task) => {
    const status = task.status || "לא ידוע";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const taskStatusDistribution = {
    labels: Object.keys(statusCount),
    datasets: [
      {
        label: "משימות לפי סטטוס",
        data: Object.values(statusCount),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#00aa00"],
      },
    ],
  };

  // נתונים עבור משימות לפי עובד – לדוגמא, עבור המשימות המשויכות לעובד הנוכחי
  const tasksByEmployee = {};
  tasks.forEach((task) => {
    if (
      employee &&
      task.assignedTo &&
      task.assignedTo.some(
        (assignee) =>
          toStringId(assignee._id ? assignee._id : assignee) ===
          toStringId(employee._id)
      )
    ) {
      const empId = toStringId(employee._id);
      if (!tasksByEmployee[empId]) {
        tasksByEmployee[empId] = { employee: employee, tasks: [] };
      }
      tasksByEmployee[empId].tasks.push(task);
    }
  });
  const tasksPerEmployeeChartData = {
    labels: Object.values(tasksByEmployee).map(
      (item) => `${item.employee.name} ${item.employee.lastName || ""}`
    ),
    datasets: [
      {
        label: "משימות לפי עובד",
        data: Object.values(tasksByEmployee).map((item) => item.tasks.length),
        backgroundColor: "#00FFDD",
      },
    ],
  };

  // פונקציות לניהול התצוגה והשינויים
  const handleToggleTask = (taskId) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axiosInstance.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId || task.id === taskId
            ? { ...task, status: newStatus }
            : task
        )
      );
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  // מעבר למצב עריכה – אתחל את השדות עם נתוני העובד הקיימים
  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditedEmployee({
      name: employee.name,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      address: employee.address || {
        city: "",
        street: "",
        country: "",
        postalCode: "",
      },
      // אתחול שדות הסיסמה והפריוויה לתמונה
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      profileImagePreview: employee.profileImage || "",
    });
  };

  // טיפול בשינוי תמונת הפרופיל – בחירת קובץ, יצירת פריוויה
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditedEmployee((prev) => ({ ...prev, profileImageFile: file }));
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditedEmployee((prev) => ({
          ...prev,
          profileImagePreview: event.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // שמירת עדכון הפרופיל – כולל טיפול בסיסמה ובתמונת הפרופיל (לוגיקה להעלאת קובץ יכולה להתווסף כאן)
  const handleSaveProfile = async () => {
    // טיפול בשדות הסיסמה – במידה ונבחר לעדכן סיסמה
    if (
      editedEmployee.currentPassword ||
      editedEmployee.newPassword ||
      editedEmployee.confirmNewPassword
    ) {
      if (
        !editedEmployee.currentPassword ||
        !editedEmployee.newPassword ||
        !editedEmployee.confirmNewPassword
      ) {
        alert("עליך למלא את כל שדות הסיסמה");
        return;
      }
      if (editedEmployee.newPassword !== editedEmployee.confirmNewPassword) {
        alert("סיסמה חדשה ואימות הסיסמה אינם תואמים");
        return;
      }
    }

    // יצירת FormData והוספת כל השדות הרצויים
    const formData = new FormData();
    formData.append("name", editedEmployee.name);
    formData.append("lastName", editedEmployee.lastName);
    formData.append("email", editedEmployee.email);
    formData.append("phone", editedEmployee.phone);

    if (editedEmployee.address) {
      formData.append("address.street", editedEmployee.address.street || "");
      formData.append("address.city", editedEmployee.address.city || "");
      formData.append("address.country", editedEmployee.address.country || "");
      formData.append(
        "address.postalCode",
        editedEmployee.address.postalCode || ""
      );
    }

    // אם יש עדכון סיסמה – מוסיפים אותה
    if (editedEmployee.newPassword) {
      formData.append("password", editedEmployee.newPassword);
    }

    // אם נבחרה תמונת פרופיל חדשה – מוסיפים את הקובץ
    if (editedEmployee.profileImageFile) {
      formData.append("profileImage", editedEmployee.profileImageFile);
    }

    try {
      const response = await axiosInstance.put(
        `/employees/${employee._id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("Response from server:", response.data);
      setEmployee(response.data.data);
      setIsEditingProfile(false);
    } catch (error) {
      console.error(
        "Error updating employee profile:",
        error.response?.data || error
      );
      alert(
        "שגיאה בעדכון הפרופיל: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // טיפול בשינוי שדות טקסט
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setEditedEmployee((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setEditedEmployee((prev) => ({ ...prev, [name]: value }));
    }
  };

  // שליפת המשימות מהשרת
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axiosInstance.get("/tasks");
        setTasks(response.data.data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setTasksError("לא ניתן לטעון את המשימות");
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // שליפת נתוני העובד
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await axiosInstance.get("/employees/me");
        console.log("Employee data:", response.data.data);
        setEmployee(response.data.data);
      } catch (err) {
        console.error("Error fetching employee data:", err);
        setEmployeeError("לא ניתן לטעון את פרופיל העובד");
      } finally {
        setEmployeeLoading(false);
      }
    };
    fetchEmployee();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          לוח בקרה לעובד
        </h1>
      </header>
      <main className="max-w-5xl mx-auto">
        {/* סקשנים לניהול משימות */}
        {/* משימות ללא פרויקט */}
        <section className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            משימות ללא פרויקט שבהן המשתמש משויך
          </h2>
          {tasksLoading ? (
            <p className="text-blue-600">טוען משימות...</p>
          ) : tasksError ? (
            <p className="text-red-600">{tasksError}</p>
          ) : filterActiveTasksForRole(tasksNoProjectAssignedToUser).length ===
            0 ? (
            <p>אין משימות ללא פרויקט בהן אתה משויך</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filterActiveTasksForRole(tasksNoProjectAssignedToUser).map(
                (task) => (
                  <div
                    key={task.id || task._id}
                    className="cursor-pointer border p-4 rounded shadow"
                    onClick={() => handleToggleTask(task.id || task._id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{task.title}</span>
                      <span className="text-sm text-gray-600">
                        {task.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>עדיפות: {task.priority}</span>
                      {task.dueDate && (
                        <span className="ml-2">
                          תאריך יעד:{" "}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {expandedTaskId === (task.id || task._id) && (
                      <div className="mt-2 p-2 border-t">
                        <p className="text-sm text-gray-700">
                          {task.description || "אין תיאור"}
                        </p>
                      </div>
                    )}
                    {employee && employee.role !== "Employee" && (
                      <div className="mt-2">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(
                              task.id || task._id,
                              e.target.value
                            )
                          }
                          className="border p-1 rounded text-sm"
                        >
                          <option value="pending">pending</option>
                          <option value="in progress">in progress</option>
                          <option value="completed">completed</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* משימות מפרויקטים */}
        <section className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            משימות מפרויקטים שבהם אתה משויך
          </h2>
          {tasksLoading ? (
            <p className="text-blue-600">טוען משימות...</p>
          ) : tasksError ? (
            <p className="text-red-600">{tasksError}</p>
          ) : filterActiveTasksForRole(projectTasksForUser).length === 0 ? (
            <p>אין משימות בפרויקטים שבהם אתה משויך</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filterActiveTasksForRole(projectTasksForUser).map((task) => (
                <div
                  key={task.id || task._id}
                  className="cursor-pointer border p-4 rounded shadow"
                  onClick={() => handleToggleTask(task.id || task._id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{task.title}</span>
                    <span className="text-sm text-gray-600">{task.status}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span>עדיפות: {task.priority}</span>
                    {task.dueDate && (
                      <span className="ml-2">
                        תאריך יעד: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.projectId && (
                      <span className="ml-2">
                        פרויקט: {task.projectId.name || "לא ידוע"}
                      </span>
                    )}
                  </div>
                  {expandedTaskId === (task.id || task._id) && (
                    <div className="mt-2 p-2 border-t">
                      <p className="text-sm text-gray-700">
                        {task.description || "אין תיאור"}
                      </p>
                    </div>
                  )}
                  {employee && employee.role !== "Employee" && (
                    <div className="mt-2">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(
                            task.id || task._id,
                            e.target.value
                          )
                        }
                        className="border p-1 rounded text-sm"
                      >
                        <option value="pending">pending</option>
                        <option value="in progress">in progress</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* משימות ארכיביות */}
        <section className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            משימות שהושלמו / בוטלו
          </h2>
          {tasksLoading ? (
            <p className="text-blue-600">טוען משימות...</p>
          ) : tasksError ? (
            <p className="text-red-600">{tasksError}</p>
          ) : archivedTasks.length === 0 ? (
            <p>אין משימות שהושלמו או בוטלו</p>
          ) : (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-4 py-2">כותרת</th>
                  <th className="border px-4 py-2">סטטוס</th>
                  <th className="border px-4 py-2">עדיפות</th>
                  <th className="border px-4 py-2">תאריך יעד</th>
                  <th className="border px-4 py-2">תאריך עדכון</th>
                </tr>
              </thead>
              <tbody>
                {archivedTasks.map((task) => (
                  <tr key={task.id || task._id}>
                    <td className="border px-4 py-2">{task.title}</td>
                    <td className="border px-4 py-2">{task.status}</td>
                    <td className="border px-4 py-2">{task.priority}</td>
                    <td className="border px-4 py-2">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="border px-4 py-2">
                      {task.updatedAt
                        ? new Date(task.updatedAt).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* נתונים סטטיסטיים */}
        <section className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">נתונים סטטיסטיים</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">התפלגות סטטוס משימות</h3>
              <Pie data={taskStatusDistribution} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">משימות לפי עובד</h3>
              <Bar data={tasksPerEmployeeChartData} />
            </div>
          </div>
        </section>

        {/* סקשן להצגת כל המשימות */}
        <section className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">כל המשימות</h2>
          {tasksLoading ? (
            <p className="text-blue-600">טוען משימות...</p>
          ) : tasksError ? (
            <p className="text-red-600">{tasksError}</p>
          ) : tasks.length === 0 ? (
            <p>אין משימות</p>
          ) : (
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-4 py-2">כותרת</th>
                  <th className="border px-4 py-2">סטטוס</th>
                  <th className="border px-4 py-2">עדיפות</th>
                  <th className="border px-4 py-2">תאריך יעד</th>
                  <th className="border px-4 py-2">משויך</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id || task._id}>
                    <td className="border px-4 py-2">{task.title}</td>
                    <td className="border px-4 py-2">{task.status}</td>
                    <td className="border px-4 py-2">{task.priority}</td>
                    <td className="border px-4 py-2">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="border px-4 py-2">
                      {task.assignedTo && task.assignedTo.length > 0
                        ? task.assignedTo
                            .map(
                              (assignee) =>
                                assignee.name ||
                                (assignee._id && assignee._id) ||
                                ""
                            )
                            .join(", ")
                        : "לא משויך"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* פרופיל העובד */}
        <section className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-2xl font-semibold mb-4">פרופיל עובד</h2>
          {employeeLoading ? (
            <p className="text-blue-600">טוען פרופיל...</p>
          ) : employeeError ? (
            <p className="text-red-600">{employeeError}</p>
          ) : (
            <div className="mt-4">
              {!isEditingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">שם פרטי</h3>
                    <p>{employee.name}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">שם משפחה</h3>
                    <p>{employee.lastName}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">מגדר</h3>
                    <p>{employee.gender}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">תעודת זהות</h3>
                    <p>{employee.identity}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">אימייל</h3>
                    <p>{employee.email}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">טלפון</h3>
                    <p>{employee.phone}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">תפקיד</h3>
                    <p>{employee.role}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">מזהה עובד</h3>
                    <p>{employee.employeeId || "לא צוין"}</p>
                  </div>
                  {employee.profileImage && (
                    <div className="bg-gray-100 p-4 rounded shadow">
                      <h3 className="text-lg font-bold">תמונת פרופיל</h3>
                      <img
                        src={employee.profileImage}
                        alt="Profile"
                        className="w-32 h-32 object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">כתובת</h3>
                    <p>
                      {employee.address
                        ? `${employee.address.street}, ${employee.address.city}, ${employee.address.country}, ${employee.address.postalCode}`
                        : "לא צוינה"}
                    </p>
                  </div>
                  {employee.companyId && employee.companyId.name && (
                    <div className="bg-gray-100 p-4 rounded shadow">
                      <h3 className="text-lg font-bold">חברה</h3>
                      <p>{employee.companyId.name}</p>
                    </div>
                  )}
                  {employee.department && (
                    <div className="bg-gray-100 p-4 rounded shadow">
                      <h3 className="text-lg font-bold">מחלקה</h3>
                      <p>{employee.department.name || employee.department}</p>
                    </div>
                  )}
                  {employee.projects && employee.projects.length > 0 && (
                    <div className="bg-gray-100 p-4 rounded shadow md:col-span-2">
                      <h3 className="text-lg font-bold">פרויקטים</h3>
                      <ul className="list-disc pl-5">
                        {employee.projects.map((proj, index) => (
                          <li key={index}>
                            {proj.projectId && proj.projectId.name
                              ? `${proj.projectId.name} (תפקיד: ${proj.role})`
                              : "פרויקט ללא שם"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {employee.benefits && employee.benefits.length > 0 && (
                    <div className="bg-gray-100 p-4 rounded shadow md:col-span-2">
                      <h3 className="text-lg font-bold">הטבות</h3>
                      <ul className="list-disc pl-5">
                        {employee.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {employee.performanceReviews &&
                    employee.performanceReviews.length > 0 && (
                      <div className="bg-gray-100 p-4 rounded shadow md:col-span-2">
                        <h3 className="text-lg font-bold">ביקורות ביצועים</h3>
                        <ul className="list-disc pl-5">
                          {employee.performanceReviews.map((review, index) => (
                            <li key={index}>
                              ציון: {review.score} (ID: {review.reviewId})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  {employee.attendance && employee.attendance.length > 0 && (
                    <div className="bg-gray-100 p-4 rounded shadow md:col-span-2">
                      <h3 className="text-lg font-bold">נוכחות</h3>
                      <ul className="list-disc pl-5">
                        {employee.attendance.map((record, index) => (
                          <li key={index}>
                            {new Date(record.date).toLocaleDateString()}:{" "}
                            {record.status}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">סטטוס</h3>
                    <p>{employee.status || "לא צוין"}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">כניסה אחרונה</h3>
                    <p>
                      {employee.lastLogin
                        ? new Date(employee.lastLogin).toLocaleString()
                        : "לא צוינה"}
                    </p>
                  </div>
                  <button
                    onClick={handleEditProfile}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    ערוך פרופיל
                  </button>
                </div>
              ) : (
                // מצב עריכת פרופיל – כולל קלט לקובץ תמונה וקבוצה מאוחדת לשדות סיסמה
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">שם פרטי</h3>
                    <input
                      type="text"
                      name="name"
                      value={editedEmployee.name}
                      onChange={handleProfileChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">שם משפחה</h3>
                    <input
                      type="text"
                      name="lastName"
                      value={editedEmployee.lastName}
                      onChange={handleProfileChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">מגדר</h3>
                    <p className="text-gray-600">{employee.gender}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">תעודת זהות</h3>
                    <p className="text-gray-600">{employee.identity}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">אימייל</h3>
                    <input
                      type="email"
                      name="email"
                      value={editedEmployee.email}
                      onChange={handleProfileChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">טלפון</h3>
                    <PhoneInput
                      country={"il"}
                      value={editedEmployee.phone}
                      onChange={(phone) =>
                        setEditedEmployee((prev) => ({ ...prev, phone }))
                      }
                      inputClass="w-full p-2 border rounded"
                    />
                  </div>
                  {/* תפקיד מוצג כטקסט בלבד */}
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">תפקיד</h3>
                    <p className="text-gray-600">{employee.role}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">מזהה עובד</h3>
                    <p className="text-gray-600">
                      {employee.employeeId || "לא צוין"}
                    </p>
                  </div>
                  {/* קלט לשינוי תמונת פרופיל עם פריוויה */}
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">תמונת פרופיל</h3>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="border p-2 w-full rounded"
                    />
                    {editedEmployee.profileImagePreview && (
                      <div className="mt-2">
                        <img
                          src={editedEmployee.profileImagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                  {/* קבוצה מאוחדת לשדות הסיסמה */}
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">סיסמה</h3>
                    <div className="flex flex-col gap-2">
                      <input
                        type="password"
                        name="currentPassword"
                        value={editedEmployee.currentPassword}
                        onChange={handleProfileChange}
                        placeholder="הזן סיסמה קיימת"
                        className="border p-2 w-full rounded"
                      />
                      <input
                        type="password"
                        name="newPassword"
                        value={editedEmployee.newPassword}
                        onChange={handleProfileChange}
                        placeholder="הזן סיסמה חדשה"
                        className="border p-2 w-full rounded"
                      />
                      <input
                        type="password"
                        name="confirmNewPassword"
                        value={editedEmployee.confirmNewPassword}
                        onChange={handleProfileChange}
                        placeholder="אמת סיסמה חדשה"
                        className="border p-2 w-full rounded"
                      />
                    </div>
                  </div>
                  {/* שדות כתובת */}
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">רחוב</h3>
                    <input
                      type="text"
                      name="address.street"
                      value={editedEmployee.address.street || ""}
                      onChange={handleProfileChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">עיר</h3>
                    <input
                      type="text"
                      name="address.city"
                      value={editedEmployee.address.city || ""}
                      onChange={handleProfileChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">מדינה</h3>
                    <input
                      type="text"
                      name="address.country"
                      value={editedEmployee.address.country || ""}
                      onChange={handleProfileChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">מיקוד</h3>
                    <input
                      type="text"
                      name="address.postalCode"
                      value={editedEmployee.address.postalCode || ""}
                      onChange={handleProfileChange}
                      className="border p-2 w-full rounded"
                    />
                  </div>
                  {employee.companyId && employee.companyId.name && (
                    <div className="bg-gray-100 p-4 rounded shadow">
                      <h3 className="text-lg font-bold">חברה</h3>
                      <p className="text-gray-600">{employee.companyId.name}</p>
                    </div>
                  )}
                  {employee.department && (
                    <div className="bg-gray-100 p-4 rounded shadow">
                      <h3 className="text-lg font-bold">מחלקה</h3>
                      <p className="text-gray-600">
                        {employee.department.name || employee.department}
                      </p>
                    </div>
                  )}
                  {employee.projects && employee.projects.length > 0 && (
                    <div className="bg-gray-100 p-4 rounded shadow md:col-span-2">
                      <h3 className="text-lg font-bold">פרויקטים</h3>
                      <ul className="list-disc pl-5">
                        {employee.projects.map((proj, index) => (
                          <li key={index}>
                            {proj.projectId && proj.projectId.name
                              ? `${proj.projectId.name} (תפקיד: ${proj.role})`
                              : "פרויקט ללא שם"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {employee.benefits && employee.benefits.length > 0 && (
                    <div className="bg-gray-100 p-4 rounded shadow md:col-span-2">
                      <h3 className="text-lg font-bold">הטבות</h3>
                      <ul className="list-disc pl-5">
                        {employee.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {employee.performanceReviews &&
                    employee.performanceReviews.length > 0 && (
                      <div className="bg-gray-100 p-4 rounded shadow md:col-span-2">
                        <h3 className="text-lg font-bold">ביקורות ביצועים</h3>
                        <ul className="list-disc pl-5">
                          {employee.performanceReviews.map((review, index) => (
                            <li key={index}>
                              ציון: {review.score} (ID: {review.reviewId})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  {employee.attendance && employee.attendance.length > 0 && (
                    <div className="bg-gray-100 p-4 rounded shadow md:col-span-2">
                      <h3 className="text-lg font-bold">נוכחות</h3>
                      <ul className="list-disc pl-5">
                        {employee.attendance.map((record, index) => (
                          <li key={index}>
                            {new Date(record.date).toLocaleDateString()}:{" "}
                            {record.status}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">סטטוס</h3>
                    <p className="text-gray-600">
                      {employee.status || "לא צוין"}
                    </p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <h3 className="text-lg font-bold">כניסה אחרונה</h3>
                    <p className="text-gray-600">
                      {employee.lastLogin
                        ? new Date(employee.lastLogin).toLocaleString()
                        : "לא צוינה"}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      שמור
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      בטל
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
