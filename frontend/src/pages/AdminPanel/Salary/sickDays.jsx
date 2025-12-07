import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../../lib/axios";
import toast from "react-hot-toast";
import {
  Heart,
  Plus,
  Globe,
  TrendingUp,
  Calendar,
  DollarSign,
  Info,
  AlertCircle,
} from "lucide-react";

const SickDays = () => {
  const { t } = useTranslation();
  const [policies, setPolicies] = useState([]);
  const [country, setCountry] = useState("");
  const [accrualRate, setAccrualRate] = useState("");
  const [maxAccrual, setMaxAccrual] = useState("");
  const [carryOver, setCarryOver] = useState("");
  const [waitingPeriod, setWaitingPeriod] = useState("");
  const [paidPercentage, setPaidPercentage] = useState("");

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await axiosInstance.get("/sickDays");
        setPolicies(response.data.data);
      } catch (err) {
        toast.error(t("sickDays.errorFetching"));
      }
    };
    fetchPolicies();
  }, [t]);

  const addPolicy = async () => {
    if (!country || !accrualRate || !maxAccrual || !carryOver || !waitingPeriod || !paidPercentage) {
      toast.error(t("sickDays.allFieldsRequired"));
      return;
    }

    try {
      const response = await axiosInstance.post("/sickDays", {
        country,
        accrual_rate: accrualRate,
        max_accrual: maxAccrual,
        carry_over: carryOver,
        waiting_period: waitingPeriod,
        paid_percentage: paidPercentage,
      });
      setPolicies([...policies, response.data.data]);
      setCountry("");
      setAccrualRate("");
      setMaxAccrual("");
      setCarryOver("");
      setWaitingPeriod("");
      setPaidPercentage("");
      toast.success(t("sickDays.policyAdded"));
    } catch (err) {
      toast.error(t("sickDays.errorAdding"));
    }
  };

  const Tooltip = ({ text }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
      <div className="relative inline-block">
        <Info
          size={20}
          className="cursor-pointer"
          style={{ color: 'var(--color-primary)' }}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        />
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute left-8 top-0 rounded-xl shadow-2xl p-4 w-64 z-50 border"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-color)' }}>{text}</p>
          </motion.div>
        )}
      </div>
    );
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-pink-600">
              <Heart size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("sickDays.title")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("sickDays.managePolicies")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Add Policy Form */}
        <motion.div
          className="rounded-2xl shadow-lg p-6 lg:p-8 border mb-8"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>
            {t("sickDays.addNewPolicy")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <Globe size={18} />
                  {t("sickDays.country")}
                </label>
                <Tooltip text={t("sickDays.tooltips.country")} />
              </div>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                placeholder={t("sickDays.placeholders.country")}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <TrendingUp size={18} />
                  {t("sickDays.accrualRate")}
                </label>
                <Tooltip text={t("sickDays.tooltips.accrualRate")} />
              </div>
              <input
                type="text"
                value={accrualRate}
                onChange={(e) => setAccrualRate(e.target.value)}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                placeholder={t("sickDays.placeholders.accrualRate")}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                  {t("sickDays.maxAccrual")}
                </label>
                <Tooltip text={t("sickDays.tooltips.maxAccrual")} />
              </div>
              <input
                type="text"
                value={maxAccrual}
                onChange={(e) => setMaxAccrual(e.target.value)}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                placeholder={t("sickDays.placeholders.maxAccrual")}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <Calendar size={18} />
                  {t("sickDays.carryOver")}
                </label>
                <Tooltip text={t("sickDays.tooltips.carryOver")} />
              </div>
              <input
                type="text"
                value={carryOver}
                onChange={(e) => setCarryOver(e.target.value)}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                placeholder={t("sickDays.placeholders.carryOver")}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                  {t("sickDays.waitingPeriod")}
                </label>
                <Tooltip text={t("sickDays.tooltips.waitingPeriod")} />
              </div>
              <input
                type="text"
                value={waitingPeriod}
                onChange={(e) => setWaitingPeriod(e.target.value)}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                placeholder={t("sickDays.placeholders.waitingPeriod")}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <DollarSign size={18} />
                  {t("sickDays.paidPercentage")}
                </label>
                <Tooltip text={t("sickDays.tooltips.paidPercentage")} />
              </div>
              <input
                type="text"
                value={paidPercentage}
                onChange={(e) => setPaidPercentage(e.target.value)}
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                placeholder={t("sickDays.placeholders.paidPercentage")}
              />
            </div>
          </div>

          <button
            onClick={addPolicy}
            className="mt-6 w-full md:w-auto py-4 px-8 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
          >
            <Plus size={24} />
            {t("sickDays.addPolicy")}
          </button>
        </motion.div>

        {/* Policies List */}
        <motion.div
          className="rounded-2xl shadow-lg p-6 border"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>
            {t("sickDays.existingPolicies")}
          </h2>
          {policies.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--color-secondary)' }} />
              <p className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                {t("sickDays.noPolicies")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--border-color)' }}>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("sickDays.country")}
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("sickDays.accrualRate")}
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("sickDays.maxAccrual")}
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("sickDays.carryOver")}
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("sickDays.waitingPeriod")}
                    </th>
                    <th className="py-3 px-6 text-right text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {t("sickDays.paidPercentage")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy, index) => (
                    <motion.tr
                      key={policy._id || index}
                      className="border-b hover:bg-opacity-50"
                      style={{ borderColor: 'var(--border-color)' }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="py-3 px-6 text-right font-bold" style={{ color: 'var(--text-color)' }}>
                        {policy.country}
                      </td>
                      <td className="py-3 px-6 text-right" style={{ color: 'var(--color-secondary)' }}>
                        {policy.accrual_rate}
                      </td>
                      <td className="py-3 px-6 text-right" style={{ color: 'var(--color-secondary)' }}>
                        {policy.max_accrual}
                      </td>
                      <td className="py-3 px-6 text-right" style={{ color: 'var(--color-secondary)' }}>
                        {policy.carry_over}
                      </td>
                      <td className="py-3 px-6 text-right" style={{ color: 'var(--color-secondary)' }}>
                        {policy.waiting_period}
                      </td>
                      <td className="py-3 px-6 text-right" style={{ color: 'var(--color-secondary)' }}>
                        {policy.paid_percentage}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SickDays;
