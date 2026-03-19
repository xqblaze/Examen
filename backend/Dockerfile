FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i
COPY . .
RUN npm run prisma:generate
EXPOSE 4000
CMD ["npm","run","start"]

