this.Util = (function () {
var rProtocol = /^([a-z0-9+]+:)/i,
    rPort = /:[0-9]+$/,
    // Charecters that are not allowed in a hostname.
    nonHostChars = ['<', '>', '"', '`', ' ', '\r', '\n', '\t', '{', '}', '|',
                    '\\', '^', '~', '[', ']', '`', '%', '/', '?', ';', '#'],
    // Protocols that don't have a hostname.
    hostlessProtocols = {
      'javascript': true,
      'file': true
    };

  // Gets the hostname without the port.
  return {
    getHostname: function (url) {    
      var proto = rProtocol.exec(url),
          rest = url,
          host = '';

      proto = proto ? proto[0] : null;
      
      if (proto && !hostlessProtocols[proto]) {
        // We should have a host.
        rest = rest.substr(proto.length + 2);
        
        // Find the first non host character index in the url string left.
        var firstNonHost = -1;
        for (var i = 0; i < nonHostChars.length; i++) {
          var index = rest.indexOf(nonHostChars[i]);
          if (index !== -1 && 
                (index < firstNonHost || firstNonHost === -1)) firstNonHost = index;
        }
        
        // Get the actual hostName.
        if (firstNonHost !== -1) {
          host = rest.substr(0, firstNonHost);
          // Remove port.
          host = host.replace(rPort, '');
        }
      }
      return host;
    }
  };

})();
