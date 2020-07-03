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

const PotatoBase = require("./base.js")

class AudioEdit extends PotatoBase {
	class_name() {
		return "AudioEdit"
	}

	static async New(tab) {
		const p = new AudioEdit()
		await p.init(
			tab,
			'//button[@id="audio-tracks-save-changes-button" and contains(text(), "Save changes")]'
		)
		return p
	}

	async saveChanges() {
		this.log("Click 'Save changes' button.")
		await this.clickButton(
			'//button[@id="audio-tracks-save-changes-button" and contains(text(), "Save changes")]'
		)

		this.log("Click another 'Save' button to confirm.")
		await this.clickButton(
			'//div[contains(@class, "yt-dialog-fg")]//button[@data-action="save"]//*[contains(text(), "Save")]'
		)
	}
}

module.exports = exports = AudioEdit
