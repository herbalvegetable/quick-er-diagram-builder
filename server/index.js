const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

const cors = require('cors');
const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));
app.use(express.json());

const path = require('path');

app.use(express.static(path.join(__dirname, "public")));

app.post('/generate-diagram', async (req, res) => {
    const { rulesText } = req.body;

    const response = await fetch('http://localhost:8000/generate-diagram', {
        method: 'POST',
        body: JSON.stringify({ rules: rulesText}),
        headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    res.json(data);
});