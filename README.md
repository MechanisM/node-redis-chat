distributed redis websocket chat in nodejs
===========================

## API
  TBD

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
