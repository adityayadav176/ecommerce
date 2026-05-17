import mongoose, { Schema } from "mongoose";

const productSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: String,
        required: true,
        default: 0
    },
    sold: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String,
        index: true
    }],
    shippingCost: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["ACTIVE", "OUT_OF_STOCK", "DISCONTINUED"],
        default: true
    },
    category: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    images: [
        {
            type: String,
        }
    ],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    numOfReview: {
        type: Number,
        default: 0
    },
    discountPrice: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    reviews: [
   {
      type: Schema.Types.ObjectId,
      ref: "Review"
   }
]
},{timestamps: true})

export const Product = mongoose.model("Product", productSchema);