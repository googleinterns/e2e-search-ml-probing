
YT Potato Source
================

Most of this code is from a github repository created by Brian Braunstein

Overview
--------

### `./measure_*.js`

The "main()" files are the `measure_*.js` files.  Each of these runs through a
flow that a YouTube Creator might take, and takes measurements along the way.
These measurements are currently only printed to the console, along with a lot
of other noise.

The goal is that these files read naturally, with the supporting library
described below providing a straight-forward interface to accomplish this goal.


### `./base.js`

A probably unnecessary parent of all classes, currently doesn't do much other
than enforce (encourage) a certain style of logging.


### `./browser.js`

A probably unnecessary wrapper around the Puppeteer library.  It has `Window`
and `Tab` classes to represent those concepts in a browser.  These map to the
(in my opinion) poorly named `Browser` and `Page` classes in Puppeteer.

The benefits of this seemidly unnecessary wrapper are:
* If we have to change from Puppeteer to something else, we don't necessarily
  have to change any other code, just the implementation of this file.
* We get a clear definition of what features of Puppeteer we're actually using,
  which can help in evaluating a switch to another backing library.

One could implement workarounds/fixes of Puppeteer behavior in this class but
instead such code would go elsewhere, such as `class PotatoBase` in
`./page/base.js` described later.


### `./page/*.js`

*This is the meat (tofu?) of the code.*

Each of these files contains a class that represents a YouTube page.  The
methods of the classes perform actions to interact with the page.

Most replace their module.exports with the class itself, so they can be used
like so:
```js
  const AnonymousHome = require('../page/anonymous_home.js');
```
where AnonymousHome is the name of the class.

Currently, some files have more than one class in them, because the page is
complex with dialogs that modify what can and can't be done on the page.  For
example, `page/studio_videos.js` doesn't replace modules.exports, but instead
has several classes:
* StudioVideos
* UploadPrompt
* ConfigureNewUpload

There is a reasonable argument that there should be consistency rather than
taking these 2 strategies.

All classes in these files inherit from `class PotatoBase` defined in
`./page/base.js`, not to be confused with `./base.js` (sorry).
PotatoBase is where Puppeteer workarounds/fixes go.  For example,
PotatoBase.clickButton was an attempt to work around some flakiness involved in
clicking buttons.  The strategies used for these workarounds is very much the
result of "learning while doing" and so there's opportunity for clean-up and
improvements, a nice way to say that the code might be ugly `:)`.


### `./sequence/*.js`

Each of these (currenlty only one) contain common sequences of operations on
classes in `page/*.js` files.  This is simply to avoid redundant
effort/copy-paste across `measure_*.js` files.


### `./util/*.js`

General purpose utilities like implementing expotential backoff, generating
random tokens, etc.


### `*/*_test.js`

Unit tests.  None of these exist right now, haha.  This project is still very
experimental/proof-of-concept stage and may be thrown away, so unit testing was
not a focus.  Certainly this will need to change if the project is picked up.


Next Steps
----------

Most importantly, we have to decide whether or not to actually continue with
this project.  This discussion is done on internal docs as it contains
information internal to Google.

If we do decide to continue, then some potential next steps are:

* Clean-up/Reorg before adding more measurements.
  * Porting is cheap right now as we have a very limited amount of measurement
    code.  However, there is enough code to already see what makes sense and
    what doesn't.

* gRPC
  * gRPC has already started to be integrated into the project.  It is likely
    that this would be the mechanism of getting information in and out of this
    project into other Google infrastructure (monitoring, logging, etc).
  * The specific design of how gRPC would be used to do the integration with
    Google infrastructure can be discussed on internal docs (push vs pull, etc).
  * Progress that can be made now is perhaps just make a simply interface to
    trigger the start of measurements with an RPC, and to read their results
    with an RPC.

* Unit testing
  * Getting a unit testing framework integrated into the project to be able to
    easily start writing unit tests.


