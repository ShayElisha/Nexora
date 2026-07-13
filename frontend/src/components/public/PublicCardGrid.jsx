import { motion } from "framer-motion";
import { usePageLocale } from "../../hooks/usePageLocale";

const PublicCardGrid = ({ items = [], columns = 3 }) => {
  const { isRTL } = usePageLocale();
  const colClass =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 ${colClass} gap-6`}>
      {items.map((item, index) => (
        <motion.div
          key={item.title || index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.06 }}
          whileHover={{ y: -4 }}
          className={`p-8 border rounded-2xl transition-all duration-300 hover:shadow-lg ${
            isRTL ? "text-right" : "text-left"
          }`}
          style={{
            backgroundColor: "var(--bg-color)",
            borderColor: "var(--border-color)",
          }}
        >
          {item.icon && (
            <div
              className="w-11 h-11 rounded-xl border flex items-center justify-center mb-5"
              style={{ borderColor: "var(--border-color)" }}
            >
              <item.icon size={20} strokeWidth={1.5} style={{ color: "var(--color-primary)" }} />
            </div>
          )}
          <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text-color)" }}>
            {item.title}
          </h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-secondary)" }}>
            {item.description}
          </p>
          {item.bullets?.length > 0 && (
            <ul className="space-y-2">
              {item.bullets.map((b) => (
                <li
                  key={b}
                  className="text-xs flex items-center gap-2"
                  style={{ color: "var(--color-secondary)" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: "var(--color-accent)" }}
                  />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default PublicCardGrid;
