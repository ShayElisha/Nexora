// src/components/procurement/layouts/Sidebar.jsx
import {
  FiHome,
  FiSettings,
  FiUsers,
  FiBarChart2,
  FiBell,
  FiMessageCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Sidebar = () => {
  const { t } = useTranslation(); // שימוש ב-namespace של "sidebar"

  const menuItems = [
    { nameKey: "dashboard", icon: <FiHome />, path: "/Dashboard" },
    { nameKey: "products", icon: <FiBarChart2 />, path: "/Dashboard/Products" },
    {
      nameKey: "addProducts",
      icon: <FiUsers />,
      path: "/Dashboard/add-product",
    },
    { nameKey: "supplier", icon: <FiSettings />, path: "/Dashboard/Supplier" },
    {
      nameKey: "addSupplier",
      icon: <FiBell />,
      path: "/Dashboard/add-supplier",
    },
    { nameKey: "finance", icon: <FiBell />, path: "/Dashboard/Finance" },
    {
      nameKey: "addFinance",
      icon: <FiBell />,
      path: "/Dashboard/add-finance-record",
    },
    {
      nameKey: "procurement",
      icon: <FiBell />,
      path: "/Dashboard/Procurement",
    },
    {
      nameKey: "addProcurement",
      icon: <FiBell />,
      path: "/Dashboard/add-Procurement-record",
    },
    {
      nameKey: "employees",
      icon: <FiMessageCircle />,
      path: "/dashboard/employees",
    },
    {
      nameKey: "newEmployee",
      icon: <FiMessageCircle />,
      path: "/dashboard/Signup",
    },
  ];

  return (
    <div className="w-64 bg-primary text-white h-full-screen shadow-lg flex flex-col">
      {/* כותרת עליונה */}
      <div className="p-4 text-2xl font-bold border-b border-secondary">
        {t("sidebar.adminPanel")}
      </div>

      {/* רשימת תפריטים */}
      <ul className="space-y-4 mt-6 flex-grow">
        {menuItems.map((item, index) => (
          <li key={index} className="rounded-md">
            <Link
              to={item.path}
              className="flex items-center gap-4 p-4 cursor-pointer rounded-md transition-all duration-300 hover:bg-secondary hover:text-accent"
            >
              <span className="text-xl">{item.icon}</span>
              <span>{t(`sidebar.menu.${item.nameKey}`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
