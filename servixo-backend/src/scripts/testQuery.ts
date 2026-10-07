import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Worker } from "../models/Worker";

async function run() {
  await connectDB();

  const coordinates: [number, number] = [76.35, 10];
  const [lng, lat] = coordinates;
  const categoryName = "AC Repair";

  console.log(`Running query for coordinates: ${coordinates}, categoryName: ${categoryName}`);

  // Test stage by stage
  const geoNearResult = await Worker.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng, lat]
        },
        distanceField: "distance",
        distanceMultiplier: 0.001,
        spherical: true
      }
    }
  ]);

  console.log("=== geoNearResult ===");
  console.log(JSON.stringify(geoNearResult, null, 2));

  const matchedWorkers = await Worker.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng, lat]
        },
        distanceField: "distance",
        distanceMultiplier: 0.001,
        spherical: true
      }
    },
    {
      $match: {
        verificationStatus: "verified",
        isAvailable: true,
        skills: categoryName,
        $expr: { $lte: ["$distance", "$serviceRadiusKm"] }
      }
    }
  ]);

  console.log("=== matchedWorkers ===");
  console.log(JSON.stringify(matchedWorkers, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
