import { 
  Loader, 
  FileText, 
  Ruler,
  Truck,
  Info,
  CheckCircle2,
  Box
} from "lucide-react";
import { useTranslation } from "react-i18next";

// שדות חובה בטופס
const REQUIRED_FIELDS = ["productName", "unitPrice"];

const FieldLabel = ({ name, children }) => (
  <label
    htmlFor={name}
    className="block text-sm font-semibold mb-2"
    style={{ color: "var(--text-color)" }}
  >
    {children}
    {REQUIRED_FIELDS.includes(name) && (
      <span className="text-red-500 ms-1" aria-hidden="true">*</span>
    )}
  </label>
);

const ProductForm = ({
  fieldDefinitions,
  formData,
  errors,
  isLoading,
  suppliers,
  suppliersIsLoading,
  handleChange,
  handleSubmit,
  isSale,
  volume = 0,
}) => {
  const { t } = useTranslation();

  return (
    <form onSubmit={handleSubmit} className="space-y-8"
    >
      {/* Basic Information Section */}
      <div
        className="p-6 rounded-xl border"
        style={{
          background: "linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--color-primary)" }}>
            <Info className="text-white" size={20} />
          </div>
          <h3 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>מידע בסיסי</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fieldDefinitions.slice(0, 5).map(({ name, type, options, multiple }) => (
            <div key={name} className="group">
              <FieldLabel name={name}>{t(`product.fields.${name}`)}</FieldLabel>
              {type === "select" ? (
                <select
                  id={name}
                  name={name}
                  value={formData[name] || ""}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={name}
                  type={type}
                  name={name}
                  value={type !== "file" ? (formData[name] || "") : undefined}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  {...(multiple ? { multiple: true } : {})}
                />
              )}
              {errors[name] && (
                <p className="mt-2 text-sm" style={{ color: "#ef4444" }}>
                  {t(errors[name])}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Description & Files Section */}
      <div
        className="p-6 rounded-xl border"
        style={{
          background: "linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(20, 184, 166, 0.1))",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#22c55e" }}>
            <FileText className="text-white" size={20} />
          </div>
          <h3 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>תיאור וקבצים</h3>
        </div>
        <div className="space-y-6">
          {fieldDefinitions.slice(5, 8).map(({ name, type, multiple }) => {
            return (
              <div key={name}>
                <FieldLabel name={name}>{t(`product.fields.${name}`)}</FieldLabel>
                {type === "textarea" ? (
                  <textarea
                    id={name}
                    name={name}
                    value={formData[name] || ""}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 resize-none"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                    placeholder="הכנס תיאור מפורט של המוצר..."
                  />
                ) : type === "file" ? (
                  <div className="relative">
                    <input
                      id={name}
                      type={type}
                      name={name}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:cursor-pointer"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                      {...(multiple ? { multiple: true } : {})}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dimensions Section */}
      <div
        className="p-6 rounded-xl border"
        style={{
          background: "linear-gradient(to right, rgba(249, 115, 22, 0.1), rgba(234, 179, 8, 0.1))",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#f97316" }}>
            <Ruler className="text-white" size={20} />
          </div>
          <h3 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>מידות ותכונות</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {fieldDefinitions.slice(8).map(({ name, type, options }) => (
            <div key={name}>
              <FieldLabel name={name}>{t(`product.fields.${name}`)}</FieldLabel>
              {type === "select" ? (
                <select
                  id={name}
                  name={name}
                  value={formData[name] || ""}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={name}
                  type={type}
                  name={name}
                  value={formData[name] || ""}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                  placeholder="0"
                />
              )}
            </div>
          ))}
        </div>

        {/* Live volume calculation, derived from the dimension fields above */}
        <div
          className="mt-6 flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
        >
          <Box size={20} style={{ color: "var(--color-primary)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--color-secondary)" }}>
            {t("product.fields.volume")}:
          </span>
          <span className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
            {volume.toFixed(3)} m³
          </span>
        </div>
      </div>

      {/* Supplier Section */}
      <div
        className="p-6 rounded-xl border"
        style={{
          background: "linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(59, 130, 246, 0.1))",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#6366f1" }}>
            <Truck className="text-white" size={20} />
          </div>
          <h3 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>ספק</h3>
        </div>
        <div>
          <label
            htmlFor="supplierId"
            className="block text-sm font-semibold mb-2"
            style={{ color: "var(--text-color)" }}
          >
            {t("product.fields.supplier")}
            {!isSale && <span className="text-red-500 ms-1" aria-hidden="true">*</span>}
          </label>
          <select
            id="supplierId"
            name="supplierId"
            value={formData.supplierId || ""}
            onChange={handleChange}
            className="w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)",
            }}
            disabled={suppliersIsLoading || isSale}
          >
            {suppliersIsLoading ? (
              <option>{t("product.loading_suppliers")}</option>
            ) : (
              <>
                <option value="">{t("product.select_supplier")}</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.SupplierName}
                  </option>
                ))}
              </>
            )}
          </select>
          {isSale && (
            <p className="mt-2 text-sm flex items-center gap-1" style={{ color: "var(--color-secondary)" }}>
              <Info size={14} /> מוצר מכירה אינו דורש ספק
            </p>
          )}
          {errors.supplierId && (
            <p className="mt-2 text-sm" style={{ color: "#ef4444" }}>
              {t(errors.supplierId)}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button - always the final element of the form flow */}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          className="w-full sm:w-auto px-8 h-12 font-semibold rounded-xl focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--button-text)",
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>{t("product.processing")}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>{t("product.add_product_button")}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
