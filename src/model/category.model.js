import mongoose, {Schema} from "mongoose";

import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },

    slug: {
        type: String,
        unique: true,
        lowercase: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    tags: [{
        type: String,
        index: true,
        lowercase: true,
        trim: true
    }],

    image: {
        url: {
            type: String,
            default: ""
        },
        public_id: {
            type: String,
            default: ""
        }
    },

    isActive: {
        type: Boolean,
        default: true
    },

}, { timestamps: true });

categorySchema.index({ title: 1 });

export const Category = mongoose.model("Category", categorySchema);