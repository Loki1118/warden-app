import "dotenv/config";
import express from "express";
import cors from "cors";

import { getProperties } from "./use-cases/getProperties";
import { getWeatherCodes } from "./use-cases/getWeatherCodes";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (_req, res) => res.send("Warden Weather Test: OK"));
app.get("/get-properties", getProperties);
app.get("/weather-codes", getWeatherCodes);

app.listen(port, () => console.log(`Server on http://localhost:${port}`));
