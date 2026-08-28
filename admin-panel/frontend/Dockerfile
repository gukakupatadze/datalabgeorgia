# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --ignore-scripts

COPY . ./
ARG PUBLIC_URL=/admin
ARG REACT_APP_BACKEND_URL=
ENV PUBLIC_URL=${PUBLIC_URL} \
    REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL} \
    NODE_ENV=production
RUN pnpm build

FROM nginx:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html/admin
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
