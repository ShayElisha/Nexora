import express from "express";
import { getUsers, createUser } from "../controllers/superAdmin.controller.js";

const router = express.Router();

router.get("/", getUsers);
router.post("/signup", createUser);

export default router;