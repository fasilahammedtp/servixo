import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Worker } from "../models/Worker";

async function run() {
  await connectDB();

  console.log("Updating all workers in DB to be verified, available, and skilled in all categories near [75.7721, 11.2448]...");

  const allSkills = [
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Painting",
    "Cleaning",
    "AC Repair",
    "Appliance Repair"
  ];

  const updateResult = await Worker.updateMany(
    {},
    {
      $set: {
        verificationStatus: "verified",
        isAvailable: true,
        skills: allSkills,
        location: {
          type: "Point",
          coordinates: [75.7721, 11.2448]
        },
        serviceRadiusKm: 50
      }
    }
  );

  console.log(`Updated ${updateResult.modifiedCount} worker(s).`);

  const workers = await Worker.find();
  console.log("Current workers in DB:");
  console.log(JSON.stringify(workers, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
