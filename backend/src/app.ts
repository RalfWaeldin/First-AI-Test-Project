import cors from "cors";
import type { ErrorRequestHandler } from "express";
import express from "express";
import { OpenAI } from "openai/client.js";
import mongoose from "mongoose";

import "#db";
import { olamaRoutes, openrouterRoutes } from "#routes";
import { DB_NAME, MONGO_URI, PORT } from "#config";

// ─── Express-Setup ────────────────────────────────────────────────────────────
//const port = process.env.PORT || 8080;
const app = express();

app.use(cors());
app.use(express.json());
app.use("/olama", olamaRoutes);
app.use("/openrouter", openrouterRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Running" });
});

// ────────────────────────────────────────────────────
app.use("/{*splat}", () => {
  throw Error("Page not found", { cause: { status: 404 } });
});

app.use(((err, _req, res, _next) => {
  console.log(err);
  res.status(err.cause?.status || 500).json({ message: err.message });
}) satisfies ErrorRequestHandler);

app.listen(PORT, () => console.log(`AI Proxy listening on port ${PORT}`));
