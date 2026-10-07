# syntax=docker/dockerfile:1
#
# Official Playwright image: Node.js + Chromium, Firefox and WebKit + all OS deps.
# The image tag MUST match the @playwright/test version in package.json,
# otherwise the bundled browsers won't match what the test runner expects.
ARG PLAYWRIGHT_VERSION=1.55.0

# ---------- Stage 1: install node dependencies ----------
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
# Reproducible install when a lockfile exists; falls back to npm install otherwise.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---------- Stage 2: test runner ----------
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble AS runner
WORKDIR /app

# Browsers are pre-installed in the base image at /ms-playwright.
ENV CI=true \
    HEADLESS=true \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    NODE_ENV=test

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Fail the build early on type errors.
RUN npx tsc --noEmit

# Reports are written here; mount it as a volume to get them on the host.
VOLUME ["/app/reports", "/app/test-results"]

# Default: run the full suite (API + 3 browsers). Override with
#   docker run <image> --project=chromium
ENTRYPOINT ["npx", "playwright", "test"]
CMD []
