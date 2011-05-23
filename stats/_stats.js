EStats = (function () {
  var MAX = 2147483647;
  var bind = function (fn, obj) {
    return function () {
      fn.apply(obj, [].slice.call(arguments));
    }
  }
  var Stats = function (config) {
    this.data = {
      pageViews: null,
      sites: null,
      pagesPerSite: null,
      searchQueries: 0,
      bounceRate: null
    };
    
    this.counters = {
      sites: {},
      put: function (site, path) {
        sites = this.sites;
        if (!sites[site]) sites[site] = {count: 0, paths: {}};
        sites[site].count++;
        sites[site].paths[path] = true;
      }
    };
    
    this.topSites = {
      top: [],
      insert: function (site) {
        if (!this.top.length) return this.top[0] = site;
        var count = site.count;
        for (var i = 0; i < this.top.length; i++){
          if (count > this.top[i].count) {
            this.top.splice(i, 0, site);
            break;
          }
        }
        if (i === this.top.length) {
          this.top.push(site);
        }
        if (this.top.length > 19) {
          this.top = this.top.slice(0,20);
        }
      }
    }
    this.settings = {
      text: '',
      startTime: config.startTime,
      endTime: config.endTime,
      maxResults: MAX
    };
    
    chrome.history.search(this.settings, bind(this.analyze, this))
  };
  
  Stats.prototype = {
    analyze: function (results) {
      var isSearch;
      this.data.pageViews = results.length;
      for (var i = 0; i < results.length; i++){
        isSearch = this.updateSites(results[i]);
        if (isSearch) this.updateSearch(results[i]);
        this.updateBounceRate(results[i]);
      }
      this.normalize();
    },
    
    updateSites: function (historyItem) {
      var parsed = Utils.parseUrl(historyItem.url),
          site = parsed.hostName,
          pagePath = parsed.path;
      
      this.counters.put(site, pagePath);
      
      return (/http(s)*:\/\/(www\.)*google|yahoo|bing/i.test(historyItem.url));
    },
    
    updateSearch: function (historyItem) {
      // regex test
      this.data.searchQueries++;
    },
    
    updateBounceRate: function (historyItem) {
      
    },
    
    normalize: function () {
      var sites = this.counters.sites,
          sumOfPages = 0,
          numOfSites = 0;
          
      for (var site in sites) {
        sites[site].name = site;
        this.topSites.insert(sites[site]);
        numOfSites++;
        sumOfPages += Object.keys(sites[site].paths).length;
      }
      
      this.data.sites = numOfSites;
      this.data.pagesPerSite = (sumOfPages / numOfSites).toFixed(1);
      callback(this.data);
    },
    
  };  
  
  
  
  
  
  var visualize = (function () {
    
    var normalize = function (siteMap, nodes, premature) {
      var data = [], node;
      for (var id in nodes) {
        node = nodes[id];
        l = node.links;
        if (premature[id] && Array.isArray(premature[id].links)) node.links.concat(premature[id].links);
      }
      var item;
      var got_links = {};
      for (var site in siteMap) {
        node = siteMap[site];
        item = {
          id: node.id,
          name: node.name,
          adjacencies: [],
          data: {
            "$color": "#416D9C",
            "$type": "circle"
          }
        };
       
        node.links.forEach(function (link) {
          got_links[link.id] = got_links[node.id] = true;
          var adj = {
            nodeFrom: node.id,
            nodeTo: link.id,
            data: {
              "$color": "#557EAA"
            }
          };
          item.adjacencies.push(adj);
          
        });
        data.push(item);
      }
      var ret = [];
      data.forEach(function (item) {
        if (got_links[item.id]){
          ret.push(item);
        }
      })
      return ret;
    }
    return function visualize (config, callback) {
      var nodes = {};
      var visitsMap = {},
          sitesMap = {},
          links = {};
      config = {
          text: '',
          startTime: config.startTime,
          endTime: config.endTime,
          maxResults: MAX
      };
      chrome.history.search(config, function (results) {
        results.forEach(function (item, i, arr) {
          var site = Utils.parseUrl(item.url).hostName;
          if (sitesMap[site]) {
            nodes[item.id] = sitesMap[site];
          } else {
            sitesMap[site] = nodes[item.id] = {
              name: site,
              links: [],
              id: item.id
            }
          }
          item = Object.create(item);
          item.url = item.url;
          chrome.history.getVisits(item, function (visits){
            visits.forEach(function (visit) {
              
              var ref = visit.referringVisitId;
              visitsMap[visit.visitId] = nodes[visit.id];
              if (ref){
                if (!visitsMap[ref]){
                  if (!links[ref]) links[ref] = {links: [nodes[visit.id]]}
                  else links[ref].links.push(nodes[visit.id]);
                } else{
                  visitsMap[ref].links.push(nodes[visit.id])
                }
              } 
            });
          });
          if (arr.length - 1 === i) callback(normalize(sitesMap, nodes, links));
        });

      });
    }
  })();
    
  return {
    getStats: function (config, callback) {
      return new Stats(config, callback);
    },
    visualize: function (config, callback) {
      return visualize(config, callback);
    }
  }
  

}());