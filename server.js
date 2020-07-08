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

const express = require("express")
const http = require("http")
const app = express()
const path = require("path")
const readJson = require("r-json")

var config = readJson(path.resolve(__dirname, "config.json"))

var server = http.createServer(app)
var io = require("socket.io")(server)

// measure classes that uses puppeteer with the test account:
// MeasureUploadGoLiveDelay to upload the video
// MeasureUploadAndUpdateDelay to upload a video, and change the description and the privacy status randomly
const MeasureUploadGoLiveDelay = require("./server/measure_upload_go_live_delay.js")
const MeasureUploadAndUpdateDelay = require("./server/measure_upload_and_update_delay.js")

// wait connections from the clients
io.on("connection", function (socket) {
	socket.on("upload-video", () => {
		new MeasureUploadGoLiveDelay().run(socket, config.HEADLESS)
	})

	socket.on("upload-video-and-update", () => {
		new MeasureUploadAndUpdateDelay().run(socket, config.HEADLESS)
	})

	socket.on("disconnect", () => {})
})

server.listen(config.SERVER_PORT, () => {
	console.log("listening on port", config.SERVER_PORT)
})