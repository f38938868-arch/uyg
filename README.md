AutoShorts (static)

A lightweight, static Studio to generate short, scrollable videos with animated backgrounds, optional AI story text, and ElevenLabs narration. Records to WebM in-browser for instant download.

Quick start (local)

- Python: run a static server

```bash
python3 -m http.server 5173
```

Open http://localhost:5173/studio.html

Features

- Animated canvas background (no external assets)
- AI story (optional): OpenAI Chat Completions
- Narration (optional): ElevenLabs TTS (mixed into recording)
- Captions planned for timing (hidden in preview)
- Records canvas + audio to WebM; one-click download
- All keys and toggles persist in localStorage

Configure

In Studio:
- Use AI: add your OpenAI key and model
- Narration: add your ElevenLabs key and a voice ID (default Rachel)
- Tags/Prompt/Duration: customize content

Keys and settings are saved locally in your browser.

Deployment

This is a static app (HTML/CSS/JS). No server required.

GitHub Pages
1. Create a repo and push this folder’s contents to the main branch.
2. In GitHub → Settings → Pages → Build and deployment → Source: Deploy from a branch.
3. Branch: main, Folder: / (root). Save.
4. Open the provided Pages URL (for example https://user.github.io/repo/studio.html).

Netlify (drag-and-drop)
1. Go to Netlify and choose Add new site → Deploy manually.
2. Drag the project folder into the UI.
3. Site will deploy at a *.netlify.app URL. Open /studio.html.

Vercel (import repo)
1. Import your GitHub repo in Vercel.
2. Framework preset: Other. Build command: none. Output dir: /.
3. Add Environment Variables in Vercel → Settings → Environment Variables:
   - OPENAI_API_KEY = your OpenAI key
   - ELEVENLABS_API_KEY = your ElevenLabs key
4. Deploy and open the URL (for example https://project.vercel.app/studio.html).

Cloudflare Pages
1. Create a new Pages project → Connect to Git.
2. Set Build command: none. Build output directory: /.
3. Deploy and open /studio.html.

Notes
- All API calls are from the browser. Keys are stored in localStorage only.
- Some providers may rate-limit or require paid plans for TTS/AI.
- WebM downloads play in most modern browsers and platforms.


