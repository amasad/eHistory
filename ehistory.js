//constructor for ehistory
function EHistory(){
	this.count=0;
}


	
//Ehistory - Public: -------------------------------------------------------------
/**
 *public do
 *
*/
(function ($){
	var MAX = 2147483647;
	EHistory.prototype.doSearch = function(query, options) {//@FIXME make one argument
		this.settings = {
			'text': '',
			'startTime' : 0,
			'endTime' : (new Date).getTime(),
			'maxResults' : MAX,
			'regex': 0
		};
		var options = {};
		this.searchText_ = query;
		this.filters_ = [];
		this.resultsByDate = {};

		var s = takeAndReturn(this.settings, this.searchText_, (function(self){
			return function(place, key, value){
				if (key == 'regex'){
					self.settings[key] = value;
					return;
				}
				self.settings[key]=(new Date(value)).getTime();
			}
		})(this));

		this.strippedSearchText_ = this.initiateFilters_(s);

		$.extend(this.settings, {text: this.strippedSearchText_});
		if(options)
			$.extend(this.settings, options);

		var self = this;
		var searchSettings = {};
		$.extend(searchSettings, this.settings);
		//delete settings unrelavent to chrome history api
		delete searchSettings['regex'];
		function test(results){
			self.processResults_(results)
		}
		chrome.history.search(searchSettings,test);
	}

	EHistory.prototype.removeURLsOnOneDay = function (obj){
		var day,nextDay,
			self = this;
		for(var i = 0; i<obj.length; i+=2){
			day = new Date(new Date(obj[i] * 1000).toDateString()).getTime();	
			nextDay = day + 24 * 60 * 60 * 1000;
			for (var j = 0; j < obj[i+1].length; j++){
				chrome.history.getVisits({url:obj[i+1][j]}, function(visits){self.filterAndRemove_(visits,day,nextDay)});
			}
		}
		}
	//public static:
	EHistory.loadInLocalStorage = function(){
		var getVisits = function(results){
			for(var i=0; i < results.length; i++)
			{
				chrome.history.getVisits({url:results[i].url}, (function(res){return function(vis){storeVisit(vis, res);}})(results[i]));
			}
		};
		var storeVisit = function(visits, hitem){
			for (var i=0; i < visits.length; i++){
				$.extend(visits[i], hitem);
				localStorage[visits[i].visitId] = JSON.stringify(visits[i]); 
			}

		};
		chrome.history.search({
			text:'',
			startTime:0, 
			endTime: (new Date).getTime(),
			maxResults:MAX
			}, getVisits);
	}
		//chrome.history.deleteRange({startTime: time,
									//	endTime: time+0.1}, deleteComplete);

	//Ehistory - Private: -------------------------------------------------------------
	/**
	 *initiate filters_ from search query with filter functions 
	 *@param {String} q Search Text from the browser history form
	 *@returl {String} qString returns plain search text without the operators
	 */
	EHistory.prototype.initiateFilters_ = function(q){
		var qString = "";
		var reg = /^\w+:\S+$/;
		var words = q.split(' ');
		for (var i=0; i < words.length; i++){
			var oneWord = words[i];

			if (reg.test(oneWord)) {
				var method = oneWord.split(":")[0];
				if (Filters[method]){
					this.filters_.push({'func' : Filters[method], 'text' : oneWord.split(":")[1] });
					continue;
				}
			}
			qString+= " " + oneWord;
		}
		return trim(qString);
	}
	/**
	 * process the results return from the history api and call functions to filter and sendback to browser
	 *@param {HistoryItem[]} results return from history api
	 *
	 */
	EHistory.prototype.processResults_ = function(results){
		results = this.filterOutResults_(results);
		this.results_ = {};
		var self = this;
		for (var i = 0; i < results.length; i++){
			this.results_.length_ = i+1;
			this.results_[results[i].id] = results[i];
			chrome.history.getVisits({ url: results[i].url },function(visits){
					self.fixAndSendBack_(visits);
			});
		}
	}

	EHistory.prototype.filterOutResults_ = function(results){
		var results__ = [],
			add;
		for (var i=0; i < results.length; i++)
		{
			add = true;
			for (var j = 0; j < this.filters_.length; j++)
			{
				$.extend(results[i], this.settings);
				methodObject = this.filters_[j];
				if (!methodObject.func(results[i], methodObject.text))
					{
						add = false;
						break;
					}
			}
			if (add)
				results__.push(results[i]);
		}
		return results__;
	}

	EHistory.prototype.fixAndSendBack_ = function(visits){
		if (!visits || visits.length < 1) return;
		var historyItem = this.results_[visits[0].id],
			now,date,dif,difInDays,timeStr,dateStr,visitItem,finished,min;
			
		delete this.results_[visits[0].id];
		this.results_.length_--;
		if (!historyItem) return;

	    if (historyItem.title == "") 
			historyItem.title = historyItem.url;

		for(var i = 0; i < visits.length; i++){
			this.count++;
			visitItem = visits[i];
			visitItem.time = visitItem.visitTime /1000;
			visitItem.url = historyItem.url;
			visitItem.title = historyItem.title;
			now = new Date();
			date = new Date(visitItem.visitTime);
			dif = now.getTime() - date.getTime();
			difInDays = Math.floor(dif / 1000 / 60 / 60 / 24);
			timeStr = String(date.getHours() % 12);
			dateStr = "";

			if (timeStr.length < 2)
				timeStr = "0" + timeStr;
			
			min = String(date.getMinutes());
			timeStr += ":" + (min.length < 2 ? "0" + min : min); 
			timeStr += date.getHours() > 11 ? " P.M" : " A.M";
			//if (difInDays == 0) dateStr += "Today - ";
			//if (difInDays == 1) dateStr += "Yesterday - ";
			dateStr += date.toDateString();

			visitItem.dateRelativeDay = dateStr;
			visitItem.dateTimeOfDay = timeStr;
			visitItem.dateShort = date.toDateString();
			if (!this.resultsByDate[visitItem.dateRelativeDay])
				this.resultsByDate[visitItem.dateRelativeDay] = {};

			this.resultsByDate[visitItem.dateRelativeDay][historyItem.id] = visitItem;
		//	historyResult({'term': this.searchText_, 'finished': true}, [visitItem]);
		}

		if (this.results_.length_ == 0) this.sendBack_();
			
		finished = this.results_.length_ == 0 ? true : false;

	}

	EHistory.prototype.sendBack_ = function(){
		var finalResults = [];
		for (var i in this.resultsByDate){

			for(var j in this.resultsByDate[i])
			{
				//filter out out of date range visits
				if (this.resultsByDate[i][j].visitTime > this.settings.endTime || this.resultsByDate[i][j].visitTime < this.settings.startTime) continue;
				finalResults.push(this.resultsByDate[i][j]);
			}
		}
		finalResults.sort(function (a,b){
			if (a.visitTime > b.visitTime)
				return -1;
			return 1;
		});
		this.results_ = finalResults;
		historyResult({'term': this.searchText_, 'finished': true}, finalResults);
	}

	EHistory.prototype.filterAndRemove_ = function(visits, day, next){
		for (var i = 0, time; i < visits.length; i++){
			time = visits[i].visitTime;
			if (time > day && time < next){
				//a hack to delete one item, unless one can visit multiple urls in the same .1 milliseconds
				//chrome history system does not know any less.
				chrome.history.deleteRange({
					startTime: time-0.1,
					endTime: time+ 0.1
				}, $.noop);
			}
		}
		deleteComplete();
	}
	function trim(str){
		return str.replace(/^\s+|\s+$/g,'');
	}

	function parseUrl(url){
	      url = url.replace(/http(s)*:\/\//, "").replace(/:[0-9]+/,'');
	      hostName = url.split("/")[0];
	      path = url.replace(hostName+"/", "");
	      return {'hostName' : hostName, 'path' : path};	
	}
	
	takeAndReturn = function(pairs, query, callback){
		var words = query.split(' '),
			rString = "",
			oneWord, key, value;
			
		for (var i=0; i < words.length; i++){
			    oneWord = words[i];		
				key = oneWord.split(":")[0];
				value = oneWord.split(":")[1] || "";
				if (typeof pairs[key] !== "undefined"){
					callback(pairs[key], key, value);
					continue;
				}
			rString+= " " + oneWord;
		}
		return rString;
	}

	function isValidRegex(regex) {
	  try {
	    new RegExp(regex);
	  } catch (e) {
	    return false;
	  }
	  return true;
	}
	var Filters = {
		   //@todo think about upper/lower case
			'intitle': function(obj, txtMatch){
				var isRegex = obj.regex && obj.regex == "1" && isValidRegex(txtMatch);
				if (isRegex){
					return (new RegExp(txtMatch)).test(obj.title);
				}else{
					return (obj.title.toLowerCase().indexOf(txtMatch.toLowerCase()) > -1);
				}	
			},
		      'inurl': function(obj, txtMatch){
		          	var isRegex = obj.regex && obj.regex == "1" && isValidRegex(txtMatch);
					if (isRegex){
						return (new RegExp(txtMatch)).test(obj.url);
					}else{
						return (obj.url.toLowerCase().indexOf(txtMatch.toLowerCase()) > -1);
					}
		      },
		      'site' : function(obj, host){
		          var hostName = parseUrl(obj.url).hostName.split(".");
		          host = host.split(".");
		          //handle stuff like site:.jo or ..jo
		          for (var x in host)
		            if (host[x] == "") host.splice(x,1);
		          //j is where to start comparing in the hostname of the url in question
		          var j = hostName.length - host.length;
		          for(var i=0; i < host.length; i++)
		          {
		              //if j is undefined or doesn't equal the hostname to match return false 
		              if (!hostName[j] || hostName[j].toLowerCase() != host[i].toLowerCase())
		                  return false;
		              j++;
		          }
		          return true;
		      }
	};
})( jQuery );
