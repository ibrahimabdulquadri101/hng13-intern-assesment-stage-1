import mongoose from "mongoose";
import { DB_URI } from "../config/env.js";

export const connectToDb = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log("Database running");
  } catch (error) {
    console.log(error);
  }
};
