import { useEffect, useState } from "react";
import { useProductStore } from "../../../../stores/useProductStore.js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const ProductSelector = ({
  supplierId,
  productData,
  setProductData,
  onAddProduct,
  selectedSupplier,
  handleCurrencyChange,
  fetchExchangeRate,
  formData,
}) => {
  const { t } = useTranslation();
  const { fetchProductsBySupplier } = useProductStore();
  const [products, setProducts] = useState([]);
  const [availableStock, setAvailableStock] = useState(null);

  useEffect(() => {
    if (!supplierId) return;

    fetchProductsBySupplier(supplierId)
      .then((data) => {
        if (!data || data.length === 0) {
          toast.error(t("procurement.no_products_found_for_supplier"));
          return;
        }

        const formattedProducts = data.map((item) => ({
          _id: item._id,
          sku: item.sku,
          productName: item.productName,
          category: item.category,
          unitPrice: item.unitPrice,
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          productImage: item.productImage,
          quantity: item.inventory?.quantity ?? 0,
          minStockLevel: item.inventory?.minStockLevel ?? 0,
          reorderQuantity: item.inventory?.reorderQuantity ?? 0,
          shelfLocation: item.inventory?.shelfLocation ?? "",
        }));

        setProducts((prevProducts) => {
          if (
            JSON.stringify(prevProducts) !== JSON.stringify(formattedProducts)
          ) {
            return formattedProducts;
          }
          return prevProducts;
        });

        toast.success(t("procurement.products_loaded_successfully"));
      })
      .catch(() => {
        toast.error(t("procurement.failed_to_load_products_for_supplier"));
      });
  }, [supplierId]);

  useEffect(() => {
    // Only run if a product is selected (productId exists)
    if (
      !productData?.productId || // תנאי חדש: אין עדכון אם לא נבחר מוצר
      !selectedSupplier ||
      !formData.currency
    )
      return;

    const supplierBaseCurrency = selectedSupplier?.baseCurrency || "USD";
    const selectedCurrency = formData.currency;

    if (supplierBaseCurrency === selectedCurrency) {
      setProductData((prev) => ({
        ...prev,
        unitPrice: prev.baseUnitPrice,
        baseCurrency: supplierBaseCurrency,
      }));
      return;
    }

    fetchExchangeRate(supplierBaseCurrency, selectedCurrency)
      .then((rate) => {
        if (!rate) {
          toast.error(t("procurement.failed_to_fetch_conversion_rate"));
          return;
        }
        const convertedPrice = (productData.baseUnitPrice * rate).toFixed(2);
        setProductData((prev) => ({
          ...prev,
          unitPrice: parseFloat(convertedPrice),
          baseCurrency: supplierBaseCurrency,
        }));
      })
      .catch(() => {
        toast.error(t("procurement.failed_to_convert_currency"));
      });
  }, [
    formData.currency,
    selectedSupplier,
    productData?.baseUnitPrice,
    productData?.productId, // תלות חדשה ספציפית למוצר שנבחר
    fetchExchangeRate,
    t,
  ]);

  return (
    <div className="bg-bg p-4 rounded">
      <label className="block text-text mb-2">
        {t("procurement.select_product")}
      </label>
      <select
        disabled={!supplierId || products.length === 0}
        value={products.find((p) => p.sku === productData.sku)?._id || ""}
        onChange={(e) => {
          const selectedId = e.target.value;
          const prod = products.find((p) => p._id === selectedId);

          if (prod) {
            setAvailableStock(prod.quantity); // Set available stock when product is selected

            const supplierBaseCurrency =
              selectedSupplier?.baseCurrency || "USD";
            const selectedCurrency = formData.currency || "USD";

            if (!supplierBaseCurrency || !selectedCurrency) {
              toast.error(t("procurement.currency_error"));
              return;
            }

            fetchExchangeRate(supplierBaseCurrency, selectedCurrency)
              .then((rate) => {
                if (!rate) {
                  toast.error(t("procurement.conversion_error"));
                  return;
                }

                const convertedPrice = (prod.unitPrice * rate).toFixed(2);

                setProductData({
                  productId: prod._id,
                  productName: prod.productName,
                  sku: prod.sku,
                  category: prod.category,
                  baseUnitPrice: prod.unitPrice || 0,
                  baseCurrency: supplierBaseCurrency,
                  unitPrice: parseFloat(convertedPrice),
                  quantity: 1,
                });

                handleCurrencyChange({ target: { value: selectedCurrency } });
              })
              .catch(() => {
                toast.error(t("procurement.failed_to_convert_currency"));
              });
          } else {
            setProductData({
              productId: "",
              productName: "",
              sku: "",
              category: "",
              baseUnitPrice: 0,
              baseCurrency: "USD",
              unitPrice: 0,
              quantity: 0,
            });
            setAvailableStock(null);
          }
        }}
        className="w-full p-2 rounded bg-secondary"
      >
        <option value="">{`-- ${t(
          "procurement.select_product_placeholder"
        )} --`}</option>
        {products.map((product) => (
          <option key={product._id} value={product._id}>
            {product.productName || t("procurement.unnamed_product")}
          </option>
        ))}
      </select>

      {availableStock !== null && (
        <p className="text-text mt-2">
          {t("procurement.available_stock")}: {availableStock}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-text text-sm">{t("procurement.sku")}</label>
          <input
            type="text"
            value={productData.sku}
            readOnly
            placeholder={t("procurement.sku_placeholder")}
            className="w-full p-2 rounded bg-secondary"
          />
        </div>
        <div>
          <label className="text-text text-sm">
            {t("procurement.category")}
          </label>
          <input
            type="text"
            value={productData.category}
            readOnly
            placeholder={t("procurement.category_placeholder")}
            className="w-full p-2 rounded bg-secondary"
          />
        </div>
        <div>
          <label className="text-text text-sm">
            {t("procurement.unit_price")}
          </label>
          <input
            type="number"
            value={productData.unitPrice}
            readOnly
            placeholder={t("procurement.unit_price_placeholder")}
            className="w-full p-2 rounded bg-secondary"
          />
        </div>
        <div>
          <label className="text-text text-sm">
            {t("procurement.quantity")}
          </label>
          <input
            type="number"
            value={productData.quantity}
            onChange={(e) =>
              setProductData((prev) => ({
                ...prev,
                quantity: +e.target.value,
              }))
            }
            placeholder={t("procurement.quantity_placeholder")}
            className="w-full p-2 rounded bg-secondary"
            disabled={!supplierId}
          />
        </div>
      </div>

      <button
        onClick={onAddProduct}
        className="bg-primary py-2 px-4 text-white rounded mt-4 hover:bg-primary transition-colors"
        disabled={!supplierId}
      >
        {t("procurement.add_product")}
      </button>
    </div>
  );
};

export default ProductSelector;
