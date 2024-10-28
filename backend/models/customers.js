import { connectToDatabase } from '../config/sql.js';

// פונקציה להחזרת כל החברות
export const getAllCustomers = async () => {
    const pool = await connectToDatabase();
    const result = await pool.request().query('SELECT * FROM Customers');
    return result.recordset;
};

// פונקציה להחזרת חברה לפי ID
export const getCustomerById = async (id) => {
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('CustomerID', id)
        .query('SELECT * FROM Customers WHERE CustomerID = @CustomerID');
    return result.recordset[0];
};

// פונקציה להוספת חברה חדשה
export const createCustomer = async (companyData) => {
     const { CompanyID, CustomerName, Contact, Phone, Email, Address } = companyData;
     const pool = await connectToDatabase();
     const result = await pool.request()
         .input('CompanyID', CompanyID)
         .input('CustomerName', CustomerName)
         .input('Contact', Contact)
         .input('Phone', Phone)
         .input('Email', Email)
         .input('Address', Address)
         .query(`
             INSERT INTO Customers (CompanyID, CustomerName, Contact, Phone, Email, Address)
             VALUES (@CompanyID, @CustomerName, @Contact, @Phone, @Email, @Address)
         `);
     return result;
 };

// פונקציה לעדכון חברה קיימת
export const updateCustomer = async (id, companyData) => {
     const { CompanyID, CustomerName, Contact, Phone, Email, Address } = companyData; // וודא שמוגדרים המשתנים הנכונים
     const pool = await connectToDatabase();
     const result = await pool.request()
         .input('CustomerID', id) // השתמש ב-ID שנשלח כפרמטר
         .input('CompanyID', CompanyID)
         .input('CustomerName', CustomerName)
         .input('Contact', Contact)
         .input('Phone', Phone)
         .input('Email', Email)
         .input('Address', Address)
         .query(`
             UPDATE Customers
             SET CompanyID = @CompanyID, CustomerName = @CustomerName, Contact = @Contact, Phone = @Phone, Email = @Email, Address = @Address
             WHERE CustomerID = @CustomerID
         `);
     return result;
 };
// פונקציה למחיקת חברה
export const deleteCustomer = async (id) => {
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('CustomerID', id)
        .query('DELETE FROM Customers WHERE CustomerID = @CustomerID');
    return result;
};