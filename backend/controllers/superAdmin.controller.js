import User from "../models/superAdmin.model.js";
import bcrypt from "bcrypt";
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    console.log("Response sent:", { success: true, user });
    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
