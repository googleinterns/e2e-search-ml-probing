import React from 'react'
import { palette } from "../style/Palette"

import { LineChart, CartesianGrid, Line, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

class LineGraph extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			dataset: [],
		}
	}

	componentDidMount() {
		this.interval = setInterval(() => {
			var data = this.props.getUpdate()
			if (this.state.dataset.length < data.length) {

				data.sort((a, b) => Number(a.id) - Number(b.id))

				let counterSuccesses = 0
				let counterFailures = 0
				for (let a = 0; a < data.length; ++a) {
					if (data[a].succesful === true) {
						counterSuccesses++
						data[a]['numRequests'] = counterSuccesses
						
						data[a]['successes'] = counterSuccesses
						data[a]['failures'] = counterFailures
					} else {
						counterFailures++
						data[a]['numRequests'] = counterFailures

						data[a]['successes'] = counterSuccesses
						data[a]['failures'] = counterFailures
					}

					if(a === data.length-1) { // to prevent that the for loop finish after the setState
						this.setState({
							dataset: data,
						})
					}
				}
			}
		}, 500)
	}

	componentWillUnmount() {
		clearInterval(this.interval)
	}

	render() {
		return (
			<div>
				<ResponsiveContainer width="100%" height={700}>
					<LineChart data={this.state.dataset} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
						<XAxis dataKey="timeFromStart" tick={{ fontSize: '11px' }} unit="ms" label="Time from the beginning" />
						<YAxis dataKey="numRequests" tick={{ fontSize: '11px' }} label="Number requests"/>
						<CartesianGrid strokeDasharray="3 3" />
						<Tooltip />
						<Legend />
						<Line type="monotone" dataKey="successes" stroke={palette.green} />
						<Line type="monotone" dataKey="failures" stroke={palette.red} />
						<Line type="monotone" dataKey="country" stroke={palette.blue} />
					</LineChart>
				</ResponsiveContainer>
			</div>
		)
	}
}

export default LineGraph;