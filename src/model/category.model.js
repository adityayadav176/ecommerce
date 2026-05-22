import mongoose, {Schema} from "mongoose";

const categorySchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
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
        lowercase: true
    }],
    image: {
        type: String,
        default: "",
    },
    isActive: { 
        type: Boolean,
        default: true
    }
},{timestamps: true})

export const Category = mongoose.model("Category", categorySchema);