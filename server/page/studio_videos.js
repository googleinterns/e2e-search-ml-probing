// TODO: document export strategy, especially since this file is different than
// others like it because the StudioVideos page can be opened with the upload
// dialog already opened, see UploadPrompt.

const assertType = require("../util/assert_type.js")
const PotatoBase = require("./base.js")
const StudioEditVideo = require("./studio_edit_video.js")
const fs = require("fs")
const path = require("path")
const { spawn } = require("child_process")

class StudioVideos extends PotatoBase {
	class_name() {
		return "studio_videos.StudioVideos"
	}

	static async New(tab) {
		const p = new StudioVideos()
		await p.init(tab, '//h1[contains(text(), "Channel videos")]')
		return p
	}

	// Returns an array an element per listed video of the form:
	//    {title, urlVideoId}.
	async getListedVideos() {
		const theXPath = '//a[@id="video-title"]'
		await this.tab().waitForXPath(theXPath)
		const aTags = await this.tab().$x(theXPath)
		let results = []
		for (const aTag of aTags) {
			const d = await aTag.evaluate((x) => {
				return { href: x.href, textContent: x.textContent }
			})

			let r = {
				title: d.textContent.trim(),
				urlVideoId: null,
			}
			if (d.href && !d.href.endsWith("/undefined")) {
				const rematch = d.href.match(/^.*\/video\/(.*)\/edit$/)
				if (!rematch || rematch.length != 2) {
					throw new Error("Unexpected href value: " + d.href)
				}
				r.urlVideoId = rematch[1]
			}
			results.push(r)
		}
		return results
	}

	// TODO: change to return an array of all matching IDs, then use this to GC
	// duplicates in tests.
	async getUrlVideoIdForTitle(title) {
		const listed = await this.getListedVideos()
		const matching = listed
			.filter((x) => x.title === title)
			.map((x) => x.urlVideoId)
		if (matching.length == 0) {
			throw new Error("No matching videos for title: " + title)
		}
		if (matching.length > 1) {
			throw new Error("More than one video match for title: " + title)
		}
		return matching[0]
	}

	// TODO: make this also return the StudioEditVideo page like below, call-site
	// needs modification.
	async clickVideoWithTitle(title) {
		await this.clickButton(
			`//div[@id="video-thumbnail"]//a[id="thumbnail-anchor" and contains(@aria-label,"${title}")]//img[id="img-with-fallback")]`
		)
	}

	async clickVideoWithUrlVideoId(urlVideoId) {
		await this.clickButton(
			`//div[@id="video-thumbnail"]//a[@id="thumbnail-anchor" and contains(@href,"/video/${urlVideoId}/edit")]//img[@id="img-with-fallback"]`
		)
		return StudioEditVideo.New(this.giveAwayTab())
	}

	async getVisibilityWithTitleToken(titleToken) {
		await this.tab().waitForXPath("//ytcp-video-row")
		const rows = await this.tab().$x("//ytcp-video-row")
		const matchingRows = []
		for (const row of rows) {
			const rowVideoTitle = await row.evaluate((r) =>
				r.querySelector("a#video-title").textContent.trim()
			)
			if (rowVideoTitle.match(titleToken) != null) {
				matchingRows.push(row)
			}
		}

		if (matchingRows.length == 0) {
			throw new Error("Title with token not found in video list.")
		}
		if (matchingRows.length > 1) {
			throw new Error(
				"More than one title with token found in video list."
			)
		}

		return await matchingRows[0].evaluate((r) =>
			r
				.querySelector("div.tablecell-visibility")
				.textContent.replace(/\W/g, "")
		)
	}
}

exports.StudioVideos = StudioVideos

class UploadPrompt extends PotatoBase {
	class_name() {
		return "studio_videos.UploadPrompt"
	}
	static verifyXPath() {
		return '//*[@id="select-files-button"]//*[contains(text(), "Select file")]'
	}

	static async New(tab) {
		const p = new UploadPrompt()
		await p.init(tab, UploadPrompt.verifyXPath())
		return p
	}

