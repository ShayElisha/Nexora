import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Task from "../models/tasks.model.js";
import Project from "../models/project.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Employee from "../models/employees.model.js";
import {
  linkTaskToLead,
  unlinkTaskFromLead,
  updateLeadStatusFromTask,
} from "../services/RelationshipService.js";

/**
 * Helper function to update project progress based on completed tasks
 * מחשב ומעדכן את ההתקדמות של הפרויקט בהתבסס על המשימות שהושלמו
 */
const updateProjectProgress = async (projectId) => {
  try {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return;
    }

    // Find all tasks for this project
    const tasks = await Task.find({ projectId });

    if (tasks.length === 0) {
      // If no tasks, set progress to 0
      await Project.findByIdAndUpdate(projectId, { progress: 0 });
      return;
    }

    // Count completed tasks
    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;

    // Calculate progress percentage
    const progress = Math.round((completedTasks / tasks.length) * 100);

    // Update project progress
    await Project.findByIdAndUpdate(projectId, { progress });

    // If all tasks are completed, update project status to "Completed"
    if (completedTasks === tasks.length && tasks.length > 0) {
      await Project.findByIdAndUpdate(projectId, { status: "Completed" });
    }
    // If project was completed but now has incomplete tasks, set status back to "Active"
    else if (completedTasks < tasks.length) {
      const project = await Project.findById(projectId);
      if (project && project.status === "Completed") {
        await Project.findByIdAndUpdate(projectId, { status: "Active" });
      }
    }

    console.log(
      `Project ${projectId} progress updated to ${progress}% (${completedTasks}/${tasks.length} tasks completed)`
    );
  } catch (error) {
    console.error("Error updating project progress:", error);
    // Don't throw error - we don't want to break the task operation
  }
};

export const createTask = async (req, res) => {
  try {
    // אימות משתמש
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    // זה עוזר לאבחן מה בדיוק מגיע מ-req.body
    console.log("req.body:", req.body);

    // חילוץ שדות מהבקשה
    const {
      projectId,
      departmentId,
      title,
      description,
      status = "pending",
      priority = "medium",
      dueDate,
      assignedTo = [],
      orderId,
      orderItems = [],
      leadId,
    } = req.body;

    // בדיקת projectId (אם קיים)
    if (projectId) {
      // בדיקה אם המזהה תקין
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid project ID format" });
      }

      // חיפוש הפרויקט
      const selectedProject = await Project.findById(projectId);
      if (!selectedProject) {
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      }

      // בדיקה שהפרויקט לא פג תוקפו (endDate < היום)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedProject.endDate) {
        const projectEndDate = new Date(selectedProject.endDate);
        projectEndDate.setHours(0, 0, 0, 0);
        if (projectEndDate < today) {
          return res.status(400).json({
            success: false,
            message: "Cannot assign tasks to expired projects",
          });
        }
      }

      // בדיקת תאריך היעד מול תאריך סיום פרויקט
      if (dueDate) {
        const dueDateObj = new Date(dueDate);
        if (selectedProject.endDate && selectedProject.endDate < dueDateObj) {
          return res.status(400).json({
            success: false,
            message: "Due date must be before project end date",
          });
        }
      }
    }

    // הרכבת אובייקט המשימה
    const newTaskData = {
      companyId,
      departmentId,
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo, // מערך מזהי עובדים
      orderId,
      orderItems, // [{ itemId, productId, productName, quantity }, ...]
      ...(projectId && { projectId }), // רק אם קיים projectId
      ...(leadId && { leadId }), // רק אם קיים leadId
    };

    // יצירת משימה חדשה
    const task = await Task.create(newTaskData);

    // Update project tasks list and progress if task is linked to a project
    if (projectId) {
      // הוספת המשימה לרשימת המשימות של הפרויקט
      await Project.findByIdAndUpdate(
        projectId,
        { $addToSet: { tasks: task._id } }, // $addToSet מונע כפילויות
        { new: true }
      );
      
      // עדכון הפרוגרס של הפרויקט
      await updateProjectProgress(projectId);
    }

    // Link task to lead if leadId is provided
    if (leadId) {
      await linkTaskToLead(task._id, leadId);
    }

    // אם יש orderId ו־orderItems, נשנה את מצב ה־items ב־CustomerOrder
    if (orderId && orderItems.length > 0) {
      const customerOrder = await CustomerOrder.findById(orderId);
      if (customerOrder) {
        const itemIdsSelected = orderItems.map((item) => item.itemId);
        customerOrder.items.forEach((orderItem) => {
          if (itemIdsSelected.includes(orderItem._id.toString())) {
            orderItem.isAllocated = true;
          }
        });
        await customerOrder.save();

        // בדיקה אם כל הפריטים הוקצו => עדכון סטטוס הזמנה
        const OrderItemsCheck = await CustomerOrder.findById(orderId);
        const allAllocated = OrderItemsCheck.items.every(
          (item) => item.isAllocated === true
        );
        if (allAllocated) {
          OrderItemsCheck.status = "Confirmed";
          await OrderItemsCheck.save();
        }
      }
    }

    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
};

