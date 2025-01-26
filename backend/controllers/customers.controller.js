import Customer from "../models/customers.model.js";

// Create a new customer
export const createCustomer = async (req, res) => {
  const {
    CustomerName,
    ContactPerson,
    Email,
    Phone,
    Address,
    City,
    Country,
    CustomerType,
    Industry,
    JoinDate,
    LastContactDate,
    Status,
    Notes,
  } = req.body;

  // Validation of required fields
  if (
    !CustomerName ||
    !Email ||
    !Phone ||
    !Address ||
    !City ||
    !Country ||
    !CustomerType
  ) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided.",
    });
  }

  try {
    // Validation of unique email
    const existingCustomer = await Customer.findOne({ Email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this email already exists.",
      });
    }

    const newCustomer = new Customer({
      CustomerName,
      ContactPerson,
      Email,
      Phone,
      Address,
      City,
      Country,
      CustomerType,
      Industry,
      JoinDate,
      LastContactDate,
      Status,
      Notes,
    });

    const savedCustomer = await newCustomer.save();
    res.status(201).json({ success: true, data: savedCustomer });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating customer",
      error: error.message,
    });
  }
};

// Pull all customers
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving customers",
      error: error.message,
    });
  }
};

// Pull customer by id
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving customer",
      error: error.message,
    });
  }
};

// Update customer by allowed fields
export const updateCustomer = async (req, res) => {
  const updates = req.body;
  const allowedUpdates = [
    "CustomerName",
    "ContactPerson",
    "Email",
    "Phone",
    "Address",
    "City",
    "Country",
    "CustomerType",
    "Industry",
    "JoinDate",
    "LastContactDate",
    "Status",
    "Notes",
  ];

  // validation of allowed fields
  const isValidUpdate = Object.keys(updates).every((key) =>
    allowedUpdates.includes(key)
  );
  if (!isValidUpdate) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid update fields." });
  }

  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedCustomer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    res.status(200).json({ success: true, data: updatedCustomer });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating customer",
      error: error.message,
    });
  }
};

// Delete customer by id
export const deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting customer",
      error: error.message,
    });
  }
};
