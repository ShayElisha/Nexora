import { getAllFinances, getFinanceById, createFinance, updateFinance, deleteFinance } from '../models/finance.js';

// החזרת כל העסקאות
export const getAll = async (req, res) => {
    try {
        const finances = await getAllFinances();
        res.json(finances);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving finances', error });
    }
};

// החזרת עסקה לפי ID
export const getById = async (req, res) => {
    try {
        const finance = await getFinanceById(req.params.id);
        if (!finance) {
            return res.status(404).json({ message: 'Finance record not found' });
        }
        res.json(finance);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving the finance record', error });
    }
};

// יצירת עסקה חדשה
export const create = async (req, res) => {
    try {
        const newFinance = await createFinance(req.body);
        res.status(201).json({ message: 'Finance record created', newFinance });
    } catch (error) {
        res.status(500).json({ message: 'Error creating finance record', error });
    }
};

// עדכון עסקה קיימת
export const update = async (req, res) => {
    try {
        await updateFinance(req.params.id, req.body);
        res.json({ message: 'Finance record updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating finance record', error });
    }
};

// מחיקת עסקה
export const remove = async (req, res) => {
    try {
        await deleteFinance(req.params.id);
        res.json({ message: 'Finance record deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting finance record', error });
    }
};
