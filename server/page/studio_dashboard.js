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
const studio_videos = require("./studio_videos.js")

class StudioDashboard extends PotatoBase {
	class_name() {
		return "StudioDashboard"
	}

	static async New(tab) {
		const p = new StudioDashboard()
		await p.init(tab, '//h1[contains(text(), "Channel dashboard")]')
		return p
	}

	async goToVideos() {
		this.clickButton({
			xpath:
				'//ul[@id="main-menu"]//a[@tooltip-text="Videos"]//iron-icon',
			expectNav: true,
		})
		return await studio_videos.StudioVideos.New(this.giveAwayTab())
	}
}

module.exports = exports = StudioDashboard
