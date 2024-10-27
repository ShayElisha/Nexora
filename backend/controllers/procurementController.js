import {
  getAllProcurement,
  getProcurementById,
  createProcurement,
  updateProcurement,
  deleteProcurement,
} from "../models/procurement.js";

// החזרת כל הרכש
export const getAll = async (req, res) => {
  try {
    const procurements = await getAllProcurement();
    res.json(procurements);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving procurements", error });
  }
};

// החזרת רשומת רכש לפי ID
export const getById = async (req, res) => {
  try {
    const procurement = await getProcurementById(req.params.id);
    if (!procurement) {
      return res.status(404).json({ message: "Procurement record not found" });
    }
    res.json(procurement);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving procurement record", error });
  }
};

// יצירת רשומת רכש חדשה
export const create = async (req, res) => {
  try {
    const newProcurement = await createProcurement(req.body);
    res
      .status(201)
      .json({ message: "Procurement record created", newProcurement });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating procurement record", error });
  }
};

// עדכון רשומת רכש קיימת
export const update = async (req, res) => {
  try {
    await updateProcurement(req.params.id, req.body);
    res.json({ message: "Procurement record updated" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating procurement record", error });
  }
};

// מחיקת רשומת רכש
export const remove = async (req, res) => {
  try {
    await deleteProcurement(req.params.id);
    res.json({ message: "Procurement record deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting procurement record", error });
  }
};
