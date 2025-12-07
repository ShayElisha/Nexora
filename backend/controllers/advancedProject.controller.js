import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Task from "../models/tasks.model.js";
import Employee from "../models/employees.model.js";
import Department from "../models/department.model.js";
import ProjectTemplate from "../models/ProjectTemplate.model.js";
import ProjectRisk from "../models/ProjectRisk.model.js";

// Helper function to verify token and get companyId
const verifyToken = (req) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    throw new Error("Unauthorized");
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) {
    throw new Error("Invalid token");
  }
  return decodedToken;
};

// ==================== PROJECT PORTFOLIO ====================

/**
 * Get Project Portfolio - Overview of all projects
 */
export const getProjectPortfolio = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    // Get all projects with populated data
    const projects = await Project.find({ companyId })
      .populate("projectManager", "name lastName email")
      .populate("departmentId", "name")
      .populate("teamMembers.employeeId", "name lastName")
      .populate("tasks", "title status priority")
      .sort({ priority: -1, createdAt: -1 });

    // Calculate portfolio statistics
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === "Active").length;
    const completedProjects = projects.filter(
      (p) => p.status === "Completed"
    ).length;
    const onHoldProjects = projects.filter((p) => p.status === "On Hold").length;
    const cancelledProjects = projects.filter(
      (p) => p.status === "Cancelled"
    ).length;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const averageProgress =
      projects.length > 0
        ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) /
          projects.length
        : 0;

    // Projects by priority
    const projectsByPriority = {
      High: projects.filter((p) => p.priority === "High").length,
      Medium: projects.filter((p) => p.priority === "Medium").length,
      Low: projects.filter((p) => p.priority === "Low").length,
    };

    // Projects by department
    const projectsByDepartment = {};
    projects.forEach((project) => {
      const deptName = project.departmentId?.name || "No Department";
      projectsByDepartment[deptName] =
        (projectsByDepartment[deptName] || 0) + 1;
    });

    // Projects at risk (behind schedule or over budget)
    const today = new Date();
    const projectsAtRisk = projects.filter((project) => {
      const isOverdue = project.endDate && new Date(project.endDate) < today;
      const isLowProgress =
        project.progress < 50 && project.endDate && new Date(project.endDate) < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return isOverdue || isLowProgress;
    });

    return res.status(200).json({
      success: true,
      data: {
        projects,
        statistics: {
          totalProjects,
          activeProjects,
          completedProjects,
          onHoldProjects,
          cancelledProjects,
          totalBudget,
          averageProgress: Math.round(averageProgress),
          projectsByPriority,
          projectsByDepartment,
          projectsAtRisk: projectsAtRisk.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching project portfolio:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project portfolio",
      error: error.message,
    });
  }
};

// ==================== RESOURCE CAPACITY PLANNING ====================

/**
 * Get Resource Capacity Planning
 */
export const getResourceCapacity = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    // Get all employees
    const employees = await Employee.find({ companyId, status: "active" })
      .populate("department", "name")
      .select("name lastName email department hourlySalary expectedHours");

    // Get all active projects
    const projects = await Project.find({
      companyId,
      status: { $in: ["Active", "On Hold"] },
    })
      .populate("teamMembers.employeeId", "name lastName")
      .populate("tasks", "assignedTo");

    // Get all tasks for active projects
    const projectIds = projects.map((p) => p._id);
    const tasks = await Task.find({
      companyId,
      projectId: { $in: projectIds },
      status: { $ne: "completed" },
    }).populate("assignedTo", "name lastName");

    // Calculate capacity for each employee
    const employeeCapacity = employees.map((employee) => {
      // Find tasks assigned to this employee
      const employeeTasks = tasks.filter((task) =>
        task.assignedTo.some(
          (assigned) => assigned._id.toString() === employee._id.toString()
        )
      );

      // Calculate allocated hours (assuming 8 hours per day, 5 days per week)
      const weeklyHours = employee.expectedHours || 40;
      const allocatedHours = employeeTasks.length * 8; // Rough estimate
      const utilization = weeklyHours > 0 ? (allocatedHours / weeklyHours) * 100 : 0;

      // Find projects this employee is assigned to
      const employeeProjects = projects.filter((project) =>
        project.teamMembers.some(
          (member) =>
            member.employeeId?._id?.toString() === employee._id.toString()
        )
      );

      return {
        employee: {
          _id: employee._id,
          name: employee.name,
          lastName: employee.lastName,
          email: employee.email,
          department: employee.department?.name || "No Department",
        },
        weeklyCapacity: weeklyHours,
        allocatedHours,
        utilization: Math.round(utilization),
        tasksCount: employeeTasks.length,
        projectsCount: employeeProjects.length,
        isOverloaded: utilization > 100,
      };
    });

    // Summary statistics
    const totalEmployees = employees.length;
    const overloadedEmployees = employeeCapacity.filter((e) => e.isOverloaded).length;
    const averageUtilization =
      employeeCapacity.length > 0
        ? employeeCapacity.reduce((sum, e) => sum + e.utilization, 0) /
          employeeCapacity.length
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        employeeCapacity,
        statistics: {
          totalEmployees,
          overloadedEmployees,
          averageUtilization: Math.round(averageUtilization),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching resource capacity:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch resource capacity",
      error: error.message,
    });
  }
};

