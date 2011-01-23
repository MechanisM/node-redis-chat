# distributed redis websocket chat server for nodejs

## INSTALLATION

### install dependencies
    npm install hiredis redis
    npm install socket.io

### create directories
    mkdir log
    mkdir tmp

### set up config file
    create `config/config.js` from `config.js.sample`

## RUNNING

### local start
    node app.js

### daemonized and monitored
    god load god/chat.god
