import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // hashed
    role: { type: String, enum: ["student", "college", "admin"], default: "student" }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
