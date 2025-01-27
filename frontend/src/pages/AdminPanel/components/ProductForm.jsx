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
}) => {
  const { t } = useTranslation();

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* 1) Render dynamic input fields based on fieldDefinitions */}
      {fieldDefinitions.map(({ name, type, label }) => (
        <div key={name}>
          <label className="block text-gray-400 font-medium mb-1">
            {t(`product.fields.${name}`)}
          </label>
          {type !== "textarea" ? (
            <input
              type={type}
              name={name}
              value={type === "file" ? undefined : formData[name] || ""}
              onChange={handleChange}
              className={`w-full p-3 border ${
                errors[name] ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600`}
            />
          ) : (
            <textarea
              name={name}
              value={formData[name] || ""}
              onChange={handleChange}
              className={`w-full p-3 border ${
                errors[name] ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600`}
            />
          )}
          {errors[name] && (
            <p className="mt-1 text-sm text-red-500">{t(errors[name])}</p>
          )}
        </div>
      ))}

      {/* 2) Supplier dropdown */}
      <div>
        <label className="block text-gray-400 font-medium mb-1">
          {t("product.fields.supplier")}
        </label>
        <select
          name="supplierId"
          value={formData.supplierId || ""}
          onChange={handleChange}
          className="w-full px-2 py-1 border border-gray-700 bg-gray-700 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={suppliersIsLoading}
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
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader className="size-6 animate-spin" />
          ) : (
            t("product.add_product_button")
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
