import React, { Component } from 'react';
import io from 'socket.io-client';
import { gapi } from 'gapi-script'
import {
    Button, Divider, List, ListItem, ListItemIcon,
    Collapse, FormLabel, RadioGroup, FormControlLabel, Radio, TextField, FormHelperText
} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import SearchIcon from '@material-ui/icons/Search';
import VideoLibraryIcon from '@material-ui/icons/VideoLibrary';

import "./Home.css"
import { palette } from "./style/Palette"

import Graphs from "./Graphs"

const CLIENT_ID = '994292200466-n6us8ptgeda5u5579sgd3k7svibeh5ag.apps.googleusercontent.com'
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest']
const SCOPES = "https://www.googleapis.com/auth/youtube"

var socket = null
// var server_url = process.env.NODE_ENV === 'production' ? "seba.c.googlers.com" : "localhost:4001"
var server_url = process.env.NODE_ENV === 'production' ? "localhost:5000" : "localhost:5000"

class Home extends Component {
    constructor(props) {
        super(props)
        this.state = {
            logged: false,
            
            myVideos: null,

            open: false,
            privacyStatus: "",

            search: "",

            helperTextListItem: "",

            actionGraph: "",
            startGraphs: false,
            graphData: [],
        }
        this.initClient = this.initClient.bind(this)
        this.handleClientLoad = this.handleClientLoad.bind(this)
        this.updateSigninStatus = this.updateSigninStatus.bind(this)
        this.getUpdate = this.getUpdate.bind(this)
    }

    componentDidMount() {
        this.handleClientLoad()
    }

