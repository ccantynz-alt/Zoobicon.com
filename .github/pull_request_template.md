## Summary

<!-- Brief description of what changed and why -->

## Pre-Merge Checklist

**Test on the Vercel preview deployment before merging:**

- [ ] Preview deployment loads without errors
- [ ] AI Builder: Can generate a website (no "prefill" or "Generation Failed" errors)
- [ ] Video Creator: Storyboard generates successfully
- [ ] Admin panel: Loads without crashes (`/admin`)
- [ ] Staging banner visible on preview (yellow bar at top)
- [ ] No console errors in browser dev tools
- [ ] Build passes (`npm run build`)

## What to Watch For

- API routes returning 401/403 (auth issues)
- "Something went wrong" errors (check server logs)
- Blank pages (component import errors)
- Missing sidebar panels in builder

---
zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh
