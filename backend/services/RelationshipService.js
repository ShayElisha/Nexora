// services/RelationshipService.js
// Service לניהול קשרים דו-כיווניים בין ישויות

import Task from "../models/tasks.model.js";
import Lead from "../models/Lead.model.js";
import Project from "../models/project.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Department from "../models/department.model.js";

/**
 * עדכון קשר Task ↔ Lead
 */
export const linkTaskToLead = async (taskId, leadId) => {
  try {
    if (!taskId || !leadId) return;

    // עדכון Task
    await Task.findByIdAndUpdate(taskId, { leadId });

    // עדכון Lead - הוספה למערך אם לא קיים
    const lead = await Lead.findById(leadId);
    if (lead && !lead.taskIds?.includes(taskId)) {
      if (!lead.taskIds) lead.taskIds = [];
      lead.taskIds.push(taskId);
      await lead.save();
    }
  } catch (error) {
    console.error("Error linking task to lead:", error);
  }
};

export const unlinkTaskFromLead = async (taskId, leadId) => {
  try {
    if (!taskId || !leadId) return;

    // עדכון Task
    await Task.findByIdAndUpdate(taskId, { $unset: { leadId: 1 } });

    // עדכון Lead - הסרה מהמערך
    await Lead.findByIdAndUpdate(leadId, {
      $pull: { taskIds: taskId },
    });
  } catch (error) {
    console.error("Error unlinking task from lead:", error);
  }
};

/**
 * עדכון קשר Lead ↔ Project
 */
export const linkLeadToProject = async (leadId, projectId) => {
  try {
    if (!leadId || !projectId) return;

    // עדכון Lead
    await Lead.findByIdAndUpdate(leadId, { projectId });

    // עדכון Project
    await Project.findByIdAndUpdate(projectId, { leadId });
  } catch (error) {
    console.error("Error linking lead to project:", error);
  }
};

export const unlinkLeadFromProject = async (leadId, projectId) => {
  try {
    if (!leadId || !projectId) return;

    // עדכון Lead
    await Lead.findByIdAndUpdate(leadId, { $unset: { projectId: 1 } });

    // עדכון Project
    await Project.findByIdAndUpdate(projectId, { $unset: { leadId: 1 } });
  } catch (error) {
    console.error("Error unlinking lead from project:", error);
  }
};

/**
 * עדכון קשר Order ↔ Lead
 */
export const linkOrderToLead = async (orderId, leadId) => {
  try {
    if (!orderId || !leadId) return;

    // עדכון Order
    await CustomerOrder.findByIdAndUpdate(orderId, { leadId });

    // Lead כבר יש לו createdOrderId, אז לא צריך לעדכן אותו
    // אבל נוכל לעדכן את הסטטוס של הליד ל-"Closed Won" אם צריך
  } catch (error) {
    console.error("Error linking order to lead:", error);
  }
};

/**
 * עדכון קשר Order ↔ Project
 */
export const linkOrderToProject = async (orderId, projectId) => {
  try {
    if (!orderId || !projectId) return;

    // עדכון Order
    await CustomerOrder.findByIdAndUpdate(orderId, { projectId });
  } catch (error) {
    console.error("Error linking order to project:", error);
  }
};

/**
 * עדכון קשר Lead ↔ Department
 */
export const linkLeadToDepartment = async (leadId, departmentId) => {
  try {
    if (!leadId || !departmentId) return;

    // עדכון Lead
    await Lead.findByIdAndUpdate(leadId, { departmentId });

    // עדכון Department - הוספה למערך אם לא קיים
    const department = await Department.findById(departmentId);
    if (department && !department.leadIds?.includes(leadId)) {
      if (!department.leadIds) department.leadIds = [];
      department.leadIds.push(leadId);
      await department.save();
    }
  } catch (error) {
    console.error("Error linking lead to department:", error);
  }
};

export const unlinkLeadFromDepartment = async (leadId, departmentId) => {
  try {
    if (!leadId || !departmentId) return;

    // עדכון Lead
    await Lead.findByIdAndUpdate(leadId, { $unset: { departmentId: 1 } });

    // עדכון Department - הסרה מהמערך
    await Department.findByIdAndUpdate(departmentId, {
      $pull: { leadIds: leadId },
    });
  } catch (error) {
    console.error("Error unlinking lead from department:", error);
  }
};

/**
 * עדכון קשר Lead ↔ Employee (assignedTo)
 */
export const assignLeadToEmployees = async (leadId, employeeIds) => {
  try {
    if (!leadId || !employeeIds || !Array.isArray(employeeIds)) return;

    // עדכון Lead
    await Lead.findByIdAndUpdate(leadId, { assignedTo: employeeIds });
  } catch (error) {
    console.error("Error assigning lead to employees:", error);
  }
};

/**
 * עדכון סטטוס ליד אוטומטי בהתבסס על פעולות
 */
export const updateLeadStatusFromTask = async (taskId) => {
  try {
    const task = await Task.findById(taskId).populate("leadId");
    if (!task || !task.leadId) return;

    const lead = task.leadId;

    // אם המשימה הושלמה, עדכן את סטטוס הליד
    if (task.status === "completed" && lead.status !== "Closed Won") {
      // בדוק אם יש עוד משימות פתוחות
      const openTasks = await Task.find({
        leadId: lead._id,
        status: { $ne: "completed" },
      });

      // אם כל המשימות הושלמו, עדכן את הליד
      if (openTasks.length === 0) {
        lead.status = "Closed Won";
        await lead.save();
      }
    }
  } catch (error) {
    console.error("Error updating lead status from task:", error);
  }
};

export const updateLeadStatusFromProject = async (projectId) => {
  try {
    const project = await Project.findById(projectId).populate("leadId");
    if (!project || !project.leadId) return;

    const lead = project.leadId;

    // אם הפרויקט התחיל, עדכן את הליד
    if (project.status === "Active" && lead.status !== "Closed Won") {
      lead.status = "Closed Won";
      await lead.save();
    }

    // אם הפרויקט בוטל, עדכן את הליד
    if (project.status === "Cancelled" && lead.status !== "Closed Lost") {
      lead.status = "Closed Lost";
      await lead.save();
    }
  } catch (error) {
    console.error("Error updating lead status from project:", error);
  }
};

