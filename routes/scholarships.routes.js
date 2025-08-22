import { Router } from "express";
import { body, validationResult } from "express-validator";
import { auth } from "../middleware/auth.js";
import Scholarship, { FACULTIES } from "../models/Scholarship.js";

const router = Router();

/**
 * CREATE (College/NGO) -> status: pending
 */
router.post(
  "/",
  auth("college"), // or auth("college","admin") if you want admins to be able to post too
  [
    body("title").trim().notEmpty(),
    body("level").isIn(["Bachelors", "Masters"]),
    body("faculty").isIn(FACULTIES),
    body("description").optional().isString(),
    body("criteria").optional().isString(),
    body("activities").optional().isString(),
    body("minGPA").optional().isFloat({ min: 0, max: 4 }),
    body("deadline").isISO8601().toDate(),
    body("org").optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const doc = await Scholarship.create({
      title: req.body.title,
      level: req.body.level,
      faculty: req.body.faculty,
      description: req.body.description || "",
      criteria: req.body.criteria || "",
      activities: req.body.activities || "",
      minGPA: req.body.minGPA ?? 0,
      deadline: req.body.deadline,
      org: req.body.org || "",
      createdBy: req.user.id,
      status: "pending",
    });

    res.status(201).json({ message: "Submitted", scholarship: doc });
  }
);

/**
 * LIST (Students browse)
 * supports: ?level=&faculty=&minGPA=&activities=&status=
 * - status defaults to "approved"
 * - you can pass status=pending to power the admin page you built
 */
router.get("/", async (req, res) => {
  const { level, faculty, minGPA, activities, status } = req.query;

  const allowedStatuses = ["approved", "pending", "rejected"];
  const q = { status: allowedStatuses.includes(status) ? status : "approved" };

  if (level && ["Bachelors", "Masters"].includes(level)) q.level = level;
  if (faculty && FACULTIES.includes(faculty)) q.faculty = faculty;
  if (minGPA) q.minGPA = { $lte: Number(minGPA) }; // show items whose requirement <= student's GPA
  if (activities) q.activities = { $regex: activities, $options: "i" };

  const items = await Scholarship.find(q).sort({ createdAt: -1 }).lean();
  res.json({ items });
});

/**
 * Latest for homepage
 */
router.get("/latest", async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 6), 12);
  const items = await Scholarship.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json({ items });
});

/**
 * College's own submissions (any status)
 */
router.get("/mine", auth("college"), async (req, res) => {
  const items = await Scholarship.find({ createdBy: req.user.id })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ items });
});

/**
 * Admin: pending list (protected)
 * (You can keep using this in admin if you prefer /pending over ?status=pending)
 */
router.get("/pending", auth("admin"), async (req, res) => {
  const items = await Scholarship.find({ status: "pending" }).sort({ createdAt: 1 }).lean();
  res.json({ items });
});

/**
 * Admin: approve
 */
router.patch("/:id/approve", auth("admin"), async (req, res) => {
  const doc = await Scholarship.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Approved", scholarship: doc });
});

/**
 * Admin: reject
 */
router.patch("/:id/reject", auth("admin"), async (req, res) => {
  const doc = await Scholarship.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Rejected", scholarship: doc });
});

export default router;
