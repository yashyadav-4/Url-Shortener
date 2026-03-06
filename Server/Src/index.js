const express= require('express');
const dotenv = require('dotenv');
const urlRoutes= require('./Routes/Url');

dotenv.config();

const ConnectionToMongoDb = require('./connection')


const app=express();
const PORT= process.env.PORT || 8000;

ConnectionToMongoDb()
.then(()=>{
    console.log('mongoDb is connected')
})
.catch(err=>console.log('Error: ' ,err));

// middlewares
app.use(express.json());

//routes

app.get('/' , (req , res)=>{
    res.send('working');
})

app.use('/url' , urlRoutes);

app.listen(PORT ,()=>{
    console.log(`Server is live at: http://localhost:${PORT}`);
})