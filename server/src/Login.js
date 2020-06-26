import React, { Component } from 'react';
import { gapi } from 'gapi-script'
import { Button } from '@material-ui/core';
import { palette } from "./style/Palette"

const CLIENT_ID = '994292200466-n6us8ptgeda5u5579sgd3k7svibeh5ag.apps.googleusercontent.com'
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest']
const SCOPES = "https://www.googleapis.com/auth/youtube"

var server_url = "https://youtube.sebastienbiollo.com"

class Login extends Component {
    constructor(props) {
        super(props)

        this.state = {
            logged: false
        }

        this.initClient = this.initClient.bind(this)
        this.handleClientLoad = this.handleClientLoad.bind(this)
        this.updateSigninStatus = this.updateSigninStatus.bind(this)
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

                gapi.auth2.getAuthInstance().grantOfflineAccess().then((data) => {
                    this.sendToken(data.code)
                })
            })
            .catch((e) => {
                console.log(e)
            })
    }

    sendToken(token) {
        var data = {
            token: token
        }
        fetch(server_url + "/token", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then(data => data.json())
			.then(data => {
                window.close()
            })
			.catch((error) => {
				console.error('Error:', error)
			})
    }

    updateSigninStatus(isSignedIn) {
        this.setState({
            logged: isSignedIn
        })

        if (isSignedIn === true) {
            gapi.auth2.getAuthInstance().grantOfflineAccess().then((data) => {
                this.sendToken(data.code)
            })
        }
    }

    handleAuthClick() {
        gapi.auth2.getAuthInstance().signIn()
    }
    handleSignoutClick() {
        gapi.auth2.getAuthInstance().signOut()
    }
    
	render() {
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
                    </div>
                }
            </div>
        )
	}
}

export default Login;