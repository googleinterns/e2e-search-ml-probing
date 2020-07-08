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

// Pages
const AnonymousSearchResults = require("./anonymous_search_results.js")
const PotatoBase = require("./base.js")
const PersonalHome = require("./personal_home.js")

// The anonymous home page, http://youtube.com when you're not logged in.
class AnonymousHome extends PotatoBase {
	class_name() {
		return "AnonymousHome"
	}

	static async goto(tab) {
		await tab.goto(config.baseUrl)
	}

	static async New(tab) {
		const p = new AnonymousHome()
		await p.init(tab, '//*[@id="text" and contains(text(), "Sign in")]')
		return p
	}

	// Returns a PersonalHome.
	async login(username, password) {
		const tab = this.tab()

		this.log("Click sign in.")
		await this.clickButton({
			xpath: '//*[@id="text" and contains(text(), "Sign in")]',
			expectNav: true,
		})

		const askUsername = await UsernamePrompt.New(this.giveAwayTab())
		const askPassword = await askUsername.enterUsername(username)
		return await askPassword.enterPassword(password)
	}

	async search(query) {
		assertType.string(query)

		const searchBox = await this.tab().waitForXPath(
			'//input[@id="search" and @aria-label="Search"]'
		)
		await searchBox.type(query)
		await searchBox.press("Enter")

		return await AnonymousSearchResults.New(this.giveAwayTab())
	}
}

class UsernamePrompt extends PotatoBase {
	class_name() {
		return "anonymous_home.UsernamePrompt"
	}

	static async New(tab) {
		const p = new UsernamePrompt()
		await p.init(tab, '//input[@id="identifierId" and @type="email"]')
		return p
	}

	// Returns PasswordPrompt instance.
	async enterUsername(username) {
		this.log("Enter username (email address).")
		let emailField = await this.tab().waitForXPath(
			'//input[@id="identifierId" and @type="email"]'
		)
		await emailField.type(username)
		const naving = this.tab().waitForNavigation({
			waitUntil: "networkidle2",
		})
		await emailField.press("Enter")
		await naving
		return await PasswordPrompt.New(this.giveAwayTab())
	}
}

class PasswordPrompt extends PotatoBase {
	class_name() {
		return "anonymous_home.PasswordPrompt"
	}

	static async New(tab) {
		const p = new PasswordPrompt()
		await p.init(tab, '//*[@id="password"]//input[@type="password"]')
		return p
	}

	async enterPassword(password) {
		this.log("Enter password.")

		let pwField = await this.tab().waitForXPath(
			'//*[@id="password"]//input[@type="password"]'
		)

		// TODO: This is still necessary, got "click1 failed" many times.
		let pwCoverMessage = await this.tab().waitForXPath(
			'//*[@id="password"]//div[contains(text(), "Enter your password")]'
		)
		try {
			await pwCoverMessage.click()
		} catch (e) {
			this.log("click1 failed: " + e)
		}
		try {
			await pwField.click()
		} catch (e) {
			this.log("click2 failed: " + e)
		}

		// TODO: Sadly necessary, tab not ready otherwise, find better way.
		await this.tab().waitFor(1000)

		await pwField.type(password)
		let naving = this.tab().waitForNavigation()
		await pwField.press("Enter")
		await naving

		return await PersonalHome.New(this.giveAwayTab())
	}
}

module.exports = exports = AnonymousHome
