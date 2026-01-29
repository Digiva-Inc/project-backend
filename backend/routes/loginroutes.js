const express = require('express')
const db = require("../db")

const router = express.Router()

const admin_email = "admin@gmail.com";
const admin_password = "admin123";
const admin_name = "admin";

router.post("/login", (req, res) => {
    const { email, password } = req.body;


    if (
        (email === admin_email && password === admin_password)
    ) {
        return res.json({
            role: "admin",
            message: "Admin login successful",
        });
    }

    else {
      
        const sql = "SELECT id, name, email, role FROM user WHERE email = ? AND password = ?";

        db.query(sql, [email, password], (err, result) => {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ message: "Database error" });
            }

            const user = result[0]

            if (result.length > 0) {
                return res.status(200).json({
                    role: user.role,
                    user: user.name,
                    message: "User login successful",
                });
            }

            return res.status(401).json({ message: "Invalid credentials" });
        });
    }
})



router.post("/register", (req, res) => {
  const { name, email, mobile, password ,role} = req.body;

  if (!name || !email || !mobile || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql =
    "INSERT INTO user (name, email, mobile, password, role) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [name, email, mobile, password, role], (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({ message: "User registration failed" });
    }

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
    });
  });
});


module.exports = router;