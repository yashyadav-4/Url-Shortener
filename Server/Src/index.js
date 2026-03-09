const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();
const redis = require('./RedisClient');
const axios= require('axios');

const urlRoutes = require('./Routes/Url');


const ConnectionToMongoDb = require('./connection')


const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

const axios = require('axios');

setInterval(() => {
    axios.get(process.env.BACKEND_URL)
        .then(() => console.log('Self-ping successful'))
        .catch((err) => console.error('Self-ping failed', err));
}, 600000);

ConnectionToMongoDb()
    .then(() => {
        console.log('mongoDb is connected')
    })
    .catch(err => console.log('Error: ', err));

// middlewares
app.use(express.json());
app.use(cors(corsOptions));

//routes

app.get('/', (req, res) => {
    res.send('working');
})

app.use('/api', urlRoutes);

app.listen(PORT, () => {
    console.log(`Server is live at: http://localhost:${PORT}`);
})