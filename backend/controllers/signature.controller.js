import Signature from "../models/signature.model.js";
import jwt from "jsonwebtoken";

export const getAllSignatureLists = async (req, res) => {
  const token = req.cookies["auth_token"];

  if (!token) {
    console.error("Token is missing in request headers.");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) {
    console.error("Invalid token: Missing companyId");
    return res.status(400).json({ success: false, message: "Invalid token" });
  }
  const companyId = decodedToken.companyId;
  try {
    const signatureLists = await Signature.find({ companyId });
    res.status(200).json({ success: true, data: signatureLists });
  } catch (error) {
    console.error("Error retrieving signature lists:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving signature lists",
      error: error.message,
    });
  }
};
export const createSignature = async (req, res) => {
  try {
    const { name, signers } = req.body;
    const token = req.cookies["auth_token"];

    // בדיקת אימות
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token not provided." });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ message: "Unauthorized: Invalid token." });
    }

    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!Array.isArray(signers) || signers.length === 0) {
      return res
        .status(400)
        .json({ message: "Signers must be a non-empty array." });
    }

    signers.sort((a, b) => {
      if (a.role === "Admin" && b.role !== "Admin") return 1;
      if (a.role !== "Admin" && b.role === "Admin") return -1;
      return 0;
    });

    signers.forEach((signer, index) => {
      signer.order = index;
    });

    const newSignature = new Signature({
      companyId: decodedToken.companyId,
      employeeId: decodedToken.employeeId,
      name,
      requiredSignatures: signers.length,
      signers,
    });

    await newSignature.save();

    res.status(201).json(newSignature);
  } catch (error) {
    console.error("Error creating signature:", error);
    res.status(500).json({
      message: "An error occurred while creating the signature.",
      error: error.message,
    });
  }
};

export const addSignature = async (req, res) => {
  try {
    const { certificateId, signerName } = req.body;

    // Fetch the signature record
    const signature = await Signature.findOne({ certificateId });

    if (!signature) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    if (signature.status === "completed") {
      return res.status(400).json({ message: "Signatures already completed" });
    }

    const currentSigner = signature.signers[signature.currentSignerIndex];

    if (currentSigner.name !== signerName) {
      return res.status(400).json({
        message: `It's not ${signerName}'s turn to sign. Current signer: ${currentSigner.name}`,
      });
    }

    // Update signer details
    currentSigner.hasSigned = true;
    currentSigner.timestamp = new Date();
    signature.currentSignatures += 1;

    // Move to the next signer if there are more signers
    if (signature.currentSignerIndex + 1 < signature.signers.length) {
      signature.currentSignerIndex += 1;
    }

    // If all signatures are completed
    if (signature.currentSignatures >= signature.requiredSignatures) {
      signature.status = "completed";
    }

    // Save the updated signature record
    await signature.save();
    res.status(200).json(signature);
  } catch (error) {
    console.error("Error adding signature:", error);
    res.status(500).json({ message: "Error adding signature", error });
  }
};
export const getSignatureStatus = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const signature = await Signature.findOne({ certificateId });

    if (!signature) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    res.status(200).json(signature);
  } catch (error) {
    res.status(500).json({ message: "Error fetching signature status", error });
  }
};
export const deleteSignatureList = async (req, res) => {
  try {
    const { id } = req.params;

    // אימות טוקן
    const token = req.cookies["auth_token"];
    if (!token) {
      console.error("Token is missing in request headers.");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      console.error("Invalid token: Missing companyId");
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const companyId = decodedToken.companyId;

    const deletedSignature = await Signature.findOneAndDelete({
      _id: id,
      companyId: companyId,
    });

    if (!deletedSignature) {
      return res.status(404).json({
        success: false,
        message: "Signature list not found or not associated with your company",
      });
    }

    res.status(200).json({
      success: true,
      message: "Signature list deleted successfully",
      data: deletedSignature,
    });
  } catch (error) {
    console.error("Error deleting signature list:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting signature list",
      error: error.message,
    });
  }
};
