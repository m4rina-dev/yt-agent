FROM apify/actor-node:20 AS builder

COPY package*.json tsconfig.json ./
RUN npm ci --include=dev
COPY src ./src
RUN npm run build

FROM apify/actor-node:20

COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev --omit=optional \
 && npm cache clean --force \
 && echo "Node $(node --version) / npm $(npm --version)"

CMD ["node", "dist/main.js"]
