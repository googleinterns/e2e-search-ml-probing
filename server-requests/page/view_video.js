
const EditVideoMetadata = require('./edit_video_metadata.js');
const PotatoBase = require('./base.js');

class ViewVideo extends PotatoBase {
  class_name() { return "ViewVideo"; }

  static async New(tab) {
    const p = new ViewVideo(tab);
    await p.init(
        tab,
        '//*[@aria-label="Edit video"]//*[contains(text(), "Edit video")]'
    );
    return p;
  }

  async editVideoMetadata() {
    this.log("Click 'Edit video'.");
    await this.clickButton({
        xpath: '//*[@aria-label="Edit video"]//*[contains(text(), "Edit video")]',
        expectNav: true
    });
    return await EditVideoMetadata.New(this.giveAwayTab());
  }
};

module.exports = exports = ViewVideo;
