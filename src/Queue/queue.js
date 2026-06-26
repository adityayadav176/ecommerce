import { Queue } from "bullmq";
import {redis} from "../config/redis.js";

const emailQueue = new Queue("emails", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: {age: 24 * 3600},
        removeOnFail: {age: 7 * 24 * 3600},
    }
})

export {
    emailQueue
};