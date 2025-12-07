import jwt from "jsonwebtoken";
import Warehouse from "../models/warehouse.model.js";
import WarehouseLocation from "../models/warehouseLocation.model.js";

const getCompanyIdFromRequest = (req) => {
  if (req.companyId) return req.companyId;
  if (req.user?.companyId) return req.user.companyId;
  if (req.query?.companyId) return req.query.companyId;

  const token = req.cookies?.auth_token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.companyId || null;
  } catch (error) {
    return null;
  }
};

const buildWarehousePayload = (body = {}) => {
  const payload = {
    name: body.name?.trim(),
    code: body.code?.trim(),
    region: body.region?.trim(),
    status: body.status,
    automation: body.automation,
    capacity: body.capacity,
    utilization: body.utilization,
    lastAudit: body.lastAudit,
    address: body.address,
    managers: body.managers,
    alerts: body.alerts,
  };

  if (body.temperature !== undefined || body.humidity !== undefined) {
    payload.conditions = {
      temperature: Number(body.temperature ?? body.conditions?.temperature ?? 0),
      humidity: Number(body.humidity ?? body.conditions?.humidity ?? 0),
    };
  } else if (body.conditions) {
    payload.conditions = body.conditions;
  }

  if (
    body.inboundToday !== undefined ||
    body.outboundToday !== undefined ||
    body.throughput
  ) {
    payload.throughput = {
      inbound: Number(body.inboundToday ?? body.throughput?.inbound ?? 0),
      outbound: Number(body.outboundToday ?? body.throughput?.outbound ?? 0),
    };
  }

  if (body.metadata) {
    payload.metadata = body.metadata;
  }

  return payload;
};

export const getWarehouses = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const filters = { companyId };
    if (req.query.status) filters.status = req.query.status;
    if (req.query.region) filters.region = req.query.region;

    const warehouses = await Warehouse.find(filters).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: warehouses });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch warehouses",
      error: error.message,
    });
  }
};

export const createWarehouse = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.body?.name || !req.body?.region) {
    return res.status(400).json({
      success: false,
      message: "Warehouse name and region are required",
    });
  }

  try {
    const payload = buildWarehousePayload(req.body);
    const warehouse = await Warehouse.create({
      companyId,
      ...payload,
    });

    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create warehouse",
      error: error.message,
    });
  }
};

export const updateWarehouse = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const payload = buildWarehousePayload(req.body);
    const warehouse = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, companyId },
      payload,
      { new: true, runValidators: true }
    );

    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update warehouse",
      error: error.message,
    });
  }
};

export const deleteWarehouse = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const warehouse = await Warehouse.findOneAndDelete({
      _id: req.params.id,
      companyId,
    });

    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    await WarehouseLocation.deleteMany({ warehouseId: req.params.id });

    res.status(200).json({ success: true, message: "Warehouse deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete warehouse",
      error: error.message,
    });
  }
};

export const getWarehouseLocations = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const locations = await WarehouseLocation.find({
      companyId,
      warehouseId: req.params.warehouseId,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch warehouse locations",
      error: error.message,
    });
  }
};

export const createWarehouseLocation = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.body?.name) {
    return res
      .status(400)
      .json({ success: false, message: "Location name is required" });
  }

  try {
    const location = await WarehouseLocation.create({
      companyId,
      warehouseId: req.params.warehouseId,
      ...req.body,
    });

    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create warehouse location",
      error: error.message,
    });
  }
};

export const updateWarehouseLocation = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const location = await WarehouseLocation.findOneAndUpdate(
      {
        _id: req.params.locationId,
        companyId,
        warehouseId: req.params.warehouseId,
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    res.status(200).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update warehouse location",
      error: error.message,
    });
  }
};

export const deleteWarehouseLocation = async (req, res) => {
  const companyId = getCompanyIdFromRequest(req);
  if (!companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const location = await WarehouseLocation.findOneAndDelete({
      _id: req.params.locationId,
      companyId,
      warehouseId: req.params.warehouseId,
    });

    if (!location) {
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    }

    res.status(200).json({ success: true, message: "Location deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete warehouse location",
      error: error.message,
    });
  }
};

