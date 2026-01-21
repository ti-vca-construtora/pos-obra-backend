FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Build do NestJS (AGORA NO FINAL)
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main.js"]