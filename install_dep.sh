# check that all the dependecies are installed
if ! which npm > /dev/null; then
    echo -e "npm not found, install it before continuing. If you are using ubuntu should be: sudo apt-get install npm"
fi
if ! which python3 > /dev/null; then
    echo -e "python3 not found, install it before continuing. If you are using ubuntu should be: sudo apt-get install python3"
fi
if ! which node > /dev/null; then
    echo -e "nodejs not found, install it before continuing. If you are using ubuntu should be: sudo apt-get install nodejs"
fi
if ! which ffmpeg > /dev/null; then
    echo -e "ffmpeg not found, install it before continuing. If you are using ubuntu should be: sudo apt-get install ffmpeg"
fi

# dependencies for npm
echo 'Installing dependencies for npm'
npm install && cd server && npm install && cd ../client && npm install && cd ../

# dependencies for python
echo 'Installing dependencies for python'
pip install numpy opencv-python

echo 'Done!'