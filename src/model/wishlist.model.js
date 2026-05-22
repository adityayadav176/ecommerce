import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const wishlistSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        unique: true,
    },
    products: [{
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    }]
},{timestamps: true})

wishlistSchema.plugin(mongooseAggregatePaginate);
export const Wishlist = mongoose.model("Wishlist", wishlistSchema);