import express from 'express';
import { getAll, getById, create, update, remove } from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/', getAll);       // קבלת כל הפריטים במלאי
router.get('/:id', getById);   // קבלת פריט במלאי לפי ID
router.post('/', create);      // יצירת פריט חדש במלאי
router.put('/:id', update);    // עדכון פריט במלאי קיים
router.delete('/:id', remove); // מחיקת פריט מהמלאי

export default router;
