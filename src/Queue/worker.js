import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { sendEmail } from "../config/nodemailer.config.js";
import { emailTemplates } from "../utils/templateEngine.js";
console.log("🔥 Email Worker Started");
const emailWorker = new Worker(
    "emails",
    async (job) => {
        const { type, email, ...data } = job.data;

        if (!email) {
            throw new Error("Missing recipient email");
        }

        const template = emailTemplates(type, data);

        await sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
        });

        return {
            success: true,
            type,
            timestamp: Date.now(),
        };
    },
    {
        connection: redis,
        concurrency: 5,
    }
);


emailWorker.on("completed", (job, result) => {
    console.log("Job completed:", job.id, result);
});

emailWorker.on("failed", (job, err) => {
    console.error("Job failed:", job?.id, err.message);
});

emailWorker.on("error", (err) => {
    console.error("Worker error:", err);
});