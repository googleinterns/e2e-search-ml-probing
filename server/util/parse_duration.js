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

const assertType = require("./assert_type.js")

function postSplitCommon(parts) {
	let total = 0
	for (let i = 0; i < 3 && parts.length > 0; ++i) {
		const partStr = parts.pop()
		const part = parseInt(partStr)
		if (isNaN(part)) {
			throw new Error("Unexpected duration format (2): " + s)
		}
		total += part * 60 ** i
	}
	if (parts.length > 0) {
		throw new Error("Unexpected duration format (3): " + s)
	}
	return total
}

// Expects hh:mm:ss:ff, mm:ss:ff, or ss:ff.
exports.hhmmssffToSeconds = function (s) {
	assertType.string(s)
	const parts = s.split(":")
	if (parts.length < 1) {
		throw new Error("Unexpected duration format: " + s)
	}
	// Ignore the frames.
	parts.pop()
	return postSplitCommon(parts)
}

// Expects hh:mm:ss, mm:ss, or ss.
exports.hhmmssToSeconds = function (s) {
	assertType.string(s)
	return postSplitCommon(s.split(":"))
}
