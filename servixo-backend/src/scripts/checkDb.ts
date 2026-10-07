import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Worker } from "../models/Worker";
import { Category } from "../models/Category";

async function run() {
  await connectDB();

  console.log("=== CATEGORIES ===");
  const categories = await Category.find();
  categories.forEach(c => {
    console.log(`ID: ${c._id}, Name: ${c.name}`);
  });

  console.log("\n=== WORKERS ===");
  const workers = await Worker.find();
  workers.forEach(w => {
    console.log({
      _id: w._id,
      skills: w.skills,
      isAvailable: w.isAvailable,
      verificationStatus: w.verificationStatus,
      location: w.location
    });
  });

  await mongoose.disconnect();
}

run().catch(console.error);
