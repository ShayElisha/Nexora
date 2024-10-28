import { connectToDatabase } from "../config/sql.js";

// החזרת כל הספקים
export const getAllSuppliers = async () => {
  const pool = await connectToDatabase();
  const result = await pool.request().query("SELECT * FROM Suppliers");
  return result.recordset;
};

// החזרת ספק לפי ID
export const getSupplierById = async (SupplierID) => {
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("SupplierID", SupplierID)
    .query("SELECT * FROM Suppliers WHERE SupplierID = @SupplierID");
  return result.recordset[0];
};

// יצירת ספק חדש
export const createSupplier = async (supplierData) => {
  const { CompanyID, SupplierName, Contact, Phone, Email, Address } =
    supplierData;
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("CompanyID", CompanyID)
    .input("SupplierName", SupplierName)
    .input("Contact", Contact)
    .input("Phone", Phone)
    .input("Email", Email)
    .input("Address", Address).query(`
            INSERT INTO Suppliers (CompanyID, SupplierName, Contact, Phone, Email, Address)
            VALUES (@CompanyID, @SupplierName, @Contact, @Phone, @Email, @Address)
        `);
  return result;
};

// עדכון פרטי ספק קיים
export const updateSupplier = async (SupplierID, supplierData) => {
  const { CompanyID, SupplierName, Contact, Phone, Email, Address } =
    supplierData;
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("SupplierID", SupplierID)
    .input("CompanyID", CompanyID)
    .input("SupplierName", SupplierName)
    .input("Contact", Contact)
    .input("Phone", Phone)
    .input("Email", Email)
    .input("Address", Address).query(`
            UPDATE Suppliers
            SET CompanyID = @CompanyID, SupplierName = @SupplierName, Contact = @Contact, Phone = @Phone, Email = @Email, Address = @Address
            WHERE SupplierID = @SupplierID
        `);
  return result;
};

// מחיקת ספק
export const deleteSupplier = async (SupplierID) => {
  const pool = await connectToDatabase();
  const result = await pool
    .request()
    .input("SupplierID", SupplierID)
    .query("DELETE FROM Suppliers WHERE SupplierID = @SupplierID");
  return result;
};
