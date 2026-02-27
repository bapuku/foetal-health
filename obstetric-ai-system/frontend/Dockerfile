FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production=false

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nextjs && adduser --system --uid 1001 nextjs
RUN apk add --no-cache su-exec
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/data ./data
COPY --from=builder /app/data ./data-seed
RUN chown -R nextjs:nextjs /app/data /app/data-seed
EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["/bin/sh", "-c", "\
  chown -R nextjs:nextjs /app/data 2>/dev/null || true; \
  for f in /app/data-seed/*.json; do \
    bn=$(basename \"$f\"); \
    [ ! -f \"/app/data/$bn\" ] && cp \"$f\" \"/app/data/$bn\" && chown nextjs:nextjs \"/app/data/$bn\"; \
  done; \
  exec su-exec nextjs node server.js"]
