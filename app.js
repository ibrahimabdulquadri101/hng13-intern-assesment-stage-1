import express from "express";
import { PORT } from "./config/env.js";
import { connectToDb } from "./database/db.js";
import { stringRouter } from "./Routers/string.routes.js";
const app = express();
app.use(express.json());
app.use("/", stringRouter);
app.get("/", (req, res) => {
  res.send("welcome to string analyzer");
});
app.listen(PORT, (req, res) => {
  console.log("App running on localhost");
  connectToDb();
});
