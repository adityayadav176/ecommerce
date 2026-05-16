const app = require('./app.js')
const dotenv = require('dotenv');
const connectToMongo = require('./src/config/db.js')

dotenv.config({
    path: './.env'
})

const PORT = process.env.PORT || 12000

app.listen(PORT ,() => {
    console.log(`Server Running On PORT http://localhost:${PORT}`);
});

connectToMongo();