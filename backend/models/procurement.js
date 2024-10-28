import { connectToDatabase } from "../config/sql.js";

// החזרת כל הרכש
export const getAllProcurement = async () => {
  const pool = await connectToDatabase();
  const result = await pool.request().query("SELECT * FROM Procurement");
  return result.recordset;
};

// החזרת רכש לפי ID
export const getProcurementById = async (ProcurementID) => {
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("ProcurementID", ProcurementID)
    .query("SELECT * FROM Procurement WHERE ProcurementID = @ProcurementID");
  return result.recordset[0];
};

// יצירת רשומת רכש חדשה
export const createProcurement = async (procurementData) => {
  const {
    CompanyID,
    SupplierID,
    ProductName,
    Quantity,
    PurchaseDate,
    TotalCost,
  } = procurementData;
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("CompanyID", CompanyID)
    .input("SupplierID", SupplierID)
    .input("ProductName", ProductName)
    .input("Quantity", Quantity)
    .input("PurchaseDate", PurchaseDate)
    .input("TotalCost", TotalCost).query(`
            INSERT INTO Procurement (CompanyID, SupplierID, ProductName, Quantity, PurchaseDate, TotalCost)
            VALUES (@CompanyID, @SupplierID, @ProductName, @Quantity, @PurchaseDate, @TotalCost)
        `);
  return result;
};

// עדכון רשומת רכש קיימת
export const updateProcurement = async (ProcurementID, procurementData) => {
  const {
    CompanyID,
    SupplierID,
    ProductName,
    Quantity,
    PurchaseDate,
    TotalCost,
  } = procurementData;
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("ProcurementID", ProcurementID)
    .input("CompanyID", CompanyID)
    .input("SupplierID", SupplierID)
    .input("ProductName", ProductName)
    .input("Quantity", Quantity)
    .input("PurchaseDate", PurchaseDate)
    .input("TotalCost", TotalCost).query(`
            UPDATE Procurement
            SET CompanyID = @CompanyID, SupplierID = @SupplierID, ProductName = @ProductName, Quantity = @Quantity, PurchaseDate = @PurchaseDate, TotalCost = @TotalCost
            WHERE ProcurementID = @ProcurementID
        `);
  return result;
};

// מחיקת רשומת רכש
export const deleteProcurement = async (ProcurementID) => {
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("ProcurementID", ProcurementID)
    .query("DELETE FROM Procurement WHERE ProcurementID = @ProcurementID");
  return result;
};
