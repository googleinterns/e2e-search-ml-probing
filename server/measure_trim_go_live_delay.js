const AnonymousHome = require("./page/anonymous_home.js")
const AnonymousWatch = require("./page/anonymous_watch.js")
const backoff = require("./util/backoff.js")
const Base = require("./base.js")
const browser = require("./browser.js")
const config = require("./config.js")
const loginAndUpload = require("./sequence/login_and_upload.js")
const StudioEditVideo = require("./page/studio_edit_video.js")

// Pages.

// The video to use.
const videoFilePath = "./test_videos/magic_mountain_manta_close_up.webm"
const videoTitle = "magic mountain manta close up"
const videoDescription =
	"A close encouter freediving with a mantas at Magic Mountain."

// If video durations are within this amount they are considered the same.
const durationFudge_s = 1.1

class MeasureTrimGoLiveDelay extends Base {
	class_name() {
		return "MeasureTrimGoLiveDelay"
	}

	async run() {
		const browserWindow = await browser.Window.New()

		let normalTab = await browserWindow.newTab()
		this.log("Login and upload video in normal tab.")
		const { urlVideoId, studioVideos } = await loginAndUpload(
			normalTab,
			config.username,
			config.password,
			videoFilePath,
			videoTitle,
			videoDescription
		)

		if (urlVideoId == null) {
			// TODO: will need some way of GCing.
			this.log("Problem uploading, no urlVideoId returned, giving up.")
			return
		}

		try {
			this.log("Go to video editor.")
			const studioEditVideo = await studioVideos.clickVideoWithUrlVideoId(
				urlVideoId
			)
			const videoEditor = await studioEditVideo.goToEditor()

			this.log(
				"Perform random trim between 20% and 80% of total duration."
			)
			const newDuration_s = await videoEditor.trimToRandomDuration()

			this.log("Wait for trim to appear in incognito watch page.")
			const incogWindow = await browserWindow.newIncognitoWindow()
			let incogTab = await incogWindow.newTab()
			await this.waitForVideoHasDuration(
				incogTab,
				urlVideoId,
				newDuration_s
			)
		} finally {
			this.log("Delete video.")
			// Don't recycle the tab, causes problems when leaving mid-edit with
			// "Are you sure you want to leave" dialog.
			const deleteTab = await browserWindow.newTab()
			await StudioEditVideo.goto(deleteTab, urlVideoId)
			const studioEditVideo = await StudioEditVideo.New(deleteTab)
			const studioVideos2 = await studioEditVideo.deleteVideo()
			this.log("Done.")
		}
	}

	async waitForVideoHasDuration(tab, urlVideoId, newDuration_s) {
		await AnonymousWatch.goto(tab, urlVideoId)
		const watchPage = await AnonymousWatch.New(tab, urlVideoId)

		this.log("Waiting for video to be new length.")

		let attemptNum = 0
		const result = await backoff.exponential({
			initialBackoff_s: Math.max(
				32,
				config.waitForUpdateInitialBackoff_s
			),
			giveUpAfter_s: config.waitForUpdateGiveUpAfter_s,

			attemptFunc: async () => {
				attemptNum += 1
				this.log(`  Attempt ${attemptNum}`)
				await watchPage.pauseIfPlaying()
				const currentDuration_s = await watchPage.getDuration_s()
				if (
					Math.abs(currentDuration_s - newDuration_s) <=
					durationFudge_s
				) {
					this.log("  Found correct duration.")
					return true
				}
				this.log(
					"  Found wrong duration: found=" +
						`${currentDuration_s} expecting=${newDuration_s}`
				)
				return false
			},

			resetFunc: async () => {
				await watchPage.reload()
			},
		})

		if (result.ok) {
			this.log(
				"  Successfully found correct length after: " +
					`${result.delay_s}s (${result.delay_s / 60.0}m).`
			)
		} else {
			this.log(
				"  Correct length never found to go live after: " +
					`${result.delay_s}s (${result.delay_s / 60.0}m).`
			)
		}
	}
}

new MeasureTrimGoLiveDelay().run()
