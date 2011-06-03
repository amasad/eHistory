#eHistory
This takes the current chrome history to the next level by adding a set of very useful search operators which is inspired by google's search operators.
It also works around many Google Chrome history bugs and makes more usable and friendlier to use.

Have you ever wanted to get some page you once visited with only knowing very little information about it?
Will maybe thats just me, but when it happens I find that the current chrome history is very limited in its search capability.

For example you remember you once read an article on a pakistani website that had some information you currently need, but thats about as much as you remember! 
This could be as easy as going to your history page and type in the search box:

	site:.pk

##Operators
* inurl: eHistory will restrict results coming from your history search to documents containing that word in the url.
* intitle: eHistory would fetch results that has that word in the document title
* site: restrict results to documents coming from a certain domain name and its sub domains.
* startTime: Filter out results that older than the time specified.
* endTime: Filter out results that is newer than the time specified.
* regex: if set to 1 it means that arguments can take regular expressions.

##GUI
Keeps the simple google branded Chrome history page and augments it with a very useful set of features

* Advanced search: A GUI for the search operators mentioned above.
* Edit box: 3 simple buttons for deleting selected items, deleting current result-set, clearing history.
* Show url: You can show the URL instead of document title.
* Item selection: You can select results to delete by individually selecting result items, or select a whole day's result.

##Search And Delete
In native chrome history you can't search then delete something, you have to browse through all your history and then delete the required document from history.

##Short comings
The filtration feature sometimes works slower than expected, since the filtration process is done in the user space rather than the browser it self, nonetheless eHistory system is highly optimized and also uses certain hacks to get the results as fast as possible.
Chrome's history API doesn't expose the snippet which can reveal which part of the page your search string actually matched.

