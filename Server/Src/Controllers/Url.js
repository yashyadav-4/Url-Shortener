const redis = require('../RedisClient');
const { shortenUrl, getOriginalUrl } = require('../Services/Url');
const Url = require('../Models/Url');

async function handleShortenUrl(req, res) {
    try {
        const { longUrl } = req.body;

        if (!longUrl) {
            return res.status(400).json({ success: false, message: 'url is required' });
        }

        let parsed;
        try {
            parsed = new URL(longUrl.trim());
        } catch {
            return res.status(400).json({ success: false, message: 'invalid url format' });
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return res.status(400).json({ success: false, message: 'only http and https urls are allowed' });
        }

        const privateIpRegex = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/i;
        if (privateIpRegex.test(parsed.hostname)) {
            return res.status(400).json({ success: false, message: 'private or internal urls are not allowed' });
        }

        const normalizedUrl = parsed.href;

        const result = await shortenUrl(normalizedUrl);

        await redis.set(result.shortCode, result.originalUrl, 'EX', 86400);

        return res.status(201).json({
            success: true,
            data: {
                shortCode: result.shortCode,
                originalUrl: result.originalUrl,
                shortUrl: `${req.protocol}://${req.get('host')}/api/${result.shortCode}`
            }
        });
    } catch (err) {
        console.error('Controller error(handleShortenUrl):', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

async function handleRedirect(req, res) {
    try {
        const { shortCode } = req.params;
        const start = Date.now();

        try {
            const cachedUrl = await redis.get(shortCode);
            if (cachedUrl) {
                console.log('Redis cache hit:', Date.now() - start, 'ms');
                // Increment clicks in the background even on a cache hit
                Url.updateOne({ shortCode }, { $inc: { clicks: 1 } })
                    .then(result => {
                        if (result.matchedCount === 0) console.warn('click update: no doc matched shortCode:', shortCode);
                    })
                    .catch(err => console.error('background click update error:', err));
                return res.redirect(cachedUrl);
            }
        } catch (err) {
            console.error('Redis error:', err);
        }

        const originalUrl = await getOriginalUrl(shortCode);
        if (!originalUrl) {
            return res.status(404).json({ success: false, message: 'Short link not found' });
        }

        redis.set(shortCode, originalUrl, 'EX', 86400).catch(err => console.error('cache update failed:', err));
        console.log('MongoDB hit (cache miss):', Date.now() - start, 'ms');
        return res.redirect(originalUrl);
    } catch (err) {
        console.error('Controller error(handleRedirect):', err);
        return res.status(500).json({ success: false, message: 'could not redirect' });
    }
}

module.exports = { handleRedirect, handleShortenUrl };
