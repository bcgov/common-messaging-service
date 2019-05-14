const utils = {
  // Returns a pretty JSON representation of an object
  prettyStringify: obj => JSON.stringify(obj, null, 2),
  responseOk: status => status >= 200 && status <= 299
};

module.exports = utils;
