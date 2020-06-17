import React from "react"
import { withStyles, InputLabel, MenuItem, FormControl, Select } from '@material-ui/core';

const styles = theme => ({
	root: {
		background: "#F7F7F9"
	},
	formControl: {
		margin: theme.spacing(),
		minWidth: 120
	},
	colorPrimary: {
		color: "#0efda6"
	},
	selectors: {
		display: "flex",
		justifyContent: "space-between",
	}
})

class SortSelection extends React.Component {
	render() {
		const { classes, handleChange, sortTypeVal } = this.props
		return (
			<div className={classes.selectors}>
				<FormControl className={classes.formControl}>
					<InputLabel htmlFor="">Sort by</InputLabel>
					<Select value={sortTypeVal} onChange={handleChange("sortType")}>
						<MenuItem className={classes.root} value={1}>Lowest</MenuItem>
						<MenuItem value={2}>Highest</MenuItem>
						<MenuItem value={3}>Alphabetize</MenuItem>
						<MenuItem value={4}>Last Inserted</MenuItem>
					</Select>
				</FormControl>
			</div>

		)
	}
}

export default withStyles(styles)(SortSelection)


