/*
Apache header:

  Copyright 2020 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

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

	async setPrivacyStatus(newPrivacyStatus) {
		await this.clickButton(
			'//div[@id="container" and @class="visibility-visible style-scope ytcp-video-metadata-visibility"]'
		)
		if(newPrivacyStatus === "public") {
			await this.clickButton(
				'//paper-radio-button[@name="PUBLIC"]//*[contains(.//text(),"Public")]'
			)
		} else {
			await this.clickButton(
				'//paper-radio-button[@name="PRIVATE"]//*[contains(.//text(),"Private")]'
			)
		}
		await this.clickButton(
			'//ytcp-button[@id="save-button" and @class="style-scope ytcp-video-visibility-edit-popup"]//*[contains(.//text(),"Done")]'
		)
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
