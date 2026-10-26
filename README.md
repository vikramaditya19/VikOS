# ⚡ vikOS — Modern Web-Based Operating System Portfolio

<div align="center">

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

*An immersive, desktop-class web operating system portfolio built to showcase advanced frontend architecture, custom window management, and sleek modular design.*

[Explore Live Demo](#) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## 🖥️ About vikOS

**vikOS** is a custom browser-based desktop environment and portfolio interface designed to break away from traditional, static landing pages. Built with React, Vite, and Tailwind CSS, it mimics a real operating system experience complete with window management, live system tracking, a functional terminal CLI, and a modular application registry.

---

## 🛠️ Tech Stack & Architecture

* **Core Framework:** React.js (Hooks, Context API, Component Composition)
* **Build Tool:** Vite (High-speed module bundling and HMR)
* **Styling & Design System:** Tailwind CSS v3 with custom design tokens (`src/design/tokens.js`)
* **State & Window Management:** Custom registry architecture with dynamic Z-index layering, focus state tracking, and window controls (Minimize, Maximize, Close).

---

## 📂 Project Structure

```text
vikOS/
├── public/                     # Static assets & wallpapers
├── src/
│   ├── apps/                   # Application Registry mapping system
│   │   └── registry.js         # Central app loader & definitions
│   ├── components/
│   │   ├── boot/               # Boot sequence & startup screens
│   │   ├── brand/              # Custom brand components & Akatsuki vectors
│   │   ├── desktop/            # Taskbar, Window Manager, Context Menus, Wallpaper
│   │   └── windows/            # Individual App implementations (Terminal, Files, etc.)
│   ├── design/                 # Design tokens & layout constants
│   ├── utils/                  # Sound, crypto, and helper utilities
│   ├── App.jsx                 # Main OS root controller & desktop orchestrator
│   ├── main.jsx                # React DOM entry point
│   └── index.css               # Global Tailwind CSS configurations
├── tailwind.config.js          # Tailwind customization
└── vite.config.js              # Vite bundler configuration
