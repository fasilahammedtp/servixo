import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Worker } from "../models/Worker";

async function run() {
  await connectDB();

  const jobCoords: [number, number] = [76.2157, 10.516];

  const results = await Worker.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: jobCoords
        },
        distanceField: "distance",
        distanceMultiplier: 0.001,
        spherical: true
      }
    }
  ]);

  console.log("Database geoNear results for jobCoords:", JSON.stringify(results, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
