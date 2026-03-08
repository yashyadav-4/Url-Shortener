
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL , {
    maxRetriesPerRequest:3,
    connectTimeout:10000, //10 seconds to connect to mumbai server
});

redis.on('connect' , ()=>{
    console.log('connected to upstash redis (mumbai server)');
})

redis.on('error' , (err)=>{
    console.error('Redis connection Error : ' , err);
})

module.exports=redis;