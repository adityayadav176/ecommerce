import "dotenv/config";
import app from './app.js';
import connectToMongo from './src/config/db.js';
import {redis} from "./src/config/redis.js";
import { transporter } from "./src/config/nodemailer.config.js";
import "./src/Queue/worker.js";

const PORT = process.env.PORT || 12000

const startServer = async () => {
    try {
        await connectToMongo();
        
        await redis.ping();

        const server = app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

        server.on("error", (err) => {
            console.error("Server Error:", err);
            process.exit(1);
        });

    } catch (err) {
        console.error("Startup Error:", err);
        process.exit(1);
    }
};

const checkSMTPConnection = async () => {

    try {

        await transporter.verify();

        console.log("SMTP SERVER IS READY ");

    } catch (error) {

        console.log("SMTP ERROR ");

        console.log(error);
    }
};

startServer();
checkSMTPConnection();


