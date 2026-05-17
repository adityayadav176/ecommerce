import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({

    totalUsers: {
        type: Number,
        default: 0
    },

    totalOrders: {
        type: Number,
        default: 0
    },

    totalProducts: {
        type: Number,
        default: 0
    },

    totalRevenue: {
        type: Number,
        default: 0
    },

    totalRefunds: {
        type: Number,
        default: 0
    },

    date: {
        type: Date,
        default: Date.now
    }

});

export const Analytics = mongoose.model("Analytics", analyticsSchema);