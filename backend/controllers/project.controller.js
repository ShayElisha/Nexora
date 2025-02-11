import Project from "../models/project.model.js";
import jwt from "jsonwebtoken";
import Employee from "../models/employees.model.js";
import Department from "../models/department.model.js";
import Budget from "../models/Budget.model.js"; // ודא שהנתיב נכון

export const createProject = async (req, res) => {
  try {
    // בדיקת קיום ואימות הטוקן
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    const companyId = decodedToken.companyId;

    // קבלת הנתונים מה-req.body
    const {
      name,
      description,
      startDate,
      endDate,
      departmentId,
      teamMembers,
      budget, // התקציב המבוקש לפרויקט
      priority,
      tasks,
      documents,
      tags,
      comments,
      progress,
    } = req.body;

    // בדיקת שדות נדרשים
    if (
      !companyId ||
      !name ||
      !startDate ||
      !endDate ||
      !teamMembers ||
      (Array.isArray(teamMembers) && teamMembers.length === 0) ||
      budget === undefined ||
      budget === null ||
      !priority
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    let projectStatus;
    if (new Date(startDate) > new Date()) {
      projectStatus = "On Hold";
    } else {
      projectStatus = "Active";
    }
    // המרת תגיות (אם נדרש)
    const tagsArray = tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(",").map((tag) => tag.trim())
      : [];

    // המרת מערך המזהים למערך של אובייקטים עם employeeId
    const teamMembersFormatted = Array.isArray(teamMembers)
      ? teamMembers.map((id) => ({ employeeId: id }))
      : [];

    // הכנת נתוני הפרויקט
    const projectData = {
      companyId,
      name,
      description,
      startDate,
      endDate,
      status: projectStatus,
      departmentId,
      teamMembers: teamMembersFormatted,
      budget,
      priority,
      tasks,
      documents,
      tags: tagsArray,
      comments,
      progress,
    };

    console.log("Project data:", projectData);

    // *** בדיקת תקציב המחלקה ***
    // נבדוק האם קיים תקציב פעיל למחלקה זו (נניח שתקציב פעיל הוא כזה שעדיין לא הסתיים)
    const activeDeptBudget = await Budget.findOne({
      companyId,
      departmentId, // נניח שהתקציב קשור למחלקה על פי השדה departmentId
      endDate: { $gt: new Date() },
      status: "Approved",
    });
    if (!activeDeptBudget) {
      return res.status(400).json({
        success: false,
        message: "No active budget found for this department.",
      });
    }
    const remainingBudget =
      activeDeptBudget.amount - activeDeptBudget.spentAmount;
    if (projectData.budget > remainingBudget) {
      return res.status(400).json({
        success: false,
        message:
          "Requested project budget exceeds the department's remaining budget.",
      });
    }

    // יצירת הפרויקט במסד הנתונים
    const newProject = new Project(projectData);
    await newProject.save();

    // עדכון מערך הפרויקטים של המחלקה:
    const dep = await Department.findById(departmentId);
    if (dep) {
      // על פי המודל, מערך הפרויקטים הוא מערך של אובייקטים עם שדה projectId
      dep.projects.push({ projectId: newProject._id });
      await dep.save();
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    // עדכון מערך הפרויקטים אצל העובדים המשתתפים (אם ישנם)
    if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
      await Employee.updateMany(
        { _id: { $in: teamMembers } },
        {
          $push: {
            projects: { projectId: newProject._id, role: "Contributor" },
          },
        }
      );
    }

    return res.status(201).json({ data: newProject });
  } catch (err) {
    console.error("Error creating project:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * שליפת כל הפרויקטים
 * GET /api/projects
 */
export const getAllProjects = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const companyId = decodedToken.companyId;
    // אפשר להוסיף populate אם אתה רוצה להרחיב מידע מ- department / teamMembers וכו'
    const projects = await Project.find({ companyId }).populate(
      "teamMembers.employeeId",
      "name lastName"
    );

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};

/**
 * שליפת פרויקט בודד לפי מזהה (ObjectId)
 * GET /api/projects/:id
 */
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // אפשר להוסיף populate("department teamMembers ...") אם רוצים
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
      error: error.message,
    });
  }
};

/**
 * עדכון פרויקט לפי מזהה (ObjectId)
 * PUT /api/projects/:id
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // new: true -> מחזיר את הפרויקט המעודכן ולא את הישן
    const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedProject,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: error.message,
    });
  }
};

/**
 * מחיקת פרויקט לפי מזהה (ObjectId)
 * DELETE /api/projects/:id
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProject = await Project.findByIdAndRemove(id);

    if (!deletedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: deletedProject,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error: error.message,
    });
  }
};
