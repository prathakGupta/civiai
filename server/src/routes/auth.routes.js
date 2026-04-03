import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const router = Router();

router.post("/login", (req, res) => {
  const { password } = req.body;

  if (!env.AUTH_ENABLED) {
    return res.json({ success: true, token: "auth-disabled", message: "Auth is disabled." });
  }

  if (!env.ADMIN_PASSWORD) {
    return res.status(500).json({ success: false, message: "ADMIN_PASSWORD is not configured on the server." });
  }

  if (password === env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "ADMIN" }, env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: "Invalid password." });
  }
});

export default router;
