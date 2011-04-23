(function($){

/******** Utils **********/
function getPrevDay(day){
  day = new Date(new Date(day).toDateString()).getTime();
  day -= (24 * 60 * 60 * 1000);
  return day;
 }
function parseQuery (input, callback) {
  var options = (input.split(/\s/)),
      filters = {},
      searchSettings = {
        startTime: null,
        endTime: null,
        text: ""
      };

  $.each(options, function (i, pair) {
    pair = pair.split(":");
    if (pair.length === 1)  searchSettings.text += " " + pair[0];
    searchSettings[pair[0]] !== undefined ? searchSettings[pair[0]] = pair[1] :
      filters[pair[0]] = pair[1];
  });
  searchSettings.text = $.trim(searchSettings.text);
  callback({
    searchSettings: searchSettings,
    filters: filters  
  });
}

function parseForm ($form, callback) {
  var query = "",
      text = "";
  $form.children('input').each(function (i, elem) {
    elem = $(elem);
    if (elem.data("settings-item") === "text") {
      text += elem.val();
      return;
    }
    query += elem.val() ?  " " + elem.data("settings-item") + ":" + elem.val() : "";
  });
  callback($.trim(query + " " + text));
}

//Controller
$(function(){
  var $query = $('#query'),
      $form = $('form'),
      $pnlAdvanced = $('#pnl-advanced'),
      $resultsTable = $('#tbl-main');

  function fillForm (config) {
    config = $.extend(config.searchSettings, config.filters);
    $pnlAdvanced.children('input').each(function (i, elem) {
      elem = $(elem);
      elem.val(config[elem.data("settings-item")] || "");
    });
  }

  function fillText (text) {
    $query.val(text || "");
  }

  $resultsTable.delegate(".chk-day", "change", function () {
    $(this).parents('tr').nextUntil('.hdr-day')
        .children(':nth-child(1)').children()
            .attr("checked",  $(this).attr("checked")).trigger("change");
  });

  $resultsTable.delegate(".chk-entry", "change", function () {
    var val =  $(this).attr("checked");
    var $row = $(this).parents("tr");
    var fn = val ? $.proxy(historyModel.select, historyModel) : $.proxy(historyModel.unselect, historyModel);
    fn($row.data("id"),$row.data("day"));
  });
  $("#chk-advanced").click(function(){
      $this = $(this);
			if ($pnlAdvanced.is(":visible")){
				parseForm($pnlAdvanced, fillText);
			}else{
				parseQuery($query.val(), fillForm);
			}
			$pnlAdvanced.toggle();
		//	options.toggle();	
		});
 
  $("#btn-delete-selected").click(function () {
    historyModel.removeSelected();
  });
  function search(config) {
    var settings = config.searchSettings,
             filters = config.filters;

    EHistory.search({
      text: settings.text || "",
      startTime: new Date(settings.startTime || 0).getTime() ,
      endTime: new Date(settings.endTime || Date.now()).getTime()
    }, historyModel.pageSize, function(results){
      historyModel.append(results);
    });
  }

  $('#frm-search').submit(function(){
    historyModel.clear();
    historyView.clear();
    historyView.disableControls();
    if ($form.is(":visible")){
      parseForm($pnlAdvanced, function (text) {
        parseQuery(text, search);
      });
    } else {
      parseQuery($query.val(), search);
    }
    return false;
  });
 
  $('#date-frm').datepicker();
  $('#date-to').datepicker();
  //templates
  $.template("row", "<tr class='entry'>"+
                      "<td><input type='checkbox'class='chk-entry'/></td>"+
                      "<td>${date}</td>"+
                      "<td>{{if title}} ${title} {{else}} ${url} {{/if}}</td>"+
                    "</tr>");
  $.template("day-row", "<tr class='hdr-day'><td><input type='checkbox' class='chk-day'/></td><td>${date}</td> </tr>");
});

})(jQuery);
