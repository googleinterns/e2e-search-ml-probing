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

const AnonymousHome = require("../page/anonymous_home.js")
const assertType = require("../util/assert_type.js")

// Returns {urlVideoId, studioVideos}
//  urlVideoId: string id.
//  studioVideos: An instance of StudioVideos currently loaded in the tab.
module.exports = exports = async function (
	tab,
	username,
	password,
	title,
	description
) {
	assertType.objects({ tab })
	assertType.strings({ username, password, title, description })

	await AnonymousHome.goto(tab)
	const anonHome = await AnonymousHome.New(tab)
	const personalHome = await anonHome.login(username, password)
	const yourVideos = await personalHome.goToYourVideos()
	return await yourVideos.uploadVideo({ title, description })
}
