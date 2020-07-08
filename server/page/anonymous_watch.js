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
const parseDurationUtil = require("../util/parse_duration.js")
const PotatoBase = require("./base.js")

const pauseButtonXPath =
	'//button[contains(@class, "ytp-play-button") and contains(@title, "Pause")]'

// A video watch page, not logged in.
class AnonymousWatch extends PotatoBase {
	class_name() {
		return "AnonymousWatch"
	}

	static async goto(tab, urlVideoId) {
		await tab.goto(config.baseUrl + `/watch?v=${urlVideoId}`)
	}

	static async New(tab, urlVideoId) {
		assertType.object(tab)
		assertType.string(urlVideoId)

		const p = new AnonymousWatch()
		await p.init(
			tab,
			'//div[contains(@class, "html5-video-container")]//video[contains(@class, "video-stream")]'
		)
		return p
	}

	// If the video starts playing, pause it.
	//
	// Complications:
	// - The same button is used for play and pause, but the title attribute
	//   changes to whatever the button would do when pressed.
	// - When the page is loading, it seems like it's paused, but then at some
	//   point in the future, it unpauses...but only sometimes.
	pauseIfPlaying() {
		this.log("Async pause: Register handler.")
		this.tab()
			.waitForXPath(pauseButtonXPath)
			.then(async () => {
				const tab = this.tabMaybeNull()
				if (tab == null || tab.isClosed()) {
					this.log("Async pause: no longer relevant.")
					return
				}
				await this.clickButton(pauseButtonXPath)
				this.log("Async pause: clicked pause successfully.")
			})
			.catch(() => {
				this.log(
					"Async pause: never found pause button, hopefully already paused."
				)
			})
	}

	async pauseIfPlayingHelper_() {
		try {
			await this.clickButton(pauseButtonXPath)
			this.log("Async pause: Clicked pause successfully.")
		} catch (e) {
			this.log("Async pause: Click failed: " + e)
			await tab.waitFor(config.fastHopeIsAStrategyTimeout_ms)
			tab.waitForXPath(pauseButtonXPath).then(() => {
				this.pauseIfPlayingHelper_()
			})
		}
	}

	async getDescription() {
		const descriptionElement = await this.tab().waitForXPath(
			'//div[@id="meta-contents"]//div[@id="description"]/yt-formatted-string'
		)
		return await descriptionElement.evaluate((x) => x.textContent)
	}

	async getDuration_s() {
		const durationSpan = await this.tab().waitForXPath(
			'//span[contains(@class, "ytp-time-duration")]'
		)
		const durationString = await durationSpan.evaluate((x) => x.textContent)
		return parseDurationUtil.hhmmssToSeconds(durationString.trim())
	}
}

module.exports = exports = AnonymousWatch
