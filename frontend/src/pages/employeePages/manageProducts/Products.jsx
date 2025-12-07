import { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ShoppingCart,
  Package,
  DollarSign,
  Tag,
  MapPin,
  Minus,
  Plus,
  Trash2,
  Receipt,
  CheckCircle2,
  X,
  Loader2,
  ShoppingBag,
  Search,
  Filter,
} from "lucide-react";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({});
  const [updating, setUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const queryClient = useQueryClient();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get("/inventory");
        console.log("Products:", response.data);
        const items = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setProducts(items);
        setFilteredProducts(items);
      } catch (err) {
        setError(err.message);
        toast.error(t("products.error", { error: err.message }));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Fetch budgets
    const fetchBudgets = async () => {
      try {
        const response = await axiosInstance.get("/budget");
        console.log("Budgets:", response.data);

        const approvedBudgets = response.data.data.filter(
          (budget) => budget.status === "Approved"
        );

        setBudgets(approvedBudgets);
      } catch (err) {
        console.error("Error fetching budgets:", err);
      }
    };

    fetchBudgets();
  }, [t]);

  // Filter products
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.SKU.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  // Get unique categories
  const categories = [...new Set(products.map((p) => p.category))];

  // עדכון עגלת הקניות
  const updateCart = (productId, amount) => {
    setCart((prevCart) => {
      const newQuantity = Math.max(0, (prevCart[productId] || 0) + amount);
      if (newQuantity === 0) {
        const { [productId]: _, ...rest } = prevCart;
        return rest;
      }
      return {
        ...prevCart,
        [productId]: newQuantity,
      };
    });
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const { [productId]: _, ...rest } = prevCart;
      return rest;
    });
  };

  // שליחת הנתונים לאחר בחירת תקציב
  const handleSubmitInventoryUpdate = async () => {
    if (!selectedBudget) {
      toast.error(t("products.errors.no_budget_selected"));
      return;
    }

    const selectedProducts = Object.entries(cart)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p._id === productId);
        return {
          productId,
          quantity,
          unitPrice: product.unitPrice,
          totalPrice: product.unitPrice * quantity,
        };
      });

    if (selectedProducts.length === 0) {
      toast.error(t("products.errors.no_products_in_cart"));
      return;
    }

    try {
      setUpdating(true);

      await Promise.all(
        selectedProducts.map((item) =>
          axiosInstance.put(`/inventory/${item.productId}`, {
            quantity: item.quantity,
          })
        )
      );

      await axiosInstance.put(`/budget/${selectedBudget}`, {
        items: selectedProducts,
      });

      toast.success(t("products.success.inventory_updated"));
      setUpdating(false);

      queryClient.invalidateQueries();
      setCart({});
      setShowModal(false);
    } catch (err) {
      console.error("Error:", err);
      toast.error(t("products.errors.update_failed", { message: err.message }));
      setUpdating(false);
    }
  };

  // Cart calculations
  const cartItems = Object.entries(cart).filter(([, quantity]) => quantity > 0);
  const totalCost = cartItems.reduce((acc, [productId, quantity]) => {
    const product = products.find((p) => p._id === productId);
    return acc + (product?.unitPrice || 0) * quantity;
  }, 0);

  const totalItems = cartItems.reduce((acc, [, quantity]) => acc + quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600 text-xl font-bold">{t("products.error", { error })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3" style={{ color: 'var(--text-color)' }}>
          <ShoppingBag className="w-10 h-10" style={{ color: 'var(--color-primary)' }} />
          {t("products.title")}
        </h1>
        <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
          {t("products.subtitle")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className="rounded-2xl shadow-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 hover:shadow-xl transition-all"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">{t("products.totalProducts")}</p>
              <p className="text-3xl font-extrabold text-blue-700">{products.length}</p>
            </div>
            <Package className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div
          className="rounded-2xl shadow-lg p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-2 hover:shadow-xl transition-all"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600">{t("products.inCart")}</p>
              <p className="text-3xl font-extrabold text-green-700">{totalItems}</p>
            </div>
            <ShoppingCart className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div
          className="rounded-2xl shadow-lg p-6 bg-gradient-to-br from-purple-50 to-pink-100 border-2 hover:shadow-xl transition-all"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-600">{t("products.cartTotal")}</p>
              <p className="text-3xl font-extrabold text-purple-700">${totalCost.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8" style={{ borderColor: 'var(--border-color)', border: '2px solid' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-secondary)' }} />
              <input
                type="text"
                placeholder={t("products.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-4"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-color)',
                }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-secondary)' }} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-4"
              style={{
                backgroundColor: 'var(--bg-color)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
              }}
            >
              <option value="">{t("products.allCategories")}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {/* Product Image */}
            <div className="relative h-48 overflow-hidden bg-gray-100">
              <img
                src={product.productImage}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
              {cart[product._id] > 0 && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4" />
                  {cart[product._id]}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-6">
              <h3 className="text-xl font-bold mb-3 truncate" style={{ color: 'var(--text-color)' }}>
                {product.productName}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("products.sku")}: <span className="font-semibold">{product.SKU}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("products.category")}: <span className="font-semibold">{product.category}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                    {t("products.shelf_location")}: <span className="font-semibold">{product.inventory?.shelfLocation || "N/A"}</span>
                  </span>
                </div>
              </div>

              {/* Price and Stock */}
              <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-xl font-bold text-green-700">${product.unitPrice}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">{t("products.in_stock")}</p>
                  <p className="text-lg font-bold text-orange-600">{product.inventory?.quantity || 0}</p>
                </div>
              </div>

              {/* Add to Cart Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateCart(product._id, -1)}
                  disabled={!cart[product._id]}
                  className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex-1 text-center">
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {cart[product._id] || 0}
                  </p>
                </div>

                <button
                  onClick={() => updateCart(product._id, 1)}
                  disabled={cart[product._id] >= (product.inventory?.quantity || 0)}
                  className="p-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Cart Section */}
      {cartItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-color)' }}>
              <ShoppingCart className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
              {t("products.cartSummary")}
            </h2>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full font-bold shadow-lg">
              {totalItems} {t("products.items")}
            </div>
          </div>

          {/* Cart Items Preview */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
            <div className="space-y-3">
              {cartItems.map(([productId, quantity]) => {
                const product = products.find((p) => p._id === productId);
                if (!product) return null;
                return (
                  <div key={productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{product.productName}</p>
                        <p className="text-sm text-gray-500">{quantity} × ${product.unitPrice}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      ${(product.unitPrice * quantity).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t-2 border-blue-300 flex items-center justify-between">
              <span className="text-xl font-bold text-gray-800">{t("products.total")}:</span>
              <span className="text-3xl font-extrabold text-blue-600">${totalCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
          >
            <Receipt className="w-6 h-6" />
            {t("products.review_update_inventory")}
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-extrabold flex items-center gap-3" style={{ color: 'var(--text-color)' }}>
                <Receipt className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
                {t("products.modal.title")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-all"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Budget Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                {t("products.modal.selected_Budget")}
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 focus:ring-4"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  borderColor: selectedBudget ? 'var(--color-primary)' : 'var(--border-color)',
                  color: 'var(--text-color)',
                }}
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value)}
              >
                <option value="">{t("products.modal.selectBudget")}</option>
                {budgets.map((budget) => (
                  <option key={budget._id} value={budget._id}>
                    {budget.departmentOrProjectName} - ${budget.amount}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700">
                <ShoppingCart className="w-6 h-6" />
                {t("products.modal.Cart_Summary")}
              </h3>

              {cartItems.length === 0 ? (
                <p className="text-center text-gray-500 py-4">{t("products.modal.no_products")}</p>
              ) : (
                <div className="space-y-3">
                  {cartItems.map(([productId, quantity]) => {
                    const product = products.find((p) => p._id === productId);
                    if (!product) return null;
                    const itemTotal = product.unitPrice * quantity;
                    return (
                      <div
                        key={productId}
                        className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-blue-200"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{product.productName}</p>
                          <p className="text-sm text-gray-500">
                            {quantity} × ${product.unitPrice}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-bold text-green-600">
                            ${itemTotal.toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(productId)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total */}
                  <div className="pt-4 border-t-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-800">{t("products.total")}:</span>
                      <span className="text-3xl font-extrabold text-blue-600">
                        ${totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitInventoryUpdate}
              disabled={updating || !selectedBudget || cartItems.length === 0}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("products.updating")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  {t("products.submit")}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