// ==================== PROJECT TEMPLATES ====================

/**
 * Get all project templates
 */
export const getProjectTemplates = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const templates = await ProjectTemplate.find({ companyId })
      .populate("createdBy", "name lastName")
      .populate("recommendedDepartment", "name")
      .sort({ usageCount: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Error fetching project templates:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project templates",
      error: error.message,
    });
  }
};

/**
 * Create project template
 */
export const createProjectTemplate = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const employeeId = decoded.employeeId;

    const templateData = {
      ...req.body,
      companyId,
      createdBy: employeeId,
    };

    const template = await ProjectTemplate.create(templateData);

    return res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error creating project template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create project template",
      error: error.message,
    });
  }
};

/**
 * Update project template
 */
export const updateProjectTemplate = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const { id } = req.params;

    const template = await ProjectTemplate.findOneAndUpdate(
      { _id: id, companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error updating project template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project template",
      error: error.message,
    });
  }
};

/**
 * Delete project template
 */
export const deleteProjectTemplate = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const { id } = req.params;

    const template = await ProjectTemplate.findOneAndDelete({
      _id: id,
      companyId,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project template",
      error: error.message,
    });
  }
};

/**
 * Create project from template
 */
export const createProjectFromTemplate = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const { templateId, projectData } = req.body;

    const template = await ProjectTemplate.findById(templateId);
    if (!template || template.companyId.toString() !== companyId.toString()) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Create project based on template
    const newProject = await Project.create({
      companyId,
      name: projectData.name || template.name,
      description: projectData.description || template.description,
      departmentId: projectData.departmentId || template.recommendedDepartment,
      budget: projectData.budget || template.estimatedBudget,
      priority: projectData.priority || "Medium",
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      projectManager: projectData.projectManager,
      teamMembers: projectData.teamMembers || [],
      tags: template.tags || [],
    });

    // Update template usage
    template.usageCount += 1;
    template.lastUsed = new Date();
    await template.save();

    return res.status(201).json({
      success: true,
      data: newProject,
    });
  } catch (error) {
    console.error("Error creating project from template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create project from template",
      error: error.message,
    });
  }
};

// ==================== PROJECT RISK MANAGEMENT ====================

/**
 * Get all risks for a project
 */
export const getProjectRisks = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const { projectId } = req.query;

    const filter = { companyId };
    if (projectId) {
      filter.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const risks = await ProjectRisk.find(filter)
      .populate("projectId", "name status")
      .populate("owner", "name lastName email")
      .populate("preventiveActions.assignedTo", "name lastName")
      .populate("notes.createdBy", "name lastName")
      .sort({ riskLevel: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: risks,
    });
  } catch (error) {
    console.error("Error fetching project risks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project risks",
      error: error.message,
    });
  }
};

/**
 * Create project risk
 */
export const createProjectRisk = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const riskData = {
      ...req.body,
      companyId,
      projectId: new mongoose.Types.ObjectId(req.body.projectId),
    };

    const risk = await ProjectRisk.create(riskData);

    return res.status(201).json({
      success: true,
      data: risk,
    });
  } catch (error) {
    console.error("Error creating project risk:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create project risk",
      error: error.message,
    });
  }
};

/**
 * Update project risk
 */
export const updateProjectRisk = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const { id } = req.params;

    const risk = await ProjectRisk.findOneAndUpdate(
      { _id: id, companyId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!risk) {
      return res.status(404).json({
        success: false,
        message: "Risk not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: risk,
    });
  } catch (error) {
    console.error("Error updating project risk:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project risk",
      error: error.message,
    });
  }
};

/**
 * Delete project risk
 */
export const deleteProjectRisk = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const { id } = req.params;

    const risk = await ProjectRisk.findOneAndDelete({
      _id: id,
      companyId,
    });

    if (!risk) {
      return res.status(404).json({
        success: false,
        message: "Risk not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Risk deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project risk:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project risk",
      error: error.message,
    });
  }
};

