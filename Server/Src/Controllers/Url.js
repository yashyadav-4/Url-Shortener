const redis= require('../RedisClient');
const {shortenUrl , getOriginalUrl}= require('../Services/Url');

async function handleShortenUrl(req , res){
    try{
        const {longUrl}= req.body;

        if(!longUrl){
            return res.status(400).json({
                success:false,
                message:"url is required"
            })
        }

        try{
            new URL(longUrl)
        }catch(err){
            return res.status(400).json({
                success:false,
                message:"not a url ,invalid format"
            })
        }
        
        const result= await shortenUrl(longUrl);
        
        // redis cache
        await redis.set(result.shortCode , result.originalUrl , 'EX' , 86400);

        return res.status(201).json({
            success:true,
            data:{
                shortCode: result.shortCode,
                originalUrl:result.originalUrl,
                shortUrl: `${req.protocol}://${req.get('host')}/api/${result.shortCode}` // req.get('host) dynamically gets domain 
            }
        })

    }catch(err){
       console.log('controllers error(handle shortenurl) :' , err);
       return res.status(500).json({ success:false , message: "Internal Server Error"}); 
    }
}
async function handleRedirect(req , res){
    try{
        const {shortCode}= req.params;
        
        const start=Date.now();

        // redis cache
        try{
             const cachedUrl= await redis.get(shortCode);
            if(cachedUrl){
                const duration= Date.now() - start; 
                console.log('Redis cache hit: ' , duration , ' in ms');
                return res.redirect(cachedUrl);
            }

        }catch(err){
            console.error('redis problem (maybe down) error: ', err);
        }
       
        // cache miss;
        const originalUrl= await getOriginalUrl(shortCode);
        if(!originalUrl){
            return res.status(404).json({
                success:false,
                message: "Short link not found"
            })
        }

        // updating redis so next click is hit and updating in background so wont effect user 
        redis.set(shortCode , originalUrl , 'EX' , 86400 ).catch(err=>{console.error("cache update failed: " , err)});
        const duration= Date.now()- start;
        console.log('mongo db hit(cache miss) : ', duration , ' in ms');
        return res.redirect(originalUrl);
    }catch(err){
       console.log('controllers error(handle redirect) :' , err);
       return res.status(500).json({ success:false , message: "could not redirect"}); 
    }
}

module.exports={
    handleRedirect ,
    handleShortenUrl,
}