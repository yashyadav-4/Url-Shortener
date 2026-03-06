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
        return res.status(201).json({
            success:true,
            data:{
                shortCode: result.shortCode,
                originalUrl:result.originalUrl,
                shortUrl: `${req.protocol}://${req.get('host')}/url/${result.shortCode}` // req.get('host) dynamically gets domain 
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
        const originalUrl= await getOriginalUrl(shortCode);
        if(!originalUrl){
            return res.status(404).json({
                success:false,
                message: "Short link not found"
            })
        }
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