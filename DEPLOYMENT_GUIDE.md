# Gameshift Vercel Deployment Guide

## Architecture Overview

Gameshift is now configured to run the **backend and frontend on separate Vercel deployments**:

- **Frontend**: Next.js app with API routes at one Vercel deployment
- **Backend**: Express.js server at a different Vercel deployment
- **Communication**: Frontend and backend communicate via HTTP with CORS enabled

---

## Environment Variables

### Frontend (.env.local)

```env
# MongoDB
MONGODB_URI=<your-mongodb-uri>
MONGODB_DB=gameshift
JWT_SECRET=<your-jwt-secret>

# Backend API URL - Set this to your backend Vercel deployment URL
NEXT_PUBLIC_API_URL=https://gameshift-backend.vercel.app
```

### Backend (backend/.env or Vercel Environment Variables)

```env
# MongoDB
MONGODB_URI=<your-mongodb-uri>
MONGODB_DB=gameshift
JWT_SECRET=<your-jwt-secret>

# Frontend URL - Set this to your frontend Vercel deployment URL
FRONTEND_URL=https://gameshift-frontend.vercel.app
```

---

## Setup Steps

### 1. Configure Vercel Projects

#### Frontend Deployment:

1. Create a new Vercel project for the frontend
2. Connect your GitHub repository
3. Set **Root Directory** to the project root (where `next.config.ts` is)
4. Add environment variables:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_API_URL` = your backend URL (e.g., `https://gameshift-backend.vercel.app`)

#### Backend Deployment:

1. Create a new Vercel project for the backend
2. Connect the same GitHub repository
3. Set **Root Directory** to `backend/`
4. Update **Build Command**: (leave default or use `npm run build` if applicable)
5. Update **Start Command**: `node index.js`
6. Add environment variables:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `JWT_SECRET`
   - `FRONTEND_URL` = your frontend URL (e.g., `https://gameshift-frontend.vercel.app`)

---

### 2. Update URLs After Deployment

Once both deployments are live:

1. Go to to the **frontend** Vercel project settings
2. Update `NEXT_PUBLIC_API_URL` environment variable to the actual backend URL
3. Redeploy the frontend
4. Go to the **backend** Vercel project settings
5. Update `FRONTEND_URL` environment variable to the actual frontend URL
6. Redeploy the backend

---

## Local Development

### Running Locally

For local development, both frontend and backend run on `localhost:3000` by default:

```bash
# Terminal 1: Start the full stack (Next.js + Express)
npm run dev

# This runs: node backend/index.js
# which serves both frontend and backend on http://localhost:3000
```

The `.env.local` file is already configured for local development:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## CORS Configuration

The backend includes CORS middleware that allows requests from any origin:

```javascript
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

This allows the frontend (on a different domain) to communicate with the backend.

---

## API Routes

### Frontend API Routes

These are Next.js API routes at `/api/*`:
- `/api/login`
- `/api/logout`
- `/api/signup`
- `/api/users/*`
- `/api/team/*`
- `/api/leaderboard/*`
- `/api/wordle/*`
- etc.

### Backend Routes

These are Express.js routes:
- `/api/admin/rooms` - Battleship room management
- `/api/users/score` - Score updates (called by both frontend and backend)
- Socket.IO events for Battleship multiplayer

---

## File Structure with Deployments

```
gameshift/
├── app/                          # Next.js frontend
│   ├── api/                      # Frontend API routes (runs on frontend Vercel)
│   ├── page.tsx
│   └── ...
├── backend/                      # Express.js backend (separate Vercel deployment)
│   ├── vercel.json               # Backend Vercel config
│   ├── index.js                  # Express server
│   └── package.json              # Backend dependencies (if separate)
├── lib/                          # Shared utilities
├── components/                   # React components
├── vercel.json                   # Frontend Vercel config
├── next.config.ts                # Next.js config
├── .env                          # Shared env vars (committed)
├── .env.local                    # Local dev env vars (not committed)
└── package.json                  # Frontend & full-stack dependencies
```

---

## Troubleshooting

### CORS Errors

**Problem**: "Access to XMLHttpRequest has been blocked by CORS policy"

**Solution**:
- Ensure `NEXT_PUBLIC_API_URL` points to the correct backend URL
- Verify backend has CORS middleware enabled
- Check that backend is running and accessible

### Connection Refused

**Problem**: "Error: connect ECONNREFUSED 127.0.0.1:3000"

**Solution**:
- Local dev: Ensure `npm run dev` is running
- Production: Verify `FRONTEND_URL` in backend environment variables is correct
- Verify `NEXT_PUBLIC_API_URL` in frontend environment variables is correct

### Socket.IO Connection Issues

**Problem**: WebSocket fails to connect

**Solution**:
- Verify Socket.IO is configured with proper CORS in backend:
  ```javascript
  cors: {
    origin: "*",
  }
  ```
- Check that your frontend connects to the correct backend URL

---

## Monitoring & Logging

### View Logs

**Frontend**: `vercel logs <project-id> --follow`
**Backend**: `vercel logs <project-id> --follow`

### Key Logs to Monitor

- Backend: `[SCORE] Sending request to update score`
- Backend: `[ROOM]` messages for Battleship
- Frontend: Network tab in browser DevTools for API calls

---

## Next Steps

1. Deploy frontend to Vercel
2. Deploy backend to Vercel (same git repo, different root directory)
3. Set environment variables in both Vercel projects
4. Update URLs after getting Vercel deployment URLs
5. Test API communication between frontend and backend

---

## Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Node.js Runtime](https://vercel.com/docs/functions/nodejs)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Last Updated**: February 2026
