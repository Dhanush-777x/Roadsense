const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.json());

// Endpoint to handle incoming sensor data
app.post("/sensordata", (req, res) => {
  const sensorData = req.body;
  const logFilePath = path.join(__dirname, "sensorDataLog.json");
  const logEntry = JSON.stringify(sensorData, null, 2) + '\n'; // Pretty print for better readability

  // Append sensor data to the log file
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error("Failed to write data to file:", err);
      return res.status(500).send("Internal Server Error");
    }
    console.log("Sensor data logged:", sensorData);
    res.status(200).send("Data received and logged");
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
