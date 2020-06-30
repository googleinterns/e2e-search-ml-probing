const puppeteer = require("puppeteer")

const AnonymousHome = require("./page/anonymous_home.js")
const config = require("./config.js")

class App {
	async run() {
		const browser = await puppeteer.launch({ headless: false })
		//const incogContext = await browser.createIncognitoBrowserContext();
		//const incogPage = await incogContext.newPage();

		let x = await AnonymousHome.New(browser)
		x = await x.login(config.username, config.password)
		x = await x.goToYourVideos()
		x = await x.clickOnVideo("magic mountain manta close up")
		let editVideoMetadata = await x.editVideoMetadata()

		this.log("Check description is as expected.")
		const existingDescription = await editVideoMetadata.getDescription()
		let rematch = existingDescription.match(/^test description (.+)$/)
		if (rematch == null || rematch.length != 2) {
			throw new Error(
				"Description isn't as expected: " + existingDescription
			)
		}
		const timestampRaw = Date.parse(rematch[1])
		if (isNaN(timestampRaw)) {
			throw new Error(
				"Description timestamp is invalid: " + existingDescription
			)
		}

		this.log("Set new description with timestamp.")
		await editVideoMetadata.setDescription(
			"test description " + new Date().toISOString()
		)

		await editVideoMetadata.clickSave()
		x = await editVideoMetadata.videoEditor()
		const audioEditPage = await x.openAudioEditTab()

		this.log("Get 'Add to video' button array")
		let addToVideoButtonsXPath =
			'//span[contains(@class, "add-track-label") and contains(text(), "Add to video")]'
		await audioEditPage.page().waitForXPath(addToVideoButtonsXPath)
		let addToVideoButtons = await audioEditPage
			.page()
			.$x(addToVideoButtonsXPath)
		if (addToVideoButtons.length <= 0) {
			throw new Error(
				"Couldn't find 'Add to video' buttons on audio editor page."
			)
		}

		this.log("Click randomly selected 'Add to video' button.")
		let randomAddVideoButton =
			addToVideoButtons[
				Math.round(Math.random() * addToVideoButtons.length)
			]
		await randomAddVideoButton.click()
		await audioEditPage.saveChanges()

		this.log("The End!")
	}

	log(msg) {
		console.log(msg)
	}
}

new App().run()
console.log("Set the App to run async")
