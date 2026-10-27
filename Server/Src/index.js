const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
dotenv.config();

const urlRoutes = require('./Routes/Url');
const ConnectionToMongoDb = require('./connection');
const { syncRedisCounter, flushClicksToMongo } = require('./Services/Url');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
});

ConnectionToMongoDb()
    .then(async () => {
        console.log('mongoDb is connected');

        try {
            await syncRedisCounter();
            console.log('Redis counter synced with MongoDB');
        } catch (err) {
            console.error('Redis counter sync failed:', err);
        }

        setInterval(flushClicksToMongo, 30 * 1000);

        setInterval(async () => {
            try {
                await mongoose.connection.db.admin().ping();
                console.log('mongodb keep alive ping successful');
            } catch (err) {
                console.error('mongodb keep alive ping failed:', err);
            }
        }, 3 * 24 * 60 * 60 * 1000);
    })
    .catch(err => console.log('Error: ', err));

app.use(helmet());
app.use(express.json());
app.use(cors(corsOptions));

app.get('/', (req, res) => {
    res.send('working');
});

app.get('/ping', (req, res) => {
    console.log('cron-job-ping');
    res.status(200).send('pong');
});

app.use('/api', limiter, urlRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'route not found' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
    console.log(`Server is live at: http://localhost:${PORT}`);
});
