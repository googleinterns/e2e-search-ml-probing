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

import React, { Component } from "react"
import BarChartGraph from "./BarChart/BarChartGraph"
import LineGraph from "./LineGraph/LineGraph"
import io from "socket.io-client"
import Grid from "@material-ui/core/Grid"
import config from "../../config.json"

var socket = null

class Graphs extends Component {
	constructor(props) {
		super(props)

		this.state = {
			graphData: [],
		}
	}

	componentDidMount() {
		this.connectionServer()
	}

	connectionServer() {
		socket = io.connect("http://localhost:"+config.CLIENT_WEBSERVER_PORT, { secure: true })

		socket.on("connect", () => {
			socket.on("update-graphs", this.updateGraphs)
			socket.on("update-graphs-finished", this.finishedUpdateGraphs)
		})
	}

	updateGraphs = (country, succesful, timeRequest) => {
		// country, res === true, parseInt(EndRequest - startRequest)
		this.setState({
			graphData: [
				...this.state.graphData,
				{
					id: this.state.graphData.length,
					country,
					succesful,
					timeRequest,
					timeFromStart: timeRequest,
				},
			],
		})
	}

	finishedUpdateGraphs = () => {
		socket.disconnect()
	}

	getUpdate = () => {
		this.state.graphData.sort((a, b) => Number(a.id) - Number(b.id))
		return this.state.graphData
	}

	render() {
		return (
			<div>
				<div style={{ textAlign: "center" }}>
					<h1>{this.props.title}</h1>
				</div>

				<Grid container justify="center" spacing={2}>
					<Grid item xs={12} md={8}>
						<LineGraph getUpdate={this.getUpdate} />
					</Grid>
					<Grid item xs={12} md={4}>
						<BarChartGraph getUpdate={this.getUpdate} />
					</Grid>
				</Grid>
			</div>
		)
	}
}

export default Graphs