/**
 * Get Tasks
 * מחזיר את כל המשימות של החברה.
 */
export const getTasks = async (req, res) => {
  try {
    // אימות טוקן וקבלת companyId
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    // שליפת המשימות של החברה בלבד
    const tasks = await Task.find({ companyId })
      .populate("companyId", "name") // מילוי שם החברה
      .populate("projectId", "name") // מילוי שם הפרויקט
      .populate("departmentId", "name") // מילוי שם המחלקה
      .populate("assignedTo", "name email role") // מילוי פרטי העובדים שהוקצו
      .sort({ dueDate: 1, priority: 1 });

    // Return empty array if no tasks found instead of 404
    // This is more RESTful - the resource exists, it's just empty
    res.status(200).json({ success: true, data: tasks || [] });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * Get Task By ID
 * מחזיר משימה בודדת לפי מזהה.
 */
export const getTaskById = async (req, res) => {
  try {
    // אימות טוקן וקבלת companyId
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task id" });
    }

    // שליפת המשימה ובדיקה שהיא שייכת לחברה
    const task = await Task.findOne({ _id: id, companyId })
      .populate("companyId", "name")
      .populate("projectId", "name")
      .populate("departmentId", "name")
      .populate("assignedTo", "name email role");

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching task",
      error: error.message,
    });
  }
};

/**
 * Update Task
 * מעדכן משימה קיימת לפי מזהה.
 */
export const updateTask = async (req, res) => {
  try {
    // אימות טוקן וקבלת companyId
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task id" });
    }

    // מניעת עדכון שדה companyId אם נשלח בבקשה
    if (req.body.companyId) delete req.body.companyId;

    // Find the task before update to get the projectId
    const taskBeforeUpdate = await Task.findOne({ _id: id, companyId });
    if (!taskBeforeUpdate) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not authorized",
      });
    }

    // בדיקה אם משנים projectId - לא ניתן להקצות לפרויקטים שפג תוקפם
    if (req.body.projectId && req.body.projectId !== taskBeforeUpdate.projectId?.toString()) {
      const newProjectId = req.body.projectId;
      
      if (!mongoose.Types.ObjectId.isValid(newProjectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID format",
        });
      }

      const newProject = await Project.findById(newProjectId);
      if (!newProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      // בדיקה שהפרויקט לא פג תוקפו
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newProject.endDate) {
        const projectEndDate = new Date(newProject.endDate);
        projectEndDate.setHours(0, 0, 0, 0);
        if (projectEndDate < today) {
          return res.status(400).json({
            success: false,
            message: "Cannot assign tasks to expired projects",
          });
        }
      }
    }

    // עדכון המשימה רק אם היא שייכת לחברה של המשתמש
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, companyId },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not authorized",
      });
    }

    // Handle project relationship updates
    const oldProjectId = taskBeforeUpdate.projectId?.toString();
    const newProjectId = updatedTask.projectId?.toString();

    if (oldProjectId !== newProjectId) {
      // Remove task from old project's tasks list
      if (oldProjectId) {
        await Project.findByIdAndUpdate(
          oldProjectId,
          { $pull: { tasks: id } },
          { new: true }
        );
        await updateProjectProgress(oldProjectId);
      }
      
      // Add task to new project's tasks list
      if (newProjectId) {
        await Project.findByIdAndUpdate(
          newProjectId,
          { $addToSet: { tasks: id } }, // $addToSet מונע כפילויות
          { new: true }
        );
        await updateProjectProgress(newProjectId);
      }
    } else if (newProjectId) {
      // אם projectId לא השתנה אבל יש projectId, עדכן רק את הפרוגרס
      await updateProjectProgress(newProjectId);
    }

    // Handle lead relationship updates
    const oldLeadId = taskBeforeUpdate.leadId?.toString();
    const newLeadId = updatedTask.leadId?.toString();

    if (oldLeadId !== newLeadId) {
      // Unlink from old lead if changed
      if (oldLeadId) {
        await unlinkTaskFromLead(updatedTask._id, oldLeadId);
      }
      // Link to new lead if provided
      if (newLeadId) {
        await linkTaskToLead(updatedTask._id, newLeadId);
      }
    }

    // Update lead status if task is completed
    if (updatedTask.status === "completed") {
      await updateLeadStatusFromTask(updatedTask._id);
    }

    return res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
};

