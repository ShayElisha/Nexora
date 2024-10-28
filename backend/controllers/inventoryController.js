import {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
} from "../models/inventory.js";

// החזרת כל הפריטים במלאי
export const getAll = async (req, res) => {
  try {
    const inventory = await getAllInventory();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving inventory", error });
  }
};

// החזרת פריט במלאי לפי ID
export const getById = async (req, res) => {
  try {
    const inventoryItem = await getInventoryById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.json(inventoryItem);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving inventory item", error });
  }
};

// יצירת פריט חדש במלאי
export const create = async (req, res) => {
  try {
    const newInventoryItem = await createInventory(req.body);
    res
      .status(201)
      .json({ message: "Inventory item created", newInventoryItem });
  } catch (error) {
    res.status(500).json({ message: "Error creating inventory item", error });
  }
};

// עדכון פריט במלאי קיים
export const update = async (req, res) => {
  try {
    await updateInventory(req.params.id, req.body);
    res.json({ message: "Inventory item updated" });
  } catch (error) {
    res.status(500).json({ message: "Error updating inventory item", error });
  }
};

// מחיקת פריט מהמלאי
export const remove = async (req, res) => {
  try {
    await deleteInventory(req.params.id);
    res.json({ message: "Inventory item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting inventory item", error });
  }
};
