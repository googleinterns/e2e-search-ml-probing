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

const assertType = require("./util/assert_type.js")
const backoff = require("./util/backoff.js")
const browser = require("./browser.js")
const Base = require("./base.js")
const config = require("./config.js")
const path = require("path")
const readJson = require("r-json")
const credentials = readJson(path.resolve(__dirname, "credentials.json"))
const {randomStringGen} = require("./util/title_token")

const loginAndUpload = require("./sequence/login_and_upload.js")
const AnonymousHome = require("./page/anonymous_home.js")

module.exports = class MeasureUploadAndUpdateDelay extends Base {
	class_name() {
		return "MeasureUploadAndUpdateDelay"
	}

	async run(socket, headless = false) {
		if(credentials.username === "YOUR_EMAIL" || credentials.password === "YOUR_PASSWORD"){
			this.log("ERROR: make sure to set your youtube account that has a youtube channel")
			return
		}

		var browserWindow = await browser.Window.New(headless)

		var title = randomStringGen(20)
		this.log(title)
		const videoDescription = title
		const normalTab = await browserWindow.newTab()

		this.log("Login and upload video in normal tab.")
		const { urlVideoId, studioVideos } = await loginAndUpload(
			normalTab,
			credentials.username,
			credentials.password,
			title,
			videoDescription
		)

		if(urlVideoId == null){
			this.log("something went wrong when was uploading the video")
			return
		}

		await browserWindow.close()

		var browserWindow = await browser.Window.New(headless)

		const newDescription = randomStringGen(50)
		var newPrivacyStatus = Math.random() > 0.5 ? "private" : "public"

		var tab = await browserWindow.newTab()

		this.log("wait 2 minutes so everyone can found the video")
		await tab.waitFor(120000) 

		await this.updateDescription({
			tab,
			title,
			newDescription,
			newPrivacyStatus,
		})
		
		socket.emit("upload-video-and-update-server", title, urlVideoId, newDescription, newPrivacyStatus === "public")
	}

	async updateDescription(args) {
		const { tab, title, newDescription, newPrivacyStatus } = args
		assertType.object(tab)
		assertType.string(title)
		assertType.string(newDescription)
		assertType.string(newPrivacyStatus)

		await AnonymousHome.goto(tab)
		let x = await AnonymousHome.New(tab)
		x = await x.login(credentials.username, credentials.password)
		x = await x.goToYourVideos()
		x = await x.clickOnVideo(title)
		let editVideoMetadata = await x.editVideoMetadata()

		this.log("Set new privacy status")
		await editVideoMetadata.setPrivacyStatus(newPrivacyStatus)
		this.log("Set new description")
		await editVideoMetadata.setDescription(newDescription)
		await editVideoMetadata.clickSave()
	}
}