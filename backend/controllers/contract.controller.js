import Contract from "../models/Contract.model.js";
import jwt from "jsonwebtoken";

const verifyToken = (req) => {
  const token = req.cookies?.auth_token;
  if (!token) throw new Error("Unauthorized: No token provided");
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Create Contract
export const createContract = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const contract = new Contract({
      ...req.body,
      companyId: decoded.companyId,
      createdBy: decoded.employeeId || decoded.userId,
    });
    await contract.save();
    res.status(201).json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Contracts
export const getAllContracts = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { contractType, status } = req.query;
    const filter = { companyId: decoded.companyId };
    if (contractType) filter.contractType = contractType;
    if (status) filter.status = status;

    const contracts = await Contract.find(filter)
      .populate("parties.entityId")
      .sort({ startDate: -1 });

    res.status(200).json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Contract by ID
export const getContractById = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    const contract = await Contract.findOne({
      _id: id,
      companyId: decoded.companyId,
    }).populate("parties.entityId");

    if (!contract) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Contract
export const updateContract = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    const contract = await Contract.findOneAndUpdate(
      { _id: id, companyId: decoded.companyId },
      req.body,
      { new: true }
    );
    if (!contract) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

