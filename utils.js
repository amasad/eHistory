Utils = {
  parseUrl: function (url) {
    url = url.replace(/http(s)*:\/\//, "").replace(/:[0-9]+/,'');
    var hostName = url.split('/')[0];
    return {
      hostName: hostName,
      path: url.replace(hostName + "/", "")
    };
  },
  daysInMonth: function(mnth, yr) {
    return 32 - new Date(mnth, yr, 32).getDate();
  },
  dayOnYear: function(date) {
    var day, i, month, ret, yr;
    day = date.getDate();
    month = date.getMonth();
    yr = date.getFullYear();
    ret = 0;
    for (i = 0; 0 <= month ? i <= month : i >= month; 0 <= month ? i++ : i--) {
      ret += Utils.daysInMonth(i, yr);
    }
    return ret += day;
  }
};