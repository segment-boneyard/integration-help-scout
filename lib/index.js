
/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var errors = integration.errors;
var mapper = require('./mapper');

/**
 * Expose `HelpScout`
 */

var HelpScout = module.exports = integration('Help Scout')
  .endpoint('https://api.helpscout.net/v1')
  .ensure('message.email', { methods: ['identify'] })
  .channels(['server', 'client', 'mobile'])
  .ensure('settings.apiKey')
  .retries(2);

/**
 * Identifies a user in HelpScout. We first have to check whether a user
 * already exists for this email. If they don't, create them, otherwise
 * update them. TODO: fix race conditions with a shared lock.
 *
 * http://developer.helpscout.net/customers/create/
 * http://developer.helpscout.net/customers/update/
 *
 * @param {Identify} identify
 * @param {Function} fn
 * @api public
 */

HelpScout.prototype.identify = function(identify, callback){
  var email = identify.email()
  var self  = this;
  this._getUser({ email: email }, function(err, user){
    if (err) return callback(err);
    var payload = mapper.identify(identify);
    if (!user) return self._createUser(payload, callback);
    self._updateUser(user.id, payload, callback);
  });
};

/**
 * Get a user from the API, filtered by particular fields
 *
 * @param  {Object}   filter   an object to match fields on
 * @param  {Function} callback (err, user)
 * @api private
 */

HelpScout.prototype._getUser = function(filter, callback){
  return this
    .get('/customers.json')
    .auth(this.settings.apiKey, 'X')
    .query(filter)
    .end(this.handle(function(err, res){
      if (err) return callback(err);
      var items = res.body.items;
      callback(null, items && items[0]);
    }));
};

/**
 * Updates the user in HelpScout with the given `payload` and `id`.
 *
 * @param  {String}   id        the HelpScout id
 * @param  {Object}   payload
 * @param  {Function} callback  (err, user)
 * @api private
 */

HelpScout.prototype._updateUser = function(id, payload, callback){
  return this
    .put('/customers/' + id + '.json')
    .auth(this.settings.apiKey, 'X')
    .query({ reload: true })
    .type('json')
    .send(payload)
    .end(this.handle(callback));
};

/**
 * Creates a user in HelpScout with `payload`.
 *
 * @param {Object} payload
 * @param {Function} fn
 * @api private
 */

HelpScout.prototype._createUser = function(payload, callback){
  return this
    .post('/customers.json')
    .auth(this.settings.apiKey, 'X')
    .query({ reload: true })
    .type('json')
    .send(payload)
    .end(this.handle(callback));
};
