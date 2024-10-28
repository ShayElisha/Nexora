import mssql from 'mssql'; // הקפד להשתמש בשם הנכון של המודול

// קביעת תצורת החיבור
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'DB_Password',
    server: process.env.DB_SERVER || 'localhost', // בדרך כלל localhost אם הוא מקומי
    database: process.env.DB_NAME || 'Nexora',
    options: {
        encrypt: true, // במקרה של Azure
        trustServerCertificate: true // לשימוש מקומי
    }
};

// יצירת חיבור ל-SQL Server
export const connectToDatabase = async () => {
    try {
        const pool = await mssql.connect(config); // שימוש ב-mssql.connect במקום sql.connect
        console.log('Connected to SQL Server');
        return pool; // מחזיר את ה-pool של החיבור
    } catch (err) {
        console.error('Database connection failed', err);
        throw err; // להפסיק את התהליך במקרה של שגיאה
    }
};

