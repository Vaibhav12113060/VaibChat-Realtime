<p align="center">
  <h1 align="center">🚀 VaibChat – Real-Time Full Stack Chat Application</h1>
</p>

---

## 🧠 Overview

**VaibChat** is a robust, full-stack real-time chat application engineered to deliver seamless and scalable communication. Leveraging modern web technologies, it facilitates instant messaging, rich media sharing, and dynamic real-time updates.

Developed with a production-level mindset, VaibChat prioritizes clean architecture, high scalability, and exceptional real-time performance.

---

## 🎯 Key Features

### 💬 Real-Time Messaging

- **Instant Message Delivery:** Send and receive messages instantly with live updates, powered by WebSockets.
- **Typing Indicators:** See when other users are typing for a more interactive experience.
- **Message Status:** Track message status with sent and read receipts for clarity.

### 🗑️ Message Control

- **Delete Messages:** Options to delete messages "for me" or "for everyone".
- **Edit Messages:** Modify sent messages within a time limit.

### 📎 Media Sharing

- **Attachment Uploads:** Seamlessly send images, videos, and files, powered by Cloudinary.
- **Media Preview:** View media directly within the chat interface before sending.

### 👥 User & Conversation Management

- **Secure Authentication:** Robust user registration and login with JWT-based authorization.
- **Contact Management:** Add, view, and manage your contacts with custom nicknames.
- **Direct Messaging:** Engage in one-on-one conversations.
- **Advanced Group Chat Functionality:**
  - Create and manage group conversations.
  - Add and remove participants.
  - Assign and revoke admin roles.
  - Transfer group ownership.
  - Leave groups with appropriate handling for owners.

### 🎨 Intuitive UI/UX

- **Responsive Design:** Optimized for a seamless experience on various screen sizes.
- **Clean Interface:** A user-friendly chat layout with distinct sidebar and chat areas.
- **Profile Management:** Update your profile information, including name, status, and profile picture.

---

## 🛠️ Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,nodejs,express,mongodb,js,tailwind,vite,git" />
</p>

### Backend

- **Node.js & Express.js:** For building robust and scalable RESTful APIs.
- **MongoDB & Mongoose:** For flexible and structured NoSQL database management.
- **Socket.IO:** For enabling real-time, bidirectional event-based communication.
- **JWT (JSON Web Tokens) & Bcrypt:** For secure user authentication and password hashing.
- **Cloudinary & Multer:** For efficient cloud-based media storage and handling file uploads.

### Frontend

- **React.js & Vite:** For a fast, modern, and component-based user interface.
- **Tailwind CSS:** For rapid and responsive UI development with a utility-first approach.
- **React Router DOM:** For declarative routing in a single-page application.
- **Axios:** For promise-based HTTP client to communicate with the backend.
- **Socket.IO Client:** To connect with the real-time WebSocket server.

---

## 🏗️ Project Structure

### 🔹 Backend (`/Backend`)

```
Backend/
├── config/                 # Database, Cloudinary, & configuration setup
├── controllers/            # Business logic for API endpoints and sockets
├── middlewares/            # Custom middleware (e.g., authentication, error handling)
├── models/                 # Mongoose schemas for MongoDB collections
├── routes/                 # API route definitions
├── utils/                  # Utility functions
├── server.js               # Main entry point for the backend server
└── .env                    # Environment variables for configuration
```

### 🔹 Frontend (`/Frontend`)

```
Frontend/
├── src/
│   ├── components/         # Reusable UI components (e.g., ChatBubble, Sidebar)
│   ├── pages/              # Main application pages (e.g., Chat, Login)
│   ├── routes/             # Application routing logic
│   ├── services/           # API communication layer (Axios, Socket.IO)
│   ├── utils/              # Helper functions (e.g., formatTime)
│   ├── App.jsx             # Root component of the React application
│   └── main.jsx            # Entry point for React DOM rendering
├── .env                    # Environment variables for frontend
└── vite.config.js          # Vite configuration file
```

---

## ⚙️ Installation & Setup

Follow these steps to get VaibChat up and running on your local machine.

### 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/vaibchat-realtime.git
cd vaibchat-realtime
```

### 2️⃣ Install Dependencies

Navigate to both `Backend` and `Frontend` directories and install their respective dependencies.

#### Backend:

```bash
cd Backend
npm install
```

#### Frontend:

```bash
cd ../Frontend
npm install
```

### 3️⃣ Environment Variables

Create a `.env` file in the `/Backend` directory and add the following variables. Replace the placeholder values with your actual credentials.

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create another `.env` file in the `/Frontend` directory to specify the backend URL.

```env
VITE_BACKEND_URL=http://localhost:8000
```

### 4️⃣ Run Application

You need to run two separate commands in two different terminals to start both the backend and frontend servers.

#### Start Backend Server (from `/Backend` directory):

```bash
npm run dev
```

#### Start Frontend Development Server (from `/Frontend` directory):

```bash
npm run dev
```

The application should now be accessible in your browser at `http://localhost:5173` (or another port specified by Vite).

---

## 🔄 Working Flow

1.  **User Authentication:** Users register or log in. The backend validates credentials and returns a JSON Web Token (JWT).
2.  **Socket Connection:** The frontend establishes a WebSocket connection with the server, authenticating using the received JWT.
3.  **Real-time Communication:**
    - Messages are sent via a REST API endpoint to ensure they are persisted in the database.
    - After saving, the backend broadcasts the new message to all participants in the conversation room via Socket.IO.
    - The frontend receives the message in real-time and updates the UI without needing a page refresh.
4.  **Data Persistence:** All users, messages, conversations, and contacts are securely stored in MongoDB.

---

## 🔮 Future Enhancements

- 📞 **Voice & Video Calling:** Integrating WebRTC for peer-to-peer calls.
- 🌐 **Multi-Device Sync:** Real-time synchronization across multiple devices.
- 🔐 **End-to-End Encryption:** Implementing E2EE for maximum privacy.
- 📊 **Chat Analytics Dashboard:** A dashboard for users to see their chat statistics.

---

## 👨‍💻 Author

**Vaibhav Kumar**

- GitHub: https://github.com/Vaibhav12113060

---

## ⭐ Support

If you find this project useful or interesting, please consider giving it a ⭐ on GitHub! Contributions, issues, and feature requests are always welcome.

---

## 📄 License

This project is open-source and available under the MIT License.
