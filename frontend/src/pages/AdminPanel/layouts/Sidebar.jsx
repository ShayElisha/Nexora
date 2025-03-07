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
  const { t, i18n } = useTranslation(); // Access i18n for language direction

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

  // Determine if the language is RTL
  const isRTL = ["he", "ar"].includes(i18n.language);

  return (
    <div
      className={`hidden md:block w-48 md:w-56 lg:w-64 bg-primary text-white h-screen shadow-lg flex flex-col fixed top-16 ${
        isRTL ? "right-0" : "left-0"
      }`}
    >
      {/* Header */}
      <div className="p-2 md:p-3 lg:p-4 text-lg md:text-xl lg:text-2xl font-bold border-b border-secondary">
        {t("sidebar.adminPanel")}
      </div>

      {/* Menu List */}
      <ul className="space-y-1 md:space-y-2 lg:space-y-4 mt-2 md:mt-4 lg:mt-6 flex-grow overflow-y-auto">
        {menuItems.map((item, index) => (
          <li key={index} className="rounded-md">
            <Link
              to={item.path}
              className="flex items-center gap-2 md:gap-3 lg:gap-4 p-2 md:p-3 lg:p-4 cursor-pointer rounded-md transition-all duration-300 hover:bg-secondary hover:text-accent text-xs md:text-sm lg:text-base"
            >
              <span className="text-base md:text-lg lg:text-xl">
                {item.icon}
              </span>
              <span className="truncate">
                {t(`sidebar.menu.${item.nameKey}`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
