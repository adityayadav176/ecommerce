const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

app.get('/', (req, res) => {
    res.send("Hello from the Server");
});

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true
}))

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))

module.exports = app;