import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 5000;
const API_KEY = "aee530c3ab306f7f2fccea9e34c31664";
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
app.get("/weather", async (req, res) => {
  try {
    const city = req.query.city;
    if (!city) return res.status(400).json({ error: "City is required" });

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/weather/coords", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Latitude and longitude are required" });

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
