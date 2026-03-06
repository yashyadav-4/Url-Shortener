const mongoose=require('mongoose');
async function ConnectionToMongoDb(url){
    return mongoose.connect(url);
}
module.exports= {
    ConnectionToMongoDb,
};