import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const CRMPreview = () => (
  <div className="p-4 rounded-xl h-44 overflow-hidden" style={{ backgroundColor: "var(--text-color)" }}>
    <div className="text-[10px] font-mono mb-2" style={{ color: "var(--color-accent)" }}>// pipeline.ts</div>
    <div className="text-[10px] font-mono" style={{ color: "var(--color-secondary)" }}>
      <span style={{ color: "var(--color-primary)" }}>const</span> pipeline = {"{"} stage, value, confidence {"}"};
    </div>
  </div>
);

const HRPreview = () => (
  <div className="p-4 h-44">
    <div className="flex items-end gap-2 h-28">
      {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-sm"
            style={{ height: `${h}%`, backgroundColor: "var(--color-primary)", opacity: 0.85 }}
          />
        </div>
      ))}
    </div>
  </div>
);

const InventoryPreview = () => (
  <div className="p-4 h-44 space-y-2">
    {[
      { sku: "NX-1042", stock: "1,240", ok: true },
      { sku: "NX-2087", stock: "86", ok: false },
      { sku: "NX-3310", stock: "4,500", ok: true },
    ].map((row) => (
      <div
        key={row.sku}
        className="flex items-center justify-between py-2 px-3 rounded-lg text-[10px] border"
        style={{ borderColor: "var(--border-color)", backgroundColor: "var(--footer-bg)" }}
      >
        <span className="font-mono" style={{ color: "var(--color-primary)" }}>{row.sku}</span>
        <span style={{ color: "var(--color-secondary)" }}>{row.stock}</span>
        <span style={{ color: row.ok ? "var(--color-accent)" : "var(--color-primary)" }}>
          {row.ok ? "✓" : "!"}
        </span>
      </div>
    ))}
  </div>
);

const ProductModules = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const modules = [
    { titleKey: "landing.modules.crm_title", descKey: "landing.modules.crm_desc", preview: CRMPreview },
    { titleKey: "landing.modules.hr_title", descKey: "landing.modules.hr_desc", preview: HRPreview },
    { titleKey: "landing.modules.inventory_title", descKey: "landing.modules.inventory_desc", preview: InventoryPreview },
  ];

  return (
    <section className="py-24" style={{ backgroundColor: "var(--footer-bg)" }} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: "var(--text-color)" }}>
            {t("landing.modules.title")}
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: "var(--color-secondary)" }}>
            {t("landing.modules.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {modules.map((mod, index) => (
            <motion.div
              key={mod.titleKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
              style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
            >
              <div className="border-b" style={{ borderColor: "var(--border-color)" }}>
                <mod.preview />
              </div>
              <div className={`p-8 ${isRTL ? "text-right" : "text-left"}`}>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--text-color)" }}>
                  {t(mod.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-secondary)" }}>
                  {t(mod.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductModules;
