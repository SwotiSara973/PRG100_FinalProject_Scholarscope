// routes/applications.routes.js
import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Application from "../models/Application.js";
import Scholarship from "../models/Scholarship.js";

const router = Router();

// Student applies to a scholarship
router.post("/", auth("student"), async (req, res) => {
  const { scholarshipId } = req.body;
  if (!scholarshipId) return res.status(400).json({ message: "scholarshipId required" });

  const sch = await Scholarship.findById(scholarshipId).lean();
  if (!sch || sch.status !== "approved") {
    return res.status(400).json({ message: "Scholarship not available" });
  }

  // Prevent duplicate applications
  const existing = await Application.findOne({ scholarship: sch._id, student: req.user.id });
  if (existing) return res.status(200).json({ message: "Already applied", application: existing });

  const app = await Application.create({
    scholarship: sch._id,
    student: req.user.id,
    status: "submitted",
  });

  res.status(201).json({ message: "Applied", application: app });
});

// Current student's applications
router.get("/mine", auth("student"), async (req, res) => {
  const items = await Application.find({ student: req.user.id })
    .sort({ createdAt: -1 })
    .populate("scholarship", "title level faculty")
    .lean();
  res.json({ items });
});

export default router;
