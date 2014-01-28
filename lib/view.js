/*
 * eHistory Chrome Extension
 * https://chrome.google.com/webstore/detail/hiiknjobjfknoghbeelhfilaaikffopb
 *
 * Copyright 2011, Amjad Masad
 * Licensed under the MIT license
 * https://github.com/amasad/eHistory/blob/master/LICENSE.txt
 *
 */
(function () {
  /* global Mustache, historyModel, EHistory, Spinner */
  'use strict';
  // History View: responsible for populating results in the current page view
  // Holds current page state, and updates page controls accordingly
  // Direct communication with history model.
  // @exports historyView
  this.historyView = (function () {
    // Initial DOM (jQuery) variables
    var $table, $olderPage, $newerPage, $allNav, $throbber, $pageNo, $divMain;
    // Current page in the history view
    var currentPage = 0;

    var templates = {
      'row': Mustache.compile($('#tmpl-entry-row').html().trim()),
      'day-row': Mustache.compile($('#tmpl-day-row').html().trim())
    };

    var spinner = new Spinner({
      lines: 13, // The number of lines to draw
      length: 10, // The length of each line
      width: 2, // The line thickness
      radius: 10, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#333', // #rgb or #rrggbb or array of colors
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: true, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: '0', // Top position relative to parent in px
      left: 'auto' // Left position relative to parent in px
    });

    //init
    //On domReady get the DOM elements
    $(function(){
      // Main table that holds results
      $table = $('#tbl-main');
      // Button responsible for getting older results, i.e. previous page
      $olderPage = $('.next-page');
      // Button for getting newer results, i.e. next page
      $newerPage = $('.prev-page');
      // jQuery instance holding all the navigation controls
      $allNav = $olderPage.add($newerPage);
      $throbber = $('#throbber');
      $pageNo = $('.page-no');
      // Division that holds the scroll value for the overflow
      $divMain = $('#div-main');
      // Scroll to top of results
      function navTop(){
        $divMain.animate({
          scrollTop: $divMain.position().top
        }, 'slow');
      }
      // Bind buttons functionalities
      $olderPage.click(function () {
        currentPage++;
        $(historyModel).trigger('modelrefresh');
        navTop();
      });
      $newerPage.click(function () {
        if (currentPage !== 0) currentPage--;
        $(historyModel).trigger('modelrefresh');
        navTop();
      });
      // Navigation controls disabled onload
      $allNav.attr('disabled', true);
    });
    // when the view is on the first page disable first, newer buttons
    function updateControls () {
      $allNav.attr('disabled', false);
      if (currentPage === 0){
        $newerPage.attr('disabled', true);
      }
    }
    // Listen to history model refresh event
    // and get the page required from the model
    $(historyModel).bind('modelrefresh', function () {
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
        $(templates['day-row']({date: new Date(parseInt(day, 10)).toDateString()})).appendTo($table);
        // on each day populate the results that corresponds to that day.
        $.each(items, function (i, visit) {
          var row = $(templates['row'](visit));
          // let the elem data hold info of the corrosponding visit
          row.data('id', visit.id);
          row.data('day', visit.day);
          // check if the current item to be populated was selected in earlier navigations
          if (historyModel.isSelected(visit.id, visit.day)) {
            row.children().children('input').attr('checked', true);
          }
          $table.append(row);
        });
      });
    });
    // listens for lastPage event from the historyModel update controls accordingly
    $(historyModel).bind('lastPage', function () {
      $olderPage.attr('disabled', true);
    });
    $(EHistory).bind('done', function () {
      $throbber.removeClass('active');
    });
    $(EHistory).bind('finished', function () {
      if ($table.is(':empty')) {
        $table.append('<tr class="no-results"><td colspan="3">No results :(</td></tr>');
      }
      $newerPage.attr('disabled', false);
    });
     // Public functions
     return {
      clear: function () {
        currentPage = 0;
        $table.empty();
      },
      disableControls: function disableControls() {
        $allNav.attr('disabled', true);
      },
      displayThrobber: function () {
        $throbber.addClass('active');
        spinner.spin($throbber[0]);
      }
    };
  })();

}).call(this);
