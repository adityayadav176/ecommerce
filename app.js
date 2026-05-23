import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express();

app.get('/', (req, res) => {
    res.send("Hello from the Server");
});

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))

// import 
import userRouter from "./src/routes/user.routes.js";
import productRouter from "./src/routes/product.routes.js";
import addressRouter from "./src/routes/address.routes.js";
import cartRouter from "./src/routes/cart.routes.js";
import wishListRouter from "./src/routes/wishlist.routes.js"
import okkRouter from "./src/routes/okk.routes.js";
import categoryRouter from "./src/routes/category.routes.js"

//router declaration

app.use("/api/auth/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/address", addressRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishListRouter);
app.use("/api/everything", okkRouter);
app.use("/api/category", categoryRouter);

export default app;