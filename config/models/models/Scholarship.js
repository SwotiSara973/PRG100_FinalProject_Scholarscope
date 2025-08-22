import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    level: { type: String, enum: ["Bachelors", "Masters"], required: true },
    description: { type: String, default: "" },
    minGPA: { type: Number, default: 0 },
    deadline: { type: Date, required: true },
    org: { type: String, default: "" },
    bannerPath: { type: String, default: "" },              // file path if you upload an image
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // college/NGO user id
  },
  { timestamps: true }
);

export default mongoose.model("Scholarship", scholarshipSchema);
