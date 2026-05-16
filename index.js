import app from './app.js';
import dotenv from 'dotenv'
import connectToMongo from './src/config/dB.js';

dotenv.config({
    path: './.env'
})

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


