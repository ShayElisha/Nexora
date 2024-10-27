import express from 'express';
import dotenv from 'dotenv';
// ייבוא הנתיבים
import companyRoutes from './routes/companiesRoutes.js'; 
import customerRoutes from './routes/customersRoute.js'
import employeeRoutes from './routes/employeesRoutes.js'; 
import financeRoutes from './routes/financeRoutes.js'; 
import inventoryRoutes from './routes/inventoryRoutes.js'; 
import procurementRoutes from './routes/procurementRoutes.js'; 
import suppliersRoutes from './routes/suppliersRoutes.js'; 



dotenv.config();
const app = express();
app.use(express.json()); // תמיכה ב-JSON

// שימוש בנתיבים של החברות
app.use('/companies', companyRoutes);
app.use('/customers', customerRoutes);
app.use('/employees', employeeRoutes);
app.use('/finance', financeRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/procurement', procurementRoutes);
app.use('/suppliers', suppliersRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
