# kelroyjames.com — deployment

Three static files. No build step, no dependencies, nothing to patch.

    index.html                            home
    osint-supplier-verification.html      artefact 1
    same-control-two-vocabularies.html    artefact 2

## Put it live (GitHub Pages)

1. Create a GitHub account if you don't have one.
2. Create a **public** repository named exactly `<your-username>.github.io`.
3. Upload these three files to the root of that repo (drag and drop works — "Add file" → "Upload files").
4. It is live at `https://<your-username>.github.io` within a couple of minutes.

## Add your domain

1. Buy `kelroyjames.com` (or `.co.uk`) from Cloudflare Registrar — sold at cost, no renewal markup, roughly £10–12/year.
2. In the repo: **Settings → Pages → Custom domain**, enter the domain, save. GitHub creates a `CNAME` file for you.
3. At Cloudflare, add these DNS records:

       A     @    185.199.108.153
       A     @    185.199.109.153
       A     @    185.199.110.153
       A     @    185.199.111.153
       CNAME www  <your-username>.github.io

4. Back in Settings → Pages, tick **Enforce HTTPS** once the certificate provisions (usually under an hour).

## Before you publish — three edits

Open `index.html` and search for these:

- `https://www.linkedin.com/` — replace with your actual LinkedIn profile URL.
- `hello@example.com` — replace with a real address. Use a dedicated one (e.g. `contact@` on your own domain) rather than your personal Gmail; a personal address on a public page attracts scrapers.
- `Available — From 2028, on resettlement` — check the year is right.

Also check the Background section reads the way you want it to. I wrote the St Vincent paragraph from what you have told me; make it yours.

## Updating it later

Edit the file on GitHub directly (pencil icon), or edit locally and re-upload. Changes go live in a minute or two. The `writing` section is designed so you change `In preparation` to `Published` and wrap the `<h3>` in a link when each article goes out.
