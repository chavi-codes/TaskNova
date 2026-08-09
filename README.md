# 🚀 TaskNova (React + Node.js + Express)

TaskNova is a modern SaaS-style Kanban application for organizing work — boards, lists, cards, and a planner view — built with React, Express, Node.js, and a fully custom light/dark UI.

---

## ✨ Features

- **Isolated per-user workspaces**: every account gets its own private workspace, board, and columns (`Backlog`, `Todo`, `In Progress`, `Testing`, `Done`) the moment they sign up. No data is ever shared between accounts.
- **Real authentication**: email/password signup and login backed by an Express API, salted+hashed passwords, and server-side session tokens.
- **Kanban board**: Inbox sidebar drawer, custom colored lists, drag-and-drop cards, top search bar, and a floating bottom navigation dock (`Inbox`, `Planner`, `Board`, `Switch boards`).
- **Card Modals**:
  - Interactive checklists with real-time percentage completion progress bar.
  - Custom color-coded labels.
  - Due date selector and status tracking.
  - Activity & comments feed.
- **Planner / Schedule View**: Toggle between the Kanban board and a Planner calendar schedule.
- **Light & Dark themes**: a polished light theme (indigo primary, soft neutral backgrounds) alongside the original dark theme.
- **Full REST API storage**: persistent JSON database (`server/data/db.json`) powered by Express and Node.js.

---

## 🚀 Quick Start Guide

### 1. Install dependencies

From the project root:
```bash
npm install
cd client && npm install && cd ..
```

### 2. Run the backend API server

```bash
npm run server
```
*Server starts on `http://localhost:5000`*

### 3. Run the frontend React app

In a separate terminal:
```bash
npm run client
```
*App launches on `http://localhost:3000` with automatic API proxying to the server.*

---

## 📁 File Structure

```
kanban/
├── server/
│   ├── data/
│   │   └── db.json          # Persistent database: users, sessions, per-user workspaces
│   ├── package.json
│   └── server.js             # Express REST API (auth + board CRUD, all user-scoped)
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BoardView.jsx
│   │   │   ├── BottomDock.jsx
│   │   │   ├── CardModal.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── LoginModal.jsx
│   │   │   ├── SignupModal.jsx
│   │   │   ├── PlannerView.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── UserProfilePopover.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── package.json
└── README.md
```

## 🔐 Data isolation

Every board/list/card API route requires a valid `Authorization: Bearer <token>` header issued at signup/login, and every read or write is scoped to that token's user ID on the server. Logging out clears the token client-side and invalidates the session server-side, so no account's boards or tasks are ever visible to another account.
