const config = require("../config.js")
const PotatoBase = require("./base.js")
const VideoEditor = require("./video_editor.js")

class EditVideoMetadata extends PotatoBase {
	class_name() {
		return "EditVideoMetadata"
	}

	async init(tab, verifyXpath) {
		super.init(tab, verifyXpath)
		this.descriptionBox_ = await this.tab().waitForXPath(
			'//div[@id="textbox" and @contenteditable="true" and contains(@aria-label, "Tell viewers about your video")]'
		)
	}

	static async New(tab) {
		const p = new EditVideoMetadata()
		await p.init(
			tab,
			// TODO: remove when that's ok to do.
			'//div[@id="textbox" and @contenteditable="true" and contains(@aria-label, "Tell viewers about your video")]'
		)
		return p
	}

	async getDescription() {
		return await this.descriptionBox_.evaluate((x) => x.textContent)
	}

	async setDescription(newContent) {
		await this.descriptionBox_.evaluate((x) => {
			x.textContent = ""
		})
		await this.descriptionBox_.type(newContent)
	}

	async clickSave() {
		this.log("Click 'Save' button.")
		await this.clickButton(
			'//ytcp-button[@label="Save"]//*[contains(text(), "Save")]'
		)
		// TODO: sleep is lame, change to detection of successful save.
		await this.tab().waitFor(config.hopeIsAStrategyTimeout_ms)
	}

	async videoEditor() {
		this.log("Open editor.")
		await this.clickButton(
			'//a[@tooltip-text="Editor" and contains(@href, "/editor")]'
		)
		return await VideoEditor.New(this.giveAwayTab())
	}
}

module.exports = exports = EditVideoMetadata
