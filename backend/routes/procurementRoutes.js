import express from 'express';
import { getAll, getById, create, update, remove } from '../controllers/procurementController.js';

const router = express.Router();

router.get('/', getAll);       // קבלת כל רשומות הרכש
router.get('/:id', getById);   // קבלת רשומת רכש לפי ID
router.post('/', create);      // יצירת רשומת רכש חדשה
router.put('/:id', update);    // עדכון רשומת רכש קיימת
router.delete('/:id', remove); // מחיקת רשומת רכש

export default router;
