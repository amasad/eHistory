/*
 * eHistory Chrome Extension
 * https://chrome.google.com/webstore/detail/hiiknjobjfknoghbeelhfilaaikffopb
 *
 * Copyright 2011, Amjad Masad
 * Licensed under the MIT license
 * https://github.com/amasad/eHistory/blob/master/LICENSE.txt
 *
 */

 /* Cleanup TODO:
  * Why the hell was I mixing module pattern and classes?
  * refactor append.
  * remove reference to view!
  */

(function (){
  'use strict';
  /* global EHistory, historyView, chrome, alert */
  // Holds the current history search state, direct communication with the EHistory library.
  // Eventsource, triggers:
  //                       'modelreferesh': when new items are appended to the model.
  //                       'lastPage': when there is no more items.
  this.historyModel = (function(){
    // Private variables
    // results, holding all the current results available
    var results = [];
    // boolean stating whether the EHistory system has delivered all of the current query results
    var finished = false;
    // hash holding all the selected items for deletion
    // key: Timestamp for day, value: Array of history Items
    // TODO: Make at an array of ids
    var selected = {};
    var prevPage = -1;
    // Constructor for History Model Singleton
    function HistoryModel(){
      // hash of items, Key: id, Value: Item
      this.item_map = {};
      // Current results per page
      this.pageSize = 150;
    }
    // Receives data from the EHistory and appends the results to the current model
    // Used as a callback for the EHistory to be called when the search is done
    //    @arg data: hash containing:
    //                 items: history Items
    //                 visits: visits found corresponding to history items.
    HistoryModel.prototype = {
      append: function (data) {
        var item_map = this.item_map;
        // Populate the item_map hash with items coming from EHistory
        for (var j = 0, item; item = data.items[j]; j++){
          item_map[item.id] = item;
        }
        var visit, resultItem, timeStr, hours, which;
        for (var i = 0; visit = data.visits[i]; i++){
          // Create a 'resultItem' that will contain all the information about the visit
          resultItem = Object.create(item_map[visit.id]);
          resultItem.visitTime = visit.visitTime || 0;
          resultItem.day = visit.day || 0;

          timeStr = new Date(visit.visitTime).toLocaleTimeString();
          // If we know the format of the locale time string then we'll try to
          // end up with HH:MM [PERIOD] otherwise we'll just use it as is.
          if (/^\d{1,2}:\d{1,2}:\d{1,2}\s[AP]M$/.test(timeStr)) {
            var parts = timeStr.split(':');
            var period = parts.pop().substr(-2);
            resultItem.date = parts.join(':') + '&nbsp;' + period;
          } else {
            resultItem.date = timeStr;
          }

          resultItem.domain = Util.getHostname(resultItem.url)

          results.push(resultItem);
        }
        // Trigger an event stating that the model has new additions
        $(this).trigger('modelrefresh');
      },
      // Gives model results according to the page number requested
      // if the page requested was not found, the model will make a new page request
      // to the EHistory system requesting a new page, and returns -1 to the caller
      // stating that there is no result to be found.
      //     @arg page: # of the page requested
      getPage: function (page) {
        var pageSize = this.pageSize;
        // pages don't start from index 0
        page++;
        var uBound = page * pageSize;
        var lBound = uBound - pageSize;
        // check if the results requested are available and the EHistory has not finished
        // if not request from EHistory
        var ret = results.slice(lBound, lBound + pageSize);
        if (results.length < uBound && !finished){
          if (page === prevPage)
            return ret;
          prevPage = page;
          // TODO combine into one function call
          historyView.disableControls();
          historyView.displayThrobber();
          EHistory.getPage(page,$.proxy(this.append, this));
          return -1;
        }
        // TODO: Verify the following
        // if only some of the results found then make others know this is the last page.
        if (ret.length < pageSize) {
          $(this).trigger('lastPage');
        }
        return ret;
      },
      // called to make sure that a current item in a current day is to be deleted
      //     @arg id: item id
      //     @arg day: the day where the item was selected
      //     @arg elem: the DOM elem, row corresponding to the item.
      // TODO: Is elem necessary? 
      select: function (id, day, elem) {
        if (!selected[day]) selected[day] = [];
        this.item_map.elem = elem;
        selected[day].push(this.item_map[id]);
      },
      // remove selection of a specific item from a specific day
      //    @arg id: item id
      //    @arg day: the day where the item supposed to be.
      unselect: function (id, day) {
        if (!selected[day]) return;
        selected[day].splice(selected[day].indexOf(this.item_map[id]), 1);
      },
      //check to see if a specific item in a specific day is selected.
      isSelected: function (id, day) {
        if (!selected[day]) return;
        return selected[day].indexOf(this.item_map[id]) > -1
      },
      // Deletes all selected items
      // loops over all items in all days and make a call to the EHistory
      // for each item to be deleted
      removeSelected: function () {
        EHistory.deleteUrls(selected, function () {
          //TODO: Don't reload
          window.location.reload();
        });
      },

      clearHistory: function () {
        chrome.history.deleteAll(function () {
          window.location.reload();
        });
      },

      clearResults: function () {
        EHistory.deleteAllresults(function () {
          alert('The page will reload now\nIt may take Chrome several minutes before making the history available again.');
          window.location.reload();
        });
      },
      // Clears the current model state
      // usually called when a new search is taking place.
      clear: function(){
       results = [];
       finished = false;
       selected = {};
       this.item_map = {};
       prevPage = -1;
      },

      getDomain: function (id) {
        var item = this.item_map[id];
        if (item) {
          return Util.getHostname(item.url);
        }
      },

      deleteItem: function (id) {
        var item = this.item_map[id];
        if (item) {
          chrome.history.deleteUrl({url: item.url});
        }
      }
    };
    // an event listener for when the EHistory has got all its results
    $(EHistory).bind('finished', function () {
      finished = true;
    });
    // Instantiate the history model
    var historyModel = new HistoryModel();
    return historyModel;
  })();

}).call(this);
