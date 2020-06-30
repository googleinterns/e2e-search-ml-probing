
const path = require('path');

const backoff = require('./util/backoff.js');
const browser = require('./browser.js');
const config = require('./config.js');
const titleTokenUtil = require('./util/title_token.js');

const Base = require('./base.js');

// Pages.
const AnonymousHome = require('./page/anonymous_home.js');

const videoTitlePrefix = "Take down delay test video.";
const videoDescription =
    "Test video to ensure take downs are happening and within a" +
    " reasonable amount of time.  Has copyrighted music in the" +
    " background on purpose.";

const videoFilePath =
    path.resolve("./test_videos/beatles_takedown_test_video.mp4");
 

class MeasureTakeDownDelay extends Base {
  class_name() { return "MeasureTakeDownDelay"; }

  async run() {
    const browserWindow = await browser.Window.New();

    const titleToken = titleTokenUtil.generate();
    const title = videoTitlePrefix + " - " + titleToken;

    //// Login ////
    this.log("Login in a normal tab.");
    const normalTab = await browserWindow.newTab();
    await AnonymousHome.goto(normalTab);
    const anonHome = await AnonymousHome.New(normalTab);
    const personalHome = await anonHome.login(config.username, config.password);

    //// Upload ////
    this.log("Upload video in normal tab.");
    const yourVideos = await personalHome.goToYourVideos();
    const {urlVideoId, studioVideos} = await yourVideos.uploadVideo({
        filePath: videoFilePath,
        title,
        description: videoDescription,
    });
    if (urlVideoId === null) {
      this.log("Upload happened but with a problem, maybe a duplicate.");
      return;
    }
    this.log("Successful upload: urlVideoId=" + urlVideoId);

    try {
      await this.waitToShowAsBlocked(studioVideos, titleToken);
    } finally {
      await this.deleteToCleanUp(studioVideos, urlVideoId);
    }
  }

  async waitToShowAsBlocked(studioVideos, titleToken) {
    let attemptNum = 0;
    const result = await backoff.exponential({
      initialBackoff_s: config.waitForUpdateInitialBackoff_s,
      giveUpAfter_s: config.waitForUpdateGiveUpAfter_s,

      attemptFunc: async () => {
        attemptNum += 1;
        const visibility =
            await studioVideos.getVisibilityWithTitleToken(titleToken);
        switch (visibility) {
          case "Blocked":
            return true;

          case "Pending":
          case "Public":
            this.log(`  Attempt ${attemptNum}: ` +
                     `Failed: visibility '${visibility}' not 'Blocked'.`);
            return false;

          default:
            throw new Error("Unexpected visibility: " + visibility);
        }
      },

      resetFunc: async () => {
        await studioVideos.reload();
      },
    });

    if (result.ok) {
      this.log("Successfully found 'Blocked' visibility after: " +
               `${result.delay_s}s (${result.delay_s / 60.0}m)`);
    } else {
      this.log("Failure, video still not 'Blocked' after: " +
               `${result.delay_s}s (${result.delay_s / 60.0}m)`);
    }
  }

  async deleteToCleanUp(studioVideos, urlVideoId) {
    this.log("Delete video to clean-up after ourselves.");
    const editVideo = await studioVideos.clickVideoWithUrlVideoId(urlVideoId);
    const studioVideosAgain = await editVideo.deleteVideo();
  }

};

new MeasureTakeDownDelay().run();
