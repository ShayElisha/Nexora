import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Task from "../models/tasks.model.js";
import Employee from "../models/employees.model.js";
import Department from "../models/department.model.js";
import ProjectTemplate from "../models/ProjectTemplate.model.js";
import ProjectRisk from "../models/ProjectRisk.model.js";
import Shift from "../models/Shifts.model.js";
import Company from "../models/companies.model.js";
import Budget from "../models/Budget.model.js";

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

    // Calculate current week dates (Sunday to Saturday)
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get all employees
    const employees = await Employee.find({ companyId, status: "active" })
      .populate("department", "name")
      .select("name lastName email department hourlySalary expectedHours paymentType");

    // Get all tasks (not just from active projects) that are relevant for this week
    // Include tasks that:
    // 1. Are due this week or earlier (and not completed)
    // 2. Start this week or earlier (and not completed)
    // 3. Are in progress and overlap with this week
    const tasks = await Task.find({
      companyId,
      status: { $ne: "completed" },
      $or: [
        { dueDate: { $lte: endOfWeek, $gte: startOfWeek } }, // Tasks due this week
        { dueDate: { $lte: endOfWeek } }, // Tasks due before this week (overdue)
        { startDate: { $lte: endOfWeek, $gte: startOfWeek, $exists: true } }, // Tasks starting this week
        { startDate: { $lte: startOfWeek, $exists: true }, dueDate: { $gte: startOfWeek } }, // Tasks spanning this week
      ],
    })
      .populate("assignedTo", "name lastName")
      .select("assignedTo dueDate startDate title status priority estimatedHours projectId");

    // Get shifts for current week to calculate actual hours worked
    const shifts = await Shift.find({
      companyId,
      shiftDate: { $gte: startOfWeek, $lte: endOfWeek },
    }).select("employeeId hoursWorked shiftDate");

    // Get all projects for counting
    const projects = await Project.find({
      companyId,
      status: { $in: ["Active", "On Hold"] },
    })
      .populate("teamMembers.employeeId", "name lastName")
      .select("teamMembers");

    // Calculate capacity for each employee
    const employeeCapacity = employees.map((employee) => {
      const employeeId = employee._id.toString();

      // Find tasks assigned to this employee
      const employeeTasks = tasks.filter((task) => {
        if (!task.assignedTo) return false;
        
        // Handle both array and single value
        if (Array.isArray(task.assignedTo)) {
          return task.assignedTo.some((assigned) => {
            const assignedId = assigned?._id?.toString() || assigned?.toString();
            return assignedId === employeeId;
          });
        } else {
          // Single value
          const assignedId = task.assignedTo?._id?.toString() || task.assignedTo?.toString();
          return assignedId === employeeId;
        }
      });

      // Calculate allocated hours from shifts (actual hours worked this week)
      const employeeShifts = shifts.filter((shift) => {
        if (!shift.employeeId) return false;
        const shiftEmployeeId = shift.employeeId?._id?.toString() || shift.employeeId?.toString();
        return shiftEmployeeId === employeeId;
      });
      
      const actualHoursWorked = employeeShifts.reduce(
        (sum, shift) => sum + (shift.hoursWorked || 0),
        0
      );

      // Calculate estimated hours from tasks
      // Use estimatedHours if available, otherwise estimate based on priority and task type
      const estimatedTaskHours = employeeTasks.reduce((sum, task) => {
        if (task.estimatedHours && task.estimatedHours > 0) {
          return sum + task.estimatedHours;
        }
        // Default estimate based on priority:
        // High priority: 8 hours, Medium: 4 hours, Low: 2 hours
        const priorityMultiplier = {
          high: 8,
          medium: 4,
          low: 2,
        };
        const taskPriority = (task.priority || "medium").toLowerCase();
        const estimatedHours = priorityMultiplier[taskPriority] || 4;
        return sum + estimatedHours;
      }, 0);

      // Use actual hours from shifts if available (more accurate)
      // Otherwise use estimated task hours
      // Priority: actualHoursWorked > estimatedTaskHours > 0
      let allocatedHours = 0;
      if (actualHoursWorked > 0) {
        // Use actual hours worked from shifts (most accurate)
        allocatedHours = actualHoursWorked;
      } else if (estimatedTaskHours > 0) {
        // Use estimated hours from tasks
        allocatedHours = estimatedTaskHours;
      }
      // If both are 0, allocatedHours stays 0 (employee has no work assigned)

      // Calculate weekly capacity
      // Priority: expectedHours > paymentType-based default
      let weeklyHours = 40; // Default fallback
      
      // First check if employee has expectedHours set (regardless of payment type)
      if (employee.expectedHours && employee.expectedHours > 0) {
        weeklyHours = employee.expectedHours;
      } else {
        // If no expectedHours, use paymentType-based defaults
        if (employee.paymentType === "Global") {
          // Global employees typically work full-time
          weeklyHours = 40;
        } else if (employee.paymentType === "Hourly") {
          // Hourly employees - standard 40 hours per week
          weeklyHours = 40;
        } else if (employee.paymentType === "Commission-Based") {
          // Commission-based - variable, default to 40
          weeklyHours = 40;
        }
      }

      // Calculate utilization percentage
      // If no capacity defined, utilization is 0
      const utilization = weeklyHours > 0 ? (allocatedHours / weeklyHours) * 100 : 0;

      // Find projects this employee is assigned to
      const employeeProjects = projects.filter((project) =>
        project.teamMembers.some((member) => {
          const memberId = member.employeeId?._id?.toString() || member.employeeId?.toString();
          return memberId === employeeId;
        })
      );

      // Debug logging (can be removed in production)
      if (process.env.NODE_ENV === "development") {
        console.log(`Employee: ${employee.name} ${employee.lastName}`);
        console.log(`  - Tasks: ${employeeTasks.length}, Shifts: ${employeeShifts.length}`);
        console.log(`  - Actual Hours: ${actualHoursWorked}, Estimated Task Hours: ${estimatedTaskHours}`);
        console.log(`  - Allocated Hours: ${allocatedHours}, Weekly Capacity: ${weeklyHours}`);
        console.log(`  - Utilization: ${utilization.toFixed(1)}%`);
      }

      return {
        employee: {
          _id: employee._id,
          name: employee.name,
          lastName: employee.lastName,
          email: employee.email,
          department: employee.department?.name || "No Department",
        },
        weeklyCapacity: weeklyHours,
        allocatedHours: Math.round(allocatedHours * 10) / 10, // Round to 1 decimal
        utilization: Math.round(utilization * 10) / 10,
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
          averageUtilization: Math.round(averageUtilization * 10) / 10,
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

// ==================== AUTOMATIC RISK DETECTION ====================

/**
 * Check and create project risks automatically
 * This function runs periodically to detect and create risks based on project status
 */
export const checkAndCreateProjectRisks = async () => {
  try {
    console.log("🔍 Checking for project risks...");
    const companies = await Company.find({});
    let totalRisksCreated = 0;

    for (const company of companies) {
      try {
        const companyId = company._id;
        
        // Get all active projects
        const activeProjects = await Project.find({
          companyId,
          status: { $in: ["Active", "On Hold"] },
        }).populate("projectManager", "name lastName");

        for (const project of activeProjects) {
          const today = new Date();
          const projectId = project._id;

          // 1. Check for overdue projects (Schedule Risk)
          if (project.endDate && new Date(project.endDate) < today) {
            const existingRisk = await ProjectRisk.findOne({
              companyId,
              projectId,
              category: "Schedule",
              title: { $regex: /.*איחור.*|.*overdue.*|.*behind schedule.*/i },
              status: { $in: ["Open", "In Progress"] },
            });

            if (!existingRisk) {
              await ProjectRisk.create({
                companyId,
                projectId,
                title: `פרויקט באיחור - ${project.name}`,
                description: `הפרויקט חרג מתאריך הסיום המתוכנן (${new Date(project.endDate).toLocaleDateString('he-IL')}).`,
                category: "Schedule",
                probability: "High",
                impact: "High",
                status: "Open",
                owner: project.projectManager?._id,
                identifiedDate: today,
              });
              totalRisksCreated++;
              console.log(`⚠️ Created Schedule Risk for overdue project: ${project.name}`);
            }
          }

          // 2. Check for low progress with approaching deadline (Schedule Risk)
          if (project.endDate && project.progress !== undefined) {
            const daysUntilDeadline = Math.ceil(
              (new Date(project.endDate) - today) / (1000 * 60 * 60 * 24)
            );
            
            if (project.progress < 50 && daysUntilDeadline <= 14 && daysUntilDeadline > 0) {
              const existingRisk = await ProjectRisk.findOne({
                companyId,
                projectId,
                category: "Schedule",
                title: { $regex: /.*התקדמות נמוכה.*|.*low progress.*/i },
                status: { $in: ["Open", "In Progress"] },
              });

              if (!existingRisk) {
                await ProjectRisk.create({
                  companyId,
                  projectId,
                  title: `התקדמות נמוכה - ${project.name}`,
                  description: `הפרויקט נמצא ב-${project.progress || 0}% התקדמות, עם ${daysUntilDeadline} ימים עד תאריך הסיום.`,
                  category: "Schedule",
                  probability: "Medium",
                  impact: "High",
                  status: "Open",
                  owner: project.projectManager?._id,
                  identifiedDate: today,
                });
                totalRisksCreated++;
                console.log(`⚠️ Created Schedule Risk for low progress: ${project.name}`);
              }
            }
          }

          // 3. Check for budget overrun (Financial Risk)
          if (project.budget) {
            const projectBudget = await Budget.findOne({
              companyId,
              projectId: project._id,
            });

            if (projectBudget && projectBudget.spentAmount > project.budget) {
              const overrunPercentage = ((projectBudget.spentAmount - project.budget) / project.budget) * 100;
              
              const existingRisk = await ProjectRisk.findOne({
                companyId,
                projectId,
                category: "Financial",
                title: { $regex: /.*חריגה מתקציב.*|.*budget overrun.*/i },
                status: { $in: ["Open", "In Progress"] },
              });

              if (!existingRisk) {
                await ProjectRisk.create({
                  companyId,
                  projectId,
                  title: `חריגה מתקציב - ${project.name}`,
                  description: `הפרויקט חרג מהתקציב ב-${overrunPercentage.toFixed(1)}% (${projectBudget.spentAmount.toFixed(2)} מתוך ${project.budget.toFixed(2)}).`,
                  category: "Financial",
                  probability: "High",
                  impact: overrunPercentage > 20 ? "High" : "Medium",
                  status: "Open",
                  owner: project.projectManager?._id,
                  identifiedDate: today,
                });
                totalRisksCreated++;
                console.log(`⚠️ Created Financial Risk for budget overrun: ${project.name}`);
              }
            }
          }

          // 4. Check for tasks with high delay (Task Delay Risk)
          const tasks = await Task.find({
            companyId,
            projectId,
            status: { $ne: "completed" },
            dueDate: { $lt: today },
          });

          if (tasks.length > 0) {
            const delayedTasksCount = tasks.length;
            const allTasks = await Task.find({ companyId, projectId });
            const delayPercentage = (delayedTasksCount / allTasks.length) * 100;

            if (delayPercentage > 30) {
              const existingRisk = await ProjectRisk.findOne({
                companyId,
                projectId,
                category: "Schedule",
                title: { $regex: /.*משימות באיחור.*|.*delayed tasks.*/i },
                status: { $in: ["Open", "In Progress"] },
              });

              if (!existingRisk) {
                await ProjectRisk.create({
                  companyId,
                  projectId,
                  title: `משימות באיחור - ${project.name}`,
                  description: `${delayedTasksCount} מתוך ${allTasks.length} משימות (${delayPercentage.toFixed(1)}%) נמצאות באיחור.`,
                  category: "Schedule",
                  probability: delayPercentage > 50 ? "High" : "Medium",
                  impact: "Medium",
                  status: "Open",
                  owner: project.projectManager?._id,
                  identifiedDate: today,
                });
                totalRisksCreated++;
                console.log(`⚠️ Created Schedule Risk for delayed tasks: ${project.name}`);
              }
            }
          }

          // 5. Check for resource overload (Resource Risk)
          const teamMembers = project.teamMembers || [];
          if (teamMembers.length > 0) {
            // Get shifts for team members in the last week
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const teamMemberIds = teamMembers.map((m) => m.employeeId);
            const shifts = await Shift.find({
              companyId,
              employeeId: { $in: teamMemberIds },
              shiftDate: { $gte: oneWeekAgo },
            });

            // Check if any team member has excessive hours (more than 45 hours per week)
            const employeeHours = {};
            shifts.forEach((shift) => {
              const empId = shift.employeeId.toString();
              if (!employeeHours[empId]) {
                employeeHours[empId] = 0;
              }
              employeeHours[empId] += shift.hoursWorked || 0;
            });

            const overloadedEmployees = Object.entries(employeeHours).filter(
              ([_, hours]) => hours > 45
            );

            if (overloadedEmployees.length > 0 && overloadedEmployees.length >= teamMembers.length * 0.5) {
              const existingRisk = await ProjectRisk.findOne({
                companyId,
                projectId,
                category: "Resource",
                title: { $regex: /.*עומס יתר.*|.*resource overload.*/i },
                status: { $in: ["Open", "In Progress"] },
              });

              if (!existingRisk) {
                await ProjectRisk.create({
                  companyId,
                  projectId,
                  title: `עומס יתר על המשאבים - ${project.name}`,
                  description: `${overloadedEmployees.length} מתוך ${teamMembers.length} חברי צוות עובדים מעל 45 שעות בשבוע, מה שעלול להוביל לשחיקה ולבעיות איכות.`,
                  category: "Resource",
                  probability: "Medium",
                  impact: "Medium",
                  status: "Open",
                  owner: project.projectManager?._id,
                  identifiedDate: today,
                });
                totalRisksCreated++;
                console.log(`⚠️ Created Resource Risk for overloaded team: ${project.name}`);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error checking risks for company ${company._id}:`, error.message);
      }
    }

    if (totalRisksCreated > 0) {
      console.log(`✅ Created ${totalRisksCreated} new project risks`);
    } else {
      console.log("✅ No new risks detected");
    }
  } catch (error) {
    console.error("Error in checkAndCreateProjectRisks:", error);
  }
};

