# NOVA Eye Care - Standalone Admin & Public Site Deployment Guide

This project supports **Dual-Target Deployment** from a single repository. You can deploy the **Public & Patient Portal** and the **Admin Dashboard** independently on separate domains:
- **Public & Patient Portal**: `https://novaeyecareservice.com`
- **Admin Dashboard**: `https://admin.novaeyecareservice.com`

---

## 1. Quick Overview

| App | Build Command | Output Directory | Entry HTML | Production Domain |
| :--- | :--- | :--- | :--- | :--- |
| **Public & Patient Portal** | `npm run build` | `dist` | `index.html` | `novaeyecareservice.com` |
| **Admin Dashboard** | `npm run build:admin` | `dist-admin` | `dist-admin/index.html` | `admin.novaeyecareservice.com` |

Both apps share the same backend API (`VITE_API_URL`), authentication system, UI components, and TypeScript models, eliminating duplicate code maintenance.

---

## 2. Environment Variables

### Public / Patient Portal Deployment
Add these environment variables to your public site host (e.g., Vercel / Netlify):

| Variable | Recommended Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend-api.com/api` | Backend API URL |
| `VITE_ADMIN_URL` | `https://admin.novaeyecareservice.com` | Automatically links logged-in administrators directly to the standalone admin portal |

### Admin Dashboard Deployment
Add these environment variables to your admin site host (e.g., Vercel / Netlify):

| Variable | Recommended Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend-api.com/api` | Backend API URL |
| `VITE_PUBLIC_SITE_URL` | `https://novaeyecareservice.com` | Allows admins to click "View Website" to go back to the patient/public site |
| `VITE_APP_TARGET` | `admin` | *(Optional, already set by `build:admin`)* |

> **Note**: If `VITE_ADMIN_URL` or `VITE_PUBLIC_SITE_URL` are not explicitly defined in production, they automatically default to `https://admin.novaeyecareservice.com` and `https://novaeyecareservice.com`.

---

## 3. Deploying to Vercel (Recommended)

You can link the **same GitHub repository** twice in Vercel to create two isolated projects:

### Project 1: NOVA Eye Care (Public & Patient Portal)
1. In your Vercel Dashboard, click **Add New** > **Project** and import this repository.
2. Under **Build and Output Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your backend API URL
   - `VITE_ADMIN_URL`: `https://admin.novaeyecareservice.com`
4. Under **Domains** (in Project Settings):
   - Add your primary domain: `novaeyecareservice.com` (and `www.novaeyecareservice.com`).
5. Click **Deploy**.

---

### Project 2: NOVA Admin (Standalone Admin Portal)
1. In your Vercel Dashboard, click **Add New** > **Project** and import the **same** repository again.
2. Name the project `nova-admin` (or `nova-eye-care-admin`).
3. Under **Build and Output Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build:admin`
   - **Output Directory**: `dist-admin`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your backend API URL
   - `VITE_PUBLIC_SITE_URL`: `https://novaeyecareservice.com`
5. Under **Domains** (in Project Settings):
   - Add your custom admin subdomain: `admin.novaeyecareservice.com`.
6. Click **Deploy**.

> **Note on Rewrites**: Both projects will automatically handle client-side routing because `vercel.json` rewrites all requests to `/index.html`. Our admin build automatically places `index.html` into `dist-admin/`.

---

## 4. Deploying to Netlify

Similarly, create two Netlify sites from the same repository:

### Public Site on Netlify:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Domain**: `novaeyecareservice.com`

### Admin Site on Netlify:
- **Build command**: `npm run build:admin`
- **Publish directory**: `dist-admin`
- **Domain**: `admin.novaeyecareservice.com`

> Netlify will automatically use `public/_redirects` to handle Single Page App routing for both builds.

---

## 5. Local Development Commands

To run and test both applications on your computer:

```bash
# 1. Run Public & Patient Portal (default: http://localhost:5173)
npm run dev

# 2. Run Standalone Admin Dashboard (runs on an isolated port, e.g. http://localhost:5174)
npm run dev:admin

# 3. Test Production Admin Build Locally
npm run build:admin
npm run preview:admin

# 4. Test Production Public Build Locally
npm run build
npm run preview
```

---

## 6. Backend CORS Configuration

The Express backend in `Backend/src/index.js` already includes:
```javascript
app.use(cors({
  origin: true,
  credentials: true
}));
```
This means requests from `admin.novaeyecareservice.com`, `novaeyecareservice.com`, or any Vercel preview domain will be accepted automatically without needing backend alterations.

---

## 7. Security Features of Standalone Admin
- `admin.html` includes `<meta name="robots" content="noindex, nofollow" />` so search engines do not index the administration portal.
- Public site bundles (`dist/`) do not leak administration UI logic or route bundles.
- Route guarding with `AdminRoute` verifies JWT tokens and `is_admin` role against the backend on every protected view.
