import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = "./users.json";

// Fungsi untuk JSON
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// POST /register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Username dan password wajib diisi" });

  const users = loadUsers();
  const existing = users.find((u) => u.username === username);
  if (existing)
    return res.status(400).json({ message: "Username sudah terdaftar" });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), username, password: hashed };
  users.push(newUser);
  saveUsers(users);

  res.json({ message: "Registrasi berhasil", user: { username } });
});

// POST /login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Username dan password wajib diisi" });

  const users = loadUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Password salah" });

  const token = jwt.sign({ id: user.id, username: user.username }, "SECRETKEY", {
    expiresIn: "2h",
  });

  res.json({
    message: "Login berhasil",
    token,
    user: { username: user.username },
  });
});

// Run Server
app.listen(3000, () => console.log("Server jalan di http://localhost:3000"));
