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
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Ticket</title>
  <style>
    body {
      font-family: "Poppins", sans-serif;
      background: linear-gradient(135deg, #ff9a9e, #fecfef, #f6d365);
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      overflow: hidden;
      margin: 0;
    }

    /* Floating Diwali lights */
    .lights {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 0;
    }
    .light {
      position: absolute;
      width: 15px;
      height: 15px;
      background: radial-gradient(circle, #ffd700, transparent);
      border-radius: 50%;
      animation: floatUp 6s infinite ease-in-out;
    }
    @keyframes floatUp {
      0% { transform: translateY(100vh) scale(0.5); opacity: 0.7; }
      50% { opacity: 1; }
      100% { transform: translateY(-20vh) scale(1); opacity: 0; }
    }

    /* Ticket */
    .ticket {
      width: 350px;
      background: rgba(255,255,255,0.95);
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      overflow: hidden;
      text-align: center;
      padding: 25px;
      border: 3px dashed #ff9933;
      position: relative;
      z-index: 1;
      animation: fadeIn 1s ease-in-out;
    }

    .ticket::before,
    .ticket::after {
      content: "";
      width: 25px;
      height: 25px;
      background: #ff9a9e;
      border-radius: 50%;
      position: absolute;
    }
    .ticket::before {
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
    }
    .ticket::after {
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
    }

    h2 {
      margin: 0;
      font-size: 24px;
      color: #b3541e;
      text-shadow: 0 0 6px #ffcc33;
    }

    .info {
      margin: 18px 0;
      font-size: 16px;
      color: #333;
      text-align: left;
    }
    .info p {
      margin: 6px 0;
    }

    .qr {
      margin: 20px 0;
    }
    .qr img {
      width: 120px;
      height: 120px;
      border: 3px solid #ffcc33;
      border-radius: 12px;
      padding: 5px;
      background: #fff;
    }

    .back {
      display: inline-block;
      padding: 12px 20px;
      margin-top: 15px;
      background: linear-gradient(135deg, #ff512f, #dd2476);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .back:hover {
      transform: scale(1.05);
      box-shadow: 0 0 12px #ff9933;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <!-- Floating Diwali lights -->
  <div class="lights">
    <div class="light" style="left:10%; animation-delay:0s;"></div>
    <div class="light" style="left:30%; animation-delay:1.5s;"></div>
    <div class="light" style="left:50%; animation-delay:3s;"></div>
    <div class="light" style="left:70%; animation-delay:0.5s;"></div>
    <div class="light" style="left:90%; animation-delay:2s;"></div>
  </div>

  <!-- Ticket -->
  <div class="ticket">
    <h2>🪔 Diwali Event Ticket 🎆</h2>
    <div class="info">
      <p><b>Name:</b> ${name}</p>
      <p><b>Phone:</b> ${phone}</p>
      <p><b>Aadhaar:</b> ${aadhaar}</p>
      <p><b>Status:</b> Active ✅</p>
    </div>
    <div class="qr">
      <img src="${url}" alt="QR Code" />
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
