#eHistory
This takes the current chrome history to the next level and adds some very useful search operators which is inspired by google search operators.
Its a bit slow because of the limited chrome extension history API. This is implemented by taking the current history page and make it use a 
replacement of the native history system, which is only wrapper around the history API which filters out search results before getting them back
to history page.

Have you ever wanted to get some page you once visited with only knowing very little information about it?
Will maybe thats just me, but when it happens I find that the current chrome history is very limited in its search capability.

For example you remember you once read an article on a pakistani website that had some information you currently need, but thats about as much 
as you remember so you could go to your history and type in the search box:

	site:.pk

##Operators
* inurl: eHistory will restrict results coming from your history search to documents containing that word in the url.
* intitle: eHistory would fetch results that has that word in the document title
* site: restrict results to documents coming from a certain domain name and its sub domains.
* startTime: Filter out results that older than the time specified.
* endTime: Filter out results that is newer than the time specified.
* regex: if set to 1 it means that arguments can take regular expressions.

##GUI
*Also you can find a checkbox "Advanced Options" if checked then a form will appear were you can add your search filters in there.
*Keeps the current chrome history and augments it with the extra options.

##Show URL
You can show the URL instead of document title.

##Search And Delete
In native chrome history you can't search then delete something, you have to browse through all your history and then delete the required document
history.

