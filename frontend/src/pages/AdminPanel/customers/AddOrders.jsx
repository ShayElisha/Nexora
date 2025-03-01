import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios.js";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
const AddOrders = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Fetch authenticated user data
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await axiosInstance.get("/auth/me");
      return res.data;
    },
  });

  // Assume companyId exists at authData.user.companyId
  const companyId = authData?.user?.companyId;

  // Fetch customers for the company
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/customers`);
      console.log("Customers:", res.data.data);
      return res.data.data;
    },
  });

  // Fetch combined products and inventory data from backend
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventoryInfo"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/inventory/productsInfo`);
      return res.data.data;
    },
  });

  // Destructure products and inventory from the combined data
  const products = inventoryData?.products || [];
  const inventory = inventoryData?.inventory || [];

  // State for order form fields
  // Note: Each order item now includes a "discount" property (in percentage)
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [orderItems, setOrderItems] = useState([
    { product: "", quantity: 1, discount: 0 },
  ]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  // Global discount for the entire order
  const [orderDiscount, setOrderDiscount] = useState(0);

  // Add a new order item
  const handleAddItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { product: "", quantity: 1, discount: 0 },
    ]);
  };

  // Update an order item
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = value;
    setOrderItems(updatedItems);
  };

  // Calculate total for the entire order using either global discount or per-item discounts
  const orderTotal =
    orderDiscount > 0
      ? orderItems.reduce((acc, item) => {
          const selectedProduct = products.find((p) => p._id === item.product);
          const unitPrice = selectedProduct ? selectedProduct.unitPrice : 0;
          return acc + unitPrice * item.quantity;
        }, 0) *
        (1 - orderDiscount / 100)
      : orderItems.reduce((acc, item) => {
          const selectedProduct = products.find((p) => p._id === item.product);
          const unitPrice = selectedProduct ? selectedProduct.unitPrice : 0;
          const discountPercent = item.discount ? Number(item.discount) : 0;
          const discountedUnitPrice = unitPrice * (1 - discountPercent / 100);
          return acc + discountedUnitPrice * item.quantity;
        }, 0);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error(t("order.customer_required", "Please select a customer."));
      return;
    }
    if (
      orderItems.length === 0 ||
      orderItems.some((item) => !item.product || item.quantity < 1)
    ) {
      toast.error(
        t(
          "order.item_required",
          "Please add at least one order item with product and quantity."
        )
      );
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        customer: selectedCustomer,
        companyId,
        orderDate: new Date(), // Can also be set server-side
        deliveryDate,
        items: orderItems.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
          // If a global discount is applied, individual item discounts are ignored.
          discount: orderDiscount > 0 ? 0 : Number(item.discount) || 0,
        })),
        globalDiscount: Number(orderDiscount) || 0,
        notes: orderNotes,
      };

      const res = await axiosInstance.post("/CustomerOrder", orderData);
      if (res.data.success) {
        toast.success(t("order.success", "Order created successfully"));
        // Reset the form
        setSelectedCustomer("");
        setOrderItems([{ product: "", quantity: 1, discount: 0 }]);
        setOrderDiscount(0);
        setDeliveryDate("");
        setOrderNotes("");
      } else {
        toast.error(
          res.data.message || t("order.error", "Error creating order")
        );
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(
        error.response?.data?.message ||
          t("order.error", "Error creating order")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      {authLoading ? (
        <p>{t("loading", "Loading...")}</p>
      ) : (
        <div className="w-full max-w-3xl bg-white p-8 rounded shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-8">
            {t("order.create_internal_order", "Create Internal Order")}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer selection */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                {t("order.select_customer", "Select Customer")}
              </label>
              {customersLoading ? (
                <p>Loading customers...</p>
              ) : (
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {t("order.choose_customer", "Choose a customer")}
                  </option>
                  {customers.map((cust) => (
                    <option key={cust._id} value={cust._id}>
                      {cust.name} ({cust.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Order items */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                {t("order.order_items", "Order Items")}
              </label>
              {selectedCustomer && inventoryLoading && (
                <p>Loading products...</p>
              )}
              {orderItems.map((item, index) => {
                // Find the selected product details and matching inventory item (if any)
                const selectedProduct = products.find(
                  (p) => p._id === item.product
                );
                const productInventory = inventory.find(
                  (inv) => inv.productId.toString() === item.product.toString()
                );
                const availableStock = productInventory
                  ? productInventory.quantity
                  : 0;
                const unitPrice = selectedProduct
                  ? selectedProduct.unitPrice
                  : 0;
                // If a global discount is applied, use it; otherwise, use the product discount
                const appliedDiscount =
                  orderDiscount > 0
                    ? orderDiscount
                    : item.discount
                    ? Number(item.discount)
                    : 0;
                const discountedUnitPrice =
                  unitPrice * (1 - appliedDiscount / 100);
                const itemTotalPrice = discountedUnitPrice * item.quantity;

                return (
                  <div key={index} className="mb-4 border-b pb-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-full sm:w-1/2">
                        <select
                          value={item.product}
                          onChange={(e) =>
                            handleItemChange(index, "product", e.target.value)
                          }
                          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">
                            {t("order.choose_product", "Choose a product")}
                          </option>
                          {products.map((prod) => (
                            <option key={prod._id} value={prod._id}>
                              {prod.productName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-1/4">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = Number(e.target.value);
                            if (newQuantity > availableStock) {
                              toast.error(
                                t(
                                  "order.exceeds_stock",
                                  "Quantity cannot exceed available stock."
                                )
                              );
                              return;
                            }
                            handleItemChange(index, "quantity", newQuantity);
                          }}
                          min="1"
                          max={availableStock}
                          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={t("order.quantity", "Quantity")}
                        />
                      </div>
                      <div className="w-full sm:w-1/4">
                        <label className="block text-gray-700 font-medium mb-1">
                          {t("order.discount", "Discount %")}
                        </label>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            handleItemChange(index, "discount", e.target.value)
                          }
                          min="0"
                          max="100"
                          disabled={orderDiscount > 0}
                          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={t("order.discount", "Discount %")}
                        />
                      </div>
                    </div>
                    {/* Display available stock, unit price, discount and total price for this item */}
                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        {t("order.available_stock", "Available Stock")}:{" "}
                        {availableStock}
                      </p>
                      <p>
                        {t("order.unit_price", "Unit Price")}: {unitPrice}
                      </p>
                      <p>
                        {t("order.discount_applied", "Discount")}:{" "}
                        {appliedDiscount}%
                      </p>
                      <p>
                        {t("order.item_total", "Item Total")}:{" "}
                        {itemTotalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleAddItem}
                className="text-blue-600 underline"
              >
                {t("order.add_item", "Add another item")}
              </button>
            </div>

            {/* Global Order Discount */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                {t("order.global_discount", "Global Discount (%)")}
              </label>
              <input
                type="number"
                value={orderDiscount}
                onChange={(e) => {
                  const newDiscount = Number(e.target.value);
                  setOrderDiscount(newDiscount);
                  // If a global discount is applied, reset individual discounts to 0.
                  if (newDiscount > 0) {
                    setOrderItems((prev) =>
                      prev.map((item) => ({ ...item, discount: 0 }))
                    );
                  }
                }}
                min="0"
                max="100"
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("order.global_discount", "Global Discount (%)")}
              />
            </div>

            {/* Display overall order total */}
            <div className="text-right font-bold text-xl">
              {t("order.total", "Total")}: {orderTotal.toFixed(2)}
            </div>

            {/* Delivery Date */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                {t("order.delivery_date", "Delivery Date (optional)")}
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Order Notes */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                {t("order.notes", "Notes (optional)")}
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows="4"
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t(
                  "order.notes_placeholder",
                  "Enter additional details..."
                )}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition duration-300"
            >
              {loading
                ? t("order.submitting", "Submitting...")
                : t("order.submit", "Submit Order")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddOrders;
