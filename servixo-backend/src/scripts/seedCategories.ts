
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Category } from "../models/Category";

const categories = [
  { name: "Plumbing", icon: "wrench" },
  { name: "Electrical", icon: "bolt" },
  { name: "Carpentry", icon: "hammer" },
  { name: "Painting", icon: "paint-roller" },
  { name: "Cleaning", icon: "sparkles" },
  { name: "AC Repair", icon: "wind" },
  { name: "Appliance Repair", icon: "settings" },
];

async function seed() {
  await connectDB();

  for (const cat of categories) {
    await Category.findOneAndUpdate({ name: cat.name }, cat, { upsert: true, new: true });
  }

  console.log(`Seeded ${categories.length} categories.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
