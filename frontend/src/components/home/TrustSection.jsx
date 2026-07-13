import { motion } from "framer-motion";
import { Shield, Lock, FileCheck, Globe } from "lucide-react";
import { usePageLocale } from "../../hooks/usePageLocale";

const BADGES = [
  { icon: Shield, key: "soc2" },
  { icon: Lock, key: "iso" },
  { icon: FileCheck, key: "gdpr" },
  { icon: Globe, key: "uptime" },
];

const TrustSection = () => {
  const { t, isRTL } = usePageLocale();

  const clients = [
    t("landing.trust.client1"),
    t("landing.trust.client2"),
    t("landing.trust.client3"),
    t("landing.trust.client4"),
    t("landing.trust.client5"),
  ];

  return (
    <section className="py-20" style={{ backgroundColor: "var(--footer-bg)" }} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-primary)" }}>
            {t("landing.trust.badge")}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--text-color)" }}>
            {t("landing.trust.title")}
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-16 opacity-70">
          {clients.map((name) => (
            <span
              key={name}
              className="text-lg md:text-xl font-bold tracking-tight"
              style={{ color: "var(--text-color)" }}
            >
              {name}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BADGES.map(({ icon: Icon, key }, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className={`p-6 border rounded-2xl text-center ${isRTL ? "text-right md:text-center" : ""}`}
              style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
            >
              <Icon size={24} className="mx-auto mb-3" style={{ color: "var(--color-primary)" }} strokeWidth={1.5} />
              <p className="text-sm font-bold mb-1" style={{ color: "var(--text-color)" }}>
                {t(`landing.trust.${key}_title`)}
              </p>
              <p className="text-xs" style={{ color: "var(--color-secondary)" }}>
                {t(`landing.trust.${key}_desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
