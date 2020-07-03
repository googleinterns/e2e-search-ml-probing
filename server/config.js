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

Object.assign(exports, {
	baseUrl: "http://www.youtube.com",
	studioBaseUrl: "http://studio.youtube.com",
	puppeteerViewportOptions: { width: 1200, height: 800 },

	waitForUpdateGiveUpAfter_s: 60 * 60 * 4,
	waitForUpdateInitialBackoff_s: 4,

	// Some very hacky/fragile bits of code use this to wait for an event to
	// happen.  TODO: Consider changing any use of this to a different strategy.
	hopeIsAStrategyTimeout_ms: 3000,
	fastHopeIsAStrategyTimeout_ms: 500,

	// Somewhat hacky code uses this to wait and make sure navigation does not
	// occur when clicking on something that shouldn't navigate to another page.
	// TODO: Consider changing any use of this to a different strategy.
	dontNavTimeout_ms: 1000,
})
