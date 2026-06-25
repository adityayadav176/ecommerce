// src/middlewares/error.middleware.js

const errorHandler = (err, req, res, next) => {
    console.error("GLOBAL ERROR:", err);
    return res.status(err.statusCode || 500).json({
        
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });

};

export { errorHandler };