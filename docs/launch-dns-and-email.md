# DNS and email setup for aethertrade.cloud

Values in angle brackets come from your dashboards. Copy them exactly. Do not invent values.

## Step 1: Hostinger mailbox (only if hello@aethertrade.cloud already works there)

Before changing nameservers, copy every existing DNS record from Hostinger → Domains → DNS. Recreate the same records in Cloudflare DNS first, especially:

| Type | Name | Value (copy from Hostinger) |
|---|---|---|
| MX | @ | `<Hostinger mail server>` (with priority) |
| TXT | @ | `<Hostinger SPF record, e.g. v=spf1 include:...>` |
| TXT / CNAME | `<selector>._domainkey` | `<Hostinger DKIM value>` |

If you do not keep a Hostinger mailbox, skip this step.

## Step 2: Resend (transactional email for inquiries)

In Resend → Domains → Add domain, use the subdomain `mail.aethertrade.cloud` (recommended). This keeps sending separate from the root domain's mailbox. Resend will show the exact records. Add them in Cloudflare DNS, with proxy OFF (grey cloud):

| Type | Name | Value (copy from Resend) |
|---|---|---|
| MX | `send.mail` | `<Resend MX value>` (priority as shown) |
| TXT | `send.mail` | `<Resend SPF value>` |
| TXT | `resend._domainkey.mail` | `<Resend DKIM value>` |

Then add DMARC on the root domain:

| Type | Name | Value |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:<your monitored address>` |

Start with `p=none`. Change to `quarantine` only after mail is verified.

Set `INQUIRY_FROM_EMAIL` to an address on `mail.aethertrade.cloud`, for example `AETHER-TRADE <notifications@mail.aethertrade.cloud>`. Click Verify in Resend and wait until the domain shows Verified.

## Step 3: Cloudflare Worker domain

1. Add `aethertrade.cloud` to Cloudflare (Add a site, Free plan).
2. In Hostinger, set nameservers to the two values Cloudflare shows.
3. Wait until the zone shows Active.
4. Worker → Settings → Domains & Routes → Add custom domain: `aethertrade.cloud` and `www.aethertrade.cloud`.
5. SSL/TLS mode: Full (strict).

## Step 4: Checks before publishing

- `https://aethertrade.cloud/` loads.
- `https://aethertrade.cloud/sitemap.xml` and `/llms.txt` load.
- `https://aethertrade.cloud/admin` returns 404.
- Resend domain shows Verified.
- `dig MX mail.aethertrade.cloud`, `dig TXT _dmarc.aethertrade.cloud` return your values.

## Build command for Cloudflare

`bun install --frozen-lockfile && bun run build:site`

Deploy command: `npx wrangler deploy -c .output/server/wrangler.json`
