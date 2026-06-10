# Deployment

## Backend on Render

Deploy the backend as a Render web service from `render.yaml`. The service uses
`backend/Dockerfile`, exposes `/api/health` for health checks, and reads Render's
`PORT` environment variable.

Set these Render environment variables during Blueprint creation:

```text
OPENAI_API_KEY=your-provider-key
DATABASE_URL=postgresql://user:password@host:port/database
APP_FRONTEND_ORIGINS=https://your-vercel-app.vercel.app
```

Keep these production cookie settings:

```text
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=None
```

If you use Supabase or another external Postgres provider, `DATABASE_URL` can
also be a JDBC URL such as `jdbc:postgresql://host:5432/database`. If you use
Render Postgres, paste its internal connection string directly.

## Frontend on Vercel

Deploy the frontend to Vercel with either setup:

```text
Repository root: use the root vercel.json
Frontend root: set the Vercel project root to frontend
```

Set this Vercel environment variable for Production and Preview:

```text
VITE_API_BASE_URL=https://your-render-api.onrender.com
```

After Vercel gives you the frontend URL, add that exact origin to Render's
`APP_FRONTEND_ORIGINS` value and redeploy the backend.
