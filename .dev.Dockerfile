FROM node:22-alpine
WORKDIR /opt/app
RUN corepack enable
COPY package.json bun.lock ./
RUN npm install -g bun && bun install --frozen-lockfile
EXPOSE 3000
CMD ["bun", "run", "dev", "--hostname", "0.0.0.0"]