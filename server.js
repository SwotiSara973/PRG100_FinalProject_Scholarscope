// ---------- env ----------
import dotenv from "dotenv";
dotenv.config();

// ---------- core ----------
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// ---------- deps ----------
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import User from "./models/User.js"; 


// 👉 ADDED: JWT so we can decode the cookie for /api/auth/me
import jwt from "jsonwebtoken"; // 👉 ADDED

// ---------- routes ----------
import authRoutes from "./routes/auth.routes.js";
import scholarshipsRoutes from "./routes/scholarships.routes.js";
import applicationsRoutes from "./routes/applications.routes.js"; // ✅ add/import here

// ---------- setup ----------
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// basic routes
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------- helpers (non-breaking) ----------
// 👉 ADDED: read JWT from cookie or Authorization header
function getTokenFrom(req) {
  const c = req.cookies || {};
  const header = req.headers?.authorization || "";
  if (c.token) return c.token;       // common cookie name
  if (c.jwt) return c.jwt;           // alternate cookie name
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

// 👉 ADDED: /api/auth/me used by your front-end to get { user }
app.get("/api/auth/me", async (req, res) => {
  try {
    const raw = getTokenFrom(req);
    if (!raw) return res.json({ user: null });

    const decoded = jwt.verify(raw, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId || decoded.sub; // flexible payload support

    if (!userId) return res.json({ user: null });

    const user = await User.findById(userId).select("name email role");
    if (!user) return res.json({ user: null });

    // return exactly what your pages expect
    res.json({ user });
  } catch (err) {
    // invalid/missing token -> treat as logged out
    res.json({ user: null });
  }
});

// mount API routes (ORDER MATTERS: do this BEFORE starting the server)
app.use("/api/auth", authRoutes);
app.use("/api/scholarships", scholarshipsRoutes);
app.use("/api/applications", applicationsRoutes); // ✅ mount applications API

// ---------- seed admin once ----------
async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  if (!email) {
    console.log("ℹ️  Skipping admin seed (ADMIN_EMAIL not set)");
    return;
  }
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`👑 Admin exists: ${email}`);
    return;
  }
  const hash = await bcrypt.hash("Admin@12345", 10);
  await User.create({ name: "Administrator", email, password: hash, role: "admin" });
  console.log(`👑 Admin user created: ${email} (password: Admin@12345)`);
}

// ---------- boot ----------
async function start() {
  await connectDB(process.env.MONGO_URI);
  await ensureAdmin();
  app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
}
start();
