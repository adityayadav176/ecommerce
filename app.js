import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

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

export default app;