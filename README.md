# 🎥 Video Streaming Backend API

A scalable and modular **backend API** for a video streaming platform with support for user-generated content, likes, tweet-style updates, and cloud-based media storage.

---

## 🚀 Features

- 🔐 **Authentication Middleware**
- 📹 **Video CRUD** (Create, Read, Update, Delete)
- 🖼️ Upload video and thumbnail to **Cloudinary**
- ❤️ Toggle **likes** on videos, comments, and tweets
- 📝 **Tweet-like micro-posting** system
- 👤 User-specific video and tweet retrieval
- 📦 MongoDB + Mongoose ODM
- 🛡️ Centralized Error & Response Handling
- 🔄 Async/Await & Express middleware pattern

---

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB** with **Mongoose**
- **Cloudinary** for media uploads
- **JWT** (JSON Web Tokens) for authentication
- **Multer** for file handling
- **REST API architecture**

---

## 📁 Project Structure
 # controllers
 - comment.controller.js 
 - dashboard.controller.js 
 - healthcheck.controller.js 
 - like.controller.js 
 - playlist.controller.js 
 - subscription.controller.js 
 - tweet.controller.js 
 - user.controller.js 
 - video.controller.js
 
 # models 
  - video.model.js 
  - like.model.js 
  - tweet.model.js 
  - user.model.js
  - subscription.model.js
  - playlist.model.js
  - dashboard.model.js
  - healthcheck.model.js
  - comment.model.js 
 # utils 
  - cloudinary.js 
  - asyncHandler.js 
  - APIResponse.js 
  - APIError.js 
 # routes 
  - video.routes.js 
  - tweet.routes.js 
  - like.routes.js
  - playlist.routes.js
  - dashboard.routes.js
  - user.routes.js
  - healthcheck.routes.js
  - comment.routes.js
  - subscription.routes.js

---

## 🧪 API Endpoints Overview

### 📹 Video
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/videos` | Fetch paginated videos |
| `GET` | `/videos/:id` | Get video by ID |
| `POST` | `/videos` | Publish a new video |
| `PATCH` | `/videos/:id` | Update video metadata & thumbnail |
| `DELETE` | `/videos/:id` | Delete video and cloud assets |
| `PATCH` | `/videos/:id/toggle-publish` | Toggle publish status |

---

### 💬 Tweets
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tweets` | Create a tweet |
| `GET` | `/tweets/:userId` | Get all tweets by a user |
| `PATCH` | `/tweets/:id` | Update a tweet |
| `DELETE` | `/tweets/:id` | Delete a tweet |

---

### ❤️ Likes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `PATCH` | `/likes/video/:videoId` | Toggle like on a video |
| `PATCH` | `/likes/comment/:commentId` | Toggle like on a comment |
| `PATCH` | `/likes/tweet/:tweetId` | Toggle like on a tweet |
| `GET` | `/likes/videos` | Get all liked videos by user |

---

## 🧳 Environment Variables

- **PORT** 
- **MONGODB_URI**
- **JWT_SECRET**
- **CLOUDINARY_CLOUD_NAME**
- **CLOUDINARY_API_KEY**
- **CLOUDINARY_API_SECRET**

---

## 📦 Setup & Installation

1. **Clone the repo**
```bash
    git clone https://github.com/Code-ymg/we-play-backend.git
    cd we-play-backend
```
2. **Install dependencies**
```bash
    npm install
```
3. **Add .env file**
4. **Run the server**

```bash 
    npm run dev 
```    
---

## 📌 Future Improvements

 - Add full comment system
 - WebSocket support for real-time updates
 - Video processing & streaming logic
 - Rate limiting & abuse protection
 - Unit & integration tests (Jest + Supertest)

