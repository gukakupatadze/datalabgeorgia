# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps --no-audit --no-fund

COPY . ./

ARG REACT_APP_API_URL=/api
ARG REACT_APP_CRM_API_URL=/api
ARG REACT_APP_ADMIN_URL=/admin/
ENV REACT_APP_API_URL=${REACT_APP_API_URL} \
    REACT_APP_CRM_API_URL=${REACT_APP_CRM_API_URL} \
    REACT_APP_ADMIN_URL=${REACT_APP_ADMIN_URL} \
    NODE_ENV=production

RUN npm run build

FROM nginx:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
