#!/bin/sh
set -ex

# check that all the dependecies are installed
if ! which npm > /dev/null; then
    echo -e "npm not found, install it before continuing. If you are using ubuntu should be: sudo apt-get install npm"
    exit
fi
if ! which python3 > /dev/null; then
    echo -e "python3 not found, install it before continuing. If you are using ubuntu should be: sudo apt-get install python3"
    exit
fi
if ! which pip3 > /dev/null; then
    echo -e "pip3 not found, install it before continuing. If you are using ubuntu should be: sudo apt-get install pip3"
    exit
fi
if ! which node > /dev/null; then
    echo -e "nodejs not found, install it before continuing. If you are using ubuntu should be: sudo apt-get install nodejs"
    exit
fi
if ! which ffmpeg > /dev/null; then
    echo -e "ffmpeg not found, install it before continuing. If you are using ubuntu should be: sudo apt-get install ffmpeg"
    exit
fi

# dependencies for npm
echo 'Installing dependencies for npm'
npm install && cd server && npm install && cd ../client && npm install && cd ../

# dependencies for python
echo 'Installing dependencies for python'
pip3 install numpy opencv-python

echo 'Done!'