import { connectToDatabase } from '../config/sql.js';

// פונקציה להחזרת כל החברות
export const getAllCompanies = async () => {
    const pool = await connectToDatabase();
    const result = await pool.request().query('SELECT * FROM Companies');
    return result.recordset;
};

// פונקציה להחזרת חברה לפי ID
export const getCompanyById = async (id) => {
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('CompanyID', id)
        .query('SELECT * FROM Companies WHERE CompanyID = @CompanyID');
    return result.recordset[0];
};

// פונקציה להוספת חברה חדשה
export const createCompany = async (companyData) => {
    const { CompanyName, Address, Phone, Email, RegistrationDate } = companyData;
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('CompanyName', CompanyName)
        .input('Address', Address)
        .input('Phone', Phone)
        .input('Email', Email)
        .input('RegistrationDate', RegistrationDate)
        .query(`
            INSERT INTO Companies (CompanyName, Address, Phone, Email, RegistrationDate)
            VALUES (@CompanyName, @Address, @Phone, @Email, @RegistrationDate)
        `);
    return result;
};

// פונקציה לעדכון חברה קיימת
export const updateCompany = async (id, companyData) => {
    const { CompanyName, Address, Phone, Email, RegistrationDate } = companyData;
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('CompanyID', id)
        .input('CompanyName', CompanyName)
        .input('Address', Address)
        .input('Phone', Phone)
        .input('Email', Email)
        .input('RegistrationDate', RegistrationDate)
        .query(`
            UPDATE Companies
            SET CompanyName = @CompanyName, Address = @Address, Phone = @Phone, Email = @Email, RegistrationDate = @RegistrationDate
            WHERE CompanyID = @CompanyID
        `);
    return result;
};

// פונקציה למחיקת חברה
export const deleteCompany = async (id) => {
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('CompanyID', id)
        .query('DELETE FROM Companies WHERE CompanyID = @CompanyID');
    return result;
};
