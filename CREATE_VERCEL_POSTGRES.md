# Create Vercel Postgres Database

## Step 1: Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

## Step 3: Link Your Project

In your project directory, run:
```bash
vercel link
```

Select your existing project or create a new one.

## Step 4: Create Postgres Database

```bash
vercel postgres create
```

You'll be prompted to:
1. Choose a name for your database (e.g., `deriads-esba-db`)
2. Select a region (choose closest to your users)

## Step 5: Link Database to Project

```bash
vercel postgres link
```

Select the database you just created.

## Step 6: Get Environment Variables

```bash
vercel env pull .env.local
```

This will download all environment variables including the Postgres URL.

## Step 7: Copy to .env

```bash
# Copy the POSTGRES_URL from .env.local to .env
cat .env.local | grep POSTGRES_URL > .env.temp
sed 's/POSTGRES_URL/VITE_POSTGRES_URL/' .env.temp >> .env
rm .env.temp
```

Or manually copy the `POSTGRES_URL` from `.env.local` and add it to `.env` as `VITE_POSTGRES_URL`.

## Step 8: Restart Dev Server

```bash
npm run dev
```

