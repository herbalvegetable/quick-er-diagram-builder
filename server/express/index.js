require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

const CLIENT_URL = process.env.CLIENT_URL;
const PYSERVER_URL = process.env.PYSERVER_URL;

const cors = require('cors');
const corsOptions = {
    origin: CLIENT_URL,
    optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));
app.use(express.json());

const path = require('path');

app.use(express.static(path.join(__dirname, "public")));

app.post('/generate-diagram', async (req, res) => {
    const { rulesText } = req.body;

    console.log('FastAPI Server URL: ', `${PYSERVER_URL}/generate-diagram`);
    try {
        const response = await fetch(`${PYSERVER_URL}/generate-diagram`, {
            method: 'POST',
            body: JSON.stringify({ rules: rulesText }),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(response);

        const data = await response.json();
        res.json(data);
    }
    catch(err){
        res.status(404).send({"error": err});
    }
});