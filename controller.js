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

(function($){
/** Global **/
initialSearch = function () {
  $('#frm-search').submit();
};
/******** Utils **********/
/*  parseQuery:  Parses the search query
 *      @arg (String) input: The search query
 *      @returns (Array) [settings, filters, text]
 */
function parseQuery (input) {
  // assumes search query is a space delimted key/value pairs
  var options = (input.split(/\s/));
  // initiate possible filters to null
  var filters = {
    inurl: null,
    intitle: null,
    site: null
  };
  // initiate possible settings in query
  var searchSettings = {
    startTime: null,
    endTime: null,
    text: ""
  };
  // text types
  var pureText = "", combined = "";

  // loop each pair in the query string
  $.each(options, function (i, pair) {
    if (!pair) return;
    // assume key:value
    pair = pair.split(":");
    searchSettings[pair[0]] !== undefined ?
        // pair is a search setting type
        searchSettings[pair[0]] = pair[1] :
        // pair is a filter type
        filters[pair[0]] !== undefined ?
            combined += " " + (filters[pair[0]] = pair[1]) :
            combined += " " + (pair[1] || pair[0] || "");
    // pair is is just text
    if (!pair[1]) pureText += " " + pair[0];
  });
  searchSettings.text = $.trim(combined);
  // delete all empty filters
  for (var prop in filters) {
    if (filters[prop] === null) {
      delete filters[prop];
    }
  }
  return [
    searchSettings,
    filters,
    $.trim(pureText)
  ];
}

/* parseForm: Parses the html form into text format
 *    @arg (jQueryObject) $form: jQuery object containing the form element
 *    @returns (String) text query equivalent to the form
 * intitle:title inurl:url site:site startTime:startime endTime:endtime searchquery
 */
function parseForm ($form) {
  var query = "",
      text = "";
  // loop over all input elements
  $form.find('input').each(function (i, elem) {
    elem = $(elem);
    if (elem.attr("id") == "pure-text") {
      // just text
      text += elem.val();
    } else {
      // filter/setting
      query += elem.val() ?  " " + elem.data("settings-item") + ":" + elem.val() : "";
    }
  });
  // return filter/setting text format key:value followed by regular text
  return $.trim(query + " " + text);
}

// Check version number
$(function() {
  var manifest = JSON.parse($.ajax({
          url: 'manifest.json',
          async: false
        }).responseText || '{}');
  var version = manifest.version;
  if (localStorage['version'] != version) {
    $('#version-updated').show("slow");
    localStorage.clear();
    localStorage['version'] = version;
  }

  setTimeout(function () {
    $('#version-updated').hide("slow");
  }, 5000);
})
/*************** Controller  ***************/
/*  Collection of functions and event handlers
 *    Interacts with UI, historyModel and historyView
 */
$(function(){
  // DOM ready
  // search box
  var $query = $('#query');
  // advanced search form
  var $pnlAdvanced = $('.advanced-search');
  // history items table
  var $resultsTable = $('#tbl-main');

  // fill the advanced search form with parsed filter/settings values
  function fillForm (config) {
    // merge all types of key value pairs
    var operators = $.extend(config[0], config[1]);
    // loop over the form input and fill them with values
    $pnlAdvanced.find('input').each(function (i, elem) {
      elem = $(elem);
      if (elem.attr('id') == "pure-text"){
        elem.val(config[2]);
      } else {
        // in the elements data contains type of settings/filter
        elem.val(operators[elem.data("settings-item")] || "");
      }
    });
  }

  // fills the search box
  function fillText (text) {
    $query.val(text || "");
  }

  // results day headers check-boxs handler
  $resultsTable.delegate(".chk-day", "change", function () {
    // check all results until the next day header
    $(this).parents('tr').nextUntil('.hdr-day')
        .children(':nth-child(1)').children()
            .attr("checked",  $(this).attr("checked")).trigger("change");
  });

  // result item checkbox handler
  $resultsTable.delegate(".chk-entry", "change", function () {
    var val =  $(this).attr("checked"),
        $row = $(this).parents("tr"),
        // decides what function to call, select/unselect
        fn = val ? $.proxy(historyModel.select, historyModel) : $.proxy(historyModel.unselect, historyModel);
    fn($row.data("id"),$row.data("day"));
  });

  // Update the main search box whenever advanced settings are changed.
  var updateMainSearchBox = function () {
    // Delay until the keypress is handled by the browser.
    setTimeout(function() { fillText(parseForm($pnlAdvanced)); }, 0);
  };
  $("input", $pnlAdvanced).change(updateMainSearchBox)
                          .keypress(updateMainSearchBox)
                          .keydown(updateMainSearchBox);

  $('body').bind('click', function (e) {
    if ($(e.srcElement).parents('.advanced-search').length) return;
    $('.open-advanced').show();
    $('.advanced-search').hide();
  });
  $('.open-advanced').click(function () {
    $('.advanced-search').show();
    $('.open-advanced').hide();
    return false;
  });

  // called to initiate the search
  function search(config) {
    var settings = config[0],
        filters = config[1],
        text = config[2];

    historyView.displayThrobber();
    historyView.setSummary(settings.text || "");

      EHistory.search({
        text: settings.text || "",
        startTime: new Date(settings.startTime || 0).getTime() ,
        endTime: new Date(settings.endTime || Date.now()).getTime(),
        maxResults: historyModel.pageSize
      }, filters, function(results){
        historyModel.append(results);
      });
  }

  // form submit handler
  $('#frm-search').submit( function (e) {
    var text;
    e.preventDefault();
    //clear everything
    historyModel.clear();
    historyView.clear();
    historyView.disableControls();

    if ($pnlAdvanced.is(":visible")){
      text = parseForm($pnlAdvanced);
      search(parseQuery(text));
    } else {
      search(parseQuery($query.val()));
    }
    //return false;
  });

  $('#btn-clear-history').click(function () {
    if (confirm('Delete all items from history?')) {
      historyModel.clearHistory();
    }
  });

  $("#btn-delete-selected").click(function () {
    if (confirm('Delete selected items?')) {
      historyModel.removeSelected();
    }
  });

  $('#btn-delete-all').click(function () {
    if (confirm('Delete all search results?')) {
      historyModel.clearResults();
    }
  });

  $('.query').focus(function () {
    $('.query-wrapper').addClass('active');
  });
  $('.query').blur(function () {
    $('.query-wrapper').removeClass('active');
  });
  // Focus query box by default.
  $query.focus();
});

$(function () {

  $(window).resize(function () {
    console.log($(window).height() - 85 - 45)
    $('#div-main').css('height', $(window).height() - 85 - 45);
  }).resize();

});
})(jQuery);
