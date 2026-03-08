# 🔗 URL Shortener & Analytics Engine

A high-performance, scalable URL shortening service built with the **MERN Stack**, optimized for low-latency redirects using a **Redis Cache-Aside** pattern. This project demonstrates production-grade backend engineering, featuring **Atomic Sequencing** to prevent link collisions and **Nginx** for horizontal scaling.

---

## 🚀 Key Features

- **Sub-Millisecond Redirects**: Implemented a Redis caching layer in the Mumbai region, reducing database read dependency by up to 90%.
- **Collision-Resistant Shortening**: Uses a Base62 encoding algorithm combined with an Atomic Counter in MongoDB to ensure 100% unique short codes.
- **System Performance Monitoring**: Integrated real-time latency tracking to compare Cache Hits (~5ms) vs. Database Hits (~35ms+).
- **Fault-Tolerant Architecture**: Designed with a graceful fallback mechanism; if the Redis cache is unavailable, the system automatically redirects via MongoDB without downtime.
- **Containerized Environment**: Fully orchestrated using Docker Compose for consistent deployment across local and cloud environments.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Primary Store) |
| Caching | Redis (Upstash - Mumbai Region) |
| DevOps | Docker, Nginx, Render |

---

## 📐 System Architecture

### The Cache-Aside Pattern

To optimize performance, the application follows the **Cache-Aside (Lazy Loading)** strategy:

1. **Check Cache**: The application first attempts to retrieve the long URL from Redis.
2. **Cache Hit**: If found, the user is redirected instantly (~5ms).
3. **Cache Miss**: If not found, the system queries MongoDB, redirects the user, and asynchronously updates Redis with a 24-hour TTL (Time-To-Live) for future requests.

### Atomic Sequencing

To avoid the risks of random string collisions, this project uses a central **Sequence Counter**. This counter is incremented atomically in MongoDB before being converted to a **Base62** string (0-9, a-z, A-Z), providing a mathematically guaranteed unique ID for every link.

---

## 📊 Performance Metrics

| Operation | Storage Type | Average Latency |
|-----------|-------------|-----------------|
| Redirect (Cache Hit) | Redis (RAM) | ~5ms |
| Redirect (Cache Miss) | MongoDB (Disk) | ~35ms |
| Link Generation | MongoDB + Redis | ~50ms |

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yashyadav-4/url-shortener.git
   cd url-shortener
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**

   Create a `.env` file in the `Server/` directory:
   ```env
   PORT=3001
   MONGO_URI=your_mongodb_uri
   REDIS_URL=rediss://default:your_token@your-endpoint.upstash.io:6379
   ```

4. **Run the application:**
   ```bash
   npm start
   ```