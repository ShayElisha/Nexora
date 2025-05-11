
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import vacationRules from "./vacation.json";
import toast from "react-hot-toast";

const countryMapping = {
  ישראל: "Israel",
  "ארצות הברית": "USA",
  בריטניה: "United Kingdom",
};

const normalizeCountry = (country) => {
  const normalized = countryMapping[country] || country || "Custom";
  console.log(`Normalizing country: ${country} -> ${normalized}`);
  return normalized;
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axiosInstance.get("/employees");
        setEmployees(response.data.data);
        console.log("Fetched employees:", response.data.data);
      } catch (err) {
        setError(t("vacation.errorFetchingEmployees"));
        toast.error(t("vacation.errorFetchingEmployees"));
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, [t]);

  const calculateSeniority = (createdAt) => {
    if (!createdAt) {
      console.warn("createdAt is undefined, returning 0 seniority");
      return 0;
    }
    const startDate = new Date(createdAt);
    const currentDate = new Date();
    const years = currentDate.getFullYear() - startDate.getFullYear();
    const months = currentDate.getMonth() - startDate.getMonth();
    return years + (months >= 0 ? 0 : -1);
  };

  const calculateJobPercentage = (expectedHours) => {
    const percentage = expectedHours
      ? Number(((expectedHours / 40) * 100).toFixed(2))
      : 100;
    console.log(
      `Calculating job percentage: expectedHours=${expectedHours}, percentage=${percentage}`
    );
    return percentage;
  };

  const calculateAnnualVacationDays = (employee) => {
    if (!employee || !employee.address) {
      console.error("Employee or employee.address is undefined:", employee);
      return 0;
    }

    const country = normalizeCountry(employee.address.country);
    const rules =
      vacationRules.countries[country] || vacationRules.countries["Custom"];

    if (!rules) {
      console.error(`No rules found for country: ${country}`);
      return 0;
    }

    console.log(`Rules for ${country}:`, rules);

    let annualDays = rules.baseDays || 0;

    const seniority = calculateSeniority(employee.createdAt);

    for (const rule of rules.seniorityRules || []) {
      if (rule.years && seniority >= rule.years) {
        if (rule.ageBased) {
          annualDays = rule.days || annualDays;
        } else {
          annualDays = rule.days || annualDays;
        }
      }
      if (rule.increment && seniority >= rule.years) {
        const extraYears = seniority - rule.years + 1;
        annualDays = Math.min(
          annualDays + extraYears * rule.increment,
          rule.maxDays || Infinity
        );
      }
    }

    console.log(
      `Calculated annual vacation days for ${employee.name}: ${annualDays}`
    );
    return Number(annualDays.toFixed(2));
  };

  const calculateMonthlyVacationDays = (employee) => {
    const annualDays = calculateAnnualVacationDays(employee);
    const jobPercentage = calculateJobPercentage(employee.expectedHours);
    const monthlyDays = (annualDays / 12) * (jobPercentage / 100);
    console.log(
      `Calculated monthly vacation days for ${employee.name}: ${monthlyDays}`
    );
    return Number(monthlyDays.toFixed(2));
  };

  const addVacationDays = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedEmployeeId) {
      setError(t("vacation.selectEmployee"));
      toast.error(t("vacation.selectEmployee"));
      return;
    }

    const employee = employees.find((emp) => emp._id === selectedEmployeeId);
    if (!employee) {
      setError(t("vacation.employeeNotFound"));
      toast.error(t("vacation.employeeNotFound"));
      return;
    }

    const normalizedCountry = normalizeCountry(employee.address?.country);
    if (normalizedCountry === "Custom" && customRules.baseDays <= 0) {
      setError(t("vacation.invalidCustomRules"));
      toast.error(t("vacation.invalidCustomRules"));
      return;
    }

    const monthlyDays = calculateMonthlyVacationDays(employee);
    const newBalance = Number(
      (employee.vacationBalance + monthlyDays).toFixed(2)
    );

    try {
      const response = await axiosInstance.put(
        `/employees/${selectedEmployeeId}/vacation`,
        {
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
        }
      );

      setEmployees(
        employees.map((emp) =>
          emp._id === selectedEmployeeId ? response.data.data : emp
        )
      );
      setSuccess(t("vacation.vacationAddedSuccess"));
      toast.success(t("vacation.vacationAddedSuccess"));
    } catch (err) {
      setError(t("vacation.errorUpdatingVacation"));
      toast.error(t("vacation.errorUpdatingVacation"));
      console.error("Error updating vacation:", err);
    }
  };

  const handleCustomRulesChange = (e, field) => {
    setCustomRules({ ...customRules, [field]: Number(e.target.value) });
  };

  const addCustomSeniorityRule = () => {
    setCustomRules({
      ...customRules,
      seniorityRules: [
        ...customRules.seniorityRules,
        { years: 1, days: 0, increment: 0, maxDays: 0 },
      ],
    });
    toast(t("vacation.seniorityRuleAdded"));
  };

  const updateCustomSeniorityRule = (index, field, value) => {
    const updatedRules = [...customRules.seniorityRules];
    updatedRules[index] = { ...updatedRules[index], [field]: Number(value) };
    setCustomRules({ ...customRules, seniorityRules: updatedRules });
  };

  const selectedEmployee = employees.find(
    (emp) => emp._id === selectedEmployeeId
  );

  return (
    <div className="max-w-4xl mx-auto p-6" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {t("vacation.globalVacationCalculator")}
      </h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">{t("vacation.employeeDetails")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("vacation.employee")}
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="border p-2 rounded w-full"
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
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("vacation.country")}
            </label>
            <select
              value={normalizeCountry(
                selectedEmployee?.address?.country || "Israel"
              )}
              disabled
              className="border p-2 rounded w-full bg-gray-100"
            >
              {Object.keys(vacationRules.countries).map((country) => (
                <option key={country} value={country}>
                  {t(`vacation.countries.${country}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("vacation.month")}
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border p-2 rounded w-full"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {t(`vacation.months.${i + 1}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t("vacation.year")}
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>

        {normalizeCountry(selectedEmployee?.address?.country) === "Custom" && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">{t("vacation.customVacationRules")}</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {t("vacation.baseVacationDays")}
                </label>
                <input
                  type="number"
                  value={customRules.baseDays}
                  onChange={(e) => handleCustomRulesChange(e, "baseDays")}
                  className="border p-2 rounded w-full"
                  min="0"
                />
              </div>
            </div>
            <h4 className="text-md font-semibold mt-4 mb-2">{t("vacation.seniorityRules")}</h4>
            {customRules.seniorityRules.map((rule, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2"
              >
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("vacation.years")}
                  </label>
                  <input
                    type="number"
                    value={rule.years}
                    onChange={(e) =>
                      updateCustomSeniorityRule(index, "years", e.target.value)
                    }
                    className="border p-2 rounded w-full"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("vacation.days")}
                  </label>
                  <input
                    type="number"
                    value={rule.days}
                    onChange={(e) =>
                      updateCustomSeniorityRule(index, "days", e.target.value)
                    }
                    className="border p-2 rounded w-full"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("vacation.increment")}
                  </label>
                  <input
                    type="number"
                    value={rule.increment}
                    onChange={(e) =>
                      updateCustomSeniorityRule(
                        index,
                        "increment",
                        e.target.value
                      )
                    }
                    className="border p-2 rounded w-full"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("vacation.maxDays")}
                  </label>
                  <input
                    type="number"
                    value={rule.maxDays}
                    onChange={(e) =>
                      updateCustomSeniorityRule(
                        index,
                        "maxDays",
                        e.target.value
                      )
                    }
                    className="border p-2 rounded w-full"
                    min="0"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addCustomSeniorityRule}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-2"
            >
              {t("vacation.addSeniorityRule")}
            </button>
          </div>
        )}

        <button
          onClick={addVacationDays}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
          disabled={!selectedEmployeeId}
        >
          {t("vacation.addVacationDays")}
        </button>
      </div>

      {selectedEmployee && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">{t("vacation.vacationBalance")}</h3>
          <p>
            {t("vacation.currentBalance")}: <strong>{selectedEmployee.vacationBalance}</strong>{" "}
            {t("vacation.days")}
          </p>
        </div>
      )}

      {selectedEmployee?.vacationHistory?.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{t("vacation.accrualHistory")}</h3>
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                <th className="py-3 px-6 text-right">{t("vacation.monthYear")}</th>
                <th className="py-3 px-6 text-right">{t("vacation.country")}</th>
                <th className="py-3 px-6 text-right">{t("vacation.daysAdded")}</th>
                <th className="py-3 px-6 text-right">{t("vacation.newBalance")}</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {selectedEmployee.vacationHistory.map((entry, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-6 text-right">{entry.month}</td>
                  <td className="py-3 px-6 text-right">{t(`vacation.countries.${entry.country}`)}</td>
                  <td className="py-3 px-6 text-right">{entry.daysAdded}</td>
                  <td className="py-3 px-6 text-right">{entry.newBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GlobalVacationCalculator;