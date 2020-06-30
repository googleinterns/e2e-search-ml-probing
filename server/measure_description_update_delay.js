const assertType = require("./util/assert_type.js")
const backoff = require("./util/backoff.js")
const browser = require("./browser.js")
const Base = require("./base.js")
const config = require("./config.js")

// Pages.
const AnonymousHome = require("./page/anonymous_home.js")
const AnonymousWatch = require("./page/anonymous_watch.js")

// TODO: consider making a TestVideo class to record info about videos used for
// testing.
const videoTitle = "magic mountain manta close up"
const urlVideoId = "xBa0KxrQ85U"

class MeasureDescriptionUpdateDelay extends Base {
	class_name() {
		return "MeasureDescriptionUpdateDelay"
	}

	async run() {
		const browserWindow = await browser.Window.New()

		const newDescription = "test description " + new Date().toISOString()

		let tab = await browserWindow.newTab()
		await this.loginAndUpdateDescription({
			tab,
			title: videoTitle,
			newDescription,
		})

		const incogWindow = await browserWindow.newIncognitoWindow()
		let incogTab = await incogWindow.newTab()
		await this.waitForDescriptionWithBackoff({
			tab: incogTab,
			newDescription,
		})
	}

	async loginAndUpdateDescription(args) {
		const { tab, title, newDescription } = args
		assertType.object(tab)
		assertType.string(title)
		assertType.string(newDescription)

		await AnonymousHome.goto(tab)
		let x = await AnonymousHome.New(tab)
		x = await x.login(config.username, config.password)
		x = await x.goToYourVideos()
		x = await x.clickOnVideo(title)
		let editVideoMetadata = await x.editVideoMetadata()

		this.log("Set new description with timestamp.")
		await editVideoMetadata.setDescription(newDescription)
		await editVideoMetadata.clickSave()
	}

	async waitForDescriptionWithBackoff(args) {
		const { tab, newDescription } = args
		assertType.object(tab)
		assertType.string(newDescription)

		await AnonymousWatch.goto(tab, urlVideoId)
		let watchPage = await AnonymousWatch.New(tab, urlVideoId)

		this.log("Waiting for new description to appear...")
		this.log(`  New description: ${newDescription}`)

		const result = await backoff.exponential({
			initialBackoff_s: config.waitForUpdateInitialBackoff_s,
			giveUpAfter_s: config.waitForUpdateGiveUpAfter_s,

			attemptFunc: async () => {
				this.log("  Checking...")
				await watchPage.pauseIfPlaying()
				const existingDescription = await watchPage.getDescription()

				if (existingDescription === newDescription) {
					return true
				}
				this.log("  Found wrong description: " + existingDescription)
				return false
			},

			resetFunc: async () => {
				await watchPage.reload()
			},
		})

		if (result.ok) {
			this.log(
				"  Successfully found new description with delay: " +
					`${result.delay_s}s (${result.delay_s / 60.0}m).`
			)
		} else {
			this.log(
				"  New description never found to go live after: " +
					`${result.delay_s}s (${result.delay_s / 60.0}m).`
			)
		}
	}
}

new MeasureDescriptionUpdateDelay().run()
