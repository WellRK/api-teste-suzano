# Usa a imagem base do Node.js na versão especificada
FROM node:22.2.0

# Define o diretório de trabalho no contêiner
WORKDIR /app

# Copia package.json e yarn.lock para instalar dependências
COPY package.json yarn.lock ./

# Instala dependências com Yarn
RUN yarn install

# Copia o restante do código-fonte para o contêiner
COPY . .

# Expõe a porta 3000 (ou ajuste para a porta que seu app usa)
EXPOSE 3000

# Comando para iniciar o aplicativo em modo de desenvolvimento
CMD ["yarn", "start:dev"]