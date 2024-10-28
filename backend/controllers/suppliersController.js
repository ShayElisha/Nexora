import { getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier } from '../models/suppliers.js';

// החזרת כל הספקים
export const getAll = async (req, res) => {
    try {
        const suppliers = await getAllSuppliers();
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving suppliers', error });
    }
};

// החזרת ספק לפי ID
export const getById = async (req, res) => {
    try {
        const supplier = await getSupplierById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving supplier', error });
    }
};

// יצירת ספק חדש
export const create = async (req, res) => {
    try {
        const newSupplier = await createSupplier(req.body);
        res.status(201).json({ message: 'Supplier created', newSupplier });
    } catch (error) {
        res.status(500).json({ message: 'Error creating supplier', error });
    }
};

// עדכון פרטי ספק קיים
export const update = async (req, res) => {
    try {
        await updateSupplier(req.params.id, req.body);
        res.json({ message: 'Supplier updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating supplier', error });
    }
};

// מחיקת ספק
export const remove = async (req, res) => {
    try {
        await deleteSupplier(req.params.id);
        res.json({ message: 'Supplier deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting supplier', error });
    }
};
