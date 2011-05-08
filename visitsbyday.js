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
function DaysVisits (firstItem) {
  this.items = [firstItem];
  this.id_map = {};
  this.id_map[firstItem.id] = 0;
  this.day = firstItem.day;
}

DaysVisits.prototype = {
  insert: function (item) {
    var currentItem;
    var index = this.id_map[item.id];
    if (item.day != this.day) throw new Error("Invalid Day");
    if (currentItem = this.items[index]) {
     if (currentItem.visitTime < item.visitTime) {
      this.items.splice(index, 1, item);
     }
    } else {
      this.id_map[item.id] = this.items.push(item) - 1; 
    }
  },
  sort: function () {
    this.items.sort(function (a,b) {
      return b.visitTime - a.visitTime; 
    });
    return this;
  },

  dequeue: function (length) {
    return this.items.splice(0, length);
    
  },

  clear: function () {
    this.items = [];
    this.id_map = {};
  }
};  

function VisitsByDay () {
  this.latestDay = Date.now();
  this.items_day = {};  
  this.days = [];
}

VisitsByDay.prototype = {
  insert: function (item) {
   //array of items on one day
   if (item.day > this.latestDay)
    return;
    if (!this.items_day[item.day]) {
      day = this.items_day[item.day] = new DaysVisits(item);
    } else {
      this.items_day[item.day].insert(item);
    }
  },
  
  sort: function () {
    this.days = Object.keys(this.items_day);
    this.days.sort(function (a,b) {return parseInt(b)-parseInt(a);});
    for (var i=0; i < this.days.length; i++){
      this.items_day[this.days[i]].sort();
    }
    return this;
  },
  
  dequeue: function (length) {
    var ret = [];
    for (var i = 0; i < this.days.length && length > 0; i++){
      
      if (this.days[i] > this.latestDay) {
        delete this.items_day[this.days[i]];
        this.days.splice(i--, 1);
        continue;
      }
      var day = this.items_day[this.days[i]].dequeue(length);
      length -= day.length;
      ret = ret.concat(day);
      if (!this.items_day[this.days[i]].items.length) delete this.items_day[this.days[i]];
    }
    
    if (ret.length)
      this.latestDay = ret[ret.length - 1].day;
    return ret;  
  },

}
