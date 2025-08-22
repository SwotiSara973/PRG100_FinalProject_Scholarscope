import mongoose from "mongoose";

export const FACULTIES = [
  "IT", "Education", "HM", "Management", "Engineering",
  "Science", "Law", "Medicine", "Arts", "Agriculture"
];

const scholarshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    level: { type: String, enum: ["Bachelors", "Masters"], required: true },

    // NEW FIELDS
    faculty:   { type: String, enum: FACULTIES, required: true },
    criteria:  { type: String, default: "" },   // eligibility text
    activities:{ type: String, default: "" },   // ECAs/volunteering/etc.

    description: { type: String, default: "" },
    minGPA:      { type: Number, default: 0 },
    deadline:    { type: Date, required: true },
    org:         { type: String, default: "" },
    bannerPath:  { type: String, default: "" },

    status:   { type: String, enum: ["pending","approved","rejected"], default: "pending" },
    createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("Scholarship", scholarshipSchema);
