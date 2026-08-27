# Pinned to Node 24 because the app uses node:sqlite, the SQLite module built
# into the runtime. On anything older it does not exist and the app cannot
# start. This image exists so that version floor is never the reviewer's
# problem.
FROM node:24-alpine

WORKDIR /app

# Copy manifests first so npm install is cached across source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# The SQLite file lives here. docker-compose mounts a named volume over it so
# data survives a container restart.
VOLUME /app/data
ENV TODO_DB=/app/data/todo.db
ENV PORT=3000
EXPOSE 3000

# Seed on every start. The script is a no-op if the demo user already exists,
# so restarting never duplicates or overwrites anything.
CMD ["sh", "-c", "npm run seed && npm start"]
