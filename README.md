# ⚡ BigQuery Release Pulse

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Framework](https://img.shields.io/badge/Framework-Flask-black.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, full-stack web application built with **Python Flask** and **Vanilla HTML/CSS/JavaScript** that tracks live Google BigQuery release notes, categorizes updates, and enables instant 1-click sharing to **X (Twitter)**.

![BigQuery Release Pulse Banner](https://img.shields.io/badge/BigQuery-Release--Pulse-3b82f6?style=for-the-badge&logo=googlecloud&logoColor=white)

---

## ✨ Features

- 🛰️ **Live Feed Synchronization**: Automatically fetches and parses Google Cloud's official BigQuery Atom release feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
- 🏷️ **Smart Categorization**: Parses HTML content into distinct updates tagged as:
  - ✨ **Feature** (New capabilities & products)
  - ⚡ **Changed** (Modifications & updates)
  - ⚠️ **Deprecated** (Removals & deprecation warnings)
  - 🐛 **Fix / Issue** (Bug fixes & operational updates)
- 🐤 **X / Twitter Sharer**: Integrated composer modal with character validation (280 limit), pre-drafted hashtags (`#BigQuery #GoogleCloud #DataEngineering`), auto-trimming, and direct Web Intent publishing.
- 🎨 **Glassmorphism UI System**: Dark Mode & Light Mode toggle, background glow effects, crisp typography (Outfit & Inter fonts), and responsive layouts.
- 🔍 **Real-Time Filtering & Search**: Instant keyword search bar and filter pills to quickly find relevant release notes.
- 🔄 **On-Demand Refresh**: Live spinner animation on refresh to fetch real-time release details bypassing cache.

---

## 📁 Repository Structure

```text
Om-Umale-event-talks-app/
├── app.py                 # Flask server, RSS parser, & API endpoints
├── requirements.txt       # Dependencies (Flask, requests, feedparser, beautifulsoup4)
├── .gitignore             # Ignored files (venv, cache, IDE files)
├── templates/
│   └── index.html         # Main application UI & Tweet Modal layout
└── static/
    ├── css/
    │   └── style.css      # Glassmorphism design system, dark mode & animations
    └── js/
        └── app.js         # Dynamic feed fetching, state management & Twitter intent
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** installed on your system.
- Git & modern web browser.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/OmUmale19/-Om-Umale-event-talks-app.git
   cd -Om-Umale-event-talks-app
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *(or `python -m pip install flask requests feedparser beautifulsoup4`)*

3. **Run the Flask application**:
   ```bash
   python app.py
   ```

4. **Open in browser**:
   Navigate to **`http://127.0.0.1:5000`** in your browser.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask, BeautifulSoup4, ElementTree, feedparser
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 Custom Properties (Variables)
- **Design & Typography**: Glassmorphism aesthetic, FontAwesome 6, Google Fonts (Outfit & Inter)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check out the [issues page](https://github.com/OmUmale19/-Om-Umale-event-talks-app/issues).

---

## 📜 License

Distributed under the MIT License.
