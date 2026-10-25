import { Schema, model, Document, Types } from "mongoose";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  icon: string;
  description?: string;
  isActive: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, required: true, default: "Briefcase" },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    image: { type: String },
  },
  { timestamps: true }
);

export const Category = model<ICategory>("Category", categorySchema);

