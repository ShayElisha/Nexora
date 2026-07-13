import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

const TESTIMONIAL_META = [
  { initials: "דכ", name: "דוד כהן", role: 'מנכ"ל, חברת טכנולוגיה' },
  { initials: "של", name: "שרה לוי", role: 'סמנכ"לית כספים' },
  { initials: "מב", name: "מיכאל ברק", role: "מנהל תפעול" },
];

const StarRow = () => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={14} style={{ color: "var(--color-primary)", fill: "var(--color-primary)" }} strokeWidth={0} />
    ))}
  </div>
);

const TestimonialsSection = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const quotes = [
    t("landing.testimonials.quote1"),
    t("landing.testimonials.quote2"),
    t("landing.testimonials.quote3"),
  ];

  return (
    <section className="py-24" style={{ backgroundColor: "var(--bg-color)" }} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight"
          style={{ color: "var(--text-color)" }}
        >
          {t("landing.testimonials.title")}
        </motion.h2>

        <div className="grid lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`lg:col-span-3 p-10 backdrop-blur-xl border rounded-2xl ${
              isRTL ? "text-right" : "text-left"
            }`}
            style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
          >
            <StarRow />
            <p className="mt-6 text-xl md:text-2xl italic leading-relaxed font-medium" style={{ color: "var(--text-color)" }}>
              &ldquo;{quotes[0]}&rdquo;
            </p>
            <div className={`mt-8 flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 font-bold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {TESTIMONIAL_META[0].initials}
              </div>
              <div>
                <p className="font-bold" style={{ color: "var(--text-color)" }}>{TESTIMONIAL_META[0].name}</p>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{TESTIMONIAL_META[0].role}</p>
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-2 space-y-6">
            {[1, 2].map((idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`p-8 backdrop-blur-xl border rounded-2xl ${
                  isRTL ? "text-right" : "text-left"
                }`}
                style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
              >
                <StarRow />
                <p className="mt-4 text-sm italic leading-relaxed" style={{ color: "var(--text-color)" }}>
                  &ldquo;{quotes[idx]}&rdquo;
                </p>
                <div className={`mt-6 flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {TESTIMONIAL_META[idx].initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--text-color)" }}>{TESTIMONIAL_META[idx].name}</p>
                    <p className="text-xs" style={{ color: "var(--color-secondary)" }}>{TESTIMONIAL_META[idx].role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
