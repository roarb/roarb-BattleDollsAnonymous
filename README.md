<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Battle Dolls Anonymous 🎨⚔️

**The Ultimate Accountability Mirror for Miniature Hobbyists.**

Battle Dolls Anonymous is a premium web application designed to help hobbyists track their "Pile of Shame," celebrate hobby milestones, and maintain a consistent painting streak. It combines data-driven inventory management with a visual progress gallery to keep you motivated and accountable.

---

## ✨ Key Features

### 📊 Accountability Dashboard
*   **Hobby Streak Tracker**: Monitor your consistency with a gamified streak system.
*   **Asset Distribution**: Visualize your collection's progress (Unbuilt vs. Tabletop Ready) via interactive charts.
*   **Shame Accumulation**: Track your "relapses" (new purchases) over time to visualize cost and volume trends.
*   **Achievement System**: Earn badges and milestone unlocks (e.g., "Two Thin Coats," "Vapor Inhaled") as you progress.

### 📦 The Stash (Collection Management)
*   **Detailed Inventory**: Track unit names, nicknames, quantities, points values, and MSRP.
*   **Smart Auto-fill**: Pre-populated data for **Warhammer 40k**, **Age of Sigmar**, **The Old World**, **Horus Heresy**, and **Marvel Crisis Protocol**.
*   **Status-Based Coloring**: Instantly identify unit readiness through color-coded rows (Red for Unbuilt, Blue for Painted, etc.).
*   **Manufacturer Integration**: Direct links to product pages and automated MSRP tracking for cost analysis.

### 📸 Model Progress Gallery
*   **Four-Stage Tracking**: Document every step from *Assembled* to *Tabletop Ready*.
*   **Before/After Sliders**: Interactive comparison tool to see the transformation of your models.
*   **Visual Thumbnails**: Your Stash table automatically displays the most recently uploaded progress photo for each unit.

### 🛠️ Advanced Tools
*   **Army Builder**: Plan your lists and see how they integrate with your existing collection.
*   **Battle Logs**: Track your wins, losses, and mission performance.

---

## 🚀 Technology Stack

*   **Frontend**: React (TypeScript), Vite, Tailwind CSS
*   **Animations**: Framer Motion
*   **Charts**: Recharts
*   **Backend**: Firebase (Authentication, Firestore Database, Storage)
*   **Icons**: Lucide React

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   Firebase Project

### Local Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Configuration:**
    *   Create a `firebase-applet-config.json` in the root directory with your Firebase credentials.
    *   (Optional) Set `GEMINI_API_KEY` in a `.env` file if utilizing AI features.
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

### Deployment

1.  **Login to Firebase:**
    ```bash
    npm run firebase-login
    ```
2.  **Deploy Rules & Hosting:**
    ```bash
    npm run firebase-deploy
    ```

---

## 🔒 Security

Battle Dolls Anonymous uses Firebase Security Rules to ensure that:
*   Users can only view and edit their own hobby data.
*   Images in Firebase Storage are scoped to individual user IDs.
*   Admin-only data (like global game templates) is protected from unauthorized modification.

