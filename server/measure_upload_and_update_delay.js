const assertType = require("./util/assert_type.js")
const backoff = require("./util/backoff.js")
const browser = require("./browser.js")
const Base = require("./base.js")
const config = require("./config.js")
const {randomStringGen} = require("./util/title_token")

const loginAndUpload = require("./sequence/login_and_upload.js")
const AnonymousHome = require("./page/anonymous_home.js")

class MeasureUploadAndUpdateDelay extends Base { // module.exports = 
	class_name() {
		return "MeasureUploadAndUpdateDelay"
	}

	async run(socket, headless = false) {
		var browserWindow = await browser.Window.New(headless)

		var title = randomStringGen(20)
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

		if(urlVideoId == null){
			this.log("something went wrong when was uploading the video")
			return
		}

		await browserWindow.close()

		var browserWindow = await browser.Window.New(headless)

		const newDescription = randomStringGen(50)
		var newPrivacyStatus = Math.random() > 0.5 ? "private" : "public"

		var tab = await browserWindow.newTab()
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
		x = await x.login(config.username, config.password)
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

new MeasureUploadAndUpdateDelay().run()