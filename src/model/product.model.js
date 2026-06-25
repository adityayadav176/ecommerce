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
    finalPrice: {
        type: Number,
        default: 0,
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
        index: true,
        lowercase: true,
        trim: true
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
        type: mongoose.Types.ObjectId,
        ref: "Category",
        required: true
    },
    brand: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    images: [
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
        default: 0,
        validate: {
            validator: function (value) {
                return value <= this.price;
            },
            message: "Discount price cannot exceed product price"
        }
    },
    ratings: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            rating: {
                type: Number,
                min: 1,
                max: 5
            }
        }
    ],
    averageRating: {
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
}, { timestamps: true })
productSchema.index({ isPublished: 1, status: 1, createdAt: -1 });
productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model("Product", productSchema);

productSchema.pre("save", function (next) {

    if (this.stock <= 0) {
        this.status = "OUT_OF_STOCK";
    } else {
        this.status = "ACTIVE";
    }

    next();
})