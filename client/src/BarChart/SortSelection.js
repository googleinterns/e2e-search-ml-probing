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

import React from "react"
import {
	withStyles,
	InputLabel,
	MenuItem,
	FormControl,
	Select,
} from "@material-ui/core"

const styles = (theme) => ({
	root: {
		background: "#F7F7F9",
	},
	formControl: {
		margin: theme.spacing(),
		minWidth: 120,
	},
	colorPrimary: {
		color: "#0efda6",
	},
	selectors: {
		display: "flex",
		justifyContent: "space-between",
	},
})

class SortSelection extends React.Component {
	render() {
		const { classes, handleChange, sortTypeVal } = this.props
		return (
			<div className={classes.selectors}>
				<FormControl className={classes.formControl}>
					<InputLabel htmlFor="">Sort by</InputLabel>
					<Select
						value={sortTypeVal}
						onChange={handleChange("sortType")}>
						<MenuItem className={classes.root} value={1}>
							Lowest
						</MenuItem>
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
