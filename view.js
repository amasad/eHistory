(function($){
/******** VIEW **********/
/** global */
historyView = (function(){
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
    console.log(page);
    if (page === -1)  return;
    var results_day = {};
    $.each(page, function (i, visit) {
      if (!results_day[visit.day]) results_day[visit.day] = [];
      results_day[visit.day].push(visit);
    });
 $table.empty();
    $.each(results_day, function (day, items) {
      $.tmpl('day-row', {date: new Date(parseInt(day)).toDateString()}).appendTo($table);
      $.each(items, function(i, visit){
        var row = $.tmpl('row', visit);
        row.data('id', visit.id);
        row.data('day', visit.day);
        if (historyModel.isSelected(visit.id, visit.day)) {
          row.children().children("input").attr("checked", true);
        }
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
