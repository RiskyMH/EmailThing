# Build stage
FROM oven/bun:canary-alpine AS builder

WORKDIR /app

ARG GIT_SHA

COPY package.json bun.lock ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,target=/root/.bun/install/cache bun install



RUN cd apps/pwa && GIT_SHA=$GIT_SHA bun run build
RUN cd apps/pwa && bun build --compile serve-dist.ts --outfile=serve-dist --bytecode --production --format=esm

# Production stage - minimal http server
FROM alpine:latest AS production

WORKDIR /app

RUN apk add --no-cache libstdc++ libgcc

COPY --from=builder /app/apps/pwa/dist ./dist
COPY --from=builder /app/apps/pwa/serve-dist ./serve

EXPOSE 3000
ENV NODE_ENV=production
ENV DIST_PATH=/app/dist

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/robots.txt || exit 1

CMD ["./serve"]