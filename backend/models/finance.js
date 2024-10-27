import { connectToDatabase } from '../config/sql.js';

// החזרת כל העסקאות
export const getAllFinances = async () => {
    const pool = await connectToDatabase();
    const result = await pool.request().query('SELECT * FROM Finance');
    return result.recordset;
};

// החזרת עסקה לפי ID
export const getFinanceById = async (FinanceID) => {
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('FinanceID', FinanceID)
        .query('SELECT * FROM Finance WHERE FinanceID = @FinanceID');
    return result.recordset[0];
};

// יצירת עסקה חדשה
export const createFinance = async (financeData) => {
    const { CompanyID, TransactionDate, Description, Amount, Type } = financeData;
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('CompanyID', CompanyID)
        .input('TransactionDate', TransactionDate)
        .input('Description', Description)
        .input('Amount', Amount)
        .input('Type', Type)
        .query(`
            INSERT INTO Finance (CompanyID, TransactionDate, Description, Amount, Type)
            VALUES (@CompanyID, @TransactionDate, @Description, @Amount, @Type)
        `);
    return result;
};

// עדכון עסקה קיימת
export const updateFinance = async (FinanceID, financeData) => {
    const { CompanyID, TransactionDate, Description, Amount, Type } = financeData;
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('FinanceID', FinanceID)
        .input('CompanyID', CompanyID)
        .input('TransactionDate', TransactionDate)
        .input('Description', Description)
        .input('Amount', Amount)
        .input('Type', Type)
        .query(`
            UPDATE Finance
            SET CompanyID = @CompanyID, TransactionDate = @TransactionDate, Description = @Description, Amount = @Amount, Type = @Type
            WHERE FinanceID = @FinanceID
        `);
    return result;
};

// מחיקת עסקה
export const deleteFinance = async (FinanceID) => {
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('FinanceID', FinanceID)
        .query('DELETE FROM Finance WHERE FinanceID = @FinanceID');
    return result;
};
