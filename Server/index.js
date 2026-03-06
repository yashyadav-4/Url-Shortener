const express= require('express');

const {ConnectionToMongoDb}= require('./connection')

const app=express();
const PORT= process.env.PORT ;

const mongoPath=process.env.Path;
ConnectionToMongoDb(mongoPath)
.then(()=>{
    console.log('mongoDb is connected')
})
.catch(err=>console.log('Error: ' ,err));

app.get('/' , (req , res)=>{
    res.send('working');
})

app.listen(PORT ,()=>{
    console.log('Server is live at : ' , PORT);
})