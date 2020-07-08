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

const assertType = require("../util/assert_type.js")
const config = require("../config.js")
const PotatoBase = require("./base.js")
const studio_videos = require("./studio_videos.js")
const VideoEditor = require("./video_editor.js")

class StudioEditVideo extends PotatoBase {
	class_name() {
		return "StudioEditVideo"
	}

	static async goto(tab, urlVideoId) {
		await tab.goto(`${config.studioBaseUrl}/video/${urlVideoId}/edit`)
	}

	static async New(tab) {
		const p = new StudioEditVideo()
		await p.init(tab, '//h1[contains(text(), "Video details")]')
		return p
	}

	// Returns StudioVideos instance.
	async deleteVideo() {
		this.log("Delete video.")
		this.log("  Click ... menu button.")
		await this.clickButton(
			'//ytcp-video-overflow-menu[@id="video-overflow-menu"]//iron-icon'
		)
		this.log("  Click delete.")
		await this.clickButton(
			'//*[@test-id="VIDEO_DELETE"]//yt-formatted-string[contains(text(), "Delete")]'
		)
		this.log("  Confirm that I understand what 'delete' means.")
		await this.clickButton('//*[@id="delete-dialog"]//*[@id="checkbox"]')
		this.log("  Yet again confirm by clicking 'Delete forever'.")
		await this.clickButton(
			'//*[@id="delete-confirm-button"]//*[contains(text(), "Delete forever")]'
		)
		return await studio_videos.StudioVideos.New(this.giveAwayTab())
	}

	async goToEditor() {
		await this.clickButton('//a[@tooltip-text="Editor"]')
		return await VideoEditor.New(this.giveAwayTab())
	}
}

module.exports = exports = StudioEditVideo
