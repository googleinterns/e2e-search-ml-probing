
const assert = require('assert');
const Base = require('../base.js');
const config = require('../config.js');

class PotatoBase extends Base {
  construct() {
    this.tab_ = null;
    this.verifyXPath_ = null;
  }

  class_name() { throw new Error("class name not set"); }

  // verifyXPath is optional, if given, the xpath will be waited for in order
  // to verify that tab is pointed to the expected page.  The xpath should be
  // unique across pages so that there's no ambiguity.
  async init(tab, verifyXPath) {
    this.tab_ = tab;
    this.verifyXPath_ = verifyXPath || null;
    await this.verify();
  }

  tab() {
    if (this.tab_ == null) {
      throw new Error("Potato used with this.tab_ == null.  Likely,"
                      + " this potato did giveAwayTab() already.");
    }
    return this.tab_;
  }

  tabMaybeNull() {
    return this.tab_;
  }

  // Verify that we're actually on this page now.
  async verify() {
    if (this.verifyXPath_ == null) { return; }
    await this.tab().waitForXPath(this.verifyXPath_);
  }

  // Reloads in a robust way (perhaps unnecessary).
  // Goes to chrome://version then back to the original URL.
  async reload() {
    await this.tab().setCacheEnabled(false);
    const origUrl = await this.tab().url();
    await this.tab().goto('chrome://version', {timeout: 500});
    const shouldBeEmpty = await this.tab().$x(this.verifyXPath_);
    assert.strictEqual(shouldBeEmpty.length, 0);
    await this.tab().goto(origUrl);
    await this.verify();
    //await this.tab().reload();
    await this.tab().setCacheEnabled(true);
  }

  log(msg) { console.log(this.class_name() + ": " + msg); }

  // Wait for the given xpath to appear and click on it.
  //
  // arg as string is converted to { xpath: arg, expectNav: false }
  // arg is {
  //  xpath: string
  //    The xpath to wait and click for.
  //  expectNav: boolean
  //    Upon click, this method checks if navigation occurred or not.  If the
  //    expectation doesn't match the reality, an error is thrown.
  //  tab: browser.Tab
  //    If null, this.tab(), otherwise the tab to perform the click in.
  // }
  async clickButton(arg) {
    if (typeof(arg) == 'string') {
      arg = {xpath: arg};
    }

    if (arg.expectNav) {
      await this.clickButtonExpectingNav_(arg.xpath,
                                          arg.tab || this.tab());
    } else {
      await this.clickButtonExpectingNoNav_(arg.xpath,
                                            arg.tab || this.tab());
    }
  }

  // TODO: Make this not a member function, maybe in a util library.
  async clickButtonExpectingNav_(xpath, tab) {
    await Promise.all([
      tab.waitForNavigation({waitUntil: 'networkidle2'}),
      this.clickButtonRaw(xpath, tab),
    ]);
  }

  // TODO: Make this not a member function, maybe in a util library.
  async clickButtonExpectingNoNav_(xpath, tab) {
    const button = await tab.waitForXPath(xpath);
    const naving = tab.waitForNavigation({timeout: config.dontNavTimeout_ms})
        .catch(()=>{});
    await button.click();
    try {
      await naving;
      // Success is bad, we don't want navigation!
      throw new Error("Button click unexpectedly caused tab navigation.");
    } catch(e) {
      // This is what we were hoping for.
    }
  }

  // Just click the button without any checking of navigation.
  async clickButtonRaw(xpath, tab) {
    tab = tab || this.tab();
    const button = await tab.waitForXPath(xpath);
    await button.click();
  }

  // This works around flakey buttons by retrying them a few times with
  // backoff.  TODO: pretty ghetto and hardcoded retry mechanism, consider
  // improving.
  // TODO: Make this not a member function, maybe in a util library.
  // TODO: perhaps this isn't needed now?? Haven't seen flakiness.
  /*
  async doClickButtonWithRetries_(xpath, tab) {
    const loops = 5;
    for (let i = 0; i < loops; ++i) {
      try {
        const button = await tab.waitForXPath(xpath);
        await button.click();
        return;
      } catch(e) {
        this.log("Error while trying to click button:\n" + e);
      }

      const backoff = 500 * Math.pow(2, i);
      if (i + 1 < loops) {
        this.log(`Trying again in ${backoff}ms...`);
      } else {
        this.log(`Giving up, try clicking manually, waiting ${backoff}ms...`);
      }
      await tab.waitFor(backoff);
    }
  }
  */

  /*
  dismissPopups() {
    this.tab().on('dialog', async dialog => {
      this.log("Automatically dismissing dialog: " + dialog.message());
      await dialog.dismiss();
    });
  }
  */

  giveAwayTab() {
    const p = this.tab_;
    this.tab_ = null;
    return p;
  }
};

module.exports = exports = PotatoBase;
