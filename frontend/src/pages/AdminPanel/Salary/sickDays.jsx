import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";

const SickDays = () => {
  const [policies, setPolicies] = useState([]);
  const [country, setCountry] = useState("");
  const [accrualRate, setAccrualRate] = useState("");
  const [maxAccrual, setMaxAccrual] = useState("");
  const [carryOver, setCarryOver] = useState("");
  const [waitingPeriod, setWaitingPeriod] = useState("");
  const [paidPercentage, setPaidPercentage] = useState("");
  const [error, setError] = useState("");

  // Fetch policies from backend on component mount
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await axiosInstance.get("/sickDays");
        setPolicies(response.data.data);
      } catch (err) {
        setError("שגיאה בטעינת המדיניות");
      }
    };
    fetchPolicies();
  }, []);

  const addPolicy = async () => {
    if (
      country &&
      accrualRate &&
      maxAccrual &&
      carryOver &&
      waitingPeriod &&
      paidPercentage
    ) {
      try {
        const response = await axiosInstance.post("/sickDays", {
          country,
          accrual_rate: accrualRate,
          max_accrual: maxAccrual,
          carry_over: carryOver,
          waiting_period: waitingPeriod,
          paid_percentage: paidPercentage,
        });
        setPolicies([...policies, response.data.data]);
        setCountry("");
        setAccrualRate("");
        setMaxAccrual("");
        setCarryOver("");
        setWaitingPeriod("");
        setPaidPercentage("");
        setError("");
      } catch (err) {
        setError("שגיאה בהוספת המדיניות");
      }
    } else {
      setError("כל השדות נדרשים");
    }
  };

  const Tooltip = ({ text }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative inline-block">
        <span
          className="text-red-500 text-lg font-bold cursor-pointer"
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          !
        </span>
        {isVisible && (
          <div className="absolute right-6 top-0 bg-gray-800 text-white text-sm p-2 rounded shadow-lg w-64 z-10">
            {text}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">
        מנהל מדיניות ימי מחלה
      </h1>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">הוספת מדיניות חדשה</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="מדינה"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="p-2 border rounded w-full"
            />
            <Tooltip text="שם המדינה שבה תחול המדיניות, לדוגמה: ישראל, צרפת." />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="קצב צבירה (למשל, 1.5 ימים לחודש)"
              value={accrualRate}
              onChange={(e) => setAccrualRate(e.target.value)}
              className="p-2 border rounded w-full"
            />
            <Tooltip text="מספר ימי המחלה שנצברים לעובד בתקופה מסוימת, לדוגמה: 1.5 ימים לחודש עבודה בישראל." />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="צבירה מקסימלית (למשל, 90 ימים)"
              value={maxAccrual}
              onChange={(e) => setMaxAccrual(e.target.value)}
              className="p-2 border rounded w-full"
            />
            <Tooltip text="מספר ימי המחלה המרבי שניתן לצבור, לדוגמה: 90 ימים בישראל או ללא הגבלה." />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="העברה לשנה הבאה (למשל, כן, עד 90 יום)"
              value={carryOver}
              onChange={(e) => setCarryOver(e.target.value)}
              className="p-2 border rounded w-full"
            />
            <Tooltip text="האם ניתן להעביר ימי מחלה שלא נוצלו לשנה הבאה, ואם כן, עד כמה. בישראל, ניתן להעביר עד 90 יום." />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="תקופת המתנה (למשל, יום אחד ללא תשלום)"
              value={waitingPeriod}
              onChange={(e) => setWaitingPeriod(e.target.value)}
              className="p-2 border rounded w-full"
            />
            <Tooltip text="תקופה לפני תחילת התשלום עבור ימי מחלה, לדוגמה: בישראל, יום ראשון ללא תשלום, ימים 2-3 ב-50%." />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="אחוז תשלום (למשל, 50% בימים 2-3, 100% מיום 4)"
              value={paidPercentage}
              onChange={(e) => setPaidPercentage(e.target.value)}
              className="p-2 border rounded w-full"
            />
            <Tooltip text="אחוז השכר שמשולם לעובד במהלך ימי מחלה, לדוגמה: בישראל, 50% בימים 2-3, 100% מהיום הרביעי ואילך." />
          </div>
        </div>
        <button
          onClick={addPolicy}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          הוסף מדיניות
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">מדיניות קיימות</h2>
        {policies.length === 0 ? (
          <p className="text-gray-500">לא נוספו מדיניות עדיין.</p>
        ) : (
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">מדינה</th>
                <th className="p-2 border">קצב צבירה</th>
                <th className="p-2 border">צבירה מקסימלית</th>
                <th className="p-2 border">העברה לשנה הבאה</th>
                <th className="p-2 border">תקופת המתנה</th>
                <th className="p-2 border">אחוז תשלום</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy, index) => (
                <tr key={policy._id || index} className="hover:bg-gray-50">
                  <td className="p-2 border">{policy.country}</td>
                  <td className="p-2 border">{policy.accrual_rate}</td>
                  <td className="p-2 border">{policy.max_accrual}</td>
                  <td className="p-2 border">{policy.carry_over}</td>
                  <td className="p-2 border">{policy.waiting_period}</td>
                  <td className="p-2 border">{policy.paid_percentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SickDays;
