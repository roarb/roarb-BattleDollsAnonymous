<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a5d5d405-77d7-48e2-a812-9a80a1802c6a

## Run Locally

**Prerequisites:**  Node.js (v18 or higher recommended)

1. **Install dependencies:**
   `npm install`
2. **Setup environment variables:**
   - Rename `.env.example` to `.env` (or create a `.env` file) and set your `GEMINI_API_KEY`.
   - Rename `firebase-applet-config.json.example` to `firebase-applet-config.json` (or create it) and set your Firebase project details.
3. **Generate Assets (Optional):**
   - Run the image generation script to create background assets:
     `npx tsx generate-images.ts`
4. **Run the app:**
   `npm run dev`

## Publishing to Firestore

To sync your data model (schema) and security rules with Google Cloud Firestore, use the following commands:

1. **Login to Google:**
   ```bash
   npm run fb-login
   ```
2. **Publish Configuration:**
   ```bash
   npm run fb-publish
   ```
   This will deploy the security rules from `firestore.rules` and configure the database structure defined in `firebase-blueprint.json` to your project specified in `firebase-applet-config.json`.
