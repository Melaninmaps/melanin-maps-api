FROM node:20-alpine
WORKDIR /app
COPY dist/ ./dist/
COPY web-static/ ./web-static/
EXPOSE 8080
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
