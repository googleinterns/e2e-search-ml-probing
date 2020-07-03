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

const Base = require("./base.js")
const browser = require("./browser.js")
const config = require("./config.js")
const path = require("path")
const readJson = require("r-json")
const credentials = readJson(path.resolve(__dirname, "credentials.json"))
const loginAndUpload = require("./sequence/login_and_upload.js")

const {randomStringGen} = require("./util/title_token")

module.exports = class MeasureUploadGoLiveDelay extends Base {
	class_name() {
		return "MeasureUploadGoLiveDelay"
	}

	async run(socket, headless = true) {
		const browserWindow = await browser.Window.New(headless)

		const title = randomStringGen(20)
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

		if (urlVideoId == null) {
			this.log("Problem uploading, no urlVideoId returned, giving up.")
			return await browserWindow.close()
		}

		socket.emit("upload-video-server", title, urlVideoId)

		return await browserWindow.close()
	}
}