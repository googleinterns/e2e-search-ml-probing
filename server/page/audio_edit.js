
const PotatoBase = require('./base.js');

class AudioEdit extends PotatoBase {
  class_name() { return "AudioEdit"; }

  static async New(tab) {
    const p = new AudioEdit();
    await p.init(
      tab,
      '//button[@id="audio-tracks-save-changes-button" and contains(text(), "Save changes")]'
    );
    return p;
  }

  async saveChanges() {
    this.log("Click 'Save changes' button.");
    await this.clickButton(
        '//button[@id="audio-tracks-save-changes-button" and contains(text(), "Save changes")]');

    this.log("Click another 'Save' button to confirm.");
    await this.clickButton(
        '//div[contains(@class, "yt-dialog-fg")]//button[@data-action="save"]//*[contains(text(), "Save")]');
  }
};

module.exports = exports = AudioEdit;
