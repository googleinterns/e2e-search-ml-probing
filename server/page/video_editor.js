const AudioEdit = require("./audio_edit.js")
const parseDurationUtil = require("../util/parse_duration.js")
const PotatoBase = require("./base.js")

class VideoEditor extends PotatoBase {
	class_name() {
		return "VideoEditor"
	}

	static async New(tab) {
		const p = new VideoEditor()
		await p.init(
			tab,
			'//h1[contains(@class, "page-title") and contains(text(), "Video editor")]'
		)
		return p
	}

	async verify() {
		// Clicks the annoying "Get started" button or if it doesn't show up then
		// don't throw an error, just assume that it was skipped this time.
		this.log("Click 'Get started' button.")
		try {
			await this.clickButton(
				'//ytcp-button[contains(@label, "Get started")]//div[contains(text(), "Get started")]'
			)
		} catch (e) {
			this.log("Editor 'Get started' button click failed, ignoring: " + e)
		}

		await super.verify()
	}

	// This tab remains unchanged and still usable, a new tab is opened and the
	// AudioEdit object responsible for it is returned.
	async openAudioEditTab() {
		this.log("Click audio edit button.")
		await this.clickButton(
			'//ytve-audio-editor-timeline[@id="AUDIO"]//iron-icon[contains(@class, "ytcp-icon-button")]'
		)

		await this.tab().waitFor(3000) // TODO: workaround lamely necessary sleep.

		let audioEditPagePromise = new Promise((resolve) =>
			this.tab().once("popup", resolve)
		)
		this.log("Click another audio edit button to open pop-up.")
		await this.clickButton(
			'//ytcp-button[@id="audio-deep-link-button" and contains(@label, "+ Audio")]'
		)
		let audioEditPage = await audioEditPagePromise
		return await AudioEdit.New(audioEditPage)
	}

	// Randomly trim between 20% and 80% of the original length by dragging the
	// mouse on the right trim marker towards the left.
	//
	// Returns new duration in seconds.
	//
	// TODO: feels very fragile, find another way.
	async trimToRandomDuration() {
		await this.clickButton(
			'//ytcp-button[@id="trim-button"]//div[contains(text(), "Trim")]'
		)
		// Get the left and right trim markers and their locations.
		await this.tab().waitForXPath("//ytve-trim-marker")
		const trimMarkers = await this.tab().$x("//ytve-trim-marker")
		if (trimMarkers.length != 2) {
			throw new Error(
				"Unexpected number of trim markers: " + trimMarkers.length
			)
		}
		const [leftTrim, rightTrim] = trimMarkers

		const leftBox = await leftTrim.boundingBox()
		const rightBox = await rightTrim.boundingBox()
		const leftCenterX = leftBox.x + (leftBox.width >> 1)
		const rightCenterX = rightBox.x + (rightBox.width >> 1)
		const rightCenterY = rightBox.y + (rightBox.height >> 1)

		const randomTargetX =
			leftCenterX +
			(rightCenterX - leftCenterX) * (Math.random() * 0.6 + 0.2)
		await this.tab().mouse().move(rightCenterX, rightCenterY, { steps: 10 })
		await this.tab().mouse().down()
		await this.tab().mouse().move(randomTargetX, rightCenterY)
		await this.tab().mouse().up()

		// Click just above where we have scrolled to in order to move the
		// "playhead" to the same location, then read the playhead's label
		// which contains the duration we're now trimming to.
		// TODO: horribly hacky way to get the length that we've trimmed to,
		// even for already being inside of a horrible hack.
		await this.tab()
			.mouse()
			.click(randomTargetX, rightBox.y - 15)
		const playhead = await this.tab().waitForXPath(
			'//ytve-playhead[@id="playhead"]'
		)
		const playheadTime = await playhead.evaluate((x) =>
			x.getAttribute("aria-label")
		)
		// TODO: this won't handle minutes.
		const rematch = playheadTime.match(/^Playhead ([0-9:]+)$/)
		if (rematch == null || rematch.length != 2) {
			throw new Error("Unexpected playhead aria-label: " + playheadTime)
		}
		const newDuration_s = parseDurationUtil.hhmmssffToSeconds(rematch[1])

		// Now click save.
		await this.clickButton(
			'//ytcp-button//*[contains(.//text(), "Preview")]'
		)
		await this.clickButton(
			'//ytcp-button[@id="save-button"]//div[contains(.//text(), "Save")]'
		)
		await this.clickButton(
			'//ytcp-button[@dialog-confirm and @label="Save"]//*[contains(.//text(),"Save")]'
		)

		await this.tab().waitForXPath(
			'//*[contains(.//text(), "Video is being processed")]'
		)

		return newDuration_s
	}
}

module.exports = exports = VideoEditor
