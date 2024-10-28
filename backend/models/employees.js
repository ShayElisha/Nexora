import { connectToDatabase } from '../config/sql.js';

// החזרת כל העובדים
export const getAllEmployees = async () => {
    const pool = await connectToDatabase();
    const result = await pool.request().query('SELECT * FROM Employees');
    return result.recordset;
};

// החזרת עובד לפי ID
export const getEmployeeById = async (EmployeeID) => {
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('EmployeeID', EmployeeID)
        .query('SELECT * FROM Employees WHERE EmployeeID = @EmployeeID');
    return result.recordset[0];
};

// הוספת עובד חדש
export const createEmployee = async (employeeData) => {
    const { CompanyID, EmployeeName, Role, Phone, Email, HireDate, IsAuthorized } = employeeData;
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('CompanyID', CompanyID)
        .input('EmployeeName', EmployeeName)
        .input('Role', Role)
        .input('Phone', Phone)
        .input('Email', Email)
        .input('HireDate', HireDate)
        .input('IsAuthorized', IsAuthorized)
        .query(`
            INSERT INTO Employees (CompanyID, EmployeeName, Role, Phone, Email, HireDate, IsAuthorized)
            VALUES (@CompanyID, @EmployeeName, @Role, @Phone, @Email, @HireDate, @IsAuthorized)
        `);
    return result;
};

// עדכון פרטי עובד
export const updateEmployee = async (EmployeeID, employeeData) => {
    const { CompanyID, EmployeeName, Role, Phone, Email, HireDate, IsAuthorized } = employeeData;
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('EmployeeID', EmployeeID)
        .input('CompanyID', CompanyID)
        .input('EmployeeName', EmployeeName)
        .input('Role', Role)
        .input('Phone', Phone)
        .input('Email', Email)
        .input('HireDate', HireDate)
        .input('IsAuthorized', IsAuthorized)
        .query(`
            UPDATE Employees
            SET CompanyID = @CompanyID, EmployeeName = @EmployeeName, Role = @Role, Phone = @Phone, Email = @Email, HireDate = @HireDate, IsAuthorized = @IsAuthorized
            WHERE EmployeeID = @EmployeeID
        `);
    return result;
};

// מחיקת עובד
export const deleteEmployee = async (EmployeeID) => {
    const pool = await connectToDatabase();
    const result = await pool.request()
        .input('EmployeeID', EmployeeID)
        .query('DELETE FROM Employees WHERE EmployeeID = @EmployeeID');
    return result;
};
