# Account Book App - Development Guide

## 🚀 Automated Deployment Workflow

### How It Works:
1. **Request Changes**: Tell me what feature/fix you need
2. **I Make Changes**: Code changes are made automatically
3. **Auto-Deploy**: Changes push to GitHub → Vercel deploys → Live in 2-3 minutes
4. **Test**: Verify changes at https://account-book-app.vercel.app

### Production Stack:
- **Frontend**: React 18 + Vite + TailwindCSS
- **Database**: Neon PostgreSQL (Free tier)
- **Authentication**: Clerk (Free tier)
- **Hosting**: Vercel (Free tier)
- **Repository**: https://github.com/rakeshkanojia96-rgb/account-book-app

### Environment Variables:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk authentication key

### Local Development (Optional):
```bash
cd "/Users/rakesh/Documents/Windsurf Works GST/Account Book App"
npm install
npm run dev
```
Local: http://localhost:3000

### Deployment:
All changes automatically deploy to production when committed to `main` branch.
No manual steps needed!

---

**Last Updated**: December 19, 2024
**Status**: ✅ Production Ready
