import React, { Component } from 'react';
import SocialExpenditureGraph from './SocialExpenditureGraph/SocialExpenditureGraph'
import TrafficLineGraph from './TrafficLineGraph/TrafficLineGraph'

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
						<TrafficLineGraph getUpdate={this.props.getUpdate} />
					</Grid>
					<Grid item xs={12} md={4}>
                        <SocialExpenditureGraph getUpdate={this.props.getUpdate} />
                    </Grid>
				</Grid>
			</div>
		)
	}
}

export default Graphs;