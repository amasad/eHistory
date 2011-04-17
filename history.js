(function($){

/******** Utils **********/
function getPrevDay(day){
  day = new Date(new Date(day).toDateString()).getTime();
  day -= (24 * 60 * 60 * 1000);
  return day;
 }
  
//bind submit
$(function(){
  var $query = $('#query');
  console.log($);
  $('#frm-search').submit(function(){
    historyModel.clear();
    EHistory.search($query.val(), function(results){
      historyModel.append(results);
    });

    return false;
  });

  //templates
  $.template("row", "<tr><td>${date}-----</td><td>{{if title}} ${title} {{else}} ${url} {{/if}} </td><td></td></tr>")
});


/******** MODEL **********/
var historyModel = (function(){
 
  var results = [];
  var visits = {};
  var historyItems = {};
  var pageSize = 150;
  var searchQuery = "";
  var finished = false;
  var lastDay;
  function HistoryModel(){}
  HistoryModel.prototype = {

    append: function(data){
      if (!data.items.length){
        lastDay = getPrevDay(lastDay);
        $(this).trigger("modelrefresh");
        return;
      }
      var visits= data.visits;
      var items = data.items;
      for (var i = 0; item = items[i]; i++){ 
        var resultItem = item;
        var tmp =  visits[item.id];
        resultItem.visitTime =tmp.visitTime;
        //fix dates and shit
        resultItem.date = new Date(tmp.visitTime);
        results.push(resultItem);
      };
      lastDay = results[results.length - 1].visitTime;
      $(this).trigger("modelrefresh");
    },
    getPage: function(x){
      x++;
      var uBound = x * pageSize;
      var lBound = uBound - pageSize;
      var prevDay;
      if (results.length < uBound && !finished){
        prevDay = getPrevDay(lastDay);
        EHistory.getDay(prevDay, $.proxy(this.append, this));
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
  function HistoryView(){}
 // Public methods

  var resetControls = function () {
      $allNav.attr("disabled", false);
  };
    
  var updateControls = function () {
      if (currentPage === 0){
        $newerPage.add($firstPage).attr("disabled", true);
      }
  };
  
  var historyView = new HistoryView(),
    $table,$olderPage, $newerPage, $firstPage, $lastPage, $allNav;
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
    
    });
    $lastPage.click(function (){
    
    });

  });

   $(historyModel).bind("modelrefresh", function(e, args){
    var page = this.getPage(currentPage);
    if (page === -1)
      return;
    $table.empty();
    $.each(page, function(i, visit){
      var row = $.tmpl('row', visit);
      row.data('hid', visit.id);
      $table.append(row);
    });
  });
  
  $(historyModel).bind("lastPage", function(e, args){
    $olderPage.add($lastPage).attr("disabled", true);
  });

  return historyView;
})();

$(function(){
  
});

})(jQuery);
