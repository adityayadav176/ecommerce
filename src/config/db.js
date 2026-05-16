const mongoose = require("mongoose");

const connectToMongo = async() => {
    try {
       const mongoInstance = await mongoose.connect(process.env.MONGODB_URI);


        console.log('MongoDb Connect Successfully')
        console.log(`host ${mongoInstance.connection.host}`)
    } catch (error) {
        console.log('MongoDb Connection Failed', error);
        process.exit(1);
    }
};

module.exports = connectToMongo;