/**
 * Delete Task
 * מוחק משימה לפי מזהה.
 */
export const deleteTask = async (req, res) => {
  try {
    // אימות טוקן וקבלת companyId
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid task id" });
    }

    // מוצאים את המשימה לפני המחיקה כדי שנוכל לגשת ל-orderId והפריטים
    const task = await Task.findOne({ _id: id, companyId });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found or not authorized" });
    }

    // Save projectId and leadId before deletion for updates
    const projectIdToUpdate = task.projectId;
    const leadIdToUnlink = task.leadId;

    // אם למשימה יש orderId, נטפל בהחזרת isAllocated = false לפריטים
    if (task.orderId) {
      // מוצאים את ההזמנה
      const order = await CustomerOrder.findById(task.orderId);
      if (order) {
        // נעבור על הפריטים של המשימה, ונבטל את ה- isAllocated
        task.orderItems.forEach((taskItem) => {
          // מנסים למצוא את הפריט המתאים בהזמנה לפי product
          // (ב-schema של orderItem מוגדר product: {...})
          const foundItem = order.items.find(
            (orderItem) =>
              orderItem.product.toString() === taskItem.productId.toString()
          );

          // אם מצאנו פריט מתאים - נשנה לו isAllocated ל-false
          if (foundItem) {
            foundItem.isAllocated = false;
          }

          // נשנה את הסטטוס של ההזמנה ל-pending
          if (order.status != "Pending") order.status = "Pending";
        });

        // שומרים את ההזמנה המעודכנת
        await order.save();
      }
    }

    // Unlink task from lead before deletion
    if (leadIdToUnlink) {
      await unlinkTaskFromLead(id, leadIdToUnlink);
    }

    // הסרת המשימה מרשימת המשימות של הפרויקט
    if (projectIdToUpdate) {
      await Project.findByIdAndUpdate(
        projectIdToUpdate,
        { $pull: { tasks: id } },
        { new: true }
      );
    }

    // כעת נוכל למחוק את המשימה
    await Task.findOneAndDelete({ _id: id, companyId });

    // Update project progress after task deletion
    if (projectIdToUpdate) {
      await updateProjectProgress(projectIdToUpdate);
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully, products are now unallocated",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
};

export const getDepartmentTasksWithoutProject = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const employeeId = decodedToken.employeeId;

    console.log("Company ID:", companyId);
    console.log("Employee ID:", employeeId);

    // מציאת המשתמש לפי מזהה העובד
    const user = await Employee.findOne({ _id: employeeId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // בדיקה אם המשתמש נמצא במחלקה
    const department = user.department;
    if (!department) {
      return res.status(400).json({
        success: false,
        message: "User department information is missing",
      });
    }
    console.log("User department:", department);

    // שליפת כל המשימות של המחלקה
    const tasks = await Task.find({
      companyId,
      departmentId: department,
    })
      .populate("departmentId", "name")
      .populate("assignedTo", "name email")
      .sort({ dueDate: 1 });

    if (!tasks || tasks.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No tasks found" });
    }
    console.log("Tasks:", tasks);

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching department tasks:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching tasks",
      error: error.message,
    });
  }
};
