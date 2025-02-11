import { Loader } from "lucide-react";
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

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* 1) Render dynamic input fields based on fieldDefinitions */}
      {fieldDefinitions.map(({ name, type, label, options }) => (
        <div key={name}>
          <label className="block text-text font-medium mb-1">
            {t(`product.fields.${name}`)}
          </label>

          {type === "select" ? (
            <select
              name={name}
              value={formData[name] || ""}
              onChange={handleChange}
              className={`w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary`}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : type === "textarea" ? (
            <textarea
              name={name}
              value={formData[name] || ""}
              onChange={handleChange}
              className={`w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary`}
            />
          ) : (
            <input
              type={type}
              name={name}
              value={type === "file" ? undefined : formData[name] || ""}
              onChange={handleChange}
              className={`w-full p-3 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary`}
            />
          )}

          {errors[name] && (
            <p className="mt-1 text-sm text-red-500">{t(errors[name])}</p>
          )}
        </div>
      ))}

      {/* 2) Supplier dropdown */}
      <div>
        <label className="block text-text font-medium mb-1">
          {t("product.fields.supplier")}
        </label>
        <select
          name="supplierId"
          value={formData.supplierId || ""}
          onChange={handleChange}
          className="w-full px-2 py-1 border border-border-color bg-base-100 rounded-md text-text focus:outline-none focus:ring-1 focus:ring-primary"
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
        {errors.supplierId && (
          <p className="mt-1 text-sm text-red-500">{t(errors.supplierId)}</p>
        )}
      </div>

      {/* 4) Submit button */}
      <div className="col-span-full">
        <button
          type="submit"
          className="w-full bg-primary text-button-text font-bold py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader className="w-6 h-6 animate-spin" />
          ) : (
            t("product.add_product_button")
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
