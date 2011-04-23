
function DaysVisits (firstItem) {
  this.items = [firstItem];
  this.id_map = {}
  this.id_map[firstItem.id] = this.items[0]
  this.day = firstItem.day;
}

DaysVisits.prototype = {
  insert: function (item) {

    var currentItem;
    if (item.day != this.day) throw new Error("Invalid Day");
    if (currentItem = this.id_map[item.id]) {
     if (currentItem.visitTime < item.visitTime) {
  

      this.items.splice(this.items.indexOf(currentItem), 1, item);
      this.id_map[item.id] = item;
       }
    } else {
      if(item.id ==12075 ) 
          console.log(this.items);  
      this.items.push(item);
      this.id_map[item.id] = item;
      
    }
  },
  sort: function () {
    this.items.sort(function (a,b) {
      return b.visitTime - a.visitTime; 
    });
    return this;
  },

  dequeue: function (length) {
    var ret = this.items.splice(0, length);
    for (var i = 0, item; item = ret[i]; i++)
      delete this.id_map[item.id];

    return ret;
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
       console.log(this.items_day);
    return this;
  },
  
  dequeue: function (length) {
    var ret = [];
    for (var i = 0; i < this.days.length && length > 0; i++){
      if (this.days[i] > this.latestDay) continue;
      var day = this.items_day[this.days[i]].dequeue(length);
      length -= day.length;
      ret = ret.concat(day);
    }
    if (ret.length)
      this.latestDay = ret[ret.length - 1].day;
    console.log(this.latestDay);
    return ret;  
  },

}
