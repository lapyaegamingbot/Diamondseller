require("dotenv").config();

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }
});

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "8887139740";

app.use(express.json());
app.use(express.static("public"));

app.post("/api/submit-order", upload.single("receipt"), async (req, res) => {
  if (!BOT_TOKEN) {
    return res.status(500).json({
      ok: false,
      message: "Telegram Bot Token မထည့်ရသေးပါ"
    });
  }

  if (!req.file) {
    return res.status(400).json({
      ok: false,
      message: "Receipt မပါပါ"
    });
  }

  const {
    userId,
    zoneId,
    package: diamondPackage,
    price,
    payment
  } = req.body;

  try {
    const form = new FormData();

    form.append("chat_id", CHAT_ID);

    form.append(
      "caption",
      `💎 NEW DIAMOND ORDER

🆔 User ID: ${userId}
🌐 Zone ID: ${zoneId}
💎 Package: ${diamondPackage}
💰 Price: ${price} Ks
💳 Payment: ${payment}`
    );

    const fileData = fs.readFileSync(req.file.path);

    form.append(
      "document",
      new Blob([fileData], {
        type: req.file.mimetype
      }),
      req.file.originalname
    );

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
      {
        method: "POST",
        body: form
      }
    );

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.description || "Telegram error");
    }

    res.json({
      ok: true,
      message: "Telegram သို့ ပို့ပြီးပါပြီ"
    });

  } catch (error) {

    res.status(500).json({
      ok: false,
      message: error.message
    });

  } finally {

    fs.unlink(req.file.path, () => {});

  }
});

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

app.listen(PORT, () => {
  console.log("Diamond Seller Server Started");
});
