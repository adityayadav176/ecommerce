import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    size: [
        {
            type: String,
        },
    ],
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    finalPrice:{
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    stock: {
        type: Number,
        required: true,
        default: 1,
        min: 0,
    },
    sold: {
        type: Number,
        default: 0,
        min: 0,
    },
    tags: [{
        type: String,
        index: true
    }],
    shippingCost: {
        type: Number,
        default: 0,
        min: 0,
    },
    status: {
        type: String,
        enum: ["ACTIVE", "OUT_OF_STOCK", "DISCONTINUED"],
        default: "ACTIVE"
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    brand: {
        type: String,
        required: true,
        trim: true,
    },
    images:[
        {
            url: {
                type: String,
                required: true
            },
            public_id: {
                type: String,
                required: true
            }
        }
    ],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    numOfReviews: {
        type: Number,
        default: 0,
        min: 0,
    },
    discountPrice: {
        type: Number,
        required: true,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
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
}, { timestamps: true })

productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model("Product", productSchema);