@visitsHash = {}
unlinked = {}
@MAX = 2147483647
class Site
  constructor: (hItem, @name)->
    @id = hItem.id
    @adjacencies = []
    @data =
      "$color": "#416D9C",
      "$type": "circle"
    @items = [hItem]
    @visitsArr = []
    @linked = false
    
  addAdj: (site)->
    @adjacencies.push 
      nodeFrom: @id,
      nodeTo: site.id,
      data:
        "$color": "#557EAA"
    @hasLink()
  
  hasLink: ()->
    @linked = true
  
  addItem: (item)->
    @items.push(item)
    
  updateVisits: (callback)->
    @items.forEach (item, i)=>
      chrome.history.getVisits url: item.url, (visits)=> 
        visits.forEach _.bind(@addVisit, this)
        callback() if i == @items.length - 1 
        
      
      
  addVisit: (visit)->
    visitsHash[visit.visitId] = this
    @visitsArr.push visit

  getPageViews: ()-> @items.length
  
  getVisits: ()-> @visitsArr
    
class @Stats
  constructor: (config, @callback)->
    @data =
      pageViews: null
      sites: null
      pagesPerSite: null
      searchQueries: null
      bounceRate: null
      
    @sites = {}
    @search config
    
  search: (config)->
    @settings =
      text: ''
      startTime: config.startTime
      endTime: config.endTime
      maxResults: MAX
    
    chrome.history.search @settings, (res)=> @analyze(res)
  
  analyze: (historyItems)->
    @data.pageViews = historyItems.length
    historyItems.forEach (item)=>
      @updateSites(item)
      @updateSearch(item)
      @updateMisc(item)
    @callback this
    
  updateSites: (item)->
    {hostName: host, path: pagePath} = Utils.parseUrl item.url
    if @sites[host]?
      @sites[host].addItem(item)
    else
      @sites[host] = new Site(item, host)
    
  updateSearch: (item)->
    if //.test item.url
      @data.searchQueries++
  
  updateMisc: (item)->
    
  relations: (callback)-> 
    ct = 0
    len = (Object.keys @sites).length
    console.log(len)
    _.each @sites, (site)=>
      site.updateVisits ()=>
        ct++
        site.getVisits().forEach (visit, i, arr)=>
          ref = visit.referringVisitId
          if visitsHash[ref]
            site.hasLink()
            visitsHash[ref].addAdj site
          else
            if unlinked[ref]
              unlinked[ref].push site
            else
              unlinked[ref] = [site]
          @jitNormalize(unlinked, callback) if i == arr.length - 1 and ct == len - 1
            

  jitNormalize: (unlinked, callback)->
    console.log 's'
    _.each unlinked, (arr, id)->
      if visitsHash[id]?
        visitsHash[id].addAdj link for link in arr
    ret = []    
    _.each @sites, (site)->
      console.log site if site.name == '192.168.100.131'
      ret.push(site) if site.linked
    
    callback ret
    
    return @sites
  
        