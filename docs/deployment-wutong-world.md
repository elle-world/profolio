# Deploying WUTONG.WORLD

## Recommended Setup

- Code and version history: GitHub
- Hosting and preview deployments: Vercel
- Domain registration and DNS: Alibaba Cloud
- Primary address: `www.wutong.world`
- Redirect: `wutong.world` to `www.wutong.world`

This setup keeps the first static version simple and supports a later React, Next.js, or Three.js upgrade.

## First Publication

1. Create a private or public GitHub repository for this portfolio.
2. Push the `personal-ai-portfolio` project to that repository.
3. Sign in to Vercel with GitHub and import the repository.
4. Set the project root directory to `website`.
5. Confirm the build command is `npm run build` and the output directory is `dist`.
6. Deploy and check the temporary `vercel.app` preview on desktop and mobile.

## Connect the Alibaba Cloud Domain

1. In Vercel, open Project Settings, then Domains.
2. Add both `wutong.world` and `www.wutong.world`.
3. Use `www.wutong.world` as the primary domain and redirect the root domain to it.
4. Vercel will show the exact DNS values required for this project. Use those values rather than relying on an old screenshot or tutorial.
5. In Alibaba Cloud, open Cloud DNS, select `wutong.world`, then open DNS Settings.
6. Add the `www` CNAME record shown by Vercel. Remove any conflicting `www` A or AAAA record first.
7. Add the root-domain record requested by Vercel, normally an A record for host `@`.
8. Return to Vercel and wait for both domains to show valid configuration.
9. After DNS verification, Vercel provisions HTTPS automatically. Test the root domain, the `www` domain, the resume download, and the mobile page.

## Launch Gate

Do not change the public DNS until the temporary Vercel preview has passed:

- Chinese and English switching
- light and dark modes
- portrait and resume loading
- mobile layout without horizontal overflow
- working contact and project links
- final proofreading against the latest AI Journey resume

Official references:

- Vercel custom domains: https://vercel.com/docs/domains/set-up-custom-domain
- Alibaba Cloud CNAME records: https://help.aliyun.com/zh/dns/service-domain-name-access-and-flow
