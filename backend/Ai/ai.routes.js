import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import * as aiController from './ai.controller.js';

const router = express.Router();

// כל ה-routes דורשים אימות
router.use(protectRoute);

/**
 * @route   POST /api/ai/chat
 * @desc    שליחת שאלה ל-AI וקבלת תשובה חכמה
 * @access  Private
 */
router.post('/chat', aiController.chat);

/**
 * @route   GET /api/ai/predictions
 * @desc    קבלת תחזיות עתידיות מבוססות נתונים
 * @access  Private
 */
router.get('/predictions', aiController.getPredictions);

/**
 * @route   GET /api/ai/insights
 * @desc    קבלת תובנות ואנליזה על מצב החברה
 * @access  Private
 */
router.get('/insights', aiController.getInsights);

/**
 * @route   GET /api/ai/summary
 * @desc    סיכום כולל של מצב החברה
 * @access  Private
 */
router.get('/summary', aiController.getCompanySummary);

/**
 * @route   GET /api/ai/comparative
 * @desc    ניתוח השוואתי לתקופות שונות
 * @access  Private
 */
router.get('/comparative', aiController.getComparativeAnalysis);

export default router;

