HackPortal: Modern Hackathon Platform

HackPortal is the modern, streamlined platform designed to power the next generation of hackathons and developer events. Built specifically for high-efficiency project management, judging, and submission tracking, HackPortal helps organizers run flawless events and gives participants a smooth, frustration-free experience.

🚀 Features

For Organizers

Intuitive Dashboard: Centralized management of projects, participants, judges, and schedules.

🧠 AI-Powered Judging Engine: Automated evaluation of submissions by analyzing the GitHub repository, code structure, and demo link content (video/live site). Provides objective, real-time scores based on customized rubrics.

Real-time Analytics: Track submission rates, judge progress, and winner rankings live.

Team Management: Simple tools for hackers to form and manage teams.

For Hackers

Guided Submission Process: A clear, step-by-step form to ensure all project details are captured.

Easy Edits: Update project details and team information at any time before the deadline.

Modern UI: A beautiful, responsive interface that works great on any device.

🛠️ Technology Stack

HackPortal is a modern web application built with a focus on speed and scalability.

Frontend: React with TypeScript

Styling: Tailwind CSS (for rapid, responsive UI development)

Backend/Database: Firebase (Authentication, Firestore for real-time data)

AI/ML: Google Gemini API (for advanced code analysis and demo content scoring/judging).

⚙️ Getting Started

Prerequisites

Before you begin, ensure you have the following installed:

Node.js (version 16 or later)

npm (comes bundled with Node.js)

A Firebase Project configured with Firestore and Authentication enabled.

Installation

Clone the repository and install dependencies:

git clone [https://github.com/osamaabdul/hackportal]
cd hackportal
npm install



Configuration

Firebase Setup: Create a file named .env.local in the root directory.

Add Configuration: Paste your Firebase configuration variables into this file.

.env.local

# Replace these with your actual Firebase config values
VITE_FIREBASE_API_KEY="AIzaSy...your-key-here"
VITE_FIREBASE_AUTH_DOMAIN="hackportal-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="hackportal-project"
VITE_FIREBASE_STORAGE_BUCKET="hackportal-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:abcdef123456"

# Add your Gemini API Key for AI Judging
VITE_GEMINI_API_KEY="AIzaSy...your-gemini-key-here"



Running Locally

To start the development server:

npm run dev



The application will typically be available at http://localhost:8080.

🤝 Contribution

We welcome contributions from the community! Whether it's adding a new feature, fixing a bug, or improving documentation, your help is appreciated.

Fork the repository.

Create a new feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add amazing feature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.

Please ensure your code adheres to the existing style and pass all checks before submitting.

📝 License

Distributed under the MIT License. See LICENSE.md for more information.

📧 Contact

Project Link: https://hackportal.vercel.app
Email: ibrahimabdulosama@gmail.com
Twitter: @osamaabdul_jnr