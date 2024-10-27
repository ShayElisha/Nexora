import express from 'express';
import { getAll, getById, create, update, remove } from '../controllers/financeController.js';

const router = express.Router();

router.get('/', getAll);       // קבלת כל העסקאות
router.get('/:id', getById);   // קבלת עסקה לפי ID
router.post('/', create);      // יצירת עסקה חדשה
router.put('/:id', update);    // עדכון עסקה קיימת
router.delete('/:id', remove); // מחיקת עסקה

export default router;
