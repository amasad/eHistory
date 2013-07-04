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
(function ($) {
/************************ VIEW ************************/
// History View, responsible for populating results in the current page view
// Holds current page state, and updates page controls accordingly 
// Direct communication with history model
/** global **/
historyView = (function () {
  // Initial DOM (jQuery) variables 
  var $table,$olderPage, $newerPage, $firstPage, $lastPage, $allNav, $throbber, $pageNo;
  // Current page in the history view
  var currentPage = 0;
  var EHISTORY = "eHistory";
  var SUMMARY_PREFIX = "Search results for ";

  var templates = {
    'row': Mustache.compile("<tr class='entry'>"+
                              "<td><input type='checkbox'class='chk-entry'/></td>"+
                              "<td class='time'>{{{date}}}</td>"+
                              "<td><a href='{{url}}' style='background-image:url(chrome://favicon/{{url}})'>{{#title}}{{title}}{{/title}}{{^title}}{{url}}{{/title}}</a></td>"+
                            "</tr>"),
    'day-row': Mustache.compile("<tr class='hdr-day'><td><input type='checkbox' class='chk-day'/></td><td class='date' colspan='2'>{{date}}</td> </tr>")
  };

  //init
  //On domReady get the DOM elements
  $(function(){
    // Main table that holds results
    $table = $('#tbl-main');
    // Button responsible for getting older results, i.e. previous page
    $olderPage = $('#btn-older');
    // Button for getting newer results, i.e. next page
    $newerPage = $('#btn-newer');
    // Button for getting the first page
    $firstPage = $('#btn-first');
    // Button to get the last page
    $lastPage = $('#btn-last');
    // jQuery instance holding all the navigation controls
    $allNav = $olderPage.add($newerPage).add($firstPage).add($lastPage);
    $throbber = $('#throbber');
    $pageNo = $('#page-no');
    // Bind buttons functionalities
    $olderPage.click(function () {
      currentPage++;
      $(historyModel).trigger("modelrefresh");
    });
    $newerPage.click(function () {
      if (currentPage != 0) currentPage--;
      $(historyModel).trigger("modelrefresh");
    });
    $firstPage.click(function () {
      currentPage = 0;
      $(historyModel).trigger("modelrefresh"); 
    });
    // TODO: Implement
    $lastPage.click(function () { });
    // Navigation controls disabled onload
    $allNav.attr("disabled", true);
  });
  // when the view is on the first page disable first, newer buttons
  function updateControls () {
    $allNav.attr("disabled", false);
    if (currentPage === 0){
      $firstPage.add($newerPage).attr("disabled", true);
    }
  }
  // Listen to history model refresh event
  // and get the page required from the model
  $(historyModel).bind("modelrefresh", function (e, args) {
    updateControls();
    var page = this.getPage(currentPage);
    if (page === -1)  return;
    $pageNo.text(currentPage + 1);
    // results per day hash
    var results_day = {};
    $.each(page, function (i, visit) {
      if (!results_day[visit.day]) results_day[visit.day] = [];
      results_day[visit.day].push(visit);
    });
    // empty the view table
    $table.empty();
    // for each day create a day row (holds day info and a checkbox allows selection of all day items)
    $.each(results_day, function (day, items) {
      $(templates['day-row']({date: new Date(parseInt(day)).toDateString()})).appendTo($table);
      // on each day populate the results that corresponds to that day.
      $.each(items, function (i, visit) {
        var row = $(templates['row'](visit));
        // let the elem data hold info of the corrosponding visit
        row.data('id', visit.id);
        row.data('day', visit.day);
        // check if the current item to be populated was selected in earlier navigations
        if (historyModel.isSelected(visit.id, visit.day)) {
          row.children().children("input").attr("checked", true);
        }
        $table.append(row);
      });
    })
   
  });
  // listens for lastPage event from the historyModel update controls accordingly 
  $(historyModel).bind("lastPage", function (e, args) {
    $olderPage.add($lastPage).attr("disabled", true);
  });
  $(EHistory).bind("done", function (e, args) {
    $throbber.removeClass("active");
  });
  $(EHistory).bind("finished", function (e, args) {
    if ($table.is(':empty')) {
      $table.append('<tr class="no-results"><td colspan="3">No results :(</td></tr>');
    }
    $firstPage.add($newerPage).attr("disabled", false);
  });
   // Public functions
   return {
    clear: function () {
      currentPage = 0;
      $table.empty();
    },
    disableControls: function disableControls() {
      $allNav.attr("disabled", true);
    },
    displayThrobber: function () {
      $throbber.addClass("active");
    },
    setSummary: function (text) {
      var prefix = text ? SUMMARY_PREFIX : EHISTORY;
    }
  };
})();

$(function () {
  initialSearch();
});

})(jQuery);
