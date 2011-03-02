distributed redis websocket chat in nodejs
===========================

## API

All messages are JSON objects.
  
client -> server connection request:

    {action: 'handshake',
     acc_id: account_id,
     asset:  asset name for profile pic,
     fn:     first name,
     ln:     last name,
     sid:    backend session id,
     orgs:   [org_ids].sort,
     token:  MD5::hex_digest(token string)}
    
    // token string
    "account id\n" +
    "backend session id\n" +
    "[org_ids].sort.join(',')\n" +
    "secret key"
    
    // example
    "3287\n" +
    "hf1jd3i4e5x6j6z7k7z8i8z8je3ijz\n" +
    "2,13,64\n" +
    "THIS_IS_A_SECRET!"
    
server -> client connection response on success

    {action: 'handshake-success' || 'handshake-failure',
     orgs:   [{id:     org_id, // this array will be ordered by the org name
               ln:     org long name,
               asset:  org profile pic asset, // not yet implemented
               active: [{}],
               sn:     org short name},
              {id:     org 2 id, ...}],
     wsid:   websocket session id}

check available chat room list

joining a chat room

    {action: 'join',
     type:   'org' || 'account',
     id:     org_id || account_id,
     name:   }


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
