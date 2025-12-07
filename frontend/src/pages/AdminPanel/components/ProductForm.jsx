import { 
  Loader, 
  Package, 
  DollarSign, 
  FileText, 
  Barcode, 
  Tag, 
  Image, 
  Paperclip,
  Ruler,
  Layers,
  Truck,
  Info,
  CheckCircle2
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
}) => {
  const { t } = useTranslation();

  // מיפוי אייקונים לשדות
  const fieldIcons = {
    sku: Barcode,
    barcode: Barcode,
    productName: Package,
    unitPrice: DollarSign,
    category: Tag,
    productDescription: FileText,
    productImage: Image,
    attachments: Paperclip,
    length: Ruler,
    width: Ruler,
    height: Ruler,
    productType: Layers,
  };

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
          {fieldDefinitions.slice(0, 5).map(({ name, type, label, options, multiple }) => {
            const Icon = fieldIcons[name];
            return (
              <div key={name} className="group">
                <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                  {Icon && <Icon size={16} style={{ color: "var(--color-secondary)" }} />}
                  {t(`product.fields.${name}`)}
                  {['productName', 'unitPrice'].includes(name) && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                {type === "select" ? (
                  <select
                    name={name}
                    value={formData[name] || ""}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
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
                    type={type}
                    name={name}
                    value={type !== "file" ? (formData[name] || "") : undefined}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                    {...(multiple ? { multiple: true } : {})}
                  />
                )}
                {errors[name] && (
                  <p className="mt-2 text-sm flex items-center gap-1" style={{ color: "#ef4444" }}>
                    <span className="font-medium">⚠</span> {t(errors[name])}
                  </p>
                )}
              </div>
            );
          })}
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
          {fieldDefinitions.slice(5, 8).map(({ name, type, label, multiple }) => {
            const Icon = fieldIcons[name];
            return (
              <div key={name}>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                  {Icon && <Icon size={16} style={{ color: "var(--color-secondary)" }} />}
                  {t(`product.fields.${name}`)}
                </label>
                {type === "textarea" ? (
                  <textarea
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
          {fieldDefinitions.slice(8).map(({ name, type, label, options }) => {
            const Icon = fieldIcons[name];
            return (
              <div key={name}>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
                  {Icon && <Icon size={16} style={{ color: "var(--color-secondary)" }} />}
                  {t(`product.fields.${name}`)}
                </label>
                {type === "select" ? (
                  <select
                    name={name}
                    value={formData[name] || ""}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
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
                    type={type}
                    name={name}
                    value={formData[name] || ""}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                    }}
                    placeholder="0"
                  />
                )}
              </div>
            );
          })}
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
          <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-color)" }}>
            <Truck size={16} style={{ color: "var(--color-secondary)" }} />
            {t("product.fields.supplier")}
            {!isSale && <span className="text-red-500">*</span>}
          </label>
          <select
            name="supplierId"
            value={formData.supplierId || ""}
            onChange={handleChange}
            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
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
            <p className="mt-2 text-sm flex items-center gap-1" style={{ color: "#ef4444" }}>
              <span className="font-medium">⚠</span> {t(errors.supplierId)}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          className="w-full font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg"
          style={{
            background: "linear-gradient(to right, var(--color-primary), #14b8a6)",
            color: "var(--button-text)",
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              <span>מעבד...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-6 h-6" />
              <span>{t("product.add_product_button")}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
