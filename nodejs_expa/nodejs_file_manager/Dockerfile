# latest official node image
FROM node:latest

#use nodemon for development
RUN npm install -g nodemon

COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /usr/src/app && cp -a /tmp/node_modules /usr/src


WORKDIR /usr/src/app
COPY . /usr/src/app

EXPOSE 3000

CMD ["npm", "start"]