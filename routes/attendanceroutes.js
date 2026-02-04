const express = require("express");
const db = require("../db");
const authMiddleware = require("../middlewares/authmiddleware");
const jwt = require("jsonwebtoken");

const router = express.Router();

const queryAsync = (sql, values = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const alreadyMarkedToday = async (userId) => {
  const today = new Date().toISOString().split("T")[0];

  const sql = `
    SELECT id FROM records
    WHERE user_id = ?
    AND DATE(login_time) = ?
  `;

  const result = await queryAsync(sql, [userId, today]);
  return result.length > 0;
};
const format12Hour = (date) => {
  return date.toLocaleString("en-IN", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });
};

const getTimePeriod = (date) => {
  return date.getHours() < 12 ? "AM" : "PM";
};

router.post("/present", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();

    const tenThirty = new Date();
    tenThirty.setHours(10, 30, 0, 0);

    const twoPM = new Date();
    twoPM.setHours(14, 0, 0, 0);

    // ❌ After 2 PM → present not allowed
    if (now >= twoPM) {
      return res.status(403).json({
        message: "Present not allowed after 2:00 PM",
      });
    }

    // ❌ Already marked today
    if (await alreadyMarkedToday(user.id)) {
      return res.status(400).json({
        message: "Attendance already marked today",
      });
    }

    let status = "Present";

    if (now >= tenThirty && now < twoPM) {
      status = "Half Leave";
    }

    // ✅ INSERT INTO DATABASE (THIS WAS MISSING)
    await queryAsync(
      `INSERT INTO records (user_id, name, login_time, status)
   VALUES (?, ?, ?, ?)`,
      [user.id, user.name, now, status],
    );

    res.json({
      message: "Attendance marked successfully",
      status,
      time: format12Hour(now), // e.g. 10:15:30 AM
      timePeriod: getTimePeriod(now), // AM / PM
      isoTime: now.toISOString(), // optional but powerful
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/absent", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();

    // 2:00 PM boundary
    const twoPM = new Date();
    twoPM.setHours(14, 0, 0, 0);

    // ❌ Already marked today
    if (await alreadyMarkedToday(user.id)) {
      return res.status(400).json({
        message: "Attendance already marked today",
      });
    }

    // Decide absent type
    const status = now < twoPM ? "Absent" : "Auto Absent";

    await queryAsync(
      `INSERT INTO records (user_id, name, login_time, status)
       VALUES (?, ?, ?, ?)`,
      [user.id, user.name, now, status],
    );

    res.json({
      message:
        status === "Absent"
          ? "Absent marked successfully"
          : "Auto absent marked successfully",
      status,
      time: format12Hour(now), // e.g. 03:10:22 PM
      timePeriod: getTimePeriod(now), // AM / PM
      isoTime: now.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
