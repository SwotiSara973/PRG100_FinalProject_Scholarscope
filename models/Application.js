// models/Application.js
import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema(
  {
    scholarship: { type: mongoose.Schema.Types.ObjectId, ref: "Scholarship", required: true },
    student:     { type: mongoose.Schema.Types.ObjectId, ref: "User",        required: true },
    status: {
      type: String,
      enum: ["submitted", "reviewed", "accepted", "rejected"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

// One application per student per scholarship
ApplicationSchema.index({ scholarship: 1, student: 1 }, { unique: true });

export default mongoose.model("Application", ApplicationSchema);
