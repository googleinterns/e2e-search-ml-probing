
Object.assign(exports, {
  baseUrl: 'http://www.youtube.com',
  studioBaseUrl: 'http://studio.youtube.com',
  puppeteerViewportOptions: {width: 1200, height: 800},

  // The username and password for the user used in testing.  Currently, only a
  // single user is used.
  username: 'bsebastientest@gmail.com',
  password: 'FKYCZDkle2',

  waitForUpdateGiveUpAfter_s: 60 * 60 * 4,
  waitForUpdateInitialBackoff_s: 4,

  // Some very hacky/fragile bits of code use this to wait for an event to
  // happen.  TODO: Consider changing any use of this to a different strategy.
  hopeIsAStrategyTimeout_ms: 3000,
  fastHopeIsAStrategyTimeout_ms: 500,

  // Somewhat hacky code uses this to wait and make sure navigation does not
  // occur when clicking on something that shouldn't navigate to another page.
  // TODO: Consider changing any use of this to a different strategy.
  dontNavTimeout_ms: 1000,
});
