FROM node:20-alpine
WORKDIR /app
COPY dist/ ./dist/
COPY web-static/ ./web-static/
# dist/public is a tracked legacy runtime snapshot. The reviewed web-static
# directory is synchronized by the release gate and must always replace it in
# the deploy image so the API cannot serve a prior browser bundle.
RUN rm -rf ./dist/public && mkdir -p ./dist/public && cp -a ./web-static/. ./dist/public/
EXPOSE 8080
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
