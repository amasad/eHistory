(function ($){
/******** MODEL **********/
/*global*/
historyModel = (function(){
 
  var results = [];
  var visits = {};
  var historyItems = {};
  var searchQuery = "";
  var finished = false;
  var selected = {};
  function HistoryModel(){
    this.item_map = {};
    this.pageSize = 150;
  }
  HistoryModel.prototype = {
    append: function (data) {
             
      var visits= data.visits;
      var items = data.items;
      var item_map = this.item_map;
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
      var pageSize = this.pageSize;
      page++;
      var uBound = page * pageSize;
      var lBound = uBound - pageSize;
      if (results.length < uBound && !finished){
        // TODO combine into one function call
        historyView.disableControls();
        historyView.displayThrobber();
        EHistory.getPage(page,$.proxy(this.append, this));
        return -1;
      }
      var ret = results.slice(lBound, lBound + pageSize);
      if (ret.length < pageSize) {
        $(this).trigger("lastPage");
      }
      return ret;
    },
    
    select: function (id, day, elem) {
      if (!selected[day]) selected[day] = [];
      this.item_map.elem = elem;
      selected[day].push(this.item_map[id]);
    },
    
    unselect: function (id, day) {
      if (!selected[day]) return;
      selected[day].splice(selected[day].indexOf(this.item_map[id]), 1);  
    },
    
    isSelected: function (id, day) {
      if (!selected[day]) return;
      return selected[day].indexOf(this.item_map[id]) > -1
    },

    removeSelected: function () {
      var days = Object.keys(selected);
      for (var i = 0, day; day = days[i]; i++) {
        for (var j = 0, item; item = selected[day][j]; j++)
          EHistory.deleteUrlOnDay(item.url, day, function () {
            window.location.reload();
          });
      }
            
    },
     
    clear: function(){
     results = [];
     visits = {};
     historyItems = {};
     searchQuery = "";
     finished = false;
     lastDay = 0;
     selected = {};
     this.item_map = {};
    }
  };

  $(EHistory).bind("finished", function (e, args) {
    finished = true;
  });

  var historyModel = new HistoryModel(); 
  return historyModel;
})();

})(jQuery);
