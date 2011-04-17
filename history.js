(function($){

/******** Utils **********/
function getPrevDay(day){
  day = new Date(new Date(day).toDateString()).getTime();
  day -= (24 * 60 * 60 * 1000);
  return day;
 }
  
//bind submist
$(function(){
  var $query = $('#query');
  $('#frm-search').submit(function(){
    historyModel.clear();
    historyView.clear();
    EHistory.search($query.val(), 150, function(results){
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
  function HistoryModel(){}
  HistoryModel.prototype = {

    append: function(data){
      var visits= data.visits;
      var items = data.items;
      var item_map = {};
        for (var j = 0, item; item = data.items[j]; j++){
        item_map[item.id] = item;
      }
      for (var i = 0, visit; visit = data.visits[i]; i++){ 
        var resultItem = $.extend(null,item_map[visit.id]);
        resultItem.visitTime = visit.visitTime;
        //fix dates and shit
        resultItem.date = new Date(visit.visitTime);
        results.push(resultItem);
      };
      $(this).trigger("modelrefresh");
    },
    getPage: function (page) {
      page++;
      var uBound = page * pageSize;
      var lBound = uBound - pageSize;
      if (results.length < uBound && !finished){
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
    
    });
    $lastPage.click(function (){
    
    });

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

  return {
    clear: function () {
      currentPage = 0;
    }
  };
})();

$(function(){
  
});

})(jQuery);
