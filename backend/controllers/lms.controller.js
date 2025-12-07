import Course from "../models/Course.model.js";
import CourseEnrollment from "../models/CourseEnrollment.model.js";
import Employee from "../models/employees.model.js";
import jwt from "jsonwebtoken";

// Helper to get user from token
const getUserFromToken = (req) => {
  const token = req.cookies["auth_token"];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// ============ COURSES ============

// Create course
export const createCourse = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const course = new Course({
      ...req.body,
      companyId: user.companyId || req.body.companyId,
      createdBy: user.userId || user.id,
    });

    await course.save();
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all courses
export const getCourses = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { status, category, level, search } = req.query;
    const query = { companyId: user.companyId || req.query.companyId };

    if (status) query.status = status;
    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await Course.find(query)
      .populate("instructor", "name lastName email")
      .populate("createdBy", "name lastName")
      .populate("prerequisites", "title")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get course by ID
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name lastName email")
      .populate("createdBy", "name lastName")
      .populate("prerequisites", "title description");

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Delete all enrollments
    await CourseEnrollment.deleteMany({ courseId: req.params.id });

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ ENROLLMENTS ============

// Enroll employee in course
export const enrollEmployee = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { courseId, employeeId } = req.body;
    const companyId = user.companyId || req.body.companyId;

    // Check if already enrolled
    const existing = await CourseEnrollment.findOne({ courseId, employeeId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Employee is already enrolled in this course",
      });
    }

    // Check course capacity
    const course = await Course.findById(courseId);
    if (course.maxEnrollments) {
      const currentEnrollments = await CourseEnrollment.countDocuments({
        courseId,
        status: { $in: ["enrolled", "in_progress"] },
      });
      if (currentEnrollments >= course.maxEnrollments) {
        return res.status(400).json({
          success: false,
          message: "Course is full",
        });
      }
    }

    const enrollment = new CourseEnrollment({
      companyId,
      courseId,
      employeeId: employeeId || user.userId || user.id,
      enrolledBy: user.userId || user.id,
      enrollmentType: employeeId ? "assigned" : "self",
    });

    await enrollment.save();
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get enrollments
export const getEnrollments = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { courseId, employeeId, status } = req.query;
    const query = { companyId: user.companyId || req.query.companyId };

    if (courseId) query.courseId = courseId;
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;

    const enrollments = await CourseEnrollment.find(query)
      .populate("courseId", "title description duration")
      .populate("employeeId", "name lastName email")
      .populate("enrolledBy", "name lastName")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update enrollment progress
export const updateEnrollmentProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { moduleId, lessonId, progress } = req.body;

    const enrollment = await CourseEnrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    // Update progress
    if (progress !== undefined) {
      enrollment.progress = progress;
    }

    // Mark lesson as completed
    if (moduleId && lessonId) {
      const existing = enrollment.lessonsCompleted.find(
        (l) => l.moduleId === moduleId && l.lessonId === lessonId
      );
      if (!existing) {
        enrollment.lessonsCompleted.push({ moduleId, lessonId });
      }
    }

    enrollment.lastAccessedAt = new Date();
    if (enrollment.progress === 100 && enrollment.status === "in_progress") {
      enrollment.status = "completed";
      enrollment.completedAt = new Date();
    } else if (enrollment.status === "enrolled" && enrollment.progress > 0) {
      enrollment.status = "in_progress";
      enrollment.startedAt = enrollment.startedAt || new Date();
    }

    await enrollment.save();
    res.json({ success: true, data: enrollment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Submit assessment
export const submitAssessment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { answers } = req.body;

    const enrollment = await CourseEnrollment.findById(enrollmentId)
      .populate("courseId");
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    const course = enrollment.courseId;
    if (!course.assessment?.enabled) {
      return res.status(400).json({
        success: false,
        message: "Assessment is not enabled for this course",
      });
    }

    // Calculate score
    let score = 0;
    let maxScore = 0;
    const assessmentAnswers = [];

    for (const question of course.assessment.questions) {
      maxScore += question.points;
      const userAnswer = answers.find((a) => a.questionId === question._id.toString());
      const isCorrect = JSON.stringify(userAnswer?.answer) === JSON.stringify(question.correctAnswer);
      
      if (isCorrect) {
        score += question.points;
      }

      assessmentAnswers.push({
        questionId: question._id.toString(),
        answer: userAnswer?.answer,
        isCorrect,
        points: isCorrect ? question.points : 0,
      });
    }

    const percentage = (score / maxScore) * 100;
    const passed = percentage >= course.assessment.passingScore;

    enrollment.assessment = {
      taken: true,
      score,
      maxScore,
      passed,
      takenAt: new Date(),
      answers: assessmentAnswers,
    };

    // Update status based on assessment result
    if (passed && course.completionCriteria === "assessment_passed") {
      enrollment.status = "completed";
      enrollment.completedAt = new Date();
      enrollment.progress = 100;
    } else if (!passed && course.completionCriteria === "assessment_passed") {
      enrollment.status = "failed";
    }

    await enrollment.save();
    res.json({ success: true, data: enrollment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get employee's courses
export const getEmployeeCourses = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const employeeId = req.params.employeeId || user.userId || user.id;

    const enrollments = await CourseEnrollment.find({ employeeId })
      .populate("courseId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get LMS statistics
export const getLMSStatistics = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = user.companyId || req.query.companyId;

    const [
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      inProgressEnrollments,
      coursesByCategory,
      averageCompletionRate,
    ] = await Promise.all([
      Course.countDocuments({ companyId, status: "published" }),
      CourseEnrollment.countDocuments({ companyId }),
      CourseEnrollment.countDocuments({ companyId, status: "completed" }),
      CourseEnrollment.countDocuments({ companyId, status: "in_progress" }),
      Course.aggregate([
        { $match: { companyId, status: "published" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      CourseEnrollment.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, avgProgress: { $avg: "$progress" } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalCourses,
        totalEnrollments,
        completedEnrollments,
        inProgressEnrollments,
        coursesByCategory,
        averageCompletionRate: averageCompletionRate[0]?.avgProgress || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

