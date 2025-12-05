# Quick Deploy to Vercel (launchpad.gooptimal.io)

Deploy your Optimal Platform portal in under 10 minutes with a custom domain.

## Prerequisites

- GitHub account with the code pushed
- Vercel account (free at [vercel.com](https://vercel.com))
- Access to your domain's DNS settings (Cloudflare, Route53, etc.)

---

## Step 1: Push to GitHub

If you haven't already:

```bash
cd /path/to/optimal-platform
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

---

## Step 2: Deploy to Vercel

### Option A: One-Click Deploy (Easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `optimal-platform` repository
4. **Important**: Set the Root Directory to `apps/portal`
5. Click "Deploy"

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to portal directory
cd apps/portal

# Deploy (follow the prompts)
vercel

# For production deployment
vercel --prod
```

---

## Step 3: Configure Custom Domain

### In Vercel Dashboard:

1. Go to your project → **Settings** → **Domains**
2. Add your domain: `launchpad.gooptimal.io`
3. Vercel will show you DNS records to add

### In Your DNS Provider (Cloudflare/Route53):

Add a **CNAME** record:

| Type | Name | Target |
|------|------|--------|
| CNAME | launchpad | cname.vercel-dns.com |

**Or** if using the apex domain, add an **A** record:

| Type | Name | Target |
|------|------|--------|
| A | @ | 76.76.21.21 |

---

## Step 4: Set Environment Variables (Optional)

In Vercel Dashboard → **Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_BASE` | `https://api.gooptimal.io` |
| `NEXT_PUBLIC_SITE_URL` | `https://launchpad.gooptimal.io` |

---

## Step 5: Verify Deployment

After DNS propagates (usually 1-5 minutes):

1. Visit `https://launchpad.gooptimal.io`
2. You should see the Optimal Platform landing page
3. Test the "Try Demo" and "Get Started" buttons

---

## Multiple Subdomains (Optional)

You can set up multiple subdomains pointing to the same Vercel deployment:

| Subdomain | Purpose |
|-----------|---------|
| `launchpad.gooptimal.io` | Main portal |
| `app.gooptimal.io` | Alternative URL |
| `demo.gooptimal.io` | Demo environment |

Just add each domain in Vercel and update your DNS.

---

## Automatic Deployments

Once connected to GitHub:
- Every push to `main` → Production deployment
- Every PR → Preview deployment with unique URL

---

## Troubleshooting

### Domain not working?
- Wait 5-10 minutes for DNS propagation
- Use [dnschecker.org](https://dnschecker.org) to verify records
- Make sure CNAME points to `cname.vercel-dns.com`

### Build failing?
- Check the Root Directory is set to `apps/portal`
- Ensure `package.json` has a valid `build` script

### Need to redeploy?
```bash
cd apps/portal
vercel --prod --force
```

---

## Next Steps

1. Share `https://launchpad.gooptimal.io` with potential clients
2. Monitor usage in Vercel Analytics
3. When ready, migrate to AWS/GCP using the enterprise deployment guide

---

## Cost

**Vercel Free Tier includes:**
- Unlimited deployments
- 100GB bandwidth/month
- Custom domains
- SSL certificates
- Analytics (basic)

This is more than enough for demos and early customers!

