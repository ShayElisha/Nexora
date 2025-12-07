import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import vacationRules from "./vacation.json";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Globe,
  Calculator,
  Plus,
  TrendingUp,
  User,
  Clock,
  Award,
  CheckCircle,
} from "lucide-react";

const countryMapping = {
  ישראל: "Israel",
  "ארצות הברית": "USA",
  בריטניה: "United Kingdom",
};

const normalizeCountry = (country) => {
  return countryMapping[country] || country || "Custom";
};

const GlobalVacationCalculator = () => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [customRules, setCustomRules] = useState({
    baseDays: 0,
    seniorityRules: [],
  });
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axiosInstance.get("/employees");
        setEmployees(response.data.data);
      } catch (err) {
        toast.error(t("vacation.errorFetchingEmployees"));
      }
    };
    fetchEmployees();
  }, [t]);

  const calculateSeniority = (createdAt) => {
    if (!createdAt) return 0;
    const startDate = new Date(createdAt);
    const currentDate = new Date();
    const years = currentDate.getFullYear() - startDate.getFullYear();
    const months = currentDate.getMonth() - startDate.getMonth();
    return years + (months >= 0 ? 0 : -1);
  };

  const calculateJobPercentage = (expectedHours) => {
    return expectedHours ? Number(((expectedHours / 40) * 100).toFixed(2)) : 100;
  };

  const calculateAnnualVacationDays = (employee) => {
    if (!employee || !employee.address) return 0;
    const country = normalizeCountry(employee.address.country);
    const rules = vacationRules.countries[country] || vacationRules.countries["Custom"];
    if (!rules) return 0;

    let annualDays = rules.baseDays || 0;
    const seniority = calculateSeniority(employee.createdAt);

    for (const rule of rules.seniorityRules || []) {
      if (rule.years && seniority >= rule.years) {
        annualDays = rule.days || annualDays;
      }
      if (rule.increment && seniority >= rule.years) {
        const extraYears = seniority - rule.years + 1;
        annualDays = Math.min(annualDays + extraYears * rule.increment, rule.maxDays || Infinity);
      }
    }

    return Number(annualDays.toFixed(2));
  };

  const calculateMonthlyVacationDays = (employee) => {
    const annualDays = calculateAnnualVacationDays(employee);
    const jobPercentage = calculateJobPercentage(employee.expectedHours);
    const monthlyDays = (annualDays / 12) * (jobPercentage / 100);
    return Number(monthlyDays.toFixed(2));
  };

  const addVacationDays = async (e) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      toast.error(t("vacation.selectEmployee"));
      return;
    }

    const employee = employees.find((emp) => emp._id === selectedEmployeeId);
    if (!employee) {
      toast.error(t("vacation.employeeNotFound"));
      return;
    }

    const normalizedCountry = normalizeCountry(employee.address?.country);
    if (normalizedCountry === "Custom" && customRules.baseDays <= 0) {
      toast.error(t("vacation.invalidCustomRules"));
      return;
    }

    const monthlyDays = calculateMonthlyVacationDays(employee);
    const newBalance = Number((employee.vacationBalance + monthlyDays).toFixed(2));

    try {
      const response = await axiosInstance.put(`/employees/${selectedEmployeeId}/vacation`, {
        vacationBalance: newBalance,
        vacationHistory: [
          ...(employee.vacationHistory || []),
          {
            month: `${month}/${year}`,
            daysAdded: monthlyDays,
            newBalance,
            country: normalizedCountry,
          },
        ],
      });

      setEmployees(employees.map((emp) => (emp._id === selectedEmployeeId ? response.data.data : emp)));
      toast.success(t("vacation.vacationAddedSuccess"));
    } catch (err) {
      toast.error(t("vacation.errorUpdatingVacation"));
    }
  };

  const handleCustomRulesChange = (e, field) => {
    setCustomRules({ ...customRules, [field]: Number(e.target.value) });
  };

  const addCustomSeniorityRule = () => {
    setCustomRules({
      ...customRules,
      seniorityRules: [...customRules.seniorityRules, { years: 1, days: 0, increment: 0, maxDays: 0 }],
    });
    toast(t("vacation.seniorityRuleAdded"));
  };

  const updateCustomSeniorityRule = (index, field, value) => {
    const updatedRules = [...customRules.seniorityRules];
    updatedRules[index] = { ...updatedRules[index], [field]: Number(value) };
    setCustomRules({ ...customRules, seniorityRules: updatedRules });
  };

  const selectedEmployee = employees.find((emp) => emp._id === selectedEmployeeId);

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-teal-500 to-cyan-600">
              <CalendarDays size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("vacation.globalVacationCalculator")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("vacation.calculateAndManage")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Form */}
        <motion.div
          className="rounded-2xl shadow-lg p-6 lg:p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
            <User size={24} />
            {t("vacation.employeeDetails")}
          </h3>
          <form onSubmit={addVacationDays} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <User className="inline mr-2" size={16} />
                  {t("vacation.employee")}
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                >
                  <option value="">{t("vacation.selectEmployee")}</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {`${emp.name} ${emp.lastName}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Globe className="inline mr-2" size={16} />
                  {t("vacation.country")}
                </label>
                <select
                  value={normalizeCountry(selectedEmployee?.address?.country || "Israel")}
                  disabled
                  className="w-full p-3 border rounded-xl opacity-60"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                >
                  {Object.keys(vacationRules.countries).map((country) => (
                    <option key={country} value={country}>
                      {t(`vacation.countries.${country}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  <Clock className="inline mr-2" size={16} />
                  {t("vacation.month")}
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {t(`vacation.months.${i + 1}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {t("vacation.year")}
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                />
              </div>
            </div>

            {normalizeCountry(selectedEmployee?.address?.country) === "Custom" && (
              <motion.div
                className="p-6 rounded-xl border mt-6"
                style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-color)' }}>
                  {t("vacation.customVacationRules")}
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                    {t("vacation.baseVacationDays")}
                  </label>
                  <input
                    type="number"
                    value={customRules.baseDays}
                    onChange={(e) => handleCustomRulesChange(e, "baseDays")}
                    className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                    min="0"
                  />
                </div>

                <h4 className="text-md font-semibold mb-3" style={{ color: 'var(--text-color)' }}>
                  {t("vacation.seniorityRules")}
                </h4>
                {customRules.seniorityRules.map((rule, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 mb-3">
                    <input
                      type="number"
                      value={rule.years}
                      onChange={(e) => updateCustomSeniorityRule(index, "years", e.target.value)}
                      className="p-3 border rounded-xl"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                      placeholder={t("vacation.years")}
                      min="1"
                    />
                    <input
                      type="number"
                      value={rule.days}
                      onChange={(e) => updateCustomSeniorityRule(index, "days", e.target.value)}
                      className="p-3 border rounded-xl"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                      placeholder={t("vacation.days")}
                      min="0"
                    />
                    <input
                      type="number"
                      value={rule.increment}
                      onChange={(e) => updateCustomSeniorityRule(index, "increment", e.target.value)}
                      className="p-3 border rounded-xl"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                      placeholder={t("vacation.increment")}
                      min="0"
                    />
                    <input
                      type="number"
                      value={rule.maxDays}
                      onChange={(e) => updateCustomSeniorityRule(index, "maxDays", e.target.value)}
                      className="p-3 border rounded-xl"
                      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                      placeholder={t("vacation.maxDays")}
                      min="0"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCustomSeniorityRule}
                  className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2 mt-2"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--button-text)' }}
                >
                  <Plus size={18} />
                  {t("vacation.addSeniorityRule")}
                </button>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={!selectedEmployeeId}
              className="w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              <Calculator size={24} />
              {t("vacation.addVacationDays")}
            </button>
          </form>
        </motion.div>

        {/* Current Balance */}
        {selectedEmployee && (
          <motion.div
            className="rounded-2xl shadow-lg p-6 border mb-8"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            variants={cardVariant}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600">
                <Award size={24} color="white" />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
                  {t("vacation.vacationBalance")}
                </h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {selectedEmployee.vacationBalance} {t("vacation.days")}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* History Table */}
        {selectedEmployee?.vacationHistory?.length > 0 && (
          <motion.div
            className="rounded-2xl shadow-lg p-6 border"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            variants={cardVariant}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
              <TrendingUp size={24} />
              {t("vacation.accrualHistory")}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--border-color)' }}>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("vacation.monthYear")}
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("vacation.country")}
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("vacation.daysAdded")}
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("vacation.newBalance")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEmployee.vacationHistory.map((entry, index) => (
                    <motion.tr
                      key={index}
                      className="border-b hover:bg-opacity-50"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="py-3 px-6 text-right" style={{ color: 'var(--text-color)' }}>
                        {entry.month}
                      </td>
                      <td className="py-3 px-6 text-right" style={{ color: 'var(--color-secondary)' }}>
                        {t(`vacation.countries.${entry.country}`)}
                      </td>
                      <td className="py-3 px-6 text-right font-bold text-blue-600">+{entry.daysAdded}</td>
                      <td className="py-3 px-6 text-right font-bold text-green-600">{entry.newBalance}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GlobalVacationCalculator;
