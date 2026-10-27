const Url = require('../Models/Url');
const { encode } = require('../Utility/Base62');
const redis = require('../RedisClient');

async function syncRedisCounter() {
    const highest = await Url.findOne().sort({ urlId: -1 }).select('urlId').lean();
    const maxId = highest ? highest.urlId : 0;

    const current = await redis.get('url:global:counter');
    if (current === null || parseInt(current, 10) < maxId) {
        await redis.set('url:global:counter', maxId);
        console.log(`Redis counter synced: set to ${maxId}`);
    } else {
        console.log(`Redis counter OK: current=${current}, mongo max=${maxId}`);
    }
}

async function flushClicksToMongo() {
    try {
        const keys = await redis.keys('clicks:*');
        if (!keys.length) return;

        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.getdel(key));
        const results = await pipeline.exec();

        const bulkOps = [];
        keys.forEach((key, i) => {
            const count = parseInt(results[i][1], 10);
            if (!count) return;
            const shortCode = key.slice('clicks:'.length);
            bulkOps.push({
                updateOne: {
                    filter: { shortCode },
                    update: { $inc: { clicks: count } }
                }
            });
        });

        if (bulkOps.length) {
            await Url.bulkWrite(bulkOps, { ordered: false });
            console.log(`Click flush: updated ${bulkOps.length} URL(s)`);
        }
    } catch (err) {
        console.error('Click flush error:', err);
    }
}

async function shortenUrl(longUrl) {
    try {
        const existing = await Url.findOne({ originalUrl: longUrl });
        if (existing) return existing;

        const id = await redis.incr('url:global:counter');
        const shortCode = encode(id);

        const newUrl = await Url.create({
            originalUrl: longUrl,
            shortCode,
            urlId: id
        });
        return newUrl;
    } catch (err) {
        if (err.code === 11000) {
            const existing = await Url.findOne({ originalUrl: longUrl });
            if (existing) return existing;
        }
        console.error('Service Error(shortenUrl):', err);
        throw new Error('failed to shorten url');
    }
}

async function getOriginalUrl(shortCode) {
    try {
        const urlData = await Url.findOne({ shortCode });
        if (urlData) return urlData.originalUrl;
        return null;
    } catch (err) {
        console.error('Service Error(getOriginalUrl):', err);
        throw new Error('failed to get original url');
    }
}

module.exports = { shortenUrl, getOriginalUrl, syncRedisCounter, flushClicksToMongo };
