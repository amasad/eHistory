/*
 * eHistory Chrome Extension
 * https://chrome.google.com/webstore/detail/hiiknjobjfknoghbeelhfilaaikffopb
 *
 * Copyright 2011, Amjad Masad
 * Licensed under the MIT license
 * https://github.com/amasad/eHistory/blob/master/LICENSE.txt
 *
 * Date: Mon May 9
 */
//EHistory container
var EHistory = (function ($) {
//CONSTANTS
var MAX = 2147483647;
//constructor
function EHistory() {/*fdsfsd*/}
// Extend date class to get some nice features
(function () {
  // milliseconds in one day
  var msDay = 24 * 60 * 60 * 1000;
  
  Date.prototype.start = function () {
    return new Date(this.toDateString());
  };
  
  Date.prototype.next = function () {
    return this.start().getTime() + msDay;
  };
  
  Date.prototype.prev = function () {
    return this.start().getTime() - msDay;
  };
}());

var arrayUnique = function (arr) {
  var ids = {};
  for (var i=0; i < arr.length; i++) {
    if (ids[arr[i].id]) {
      arr.splice(i--, 1);
    } else {
      ids[arr[i].id] = true;
    }
  }
  return arr;
}

// simple memoization
var memoizeKeys = (function () {
  var lastKeys;
  var lastObj;
  return function (obj) {
    if (lastObj === obj) {
      return lastKeys;
    } else {
      lastObj = obj;
      return (lastKeys = Object.keys(obj));
    }
  }
})();

//methods
EHistory.prototype = {


  search: function (settings, filters, cb) {
    this.offset = 0;
    this.filters = filters;
    this.visits_day = new VisitsByDay();
    this.pageSize = settings.maxResults;
    this.cb = cb;
    this.query = settings.text;
    this.settings = {
      text: "",
      startTime: 0,
      endTime: Date.now(),
      maxResults : 150
    };
    $.extend(this.settings, settings);
    this.getPage(1); 
  },


  getPage: function (pageNo, cb, callback) { 
    this.cb = cb || this.cb;
    var settings = this.settings,
        filtered = [],
        ids = {},
        that = this,
        filter = Object.keys(this.filters).length;
        
    settings.maxResults = this.offset + this._pageLimit(pageNo);
    
    function search () {
      chrome.history.search(settings, function (result) {
        var resultItem;
        result = result.slice(settings.maxResults - that.pageSize, settings.maxResults);
        for (var i=0; i < result.length && filtered.length < that.pageSize; i++) {
          resultItem = result[i];
          if (ids[resultItem.id] || (filter && !that.filter(resultItem))) continue;
          ids[resultItem.id] = true;
          filtered.push(resultItem);
        }
        if (result.length && filtered.length < that.pageSize) {
          settings.maxResults += that.pageSize;
          that.offset = settings.maxResults - that._pageLimit(pageNo) - i;
          search();
        } else if (filtered.length) {
          if (filtered.length < that.pageSize) $(that).trigger("finished");
          if (callback) callback(filtered);
          else that.getVisits(filtered);
        } else {
          $(that).trigger("finished");
          $(that).trigger("done");
        }
      });
     }
     search(); 
  },

  _pageLimit: function (pageNo) {
    return pageNo * this.pageSize;            
  },
  
  getVisits: function (items) {
      var visits = [],
          that = this,
          items_length = items.length,
          days = [],
          visits_day = this.visits_day,
          visitItem, day;
    
      for (var i = 0; i < items_length; i++) {
        chrome.history.getVisits({url: items[i].url}, function (res_visits) { 
        items_length--;
        for(var j = 0; j < res_visits.length; j++) { 
          visitItem = res_visits[j];
          if (visitItem.visitTime > that.settings.endTime || 
                                                  visitItem.visitTime < that.settings.startTime) continue;
          visitItem.day = day = new Date(visitItem.visitTime).start().getTime();
          visits_day.insert(visitItem);
        }
        
        if (items_length === 0) {
          that.cb({
            items: items,
            visits: visits_day.sort().dequeue(that.pageSize)
          });
          $(that).trigger("done");
        }
      });
    }
  },

  deleteUrls: function (urlsByDay, callback) {
    var days = memoizeKeys(urlsByDay),
        count = 0;        

    (function deleteUrls() {
      if (count === days.length) return callback();

      var urls = urlsByDay[days[count++]];
      for (var i = 0; i < urls.length; i++)
        chrome.history.deleteUrl({url: urls[i].url});      
      setTimeout(deleteUrls, 100);
    })();
  },
  
  deleteAllresults: function (callback) {
    var settings = $.extend(null, this.settings),
        finished = false,
        that = this;

    settings.maxResults = MAX;
    this.offset = 0;
    function finish () { 
      finished = true;
      $(that).unbind("finished", finish);
      callback();
    }
    $(this).bind("finished", finish);
    (function deleteAll () {
      if (finished) return;
      that.getPage(1, undefined, function (page) {
        for (var i = 0; i < page.length; i++) {
          chrome.history.deleteUrl({url: page[i].url});
        }
        deleteAll();
      });
    })();
    
  },
  /* 
  deleteUrlOnDay: function (url, day, callback) {
    var nextDay = new Date(parseFloat(day)).next();
    var toDelete = [];
    var that = this;
    chrome.history.getVisits({url:url}, function (visits) {
      var visitTime;
      for (var i=0, visit; visit = visits[i]; i++) {
        visitTime = visit.visitTime;
        if (visitTime >= day && visitTime <= nextDay) {
          toDelete.push(visitTime);
        }
      }
      that.removeVisits(toDelete, callback);
    });
  },

  removeVisits: function (visitTimes, callback) {
    var length = visitTimes.length;
    for (var i = 0, visitTime; visitTime = visitTimes[i]; i++) {
      chrome.history.deleteRange({
        startTime: visitTime - 0.1,
        endTime: visitTime + 0.1
      }, function () {
        length--;
        if (length === 0) {
          callback();
        }
      });
    }              
  },*/
  
  filter: function (item) {
    var operators = memoizeKeys(this.filters);
    if (!operators.length) return true;
    for (var i=0; i < operators.length; i++) {  
      var res = Filters[operators[i]](item, this.filters[operators[i]]);
      if (!res) return false;
	  }
	  return true;
	}
};

var Filters = (function () {
  function isIn(prop) {
    return function (item, str) {
      return item[prop].toLowerCase().indexOf(str.toLowerCase()) > -1;
    }
  };
      
  return {
    intitle: isIn('title'),
    inurl: isIn('url'),
    site: function (item, str) {
      // amjad.a.com a.com
      var hostDomains = Util.getHostname(item.url).split('.'),
          // handle extra dots (e.g. .jo.).
          siteDomains = str.replace(/^\.*|\.*$/g, '').split('.');
      for (var i = siteDomains.length - 1, j = hostDomains.length - 1; j >= 0 && i >= 0; i--, j--) {
        if (hostDomains[j] !== siteDomains[i]) return false;
      }
      return true;
    }
  };
})();

return new EHistory;
})(jQuery);