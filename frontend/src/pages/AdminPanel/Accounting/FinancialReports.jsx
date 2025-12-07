import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import axiosInstance from "../../../lib/axios";
import {
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  Building2,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const FinancialReports = () => {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState("trial-balance");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: trialBalance, isLoading: loadingTrial } = useQuery({
    queryKey: ["trial-balance", asOfDate],
    queryFn: async () => {
      const res = await axiosInstance.get("/accounting/reports/trial-balance", {
        params: { asOfDate },
      });
      return res.data.data;
    },
    enabled: reportType === "trial-balance" && !!asOfDate,
  });

  const { data: profitLoss, isLoading: loadingPL } = useQuery({
    queryKey: ["profit-loss", startDate, endDate],
    queryFn: async () => {
      const res = await axiosInstance.get("/accounting/reports/profit-loss", {
        params: { startDate, endDate },
      });
      return res.data.data;
    },
    enabled: reportType === "profit-loss" && !!startDate && !!endDate,
  });

  const { data: balanceSheet, isLoading: loadingBS } = useQuery({
    queryKey: ["balance-sheet", asOfDate],
    queryFn: async () => {
      const res = await axiosInstance.get("/accounting/reports/balance-sheet", {
        params: { asOfDate },
      });
      return res.data.data;
    },
    enabled: reportType === "balance-sheet" && !!asOfDate,
  });

  const { data: cashFlow, isLoading: loadingCF } = useQuery({
    queryKey: ["cash-flow", startDate, endDate],
    queryFn: async () => {
      const res = await axiosInstance.get("/accounting/reports/cash-flow", {
        params: { startDate, endDate },
      });
      return res.data.data;
    },
    enabled: reportType === "cash-flow" && !!startDate && !!endDate,
  });

  const isLoading = loadingTrial || loadingPL || loadingBS || loadingCF;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <BarChart3 size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("accounting.financial_reports")}
              </h1>
              <p className="text-lg" style={{ color: "var(--color-secondary)" }}>
                {t("accounting.financial_reports")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl shadow-lg border p-6 mb-6"
          style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 flex-1 min-w-[200px]"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
                color: "var(--text-color)",
              }}
            >
              <option value="trial-balance">{t("accounting.trial_balance")}</option>
              <option value="profit-loss">{t("accounting.profit_loss")}</option>
              <option value="balance-sheet">{t("accounting.balance_sheet")}</option>
              <option value="cash-flow">{t("accounting.cash_flow")}</option>
            </select>

            {(reportType === "profit-loss" || reportType === "cash-flow") && (
              <>
                <div className="flex items-center gap-2">
                  <Calendar size={20} style={{ color: "var(--color-secondary)" }} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                    placeholder={t("accounting.start_date")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={20} style={{ color: "var(--color-secondary)" }} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                    placeholder={t("accounting.end_date")}
                  />
                </div>
              </>
            )}

            {(reportType === "trial-balance" || reportType === "balance-sheet") && (
              <div className="flex items-center gap-2">
                <Calendar size={20} style={{ color: "var(--color-secondary)" }} />
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="animate-spin mx-auto mb-4" size={48} style={{ color: "var(--color-primary)" }} />
              <p style={{ color: "var(--text-color)" }}>{t("accounting.loading")}</p>
            </div>
          ) : (
            <div>
              {reportType === "trial-balance" && trialBalance && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("accounting.trial_balance")}
                    </h2>
                    <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                      {t("accounting.as_of")}: {new Date(trialBalance.asOfDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                          <th className="text-left p-4 font-bold" style={{ color: "var(--text-color)" }}>
                            {t("accounting.account")}
                          </th>
                          <th className="text-right p-4 font-bold" style={{ color: "var(--text-color)" }}>
                            {t("accounting.debit")}
                          </th>
                          <th className="text-right p-4 font-bold" style={{ color: "var(--text-color)" }}>
                            {t("accounting.credit")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {trialBalance.accounts?.map((acc, idx) => (
                          <tr
                            key={idx}
                            className="border-b hover:bg-opacity-50 transition-colors"
                            style={{ borderColor: "var(--border-color)" }}
                          >
                            <td className="p-4" style={{ color: "var(--text-color)" }}>
                              {acc.accountNumber} - {acc.accountName}
                            </td>
                            <td className="p-4 text-right" style={{ color: "var(--text-color)" }}>
                              {acc.debit.toLocaleString()}
                            </td>
                            <td className="p-4 text-right" style={{ color: "var(--text-color)" }}>
                              {acc.credit.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold" style={{ borderColor: "var(--border-color)" }}>
                          <td className="p-4" style={{ color: "var(--text-color)" }}>
                            {t("accounting.total")}
                          </td>
                          <td className="p-4 text-right font-bold" style={{ color: "var(--color-primary)" }}>
                            {trialBalance.totals?.totalDebit.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-bold" style={{ color: "var(--color-primary)" }}>
                            {trialBalance.totals?.totalCredit.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </motion.div>
              )}

              {reportType === "profit-loss" && profitLoss && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("accounting.profit_loss")}
                    </h2>
                    <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                      {t("accounting.period")}: {new Date(profitLoss.period?.startDate).toLocaleDateString()} -{" "}
                      {new Date(profitLoss.period?.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={20} style={{ color: "#10b981" }} />
                        <h3 className="font-bold" style={{ color: "var(--text-color)" }}>
                          {t("accounting.revenue")}
                        </h3>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: "#10b981" }}>
                        {profitLoss.revenue?.total.toLocaleString()}
                      </p>
                    </motion.div>
                    <motion.div
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={20} style={{ color: "#ef4444" }} />
                        <h3 className="font-bold" style={{ color: "var(--text-color)" }}>
                          {t("accounting.cost_of_goods_sold")}
                        </h3>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                        {profitLoss.costOfGoodsSold?.total.toLocaleString()}
                      </p>
                    </motion.div>
                    <motion.div
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={20} style={{ color: "var(--color-primary)" }} />
                        <h3 className="font-bold" style={{ color: "var(--text-color)" }}>
                          {t("accounting.gross_profit")}
                        </h3>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                        {profitLoss.grossProfit.toLocaleString()}
                      </p>
                    </motion.div>
                    <motion.div
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={20} style={{ color: "#ef4444" }} />
                        <h3 className="font-bold" style={{ color: "var(--text-color)" }}>
                          {t("accounting.expenses")}
                        </h3>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                        {profitLoss.expenses?.total.toLocaleString()}
                      </p>
                    </motion.div>
                    <motion.div
                      className="p-4 rounded-xl border-2 col-span-full"
                      style={{
                        backgroundColor: profitLoss.netProfit >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        borderColor: profitLoss.netProfit >= 0 ? "#10b981" : "#ef4444",
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {profitLoss.netProfit >= 0 ? (
                          <ArrowUpRight size={24} style={{ color: "#10b981" }} />
                        ) : (
                          <ArrowDownRight size={24} style={{ color: "#ef4444" }} />
                        )}
                        <h3 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                          {t("accounting.net_profit")}
                        </h3>
                      </div>
                      <p
                        className="text-3xl font-bold"
                        style={{ color: profitLoss.netProfit >= 0 ? "#10b981" : "#ef4444" }}
                      >
                        {profitLoss.netProfit.toLocaleString()}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {reportType === "balance-sheet" && balanceSheet && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("accounting.balance_sheet")}
                    </h2>
                    <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                      {t("accounting.as_of")}: {new Date(balanceSheet.asOfDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                      className="p-6 rounded-xl border"
                      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 size={24} style={{ color: "var(--color-primary)" }} />
                        <h3 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>
                          {t("accounting.assets")}
                        </h3>
                      </div>
                      <p className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
                        {balanceSheet.assets?.total.toLocaleString()}
                      </p>
                    </motion.div>
                    <motion.div
                      className="p-6 rounded-xl border"
                      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingDown size={20} style={{ color: "#ef4444" }} />
                            <h3 className="font-bold" style={{ color: "var(--text-color)" }}>
                              {t("accounting.liabilities")}
                            </h3>
                          </div>
                          <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                            {balanceSheet.liabilities?.total.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={20} style={{ color: "var(--color-primary)" }} />
                            <h3 className="font-bold" style={{ color: "var(--text-color)" }}>
                              {t("accounting.equity")}
                            </h3>
                          </div>
                          <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                            {balanceSheet.equity?.total.toLocaleString()}
                          </p>
                        </div>
                        <div className="pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                          <p className="text-xl font-bold" style={{ color: "var(--text-color)" }}>
                            {t("accounting.total_liabilities_and_equity")}:{" "}
                            <span style={{ color: "var(--color-primary)" }}>
                              {balanceSheet.totalLiabilitiesAndEquity.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {reportType === "cash-flow" && cashFlow && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
                      {t("accounting.cash_flow")}
                    </h2>
                    <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                      {t("accounting.period")}: {new Date(cashFlow.period?.startDate).toLocaleDateString()} -{" "}
                      {new Date(cashFlow.period?.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <motion.div
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <h3 className="font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("accounting.operating_activities")}
                      </h3>
                      <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                        {cashFlow.operatingActivities?.cashFlow.toLocaleString()}
                      </p>
                    </motion.div>
                    <motion.div
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <h3 className="font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("accounting.investing_activities")}
                      </h3>
                      <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                        {cashFlow.investingActivities?.cashFlow.toLocaleString()}
                      </p>
                    </motion.div>
                    <motion.div
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <h3 className="font-bold mb-2" style={{ color: "var(--text-color)" }}>
                        {t("accounting.financing_activities")}
                      </h3>
                      <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                        {cashFlow.financingActivities?.cashFlow.toLocaleString()}
                      </p>
                    </motion.div>
                  </div>
                  <motion.div
                    className="p-6 rounded-xl border-2"
                    style={{
                      backgroundColor: cashFlow.netCashFlow >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      borderColor: cashFlow.netCashFlow >= 0 ? "#10b981" : "#ef4444",
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {cashFlow.netCashFlow >= 0 ? (
                        <ArrowUpRight size={24} style={{ color: "#10b981" }} />
                      ) : (
                        <ArrowDownRight size={24} style={{ color: "#ef4444" }} />
                      )}
                      <h3 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                        {t("accounting.net_cash_flow")}
                      </h3>
                    </div>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: cashFlow.netCashFlow >= 0 ? "#10b981" : "#ef4444" }}
                    >
                      {cashFlow.netCashFlow.toLocaleString()}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FinancialReports;

