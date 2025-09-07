FROM node:20

# build tools
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++

WORKDIR /app

COPY package*.json ./
COPY index.js ./

RUN npm install

EXPOSE 6000

CMD [ "npm", "start" ]
