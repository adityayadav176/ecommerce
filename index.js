import "dotenv/config";
import app from './app.js';
import connectToMongo from './src/config/dB.js';

const PORT = process.env.PORT || 12000

connectToMongo().
then(()=> {
    app.listen(PORT ,() => {
    console.log(`Server Is Running On PORT http://localhost:${PORT}`);
    })
})
.catch((err)=>{
    console.log("MonogoDb Connection Error !! ", err)
})

import { transporter } from "./src/config/nodemailer.config.js";

const checkSMTPConnection = async () => {

    try {

        await transporter.verify();

        console.log("SMTP SERVER IS READY ");

    } catch (error) {

        console.log("SMTP ERROR ");

        console.log(error);
    }
};

checkSMTPConnection();


