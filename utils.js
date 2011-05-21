Utils = {
  parseUrl: function (url){
    url = url.replace(/http(s)*:\/\//, "").replace(/:[0-9]+/,'');
    var hostName = url.split('/')[0];
    return {
      hostName: hostName,
      path: url.replace(hostName + "/", "")
    };
  }
};