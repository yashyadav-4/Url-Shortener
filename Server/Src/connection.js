const mongoose=require('mongoose');
const url= process.env.MONGO_URL;
async function ConnectionToMongoDb(){
    return mongoose.connect(url);
}
module.exports= ConnectionToMongoDb;