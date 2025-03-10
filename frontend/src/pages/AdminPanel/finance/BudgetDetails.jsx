import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axiosInstance from "../../../lib/axios";
import { useTranslation } from "react-i18next";

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

function createDateMapFromItems(items) {
  const dateMap = {};
  for (const item of items) {
    if (!item.addedAt) continue;
    const dayKey = new Date(item.addedAt).toISOString().split("T")[0];
    dateMap[dayKey] = (dateMap[dayKey] || 0) + (item.totalPrice || 0);
  }
  return dateMap;
}

function computeDailyCumulative(startDate, endDate, items) {
  const allDays = generateDateRange(startDate, endDate);
  const dateMap = createDateMapFromItems(items);

  let cumulative = 0;
  const result = [];
  for (const day of allDays) {
    const dayTotal = dateMap[day] || 0;
    cumulative += dayTotal;
    result.push({ date: day, cumulativeTotal: cumulative });
  }
  return result;
}

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
  const { t } = useTranslation();
  const { id } = useParams();

  const {
    data: apiRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["budget", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/budget/${id}`);
      return res.data;
    },
    onError: (err) => console.error("Error fetching budget:", err),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex justify-center items-center">
        <div className="text-red-500 font-medium text-lg">
          {t("budget.error_loading_details")}: {error.message}
        </div>
      </div>
    );
  }

  if (!apiRes || !apiRes.data) {
    return (
      <div className="min-h-screen bg-bg flex justify-center items-center">
        <div className="text-text font-medium text-lg opacity-70">
          {t("budget.no_data_found")}
        </div>
      </div>
    );
  }

  const budget = apiRes.data;
  const {
    departmentOrProjectName,
    amount,
    startDate,
    endDate,
    items = [],
  } = budget;
  const dailyCumulative = computeDailyCumulative(startDate, endDate, items);

  if (!dailyCumulative.length) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center py-10">
        <div className="container mx-auto p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold text-text mb-6 tracking-tight drop-shadow-md">
            {t("budget.no_data_to_display")}
          </h1>
        </div>
      </div>
    );
  }

  const actualLine = dailyCumulative.map((row) => ({
    x: row.date,
    y: row.cumulativeTotal,
  }));

  const budgetLine = dailyCumulative.map((row) => ({
    x: row.date,
    y: amount,
  }));

  const chartData = {
    datasets: [
      {
        label: t("budget.actual_spend_cumulative"),
        data: actualLine,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        borderWidth: 4,
        pointRadius: actualLine.map((data, index) =>
          index === 0 || data.y !== actualLine[index - 1]?.y ? 5 : 0
        ),
        pointHoverRadius: 8,
        pointBackgroundColor: "white",
        pointBorderWidth: 2,
        pointHoverBackgroundColor: "rgba(255, 99, 132, 1)",
        tension: 0.4,
        fill: true,
        showLine: true,
      },
      {
        label: t("budget.budget_constant"),
        data: budgetLine,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.05)",
        borderWidth: 3,
        pointRadius: 0,
        borderDash: [15, 5],
        borderDashOffset: 2,
        tension: 0,
        fill: false,
        showLine: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // מאפשר שליטה בגובה
    plugins: {
      legend: { position: "bottom", labels: { font: { size: 14 } } },
      title: {
        display: true,
        text: t("budget.daily_budget_vs_spend"),
        font: { size: 18, weight: "bold" },
        color: "#374151", // text-color
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "day", tooltipFormat: "yyyy-MM-dd" },
        title: { display: true, text: t("budget.date"), font: { size: 14 } },
        grid: { color: "#d1d5db" }, // border-color
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: t("budget.amount"), font: { size: 14 } },
        grid: { color: "#d1d5db" },
      },
    },
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center py-10 animate-fade-in">
      <div className="container mx-auto p-6 sm:p-8 w-full max-w-5xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text mb-8 tracking-tight drop-shadow-md text-center">
          {departmentOrProjectName} - {t("budget.budget_details")}
        </h1>

        <div className="bg-accent p-6 rounded-xl shadow-md border bg-bg mb-8">
          <p className="text-sm text-text">
            <strong className="font-semibold">
              {t("budget.allocated_amount")}:
            </strong>{" "}
            {amount}
          </p>
          <p className="text-sm text-text mt-2">
            <strong className="font-semibold">{t("budget.start_date")}:</strong>{" "}
            {startDate?.split("T")[0] || "N/A"}
          </p>
          <p className="text-sm text-text mt-2">
            <strong className="font-semibold">{t("budget.end_date")}:</strong>{" "}
            {endDate?.split("T")[0] || "N/A"}
          </p>
        </div>

        <div className="bg-accent p-6 rounded-xl shadow-md border bg-bg mb-8 h-96 sm:h-[28rem]">
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="bg-accent rounded-xl shadow-md border bg-bgoverflow-x-auto">
          <h2 className="text-xl font-semibold text-text p-4 border-b bg-bg drop-shadow-sm">
            {t("budget.items")}
          </h2>
          <table className="min-w-full text-text">
            <thead className="bg-button-bg text-button-text">
              <tr>
                <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                  {t("budget.date")}
                </th>
                <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                  {t("budget.quantity")}
                </th>
                <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                  {t("budget.unit_price")}
                </th>
                <th className="py-3 px-4 text-sm font-semibold tracking-wide text-left">
                  {t("budget.total_price")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-4 px-4 text-center text-text opacity-70 italic"
                  >
                    {t("budget.no_items_available")}
                  </td>
                </tr>
              ) : (
                items.map((item, i) => (
                  <tr key={i} className="border-b bg-bg hover:bg-secondary">
                    <td className="py-3 px-4 text-sm">
                      {item.addedAt?.split("T")[0] || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {item.quantity || "-"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {item.unitPrice || "-"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {item.totalPrice || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default BudgetDetails;
