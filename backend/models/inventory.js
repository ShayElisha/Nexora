import { connectToDatabase } from "../config/sql.js";

// החזרת כל הפריטים במלאי
export const getAllInventory = async () => {
  const pool = await connectToDatabase();
  const result = await pool.request().query("SELECT * FROM Inventory");
  return result.recordset;
};

// החזרת פריט במלאי לפי ID
export const getInventoryById = async (InventoryID) => {
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("InventoryID", InventoryID)
    .query("SELECT * FROM Inventory WHERE InventoryID = @InventoryID");
  return result.recordset[0];
};

// יצירת פריט חדש במלאי
export const createInventory = async (inventoryData) => {
  const { CompanyID, ProductName, Quantity, UnitPrice } = inventoryData;
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("CompanyID", CompanyID)
    .input("ProductName", ProductName)
    .input("Quantity", Quantity)
    .input("UnitPrice", UnitPrice).query(`
            INSERT INTO Inventory (CompanyID, ProductName, Quantity, UnitPrice)
            VALUES (@CompanyID, @ProductName, @Quantity, @UnitPrice)
        `);
  return result;
};

// עדכון פריט במלאי קיים
export const updateInventory = async (InventoryID, inventoryData) => {
  const { CompanyID, ProductName, Quantity, UnitPrice } = inventoryData;
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("InventoryID", InventoryID)
    .input("CompanyID", CompanyID)
    .input("ProductName", ProductName)
    .input("Quantity", Quantity)
    .input("UnitPrice", UnitPrice).query(`
            UPDATE Inventory
            SET CompanyID = @CompanyID, ProductName = @ProductName, Quantity = @Quantity, UnitPrice = @UnitPrice
            WHERE InventoryID = @InventoryID
        `);
  return result;
};

// מחיקת פריט מהמלאי
export const deleteInventory = async (InventoryID) => {
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("InventoryID", InventoryID)
    .query("DELETE FROM Inventory WHERE InventoryID = @InventoryID");
  return result;
};
