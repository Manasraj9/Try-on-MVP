# Zylokart Try-On MVP

A web-based virtual try-on application built with Next.js and Firebase. This application allows users to upload their photos and try on different clothing items virtually.

## Features

- User authentication (email/password)
- Upload profile photos to Firebase Storage
- Virtual try-on with image overlay technology
- Save and view try-on history
- Responsive design with Tailwind CSS

## Tech Stack

- Next.js (App Router)
- Firebase (Authentication, Firestore, Storage)
- Tailwind CSS
- react-firebase-hooks

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd try-on-mvp
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Set up environment variables

Create a `.env.local` file in the root directory with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

4. Run the development server

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Set up Firebase Storage
5. Add the Firebase configuration to your `.env.local` file

## Project Structure

```
/app
  /auth
    /login
      page.jsx
    /register
      page.jsx
  /dashboard
    page.jsx
  layout.jsx
  page.jsx
/components
  Navbar.jsx
  ClothingItem.jsx
  TryOnPreview.jsx
/context
  AuthContext.js
/lib
  firebase.js
/public
  [assets]
```

## Deployment to Firebase

1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

2. Login to Firebase

```bash
firebase login
```

3. Initialize Firebase in your project

```bash
firebase init
```

Select the following options:
- Hosting
- Use an existing project (select your Firebase project)
- Specify `out` as your public directory
- Configure as a single-page app: No
- Set up automatic builds and deploys with GitHub: No (or Yes if you want to)

4. Build your Next.js application

```bash
npm run build
# or
yarn build
```

5. Export your Next.js application

Add the following script to your `package.json`:

```json
"scripts": {
  "export": "next export"
}
```

Then run:

```bash
npm run export
# or
yarn export
```

6. Deploy to Firebase

```bash
firebase deploy
```

## License

This project is licensed under the MIT License.
