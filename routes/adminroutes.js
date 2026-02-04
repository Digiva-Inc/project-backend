const express = require("express");
const db = require("../db");
const authmiddleware = require("../middlewares/authmiddleware");
const jwt = require("jsonwebtoken");

const router = express.Router();

/* =========================
   REGISTER API (WITH JWT)
========================= */
router.post("/register", authmiddleware, (req, res) => {
  const { name, email, mobile, password, role } = req.body;

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

    // ⚠️ Token generation is OPTIONAL here
    // Admin does not need new user's token
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: result.insertId,
        name,
        email,
        role,
      },
    });
  });
});


/*  ADMIN – FETCH ATTENDANCE RECORDS (JWT PROTECTED) user_id NOT SENT TO FRONTEND*/
router.get("/records", authmiddleware, (req, res) => {
  const sql = `SELECT id,name,login_time,status FROM records ORDER BY login_time DESC `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch records"
      });
    }

    res.json({
      success: true,
      total: results.length,
      data: results
    });
  });
});


/* =========================
   UPDATE ATTENDANCE (ADMIN)
========================= */
router.put("/update-status/:id", authmiddleware, (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    const sql = `
      UPDATE records
      SET status = ?
      WHERE id = ?
    `;

    db.query(sql, [status, id], (err, result) => {
        if (err) {
            console.error("Update error:", err);
            return res.status(500).json({ success: false });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });
        }

        res.json({
            success: true,
            message: "Status updated successfully"
        });
    });
});

/* =========================
   DELETE USER + RECORDS
========================= */

// Fetch Users for Removal
router.get("/users", authmiddleware, (req, res) => {
  db.query("SELECT id, name FROM user WHERE role = 'user'", (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch users" });
    }

    res.json({
      success: true,
      data: results
    });
  });
});

// delete user and their attendance records
router.delete("/delete-user/:user_id", authmiddleware, (req, res) => {
    const { user_id } = req.params;

    db.query("DELETE FROM records WHERE user_id = ?", [user_id], (err) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to delete attendance records"
            });
        }

        db.query("DELETE FROM user WHERE id = ?", [user_id], (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to delete user"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            res.json({
                message: "User and attendance records deleted successfully"
            });
        });
    });
});

module.exports = router;
