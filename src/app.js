import express from "express";
import cors from "cors"

const app = express();

//basic config
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));


// cors configurations
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://locahost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

//import the routes

import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js"

app.use("/api/v1/healthCheck" , healthCheckRouter)
app.use("/api/v1/auth" , authRouter)


app

app.get("/", (req, res) => {
    res.send("Welcome to basecampy");
});

app.get("/instagram", (req, res) => {
    res.send("This is instagram page");
});

export default app;