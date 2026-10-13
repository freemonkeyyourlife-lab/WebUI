# Base44 Integration & GitHub Deployment Guide

> **IMPORTANT DISCLAIMER**:  
> **Base44 cannot be operated autonomously by an AI agent.** The actions described in this document require manual configuration by the repository owner in the Base44 web dashboard and GitHub account settings.

---

## 1. Prerequisites
- GitHub repository with K.I.T.T. and Free Monkeys GO! codebase (`freemonkeyyourlife-lab/WebUI`).
- An active Base44 account (or self-hosted Base44 instance).
- OpenAPI 3.0 specification file: located at `WebUI/KITT/docs/openapi.yaml`.
- Exportable static frontend entry: located at `WebUI/KITT/docs/base44_export/index.html`.

---

## 2. Manual Setup Steps

### Step 1: GitHub Repository Linking in Base44
1. Log into your **Base44 Console** (`https://app.base44.io` or your custom domain).
2. Navigate to **Workspaces** > **Create New Project** (or select your existing project).
3. Under **Integrations / Source Control**, select **GitHub**.
4. Authenticate your GitHub account and grant access to the `freemonkeyyourlife-lab/WebUI` repository.
5. Select the primary branch (e.g. `main` or your designated PR branch).
6. Set the root directory if prompted to:
   ```text
   WebUI/KITT/instruct-repair
   ```

### Step 2: Configure Environment Variables in Base44
In the Base44 Project Settings under **Environment Variables / Secrets**, configure:
| Variable | Value | Description |
|---|---|---|
| `PORT` | `3005` | Local or container listener port |
| `NODE_ENV` | `production` | Node environment |
| `KITT_MODE` | `local` | Enforces local loopback safety constraints |
| `ENABLE_CORS` | `true` | *(Optional)* Set to `true` **only** if Base44 web client calls the backend directly from a different browser origin |
| `KITT_ALLOW_EXTERNAL` | `false` | Outbound AI consent guard |
| `KITT_SHARE_LEVEL` | `none` | Default data retention and sharing tier |
| `KITT_API_KEY` | *(Generate a secure token)* | API token for remote header validation |

### Step 3: Import OpenAPI Specification (`openapi.yaml`)
Base44 can automatically generate low-code API actions, UI components, and workflows from standard OpenAPI specs:
1. In Base44, open **API Connectors** > **Import API Spec**.
2. Select **Upload File** and provide `WebUI/KITT/docs/openapi.yaml`.
3. Set the **Base URL**:
   - If running locally via tunnel: `https://your-tunnel-subdomain.trycloudflare.com`
   - If running on a local development machine: `http://localhost:3005`
   - If containerized in Base44: `http://localhost:3005`
4. Base44 will generate ready-to-use actions for:
   - `Agents`: list, start, stop, send commands, request approvals.
   - `MI`: manage profile, retrieve memories, fetch daily digest, submit natural language commands.
   - `Voice`: register voice samples with consent flags, trigger training (approval-gated), export SRT.
   - `Artanis`: decompose complex goals into multi-agent tasks, synthesize buddy personas.
   - `Free Monkeys GO!`: generate 1-3 min missions, claim 15-min reward ticks, redeem high-fives.

### Step 4: Import Static Frontend Entry into Base44 Pages
Base44 provides a static hosting / pages canvas:
1. Navigate to **Base44 Pages** > **Import Static HTML**.
2. Upload the exportable frontend file from:
   ```text
   WebUI/KITT/docs/base44_export/index.html
   ```
3. In the UI configuration, define the global JavaScript variable:
   ```javascript
   window.KITT_API_BASE = "https://your-backend-api-url";
   ```
4. This static page provides a unified dashboard connecting directly to all K.I.T.T., MI, Artanis, and Free Monkeys GO! endpoints.

### Step 5: Network Tunneling (For Local Backend with Cloud Base44)
Since K.I.T.T. is strictly local-first and loopback-only by default, if your Base44 project is hosted in the cloud while your K.I.T.T. server runs on your personal workstation:
1. Start K.I.T.T. locally:
   ```bash
   cd WebUI/KITT/instruct-repair
   ENABLE_CORS=true npm start
   ```
2. In a separate terminal, expose a secure ephemeral tunnel using Cloudflare Quick Tunnels:
   ```bash
   cloudflared tunnel --url http://localhost:3005
   ```
   *(Alternatively, use `ngrok http 3005` or a Tailscale funnel).*
3. Copy the generated HTTPS URL (e.g. `https://random-words.trycloudflare.com`) and paste it as the Base URL in your Base44 connector settings.

---

## 3. Summary of Manual vs. Automated Tasks
- **Automated by Repository Code**:
  - Express backend routes, capability dispatch, and JSON stores.
  - Approval gate logic and audit logging.
  - OpenAPI 3.0 specification (`openapi.yaml`).
  - Standalone static frontend export (`base44_export/index.html`).
- **Manual by User**:
  - Authorizing Base44's GitHub app on your account.
  - Entering environment variables and secrets in Base44.
  - Providing the backend endpoint URL or tunnel URL to Base44.
