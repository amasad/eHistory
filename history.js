(function($){

/******** Utils **********/
function getPrevDay(day){
  day = new Date(new Date(day).toDateString()).getTime();
  day -= (24 * 60 * 60 * 1000);
  return day;
 }
function parseQuery (input, callback) {
  var options = (input.split(/\s/)),
      filters = {},
      searchSettings = {
        startTime: null,
        endTime: null,
        text: ""
      };

  $.each(options, function (i, pair) {
    pair = pair.split(":");
    if (pair.length === 1)  searchSettings.text += " " + pair[0];
    searchSettings[pair[0]] !== undefined ? searchSettings[pair[0]] = pair[1] :
      filters[pair[0]] = pair[1];
  });
  searchSettings.text = $.trim(searchSettings.text);
  callback({
    searchSettings: searchSettings,
    filters: filters  
  });
}

function parseForm ($form, callback) {
  var query = "",
      text = "";
  $form.children('input').each(function (i, elem) {
    elem = $(elem);
    if (elem.data("settings-item") === "text") {
      text += elem.val();
      return;
    }
    query += elem.val() ?  " " + elem.data("settings-item") + ":" + elem.val() : "";
  });
  callback($.trim(query + " " + text));
}

//Controller
$(function(){
  var $query = $('#query'),
      $form = $('form'),
      $pnlAdvanced = $('#pnl-advanced'); 

  function fillForm (config) {
    config = $.extend(config.searchSettings, config.filters);
    $pnlAdvanced.children('input').each(function (i, elem) {
      elem = $(elem);
      elem.val(config[elem.data("settings-item")] || "");
    });
  }
  function fillText (text) {
    $query.val(text || "");
  }

  $("#chk-advanced").click(function(){
      $this = $(this);
			if ($pnlAdvanced.is(":visible")){
				parseForm($pnlAdvanced, fillText);
			}else{
				parseQuery($query.val(), fillForm);
			}
			$pnlAdvanced.toggle();
		//	options.toggle();	
		});
  
  function search(config) {
    var settings = config.searchSettings,
             filters = config.filters;

    EHistory.search({
      text: settings.text || "",
      startTime: new Date(settings.startTime || 0).getTime() ,
      endTime: new Date(settings.endTime || Date.now()).getTime()
    }, 150, function(results){
      historyModel.append(results);
    });
  }

  $('#frm-search').submit(function(){
    historyModel.clear();
    historyView.clear();
    historyView.disableControls();
    if ($form.is(":visible")){
      parseForm($pnlAdvanced, function (text) {
        parseQuery(text, search);
      });
    } else {
      parseQuery($query.val(), search);
    }
    return false;
  });
 
  $('#date-frm').datepicker();
  $('#date-to').datepicker();
  //templates
  $.template("row", "<tr>"+
                      "<td><input type='checkbox'/></td>"+
                      "<td>${date}</td>"+
                      "<td>{{if title}} ${title} {{else}} ${url} {{/if}}</td>"+
                    "</tr>");
  $.template("day-row", "<tr><td><input type='checkbox'/></td><td>${date}</td> </tr>");
});


/******** MODEL **********/
var historyModel = (function(){
 
  var results = [];
  var visits = {};
  var historyItems = {};
  var pageSize = 150;
  var searchQuery = "";
  var finished = false;
  function HistoryModel(){}
  HistoryModel.prototype = {
    append: function (data) {
      var visits= data.visits;
      var items = data.items;
      var item_map = {};
      for (var j = 0, item; item = data.items[j]; j++){
        item_map[item.id] = item;
      }
      var visit, resultItem, timeStr, hours, which;
      for (var i = 0; visit = data.visits[i]; i++){ 
        resultItem = $.extend(null,item_map[visit.id]);
        resultItem.visitTime = visit.visitTime;
        resultItem.day = visit.day;
        //fix dates and shit
        timeStr = new Date(visit.visitTime).toLocaleTimeString().substr(0, 5);
        hours = parseInt(timeStr.split(":")[0]);
        which = "&nbsp;AM";
        if (hours > 12) {
          hours = hours % 12;
          which = "&nbsp;PM";
        } else if (hours == 0) {
          hours = 12;
        }
        timeStr = hours + ":" + timeStr.split(":")[1] + which;
        resultItem.date = timeStr;
        results.push(resultItem);
      };
      $(this).trigger("modelrefresh");
    },

    getPage: function (page) {
      page++;
      var uBound = page * pageSize;
      var lBound = uBound - pageSize;
      if (results.length < uBound && !finished){
        historyView.disableControls();
        EHistory.getPage(page,$.proxy(this.append, this));
        return -1;
      }
      var ret = results.slice(lBound, lBound + pageSize);
      if (ret.length < pageSize) {
        $(this).trigger("lastPage");
      }
      return ret;
    },
    
    clear: function(){
     results = [];
     visits = {};
     historyItems = {};
     searchQuery = "";
     finished = false;
     lastDay = 0;
    }
  };

  $(EHistory).bind("finished", function (e, args) {
    finished = true;
  });

  var historyModel = new HistoryModel(); 
  return historyModel;
})();

/******** VIEW **********/
var historyView = (function(){
  var $table,$olderPage, $newerPage, $firstPage, $lastPage, $allNav;
  var currentPage = 0;
  //init
  $(function(){
    $table = $('#tbl-main');
    $olderPage = $('#btn-older');
    $newerPage = $('#btn-newer');
    $firstPage = $('#btn-first');
    $lastPage = $('#btn-last');
    $allNav = $olderPage.add($newerPage).add($firstPage).add($lastPage);

    $olderPage.click(function (){
      currentPage++;
      $(historyModel).trigger("modelrefresh");
    });
    $newerPage.click(function (){
      if (currentPage != 0) currentPage--;
      $(historyModel).trigger("modelrefresh");
    });
    $firstPage.click(function (){
      currentPage = 0;
      $(historyModel).trigger("modelrefresh"); 
    });
    $lastPage.click(function (){
      
    });
    $allNav.attr("disabled", true);
  });

  function updateControls(){
    $allNav.attr("disabled", false);
    if (currentPage === 0){
      $firstPage.add($newerPage).attr("disabled", true);
    }
  }
  $(historyModel).bind("modelrefresh", function(e, args){
    updateControls();
    var page = this.getPage(currentPage);
    if (page === -1)  return;
    var results_day = {};
    $.each(page, function (i, visit) {
      if (!results_day[visit.day]) results_day[visit.day] = [];
      results_day[visit.day].push(visit);
    });
 $table.empty();
    $.each(results_day, function (day, items) {
      console.log(items);
      console.log($.tmpl('day-row', {date: new Date(parseInt(day))}).appendTo($table));
      $.each(items, function(i, visit){
        var row = $.tmpl('row', visit);
        row.data('hid', visit.id);
        $table.append(row);
      });
    })
   
  });
  
  $(historyModel).bind("lastPage", function(e, args){
    $olderPage.add($lastPage).attr("disabled", true);
  });

  return {
    clear: function () {
      currentPage = 0;
    },
    disableControls: function () {
      $allNav.attr("disabled", true);
    }
  };
})();

$(function(){
  
});

})(jQuery);
