import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";

const router = Router();

function sign(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("role").optional().isIn(["student", "college"]) // admin is seeded only
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role = "student" } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hash,
      role
    });

    const token = sign(user);
    res
      .cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 864e5 })
      .status(201)
      .json({ message: "Registered", user: { id: user._id, name: user.name, role: user.role } });
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = sign(user);
    res
      .cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 864e5 })
      .json({ message: "Logged in", user: { id: user._id, name: user.name, role: user.role } });
  }
);

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token").json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token =
      (header.startsWith("Bearer ") && header.split(" ")[1]) ||
      (req.cookies && req.cookies.token);
    if (!token) return res.status(200).json({ user: null });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("_id name email role");
    res.json({ user });
  } catch {
    res.json({ user: null });
  }
});

export default router;
