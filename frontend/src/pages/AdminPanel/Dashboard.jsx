import Sidebar from "./layouts/Sidebar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie, Doughnut, Radar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend
);

const data = {
  labels: ["January", "February", "March", "April", "May"],
  datasets: [
    {
      label: "Sales",
      data: [12, 19, 3, 5, 2],
      backgroundColor: [
        "rgba(255, 99, 132, 0.2)",
        "rgba(54, 162, 235, 0.2)",
        "rgba(255, 206, 86, 0.2)",
        "rgba(75, 192, 192, 0.2)",
        "rgba(153, 102, 255, 0.2)",
      ],
      borderColor: [
        "rgba(255, 99, 132, 1)",
        "rgba(54, 162, 235, 1)",
        "rgba(255, 206, 86, 1)",
        "rgba(75, 192, 192, 1)",
        "rgba(153, 102, 255, 1)",
      ],
      borderWidth: 1,
    },
  ],
};

const radarData = {
  labels: ["Quality", "Efficiency", "Reliability", "Innovation", "Support"],
  datasets: [
    {
      label: "Performance",
      data: [65, 59, 80, 81, 56],
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      borderColor: "rgba(75, 192, 192, 1)",
      borderWidth: 1,
    },
  ],
};

const Dashboard = () => {
  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-base-100 text-neutral">
        {/* Header */}
        <div className="p-4 shadow bg-white sticky top-0 z-10">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-info">Overview of system performance</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">New Users</div>
                <div className="stat-value text-primary">4,230</div>
                <div className="stat-desc">↗︎ 50 (2%) this week</div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Sales</div>
                <div className="stat-value text-success">$89,400</div>
                <div className="stat-desc">↗︎ 300 (3%) this month</div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Projects</div>
                <div className="stat-value text-accent">78</div>
                <div className="stat-desc">↗︎ 5 this month</div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Issues</div>
                <div className="stat-value text-error">12</div>
                <div className="stat-desc">↘︎ 3 solved today</div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">Performance Charts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-white shadow-lg rounded-lg">
                <Bar data={data} />
              </div>
              <div className="p-4 bg-white shadow-lg rounded-lg">
                <Line data={data} />
              </div>
              <div className="p-4 bg-white shadow-lg rounded-lg">
                <Pie data={data} />
              </div>
              <div className="p-4 bg-white shadow-lg rounded-lg">
                <Doughnut data={data} />
              </div>
              <div className="p-4 bg-white shadow-lg rounded-lg">
                <Radar data={radarData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
