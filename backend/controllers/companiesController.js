import { getAllCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } 
from '../models/Companies.js';

export const getAll = async (req, res) => {
    try {
        const companies = await getAllCompanies();
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving companies', error });
    }
};

export const getById = async (req, res) => {
    try {
        const company = await getCompanyById(req.params.id);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving the company', error });
    }
};

export const create = async (req, res) => {
    try {
        const newCompany = await createCompany(req.body);
        res.status(201).json({ message: 'Company created', newCompany });
    } catch (error) {
        res.status(500).json({ message: 'Error creating company', error });
    }
};

export const update = async (req, res) => {
    try {
        await updateCompany(req.params.id, req.body);
        res.json({ message: 'Company updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating company', error });
    }
};

export const remove = async (req, res) => {
    try {
        await deleteCompany(req.params.id);
        res.json({ message: 'Company deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting company', error });
    }
};
