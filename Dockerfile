FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY dist/ ./dist/
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/index.mjs"]
