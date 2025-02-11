import  { useState, useEffect } from "react";
import axios from "axios";

// רכיב המציג את רשימת המשימות
const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("https://api.example.com/tasks")
      .then((response) => {
        setTasks(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
        setError("לא ניתן לטעון את המשימות");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-blue-600">טוען משימות...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h2 className="text-2xl font-semibold mb-4">משימות</h2>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="border-b pb-2">
            <span className="font-bold">{task.title}</span> - {task.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

// רכיב המציג ניתוח ביצועים
const Performance = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("https://api.example.com/performance")
      .then((response) => {
        setPerformanceData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching performance data:", err);
        setError("לא ניתן לטעון את נתוני הביצועים");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-blue-600">טוען נתוני ביצועים...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h2 className="text-2xl font-semibold mb-4">ניתוח ביצועים</h2>
      {/* התאמה אישית: יש לוודא ששם השדות תואמים את מה שמסופק מה-API */}
      <p>
        <span className="font-bold">ציונים:</span> {performanceData.scores}
      </p>
      <p>
        <span className="font-bold">התקדמות:</span> {performanceData.progress}
      </p>
      {/* ניתן להוסיף גרפים וסיכומים נוספים */}
    </div>
  );
};

// רכיב המציג את פרופיל העובד
const Profile = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("https://api.example.com/employee")
      .then((response) => {
        setEmployee(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching employee data:", err);
        setError("לא ניתן לטעון את פרופיל העובד");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-blue-600">טוען פרופיל...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h2 className="text-2xl font-semibold mb-4">פרופיל עובד</h2>
      <p>
        <span className="font-bold">שם:</span> {employee.name}
      </p>
      <p>
        <span className="font-bold">תפקיד:</span> {employee.position}
      </p>
      <p>
        <span className="font-bold">אימייל:</span> {employee.email}
      </p>
    </div>
  );
};

// דף הבית לעובד המאגד את כל הרכיבים לעיל
const EmployeeDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          לוח בקרה לעובד
        </h1>
      </header>
      <main className="max-w-5xl mx-auto">
        <Tasks />
        <Performance />
        <Profile />
      </main>
    </div>
  );
};

export default EmployeeDashboard;
