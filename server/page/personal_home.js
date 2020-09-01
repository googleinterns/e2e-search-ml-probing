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
const YourVideos = require("./your_videos.js")
const StudioDashboard = require("./studio_dashboard.js")

class PersonalHome extends PotatoBase {
	class_name() {
		return "PersonalHome"
	}

	static async New(tab) {
		const p = new PersonalHome()
		await p.init(
			tab,
			// '//span[@id="title" and contains(text(), "Recommended")]'
		)
		return p
	}

	async goToYourVideos() {
		this.log("Check if 'your videos' is displaying or hidden.")
		try {
			await this.tab().waitForXPath(
				'//a[@id="endpoint" and @title="Your videos"]//*[contains(text(), "Your videos")]',
				{ timeout: config.hopeIsAStrategyTimeout_ms }
			)
		} catch (e) {
			// 'Your videos' button is probably not showing because of the smaller
			// viewport, click the menu hamburger to show it.

			this.log("'Your videos' not yet showing, click on menu hamburger.")
			await this.clickButton(
				'//button[@id="button" and @aria-label="Guide"]'
			)
		}

		this.log("Click on 'your videos'.")
		await this.clickButton({
			xpath:
				'//a[@id="endpoint" and @title="Your videos"]//*[contains(text(), "Your videos")]',
			expectNav: true,
		})

		return await YourVideos.New(this.giveAwayTab())
	}

	async goToStudioDashboard() {
		const avMenu = await this.openAvatarMenu()
		return await avMenu.clickYouTubeStudio()
	}

	async openAvatarMenu() {
		await this.clickButton(
			'//button[@id="avatar-btn"]//img[@alt="Avatar image"]'
		)
		return await AvatarMenu.New(this.giveAwayTab())
	}
}

module.exports = exports = PersonalHome

class AvatarMenu extends PotatoBase {
	class_name() {
		return "AvatarMenu"
	}

	static async New(tab) {
		const p = new AvatarMenu()
		await p.init(
			tab,
			'//a[@id="endpoint"]//yt-formatted-string[contains(text(), "YouTube Studio")]'
		)
		return p
	}

	async clickYouTubeStudio() {
		this.clickButton({
			xpath:
				'//a[@id="endpoint"]//yt-formatted-string[contains(text(), "YouTube Studio")]',
			expectNav: true,
		})
		return StudioDashboard.New(this.giveAwayTab())
	}
}
