const config = require("../config.js")

const PotatoBase = require("./base.js")

// The search results page after searching on the anonymous home page
// (http://youtube.com when you're not logged in).
class AnonymousSearchResults extends PotatoBase {
	class_name() {
		return "AnonymousSearchResults"
	}

	static async New(tab) {
		const p = new AnonymousSearchResults()
		await p.init(tab, '//ytd-search[@role="main"]//div[@id="filter-menu"]')
		return p
	}

	// Returns array of objects in the form { href, title }.
	async getResults() {
		let results = []
		try {
			await this.tab().waitForXPath(
				'//a[@id="video-title" and contains(@href, "/watch?v=")]',
				{
					timeout: config.fastHopeIsAStrategyTimeout_ms,
				}
			)
		} catch (e) {
			this.log("Found no results.")
			return results
		}
		const resultLinks = await this.tab().$x(
			'//a[@id="video-title" and contains(@href, "/watch?v=")]'
		)
		for (const resultLink of resultLinks) {
			results.push(
				await resultLink.evaluate((x) => {
					return {
						href: x.href,
						title: x.querySelector("yt-formatted-string")
							.textContent,
					}
				})
			)
		}
		return results.map((x) => {
			const rematch = x.href.match(/.*\/watch\?v=(.*)$/)
			if (
				rematch == null ||
				rematch.length != 2 ||
				rematch[1].length != 11
			) {
				throw new Error("Search result href not as expected: " + x.href)
			}
			return { title: x.title, urlVideoId: rematch[1] }
		})
	}
}

module.exports = exports = AnonymousSearchResults
