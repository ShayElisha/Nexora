import { motion } from "framer-motion";
import { usePageLocale } from "../../hooks/usePageLocale";

const PublicLegalSections = ({ sections = [] }) => {
  const { isRTL } = usePageLocale();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
      {sections.map((section, index) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
          className={isRTL ? "text-right" : "text-left"}
        >
          <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text-color)" }}>
            {section.title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-secondary)" }}>
            {section.content}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

export default PublicLegalSections;
