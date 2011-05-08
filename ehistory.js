/*
 * eHistory Chrome Extension
 * https://chrome.google.com/webstore/detail/hiiknjobjfknoghbeelhfilaaikffopb
 *
 * Copyright 2011, Amjad Masad
 * Dual licensed under the MIT license
 * https://github.com/amasad/eHistory/blob/master/LICENSE.txt
 *
 * Date: Mon May 9
 */
 
//EHistory container
var EHistory = (function($){
//CONSTANTS
var MAX = 2147483647;
//constructor
function EHistory(){/*fdsfsd*/}
// static methods

var dayStart = function (ts) {
  return new Date(new Date(parseInt(ts)).toDateString()).getTime();
};

var msDay = (24 * 60 * 60 * 1000);

var getNextDay = function (day) {
  day = dayStart(day);
  return day + msDay;
};

var getPrevDay = function (day) {
  day = dayStart(day);
  return day - msDay;
};

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
//methods
EHistory.prototype = {


  search: function (settings, filters, cb) {
    this.offset = 0;
    this.filters = filters;
    this.visits_day = new VisitsByDay();
    this.latestDay;
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
    var that = this;
    this.getPage(1); 
    //this.getFilteredPage(1);
  },


  getPage: function(pageNo, cb){ 
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
        } else if (filtered.length){
          if (filtered.length < that.pageSize) $(that).trigger("finished");
          that.getVisits(filtered, cb);
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
      for (var i = 0; i < items_length; i++){
        chrome.history.getVisits({url: items[i].url}, function (res_visits) { 
        items_length--;
        for(var j = 0; j < res_visits.length; j++){ 
          visitItem = res_visits[j];
          if (visitItem.visitTime > that.settings.endTime || 
                                                  visitItem.visitTime < that.settings.startTime) continue;
          visitItem.day = day = dayStart(visitItem.visitTime);
          visits_day.insert(visitItem);
        }
        
        if (items_length === 0){
          that.cb({
            items: items,
            visits: visits_day.sort().dequeue(that.pageSize)
          });
          $(that).trigger("done");
        }
      });
    }
  },

  deleteUrlOnDay: function (url, day, callback) {
    var nextDay = getNextDay(day);
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
  },
  
  filter: function (item) {
    var operators = getOperators(this.filters);
    if (!operators.length) return true;
    for (var i=0; i < operators.length; i++) {
      if (!Filters[operators[i]]({
        regex: this.filters.regex || 0,
        text: this.filters[operators[i]]
      }, item)) return false;
    }
    return true;
  }

};
var lastkeys;
var lastarg;
function getOperators(filters){
  if (lastarg===filters) {
    return lastkeys;
  } else {
    lastarg = filters;
    return lastkeys = Object.keys(filters);
  }
}
	function parseUrl(url){
	  url = url.replace(/http(s)*:\/\//, "").replace(/:[0-9]+/,'');
	  var hostName = url.split('/')[0]
	  return {
	    hostName: hostName,
	    path: url.replace(hostName + "/", "")
	  };
	}
	
	function isValidRegex(regex) {
	  var ret;
		try {
			ret = new RegExp(regex);
		} catch (e) {
			return false;
		}
		return ret;
	}
	
	var Filters = {
		//@todo think about upper/lower case
		'intitle': function(obj, item){
		  var regex = obj.regex && obj.regex == "1" && isValidRegex(obj.text);
			if (regex) { 
				return regex.test(item.title);
			} else {
				return (item.title.toLowerCase().indexOf(obj.text.toLowerCase()) > -1);
			}	
		},
		'inurl': function(obj, item){
			var regex = obj.regex && obj.regex == "1" && isValidRegex(obj.text);
			if (regex) {
				return (new RegExp(item.url)).test(obj.text);
			} else {
				return (item.url.toLowerCase().indexOf(obj.text.toLowerCase()) > -1);
			}
		},
		'site' : function(obj, item){
			var hostName = parseUrl(item.url).hostName.split("."),
				//handle stuff like site:.jo or ..jo
				host = $.map(obj.text.split('.'), function(v){return v || undefined;}),
				//j is where to start comparing in the hostname of the url in question
				j = hostName.length - host.length;
			for (var i=0; i < host.length; i++){	  
				//if j is undefined or doesn't equal the hostname to match return false 
				if (!hostName[j] || hostName[j].toLowerCase() != host[i].toLowerCase())
					return false;
				j++;
			}
			return true;
		}
	};
	 
return $.extend(new EHistory(), {
  getNextDay: getNextDay,
  dayStart: dayStart
});


})(jQuery);