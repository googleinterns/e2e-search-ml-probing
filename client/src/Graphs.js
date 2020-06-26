import React, { Component } from 'react';
import BarChartGraph from './BarChart/BarChartGraph'
import LineGraph from './LineGraph/LineGraph'
import io from 'socket.io-client';
import Grid from '@material-ui/core/Grid';

var socket = null

class Graphs extends Component {
    constructor(props) {
		super(props)
		
		this.state = {
			graphData: []
		}
	}
	
	componentDidMount() {
		this.connectionServer()
	}
	
	connectionServer() {
        socket = io.connect("http://localhost:9001", { secure: true })

        socket.on('connect', () => {
            socket.on("update-graphs", this.updateGraphs)
            socket.on("update-graphs-finished", this.finishedUpdateGraphs)
        })
	}
	
	updateGraphs = (country, succesful, timeRequest, timeFromStart) => {
		// country, res === true, parseInt(EndRequest - startRequest), parseInt(EndRequest - start)
		console.log(country, succesful, timeRequest, timeFromStart)

        this.setState({
            graphData: [...this.state.graphData, {
                id: this.state.graphData.length,
                country,
                succesful,
                timeRequest,
                timeFromStart
            }]
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
                <div style={{textAlign: "center"}}>
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

export default Graphs;