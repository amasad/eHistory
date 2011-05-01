(function($){
/** Global **/
initialSearch = function () {
  $('#frm-search').submit();
};
/******** Utils **********/
function parseQuery (input, callback) {
  var options = (input.split(/\s/)),
      filters = {
        inurl: null,
        intitle: null,
        site: null
      },
      searchSettings = {
        startTime: null,
        endTime: null,
        text: ""
      },
      combined = "", pureText = "";
      
  $.each(options, function (i, pair) {
    pair = pair.split(":");
    if (!pair[0]) return;
    searchSettings[pair[0]] !== undefined ? searchSettings[pair[0]] = pair[1] :
            filters[pair[0]] !== undefined ? combined += " " + (filters[pair[0]] = pair[1]) : combined += " " + (pair[1] || pair[0] || "");
    if (!pair[1]) pureText += " " + pair[0];
  });
  
  searchSettings.text = $.trim(combined);
  for (var prop in filters) {
    if (filters[prop] === null) {
      delete filters[prop];
    }
  }
  callback({
    searchSettings: searchSettings,
    filters: filters,
    pureText: $.trim(pureText)
  });
}
//intitle:title inurl:url site:site startTime:startime endTime:endtime searchquery
function parseForm ($form, callback) {
  var query = "",
      text = "";

  $form.find('input').each(function (i, elem) {
    elem = $(elem);
    if (elem.attr("id") == "pure-text") {
      text += elem.val();
    } else {
      query += elem.val() ?  " " + elem.data("settings-item") + ":" + elem.val() : ""; 
    }
  });
  callback($.trim(query + " " + text));
}

//Controller
$(function(){
  //check version
  //get manifest version
  var version,
      version_message = "<br>Enhanced Performance";
  var manifest = $.ajax({
          url: 'manifest.json',
          async: false
        }).responseText;
  manifest = JSON.parse(manifest || 'null');
  if (manifest) version = manifest.version;
  if (localStorage['version'] != version) {
    $('#version-updated').append(" to " + version).append(version_message).show("slow");
    localStorage.clear();
    localStorage['version'] = version;
  }
  setTimeout(function () {
    $('#version-updated').hide("slow");
  }, 5000);
  var $query = $('#query'),
      $form = $('form'),
      $pnlAdvanced = $('#pnl-advanced'),
      $resultsTable = $('#tbl-main');

  function fillForm (config) {
    var operators = $.extend(config.searchSettings, config.filters);
    $pnlAdvanced.find('input').each(function (i, elem) {
      elem = $(elem);
      if (elem.attr('id') == "pure-text"){
        elem.val(config.pureText)
      } else {
        elem.val(operators[elem.data("settings-item")] || "");
      }
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
    var val =  $(this).attr("checked"),
        $row = $(this).parents("tr"),
        fn = val ? $.proxy(historyModel.select, historyModel) : $.proxy(historyModel.unselect, historyModel);
    fn($row.data("id"),$row.data("day"));
  });
  
  $("#chk-advanced").click(function () {
      var $this = $(this);
			if ($pnlAdvanced.is(":visible")) {
			  $query.attr("disabled", false);
				parseForm($pnlAdvanced, fillText);
			} else { 
			  $query.attr("disabled", true);
				parseQuery($query.val(), fillForm);
				$query.focus();
			}
			$pnlAdvanced.toggle();
	});
 
  $("#btn-delete-selected").click(function () {
    historyModel.removeSelected();
  });
  
  function search(config) {
    var settings = config.searchSettings,
        filters = config.filters;
    historyView.displayThrobber();
    historyView.setSummary(settings.text || "");
    try {
      EHistory.search({
          text: settings.text || "",
          startTime: new Date(settings.startTime || 0).getTime() ,
          endTime: new Date(settings.endTime || Date.now()).getTime(),
          maxResults: historyModel.pageSize
        }, config.filters, function(results){
        historyModel.append(results);
      });
    } catch (e) {console.error(e)}
  }

  $('#frm-search').submit( function () {
    historyModel.clear();
    historyView.clear();
    historyView.disableControls();
    if ($pnlAdvanced.is(":visible")){
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
  // TODO move to view.js
  //templates
  $.template("row", "<tr class='entry'>"+
                      "<td><input type='checkbox'class='chk-entry'/></td>"+
                      "<td class='time'>${date}</td>"+
                      "<td><a href='${url}' style='background-image:url(chrome://favicon/${url})'>{{if title}} ${title} {{else}} ${url} {{/if}}</a></td>"+
                    "</tr>");
  $.template("day-row", "<tr class='hdr-day'><td><input type='checkbox' class='chk-day'/></td><td>${date}</td> </tr>");
});

})(jQuery);
