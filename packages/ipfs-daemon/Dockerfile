FROM node:14.10.1

WORKDIR /ipfs

COPY . /ipfs

RUN npm install

RUN npm run build

EXPOSE 4011 4012 5011 9011 8011

CMD npm start
