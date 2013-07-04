/*
 * eHistory Chrome Extension
 * https://chrome.google.com/webstore/detail/hiiknjobjfknoghbeelhfilaaikffopb
 *
 * Copyright 2011, Amjad Masad
 * Licensed under the MIT license
 * https://github.com/amasad/eHistory/blob/master/LICENSE.txt
 *
 */
(function(){
  /* global parseQuery, historyModel, historyView, EHistory, confirm */
  'use strict';
  /* parseForm: Parses the html form into text format
   *    @arg (jQueryObject) $form: jQuery object containing the form element
   *    @returns (String) text query equivalent to the form
   * intitle:title inurl:url site:site startTime:startime endTime:endtime searchquery
   */
  function parseForm ($form) {
    var query = '',
        text = '';
    // loop over all input elements
    $form.find('input').each(function (i, elem) {
      elem = $(elem);
      if (elem.attr('id') === 'pure-text') {
        // just text
        text += elem.val();
      } else {
        // filter/setting
        query += elem.val() ?  ' ' + elem.data('settings-item') + ':' + elem.val() : '';
      }
    });
    // return filter/setting text format key:value followed by regular text
    return $.trim(query + ' ' + text);
  }

  // Check version number
  $(function() {
    $.getJSON('manifest.json', function (manifest) {
      var version = manifest.version;
      if (localStorage['version'] !== version) {
        localStorage.clear();
        localStorage['version'] = version;
        /* global console */
        console.log('Version Updated!');
      }
    });
  });

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

    $('.open-advanced').click(function () {
      var config = parseQuery($query.val());
      var operators = $.extend(config.settings, config.filters);
      $pnlAdvanced.find('input').each(function (i, elem) {
        elem = $(elem);
        if (elem.attr('id') === 'pure-text'){
          elem.val(config[2]);
        } else {
          // in the elements data contains type of settings/filter
          elem.val(operators[elem.data('settings-item')] || '');
        }
      });
    });

    // results day headers check-boxs handler
    $resultsTable.delegate('.chk-day', 'change', function () {
      // check all results until the next day header
      $(this).parents('tr').nextUntil('.hdr-day')
          .children(':nth-child(1)').children()
              .attr('checked',  $(this).attr('checked')).trigger('change');
    });

    // result item checkbox handler
    $resultsTable.delegate('.chk-entry', 'change', function () {
      var val =  $(this).attr('checked'),
          $row = $(this).parents('tr'),
          // decides what function to call, select/unselect
          fn = val ? $.proxy(historyModel.select, historyModel) : $.proxy(historyModel.unselect, historyModel);
      fn($row.data('id'),$row.data('day'));
    });

    // Update the main search box whenever advanced settings are changed.
    var updateMainSearchBox = function () {
      // Delay until the keypress is handled by the browser.
      setTimeout(function() {
        $query.val(parseForm($pnlAdvanced) || '');
      }, 0);
    };

    $('input', $pnlAdvanced).change(updateMainSearchBox)
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
      var settings = config.settings,
          filters = config.filters;

      historyView.displayThrobber();

        EHistory.search({
          text: settings.text || '',
          startTime: new Date(settings.startTime || 0).getTime() ,
          endTime: new Date(settings.endTime || Date.now()).getTime(),
          maxResults: historyModel.pageSize
        }, filters, function(results){
          historyModel.append(results);
        });
    }

    // form submit handler
    $('#frm-search').submit(function (e) {
      var text;
      e.preventDefault();
      //clear everything
      historyModel.clear();
      historyView.clear();
      historyView.disableControls();

      if ($pnlAdvanced.is(':visible')){
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

    $('.delete.selected').click(function () {
      if (confirm('Delete selected items?')) {
        historyModel.removeSelected();
      }
    });

    $('.delete.results').click(function () {
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

    $(document).delegate('.hdr-day, .entry', 'click', function (e) {
      if ($(e.target).is('input')) return;
      $(this).find('input[type=checkbox]').click();
    });

    // Focus query box by default.
    $query.focus();
  });

  $(function () {

    $(window).resize(function () {
      $('#div-main').css('height', $(window).height() - 85 - 45);
    }).resize();
    $('#frm-search').submit();
  });

})();
