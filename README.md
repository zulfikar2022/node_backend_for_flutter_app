# Flutter Backend Sample

Simple Node.js backend for a Flutter app supporting posts, comments, likes, and profiles.

Setup

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:

```bash
npm install
```

3. Start server:

```bash
npm run dev
```

Notes

- Assumes client provides `x-user-id` header or `userId` in body for authenticated requests.
- Images are uploaded to Cloudinary; configure `.env` with Cloudinary credentials.
