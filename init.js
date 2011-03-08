(function ($){
	//inject search options into page
	var parseQuery = function(inputs){
		var operators = "";
		var words = "";
		
		for (var j in inputs){
			if (j == "searchBox"){
				operators = inputs[j].val();
				continue;
			}
			inputs[j].val('');
		}
		words += takeAndReturn(inputs, operators, function(place, key, value){
			if (key == "regex"){
				place.attr('checked', value == "1" ? true:false);
			}
			place.val($.trim(place.val() + ' ' + value));
		});		
		
		if (inputs['words']) inputs['words'].val($.trim(words));
	};
	
	var parseSettings = function(inputs){
		inputs['searchBox'].val('');
		console.log('here');
		for (var j in inputs){
			if (j == 'searchBox' || inputs[j].val() == "") continue;
			//inputs[j].val(j);
			if (j == 'words'){
				inputs['searchBox'].val(inputs['searchBox'].val() + " " + inputs[j].val());
				continue;
			}
			for(var i =0, filters = inputs[j].val().split(' '); i < filters.length; i++){
				//log(filters);
				inputs['searchBox'].val(inputs['searchBox'].val() + ' ' + j + ':'+filters[i]);
			}
		}
		inputs['searchBox'].val($.trim(inputs['searchBox'].val()));
	};
	
	$(document).ready(function (){
		//$('<table id="res"><tbody><tr><td></td><td><h3>How did I get here?</h3><table id="how"></table></td></tr></tbody></table>').appendTo($('.main'));
		//$('#res tbody td:first').append($('#results-display'));
		var optionsPage = $('<div>').append($.ajax({url: 'advanced.html',async:false}).responseText);
		var header = $('.header');
		header.append(optionsPage.find('#show-options')).append('Advanced options');
		header.append(optionsPage.find("#options-container"));
		
		var showButton = $('#show-options');
		var searchBox = $('#term');
		var options = $('#options-container');
		var submit = $('[name=submit]');
		var advanced_search = $('#advanced-search');
		//initial bindings
		var inputs = {
			inurl : $('#url_text input'),
			intitle: $('#title_text input'),
			site: $('#site_text input'),
			'searchBox': searchBox,
			words: $('#all-words_text input'),
			startTime: $('#from-date_text input'),
			endTime: $('#to-date_text input'),
			regex: $('#regex_cb input')
		};
		//listen for checkbox change to set checked or unchecked
		inputs['regex'].change(function(e){
			if($(this).attr('checked')){
				$(this).val(1);
			}else{
				$(this).val(0);
			}
			console.log(e);
		});
		showButton.click(function(){
			if ($('form:visible').length > 0){
				parseQuery(inputs);
			}else{
				parseSettings(inputs);
			}
			$('form').toggle();
			options.toggle();	
		});
		
		advanced_search.click(function(){
			parseSettings(inputs);
			var options = {};
			RESULTS_PER_PAGE = $('#results-per-page_select :selected').val();
			$(document.forms[0]).submit();
		//	historyModel.setSearchText(searchBox.val(), 0,options);
		});
		chrome.history.onVisitRemoved.addListener(historyDeleted);
		
		//add show url checkbox
		$('#edit-button').append('<div id="div-show-urls"><input type="checkbox" id="show-urls" />Show URLs</div>');
		$('#show-urls').click(function (){
			var checked = $(this).is(":checked");
			$('.title a').each(function () {
				var $this = $(this);
				var href = $this.attr('href');
				if (checked){
					$this.data('title', $this.text());
					$this.text('');
					Page.prototype.addHighlightedText_($this.get(0), href, historyModel.getSearchText());
				}else{
					var text = $this.data('title');
					$this.text('');
					Page.prototype.addHighlightedText_($this.get(0), text, historyModel.getSearchText());
				}
				
			});
		});
	});

})(jQuery);