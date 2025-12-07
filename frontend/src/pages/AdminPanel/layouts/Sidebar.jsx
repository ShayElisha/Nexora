import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  FiChevronRight,
  FiTarget,
  FiShield,
  FiBarChart,
  FiMapPin,
} from "react-icons/fi";

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
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
        {
          to: "/dashboard/inventory",
          text: t("navbar.inventory_management"),
          icon: <FiGrid />,
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
      label: t("navbar.warehouses", { defaultValue: "Warehouses" }),
      icon: <FiMapPin />,
      subMenu: [
        {
          to: "/dashboard/warehouses",
          text: t("navbar.warehouse_management", { defaultValue: "Warehouse Management" }),
          icon: <FiMapPin />,
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
          to: "/dashboard/finance/cash-flow",
          text: t("navbar.cash_flow"),
          icon: <FiGrid />,
        },
        {
          to: "/dashboard/add-finance-record",
          text: t("navbar.create_finance_record"),
          icon: <FiPlusCircle />,
        },
        {
          to: "/dashboard/payroll/automation",
          text: "אוטומציה של משכורות",
          icon: <FiDollarSign />,
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
        {
          to: "/dashboard/projects/gantt",
          text: t("navbar.Project_Gantt", { defaultValue: "Gantt Chart" }),
          icon: <FiCalendar />,
        },
        {
          to: "/dashboard/projects/timeline",
          text: t("navbar.Project_Timeline", { defaultValue: "Timeline" }),
          icon: <FiCalendar />,
        },
        {
          to: "/dashboard/projects/resources",
          text: t("navbar.Project_Resources", { defaultValue: "Resources" }),
          icon: <FiUsers />,
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
          to: "/dashboard/employees/directory",
          text: "ספריית עובדים",
          icon: <FiGrid />,
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
      label: t("navbar.customers") || "לקוחות",
      icon: <FiUsers />,
      subMenu: [
        {
          to: "/dashboard/Customers",
          text: t("navbar.customer_list") || "רשימת לקוחות",
          icon: <FiUsers />,
        },
        {
          to: "/dashboard/leads",
          text: t("navbar.leads_management") || "ניהול לידים",
          icon: <FiTarget />,
        },
        {
          to: "/dashboard/activities",
          text: t("navbar.activities") || "פעילויות",
          icon: <FiCalendar />,
        },
        {
          to: "/dashboard/leads/analytics",
          text: t("navbar.leads_analytics") || "אנליטיקת לידים",
          icon: <FiBarChart />,
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

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const renderSubMenu = (subMenu, level = 1, isScrollable = false) => (
    <ul
      className={`space-y-1 ${level > 1 ? (isRTL ? "pr-4" : "pl-4") : ""} ${
        isScrollable ? "max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-primary" : ""
      }`}
    >
      {subMenu.map((item, idx) => (
        <li key={idx}>
          {item.to ? (
            <Link
              to={item.to}
              className={`flex items-center gap-3 p-2.5 rounded-lg text-sm transition-all duration-300 group ${
                isActiveLink(item.to)
                  ? "bg-gradient-to-r from-secondary to-accent text-white shadow-md scale-105"
                  : "text-white/90 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
            >
              <span className={`text-base transition-transform duration-300 ${
                isActiveLink(item.to) ? "scale-110" : "group-hover:scale-110"
              }`}>
                {item.icon}
              </span>
              <span className="truncate font-medium">{item.text}</span>
              {isActiveLink(item.to) && (
                <div className={`${isRTL ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 bg-white rounded-full animate-pulse`}></div>
              )}
            </Link>
          ) : (
            <div>
              <button
                onClick={() => toggleMenu(item.label)}
                className="flex items-center justify-between w-full p-2.5 rounded-lg text-sm text-white/90 hover:bg-white/10 hover:text-white transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="truncate font-medium">{item.label}</span>
                </div>
                <FiChevronDown
                  className={`text-base transition-transform duration-300 ${
                    openMenus[item.label] ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openMenus[item.label] && (
                <div className={`mt-1.5 ${isRTL ? "pr-3" : "pl-3"} animate-slideDown`}>
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
      className={`hidden md:block w-64 lg:w-72 bg-gradient-to-b from-primary via-primary to-primary/95
        h-[calc(100vh-4rem)] overflow-hidden text-white shadow-2xl fixed top-16 ${
          isRTL ? "right-0" : "left-0"
        } z-50 animate-fade-in border-r border-white/10`}
    >
      {/* Header with gradient */}
      <div className="relative p-5 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-accent/20"></div>
        <div className="absolute inset-0 backdrop-blur-sm"></div>
        <div className="relative">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            {t("sidebar.adminPanel")}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-secondary to-accent mx-auto mt-2 rounded-full"></div>
        </div>
      </div>

      {/* Menu List with custom scrollbar */}
      <div className="flex-grow overflow-y-auto p-4 h-[calc(100vh-12rem)] custom-scrollbar">
        <ul className="space-y-1.5">
          {adminLinks.map((link, index) => (
            <li key={index} className="group">
              {link.to ? (
                <Link
                  to={link.to}
                  className={`flex items-center gap-3 p-3 rounded-xl text-base font-medium transition-all duration-300 ${
                    isActiveLink(link.to)
                      ? "bg-gradient-to-r from-secondary to-accent text-white shadow-lg scale-105 translate-x-1"
                      : "text-white/90 hover:bg-white/10 hover:text-white hover:shadow-md hover:scale-102"
                  }`}
                >
                  <span className={`text-xl transition-all duration-300 ${
                    isActiveLink(link.to) ? "scale-110 drop-shadow-md" : "group-hover:scale-110"
                  }`}>
                    {link.icon}
                  </span>
                  <span className="truncate">{link.label}</span>
                  {isActiveLink(link.to) && (
                    <div className={`${isRTL ? "mr-auto" : "ml-auto"}`}>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
                    </div>
                  )}
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleMenu(link.label)}
                    className={`flex items-center justify-between w-full p-3 rounded-xl text-base font-medium transition-all duration-300 ${
                      openMenus[link.label]
                        ? "bg-white/10 text-white shadow-md"
                        : "text-white/90 hover:bg-white/10 hover:text-white hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xl transition-transform duration-300 ${
                        openMenus[link.label] ? "scale-110" : ""
                      }`}>
                        {link.icon}
                      </span>
                      <span className="truncate">{link.label}</span>
                    </div>
                    <FiChevronDown
                      className={`text-lg transition-transform duration-300 ${
                        openMenus[link.label] ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openMenus[link.label] && (
                    <div className={`mt-2 ${isRTL ? "pr-3" : "pl-3"} animate-slideDown`}>
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

      {/* Custom Animations & Scrollbar */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(${isRTL ? '20px' : '-20px'}); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
        .animate-fade-in { 
          animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; 
        }
        .animate-slideDown { 
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          overflow: hidden;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          transition: all 0.3s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
