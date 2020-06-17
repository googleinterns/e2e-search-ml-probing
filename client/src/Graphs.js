import React, { Component } from 'react';
import BarChartGraph from './BarChart/BarChartGraph'
import LineGraph from './LineGraph/LineGraph'

import Grid from '@material-ui/core/Grid';

class Graphs extends Component {
    constructor(props) {
        super(props)
    }
    
	render() {
		return (
			<div>
                <div style={{textAlign: "center"}}>
                    <h1>{this.props.title}</h1>
                </div>
                
				<Grid container justify="center" spacing={2}>
					<Grid item xs={12} md={8}>
						<LineGraph getUpdate={this.props.getUpdate} />
					</Grid>
					<Grid item xs={12} md={4}>
                        <BarChartGraph getUpdate={this.props.getUpdate} />
                    </Grid>
				</Grid>
			</div>
		)
	}
}

export default Graphs;