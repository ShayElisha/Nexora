import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios.js";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

const AddOrders = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await axiosInstance.get("/auth/me");
      return res.data;
    },
  });

  const companyId = authData?.user?.companyId;

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/customers`);
      console.log("Customers:", res.data.data);
      return res.data.data;
    },
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventoryInfo"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/inventory/productsInfo`);
      return res.data.data;
    },
  });

  const products = inventoryData?.products || [];
  const inventory = inventoryData?.inventory || [];

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [orderItems, setOrderItems] = useState([
    { product: "", quantity: 1, discount: 0 },
  ]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderDiscount, setOrderDiscount] = useState(0);

  const handleAddItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { product: "", quantity: 1, discount: 0 },
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = value;
    setOrderItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length === 1) {
      toast.error(t("order.cannot_remove_last_item"));
      return;
    }
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
    toast.success(t("order.item_removed"));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error(t("order.customer_required"));
      return;
    }
    if (
      orderItems.length === 0 ||
      orderItems.some((item) => !item.product || item.quantity < 1)
    ) {
      toast.error(t("order.item_required"));
      return;
    }
    setLoading(true);
    try {
      const orderData = {
        customer: selectedCustomer,
        companyId,
        orderDate: new Date(),
        deliveryDate,
        items: orderItems.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
          discount: orderDiscount > 0 ? 0 : Number(item.discount) || 0,
        })),
        globalDiscount: Number(orderDiscount) || 0,
        notes: orderNotes,
      };

      const res = await axiosInstance.post("/CustomerOrder", orderData);
      if (res.data.success) {
        toast.success(t("order.success"));
        setSelectedCustomer("");
        setOrderItems([{ product: "", quantity: 1, discount: 0 }]);
        setOrderDiscount(0);
        setDeliveryDate("");
        setOrderNotes("");
      } else {
        toast.error(res.data.message || t("order.error"));
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.response?.data?.message || t("order.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 animate-fade-in">
      {authLoading ? (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
        </div>
      ) : (
        <div className="w-full max-w-3xl bg-accent p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-extrabold text-text mb-8 tracking-tight drop-shadow-md text-center">
            {t("order.create_internal_order")}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer selection */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t("order.select_customer")}
              </label>
              {customersLoading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
                </div>
              ) : (
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full p-3 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200 border border-border-color"
                >
                  <option value="">{t("order.choose_customer")}</option>
                  {customers.map((cust) => (
                    <option key={cust._id} value={cust._id}>
                      {cust.name} ({cust.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Order items */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t("order.order_items")}
              </label>
              {selectedCustomer && inventoryLoading && (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
                </div>
              )}
              {orderItems.map((item, index) => {
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
                  <div
                    key={index}
                    className="mb-4 bg-bg p-4 rounded-md shadow-sm border border-border-color relative transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-full sm:w-1/2">
                        <select
                          value={item.product}
                          onChange={(e) =>
                            handleItemChange(index, "product", e.target.value)
                          }
                          className="w-full p-3 rounded-md bg-accent text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200 border border-border-color"
                        >
                          <option value="">{t("order.choose_product")}</option>
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
                              toast.error(t("order.exceeds_stock"));
                              return;
                            }
                            handleItemChange(index, "quantity", newQuantity);
                          }}
                          min="1"
                          max={availableStock}
                          className="w-full p-3 rounded-md bg-accent text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200 border border-border-color"
                          placeholder={t("order.quantity")}
                        />
                      </div>
                      <div className="w-full sm:w-1/4">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            handleItemChange(index, "discount", e.target.value)
                          }
                          min="0"
                          max="100"
                          disabled={orderDiscount > 0}
                          className="w-full p-3 rounded-md bg-accent text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200 border border-border-color disabled:opacity-50"
                          placeholder={t("order.discount")}
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-text opacity-80 grid grid-cols-2 gap-2">
                      <p>
                        {t("order.available_stock")}: {availableStock}
                      </p>
                      <p>
                        {t("order.unit_price")}: {unitPrice}
                      </p>
                      <p>
                        {t("order.discount_applied")}: {appliedDiscount}%
                      </p>
                      <p>
                        {t("order.item_total")}: {itemTotalPrice.toFixed(2)}
                      </p>
                    </div>
                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="absolute -top-3 right-3 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-all duration-200 transform hover:scale-110"
                        title={t("order.remove_item")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleAddItem}
                className="text-primary underline hover:text-secondary transition-all duration-200 font-medium"
              >
                {t("order.add_item")}
              </button>
            </div>

            {/* Global Order Discount */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t("order.global_discount")}
              </label>
              <input
                type="number"
                value={orderDiscount}
                onChange={(e) => {
                  const newDiscount = Number(e.target.value);
                  setOrderDiscount(newDiscount);
                  if (newDiscount > 0) {
                    setOrderItems((prev) =>
                      prev.map((item) => ({ ...item, discount: 0 }))
                    );
                  }
                }}
                min="0"
                max="100"
                className="w-full p-3 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200 border border-border-color"
                placeholder={t("order.global_discount")}
              />
            </div>

            {/* Display overall order total */}
            <div className="text-right font-semibold text-xl text-text bg-bg p-3 rounded-md shadow-sm">
              {t("order.total")}: {orderTotal.toFixed(2)}
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t("order.delivery_date")}
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-3 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200 border border-border-color"
              />
            </div>

            {/* Order Notes */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t("order.notes")}
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows="4"
                className="w-full p-3 rounded-md bg-bg text-text shadow-sm focus:ring-2 focus:ring-primary transition-all duration-200 border border-border-color"
                placeholder={t("order.notes_placeholder")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-button-bg text-button-text py-3 rounded-full shadow-md hover:bg-secondary transition-all duration-200 disabled:opacity-50 font-semibold"
            >
              {loading ? t("order.submitting") : t("order.submit")}
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AddOrders;
