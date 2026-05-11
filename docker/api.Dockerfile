FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm install

COPY . .

RUN npm run prisma:generate --workspace apps/api
RUN npm run build --workspace apps/api

EXPOSE 3001

CMD ["sh", "-c", "npm run prisma:migrate --workspace apps/api && npm run seed --workspace apps/api && node apps/api/dist/index.js"]
