import express from 'express';
import { getAll, getById, create, update, remove } from '../controllers/employeesController.js';

const router = express.Router();

router.get('/', getAll);       // קבלת כל העובדים
router.get('/:id', getById);   // קבלת עובד לפי ID
router.post('/', create);      // יצירת עובד חדש
router.put('/:id', update);    // עדכון עובד
router.delete('/:id', remove); // מחיקת עובד

export default router;
