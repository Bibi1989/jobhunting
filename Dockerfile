# Build from repo root: docker build -f web/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
ENV MIGRATIONS_DIR=/app/server/db/migrations
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV MIGRATIONS_DIR=/app/migrations
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./
COPY --from=build /app/server/db/migrations ./migrations
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
