
const PotatoBase = require('./base.js');
const studio_videos = require('./studio_videos.js');

class StudioDashboard extends PotatoBase {
  class_name() { return "StudioDashboard"; }

  static async New(tab) {
    const p = new StudioDashboard();
    await p.init(tab, '//h1[contains(text(), "Channel dashboard")]');
    return p;
  }

  async goToVideos() {
    this.clickButton({
      xpath: '//ul[@id="main-menu"]//a[@tooltip-text="Videos"]//iron-icon',
      expectNav: true,
    });
    return await studio_videos.StudioVideos.New(this.giveAwayTab());
  }
}; 

module.exports = exports = StudioDashboard;
