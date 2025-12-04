import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

dotenv.config({ override: true });
console.log(">> USING DATABASE_URL =", process.env.DATABASE_URL);

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Performance Middleware
app.use(helmet());
app.use(compression());

// Rate Limiting: Max 100 requests per 15 mins
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// Allow localhost + Netlify in production
const allowedOrigins = [
  "http://localhost:5173",
  "https://spontaneous-mermaid-202f82.netlify.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("❌ CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// DB
let pool;
async function initDb() {
  try {
    pool = mysql.createPool(process.env.DATABASE_URL);
    console.log("✅ DB pool created");
  } catch (err) {
    console.error("❌ Failed to init DB:", err);
    process.exit(1);
  }
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/messages", async (req, res) => {
  try {
    const { username, message } = req.body;

    const sql = "INSERT INTO messages (username, message) VALUES (?, ?)";
    await pool.execute(sql, [username, message]);

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("❌ Error inserting:", err);
    res.status(500).json({ error: "db error" });
  }
});

app.get("/api/messages", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, message, created_at FROM messages ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: "db error" });
  }
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
