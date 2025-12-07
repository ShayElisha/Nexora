import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollEmployee,
  getEnrollments,
  updateEnrollmentProgress,
  submitAssessment,
  getEmployeeCourses,
  getLMSStatistics,
} from "../controllers/lms.controller.js";

const router = express.Router();

// Course routes
router.post("/courses", createCourse);
router.get("/courses", getCourses);
router.get("/courses/:id", getCourseById);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// Enrollment routes
router.post("/enrollments", enrollEmployee);
router.get("/enrollments", getEnrollments);
router.put("/enrollments/:enrollmentId/progress", updateEnrollmentProgress);
router.post("/enrollments/:enrollmentId/assessment", submitAssessment);

// Employee courses
router.get("/employees/:employeeId/courses", getEmployeeCourses);

// Statistics
router.get("/statistics", getLMSStatistics);

export default router;

