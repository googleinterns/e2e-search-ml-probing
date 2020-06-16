import React, { Component } from "react"
import { withStyles, Button } from '@material-ui/core';
import { palette } from "../style/Palette"
import SortSelection from "./SortSelection"
import { BarChart, ReferenceLine, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, Label } from "recharts"

const styles = theme => ({
	chart: {
		marginBottom: theme.spacing(6)
	},
	root: {
		top: "20px"
	},
	hide: {
		display: "none"
	},
	label: {
		zIndex: "9"
	},
	sortOption: {
		float: "right"
	},
	axis: {
		fontSize: "10px !important"
	}
})

class SocialExpenditureGraph extends Component {
	constructor(props) {
		super(props)
		this.state = {
			dataset: [],
			filterData: [],
			sortType: 4,
			heightContainer: 500,
			average: 0,
		}

		this.selectSortType = this.selectSortType.bind(this)
	}

	componentDidMount() {
		this.interval = setInterval(() => {
			var data = this.props.getUpdate()
			if(this.state.dataset.length < data.length){

				let sum = data.reduce((a, b) => a.timeRequest + b.timeRequest)

				this.setState({
					dataset: data,
					heightContainer: this.state.heightContainer+(5*data.length),
					average: sum/data.length
				}, () => {
					this.sortDataSet(this.state.sortType)
				})
			}
		}, 500)
	}

	componentWillUnmount() {
		clearInterval(this.interval)
	}

	sortDataSet(type) {
		const dataSet = this.state.dataset
		let sortedData
		switch (type) {
			default:
			case 1:
				sortedData = dataSet.sort((a, b) => Number(a.timeRequest) - Number(b.timeRequest))
				break
			case 2:
				sortedData = dataSet.sort((a, b) => Number(b.timeRequest) - Number(a.timeRequest))
				break
			case 3:
				sortedData = dataSet.sort((a, b) => a.country.localeCompare(b.country))
				break
			case 4:
				sortedData = dataSet.sort((a, b) => Number(b.id) - Number(a.id))
				break
		}
		this.setState({ 
			filterData: sortedData
		})
	}

	selectSortType = name => event => {
		event.stopPropagation()
		this.setState({ 
			[name]: event.target.value 
		}, () => {
			this.sortDataSet(event.target.value)
		})
	}

	render() {
		const classes = this.props.classes
		return (
			<div className={classes.chart}>
				<SortSelection
					sortTypeVal={this.state.sortType}
					handleChange={this.selectSortType}
				/>

				<div style={{overflowY: "auto", overflowX: "auto", height: "auto", width: "100%", maxHeight: "600px"}}>
					<ResponsiveContainer className={classes.charts} width="100%" height={this.state.heightContainer}>
						<BarChart
							data={this.state.filterData}
							layout="vertical"
							className={classes.root}>

							<XAxis padding={{ left: 10 }} unit="ms"
								tick={{ fontSize: "13px", color: palette.darkgrey }} 
								type="number" dataKey="timeRequest">
							</XAxis>

							<YAxis padding={{ bottom: 10, left: 10 }}
								tick={{ fontSize: "13px", color: palette.darkgrey }}
								type="category" dataKey="country">
							</YAxis>
							<Tooltip cursor={{ fillOpacity: 0.3 }} itemStyle={{ fontSize: "13px", color: palette.blue }} />
							<Bar type="number" dataKey="timeRequest" unit="ms"
								label={{ fill: palette.darkgrey, fontSize: 10, position: "right" }}>
								{this.state.filterData.map((item, index) => {
									const color = item.succesful === true
										? palette.green
										: palette.red
									return <Cell key={index} fill={color} />
								})}
							</Bar>
							<ReferenceLine x={this.state.average} strokeDasharray="2 2"
								stroke={palette.yellow}>
								<Label position="top">
									{`Average ${this.state.average}ms`}
								</Label>
							</ReferenceLine>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		)
	}
}

export default withStyles(styles)(SocialExpenditureGraph)
