var redis  = require("redis"),
    http   = require('http'),
    url    = require('url'),
    io     = require('socket.io'),
    config = require('./config/config'),
    helper = require('./lib/helper'),
    fs     = require('fs'),
    sys    = require('sys'),
    path   = require('path');
    
// move this to a helper
global.puts = sys.puts;
global.log = function(obj) {
  sys.puts(sys.inspect(obj));
};

process.on('uncaughtException', function (err) {
  puts('Caught exception: ' + err.message + "\nStack: " + err.stack);
});

function static_handler(filename) {
  var body
    , headers
    , content_type = helper.mime_lookup(path.extname(filename))
    , file_path    = path.join(__dirname, 'static', filename);

  function loadResponseData(callback) {
    // sys.puts("loading " + file_path + "...");
    fs.readFile(file_path, function (err, data) {
      if (err) {
        sys.puts("Error loading static file " + file_path);
      } else {
        body = data;
        headers = { "Content-Type": content_type
                  , "Content-Length": body.length
                  };
        headers["Cache-Control"] = "public";
        // sys.puts("static file " + file_path + " loaded");
        callback();
      }
    });
  }

  return function (req, res) {
    loadResponseData(function () {
      res.writeHead(200, headers);
      res.end(req.method === "HEAD" ? "" : body);
    });
  };
}

// static HTTP server
var server = http.createServer(function (req, res) {
  // first, handle cross domain resource requests
  if (req.method === "OPTIONS") {
    res.writeHead(200, {'Access-Control-Allow-Origin'  : '*',
                        'Content-Lengh'                : '0',
                        'Access-Control-Allow-Methods' : 'POST, GET, OPTIONS',
                        'Access-Control-Allow-Headers' : 'x-file-name,x-requested-with,x-content-type,Content-Type'});
    res.end();
    return;
  }
  
  if (req.headers['content-length'] > 1024 * 1024 * 10) {
    request_too_large(res);
    return;
  }
  
  // for apache proxying from "yourhost.com/node/" to "yourhost.com:8000/"
  var parsed_url     = url.parse(req.url, true)
    , request_path   = parsed_url.pathname.replace(/\/node/i, '')
    , request_params = parsed_url.query;
  
  // taken from node.js chat example
  res.json_response = function (code, obj) {
    var body = JSON.stringify(obj);
    res.writeHead(code, { "Content-Type"                : "text/html"
                        , "Content-Length"              : body.length
                        , 'Access-Control-Allow-Origin' : '*'});
    res.end(body);
  };
  
  res.text_response = function (code, str) {
    res.writeHead(code, { "Content-Type"                : "text/html"
                        , "Content-Length"              : str.length
                        , 'Access-Control-Allow-Origin' : '*'});
    res.end(str);
  };
  
  if (request_path === '/') {
    // serve the static page
    static_handler('chat.html')(req, res);
  } else if (request_path.match(/xhr-polling/)) {
    console.log('polling');
  } else {
    static_handler(request_path)(req, res);
  }
  
});

server.listen(config.server.port, '127.0.0.1', function() {
  // write out the PID for god
  fs.writeFile(path.join(__dirname, 'tmp/chat.pid'), process.pid.toString());
  puts('chat server listening on ' + config.server.port);
});

// socket.io server
var socket    = io.listen(server),
    buffer    = [],
    subclient = redis.createClient(),
    redclient = redis.createClient();
    
// redis code
redclient.on("error", function (err) {
  console.log("-- Redis Error " + err);
});

// subclient.set("string key", "string val", redis.print);
// subclient.hset("hash key", "hashtest 1", "some value", redis.print);
// subclient.hset(["hash key", "hashtest 2", "some other value"], redis.print);
// subclient.hkeys("hash key", function (err, replies) {
//   console.log(replies.length + " replies:");
//   replies.forEach(function (reply, i) {
//       console.log("    " + i + ": " + reply);
//   });
//   subclient.quit();
// });

subclient.subscribe('user-list');
subclient.subscribe('chat-message');
socket.on('connection', function (client) {
  redclient.lrange('chat-buffer', -50, -1, function (err, resp) {
    var parsed_resp = [];
    for (var i = 0; i < resp.length; ++i) {
      parsed_resp.push(JSON.parse(resp[i]));
    }
    client.send({'buffer': parsed_resp});
  });
  
  subclient.on('message', function (channel, message) {
    message = JSON.parse(message);
    if (channel === 'user-list') {
      client.send({ 'announcement' : message.session_id + ' ' + message.action });
    } else if (channel === 'chat-message') {
      // check to see if the message is from a different user
      if (message.message[0] !== client.sessionId.toString()) {
        client.send(message);
      }
    } else {
      throw new Error('unexpected redis message');
    }
  });
  
  redclient.publish('user-list', JSON.stringify({'session_id': client.sessionId, 'action': 'connected'}));
  
  client.on('message', function (message) {
    console.log(message);
    var msg = { message: [client.sessionId, message] };
    redclient.rpush('chat-buffer', JSON.stringify(msg));
    // buffer.push(msg);
    // if (buffer.length > 15) buffer.shift();
    redclient.publish('chat-message', JSON.stringify(msg));
    // client.broadcast(msg);
  });
  client.on('disconnect', function () {
    redclient.publish('user-list', JSON.stringify({'session_id': client.sessionId, 'action': 'disconnected'}));
    console.log('disconnected!');
  });
});