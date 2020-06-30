
const config = require('./config.js');
const puppeteer = require('puppeteer');

// Represents a single browser window.
// A thin facade on top of the puppeteer Browser class.
class Window {
  constructor(puppeteerBrowser) {
    this.puppeteerBrowser_ = puppeteerBrowser;
  }

  async newTab() {
    return await Tab.New(await this.puppeteerBrowser_.newPage());
  }

  async close() {
    return this.puppeteerBrowser_.close();
  }

  async newIncognitoWindow() {
    return new Window(
        await this.puppeteerBrowser_.createIncognitoBrowserContext());
  }

  static async New() {
    const browser = await puppeteer.launch({headless: false});
    return new Window(browser);
  }
};

exports.Window = Window;


// Represents a single browser tab.
// A thin facade on top of the puppeteer Page class.
class Tab {
  constructor(puppeteerPage) {
    this.puppeteerPage_ = puppeteerPage;
  }

  static async New(puppeteerPage) {
    await puppeteerPage.setViewport(config.puppeteerViewportOptions);
    return new Tab(puppeteerPage);
  }

  async close() { return await this.puppeteerPage_.close(); }
  isClosed() { return this.puppeteerPage_.isClosed(); }

  async goto(url) {
    return await this.puppeteerPage_.goto(url);
  }

  async url() { return await this.puppeteerPage_.url(); }

  async reload() {
    await this.puppeteerPage_.reload();
  }

  async waitForNavigation(opts) {
    return await this.puppeteerPage_.waitForNavigation(opts);
  }

  async waitFor(delay_ms) {
    return await this.puppeteerPage_.waitFor(delay_ms);
  }

  async waitForXPath(xpath, opts) {
    return await this.puppeteerPage_.waitForXPath(xpath, opts);
  }

  async setCacheEnabled(enabled) {
    return await this.puppeteerPage_.setCacheEnabled(enabled);
  }

  async $x(xpath) {
    return await this.puppeteerPage_.$x(xpath);
  }

  mouse() { return this.puppeteerPage_.mouse; }
};

exports.Tab = Tab;
