const express = require("express");
const nodemailer = require("nodemailer");
const db = require("../data/db"); 

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT || 2525),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

router.post("/", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) return res.status(400).json({ message: "Email non valida" });

    // salvataggio su db senza duplicatre
    const [result] = await db
      .promise()
      .execute("INSERT IGNORE INTO subscribers (email) VALUES (?)", [email]);

    const inserted = result.affectedRows === 1;

    // Email di ringraziamento 
    if (inserted) {
      await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: "Grazie per esserti iscritto! 🎮",
        html: `<h2>Benvenuto!</h2><p>Grazie per esserti iscritto a Metal Games Solid Shop 😄</p>`,
      });
    }

    res.json({ ok: true, inserted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
