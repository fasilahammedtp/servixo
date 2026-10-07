import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../models/User";

async function run() {
  await connectDB();

  console.log("=== USERS ===");
  const users = await User.find();
  users.forEach(u => {
    console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
