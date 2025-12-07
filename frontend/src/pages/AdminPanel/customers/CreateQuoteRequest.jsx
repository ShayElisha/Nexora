import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios.js";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

const CreateOrderRequest = () => {
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
      console.log("Inventory Data:", res.data.data);
      return res.data.data;
    },
  });

  // Fetch price lists for customer
  const { data: customerPriceLists = [] } = useQuery({
    queryKey: ["price-lists-quote", selectedCustomer],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      const res = await axiosInstance.get(
        `/procurement-advanced/price-lists?priceListType=Customer&status=Active`
      );
      return res.data.data || [];
    },
    enabled: !!selectedCustomer && usePriceList,
  });

  // Auto-select price list when customer is selected
  useEffect(() => {
    if (customerPriceLists.length > 0 && selectedCustomer) {
      const customerSpecific = customerPriceLists.find(
        (pl) => pl.customerId?._id === selectedCustomer || pl.customerId === selectedCustomer
      );
      const generalPriceList = customerPriceLists.find(
        (pl) => !pl.customerId
      );
      setSelectedPriceList(customerSpecific || generalPriceList || null);
      setPriceLists(customerPriceLists);
    } else {
      setSelectedPriceList(null);
      setPriceLists([]);
    }
  }, [customerPriceLists, selectedCustomer]);

  // Destructure products and inventory from the combined data
  const products = inventoryData?.products || [];
  const inventory = inventoryData?.inventory || [];

  // State for order form fields
  // Note: Each order item now includes a "discount" property (in percentage)
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [orderItems, setOrderItems] = useState([
    { product: "", quantity: 1, discount: 0, unitPrice: 0 },
  ]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  // Global discount for the entire order
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [taxRate, setTaxRate] = useState(0);
  const [selectedPriceList, setSelectedPriceList] = useState(null);
  const [priceLists, setPriceLists] = useState([]);
  const [usePriceList, setUsePriceList] = useState(true);

  // Load price from price list when product or quantity changes
  const loadPriceFromPriceList = async (productId, quantity, index) => {
    if (!productId || !usePriceList || !selectedCustomer) {
      const product = products.find((p) => p._id === productId);
      if (product) {
        const updatedItems = [...orderItems];
        updatedItems[index].unitPrice = product.unitPrice || 0;
        setOrderItems(updatedItems);
      }
      return;
    }

    try {
      const res = await axiosInstance.get(
        `/procurement-advanced/price-lists/get-price`,
        {
          params: {
            customerId: selectedCustomer,
            productId: productId,
            quantity: quantity || 1,
          },
        }
      );

      if (res.data.success) {
        const updatedItems = [...orderItems];
        updatedItems[index].unitPrice = Number(res.data.price) || 0;
        updatedItems[index].discountPercent = res.data.discountPercent || 0;
        updatedItems[index].basePrice = res.data.basePrice || res.data.price;
        setOrderItems(updatedItems);
      }
    } catch (error) {
      console.error("Error loading price from price list:", error);
      const product = products.find((p) => p._id === productId);
      if (product) {
        const updatedItems = [...orderItems];
        updatedItems[index].unitPrice = product.unitPrice || 0;
        setOrderItems(updatedItems);
      }
    }
  };

  // Add a new order item
  const handleAddItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { product: "", quantity: 1, discount: 0, unitPrice: 0 },
    ]);
  };

  // Update an order item
  const handleItemChange = async (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = value;
    setOrderItems(updatedItems);

    // If product or quantity changed, reload price from price list
    if (field === "product" || field === "quantity") {
      const productId = field === "product" ? value : updatedItems[index].product;
      const quantity = field === "quantity" ? value : updatedItems[index].quantity;
      if (productId) {
        await loadPriceFromPriceList(productId, quantity, index);
      }
    }
  };

  // Calculate total for the entire order using either global discount or per-item discounts
  const orderSubtotal =
    orderDiscount > 0
      ? orderItems.reduce((acc, item) => {
          const unitPrice = item.unitPrice > 0 
            ? item.unitPrice 
            : (products.find((p) => p._id === item.product)?.unitPrice || 0);
          return acc + unitPrice * item.quantity;
        }, 0) *
        (1 - orderDiscount / 100)
      : orderItems.reduce((acc, item) => {
          const unitPrice = item.unitPrice > 0 
            ? item.unitPrice 
            : (products.find((p) => p._id === item.product)?.unitPrice || 0);
          const discountPercent = item.discount ? Number(item.discount) : 0;
          const discountedUnitPrice = unitPrice * (1 - discountPercent / 100);
          return acc + discountedUnitPrice * item.quantity;
        }, 0);

  const taxAmount = (orderSubtotal * (taxRate || 0)) / 100;
  const orderTotal = orderSubtotal + taxAmount;

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
          unitPrice: item.unitPrice || 0, // Send unitPrice from price list
        })),
        globalDiscount: Number(orderDiscount) || 0,
        taxRate: Number(taxRate) || 0,
        notes: orderNotes,
        paymentTerms: paymentTerms,
      };

      const res = await axiosInstance.post("/CustomerOrder", orderData);
      if (res.data.success) {
        toast.success(t("order.success", "Order created successfully"));
        // Reset the form
        setSelectedCustomer("");
        setOrderItems([{ product: "", quantity: 1, discount: 0, unitPrice: 0 }]);
        setSelectedPriceList(null);
        setOrderDiscount(0);
        setTaxRate(0);
        setDeliveryDate("");
        setOrderNotes("");
        setPaymentTerms("Net 30");
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

            {/* Price List Selection */}
            {selectedCustomer && priceLists.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={usePriceList}
                    onChange={(e) => {
                      setUsePriceList(e.target.checked);
                      if (e.target.checked) {
                        orderItems.forEach((item, index) => {
                          if (item.product) {
                            loadPriceFromPriceList(item.product, item.quantity, index);
                          }
                        });
                      } else {
                        const updatedItems = orderItems.map((item) => {
                          const product = products.find((p) => p._id === item.product);
                          return {
                            ...item,
                            unitPrice: product?.unitPrice || 0,
                          };
                        });
                        setOrderItems(updatedItems);
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <label className="block text-gray-700 font-medium">
                    {t("order.use_price_list", { defaultValue: "Use Price List" })}
                  </label>
                </div>
                {usePriceList && (
                  <select
                    value={selectedPriceList?._id || ""}
                    onChange={(e) => {
                      const priceList = priceLists.find((pl) => pl._id === e.target.value);
                      setSelectedPriceList(priceList || null);
                      orderItems.forEach((item, index) => {
                        if (item.product) {
                          loadPriceFromPriceList(item.product, item.quantity, index);
                        }
                      });
                    }}
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t("order.auto_select_price_list", { defaultValue: "Auto-select (Recommended)" })}</option>
                    {priceLists.map((pl) => (
                      <option key={pl._id} value={pl._id}>
                        {pl.priceListName} {pl.customerId ? `(${pl.customerId.name || pl.customerId})` : "(General)"}
                      </option>
                    ))}
                  </select>
                )}
                {selectedPriceList && usePriceList && (
                  <p className="text-xs mt-1 text-gray-500">
                    {t("order.price_list_active", { defaultValue: "Using" })}: {selectedPriceList.priceListName}
                  </p>
                )}
              </div>
            )}

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
                // Use price from price list if available, otherwise fallback to product unitPrice
                const unitPrice = item.unitPrice > 0 
                  ? item.unitPrice 
                  : (selectedProduct?.unitPrice || 0);
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
                        {t("order.unit_price", "Unit Price")}: {unitPrice.toFixed(2)}
                        {item.basePrice && item.basePrice !== unitPrice && (
                          <span className="ml-2 text-xs text-blue-600">
                            (מקורי: {item.basePrice.toFixed(2)})
                          </span>
                        )}
                      </p>
                      <p>
                        {t("order.discount_applied", "Discount")}:{" "}
                        <span className={item.discountPercent > 0 ? "font-bold text-blue-600" : ""}>
                          {item.discountPercent > 0 ? item.discountPercent.toFixed(2) : appliedDiscount}%
                        </span>
                        {item.discountPercent > 0 && (
                          <span className="ml-1 text-xs text-gray-500">
                            (מרשימת מחירים)
                          </span>
                        )}
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

            {/* Tax Rate */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                {t("order.tax_rate", "Tax Rate (%)")}
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("order.enter_tax_rate", "Enter tax rate (%)")}
              />
            </div>

            {/* Payment Terms */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                {t("order.payment_terms", "Payment Terms")}
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Immediate">{t("order.payment_immediate", "Immediate Payment")}</option>
                <option value="Net 30">{t("order.payment_net_30", "Net 30 Days")}</option>
                <option value="Net 45">{t("order.payment_net_45", "Net 45 Days")}</option>
                <option value="Net 60">{t("order.payment_net_60", "Net 60 Days")}</option>
                <option value="Net 90">{t("order.payment_net_90", "Net 90 Days")}</option>
              </select>
            </div>

            {/* Display order summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <div className="flex justify-between mb-2">
                <span>{t("order.subtotal", "Subtotal")}:</span>
                <span className="font-semibold">{orderSubtotal.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between mb-2">
                  <span>{t("order.tax", "Tax")} ({taxRate}%):</span>
                  <span className="font-semibold">{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="font-bold text-xl">{t("order.total", "Total")}:</span>
                <span className="font-bold text-xl">{orderTotal.toFixed(2)}</span>
              </div>
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

export default CreateOrderRequest;
