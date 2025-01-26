import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import Sidebar from "../layouts/Sidebar";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

/**
 * פונקציה היוצרת Map: dateKey -> sum of totalPrice באותו יום
 * ממיינת ומאגדת את items לפי `addedAt`.
 */
function createDateMapFromItems(items) {
  const dateMap = {};
  for (const item of items) {
    if (!item.addedAt) continue;
    const dayKey = new Date(item.addedAt).toISOString().split("T")[0];
    dateMap[dayKey] = (dateMap[dayKey] || 0) + (item.totalPrice || 0);
  }
  return dateMap;
}

/**
 * יוצרת מערך תאריכים מ-startDate עד endDate (גם אם אין פריטים באותו יום),
 * ומחזירה מערך של אובייקטים { date, cumulativeTotal }
 * כאשר cumulativeTotal מצטבר מהתחלה עד לאותו יום.
 */
function computeDailyCumulative(startDate, endDate, items) {
  // 1. מייצרים טווח ימים
  const allDays = generateDateRange(startDate, endDate);
  // 2. יוצרים מפת סכומים לפי יום
  const dateMap = createDateMapFromItems(items);

  // 3. מעבר על כל הימים בסדר כרונולוגי, צוברים
  let cumulative = 0;
  const result = [];

  for (const day of allDays) {
    const dayTotal = dateMap[day] || 0; // אם אין פריטים באותו יום - 0
    cumulative += dayTotal;
    result.push({
      date: day, // למשל: "2025-01-16"
      cumulativeTotal: cumulative,
    });
  }
  return result;
}

/**
 * פונקציית עזר: יוצרת מערך ימים (strings) ממתחם תאריכים start->end.
 */
function generateDateRange(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (start > end) return [];

  const dateArray = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dateArray.push(new Date(d).toISOString().split("T")[0]);
  }
  return dateArray;
}

const BudgetDetails = () => {
  const { id } = useParams();

  // 1. מושכים את התקציב מכתובת: GET /budget/:id
  const {
    data: apiRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["budget", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/budget/${id}`);
      return res.data; // { success, data: { ... } }
    },
    onError: (err) => console.error("Error fetching budget:", err),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading budget details</div>;
  if (!apiRes || !apiRes.data) return <div>No budget data found.</div>;

  // 2. שליפת השדות מהאובייקט שהוחזר
  const budget = apiRes.data;
  const {
    departmentOrProjectName,
    amount,
    startDate,
    endDate,
    items = [],
  } = budget;

  // 3. מחשבים מערך לציר הזמן: קו אדום (cumulative) מתאריך התחלה עד תאריך סוף
  const dailyCumulative = computeDailyCumulative(startDate, endDate, items);
  // dailyCumulative => [{ date: "2025-01-16", cumulativeTotal: 1332 }, ...]

  // אם אין כלל תאריכים או something, נטפל:
  if (!dailyCumulative.length) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="container mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4">No Data to Display</h1>
        </div>
      </div>
    );
  }

  // 4. בונים 2 קווים:
  //   א) "Actual" (אדום) עם cumulativeTotal
  //   ב) "Budget" (כחול) - ערך קבוע amount לאורך כל הימים
  const actualLine = dailyCumulative.map((row) => ({
    x: row.date,
    y: row.cumulativeTotal,
  }));

  const budgetLine = dailyCumulative.map((row) => ({
    x: row.date,
    y: amount, // קבוע
  }));

  // 5. הגדרת data ו-options ל-Chart.js (ללא נקודות, רק קו)
  const chartData = {
    datasets: [
      {
        label: "Actual Spend (Cumulative)",
        data: actualLine,
        borderColor: "rgba(255, 99, 132, 1)", // צבע אדום חזק
        backgroundColor: "rgba(255, 99, 132, 0.1)", // רקע אדום עדין
        borderWidth: 4, // עובי הקו
        pointRadius: actualLine.map((data, index) =>
          index === 0 || data.y !== actualLine[index - 1]?.y ? 5 : 0
        ), // נקודות רק במקומות שינוי
        pointHoverRadius: 8,
        pointBackgroundColor: "white",
        pointBorderWidth: 2,
        pointHoverBackgroundColor: "rgba(255, 99, 132, 1)",
        tension: 0.4,
        fill: true,
        showLine: true,
      },
      {
        label: "Budget (constant)",
        data: budgetLine,
        borderColor: "rgba(54, 162, 235, 1)", // צבע כחול לתקציב
        backgroundColor: "rgba(54, 162, 235, 0.05)", // רקע כחול עדין
        borderWidth: 3,
        pointRadius: 0, // ללא נקודות כלל בקו התקציב
        borderDash: [15, 5], // קו מקווקו לתקציב
        borderDashOffset: 2,
        tension: 0,
        fill: false,
        showLine: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: {
        display: true,
        text: "Daily Budget vs. Cumulative Spend",
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
          tooltipFormat: "yyyy-MM-dd",
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  // 6. רינדור סופי
  return (
    <div className="flex">
      <Sidebar />
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">
          {departmentOrProjectName} - Budget Details
        </h1>
        <p>
          <strong>Allocated Amount:</strong> {amount}
        </p>
        <p>
          <strong>Start Date:</strong> {startDate?.split("T")[0] || "N/A"}
        </p>
        <p>
          <strong>End Date:</strong> {endDate?.split("T")[0] || "N/A"}
        </p>

        <div className="mt-6">
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Items</h2>
          <table className="min-w-full border">
            <thead className="border-b bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-r">Date</th>
                <th className="px-4 py-2 border-r">Quantity</th>
                <th className="px-4 py-2 border-r">Unit Price</th>
                <th className="px-4 py-2">Total Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 border-r">
                    {item.addedAt?.split("T")[0] || "N/A"}
                  </td>
                  <td className="px-4 py-2 border-r">{item.quantity}</td>
                  <td className="px-4 py-2 border-r">{item.unitPrice}</td>
                  <td className="px-4 py-2">{item.totalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BudgetDetails;
