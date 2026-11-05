# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS run
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist/sipoc-ui/browser /usr/share/nginx/html

EXPOSE 80
