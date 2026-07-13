FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY dist/ ./dist/
COPY static-server.mjs ./
COPY web-static/ ./web-static/
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "static-server.mjs"]
