# Date Night Fund

Track who missed applying to 3 jobs each day. Each miss = $1 toward your next date night. When you split the bill, that amount comes from the person’s side.

## Deploy on GitHub Pages

1. Create a new repo on GitHub (e.g. `date-night-fund`).
2. Push this folder:
   ```bash
   git init
   git add .
   git commit -m "Date night fund tracker"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages** → Source: **Deploy from branch** → Branch: **main** → Folder: **/ (root)** → Save.
4. Your site will be at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

Data is stored in your browser (localStorage), so it’s private and per-device.
