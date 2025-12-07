import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProductStore } from "../../../../stores/useProductStore.js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../../../lib/axios";
import {
  Package,
  Tag,
  DollarSign,
  Hash,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
  Search,
  ShoppingBag,
  Boxes
} from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductInfo, setShowProductInfo] = useState(false);
  const [usePriceList, setUsePriceList] = useState(true);
  const [selectedPriceList, setSelectedPriceList] = useState(null);
  const prevCurrencyRef = useRef(null);
  const prevBaseUnitPriceRef = useRef(null);
  const prevProductIdRef = useRef(null);

  // Fetch price lists for supplier
  const { data: supplierPriceLists = [] } = useQuery({
    queryKey: ["price-lists-procurement", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      const res = await axiosInstance.get(
        `/procurement-advanced/price-lists?priceListType=Supplier&status=Active`
      );
      return res.data.data || [];
    },
    enabled: !!supplierId && usePriceList,
  });

  // Auto-select price list when supplier is selected
  useEffect(() => {
    if (supplierPriceLists.length > 0 && supplierId) {
      const supplierSpecific = supplierPriceLists.find(
        (pl) => pl.supplierId?._id === supplierId || pl.supplierId === supplierId
      );
      const generalPriceList = supplierPriceLists.find(
        (pl) => !pl.supplierId
      );
      setSelectedPriceList(supplierSpecific || generalPriceList || null);
    } else {
      setSelectedPriceList(null);
    }
  }, [supplierPriceLists, supplierId]);

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
    if (
      !productData?.productId ||
      !selectedSupplier ||
      !formData.currency ||
      !productData?.baseUnitPrice
    )
      return;

    const supplierBaseCurrency = selectedSupplier?.baseCurrency || "USD";
    const selectedCurrency = formData.currency;

    // בדיקה אם הערכים לא השתנו - למנוע לולאה אינסופית
    if (
      prevCurrencyRef.current === selectedCurrency &&
      prevBaseUnitPriceRef.current === productData.baseUnitPrice &&
      prevProductIdRef.current === productData.productId &&
      productData.baseCurrency === supplierBaseCurrency
    ) {
      return;
    }

    // עדכון הערכים הקודמים
    prevCurrencyRef.current = selectedCurrency;
    prevBaseUnitPriceRef.current = productData.baseUnitPrice;
    prevProductIdRef.current = productData.productId;

    if (supplierBaseCurrency === selectedCurrency) {
      setProductData((prev) => {
        // בדיקה אם הערך כבר נכון - למנוע עדכון מיותר
        if (prev.unitPrice === prev.baseUnitPrice && prev.baseCurrency === supplierBaseCurrency) {
          return prev;
        }
        return {
          ...prev,
          unitPrice: prev.baseUnitPrice,
          baseCurrency: supplierBaseCurrency,
        };
      });
      return;
    }

    fetchExchangeRate(supplierBaseCurrency, selectedCurrency)
      .then((rate) => {
        if (!rate) {
          toast.error(t("procurement.failed_to_fetch_conversion_rate"));
          return;
        }
        const convertedPrice = (productData.baseUnitPrice * rate).toFixed(2);
        setProductData((prev) => {
          // בדיקה אם הערך כבר נכון - למנוע עדכון מיותר
          const newPrice = parseFloat(convertedPrice);
          if (prev.unitPrice === newPrice && prev.baseCurrency === supplierBaseCurrency) {
            return prev;
          }
          return {
            ...prev,
            unitPrice: newPrice,
            baseCurrency: supplierBaseCurrency,
          };
        });
      })
      .catch(() => {
        toast.error(t("procurement.failed_to_convert_currency"));
      });
  }, [
    formData.currency,
    selectedSupplier?.baseCurrency,
    productData?.baseUnitPrice,
    productData?.productId,
    fetchExchangeRate,
    t,
  ]);

  const filteredProducts = products.filter(
    (product) =>
      product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load price from price list
  const loadPriceFromPriceList = async (productId, quantity = 1) => {
    if (!productId || !usePriceList || !supplierId) {
      return null;
    }

    try {
      const res = await axiosInstance.get(
        `/procurement-advanced/price-lists/get-price`,
        {
          params: {
            supplierId: supplierId,
            productId: productId,
            quantity: quantity,
          },
        }
      );

      if (res.data.success) {
        return {
          price: res.data.price,
          discountPercent: res.data.discountPercent || 0,
          basePrice: res.data.basePrice || res.data.price,
        };
      }
    } catch (error) {
      console.error("Error loading price from price list:", error);
    }
    return null;
  };

  const handleProductSelect = async (e) => {
    const selectedId = e.target.value;
    const prod = products.find((p) => p._id === selectedId);

    if (prod) {
      setAvailableStock(prod.quantity);
      setShowProductInfo(true);

      const supplierBaseCurrency =
        selectedSupplier?.baseCurrency || "USD";
      const selectedCurrency = formData.currency || "USD";

      if (!supplierBaseCurrency || !selectedCurrency) {
        toast.error(t("procurement.currency_error"));
        return;
      }

      // Try to get price from price list first
      let basePrice = prod.unitPrice || 0;
      let discountPercent = 0;
      let originalBasePrice = prod.unitPrice || 0;
      if (usePriceList && supplierId) {
        const priceListData = await loadPriceFromPriceList(selectedId, 1);
        if (priceListData && priceListData.price > 0) {
          basePrice = priceListData.price;
          discountPercent = priceListData.discountPercent || 0;
          originalBasePrice = priceListData.basePrice || prod.unitPrice || 0;
        }
      }

      fetchExchangeRate(supplierBaseCurrency, selectedCurrency)
        .then((rate) => {
          if (!rate) {
            toast.error(t("procurement.conversion_error"));
            return;
          }

          const convertedPrice = (basePrice * rate).toFixed(2);

          setProductData({
            productId: prod._id,
            productName: prod.productName,
            sku: prod.sku,
            category: prod.category,
            baseUnitPrice: basePrice,
            originalBasePrice: originalBasePrice,
            discountPercent: discountPercent,
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
      setShowProductInfo(false);
    }
  };

  const isFormValid = productData.productId && productData.quantity > 0;
  const isLowStock = availableStock !== null && availableStock < 10;

  return (
    <div className="space-y-6">
      {/* Price List Selection */}
      {supplierId && supplierPriceLists.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={usePriceList}
              onChange={(e) => {
                setUsePriceList(e.target.checked);
                    // Reload price if product is selected
                if (e.target.checked && productData.productId) {
                  loadPriceFromPriceList(productData.productId, productData.quantity || 1)
                    .then((priceData) => {
                      if (priceData && priceData.price > 0) {
                        const supplierBaseCurrency = selectedSupplier?.baseCurrency || "USD";
                        const selectedCurrency = formData.currency || "USD";
                        fetchExchangeRate(supplierBaseCurrency, selectedCurrency)
                          .then((rate) => {
                            if (rate) {
                              const convertedPrice = (priceData.price * rate).toFixed(2);
                              setProductData((prev) => ({
                                ...prev,
                                baseUnitPrice: priceData.price,
                                originalBasePrice: priceData.basePrice || prev.baseUnitPrice,
                                discountPercent: priceData.discountPercent || 0,
                                unitPrice: parseFloat(convertedPrice),
                              }));
                            }
                          });
                      }
                    });
                }
              }}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <label className="block text-sm font-bold" style={{ color: 'var(--text-color)' }}>
              {t("procurement.use_price_list", { defaultValue: "Use Supplier Price List" })}
            </label>
          </div>
          {usePriceList && (
            <select
              value={selectedPriceList?._id || ""}
              onChange={(e) => {
                const priceList = supplierPriceLists.find((pl) => pl._id === e.target.value);
                setSelectedPriceList(priceList || null);
                // Reload price if product is selected
                if (productData.productId) {
                  loadPriceFromPriceList(productData.productId, productData.quantity || 1)
                    .then((priceData) => {
                      if (priceData && priceData.price > 0) {
                        const supplierBaseCurrency = selectedSupplier?.baseCurrency || "USD";
                        const selectedCurrency = formData.currency || "USD";
                        fetchExchangeRate(supplierBaseCurrency, selectedCurrency)
                          .then((rate) => {
                            if (rate) {
                              const convertedPrice = (priceData.price * rate).toFixed(2);
                              setProductData((prev) => ({
                                ...prev,
                                baseUnitPrice: priceData.price,
                                originalBasePrice: priceData.basePrice || prev.baseUnitPrice,
                                discountPercent: priceData.discountPercent || 0,
                                unitPrice: parseFloat(convertedPrice),
                              }));
                            }
                          });
                      }
                    });
                }
              }}
              className="w-full p-2 rounded-lg border focus:outline-none focus:ring-2 text-sm"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              <option value="">{t("procurement.auto_select_price_list", { defaultValue: "Auto-select (Recommended)" })}</option>
              {supplierPriceLists.map((pl) => (
                <option key={pl._id} value={pl._id}>
                  {pl.priceListName} {pl.supplierId ? `(${pl.supplierId.SupplierName || pl.supplierId})` : "(General)"}
                </option>
              ))}
            </select>
          )}
          {selectedPriceList && usePriceList && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>
              {t("procurement.price_list_active", { defaultValue: "Using" })}: {selectedPriceList.priceListName}
            </p>
          )}
        </div>
      )}

      {/* Product Selection */}
      <div>
        <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: 'var(--text-color)' }}>
          <Search size={18} />
          {t("procurement.select_product")}
        </label>
        
        {/* Search Input */}
        {products.length > 5 && (
          <motion.div 
            className="mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t("procurement.search_products")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              />
            </div>
          </motion.div>
        )}

        <select
          disabled={!supplierId || products.length === 0}
          value={products.find((p) => p.sku === productData.sku)?._id || ""}
          onChange={handleProductSelect}
          className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-color)',
            color: 'var(--text-color)'
          }}
        >
          <option value="">
            {!supplierId 
              ? t("procurement.select_supplier_first")
              : products.length === 0
              ? t("procurement.no_products_available")
              : `-- ${t("procurement.select_product_placeholder")} --`
            }
          </option>
          {filteredProducts.map((product) => (
            <option key={product._id} value={product._id}>
              {product.productName || t("procurement.unnamed_product")} - {product.sku}
          </option>
        ))}
      </select>

        {searchTerm && filteredProducts.length === 0 && (
          <motion.p 
            className="text-sm mt-2 flex items-center gap-2"
            style={{ color: 'var(--color-secondary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={16} />
            {t("procurement.no_products_match_search")}
          </motion.p>
        )}
      </div>

      {/* Stock Availability Alert */}
      <AnimatePresence>
      {availableStock !== null && (
          <motion.div
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              isLowStock
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {isLowStock ? (
              <AlertCircle size={20} className="text-yellow-600" />
            ) : (
              <CheckCircle size={20} className="text-green-600" />
            )}
            <div>
              <p className={`font-bold text-sm ${isLowStock ? 'text-yellow-800' : 'text-green-800'}`}>
                {t("procurement.available_stock")}: {availableStock} {t("procurement.units")}
              </p>
              {isLowStock && (
                <p className="text-xs text-yellow-700 mt-1">
                  {t("procurement.low_stock_warning")}
        </p>
      )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Details */}
      <AnimatePresence>
        {showProductInfo && productData.productId && (
          <motion.div
            className="rounded-xl border p-6"
            style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600">
                <Package size={20} color="white" />
              </div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
                {t("procurement.product_details")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SKU */}
        <div>
                <label className="flex items-center gap-2 text-xs font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                  <Tag size={14} />
                  {t("procurement.sku")}
                </label>
          <input
            type="text"
            value={productData.sku}
            readOnly
            placeholder={t("procurement.sku_placeholder")}
                  className="w-full p-3 border rounded-xl opacity-70"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--border-color)',
                    color: 'var(--text-color)'
                  }}
          />
        </div>

              {/* Category */}
        <div>
                <label className="flex items-center gap-2 text-xs font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                  <Boxes size={14} />
            {t("procurement.category")}
          </label>
          <input
            type="text"
            value={productData.category}
            readOnly
            placeholder={t("procurement.category_placeholder")}
                  className="w-full p-3 border rounded-xl opacity-70"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--border-color)',
                    color: 'var(--text-color)'
                  }}
          />
        </div>

              {/* Unit Price */}
        <div>
                <label className="flex items-center gap-2 text-xs font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                  <DollarSign size={14} />
            {t("procurement.unit_price")}
          </label>
                <div className="relative">
          <input
            type="number"
            value={productData.unitPrice}
            readOnly
            placeholder={t("procurement.unit_price_placeholder")}
                    className="w-full p-3 border rounded-xl opacity-70 pr-12"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--border-color)',
                      color: 'var(--text-color)'
                    }}
                  />
                  <span className="absolute right-3 top-3.5 font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
                    {formData.currency}
                  </span>
                </div>
        </div>

              {/* Quantity */}
              <div>
                <label className="flex items-center gap-2 text-xs font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                  <Hash size={14} />
                  {t("procurement.quantity")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={productData.quantity}
                  onChange={async (e) => {
                    const value = parseInt(e.target.value) || 0;
                    setProductData((prev) => ({
                      ...prev,
                      quantity: value,
                    }));
                    
                    // Reload price from price list if quantity changed and price list is enabled
                    if (usePriceList && supplierId && productData.productId && value > 0) {
                      const priceListData = await loadPriceFromPriceList(productData.productId, value);
                      if (priceListData && priceListData.price > 0) {
                        const supplierBaseCurrency = selectedSupplier?.baseCurrency || "USD";
                        const selectedCurrency = formData.currency || "USD";
                        fetchExchangeRate(supplierBaseCurrency, selectedCurrency)
                          .then((rate) => {
                            if (rate) {
                              const convertedPrice = (priceListData.price * rate).toFixed(2);
                              setProductData((prev) => ({
                                ...prev,
                                quantity: value,
                                baseUnitPrice: priceListData.price,
                                originalBasePrice: priceListData.basePrice || prev.baseUnitPrice,
                                discountPercent: priceListData.discountPercent || 0,
                                unitPrice: parseFloat(convertedPrice),
                              }));
                            }
                          });
                      }
                    }
                  }}
                  placeholder={t("procurement.quantity_placeholder")}
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  disabled={!supplierId}
                />
              </div>
      </div>

            {/* Total Price */}
            <motion.div
              className="mt-4 p-4 rounded-xl"
              style={{ backgroundColor: 'var(--border-color)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
                  <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                    {t("procurement.subtotal")}:
                  </span>
                </div>
                <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {(productData.unitPrice * productData.quantity).toFixed(2)} {formData.currency}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Button */}
      <motion.button
        onClick={onAddProduct}
        disabled={!supplierId || !isFormValid}
        className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
        whileHover={{ scale: isFormValid ? 1.02 : 1 }}
        whileTap={{ scale: isFormValid ? 0.98 : 1 }}
      >
        <Plus size={24} />
        {t("procurement.add_product")}
      </motion.button>

      {/* Helper Text */}
      {!supplierId && (
        <motion.p 
          className="text-sm text-center flex items-center justify-center gap-2"
          style={{ color: 'var(--color-secondary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertCircle size={16} />
          {t("procurement.select_supplier_to_add_products")}
        </motion.p>
      )}
    </div>
  );
};

export default ProductSelector;
