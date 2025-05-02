import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiHome,
  FiPackage,
  FiPlusCircle,
  FiTruck,
  FiDollarSign,
  FiFileText,
  FiBriefcase,
  FiUsers,
  FiPenTool,
  FiGrid,
  FiCheckSquare,
  FiShoppingCart,
  FiCalendar,
  FiChevronDown,
} from "react-icons/fi";

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const adminLinks = [
    { label: t("navbar.dashboard"), to: "/dashboard", icon: <FiHome /> },
    {
      label: t("navbar.products"),
      icon: <FiPackage />,
      subMenu: [
        {
          to: "/dashboard/products",
          text: t("navbar.all_products"),
          icon: <FiPackage />,
        },
        {
          to: "/dashboard/add-product",
          text: t("navbar.add_product"),
          icon: <FiPlusCircle />,
        },
      ],
    },
    {
      label: t("navbar.supplier"),
      icon: <FiTruck />,
      subMenu: [
        {
          to: "/dashboard/supplier",
          text: t("navbar.all_suppliers"),
          icon: <FiTruck />,
        },
        {
          to: "/dashboard/add-supplier",
          text: t("navbar.add_supplier"),
          icon: <FiPlusCircle />,
        },
      ],
    },
    {
      label: t("navbar.finance"),
      icon: <FiDollarSign />,
      subMenu: [
        {
          to: "/dashboard/finance",
          text: t("navbar.finance_records"),
          icon: <FiDollarSign />,
        },
        {
          to: "/dashboard/add-finance-record",
          text: t("navbar.create_finance_record"),
          icon: <FiPlusCircle />,
        },
        {
          label: t("navbar.budget"),
          icon: <FiFileText />,
          subMenu: [
            {
              to: "/dashboard/finance/budgets",
              text: t("navbar.budget_records"),
              icon: <FiFileText />,
            },
            {
              to: "/dashboard/finance/add-budget",
              text: t("navbar.create_budget_record"),
              icon: <FiPlusCircle />,
            },
            // ניתן להוסיף עוד פריטים לבדיקת הגלילה
          ],
        },
      ],
    },
    {
      label: t("navbar.procurement"),
      icon: <FiBriefcase />,
      subMenu: [
        {
          to: "/dashboard/procurement",
          text: t("navbar.procurement"),
          icon: <FiBriefcase />,
        },
        {
          to: "/dashboard/add-procurement-record",
          text: t("navbar.create_procurement_record"),
          icon: <FiPlusCircle />,
        },
        {
          to: "/dashboard/procurement/approveProcurment",
          text: "Receipt Purchase",
          icon: <FiCheckSquare />,
        },
        {
          label: t("navbar.ProcurementProposals"),
          icon: <FiFileText />,
          subMenu: [
            {
              to: "/dashboard/ProcurementProposals",
              text: t("navbar.ProcurementProposals"),
              icon: <FiFileText />,
            },
            {
              to: "/dashboard/ProcurementProposalsList",
              text: t("navbar.ProcurementProposalsList"),
              icon: <FiGrid />,
            },
            // ניתן להוסיף עוד פריטים לבדיקת הגלילה
          ],
        },
      ],
    },
    {
      label: t("navbar.Projects"),
      icon: <FiGrid />,
      subMenu: [
        {
          to: "/dashboard/projects",
          text: t("navbar.Projects_List"),
          icon: <FiGrid />,
        },
        {
          to: "/dashboard/projects/add-project",
          text: t("navbar.Add_Project"),
          icon: <FiPlusCircle />,
        },
      ],
    },
    {
      label: t("navbar.employees"),
      icon: <FiUsers />,
      subMenu: [
        {
          to: "/dashboard/employees",
          text: t("navbar.all_employees"),
          icon: <FiUsers />,
        },
        {
          to: "/dashboard/signup",
          text: t("navbar.new_employee"),
          icon: <FiPlusCircle />,
        },
      ],
    },
    {
      label: t("navbar.signatures"),
      icon: <FiPenTool />,
      subMenu: [
        {
          to: "/dashboard/historySignature",
          text: t("navbar.my_signature"),
          icon: <FiPenTool />,
        },
        {
          to: "/dashboard/historyAllSignature",
          text: t("navbar.all_signatures"),
          icon: <FiGrid />,
        },
      ],
    },
    {
      label: t("navbar.department"),
      icon: <FiGrid />,
      subMenu: [
        {
          to: "/dashboard/department/Add-Department",
          text: t("navbar.add_department"),
          icon: <FiPlusCircle />,
        },
        {
          to: "/dashboard/department/DepartmentList",
          text: t("navbar.departmentList"),
          icon: <FiGrid />,
        },
      ],
    },
    {
      label: t("navbar.tasks"),
      icon: <FiCheckSquare />,
      subMenu: [
        {
          to: "/dashboard/tasks",
          text: t("navbar.tasks"),
          icon: <FiCheckSquare />,
        },
        {
          to: "/dashboard/tasks/Add-Tasks",
          text: t("navbar.add_tasks"),
          icon: <FiPlusCircle />,
        },
      ],
    },
    {
      label: t("navbar.Orders"),
      icon: <FiShoppingCart />,
      subMenu: [
        {
          to: "/dashboard/Customers/Orders",
          text: t("navbar.Orders List"),
          icon: <FiShoppingCart />,
        },
        {
          to: "/dashboard/Customers/AddOrder",
          text: t("navbar.Add-Orders"),
          icon: <FiPlusCircle />,
        },
      ],
    },
    {
      label: t("navbar.calendar"),
      icon: <FiCalendar />,
      subMenu: [
        {
          to: "/dashboard/Events",
          text: t("navbar.events"),
          icon: <FiCalendar />,
        },
      ],
    },
  ];

  const renderSubMenu = (subMenu, level = 1, isScrollable = false) => (
    <ul
      className={`space-y-1 ${level > 1 ? "pr-4" : ""} ${
        isScrollable ? "max-h-40 overflow-y" : ""
      }`}
    >
      {subMenu.map((item, idx) => (
        <li key={idx}>
          {item.to ? (
            <Link
              to={item.to}
              className="flex items-center gap-3 p-2 rounded-md text-sm text-white hover:bg-secondary transition-all duration-200"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="truncate">{item.text}</span>
            </Link>
          ) : (
            <div>
              <button
                onClick={() => toggleMenu(item.label)}
                className="flex items-center justify-between w-full p-2 rounded-md text-sm text-white hover:bg-secondary transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                <FiChevronDown
                  className={`text-lg transition-transform duration-200 ${
                    openMenus[item.label] ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openMenus[item.label] && (
                <div className="mt-1 pl-4">
                  {renderSubMenu(
                    item.subMenu,
                    level + 1,
                    item.label === t("navbar.budget") ||
                      item.label === t("navbar.ProcurementProposals")
                  )}
                </div>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={`hidden md:block w-56 lg:w-64  bg-primary 
        h-[80vh] overflow-y-auto text-white  shadow-xl fixed top-16 ${
          isRTL ? "right-0" : "left-0"
        } z-50 animate-fade-in`}
    >
      {/* Header */}
      <div className="p-4 text-xl font-bold border-b  border-secondary text-center drop-shadow-md">
        {t("sidebar.adminPanel")}
      </div>

      {/* Menu List */}
      <div className="flex-grow overflow-y-auto p-4">
        <ul className="space-y-2">
          {adminLinks.map((link, index) => (
            <li key={index}>
              {link.to ? (
                <Link
                  to={link.to}
                  className="flex items-center gap-4 p-3 rounded-md text-base font-medium hover:bg-secondary transition-all duration-200"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="truncate">{link.label}</span>
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleMenu(link.label)}
                    className="flex items-center justify-between w-full p-3 rounded-md text-base font-medium hover:bg-secondary transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">{link.icon}</span>
                      <span className="truncate">{link.label}</span>
                    </div>
                    <FiChevronDown
                      className={`text-xl transition-transform duration-200 ${
                        openMenus[link.label] ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openMenus[link.label] && (
                    <div className="mt-1 pl-4">
                      {renderSubMenu(
                        link.subMenu,
                        1,
                        link.label === t("navbar.budget") ||
                          link.label === t("navbar.ProcurementProposals")
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Custom Animations */}
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

export default Sidebar;
