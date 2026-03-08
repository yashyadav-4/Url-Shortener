const express= require('express');
const dotenv = require('dotenv');
const cors= require('cors');
dotenv.config();
const redis= require('./RedisClient');

const urlRoutes= require('./Routes/Url');


const ConnectionToMongoDb = require('./connection')


const app=express();
const PORT= process.env.PORT || 8000;

const corsOptions= {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods :['GET' ,'POST'],
    allowedHeaders:['Content-Type' , 'Authorization'],
    credentials:true,
};

ConnectionToMongoDb()
.then(()=>{
    console.log('mongoDb is connected')
})
.catch(err=>console.log('Error: ' ,err));

// middlewares
app.use(express.json());
app.use(cors(corsOptions));

//routes

app.get('/' , (req , res)=>{
    res.send('working');
})

app.use('/url' , urlRoutes);

app.listen(PORT ,()=>{
    console.log(`Server is live at: http://localhost:${PORT}`);
})