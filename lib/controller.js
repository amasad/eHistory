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
              .attr('checked',  $(this).is(':checked')).trigger('change');
    });

    var shiftDown = false;
    $(document).bind('keydown keyup', function (e) {
      shiftDown = e.shiftKey;
    });

    $resultsTable.delegate('.chk-entry', 'click', function () {
      if (shiftDown) {
        shiftClick($(this));
      }
    });

    var shiftClick = (function () {

      function getPath($firstChecked, dir, isChecked) {
        var $path = $();
        while ($firstChecked.length) {
          $firstChecked = $firstChecked[dir]();
          if (!$firstChecked.is('.entry')) {
            continue;
          } else if ((isChecked && $firstChecked.find(':checked').length) ||
              (!isChecked && !$firstChecked.find(':checked').length)) {
            break;
          } else {
            $path = $path.add($firstChecked);
          }
        }

        // If we reached the end and we're looking for checked boxes then
        // we haven't found any, however, if you we reached the end while
        // looking for checked boxes, we may have something.
        if ($firstChecked.length || !isChecked) {
          return $path;
        } else {
          return $();
        }
      }

      return function ($input) {
        var $row = $input.parents('tr');
        var isChecked = $input.is(':checked');
        // Go up until we find the first checked input
        var $path = getPath($row, 'prev', isChecked);
        // If we couldn't find anything going up then go down.
        if (!$path.length) {
          $path = getPath($row, 'next', isChecked);
        }
        $path.each(function (i, row) {
          if ($(row).is('.entry')) {
            $(row).find('input[type=checkbox]').attr('checked', isChecked);
          }
        });
      };

    })();

    // result item checkbox handler
    $resultsTable.delegate('.chk-entry', 'change', function () {
      var val =  $(this).attr('checked'),
          $row = $(this).parents('tr'),
          // decides what function to call, select/unselect
          fn = val ? $.proxy(historyModel.select, historyModel) : $.proxy(historyModel.unselect, historyModel);
      fn($row.data('id'),$row.data('day'));
    });

    $(document).delegate('.hdr-day, .entry', 'click', function (e) {
      if ($(e.target).is('input') || $(e.target).is('a')) return;
      var $input = $(this).find('input[type=checkbox]');
      $input
        .attr('checked', !$input.is(':checked'))
        .trigger('change');
      if (shiftDown) {
        shiftClick($input);
      }
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

      // If the user isn't searching then 'delete resutls' is the same
      // as 'clear history'.
      if (!settings.text) {
        $('.delete-menu .results').hide();
      } else {
        $('.delete-menu .results').show();
      }
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

    $('.delete.dropdown').click(function () {
      $(this).toggleClass('open');
      $(this).next().toggle($(this).is('.open'));
    });

    $('body').click(function (e) {
      if (!$(e.target).is('.delete.dropdown')
          && !$(e.target).closest('.delete.dropdown').length) {
        $('.delete-menu').hide();
        $('.delete.dropdown').removeClass('open');
      }
    });

    $('.delete-menu .selected').click(function () {
      if (confirm('Delete selected items?')) {
        historyModel.removeSelected();
      }
    });

    $('.delete-menu .results').click(function () {
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

    $resultsTable.delegate('a', 'click', function (e) {
      if ($(this).attr('href').match(/^file/)) {
        alert(
          'For security concerns we cannot open local files. ' +
          'You have to manually open the link by right clicking ' +
          'on it and selecting "Open Link in New Tab"'
        );
      }
    });

    var $menu = $('.options-menu');
    $menu.delegate('button', 'click', function () {
      var $row = $menu.data('row');
      if ($row) {
        if ($(this).is('.delete')) {
          historyModel.deleteItem($row.data('id'));
          $row.fadeOut('fast', function () {
            $row.remove();
          });
        } else if ($(this).is('.more')) {
          $query.val('site:' + historyModel.getDomain($row.data('id')));
          $('#frm-search').submit();
        }
      }
    });

    $resultsTable.delegate('.entry .options', 'click', function () {
      var $this = $(this);
      if (!$this.is('.open')) {
        var pos = $(this).offset();
        $('.options-menu')
        .css({
          left: pos.left,
          top: pos.top + $this.outerHeight()
        })
        .show()
        .data('row', $this.closest('tr'));
        $('.entry .options.open').removeClass('open');
        $this.addClass('open');
        $('body').bind('click.menu', function () {
          $menu.hide().data('id', null);
          $('body').unbind('.menu');
          $this.removeClass('open');
        });
      } else {
        $menu.hide().data('id', null);
        $(this).removeClass('open');
        $menu.hide();
      }
      return false;
    });

    // Focus query box by default.
    $query.focus();
  });

  $(function () {

    $(window).resize(function () {
      $('#div-main').css('height', $(window).height() - 85);
    }).resize();
    $('#frm-search').submit();
  });

})();
