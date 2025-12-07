import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { DollarSign, FileText, Settings } from "lucide-react";
import Salary from "./Salary";
import PayrollAutomation from "../payroll/PayrollAutomation";

const SalaryManagement = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("salaries"); // salaries, automation

  // Set active tab based on URL
  useEffect(() => {
    if (location.pathname.includes("payroll/automation")) {
      setActiveTab("automation");
    } else {
      setActiveTab("salaries");
    }
  }, [location.pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "automation") {
      navigate("/dashboard/payroll/automation");
    } else {
      navigate("/dashboard/salary");
    }
  };

  const tabs = [
    { id: "salaries", label: t("finance.salaryManagement.tabs.salaries"), icon: FileText },
    { id: "automation", label: t("finance.salaryManagement.tabs.automation"), icon: Settings },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header with Tabs */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
                <DollarSign size={28} color="white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                  {t("finance.salaryManagement.title")}
                </h1>
                <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                  {t("finance.salaryManagement.subtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                    isActive ? "shadow-md scale-105" : "hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor: isActive ? "var(--color-primary)" : "var(--border-color)",
                    color: isActive ? "var(--button-text)" : "var(--text-color)",
                  }}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "salaries" && <Salary />}
          {activeTab === "automation" && <PayrollAutomation />}
        </motion.div>
      </div>
    </div>
  );
};

export default SalaryManagement;