Workflow
--------

Currently, the workflow for creating measurements is fairly raw and goes
something like this:
* Copy/paste an existing `measure_*.js` file, and strip out everything except
  the beginning parts that are shared, for example, usually one wants to create
  a new browser window and log in.
* Run the newly created mostly empty script, when it completes successfully, it
  will leave the browser window open, and you can interact with it as you would
  any browser.
* Open the DevTools window, click the "square with arrow in it" icon.
  * Alternatively, just press Ctrl + Shift + C.
* On the YouTube page you're testing, single click on the button you will want to
  click, it shouldn't activate the button, instead, it should show the button's
  HTML element in the "Elements" tab of DevTools.
* Try to determine the most "reliable" CSS Selector or XPath for the button.
  Much of the "cleverness" of writing these tests is making them not flaky, and
  this is one part of that.  If you choose a fragile selector then changes to
  the page are more likely to break the test.  Long term, we'll want to work
  with the dev teams to provide guaranteed selectors using things like unique
  IDs.
* Note down your selector or XPath, then actually click the button.  Repeat
  this process throughout the flow you're testing.
* Write code in your new `measure_*.js` to perform the sequence you've gone
  through above.
* Run the script, your code will have bugs or flakiness, but the browser window
  will remain open whenever the code throws an exception.  You can even use
  `throw "BREAKPOINT";` as a strategy to break your script at some specific
  point and allow you to interact with the browser by hand.
* The other "cleverness" that goes into de-flaking the tests is dealing with
  weird race-prone interaction with the page.  You can solve these with "sleep
  and poll" but this is slow and ugly, and where ever possible I've tried to
  avoid this kind of solution, altough all of these workarounds feel fragile and
  hacky to some degree, so far I've been able to find a functional workaround
  for every existing case.
* Often, you'll want to measure how long a change takes to be reflected on a
  non-logged in user.  To do this, some existing scripts,
  `measure_upload_go_live_delay.js` for example, open an incognito window tab
  and poll for the update to go live, with exponential backoff.  This type of
  polling is unavoidable.
  

Fighting Flakiness
------------------

As mentioned before, a lot of the cleverness going into writing these scripts is
how to make them not flaky.  Here are some notes about what I've found to be
flaky and how to workaround these issues:


### Puppeteer page.waitForNavigation

Sometimes when trying to use this the script would end up flaky.  Instead of
waiting for navigation, a reliable approach is to page.waitForXPath for some
target that is unique to the new page being loaded.  Long term, we can work with
the dev team to make sure every page is guaranteed to have a unique and
consistent identifier.  Short term, I've just manually hunted for something that
seemed unique and stable enough for now.

### Puppeteer page.clickButton


Code convensions
----------------

###Navigating with PotatoBase implementations

PotatoBase keeps track of the tab the page is currently loaded onto.  When
creating a new PotatoBase implementation, the tab is usually already on the
page, because a button was clicked on a previous page, which leads to the new
page.  The first page gives away the tab to the new page, nulling out its own
member point at it, to ensure that the object isn't accidentally used when the
tab is no longer loaded to its page (in C++, we'd force destruction of the
object at this point).

PotatoBase implementations all (or mostly) have a
`static New(tab)` method, which take the tab that is already loaded to the page,
which works well for the above described scenario. For example:


```js
class PageFoo {
  async clickOnGoToBarButton() {
    await this.clickButton("//some/xpath/to/button");
    return await BarPage.New(this.giveAwayTab());
  }
}
```

`await ThePageImpl.New()` will wait for the page to actually
load, using the `init()` and `verify()` methods described above.

Some PotatoBase implementations have a `static goto(tab)`.  This is for cases where
the `tab` isn't already on the page represented by the PotatoBase
implementation.  It is then used like so:
```js
// create the tab
await MyPage.goto(tab);
let x = await MyPage.New(tab);
```
This is necessary for the pages loaded initially, like the youtube home page.
