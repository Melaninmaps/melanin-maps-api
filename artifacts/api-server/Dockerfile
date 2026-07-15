FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts 2>/dev/null || true
COPY dist/ ./dist/
COPY web-static/ ./web-static/
EXPOSE 8080
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
