E2E search ml probing
==============================================

This project was created by Sebastien Biollo during 2020 internship at Google

Goal
----

Creating an end to end prober that performs predefined user flows and measures their effect and latency in youtube search, to discover if there are any problems.

System requirements
------------------------

* NodeJS
* Puppeteer

Install dependencies
--------------------

- Install `Nodejs` and `npm` (or `yarn`) on your machine
- Run `npm run install-dep` (or `yarn install-dep`) to install all the dependencies of the project

Usage
-----

### Client:
```
client [command]

Commands:
    client upload-basic   Upload a random video and search it unitl all ips found it
    client upload-update  Upload a random video, wait for the upload, update the video (change title, description etc.) and then search it
    client upload-days    Upload a random video and keep searching for it for 3 days

Options:
    --version          Show version number                               		 [boolean]
    --webserver, --ws  Run local web server to show graphs of the data collected [boolean]
    --help, -h         Show help                                         		 [boolean]
```
Example: `node client upload-basic`

### Server:

Run `npm run server` (or `yarn server`)

Project Directory Structure
---------------------------

* `./server/`
  * The folder where puppeteer is running to upload and/or update a video

* `./client/`
  * A ReactJS page where some graphs are displayed to better visualized data from the prober

* `server.js`
  * A webserver waiting for socket connections from the clients

* `client.js`
  * A simple CLI where to make request to the server and where to run the prober