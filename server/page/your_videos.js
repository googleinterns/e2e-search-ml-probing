const assertType = require("../util/assert_type.js")
const config = require("../config.js")
const PotatoBase = require("./base.js")
const ViewVideo = require("./view_video.js")
const studio_videos = require("./studio_videos.js")

class YourVideos extends PotatoBase {
	class_name() {
		return "YourVideos"
	}

	static async New(tab) {
		const p = new YourVideos()
		await p.init(
			tab,
			'//yt-formatted-string[contains(text(), "Customize channel")]'
		)
		return p
	}

	async clickOnVideo(title) {
		this.log(`Click on video '${title}'`)
		await this.tab().waitFor(2000)
		await this.clickButton({
			xpath: `//a[@id="video-title" and @title="${title}"]`,
			expectNav: true,
		})
		return await ViewVideo.New(this.giveAwayTab())
	}

	// For args and return value, see studio_videos.UploadPrompt.uploadVideo().
	async uploadVideo(args) {
		this.log("Doing surprisingly fragile 'click upload button' sequence.")

		// TODO: figure out what's the problem here and try to simplify.
		const secondUploadButtonXPath =
			'//a[@href="/upload"]//yt-formatted-string[contains(text(), "Upload video")]'
		let secondUploadButton = null
		for (let i = 0; i < 2 && !secondUploadButton; ++i) {
			try {
				// Click the first button, but this can fail to reveal the second button.
				await this.clickButtonRaw(
					'//button[@aria-label="Create a video or post"]'
				)
				secondUploadButton = await this.tab().waitForXPath(
					secondUploadButtonXPath,
					{
						timeout: config.fastHopeIsAStrategyTimeout_ms,
					}
				)
			} catch (e) {
				this.log(`  Flaky button failed attempt ${i + 1} of 3.`)
				if (i == 2) {
					throw e
				}
			}
		}
		await secondUploadButton.click()

		this.log("  Fragile sequence successful, rejoyce.")
		const uploadPrompt = await studio_videos.UploadPrompt.New(
			this.giveAwayTab()
		)
		return await uploadPrompt.uploadVideo(args)
	}
}

module.exports = exports = YourVideos
