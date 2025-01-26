import { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { toast } from "react-hot-toast";
// נוספה יבוא של useQueryClient
import { useQueryClient } from "@tanstack/react-query";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({});
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState("");

  // הוספנו את השורה הזאת כדי שנוכל להשתמש ב-invalidateQueries
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get("/inventory");
        console.log("Products:", response.data);
        const items = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setProducts(items);
      } catch (err) {
        setError(err.message);
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

        // סינון התקציבים שהסטטוס שלהם הוא "Approved"
        const approvedBudgets = response.data.data.filter(
          (budget) => budget.status === "Approved"
        );

        setBudgets(approvedBudgets);
      } catch (err) {
        console.error("Error fetching budgets:", err);
      }
    };

    fetchBudgets();
  }, []);

  // עדכון עגלת הקניות
  const updateCart = (productId, amount) => {
    setCart((prevCart) => ({
      ...prevCart,
      [productId]: Math.max(0, (prevCart[productId] || 0) + amount),
    }));
  };

  // שליחת הנתונים לאחר בחירת תקציב
  const handleSubmitInventoryUpdate = async () => {
    if (!selectedBudget) {
      toast.warn("Please select a budget.");
      return;
    }

    // 1) סינון המוצרים שנבחרו
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
      toast.warn("No products selected.");
      return;
    }

    try {
      setUpdating(true);

      // 2) עדכון מלאי
      await Promise.all(
        selectedProducts.map((item) =>
          axiosInstance.put(`/inventory/${item.productId}`, {
            quantity: -item.quantity,
          })
        )
      );

      // 3) עדכון תקציב
      await axiosInstance.put(`/budget/${selectedBudget}`, {
        items: selectedProducts,
      });

      // 4) הצלחה
      toast.success("Inventory and budget updated successfully!");
      setUpdating(false);

      // >>> שינוי מינימלי: invalidateQueries + איפוס עגלה וסגירת מודאל
      queryClient.invalidateQueries(); // ניתן לשים מפתחות ספציפיים, למשל ["inventory"] או ["budget"] וכו'
      setCart({});
      setShowModal(false);
    } catch (err) {
      console.error("Error:", err);
      toast.error(
        `Failed to update: ${err.response?.data?.message || err.message}`
      );
      setUpdating(false);
    }
  };

  if (loading)
    return <p className="text-center text-gray-500 text-xl">Loading...</p>;
  if (error)
    return (
      <p className="text-center text-red-500 text-xl">
        Error loading products: {error}
      </p>
    );

  // חישוב הפריטים לעגלת הקניות (רק אלה עם כמות > 0)
  const cartItems = Object.entries(cart).filter(([, quantity]) => quantity > 0);

  // חישוב סכום כולל
  const totalCost = cartItems.reduce((acc, [productId, quantity]) => {
    const product = products.find((p) => p._id === productId);
    return acc + product.unitPrice * quantity;
  }, 0);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
        Product Details
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white shadow-xl rounded-2xl overflow-hidden p-8 border border-gray-200 transition-transform transform hover:scale-105 hover:shadow-2xl duration-300"
          >
            <img
              src={product.productImage}
              alt={product.productName}
              className="h-56 w-full object-cover rounded-lg mb-6 border border-gray-300"
            />
            <div className="grid grid-cols-2 gap-4">
              <h2 className="text-3xl font-bold text-purple-700 col-span-2 text-center mb-4">
                {product.productName}
              </h2>

              <p className="text-gray-500 text-sm text-right">
                <strong>SKU:</strong> {product.SKU}
              </p>
              <p className="text-gray-500 text-sm text-left">
                <strong>Category:</strong> {product.category}
              </p>

              <p className="text-lg font-semibold text-green-600 text-right">
                <strong>Unit Price:</strong> ${product.unitPrice}
              </p>

              {/* כמות במלאי */}
              <p className="text-lg font-semibold text-orange-600 text-left col-span-2 text-center">
                <strong>In Stock:</strong> {product.inventory.quantity}
              </p>

              <div className="flex items-center justify-center gap-6 col-span-2 mt-4">
                <button
                  onClick={() => updateCart(product._id, -1)}
                  disabled={!cart[product._id]}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-300 disabled:opacity-50"
                >
                  -
                </button>
                <p className="text-xl font-bold text-blue-700">
                  {cart[product._id] || 0}
                </p>
                <button
                  onClick={() => updateCart(product._id, 1)}
                  disabled={cart[product._id] >= product.inventory.quantity}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <button
          onClick={() => setShowModal(true)}
          className="px-8 py-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        >
          Review & Update Inventory
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          {/* תוכן המודאל */}
          <div className="bg-white rounded-lg p-6 w-1/3 relative">
            {/* כפתור X לסגירת המודאל */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 font-bold text-lg"
            >
              X
            </button>

            <h2 className="text-2xl font-bold mb-4 text-center">
              Select Budget
            </h2>
            <select
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
            >
              <option value="">Select Budget</option>
              {budgets.map((budget) => (
                <option key={budget._id} value={budget._id}>
                  {budget.departmentOrProjectName} - amount: ${budget.amount}
                </option>
              ))}
            </select>

            <h3 className="text-lg font-semibold mb-4 text-center">
              Cart Summary
            </h3>
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center">No products selected.</p>
            ) : (
              <>
                <ul className="text-gray-700 mb-4">
                  {cartItems.map(([productId, quantity]) => {
                    const product = products.find((p) => p._id === productId);
                    const itemTotal = product.unitPrice * quantity;
                    return (
                      <li key={productId} className="mb-2">
                        <strong>{product.productName}</strong> x {quantity} ={" "}
                        <span className="font-semibold text-green-600">
                          ${itemTotal.toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="text-right mb-4">
                  <span className="font-bold">Total: </span>
                  <span className="text-blue-600 font-bold">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </>
            )}

            <button
              onClick={handleSubmitInventoryUpdate}
              className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition duration-300 w-full"
              disabled={updating}
            >
              {updating ? "Updating..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
