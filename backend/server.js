import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();
console.log(">> USING DATABASE_URL =", process.env.DATABASE_URL);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: allow frontend origin
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  })
);

app.use(express.json());

// MySQL connection pool
let pool;

async function initDb() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = mysql.createPool(process.env.DATABASE_URL);
    console.log("✅ DB pool created");
  } catch (err) {
    console.error("❌ Error creating DB pool:", err);
    process.exit(1);
  }
}

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/messages", async (req, res) => {
  try {
    const { username, message } = req.body;

    if (!username || !message) {
      return res.status(400).json({ error: "username and message are required" });
    }

    const sql = "INSERT INTO messages (username, message) VALUES (?, ?)";
    await pool.execute(sql, [username, message]);

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("❌ Error inserting message:", err);
    res.status(500).json({ error: "db error" });
  }
});


app.get("/api/db-debug", async (req, res) => {
  try {
    const [[info]] = await pool.query(
      "SELECT DATABASE() AS db, @@hostname AS host, @@port AS port"
    );
    const [[countRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM messages"
    );

    res.json({
      dbInfo: info,
      messagesCount: countRow.count,
    });
  } catch (err) {
    console.error("db-debug error:", err);
    res.status(500).json({ error: "db debug failed" });
  }
});


app.get("/api/messages", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, message, created_at FROM messages ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "db error" });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to init DB:", err);
    process.exit(1);
  });

  