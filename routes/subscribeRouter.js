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
      const subject = "Grazie per esserti iscritto! 🎮";
      const preheader = "Benvenuto in Metal Games Solid Shop — novità retro in arrivo.";
      const html = `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${preheader}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
      style="margin:0;padding:0;background:#0b0f14;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
            style="width:600px;max-width:100%;background:#0f1622;border:1px solid #1f2a3a;border-radius:16px;overflow:hidden;">

            <!-- Header -->
            <tr>
              <td style="padding:22px 22px 18px 22px;background:linear-gradient(135deg,#111827,#0b1220);">
                <div style="font-family:Arial,Helvetica,sans-serif;color:#e5e7eb;">
                  <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;">
                    Metal Games Solid Shop
                  </div>
                  <div style="margin-top:10px;font-size:24px;line-height:1.2;font-weight:700;">
                    Iscrizione completata ✅
                  </div>
                  <div style="margin-top:8px;font-size:14px;color:#cbd5e1;">
                    Grazie per esserti iscritto — benvenuto a bordo 👾
                  </div>
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:22px;">
                <div style="font-family:Arial,Helvetica,sans-serif;color:#e5e7eb;font-size:15px;line-height:1.6;">
                  <p style="margin:0 0 12px 0;">
                    Ciao! 🎮
                  </p>

                  <p style="margin:0 0 16px 0;color:#cbd5e1;">
                    Ti confermiamo che la tua email è stata registrata con successo.
                    Da ora in poi ti aggiorneremo su <strong>novità old-gen</strong>, offerte e drop speciali.
                  </p>

                  <div style="padding:14px;border-radius:14px;border:1px solid #243043;background:#0b1220;color:#cbd5e1;">
                    <div style="font-weight:700;color:#e5e7eb;margin-bottom:6px;">IL NOSTRO MOTTO</div>
                    <div style="font-size:13px;">“NATI E INVECCHIATI PER GIOCARE”</div>
                  </div>

                  <!-- Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0 0;">
                    <tr>
                      <td style="border-radius:12px;background:#22c55e;">
                        <a href="http://localhost:5173/"
                          style="display:inline-block;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;
                          font-size:14px;font-weight:700;color:#04110a;text-decoration:none;border-radius:12px;">
                          Visita il sito →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:16px 0 0 0;color:#9ca3af;font-size:12px;">
                    Se non sei stato tu a iscriverti, ignora pure questa email.
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 22px;background:#0b1220;border-top:1px solid #1f2a3a;">
                <div style="font-family:Arial,Helvetica,sans-serif;color:#9ca3af;font-size:12px;line-height:1.5;">
                  © ${new Date().getFullYear()} Metal Games Solid Shop<br/>
                  Questa email è stata inviata automaticamente.
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
        `;
      const text = `Grazie per esserti iscritto!
      La tua email e' stata registrata con successo.
      `.trim();   


      await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject,
        html,
        text
      });
    }

    res.json({ ok: true, inserted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
