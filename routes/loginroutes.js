const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");

const router = express.Router();

const admin_email = "admin@gmail.com";
const admin_password = "admin123";
const admin_name = "admin";

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // ADMIN LOGIN
  if (email === admin_email && password === admin_password) {
    const token = jwt.sign(
      {
        user_id: 0,
        name: admin_name,
        role: "admin",
        email: admin_email,
      },
      process.env.JWT_SECRET, // ✅ FIXED
      { expiresIn: "1d" }
    );

    return res.json({
      role: "admin",
      token,
      message: "Admin login successful",
    });
  }

  // USER LOGIN
  const sql =
    "SELECT id, name, email, role FROM user WHERE email = ? AND password = ?";

  db.query(sql, [email, password], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error" });

    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result[0];

    const token = jwt.sign(
      {
        user_id: user.id, // ✅ VERY IMPORTANT
        name: user.name,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET, // ✅ FIXED
      { expiresIn: "1d" }
    );

    res.json({
      role: user.role,
      user: user.name,
      token,
      message: "User login successful",
    });
  });
});

module.exports = router;
