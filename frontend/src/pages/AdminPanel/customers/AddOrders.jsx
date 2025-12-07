import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios.js";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  User,
  Package,
  Calendar,
  MessageSquare,
  DollarSign,
  Plus,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Truck,
} from "lucide-react";

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
    { product: "", quantity: 1, discount: 0, unitPrice: 0 },
  ]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [selectedPriceList, setSelectedPriceList] = useState(null);
  const [priceLists, setPriceLists] = useState([]);
  const [usePriceList, setUsePriceList] = useState(true);
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    contactName: "",
    contactPhone: "",
  });

  // Fetch customer details when customer is selected
  const { data: selectedCustomerData } = useQuery({
    queryKey: ["customer", selectedCustomer],
    queryFn: async () => {
      if (!selectedCustomer) return null;
      const res = await axiosInstance.get(`/customers/${selectedCustomer}`);
      return res.data.data;
    },
    enabled: !!selectedCustomer,
  });

  // Fetch price lists for customer
  const { data: customerPriceLists = [] } = useQuery({
    queryKey: ["price-lists", selectedCustomer],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      const res = await axiosInstance.get(
        `/procurement-advanced/price-lists?priceListType=Customer&status=Active`
      );
      return res.data.data || [];
    },
    enabled: !!selectedCustomer && usePriceList,
  });

  // Memoize price list selection to prevent infinite loops
  const selectedPriceListMemo = useMemo(() => {
    if (!selectedCustomer || !customerPriceLists || customerPriceLists.length === 0) {
      return null;
    }
    
    // Find specific price list for this customer first
    const customerSpecific = customerPriceLists.find(
      (pl) => {
        const plCustomerId = pl.customerId?._id || pl.customerId;
        return plCustomerId && plCustomerId.toString() === selectedCustomer.toString();
      }
    );
    // Otherwise use general customer price list
    const generalPriceList = customerPriceLists.find(
      (pl) => !pl.customerId || pl.customerId === null
    );
    
    return customerSpecific || generalPriceList || null;
  }, [customerPriceLists, selectedCustomer]);

  // Auto-select price list when customer is selected (only update if changed)
  useEffect(() => {
    const newPriceListId = selectedPriceListMemo?._id || selectedPriceListMemo?.id;
    const currentPriceListId = selectedPriceList?._id || selectedPriceList?.id;
    
    if (newPriceListId !== currentPriceListId) {
      setSelectedPriceList(selectedPriceListMemo);
    }
    
    if (customerPriceLists && customerPriceLists.length > 0) {
      setPriceLists(customerPriceLists);
    } else if (!customerPriceLists || customerPriceLists.length === 0) {
      setPriceLists([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPriceListMemo?._id, customerPriceLists?.length]); // Use _id and length to prevent infinite loops

  // Auto-fill shipping address when customer is selected
  useEffect(() => {
    if (selectedCustomerData) {
      setShippingAddress((prev) => ({
        ...prev,
        // Fill address fields with customer data
        street: selectedCustomerData.address || prev.street || "",
        contactName: selectedCustomerData.name || prev.contactName || "",
        contactPhone: selectedCustomerData.phone || prev.contactPhone || "",
      }));
    }
  }, [selectedCustomerData]);

  const handleAddItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { product: "", quantity: 1, discount: 0, unitPrice: 0 },
    ]);
  };

  // Load price from price list when product or quantity changes
  const loadPriceFromPriceList = async (productId, quantity, index) => {
    if (!productId || !usePriceList || !selectedCustomer) {
      // Fallback to product unitPrice
      const product = products.find((p) => p._id === productId);
      if (product) {
        const updatedItems = [...orderItems];
        updatedItems[index].unitPrice = product.unitPrice || 0;
        setOrderItems(updatedItems);
      }
      return;
    }

    // Ensure quantity is a number
    const qty = Number(quantity) || 1;
    
    try {
      console.log(`📞 Fetching price: productId=${productId}, customerId=${selectedCustomer}, quantity=${qty}`);
      const res = await axiosInstance.get(
        `/procurement-advanced/price-lists/get-price`,
        {
          params: {
            customerId: selectedCustomer,
            productId: productId,
            quantity: qty, // Send as number
          },
        }
      );

      if (res.data.success) {
        console.log(`✅ Price received: ${res.data.price}, source: ${res.data.source}, discount: ${res.data.discountPercent || 0}%`);
        const updatedItems = [...orderItems];
        updatedItems[index].unitPrice = Number(res.data.price) || 0;
        updatedItems[index].discountPercent = res.data.discountPercent || 0;
        updatedItems[index].basePrice = res.data.basePrice || res.data.price;
        setOrderItems(updatedItems);
      }
    } catch (error) {
      console.error("❌ Error loading price from price list:", error);
      console.error("Error details:", error.response?.data);
      // Fallback to product unitPrice
      const product = products.find((p) => p._id === productId);
      if (product) {
        const updatedItems = [...orderItems];
        updatedItems[index].unitPrice = product.unitPrice || 0;
        setOrderItems(updatedItems);
      }
    }
  };

  const handleItemChange = async (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = value;
    setOrderItems(updatedItems);

    // If product or quantity changed, reload price from price list
    if (field === "product" || field === "quantity") {
      const productId = field === "product" ? value : updatedItems[index].product;
      // Ensure quantity is a number
      const quantity = field === "quantity" ? Number(value) || 1 : Number(updatedItems[index].quantity) || 1;
      if (productId) {
        console.log(`🔄 Reloading price for productId=${productId}, quantity=${quantity}`);
        await loadPriceFromPriceList(productId, quantity, index);
      }
    }
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length === 1) {
      toast.error(t("order.cannot_remove_last_item"));
      return;
    }
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
    toast.success(t("order.item_removed"));
  };

  const orderSubtotal =
    orderDiscount > 0
      ? orderItems.reduce((acc, item) => {
          // Use price from price list if available, otherwise fallback to product unitPrice
          const unitPrice = item.unitPrice > 0 
            ? item.unitPrice 
            : (products.find((p) => p._id === item.product)?.unitPrice || 0);
          return acc + unitPrice * item.quantity;
        }, 0) *
        (1 - orderDiscount / 100)
      : orderItems.reduce((acc, item) => {
          // Use price from price list if available, otherwise fallback to product unitPrice
          const unitPrice = item.unitPrice > 0 
            ? item.unitPrice 
            : (products.find((p) => p._id === item.product)?.unitPrice || 0);
          const discountPercent = item.discount ? Number(item.discount) : 0;
          const discountedUnitPrice = unitPrice * (1 - discountPercent / 100);
          return acc + discountedUnitPrice * item.quantity;
        }, 0);

  const taxAmount = (orderSubtotal * (taxRate || 0)) / 100;
  const orderTotal = orderSubtotal + taxAmount;

  const handleShippingChange = (field, value) => {
    setShippingAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
    if (!shippingAddress.street || !shippingAddress.city) {
      toast.error(t("order.shipping_required", { defaultValue: "Please provide shipping street and city." }));
      return;
    }

    setLoading(true);
    try {
      const hasShippingData = Object.values(shippingAddress).some((val) =>
        typeof val === "string" ? val.trim().length > 0 : Boolean(val)
      );

      const orderData = {
        customer: selectedCustomer,
        companyId,
        orderDate: new Date(),
        deliveryDate,
        items: orderItems.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
          discount: orderDiscount > 0 ? 0 : Number(item.discount) || 0,
          unitPrice: item.unitPrice || 0, // Send unitPrice from price list
        })),
        globalDiscount: Number(orderDiscount) || 0,
        taxRate: Number(taxRate) || 0,
        notes: orderNotes,
        paymentTerms: paymentTerms,
        shippingAddress: hasShippingData ? shippingAddress : undefined,
        contactPhone: shippingAddress.contactPhone || "",
      };

      const res = await axiosInstance.post("/CustomerOrder", orderData);
      if (res.data.success) {
        toast.success(t("order.success"));
        setSelectedCustomer("");
        setOrderItems([{ product: "", quantity: 1, discount: 0, unitPrice: 0 }]);
        setSelectedPriceList(null);
        setOrderDiscount(0);
        setTaxRate(0);
        setDeliveryDate("");
        setOrderNotes("");
        setPaymentTerms("Net 30");
        setShippingAddress({
          street: "",
          city: "",
          state: "",
          country: "",
          zipCode: "",
          contactName: "",
          contactPhone: "",
        });
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-orange-500 to-red-600">
              <ShoppingCart size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--text-color)' }}>
                {t("order.create_internal_order")}
              </h1>
              <p className="text-lg" style={{ color: 'var(--color-secondary)' }}>
                {t("order.create_order_description")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="rounded-2xl shadow-lg border p-6 lg:p-8"
          style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <User className="inline mr-2" size={16} />
                {t("order.select_customer")} *
              </label>
              {customersLoading ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
                </div>
              ) : (
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                  }}
                  required
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

            {/* Price List Selection */}
            {selectedCustomer && priceLists.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    checked={usePriceList}
                    onChange={(e) => {
                      setUsePriceList(e.target.checked);
                      // Reload prices when toggled
                      if (e.target.checked) {
                        orderItems.forEach((item, index) => {
                          if (item.product) {
                            loadPriceFromPriceList(item.product, item.quantity, index);
                          }
                        });
                      } else {
                        // Reset to product prices
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
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <label className="block text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                    {t("order.use_price_list", { defaultValue: "Use Price List" })}
                  </label>
                </div>
                {usePriceList && (
                  <select
                    value={selectedPriceList?._id || ""}
                    onChange={(e) => {
                      const priceList = priceLists.find((pl) => pl._id === e.target.value);
                      setSelectedPriceList(priceList || null);
                      // Reload prices for all items
                      orderItems.forEach((item, index) => {
                        if (item.product) {
                          loadPriceFromPriceList(item.product, item.quantity, index);
                        }
                      });
                    }}
                    className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                    }}
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
                  <p className="text-xs mt-1" style={{ color: 'var(--color-secondary)' }}>
                    {t("order.price_list_active", { defaultValue: "Using" })}: {selectedPriceList.priceListName}
                  </p>
                )}
              </div>
            )}

            {/* Order Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <Package size={18} />
                  {t("order.order_items")} *
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
                >
                  <Plus size={16} />
                  {t("order.add_item")}
                </button>
              </div>

              {inventoryLoading && selectedCustomer ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
                </div>
              ) : (
                <div className="space-y-4">
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
                    // Use price from price list if available, otherwise fallback to product unitPrice
                    const unitPrice = item.unitPrice > 0 
                      ? item.unitPrice 
                      : (selectedProduct?.unitPrice || 0);
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
                        className="p-4 rounded-xl border relative"
                        style={{ backgroundColor: 'var(--border-color)', borderColor: 'var(--border-color)' }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>
                            {t("order.item")} #{index + 1}
                          </span>
                          {orderItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-2 rounded-lg hover:scale-110 transition-all text-red-500"
                            >
                              <X size={18} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <select
                            value={item.product}
                            onChange={(e) =>
                              handleItemChange(index, "product", e.target.value)
                            }
                            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                            style={{
                              borderColor: 'var(--border-color)',
                              backgroundColor: 'var(--bg-color)',
                              color: 'var(--text-color)',
                            }}
                          >
                            <option value="">{t("order.choose_product")}</option>
                            {products.map((prod) => (
                              <option key={prod._id} value={prod._id}>
                                {prod.productName}
                              </option>
                            ))}
                          </select>

                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQuantity = Number(e.target.value) || 1;
                              handleItemChange(index, "quantity", newQuantity);
                            }}
                            min="1"
                            step="1"
                            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                            style={{
                              borderColor: 'var(--border-color)',
                              backgroundColor: 'var(--bg-color)',
                              color: 'var(--text-color)',
                            }}
                            placeholder={t("order.quantity")}
                          />

                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) =>
                              handleItemChange(index, "discount", e.target.value)
                            }
                            min="0"
                            max="100"
                            disabled={orderDiscount > 0}
                            className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 disabled:opacity-50"
                            style={{
                              borderColor: 'var(--border-color)',
                              backgroundColor: 'var(--bg-color)',
                              color: 'var(--text-color)',
                            }}
                            placeholder={t("order.discount_percent")}
                          />
                        </div>

                        {/* Item Summary */}
                        <div className="mt-3 p-3 rounded-lg grid grid-cols-2 gap-2 text-xs"
                          style={{ backgroundColor: 'var(--bg-color)' }}>
                          <p style={{ color: 'var(--color-secondary)' }}>
                            {t("order.available_stock")}: <span className="font-bold" style={{ color: 'var(--text-color)' }}>{availableStock}</span>
                          </p>
                          <p style={{ color: 'var(--color-secondary)' }}>
                            {t("order.unit_price")}: <span className="font-bold" style={{ color: 'var(--text-color)' }}>{unitPrice.toFixed(2)}</span>
                            {item.basePrice && item.basePrice !== unitPrice && (
                              <span className="ml-2 text-xs" style={{ color: 'var(--color-primary)' }}>
                                (מקורי: {item.basePrice.toFixed(2)})
                              </span>
                            )}
                          </p>
                          <p style={{ color: 'var(--color-secondary)' }}>
                            {t("order.discount_applied")}: <span className="font-bold" style={{ color: item.discountPercent > 0 ? 'var(--color-primary)' : 'var(--text-color)' }}>
                              {item.discountPercent > 0 ? item.discountPercent.toFixed(2) : appliedDiscount}%
                            </span>
                            {item.discountPercent > 0 && (
                              <span className="ml-1 text-xs" style={{ color: 'var(--color-secondary)' }}>
                                (מרשימת מחירים)
                              </span>
                            )}
                          </p>
                          <p style={{ color: 'var(--color-secondary)' }}>
                            {t("order.item_total")}: <span className="font-bold" style={{ color: 'var(--text-color)' }}>{itemTotalPrice.toFixed(2)}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Global Discount */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <DollarSign className="inline mr-2" size={16} />
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
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
                placeholder={t("order.enter_discount")}
              />
            </div>

            {/* Shipping Details */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <Truck className="inline mr-2" size={16} />
                {t("order.shipping_details", { defaultValue: "Shipping Details" })}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={shippingAddress.street}
                  onChange={(e) => handleShippingChange("street", e.target.value)}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("order.street_placeholder", { defaultValue: "Street *" })}
                  required
                />
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => handleShippingChange("city", e.target.value)}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("order.city_placeholder", { defaultValue: "City *" })}
                  required
                />
                <input
                  type="text"
                  value={shippingAddress.state}
                  onChange={(e) => handleShippingChange("state", e.target.value)}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("order.state_placeholder", { defaultValue: "State / Region" })}
                />
                <input
                  type="text"
                  value={shippingAddress.zipCode}
                  onChange={(e) => handleShippingChange("zipCode", e.target.value)}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("order.zip_placeholder", { defaultValue: "ZIP / Postal Code" })}
                />
                <input
                  type="text"
                  value={shippingAddress.country}
                  onChange={(e) => handleShippingChange("country", e.target.value)}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("order.country_placeholder", { defaultValue: "Country" })}
                />
                <input
                  type="text"
                  value={shippingAddress.contactName}
                  onChange={(e) => handleShippingChange("contactName", e.target.value)}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("order.contact_name_placeholder", { defaultValue: "Contact Name" })}
                />
                <input
                  type="text"
                  value={shippingAddress.contactPhone}
                  onChange={(e) => handleShippingChange("contactPhone", e.target.value)}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                  placeholder={t("order.contact_phone_placeholder", { defaultValue: "Contact Phone" })}
                />
              </div>
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <DollarSign className="inline mr-2" size={16} />
                {t("order.tax_rate")} (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
                placeholder={t("order.enter_tax_rate")}
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <DollarSign className="inline mr-2" size={16} />
                {t("order.payment_terms") || "Payment Terms"}
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
              >
                <option value="Immediate">{t("order.payment_immediate") || "Immediate Payment"}</option>
                <option value="Net 30">{t("order.payment_net_30") || "Net 30 Days"}</option>
                <option value="Net 45">{t("order.payment_net_45") || "Net 45 Days"}</option>
                <option value="Net 60">{t("order.payment_net_60") || "Net 60 Days"}</option>
                <option value="Net 90">{t("order.payment_net_90") || "Net 90 Days"}</option>
              </select>
            </div>

            {/* Order Summary */}
            <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: 'var(--border-color)' }}>
              <div className="flex justify-between text-sm" style={{ color: 'var(--color-secondary)' }}>
                <span>{t("order.subtotal")}:</span>
                <span className="font-bold" style={{ color: 'var(--text-color)' }}>{orderSubtotal.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm" style={{ color: 'var(--color-secondary)' }}>
                  <span>{t("order.tax")} ({taxRate}%):</span>
                  <span className="font-bold" style={{ color: 'var(--text-color)' }}>{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <span className="font-bold" style={{ color: 'var(--text-color)' }}>{t("order.total")}:</span>
                <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {orderTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <Calendar className="inline mr-2" size={16} />
                {t("order.delivery_date")}
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
              />
            </div>

            {/* Order Notes */}
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                <MessageSquare className="inline mr-2" size={16} />
                {t("order.notes")}
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows="4"
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                }}
                placeholder={t("order.notes_placeholder")}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--button-text)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  {t("order.submitting")}
                </>
              ) : (
                <>
                  <CheckCircle size={24} />
                  {t("order.submit")}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddOrders;
