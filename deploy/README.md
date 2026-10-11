# Deploying chef-lan-web to the VPS

Same shape as wish-list: GitHub Actions runs the checks, then SSHes into the VPS, which pulls,
builds and restarts a systemd service. nginx fronts it.

```
browser -> nginx :80/:443 --(by hostname)--> 127.0.0.1:3100  chef-lan-web (next start)
                          \--(by hostname)--> 127.0.0.1:<wish-list's port>
```

**Ports.** Only nginx listens on 80/443; both apps stay on loopback, each on its own port
(this one: **3100**). Two sites share 80/443 because nginx tells them apart by hostname
(`server_name`), so chef-lan-web needs **its own hostname**. Until the new domain exists you
can point a free duckdns subdomain at the same VPS and use that.

## One-time VPS setup

Run as the deploy user (the same one wish-list uses). Replace `<deploy-user>`.

1. **Node >= 20.9** is already there for wish-list. Check: `node -v` and `corepack --version`.
2. **Clone** the repo (a deploy key, or HTTPS with a token, as for wish-list):
   `git clone <repo-url> ~/chef-lan-web`
3. **Production env file** — `~/chef-lan-web/.env.production` (gitignored, so deploys keep it):
   ```
   API_BASE_URL=https://<api-host>
   NEXT_PUBLIC_API_BASE_URL=https://<api-host>
   ```
   `NEXT_PUBLIC_API_BASE_URL` is baked into the browser bundle at build time. The API must also
   list this site's origin (`https://<chef-lan-domain>`) in its `Cors:AllowedOrigins`, or
   login and register fail in the browser.
4. **systemd:** copy `deploy/cheflan-web.service` to `/etc/systemd/system/`, fill in the
   placeholders, then `sudo systemctl daemon-reload && sudo systemctl enable cheflan-web`.
5. **sudo without a password, for that one command** (`sudo visudo -f /etc/sudoers.d/cheflan-web`):
   `<deploy-user> ALL=(root) NOPASSWD: /usr/bin/systemctl restart cheflan-web, /usr/bin/systemctl status cheflan-web *`
   (check the path with `which systemctl`).
6. **nginx:** copy `deploy/nginx.conf` to `/etc/nginx/sites-available/chef-lan-web`, set the
   hostname, `sudo ln -s` it into `sites-enabled`, `sudo nginx -t && sudo systemctl reload nginx`,
   then `sudo certbot --nginx -d <chef-lan-domain>`.
7. **First start:** `bash ~/chef-lan-web/scripts/deploy.sh` (builds and starts the service).

## GitHub (repo settings)

Secrets are per repository, so they must be added again here even though the VPS is shared.

| Where | Name | Value |
|---|---|---|
| Environment `production` -> secret | `SSH_PRIVATE_KEY` | private key allowed to log in as the deploy user |
| | `VPS_HOST` | VPS hostname or IP |
| | `VPS_USER` | deploy user |
| | `VPS_PORT` | optional, default 22 |
| | `APP_URL` | optional, `https://<chef-lan-domain>`; empty = health-check the local port |

Create the `production` environment first (Settings -> Environments). A deploy runs on every
push to `main` after `lint`, `typecheck` and `build` pass; pull requests only run the checks.

## Troubleshooting

- `✗ .env.production is missing` — step 3.
- Health check fails -> the script prints `systemctl status`; `journalctl -u cheflan-web -n 50`.
- `EADDRINUSE` -> something else already uses 3100: `sudo ss -ltnp | grep 3100`, pick another
  port and change it in the unit, `nginx.conf` and `PORT` for `deploy.sh`.
- 502 from nginx -> the service is down or the ports in the unit and nginx disagree.
