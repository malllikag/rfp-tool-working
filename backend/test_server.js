const express = require("express");
const app = express();
const PORT = 5000;

app.get("/api/test", (req, res) => {
    res.json({ message: "Test server working" });
});

app.listen(PORT, () => {
    console.log(`Test Server running at http://localhost:${PORT}`);
});