	// See ConfigureNewUpload.configure() for additional args and return value.
	async uploadVideo(args) {
		const { title } = args
		assertType.string(title)

		const pathVideo = path.resolve("./test_videos/", title + ".mp4")
		const pathImg = path.resolve("./test_videos/", title + ".png")

		const createVideo = new Promise((resolve, reject) => {
			const python = spawn("python3", ["./gen_video.py", title])
			python.stdout.on("data", function (data) {})

			python.on("close", async () => {
				this.log("Check if the video has been created")
				try {
					if (fs.existsSync(pathVideo) && fs.existsSync(pathImg)) {
						this.log("Video created!")
					} else {
						reject(
							"Error on creating the video, check that gen_video.py is working"
						)
					}
				} catch (err) {
					reject(
						"Error on creating the video, check that gen_video.py is working"
					)
				}

				this.log("Actually do the upload!")
				const inputTypeFile = await this.tab().waitForXPath(
					// TODO: better selector for upload input.
					'//input[@type="file" and @name="Filedata"]'
				)
				await inputTypeFile.uploadFile(pathVideo)

				const configUpload = await ConfigureNewUpload.New(
					this.giveAwayTab()
				)
				var videoRes = await configUpload.configure(args)

				fs.unlinkSync(pathVideo)
				fs.unlinkSync(pathImg)

				resolve(videoRes)
			})
		})

		var res = null
		await createVideo
			.then((data) => {
				res = data
				return data
			})
			.catch((err) => {
				throw new Error(err)
			})
		return res
	}
}

exports.UploadPrompt = UploadPrompt

class ConfigureNewUpload extends PotatoBase {
	class_name() {
		return "studio_videos.ConfigureNewUpload"
	}

	static async New(tab) {
		const p = new ConfigureNewUpload()
		await p.init(
			tab,
			'//div[@id="textbox" and @aria-label="Add a title that describes your video"]'
		)
		return p
	}

	// Returns {urlVideoId, studioVideos} where urlVideoId is for the just
	// uploaded video and studioVideos is an instance of StudioVideos since
	// that's the page we're dropped into after upload.
	async configure(args) {
		const { title, description } = args
		assertType.string(title)
		assertType.string(description)

		this.log("Fill in title.")
		const titleBox = await this.tab().waitForXPath(
			'//div[@id="textbox" and @aria-label="Add a title that describes your video"]'
		)
		await titleBox.type(
			"flaky race workaround, type garbage then replace it"
		)
		await titleBox.evaluate((x) => (x.textContent = ""))
		await titleBox.type(title)

		this.log("Fill in description.")
		const descriptionBox = await this.tab().waitForXPath(
			'//div[@id="textbox" and @aria-label="Tell viewers about your video"]'
		)
		await descriptionBox.type(description)

		this.log("Not child specific content.")
		await this.clickButton(
			'//paper-radio-button[@name="NOT_MADE_FOR_KIDS"]//div[@id="radioLabel"]'
		)

		this.log("Click next button twice.")
		const nextButtonXPath =
			'//ytcp-button[@id="next-button"]//div[contains(text(), "Next")]'
		await this.clickButton(nextButtonXPath)
		await this.clickButton(nextButtonXPath)

		this.log("Select public publication")
		await this.clickButton(
			'//paper-radio-button[@name="PUBLIC"]//div[@id="radioLabel"]'
		)

		this.log("Finally publish it!")
		await this.clickButton(
			'//ytcp-button[@id="done-button"]//div[contains(text(), "Publish")]'
		)

		this.log("Get newly created video watch url.")

		// There are 2 possibilities:
		// 1) The video is still processing and we get the "Video processing"
		//    dialog that needs to be closed.
		// 2) Or the video finished processing and we get a dialog giving a link to
		//    the newly processed video watch page.  This second dialog can just be
		//    closed so that both paths are similar.
		// TODO: put sleep in configuration to test that this actually works for
		// the second case.
		try {
			await this.clickButton(
				'//ytcp-button[@id="close-button"]//div[contains(text(), "Close")]'
			)
		} catch (e) {
			// Ignore because maybe this pop-up didn't show up.
		}
		const studioVideos = await StudioVideos.New(this.giveAwayTab())
		const urlVideoId = await studioVideos.getUrlVideoIdForTitle(title)
		return { urlVideoId, studioVideos }
	}
}
