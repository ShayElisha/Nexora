import CustomerOrder from "../models/CustomerOrder.model.js";
import Product from "../models/Product.model.js"; // Used to fetch unitPrice for products
import jwt from "jsonwebtoken";

// Create a new customer order
export const createCustomerOrder = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const companyId = decodedToken?.companyId;
    const {
      customer,
      deliveryDate,
      items,
      globalDiscount = 0,
      notes,
    } = req.body;
    console.log("Received customer order data:", req.body);

    // Validate required fields
    if (!customer || !companyId || !items || !items.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Recalculate each order item (using product unitPrice from DB)
    let computedItems = [];
    let computedOrderTotal = 0;

    for (const item of items) {
      // Fetch the product to get its current unitPrice
      const productDoc = await Product.findById(item.product);
      if (!productDoc) {
        return res
          .status(400)
          .json({ message: `Invalid product: ${item.product}` });
      }
      const unitPrice = productDoc.unitPrice;
      // Use global discount if provided; otherwise, use item discount
      const discount = globalDiscount > 0 ? 0 : Number(item.discount) || 0;
      const discountedUnitPrice = unitPrice * (1 - discount / 100);
      const totalPrice = discountedUnitPrice * Number(item.quantity);

      computedItems.push({
        product: item.product,
        quantity: Number(item.quantity),
        unitPrice,
        discount,
        totalPrice,
      });
      computedOrderTotal += totalPrice;
    }

    // Apply global discount if set
    if (globalDiscount > 0) {
      computedOrderTotal =
        computedOrderTotal * (1 - Number(globalDiscount) / 100);
    }

    const order = new CustomerOrder({
      customer,
      companyId,
      orderDate: new Date(),
      deliveryDate,
      items: computedItems,
      globalDiscount: Number(globalDiscount),
      orderTotal: computedOrderTotal,
      notes,
    });

    const savedOrder = await order.save();
    return res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

// Get all customer orders
export const getCustomerOrders = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const companyId = decodedToken?.companyId;
    const orders = await CustomerOrder.find({ companyId })
      .populate("customer", "name")
      .populate("items.product", "productName");
    console.log("Orders:", orders);
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

// Get a single customer order by its ID
export const getCustomerOrderById = async (req, res) => {
  try {
    const order = await CustomerOrder.findById(req.params.id)
      .populate("customer")
      .populate("companyId")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

// Update an existing customer order by its ID
export const updateCustomerOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const {
      customer,
      companyId,
      deliveryDate,
      items,
      globalDiscount = 0,
      notes,
    } = req.body;

    let computedItems = [];
    let computedOrderTotal = 0;

    if (items && items.length > 0) {
      for (const item of items) {
        // טעינת מידע על המוצר
        const productDoc = await Product.findById(item.product);
        if (!productDoc) {
          return res
            .status(400)
            .json({ message: `Invalid product: ${item.product}` });
        }

        const unitPrice = productDoc.unitPrice;
        const discount =
          Number(globalDiscount) > 0 ? 0 : Number(item.discount) || 0;
        const discountedUnitPrice = unitPrice * (1 - discount / 100);
        const totalPrice = discountedUnitPrice * Number(item.quantity);

        // שמירת isAllocated אם נשלח, אחרת False
        const isAllocated =
          typeof item.isAllocated === "boolean" ? item.isAllocated : false;

        computedItems.push({
          product: item.product,
          quantity: Number(item.quantity),
          unitPrice,
          discount,
          totalPrice: totalPrice.toFixed(3),
          isAllocated,
        });
        computedOrderTotal += totalPrice;
      }
    }

    // הנחה גלובלית
    if (Number(globalDiscount) > 0) {
      computedOrderTotal =
        computedOrderTotal * (1 - Number(globalDiscount) / 100);
    }

    // החלפת מערך items בהזמנה
    const updatedOrder = await CustomerOrder.findByIdAndUpdate(
      orderId,
      {
        customer,
        companyId,
        deliveryDate,
        items: computedItems,
        globalDiscount: Number(globalDiscount),
        orderTotal: computedOrderTotal.toFixed(3),
        notes,
      },
      { new: true }
    )
      .populate("items.product", "productName")
      .populate("customer", "name");
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

// מחיקת הזמנה
export const deleteCustomerOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await CustomerOrder.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

export const getUnallocatedOrders = async (req, res) => {
  try {
    // אימות
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const companyId = decodedToken.companyId;

    // שליפת כל ההזמנות של החברה שיש בהן לפחות פריט אחד לא מוקצה
    // באמצעות התנאי "items.isAllocated": false
    const orders = await CustomerOrder.find({
      companyId,
      "items.isAllocated": false,
    })
      .populate("customer", "name")
      .populate("items.product", "productName");

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching unallocated orders:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};
