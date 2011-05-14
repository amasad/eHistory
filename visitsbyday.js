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

// TODO: Optimizations
//           Possible optimization in sorting, maybe being done on sorted arrays
//           Maintain a sorted array?

// Class DaysVisits
//    Holds visit items on one day

// Constructor
//    @arg firstItem: usually when constructed the first item to put in a particular day is available.
function DaysVisits (firstItem) {
  // create the items array
  this.items = [firstItem];
  // a hash containing the id of the visit item and its index in the items array for faster access
  this.id_map = {};
  this.id_map[firstItem.id] = 0;
  // The particular day timestamp
  this.day = firstItem.day;
}

DaysVisits.prototype = {
  // Method insert : inserts a single visit item, if the another visit 
  //                 exists with the same parent history item, replace it
  //   @arg item: visit item
  insert: function (item) {
    var currentItem;
    // pull up the index of the visit item that corresponds to the same history item if it exists
    var index = this.id_map[item.id];
    if (item.day != this.day) throw new Error("Invalid Day");
    // if the index is valid and the item to be added is newer in time then replace the old one
    if (currentItem = this.items[index]) {
     if (currentItem.visitTime < item.visitTime) {
      this.items.splice(index, 1, item);
     }
    } else {
      // Add the new visit item and register in map
      this.id_map[item.id] = this.items.push(item) - 1; 
    }
  },
  // Method sort, sorts the items array according to visit time
  //  @chainable
  sort: function () {
    this.items.sort(function (a,b) {
      return b.visitTime - a.visitTime; 
    });
    return this;
  },
  // Method dequeue: Gets the newest items up to a limited number, usually called after sort.
  //     @arg length: max length of the number of items to splice off.
  // @return Array
  dequeue: function (length) {
    return this.items.splice(0, length);
  },

  clear: function () {
    this.items = [];
    this.id_map = {};
  }
};  

// Class VisitsByDay, wrapper class that holds as much DaysVisits as there is days
//       in the current search instance.

// Constructor
function VisitsByDay () {
  // the newest time allowable in the days this class hosts. 
  this.latestDay = Date.now();
  // hash containing all DaysVisits instances
  //  @key: Day time stamp.
  //  @value: DaysVisits instance.
  this.items_day = {};  
  // list of days this class items on
  this.days = [];
}

// public methods
VisitsByDay.prototype = {
  // Method insert, inserts one single visit item into the appropriate place.
  //     @arg item: visit Item.
  insert: function (item) {
   //array of items on one day
   if (item.day > this.latestDay)
    return;
    if (!this.items_day[item.day]) {
      this.items_day[item.day] = new DaysVisits(item);
    } else {
      this.items_day[item.day].insert(item);
    }
  },
  // Method sort, sorts all DaysVisits childs
  // @TODO: Merge with dequeue
  //    @chainable
  sort: function () {
    this.days = Object.keys(this.items_day);
    this.days.sort(function (a,b) {return parseInt(b)-parseInt(a);});
    for (var i=0; i < this.days.length; i++){
      this.items_day[this.days[i]].sort();
    }
    return this;
  },
  // Method dequeue
  //    @arg length: Maximum number of items to return 
  dequeue: function (length) {
    // helper function
    //   @arg day: A day timestamp
    //   @arg index: The day's index in the days array.
    var that = this,
        ret = [],
        daysResults;

    var deleteDay = function(index) {
      delete that.items_day[that.days[index]];
      that.days.splice(index, 1);
    }

    for (var i = 0; i < this.days.length && length > 0; i++){
      // remove days no longer needed, i.e. garbage visits, generated from getting all visits
      // @TODO: is this necessary since we have this check on insertion?
      if (this.days[i] > this.latestDay) {
        deleteDay(i--);
        continue;
      }
      daysResults = this.items_day[this.days[i]].dequeue(length);
      length -= daysResults.length;
      ret = ret.concat(daysResults);
      if (!this.items_day[this.days[i]].items.length)  deleteDay(i);
    }
    // record that last date of the last visit handed over, being the latest.
    if (ret.length)  this.latestDay = ret[ret.length - 1].day;
    return ret;  
  }

};
