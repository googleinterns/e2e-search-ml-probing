const Base = require("./base.js")
const browser = require("./browser.js")
const config = require("./config.js")
const loginAndUpload = require("./sequence/login_and_upload.js")

const {randomStringGen} = require("./util/title_token")

module.exports = class MeasureUploadGoLiveDelay extends Base {
	class_name() {
		return "MeasureUploadGoLiveDelay"
	}

	async run(socket, headless = true) {
		const browserWindow = await browser.Window.New(headless)

		const title = randomStringGen(20)
		const videoDescription = title
		const normalTab = await browserWindow.newTab()

		this.log("Login and upload video in normal tab.")
		const { urlVideoId, studioVideos } = await loginAndUpload(
			normalTab,
			config.username,
			config.password,
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