const app = require('./app.js')
const dotenv = require('dotenv');
const connectToMongo = require('./src/config/db.js')

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


