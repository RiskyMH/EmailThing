# Build stage
FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY apps ./apps
COPY packages ./packages
COPY patches ./patches

RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile && bunx bun@latest --version

RUN cd apps/api && bunx bun@latest --bun run build:standalone

# Production stage - minimal alpine
FROM alpine:latest AS production

WORKDIR /app

RUN apk add --no-cache libstdc++ libgcc

COPY --from=builder /app/apps/api/dist/main ./main

EXPOSE 3000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/sitemap.json || exit 1

CMD ["./main"]