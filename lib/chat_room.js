var util     = require('util'),
    _        = require('underscore')._;

// single or multi key iterator for underscore
function iterator (key) { 
  var args = _.toArray(arguments);
  return function (obj) {
    if (obj[key] === undefined)       return obj;
    if (args.length === 1 ||
        typeof obj[key] === 'number') return obj[key];
    return args.map(function (arg) {
      return obj[arg];
    }).join(' ');
  };
}

var ChatRoom = module.exports = function (name, redclient, options) {
  var defaults = {},
      self     = this;
  
  process.EventEmitter.call(this);
  
  this.name    = name;
  this.users   = [];
  // {account_id: [session_ids]}
  this.sids    = {};
  this.created = this.last_active = (new Date).getTime();
  this.options = _.extend(defaults, options);
};
    
util.inherits(ChatRoom, process.EventEmitter);

ChatRoom.prototye._valid = function () {
  return;
};

ChatRoom.prototye.size = function () {
  return this.users.length;
};

ChatRoom.prototype.user_list = function () {
  return _.map(users, function (user) {
    return (user.fn + ' ' + user.ln).trim();
  });
};

//  user = { ai : account id,
//           si : [list of websocket session ids],
//           fn : first name,
//           ln : last name,
//           la : last active since chat room created in seconds,
//           im : profile pic asset }
ChatRoom.prototype.user_connect = function (user) {
  var index         = _.sortedIndex(users, user, iterator('fn', 'ln')),
      u_last_active = (this.last_active = (new Date).getTime()) / 1000;
  console.log('index is ' + index);
  if (sids[aid]) {
    // if user is already currently connected, i.e. opens chat in a new tab
    users[index]['la'] = u_last_active;
    users[index]['si'].push(user['si']);
    _.uniq(users[index]['si']);
  }
  user['la'] = u_last_active;
  user['si'] = [user[si]];
  users.splice(index, 0, user);
};