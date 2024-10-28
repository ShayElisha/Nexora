import { getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } 
from '../models/customers.js';

export const getAll = async (req, res) => {
    try {
        const companies = await getAllCustomers();
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving Customers', error });
    }
};

export const getById = async (req, res) => {
    try {
        const company = await getCustomerById(req.params.id);
        if (!company) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving the Customers', error });
    }
};

export const create = async (req, res) => {
    try {
        const newCompany = await createCustomer(req.body);
        res.status(201).json({ message: 'Customer created', newCompany });
    } catch (error) {
        res.status(500).json({ message: 'Error creating Customer', error });
    }
};

export const update = async (req, res) => {
    try {
        await updateCustomer(req.params.id, req.body);
        res.json({ message: 'Customer updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating Customers', error });
    }
};

export const remove = async (req, res) => {
    try {
        await deleteCustomer(req.params.id);
        res.json({ message: 'Customer deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting Customer', error });
    }
};
