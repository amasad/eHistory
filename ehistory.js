/*
Copyright (C) <2011> by Amjad Masad <amjad.masad@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
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

//methods
EHistory.prototype = {


  search: function (settings, filters, cb) {
    this.filterOffset = 0;
    this.pageOffset = 0;
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
    var that = this;
    if (Object.keys(this.filters).length){
      this.getFilteredPage(pageNo);
      return;
    }
    this.settings.maxResults = pageNo * this.pageSize;
    chrome.history.search(this.settings, function (res){
      res = res.slice(that.settings.maxResults - that.pageSize, that.settings.maxResults);
      if (res.length < that.pageSize) {
        $(that).trigger("finished");
        if (!res.length) {
          $(that).trigger("done");
          $(that).trigger("noResults");
        } else {
          that.getVisits(res);
        }     
      } else {
        $.when(that.fingerPrint(pageNo)).then(function(){
          that.getVisits(res);
        });
      }
    });
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


  fingerPrint: function (pageNo) {
    var dfd = new $.Deferred();
    var settings = $.extend(null, this.settings, {
      maxResults: pageNo * this.pageSize
    });
    var that = this;
    chrome.history.search(settings, function (res) {
      res = res.slice(settings.maxResults - that.pageSize, settings.maxResults);
      if (!res.length)
        $(that).trigger("finished");
      dfd.resolve();
    });
    return dfd.promise();
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
  
  getFilteredPage: function (pageNo ,cb) {
    var filtered = [];
    var settings = $.extend(null, this.settings);
    settings.maxResults = this.filterOffset + this._pageLimit(pageNo);
    var that = this;
    function triggerDone () {
      $(that).trigger("finished");
      $(that).trigger("done");
    }
    function search (left) {
      settings.maxResults += left;
      chrome.history.search(settings, function (result) {
        result = result.slice(settings.maxResults - (left || that.pageSize), settings.maxResults);
        if (result.length) {
          filtered = filtered.concat(that.filter(result));
        } else {
          triggerDone();
        }
        if (!result.length || filtered.length >= that.pageSize) {
          that.filterOffset = settings.maxResults - that._pageLimit(pageNo);
          if (!filtered.length) triggerDone();
          that.getVisits(filtered, cb); 
        } else {
          left = that.pageSize - filtered.length;
          search(left);
        }
      });
    }
    search(0);
  },
  
  _pageLimit: function (pageNo) {
    return pageNo * this.pageSize;            
  },
  filter: function (items) {
    var operators = Object.keys(this.filters);
    if (!operators.length) return items;
    for (var i = 0, item; item = items[i]; i++) {
      for (var j = 0; operators[j]; j++) {
        if (!Filters[operators[j]]({
          regex: this.filters.regex || 0,
          text: this.filters[operators[j]]
        }, item)) {
          items.splice(i--, 1);
          break;
        }
      }
    }
    return items;
  }

};
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