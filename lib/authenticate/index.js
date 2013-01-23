var crypto = require('crypto'),
  _ = require('underscore'),
  url = require('url');


// Initialize by running authenticate.middleware(options);
var authenticate = module.exports = {};

authenticate.defaults = {}

authenticate.serializeToken = function(client_id, user_id, extra_data) {
  return this.serializer.stringify([user_id, client_id, +new Date, extra_data]);
};

authenticate.deserializeToken = function(access_token) {
  if(typeof(access_token) === "undefined") {
    return false;
  }

  try {
    var data = this.serializer.parse(access_token);
    return data;
  } catch(e) {
    console.log("Could not parse access token: " + access_token);
    console.log("Error Message: ", e.message);
    return false;
  }
}

authenticate.middleware = function(options) {
  var self = this;

  this.options = options || {};
  _.defaults(this.options, this.defaults);

  if(!this.options.encrypt_key || !this.options.validate_key) {
    throw new Error("Encrypt key and validate key required by authenticate.middleware.  Example: authenticate.middleware({encrypt_key: 'crypt', validate_key: 'sign'})");
  }

  this.serializer = new encryptedSerializer(this.options.encrypt_key, this.options.validate_key);

  this.options.encrypt_key = undefined;
  this.options.validate_key = undefined;

  var auth = function(req, res, next) {

    var parsed_url = url.parse(req.url, true);

    var access_token = req.body.access_token || parsed_url.query.access_token || req.headers["x-access-token"];

    var deserialized_token = self.deserializeToken(access_token);

    if(deserialized_token) {
      req.user = {};
      req.user.user_id = deserialized_token[0];
      req.user.client_id = deserialized_token[1];
      req.user.date = deserialized_token[2];
      req.user.extra_data = deserialized_token[3];
      req.user.access_token = access_token;
    }

    return next();
  };

  return auth;
}


// PRIVATE METHODS
var CYPHER = 'aes256';
var CODE_ENCODING = "hex";
var DATA_ENCODING = "utf8";

function signStr(str, key) {
  var hmac = crypto.createHmac('sha1', key);
  hmac.update(str);
  return hmac.digest('base64').replace(/\+/g, '-').replace(/\//g, '_');
};

function randomString(bits) {
  var rand
  , i
  , chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  , ret=''
  ;
  // in v8, Math.random() yields 32 pseudo-random bits (in spidermonkey it gives 53)
  while(bits > 0){
    rand=Math.floor(Math.random()*0x100000000); // 32-bit integer
    // base 64 means 6 bits per character,
    // so we use the top 30 bits from rand to give 30/6=5 characters.
    for(i=26; i>0 && bits>0; i-=6, bits-=6) ret+=chars[0x3F & rand >>> i]
  }
  return ret
};

var secureStringify = function(obj, encrypt_key, validate_key) {
  var nonce_check = randomString(48); // 8 chars
  var nonce_crypt = randomString(48); // 8 chars
  var cypher = crypto.createCipher(CYPHER, encrypt_key + nonce_crypt);
  var data = JSON.stringify(obj);
  var res = cypher.update(nonce_check, DATA_ENCODING, CODE_ENCODING);
  res += cypher.update(data, DATA_ENCODING, CODE_ENCODING);
  res += cypher.final(CODE_ENCODING);
  var digest = signStr(data, validate_key + nonce_check);

  // converts to base64 and replaces all = with ""
  var base64 = new Buffer(digest + nonce_crypt + res).toString("base64").replace('=', '');
  return base64;
};

var secureParse = function(str, encrypt_key, validate_key) {
  // pads base64 string to % 4 length
  while(str.length % 4 > 0) { str += "="; }
  str = new Buffer(str, "base64").toString(DATA_ENCODING);
  var expected_digest = str.substring(0, 28);
  var nonce_crypt = str.substring(28, 36);
  var encrypted_data = str.substring(36, str.length);
  var decypher = crypto.createDecipher(CYPHER, encrypt_key + nonce_crypt);
  var data = decypher.update(encrypted_data, CODE_ENCODING, DATA_ENCODING);
  data += decypher.final(DATA_ENCODING);
  var nonce_check = data.substring(0, 8);
  data = data.substring(8, data.length);
  var digest = signStr(data, validate_key + nonce_check);
  if(digest != expected_digest) throw new Error("Bad digest");
  return JSON.parse(data);
};

var encryptedSerializer = function(encrypt_key, validate_key) {
  return {
    stringify: function(obj) {
      return secureStringify(obj, encrypt_key, validate_key);
    },
    parse: function(str) {
      return secureParse(str, encrypt_key, validate_key);
    }
  }
}
