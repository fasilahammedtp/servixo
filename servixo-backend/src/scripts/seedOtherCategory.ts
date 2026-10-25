import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Category } from "../models/Category";

async function seedOtherCategory() {
  await connectDB();

  // Upsert ONLY the "Other" category.
  // $setOnInsert guarantees that if "Other" is newly inserted, it gets these default fields.
  // If "Other" already exists, its existing _id, icon, photo, and other fields remain untouched.
  // $set ensures isActive is true.
  // Zero other categories in the database are queried or modified.
  const category = await Category.findOneAndUpdate(
    { name: "Other" },
    {
      $setOnInsert: {
        name: "Other",
        icon: "MoreHorizontal",
        description: "Custom or specialized service requests.",
      },
      $set: {
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("Successfully ensured 'Other' category exists:");
  console.log({
    _id: category._id,
    name: category.name,
    icon: category.icon,
    isActive: category.isActive,
    description: category.description,
  });

  await mongoose.disconnect();
}

seedOtherCategory().catch((err) => {
  console.error("Failed to seed Other category:", err);
  process.exit(1);
});
