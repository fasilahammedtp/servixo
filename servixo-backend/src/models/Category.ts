import { Schema, model, Document, Types } from "mongoose";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  icon: string;
  description?: string;
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  icon: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });

export const Category = model<ICategory>("Category", categorySchema);
