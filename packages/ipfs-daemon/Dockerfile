FROM node:14.10.1

RUN npm --global config set user root && \
    npm install --global @ceramicnetwork/ipfs-daemon

EXPOSE 4011 4012 5011 9011 8011

CMD ipfs-daemon
