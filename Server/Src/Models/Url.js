const mongoose= require('mongoose')

const urlSchema= new mongoose.Schema({
    originalUrl:{
        type:String,
        required:true,
    },
    shortCode:{
        type:String,
        unique:true,
        required:true,
    },
    urlId:{
        type:Number,
        required:true,
        unique:true,
    },
    clicks:{
        type:Number,
        default:0
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
});

// dont need below one as when we say shortcode to be unique it creates a b tree to store in sorted order
// urlSchema.index({shortCode:1}); // for storing based on my custom indexing for faster look ups 
const Url= mongoose.model('Url' , urlSchema);
module.exports= Url;
