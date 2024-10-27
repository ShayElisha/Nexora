import { getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee } from '../models/employees.js';

// החזרת כל העובדים
export const getAll = async (req, res) => {
    try {
        const employees = await getAllEmployees();
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving employees', error });
    }
};

// החזרת עובד לפי ID
export const getById = async (req, res) => {
    try {
        const employee = await getEmployeeById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving the employee', error });
    }
};

// יצירת עובד חדש
export const create = async (req, res) => {
    try {
        const newEmployee = await createEmployee(req.body);
        res.status(201).json({ message: 'Employee created', newEmployee });
    } catch (error) {
        res.status(500).json({ message: 'Error creating employee', error });
    }
};

// עדכון פרטי עובד קיים
export const update = async (req, res) => {
    try {
        await updateEmployee(req.params.id, req.body);
        res.json({ message: 'Employee updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating employee', error });
    }
};

// מחיקת עובד
export const remove = async (req, res) => {
    try {
        await deleteEmployee(req.params.id);
        res.json({ message: 'Employee deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting employee', error });
    }
};

