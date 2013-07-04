# eHistory

This takes the current chrome history to the next level by adding a set of very useful search operators which is inspired by google's search operators.
It also works around many Google Chrome history bugs and makes it easy to use.

If you are the kind of person spends a lot of time on the web, sooner or later you'll run into a situation where you want to pull up a page you've visited in the past that you can remember so little about. Maybe you remember that it was an article in the New York times. And maybe you remember you saw it two weeks ago. Normally, this kind of information won't be of any help to you. Enter eHistory: It allows you to power search your browser history with a nice and slick interface. It also adds advanced deletion features.


## Filters

1. URL.
2. Title.
3. Site.
4. Time of visit.
5. Content.

## Other features:

* Search and delete individual or multiple Items.
* Easily select full days to delete.
* Clear history.
* Clear all search results.
* Works around some Chrome history bugs.

## Example:
I remember reading a NY times article about coffee:
site:nytimes.com intitle:coffee


## Short comings

Some queries may run slower than others, and this is because all filteration is done in JavaScript. The Chrome History API only takes text field search, nonetheless eHistory is highly optimized and implements certain hacks to get the results as fast as possible.
Another pain point would be that Chrome's history API doesn't expose the snippet which can reveal which part of the page your search string actually matched.

