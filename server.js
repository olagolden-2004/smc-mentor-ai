require("dotenv").config();

const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "SMC Mentor AI",
    market: "XAUUSD",
    status: "online",
    version: "1.0.0"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SMC Mentor AI running on port ${PORT}`);
});
