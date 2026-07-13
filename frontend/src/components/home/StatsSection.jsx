import { motion } from "framer-motion";
import { usePageLocale } from "../../hooks/usePageLocale";

const StatsSection = () => {
  const { t } = usePageLocale();
  const stats = [
    { value: t("landing.stats.efficiency"), label: t("landing.stats.efficiency_label") },
    { value: t("landing.stats.clients"), label: t("landing.stats.clients_label") },
    { value: t("landing.stats.support"), label: t("landing.stats.support_label") },
    { value: t("landing.stats.uptime"), label: t("landing.stats.uptime_label") },
  ];

  return (
    <section
      className="py-16 border-y"
      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-black mb-2" style={{ color: "var(--color-primary)" }}>
                {item.value}
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--color-secondary)" }}>
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
