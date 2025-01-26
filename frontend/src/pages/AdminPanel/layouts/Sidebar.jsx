import {
  FiHome,
  FiSettings,
  FiUsers,
  FiBarChart2,
  FiBell,
  FiMessageCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const menuItems = [
  { name: "Dashboard", icon: <FiHome />, path: "/Dashboard" },
  { name: "Products", icon: <FiBarChart2 />, path: "/Dashboard/Products" },
  { name: "Add Products", icon: <FiUsers />, path: "/Dashboard/add-product" },
  { name: "Supplier", icon: <FiSettings />, path: "/Dashboard/Supplier" },
  { name: "Add Supplier", icon: <FiBell />, path: "/Dashboard/add-supplier" },
  { name: "Finance", icon: <FiBell />, path: "/Dashboard/Finance" },
  {
    name: "Add Finance",
    icon: <FiBell />,
    path: "/Dashboard/add-finance-record",
  },
  { name: "Procurement", icon: <FiBell />, path: "/Dashboard/Procurement" },
  {
    name: "Add Procurement",
    icon: <FiBell />,
    path: "/Dashboard/add-Procurement-record",
  },
  {
    name: "employees",
    icon: <FiMessageCircle />,
    path: "/dashboard/employees",
  },
  {
    name: "New employee",
    icon: <FiMessageCircle />,
    path: "/dashboard/Signup",
  },
];

function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-gray-200 h-screen shadow-lg flex flex-col">
      {/* כותרת עליונה */}
      <div className="p-4 text-2xl font-bold border-b border-gray-700">
        Admin Panel
      </div>

      {/* רשימת תפריטים */}
      <ul className="space-y-4 mt-6 flex-grow">
        {menuItems.map((item, index) => (
          <li key={index} className="rounded-md">
            <Link
              to={item.path}
              className="flex items-center gap-4 p-4 cursor-pointer rounded-md transition-all duration-300 hover:bg-gray-800 hover:text-blue-400"
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
