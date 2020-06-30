// Measures the upload go live delay for youtube video uploads.

const path = require("path")
const Base = require("./base.js")
const browser = require("./browser.js")
const config = require("./config.js")
const loginAndUpload = require("./sequence/login_and_upload.js")

function randomStringGen(length) {
	var result = ""
	var characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	var charactersLength = characters.length
	for (var i = 0; i < length; i++) {
		result += characters.charAt(
			Math.floor(Math.random() * charactersLength)
		)
	}
	return result
}

module.exports = class MeasureUploadGoLiveDelay extends Base {
	class_name() {
		return "MeasureUploadGoLiveDelay"
	}

	async run(socket, headless=true) {
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
			// TODO: will need some way of GCing.
			this.log("Problem uploading, no urlVideoId returned, giving up.")
			return await browserWindow.close()
		}

		socket.emit("upload-video-server", title, urlVideoId)

		return await browserWindow.close()
	}
}
