/*  parseQuery:  Parses the search query
 *      @arg (String) input: The search query
 *      @returns (Array) [settings, filters, text]
 */
this.parseQuery = function (query) {
  // Custom filters.
  var filters = {
    inurl: null,
    intitle: null,
    site: null
  };

  // Chrome search object.
  var settings = {
    startTime: null,
    endTime: null
  };

  var combined = '';

  // Assumes search query is a space delimted key/value pairs.
  query.split(/\s/).forEach(function (pair) {
    if (!pair) return;
    // Assume key:value
    pair = pair.split(':');
    if (settings.hasOwnProperty(pair[0])) {
      settings[pair[0]] = pair[1];
    } else if (filters.hasOwnProperty(pair[0])) {
      filters[pair[0]] = pair[1]
      combined += ' ' + (pair[1]);
    } else {
      combined += ' ' + pair.join(':');
    }
  });

  settings.text = combined.trim();

  // TODO: is this needed?
  // delete all empty filters
  for (var prop in filters) {
    if (filters[prop] === null) {
      delete filters[prop];
    }
  }

  return {
    settings: settings,
    filters: filters
  };
};
