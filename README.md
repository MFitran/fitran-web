# fitran-web

A premium, interactive personal portfolio website showcasing engineering projects, academic research, and classic minigames. Built with a responsive dark-themed aesthetic, dynamic database integrations, and smooth CSS micro-animations.

---

## 🚀 Live Demo & Concept
This web application acts as a personal portal for **Muhammad Fitran Ramadhan**. It is built on a zero-build static site architecture utilizing vanilla web technologies, combining high performance with rich visual styles.

---

## ✨ Key Features

### 1. Modern Dark-Theme Aesthetics
- **Sleek Layout**: Deep black backgrounds with premium dark-charcoal bordered cards (`#121212` border accents).
- **Moving RGB Gradients**: Custom linear-gradient keyframe animations (`.rgb-word`) that dynamically flow through title text and custom masks.
- **Header Profile**: A transparent circular profile picture wrapped in a rotating/moving RGB background glow.
- **Interactive Home Button**: A minimalist pop-out home indicator that slides out white text and transitions to a dark grey background (#121212) on hover.

### 2. Embedded Minigame Hub (`games.html`)
A collection of fully responsive browser minigames containing:
- **Interactive Widgets & Gameboards**: Custom-built HTML/CSS visual interfaces with responsive board layouts and dynamic move history tracking.
- **Gameplay Logic & CPU Bots**: JavaScript-driven rules engines and optimized computer/AI opponents.
- **Rich Audio Feedback**: Built-in sound triggers for move actions, invalid plays, wins, and losses.

### 3. Comprehensive Project Portfolios
Dedicated project detail pages describing engineering and computer science solutions:
- **Interactive Technical Widgets**: Dynamic visualizers and parameter adjustment panels.
- **Architecture & System Design**: Block diagrams, logic flowcharts, and technical scheme writeups.
- **Detailed Analytics**: Embedded performance metrics, mathematical models with LaTeX/MathJax display support, and data graphs.

### 4. Dynamic Feeds & Integrations
- **Supabase Real-Time Updates**: Fetches and renders recent study logs and professional updates dynamically using the Supabase Javascript Client SDK.
- **MathJax Responsive Rendering**: Beautifully formatted mathematical equations that scroll horizontally on mobile devices rather than breaking layouts.
- **Mobile-First Sidebar**: Toggleable side navigation drawer featuring smooth slide-in animations.

---

## 🛠️ Tech Stack

- **Core**: Vanilla HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3.
- **Design & Assets**: Custom audio sound clips (MP3/WAV), SVG vectors, custom logo/portrait graphics.
- **External Libraries**: Supabase JS SDK (database fetching), MathJax (equation rendering), Mermaid.js (block diagrams).

---

## 📁 File Structure

```text
├── assets/
│   ├── css/
│   │   └── style.css            # Custom CSS styling with animation tokens
│   ├── js/
│   │   ├── main.js              # Supabase DB integrations & UI triggers
│   │   ├── auth.js              # Authentication helpers
│   │   ├── chess-game.js        # Chess state machine & sound control
│   │   └── nim-game.js          # Nim logic & visual matchsticks
│   ├── profile_picture_t.png    # Header transparent profile avatar
│   └── [audio/images/docs]      # Embedded project assets & media files
├── index.html                   # Homepage & intro card
├── projects.html                # Project index grid
├── games.html                   # Game center layout
├── updates.html                 # Dynamic updates page
├── algorithm.html               # LeetCode / Algorithmic solution index
└── project-*.html               # Individual project pages
```

---

## 💻 Local Setup & Development

No complex setup, build pipelines, or packages required! 

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MFitran/fitran-web.git
   cd fitran-web
   ```
2. **Launch locally**:
   - Open `index.html` directly in any web browser.
   - Alternatively, serve it using **Live Server** (VS Code) or Python's HTTP module to ensure local asset loading works smoothly:
     ```bash
     python -m http.server 8000
     ```
   - Access the site at `http://localhost:8000`.