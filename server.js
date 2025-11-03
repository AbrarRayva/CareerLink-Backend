import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT;
const USERS_FILE = path.join(__dirname, "users.json");

// Fungsi untuk membaca dan menyimpan users
function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      // Create empty users file if it doesn't exist
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving users:", error);
    throw new Error("Failed to save users");
  }
}

// Middleware untuk validasi input
function validateCredentials(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      message: "Username dan password wajib diisi" 
    });
  }

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ 
      message: "Username dan password harus berupa string" 
    });
  }

  if (username.trim().length < 3) {
    return res.status(400).json({ 
      message: "Username minimal 3 karakter" 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      message: "Password minimal 6 karakter" 
    });
  }

  next();
}

// Middleware untuk verifikasi JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token tidak ditemukan" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token tidak valid atau expired" });
    }
    req.user = user;
    next();
  });
}

// POST /register
app.post("/register", validateCredentials, async (req, res) => {
  try {
    const { username, password } = req.body;
    const trimmedUsername = username.trim();

    const users = loadUsers();
    const existing = users.find((u) => u.username === trimmedUsername);
    
    if (existing) {
      return res.status(409).json({ message: "Username sudah terdaftar" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = { 
      id: Date.now(), 
      username: trimmedUsername, 
      password: hashed,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);

    res.status(201).json({ 
      message: "Registrasi berhasil", 
      user: { 
        id: newUser.id,
        username: newUser.username 
      } 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat registrasi" });
  }
});

// POST /login
app.post("/login", validateCredentials, async (req, res) => {
  try {
    const { username, password } = req.body;
    const trimmedUsername = username.trim();

    const users = loadUsers();
    const user = users.find((u) => u.username === trimmedUsername);
    
    if (!user) {
      return res.status(401).json({ message: "Username atau password salah" });
    }

    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(401).json({ message: "Username atau password salah" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login berhasil",
      token,
      user: { 
        id: user.id,
        username: user.username 
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat login" });
  }
});

// GET /profile - Protected route example
app.get("/profile", authenticateToken, (req, res) => {
  const users = loadUsers();
  const user = users.find((u) => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Terjadi kesalahan pada server" });
});

// Run Server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});