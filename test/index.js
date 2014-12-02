
var Test = require('segmentio-integration-tester');
var helpers = require('./helpers');
var facade = require('segmentio-facade');
var mapper = require('../lib/mapper');
var assert = require('assert');
var should = require('should');
var Helpscout = require('..');

describe('Help Scout', function () {
  var helpscout;
  var payload;
  var settings;

  beforeEach(function(){
    payload = {};
    settings = { apiKey: '2c3f0736da1f53462ba0a1e4bb07e42c20778be8' };
    helpscout = new Helpscout(settings);
    test = Test(helpscout, __dirname);
    test.mapper(mapper);
  });

  it('should correct settings', function(){
    test
      .name('Help Scout')
      .endpoint('https://api.helpscout.net/v1')
      .ensure('message.email', { methods: ['identify'] })
      .channels(['server', 'mobile', 'client'])
      .ensure('settings.apiKey')
      .retries(2);
  });

  describe('.validate()', function () {
    it('should be invalid without apiKey', function(){
      test.invalid(helpers.identify(), {});
    });

    it('should be invalid if email is missing', function(){
      test.invalid({ type: 'identify' }, settings);
    });

    it('should be valid if email and apiKey is given', function(){
      test.valid(helpers.identify(), settings);
    });
  });

  describe('mapper', function(){
    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic');
      });

      it('should fallback to .photoUrl', function(){
        test.maps('identify-photo-url');
      });

      it('should fallback to .background', function(){
        test.maps('identify-background');
      });

      it('should fallback to .zip', function(){
        test.maps('identify-zip');
      });

      it('should fallback to .jobTitle', function(){
        test.maps('identify-job-title');
      });

      it('should map address properly even when info is in .traits', function(){
        test.maps('identify-address');
      });

      it('should map multi .phones and .websites properly', function(){
        test.maps('identify-multi');
      });
    });
  });

  describe('.identify()', function () {
    it('should be able to identify a new user', function(done){
      var msg = helpers.identify();

      payload.emails = [{ value: msg.email() }];
      payload.firstName = msg.firstName();
      payload.lastName = msg.lastName();
      payload.organization = msg.proxy('traits.organization') || msg.proxy('traits.company');
      payload.websites = msg.proxy('traits.websites').map(function(w){ return { value: w } });
      payload.phones = [{ location: 'mobile', value: msg.proxy('traits.phone') }];

      test
        .set(settings)
        .identify(msg)
        .request(1)
        .sends(payload)
        .expects(201, function(err, res){
          if (err) return done(err);
          res[0].body.item.emails[0].value.should.eql(msg.email());
          done();
        });
    });

    it('should be able to identify an existing user', function (done) {
      var msg = helpers.identify({ email: 'calvin@segment.io' });

      payload.emails = [{ value: msg.email() }];
      payload.firstName = msg.firstName();
      payload.lastName = msg.lastName();
      payload.organization = msg.proxy('traits.organization') || msg.proxy('traits.company');
      payload.websites = msg.proxy('traits.websites').map(function(w){ return { value: w } });
      payload.phones = [{ location: 'mobile', value: msg.proxy('traits.phone') }];

      test
        .set(settings)
        .identify(msg)
        .request(1)
        .sends(payload)
        .expects(201, function(err, res){
          if (err) return done(err);
          res[0].body.item.emails[0].value.should.eql(msg.email());
          done();
        });
    });

    it('should error on invalid keys', function(done){
      test
        .set({ apiKey: 'x' })
        .identify({})
        .error('cannot GET /v1/customers.json?email= (401)', done);
    });
  });

  describe('._getUser()', function () {
    it('should error on an invalid key', function (done) {
      helpscout.settings.apiKey = 'segment';
      var email = 'calvin@segment.io';
      helpscout._getUser({ email : email }, function (err, user) {
        should.exist(err);
        err.status.should.eql(401);
        should.not.exist(user);
        done();
      });
    });

    it('should not return a non-existent user', function (done) {
      var email = 'non-existent@segment.io';
      helpscout._getUser({ email : email }, function (err, user) {
        should.not.exist(err);
        should.not.exist(user);
        done();
      });
    });

    it('should return an existing user', function (done) {
      var identify = helpers.identify({ email: 'calvin@segment.io' })
      var email = identify.email();
      helpscout._getUser({ email : email }, function (err, user) {
        should.not.exist(err);
        should.exist(user);
        user.firstName.should.eql(identify.firstName());
        user.lastName.should.eql(identify.lastName());
        done();
      });
    });
  });
});
