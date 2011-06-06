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
  var $pnlAdvanced = $('#pnl-advanced');
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

  // advanced search checkbox handler
  $("#chk-advanced").click(function () {
    var $this = $(this);
    // if the panel is visible enable searchbox
    // parse the panel's form to fill searchbox
    // otherwise disable searchbox and and fill form
    if ($pnlAdvanced.is(":visible")) {
      fillText(parseForm($pnlAdvanced));
      $query.attr("disabled", false).focus();
      $query.focus();
    } else {
      fillForm(parseQuery($query.val()));
      $query.attr("disabled", true);
      // Focus the normal text filter once it appears.
      setTimeout(function() { $('#pure-text').focus(); }, 0);
    }
    // toggle visibility
    $pnlAdvanced.slideToggle('fast');
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

  // show url checkbox handler
  // loop over all entries and swap href with title
  // title saved in the data
  $('#show-url input').change(function () {
    var link,
        $entries = $('.entry a');
    if ($(this).attr('checked')) {
      $entries.each(function () {
        var $this = $(this),
            title = $this.text();
        if (!$this.data('title')) {
          $this.data('title', title);
        }
        $this.text($this.attr('href'));
      });
    } else {
      $entries.each(function () {
        var $this = $(this);
        $this.text($this.data('title'));
      });
    }
  });

  // instantiate date pickers
  $('#date-frm').datepicker();
  $('#date-to').datepicker();
  // static overlay element
  var $overLay = $('<div class="ui-widget-overlay" style="width: 1423px;'
                  +'height: 3802px; z-index: 1001;"><div class="throbb"></div></div>');
  // confirms with the user and proceeds according to which edit button was pressed
  // msg is found in the event data "OK" handler and message to show in the confirm box
  var confirmAndProgress = function (e) {
    $("#dialog-confirm").dialog({
      title: e.data.msg,
      resizable: false,
      modal: true,
      buttons: {
        "Delete items": function() {
          $(this).dialog("close");
          progress();
          (e.data.ok || $.noop)();
        },
        Cancel: function() {
          $(this).dialog("close");
        }
      }
    });
  };
  // shows the overlay and throbber
  var progress = function (e) {
    $overLay.appendTo('body').show();
  };
  // edit buttons handlers
  // sends msg and OK handler in the event data

  $('#btn-clear-history').click({
     msg: "Delete all items from history?",
     ok: $.proxy(historyModel.clearHistory, historyModel)
  }, confirmAndProgress);

  $("#btn-delete-selected").click({
    msg: "Delete selected items?",
    ok: $.proxy(historyModel.removeSelected, historyModel)
  }, confirmAndProgress);

  $('#btn-delete-all').click({
    msg: "Delete all search results?",
    ok: $.proxy(historyModel.clearResults, historyModel)
  }, confirmAndProgress);

  // Focus query box by default.
  $query.focus();
});

})(jQuery);
