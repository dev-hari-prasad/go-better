---
title: 'Client Configuration'
sidebarTitle: 'Client Config'
icon: 'desktop'
description: 'Frontend environment variables, local storage toggles, and runtime feature flags'
---

---

## Configuration Overview Table

| Feature / Setting | Option / Key | Where to Toggle | Default Value |
| :--- | :--- | :--- | :--- |
| **Public Repos Tab (Global Env)** | `VITE_ENABLE_PUBLIC_REPOS` | `client/.env` / build env | `true` |
| **Public Repos Tab (UI Toggle)** | `gobetter_feature_public_repos` | Workspace Settings / `localStorage` | `true` |
| **API Backend Gateway URL** | `VITE_API_BASE_URL` | `client/.env` | `http://localhost:5000` |
| **Simulated User Authentication ID** | `VITE_USER_ID` | `client/.env` | `00000000-0000-0000-0000-000000000001` |
| **User ID Local Override** | `gobe-user-id` | Browser `localStorage` | Unset (fallback to env) |
| **Auth Status / Landing Gate** | `showMarketingPopup` | Browser `localStorage` | `'true'` (unauthed) / `'false'` (authed) |
| **Favorited AI Models** | `gobe_favorite_model_ids` | Model Picker / `localStorage` | `["gpt-4o", "deepseek-r1", "gemini-2.0-flash"]` |
| **Model Catalog Cache** | `gobe_active_model_catalog` | Model Picker / `localStorage` | `DEFAULT_MODEL_CATALOG` |
| **Profile Display Name** | `user_profile_name` | Sidebar Profile / `localStorage` | `Developer` |
| **Profile Email Address** | `user_profile_email` | Sidebar Profile / `localStorage` | Unset |
| **Email Notifications** | `user_email_notification` | Profile Settings / `localStorage` | `true` |
| **Avatar Style Preset** | `user_avatar_style` | Sidebar Profile / `localStorage` | `gradient-smooth` |
| **BYOK (Bring Your Own Key) Mode** | `useCustomApiKey` | Settings > BYOK Keys / DB | `true` |
| **Auto-Review Pull Requests** | `autoReviewPullRequests` | Settings > AI Settings / DB | `true` |
| **Findings Severity Threshold** | `severityThreshold` | Settings > AI Settings / DB | `warning` |
| **Quick Review Mode** | `lightModeModel`, `lightModePrompt` | Settings > AI Settings / DB | `gpt-4o` (Syntax focus) |
| **Focused Review Mode** | `standardModeModel`, `standardModePrompt` | Settings > AI Settings / DB | `deepseek-r1` (Balanced) |
| **Deep Dive Review Mode** | `thoroughModeModel`, `thoroughModePrompt` | Settings > AI Settings / DB | `claude-3-7-sonnet` (Deep architecture) |


---

## How to Toggle Configurations

### 1. Toggling the "Try Public Repo" Sandbox Tab

#### Option A: In the User Interface (Recommended for Users)
1. In the GoBetter app, navigate to **Workspace Settings** from the sidebar.
2. Select the **Features** tab in the top navigation bar.
3. Locate the **Public Repository Explorer Tab** toggle.
4. Click the switch to toggle between **Enabled** and **Hidden**.
   - Changes take effect **immediately** across the sidebar and roadmap view without requiring a page reload.

#### Option B: In the Environment File (Recommended for Deployments)
To globally lock the tab for all users (e.g. in enterprise environments):
1. Open or create `client/.env` (or set environment variables in your deployment runner):
   ```bash
   # client/.env
   VITE_ENABLE_PUBLIC_REPOS=false
   ```
2. When set to `false` or `0`, the tab is permanently hidden and shows as **Locked in .env** in the Settings UI.

#### Option C: Programmatically via Browser Console
```javascript
// Disable the tab
localStorage.setItem('gobetter_feature_public_repos', 'false');
window.dispatchEvent(new CustomEvent('gobetter-config-changed'));

// Re-enable the tab
localStorage.setItem('gobetter_feature_public_repos', 'true');
window.dispatchEvent(new CustomEvent('gobetter-config-changed'));
```

---

### 2. Client Environment Template (`client/.env.example`)

Create a `.env` file in the `client/` directory with the following variables:

```bash
# ==========================================
# GoBetter Client Environment Configuration
# ==========================================

# Backend API server URL
VITE_API_BASE_URL=http://localhost:5000

# Feature Flags
# Set to 'false' to switch off the Public Repos Explorer tab
VITE_ENABLE_PUBLIC_REPOS=true

# Authentication (Single-tenant / Mock dev user)
VITE_USER_ID=00000000-0000-0000-0000-000000000001
```

---

## Client Configuration Architecture

The configuration logic is centralized in [`client/src/config/clientConfig.ts`](file:///d:/hono-rabbit/client/src/config/clientConfig.ts):

- **`isPublicReposTabEnabled()`**: Evaluates `VITE_ENABLE_PUBLIC_REPOS` environment variable first, then checks the `gobetter_feature_public_repos` key in `localStorage`.
- **`setPublicReposTabEnabled(enabled)`**: Stores the user's preference and broadcasts a `gobetter-config-changed` window event.
- **`subscribeToConfigChange(callback)`**: Subscribes components (`Sidebar.tsx`, `App.tsx`, `RoadmapView.tsx`) to configuration state changes reactively.
