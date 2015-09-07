FROM node:0.12.2

COPY . /myapp
RUN npm install bower -g
RUN cd /myapp && npm install -d --production && bower install --allow-root 

WORKDIR /myapp
EXPOSE 3000
CMD ["npm", "start"]
