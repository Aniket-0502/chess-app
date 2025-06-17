# ♟️ Chess App

A real-time multiplayer chess application built using **Next.js 14 (App Router)**, **WebSockets**, and **Tailwind CSS**. Play anonymously or sign in, challenge friends with custom time controls, and enjoy a clean, responsive UI.

---

## 🌐 Live Demo

>

---

## 🧩 Features

- ✅ Real-time chess game via **WebSockets**
- ✅ Dark theme with **black + violet** aesthetic
- ✅ Guest play (no auth required)
- ✅ Custom time controls (e.g., 1+0, 3+2, 10+5)
- ✅ Join via **room code**
- ✅ Endgame result modal with **move replay**
- ✅ Move history table
- ✅ Responsive UI (mobile-first)
- ✅ Profile page for registered users

---

## 🚀 Tech Stack

| Tech             | Description                         |
| ---------------- | ----------------------------------- |
| Next.js 14       | React framework with App Router     |
| Tailwind CSS     | Utility-first styling framework     |
| ShadCN UI        | Accessible and styled UI components |
| WebSockets       | Real-time communication (via `ws`)  |
| Zustand          | Lightweight state management        |
| chess.js         | Game logic, legality, FEN, PGN      |
| react-chessboard | Chessboard rendering UI             |
| Vercel           | Hosting and deployment              |

---

## 📂 Project Structure (Turborepo)

```
apps/
  web/               → Next.js frontend (App Router)
  server/            → WebSocket backend (Node.js + ws)

packages/
  ui/                → Shared ShadCN components (optional)
```

## 🧪 To-Do / Roadmap

- [ ] Add puzzle mode
- [ ] Spectator support
- [ ] Game history storage (with Prisma)
- [ ] AI bot mode (Stockfish integration)

---

## 🙏 Acknowledgments

- [chess.js](https://github.com/jhlywa/chess.js)
- [react-chessboard](https://github.com/Clariity/react-chessboard)
- [Vercel](https://vercel.com)