    handleClientLoad() {
        gapi.load('client:auth2', this.initClient)
    }
    initClient() {
        gapi.client.init({
            discoveryDocs: DISCOVERY_DOCS,
            clientId: CLIENT_ID,
            scope: SCOPES
        })
            .then(() => {
                gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus)
                this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get())

                if (socket === null) {
                    gapi.auth2.getAuthInstance().grantOfflineAccess().then((data) => {
                        this.connectionServer(data.code)
                    })
                }
            })
            .catch((e) => {
                console.log(e)
            })
    }

    connectionServer(token) {
        socket = io.connect(server_url, { secure: true })

        socket.on('connect', () => {
            socket.emit("token", token)

            socket.on("my-videos", this.getMyVideos)

            socket.on("update-graphs", this.updateGraphs)

            socket.on("update-graphs-finished", this.finishedUpdateGraphs)
        })
    }

    getMyVideos = (myVideos) => {
        this.setState({
            myVideos
        })
    }

    updateGraphs = (country, succesful, timeRequest, timeFromStart) => {
        // country, res === true, parseInt(EndRequest - startRequest), parseInt(EndRequest - start)

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

    }

    getUpdate = () => {
        return this.state.graphData
    }

    updateSigninStatus(isSignedIn) {
        this.setState({
            logged: isSignedIn
        })

        if (socket === null && isSignedIn === true) {
            gapi.auth2.getAuthInstance().grantOfflineAccess().then((data) => {
                this.connectionServer(data.code)
            })
        }
    }

    handleAuthClick() {
        gapi.auth2.getAuthInstance().signIn()
    }
    handleSignoutClick() {
        gapi.auth2.getAuthInstance().signOut()
        socket.disconnect()
        socket = null
    }

    render() {
        if(this.state.startGraphs === true){
            return (
                <Graphs getUpdate={this.getUpdate} title={this.state.actionGraph}/>
            )
        }
        return (
            <div>
                {this.state.logged === false ?
                    <div>
                        You need to log in with a google account
                        <Button style={{backgroundColor: palette.red}}
                            onClick={() => {
                                this.handleAuthClick()
                            }}>Log in</Button>
                    </div>
                    :
                    <div>
                        <Button style={{backgroundColor: palette.red}}
                            onClick={() => {
                                this.handleSignoutClick()
                            }}>Log out</Button>

                        <List
                            component="nav"
                            aria-labelledby="nested-list-subheader"
                            style={{ width: "100%" }}>
                            <ListItem button className="item-list" alignItems="center"
                                onClick={() => {
                                    this.setState({
                                        startGraphs: true,
                                        actionGraph: "Searching a random uploaded video"
                                    })
                                    socket.emit("upload-video")
                                }}>
                                <ListItemIcon>
                                    <CloudUploadIcon fontSize="large"/>
                                </ListItemIcon>
                                <p style={{marginRight: "20px"}}>Upload a random video</p>
                            </ListItem>
                            <Divider />
                            <ListItem className="item-list" alignItems="center">
                                <ListItemIcon>
                                    <SearchIcon fontSize="large"/>
                                </ListItemIcon>
                                <p style={{marginRight: "20px"}}>Search video by keyword</p>

                                <TextField
                                    label="Keyword"
                                    variant="outlined"
                                    value={this.state.search}
                                    onChange={(e) => {
                                        this.setState({
                                            search: e.target.value
                                        })
                                    }}
                                />

                                <Button style={{backgroundColor: palette.blue, margin: "20px"}}
                                    onClick={() => {
                                        socket.emit("search", this.state.search, "public")
                                        this.setState({
                                            search: "",
                                            startGraphs: true,
                                            actionGraph: `Searching ${this.state.search}`
                                        })
                                    }}>Search</Button>

                            </ListItem>
                            <Divider />
                            <ListItem button className="item-list" alignItems="center"
                                onClick={() => {
                                this.setState({
                                    open: !this.state.open
                                }, () => {
                                    if (this.state.open === true && socket !== null && this.state.myVideos === null) {
                                        socket.emit("my-videos")
                                    }
                                })
                            }}>
                                <ListItemIcon>
                                    <VideoLibraryIcon fontSize="large"/>
                                </ListItemIcon>
                                <p style={{marginRight: "20px"}}>My video list</p>

                                {this.state.open ? <ExpandLess /> : <ExpandMore />}
                            </ListItem>
                            <Collapse in={this.state.open} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {this.state.myVideos && this.state.myVideos.length > 0 && this.state.myVideos.map((item, idx) => {
                                        var videoId = item.snippet.resourceId.videoId
                                        var title = item.snippet.title

                                        return (
                                            <div key={item.id} style={{paddingLeft: "40px", paddingTop: "20px"}}>
                                                <TextField
                                                    label="Title"
                                                    defaultValue={title}
                                                    value={title}
                                                    variant="outlined"
                                                    onChange={(e) => {
                                                        title = e.target.value
                                                    }}
                                                />

                                                <FormLabel component="legend">Privacy Status</FormLabel>
                                                <RadioGroup row value={this.state.privacyStatus} onChange={(e) => {
                                                    this.setState({
                                                        privacyStatus: e.target.value
                                                    })
                                                }}>
                                                    <FormControlLabel value="public" control={<Radio />} label="public" />
                                                    <FormControlLabel value="private" control={<Radio />} label="private" />
                                                </RadioGroup>
                                                <FormHelperText>{this.state.helperTextListItem}</FormHelperText>

                                                <iframe width="auto" height="auto"
                                                    src={`https://www.youtube.com/embed/${item.snippet.resourceId.videoId}`}
                                                    frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
                                                
                                                <div style={{display: "flex", flexDirection: "row"}}>
                                                    <Button style={{backgroundColor: palette.green, margin: "20px", marginLeft: "0px"}}
                                                        onClick={() => {

                                                            if(this.state.privacyStatus === ""){
                                                                return this.setState({
                                                                    helperTextListItem: "Please select an option for privacy status"
                                                                })
                                                            }
                                                            if(title === ""){
                                                                return this.setState({
                                                                    helperTextListItem: "Please insert a title"
                                                                })
                                                            }
                                                            this.setState({
                                                                startGraphs: true,
                                                                actionGraph: `Searching ${title}`
                                                            })

                                                            socket.emit("save-and-search", title, this.state.privacyStatus, videoId)

                                                        }}>Save changes</Button>

                                                    <Button style={{backgroundColor: palette.blue, margin: "20px", marginLeft: "0px"}}
                                                        onClick={() => {

                                                            if(this.state.privacyStatus === ""){
                                                                return this.setState({
                                                                    helperTextListItem: "Please select an option for privacy status"
                                                                })
                                                            }
                                                            if(title === ""){
                                                                return this.setState({
                                                                    helperTextListItem: "Please insert a title"
                                                                })
                                                            }
                                                            this.setState({
                                                                startGraphs: true,
                                                                actionGraph: `Searching ${title}`
                                                            })

                                                            socket.emit("search", title, this.state.privacyStatus)
                                                        }}>Start Search</Button>
                                                </div>

                                                <Divider style={{backgroundColor: "#212121"}}/>
                                            </div>
                                        )
                                    })}
                                </List>
                            </Collapse>
                        </List>
                    </div>
                }
            </div>
        )
    }
}

export default Home;