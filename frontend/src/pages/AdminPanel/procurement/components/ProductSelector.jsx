import { useEffect, useState } from "react";
import { useProductStore } from "../../../../stores/useProductStore.js";
import toast from "react-hot-toast";

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
  const { fetchProductsBySupplier } = useProductStore();
  const [products, setProducts] = useState([]);
  const [availableStock, setAvailableStock] = useState(null);

  useEffect(() => {
    if (supplierId) {
      fetchProductsBySupplier(supplierId)
        .then((data) => {
          if (!data || data.length === 0) {
            toast.error("No products found for this supplier.");
            return;
          }

          const formattedProducts = data.map((item) => ({
            _id: item._id,
            SKU: item.SKU,
            productName: item.productName,
            category: item.category,
            unitPrice: item.unitPrice,
            supplierId: item.supplierId,
            supplierName: item.supplierName,
            productImage: item.productImage,
            quantity: item.inventory.quantity || 0, // Use default value if not available
            minStockLevel: item.inventory.minStockLevel || 0,
            reorderQuantity: item.inventory.reorderQuantity || 0,
            shelfLocation: item.inventory.shelfLocation || "",
          }));
          setProducts(formattedProducts);
          toast.success("Products loaded successfully!");
        })
        .catch(() => {
          toast.error("Failed to load products for supplier");
        });
    }
  }, [supplierId, fetchProductsBySupplier]);

  useEffect(() => {
    if (!productData || !selectedSupplier || !formData.currency) return;

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
          toast.error("Failed to fetch conversion rate.");
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
        toast.error("Failed to convert currency.");
      });
  }, [
    formData.currency,
    selectedSupplier,
    productData?.baseUnitPrice,
    fetchExchangeRate,
    setProductData,
    productData,
  ]);

  return (
    <div className="bg-gray-800 p-4 rounded">
      <label className="block text-gray-300 mb-2">Select Product</label>
      <select
        disabled={!supplierId || products.length === 0}
        value={products.find((p) => p.SKU === productData.SKU)?._id || ""}
        onChange={(e) => {
          const selectedId = e.target.value;
          const prod = products.find((p) => p._id === selectedId);

          if (prod) {
            setAvailableStock(prod.quantity); // Set available stock when product is selected

            const supplierBaseCurrency =
              selectedSupplier?.baseCurrency || "USD";
            const selectedCurrency = formData.currency || "USD";

            if (!supplierBaseCurrency || !selectedCurrency) {
              toast.error("Supplier's currency data missing for conversion.");
              return;
            }

            fetchExchangeRate(supplierBaseCurrency, selectedCurrency)
              .then((rate) => {
                if (!rate) {
                  toast.error("Failed to fetch conversion rate.");
                  return;
                }

                const convertedPrice = (prod.unitPrice * rate).toFixed(2);

                setProductData({
                  productName: prod.productName,
                  SKU: prod.SKU,
                  category: prod.category,
                  baseUnitPrice: prod.unitPrice || 0,
                  baseCurrency: supplierBaseCurrency,
                  unitPrice: parseFloat(convertedPrice),
                  quantity: 1,
                });

                handleCurrencyChange({ target: { value: selectedCurrency } });
              })
              .catch(() => {
                toast.error("Failed to convert currency.");
              });
          } else {
            setProductData({
              productName: "",
              SKU: "",
              category: "",
              baseUnitPrice: 0,
              baseCurrency: "USD",
              unitPrice: 0,
              quantity: 0,
            });
            setAvailableStock(null);
          }
        }}
        className="w-full p-2 rounded bg-gray-700"
      >
        <option value="">-- Select a Product --</option>
        {products.map((product) => (
          <option key={product._id} value={product._id}>
            {product.productName || "Unnamed Product"}
          </option>
        ))}
      </select>

      {availableStock !== null && (
        <p className="text-gray-300 mt-2">Available Stock: {availableStock}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-gray-300 text-sm">SKU</label>
          <input
            type="text"
            value={productData.SKU}
            readOnly
            placeholder="SKU"
            className="w-full p-2 rounded bg-gray-700"
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm">Category</label>
          <input
            type="text"
            value={productData.category}
            readOnly
            placeholder="Category"
            className="w-full p-2 rounded bg-gray-700"
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm">Unit Price</label>
          <input
            type="number"
            value={productData.unitPrice}
            readOnly
            placeholder="Unit Price"
            className="w-full p-2 rounded bg-gray-700"
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm">Quantity</label>
          <input
            type="number"
            value={productData.quantity}
            onChange={(e) =>
              setProductData((prev) => ({
                ...prev,
                quantity: +e.target.value,
              }))
            }
            placeholder="Quantity"
            className="w-full p-2 rounded bg-gray-700"
            disabled={!supplierId}
          />
        </div>
      </div>

      <button
        onClick={onAddProduct}
        className="bg-green-600 py-2 px-4 text-white rounded mt-4 hover:bg-green-700"
        disabled={!supplierId}
      >
        Add Product
      </button>
    </div>
  );
};

export default ProductSelector;
