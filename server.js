const express = require("express");
const mysql = require("mysql2");
const QRCode = require("qrcode");
const bodyParser = require("body-parser");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// DB connection
const db = mysql.createConnection({
  port: 3306,
  host: "bkqrilaporhnuhssdlog-mysql.services.clever-cloud.com",
  user: "ugydl8dxpzwl87wx",
  password: "RxGEKXT0Lv1eNY1PKAkq",
  database: "bkqrilaporhnuhssdlog"
});

// Create table if not exists
db.query(`
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  phone VARCHAR(20),
  aadhaar VARCHAR(20),
  qr_code VARCHAR(255) UNIQUE,
  used TINYINT(1) DEFAULT 0
)`);

// Route: Register User + Generate QR
app.post("/register", (req, res) => {
  const { name, phone, aadhaar } = req.body;
  // console.log(req.body)
  const qrCodeText = `${name}|${phone}|${aadhaar}|${Date.now()}`;

  db.query(
    "INSERT INTO users (name, phone, aadhaar, qr_code, used) VALUES (?, ?, ?, ?, 0)",
    [name, phone, aadhaar, qrCodeText],
    (err) => {
      if (err) return res.send("Error saving user: " + err);

      QRCode.toDataURL(qrCodeText, (err, url) => {
        if (err) return res.send("Error generating QR");

   res.send(`
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #f2f2f2;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .ticket {
        width: 350px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        overflow: hidden;
        text-align: center;
        padding: 20px;
        border: 2px dashed #444;
        position: relative;
      }
      .ticket::before,
      .ticket::after {
        content: "";
        width: 20px;
        height: 20px;
        background: #f2f2f2;
        border-radius: 50%;
        position: absolute;
      }
      .ticket::before {
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
      }
      .ticket::after {
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
      }
      h2 {
        margin: 0;
        font-size: 22px;
        color: #222;
      }
      .info {
        margin: 15px 0;
        font-size: 16px;
        color: #333;
        text-align: left;
      }
      .info p {
        margin: 6px 0;
      }
      .qr {
        margin: 15px 0;
      }
      .back {
        display: inline-block;
        padding: 10px 15px;
        margin-top: 10px;
        background: #007BFF;
        color: white;
        text-decoration: none;
        border-radius: 6px;
      }
      .back:hover {
        background: #0056b3;
      }
    </style>
  </head>
  <body>
    <div class="ticket">
      <h2>🎟 Event Ticket</h2>
      <div class="info">
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Aadhaar:</b> ${aadhaar}</p>
        <p><b>Status:</b> Active</p>
      </div>
      <div class="qr">
        <img src="${url}" />
      </div>
      <a class="back" href="/">⬅ Back to Register</a>
    </div>
  </body>
  </html>
`);

      });
    }
  );
});

// Route: Verify QR
app.post("/verify", (req, res) => {
  const { code } = req.body;
    // console.log(req.body)

  db.query("SELECT * FROM users WHERE qr_code = ? AND used = 0", [code], (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      db.query("UPDATE users SET used = 1 WHERE qr_code = ?", [code]);
      res.json({ valid: true, message: "✅ Ticket valid. Access granted!" });
    } else {
      res.json({ valid: false, message: "❌ Invalid or Expired Ticket!" });
    }
  });
});

app.listen(3000, () => console.log("🚀 Server running at http://localhost:3000"));
