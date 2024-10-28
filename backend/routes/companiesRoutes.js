import express from 'express';
import { getAll, getById, create, update, remove } from '../controllers/companiesController.js';

const router = express.Router();

router.get('/', getAll);       // קבלת כל החברות
router.get('/:id', getById);   // קבלת חברה לפי ID
router.post('/', create);      // יצירת חברה חדשה
router.put('/:id', update);    // עדכון חברה
router.delete('/:id', remove); // מחיקת חברה

export default router;
