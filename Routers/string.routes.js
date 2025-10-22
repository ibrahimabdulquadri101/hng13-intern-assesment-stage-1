import { Router } from "express";
import {
  analyzeString,
  Delete,
  filterByNaturalLanguage,
  getAllStrings,
  getSpecificStrings,
} from "../controllers/string.controller.js";
export const stringRouter = Router();
stringRouter.post("/strings", analyzeString);
stringRouter.get("/strings/:id", getSpecificStrings);
stringRouter.get("/strings", getAllStrings);
stringRouter.get(
  "/strings/filter-by-natural-language",
  filterByNaturalLanguage
);
stringRouter.delete("/strings/:id",Delete)