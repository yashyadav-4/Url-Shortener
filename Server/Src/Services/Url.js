const Url= require('../Models/Url');
const Counter = require('../Models/Counter');
const {encode}= require('../Utility/Base62');

async function shortenUrl(longUrl){
    try{
        const counter= await Counter.findOneAndUpdate(
            {_id:'url_count'},
            {$inc:{seq:1}}, // just incrementing
            {returnDocument:'after', upsert:true} // create counter if its first time
        )
        const shortUrl= encode(counter.seq);
        const newUrl=await Url.create({
            originalUrl: longUrl,
            shortCode:shortUrl,
            urlId:counter.seq
        });
        return newUrl;
    }
    catch(err){
        console.log('Service Error(shorten Url): ' , err);
        throw new Error("failed to shorten url");
    }
}
async function getOriginalUrl(shortCode){
    try{
        const urlData= await Url.findOne({shortCode});
        if(urlData){
            Url.updateOne({_id:urlData._id} , {$inc:{clicks:1}}).exec()
            .catch(err =>{
                console.error('background async update erroor :' , err);
            });
            // doing asynchronously to avoid user waiting we can do updating in background
            // exec() command basically tells that the query is ready now you can execute it because in general mongosse expects await to be used when querying
            return urlData.originalUrl;
        }
        return null;
    }
    catch(err){
        console.log('Service Error(get original url): ' , err);
        throw new Error("failed to get original url"); 
    }
}
module.exports= { shortenUrl , getOriginalUrl};