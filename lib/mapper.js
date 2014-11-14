
/**
 * Module dependencies.
 */

var reject = require('reject');
var is = require('is');

/**
 * Map identify `msg`.
 *
 * @param {Identify} msg
 * @return {Object}
 */

exports.identify = function(msg){
  return formatTraits(msg);
};

/**
 * Add the HelpScout traits
 *
 * http://developer.helpscout.net/customers/update/
 *
 * @param  {Facade.Identify} identify
 * @return {Object}
 * @api private
 */

function formatTraits(identify){
  var organization = identify.proxy('traits.organization') ||
                     identify.proxy('traits.company');

  var traits = reject({
    gender: identify.gender(),
    age: identify.age(),
    location: identify.proxy('traits.location'),
    photoUrl: identify.avatar(),
    firstName: identify.firstName(),
    lastName: identify.lastName(),
    emails: [{ value: identify.email() }],
    organization: organization,
    jobTitle: identify.position(),
    background: identify.description(),
    address: formatAddress(identify),
    websites: identify.websites().map(formatData),
    phones: formatPhones(identify)
  });

  return traits;
}

/**
 * Add location data to each item in the phones array
 *
 * @param {Identify} identify
 * @return {Array}
 * @api private
 */

function formatPhones(identify){
  var phones = identify.phones().map(formatData);
  if (!phones.length) return;
  return phones.map(function(phone){
    phone.location = phone.location || 'mobile';
    return phone;
  });
}

/**
 * Formats an address for helpscout
 *
 * @param {Identify} identify
 * @return {Object}
 * @api private
 */

function formatAddress(identify){
  var zip = identify.zip();
  var city = identify.city();
  var country = identify.country();
  var state = identify.state();
  var street = identify.street();

  if (!zip || !city || !country || !state || !street) return;

  return {
    city: city,
    state: state,
    postalCode: zip,
    country: country,
    lines: [street]
  };
}

/**
 * Formats an array field for HelpScout
 *
 * http://developer.helpscout.net/customers/update/
 *
 * @param {Array} data
 * @return {Object}
 * @api private
 */

function formatData (data) {
  return { value: data };
}
