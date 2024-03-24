FROM node:18.18.0-alpine3.18

WORKDIR var/webrtc-screen-sharing

COPY . .

RUN npm config set registry https://registry.npm.taobao.org/

RUN npm install

EXPOSE 9632

CMD [ "node", "index.js" ]