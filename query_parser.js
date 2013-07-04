/*  parseQuery:  Parses the search query
 *      @arg (String) input: The search query
 *      @returns (Array) [settings, filters, text]
 */
this.parseQuery = function (input) {
  // assumes search query is a space delimted key/value pairs.
  var options = (input.split(/\s/));

  var filters = {
    inurl: null,
    intitle: null,
    site: null
  };

  // Chrome search object.
  var searchSettings = {
    startTime: null,
    endTime: null,
    text: ''
  };

  var combined = '';

  options.forEach(function (pair) {
    if (!pair) return;
    // assume key:value
    pair = pair.split(':');
    searchSettings[pair[0]] !== undefined ?
        // pair is a search setting type
        searchSettings[pair[0]] = pair[1] :
        // pair is a filter type
        filters[pair[0]] !== undefined ?
            combined += ' ' + (filters[pair[0]] = pair[1]) :
            combined += ' ' + (pair[1] || pair[0] || '');
  });
  searchSettings.text = combined.trim();

  // delete all empty filters
  for (var prop in filters) {
    if (filters[prop] === null) {
      delete filters[prop];
    }
  }

  return {
    settings: searchSettings,
    filters: filters
  };
};