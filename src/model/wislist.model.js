import mongoose, {Schema} from "mongoose";

const wishlistSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    products: [{
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    }]
},{timestamps: true})

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);