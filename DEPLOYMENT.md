# Fast Track Projects - Vercel Deployment Guide

This guide will walk you through deploying the Fast Track Projects application to Vercel.

## Prerequisites

- [Vercel Account](https://vercel.com/signup) (free tier available)
- [Vercel CLI](https://vercel.com/cli) installed globally: `npm i -g vercel`
- Git repository (GitHub, GitLab, or Bitbucket)
- Firebase project with all necessary configurations

## Quick Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to Git repository**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js configuration

3. **Configure Environment Variables**
   
   In the Vercel project settings, add these environment variables:
   
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy from project directory**
   ```bash
   cd "/Users/macbook/Desktop/Fast Track Purchasing/fast-track-Projects"
   vercel
   ```

3. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N` (or `Y` if you already created one)
   - Project name? `fast-track-projects` (or your preferred name)
   - Directory? `./` (current directory)
   - Override settings? `N`

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
   vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
   vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
   vercel env add NEXT_PUBLIC_FIREBASE_VAPID_KEY
   ```
   
   For each variable:
   - Select environment: `Production`, `Preview`, `Development` (select all 3)
   - Enter the value when prompted

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Post-Deployment Configuration

### 1. Update Firebase Configuration

Add your Vercel deployment domain to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized Domains**
4. Add your Vercel domain: `your-project.vercel.app`

### 2. Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Firebase authorized domains with your custom domain

### 3. Enable PWA Features

Ensure these files are accessible:
- `/manifest.json` - PWA manifest
- `/firebase-messaging-sw.js` - Firebase messaging service worker
- `/sw.js` - Custom service worker

Test PWA functionality:
1. Open your deployed site
2. Open DevTools → Application → Manifest
3. Verify manifest is loaded correctly
4. Test "Add to Home Screen" functionality

### 4. Test Push Notifications

1. Allow notifications when prompted
2. Test notification functionality through your app
3. Check browser DevTools → Application → Service Workers

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase analytics measurement ID | Yes |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Firebase VAPID key for push notifications | Yes |

## Continuous Deployment

Once linked to Git:
- **Automatic deployments** on every push to `main` branch
- **Preview deployments** for pull requests
- **Rollback** capability to previous deployments

## Monitoring and Analytics

### Vercel Analytics (Optional)

Enable Vercel Analytics for performance insights:
1. Go to Project Settings → Analytics
2. Enable Analytics
3. Install package (if needed):
   ```bash
   npm install @vercel/analytics
   ```

### Check Deployment Status

```bash
# List all deployments
vercel ls

# Check deployment logs
vercel logs [deployment-url]

# Open deployment in browser
vercel open
```

## Troubleshooting

### Build Errors

1. **Check build logs** in Vercel Dashboard → Deployments → Click on failed deployment
2. **Verify environment variables** are set correctly
3. **Test locally** with production build:
   ```bash
   npm run build
   npm run start
   ```

### Service Worker Issues

1. Clear browser cache and service workers
2. Verify service worker files are in `/public` directory
3. Check Content Security Policy headers
4. Ensure HTTPS is enabled (Vercel provides this by default)

### Environment Variable Issues

1. Ensure all `NEXT_PUBLIC_` prefixed variables are set
2. Redeploy after adding/updating environment variables:
   ```bash
   vercel --prod --force
   ```

### Performance Issues

1. Check Next.js Image Optimization is working
2. Enable compression (already configured in `next.config.ts`)
3. Review bundle size in build output
4. Consider enabling Vercel's Edge Network features

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Firebase Hosting with Vercel](https://firebase.google.com/docs/hosting)

## Support

For deployment issues:
1. Check [Vercel Status](https://www.vercel-status.com/)
2. Review [Vercel Community](https://github.com/vercel/vercel/discussions)
3. Contact Vercel Support (Pro/Enterprise plans)

## Rollback Procedure

If you need to rollback to a previous version:

1. **Via Dashboard:**
   - Go to Deployments
   - Find the working deployment
   - Click "..." → "Promote to Production"

2. **Via CLI:**
   ```bash
   vercel rollback [deployment-url]
   ```

---

**Last Updated:** December 12, 2025
