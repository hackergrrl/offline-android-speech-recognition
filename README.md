# Offline Android Speech Recognition

> Use a spare Android device to provide an offline speech recognition interface.

## Dependencies

### Physical
1. A Google Android device ("phone").
2. A machine on your local network to which the phone may be connected by USB ("server").

### Digital
Older versions of any of the following may work, but have not been tested.

#### Phone
1. Termux >= 0.118.0.
2. Node.JS >= 17.7.2.
3. NPM >= 8.5.2.
#### Computer
1. GNU Bash >= 5.1.4.
2. `adb` >= 1.0.41.
3. Node.JS >= 18.12.1. *Versions older than 4.0.0 will **definitely** not work.*

## Overview
### Background
My Google Pixel 1 phone comes with a feature on its default virtual keyboard for performing text transcription using speech recognition.

When an internet connection is detected, the phone will prefer to send my voice to Google's servers for text transcription. However, when the phone is offline, its built-in software is used for entirely local, offline speech recognition and text transcription. It would be very useful to have some means of accessing this for my own purposes.

### Problems
None of this functionality is exposed for programmatic control. The problems are these:

1. Recognition can only be initialized by manually tapping the microphone icon on the built-in virtual keyboard.
2. The text transcription will be written out to whatever text field happens to be focused.
3. These must both be done without giving the phone internet access.

### Solution
The first problem is solved by simulating the required user input, by connecting the phone to a **computer** and using `adb`, which has a sub-command for simulating a tap event at a particular X/Y coordinate: `adb shell input tap X Y`.

The second problem requires capturing the text written by the speech recognition virtual keyboard. This is done by giving focus to a `textarea` HTML `input` element, for the keyboard to write into, and whose text input can be detected by its `oninput` Javascript event. This HTML element is part of a **text capture web page** which is served by a Node.JS **web server** running on the Android phone itself, using the free software Termux. This local web server also runs a **WebSocket server**. The computer can then run a small **control server** that connects to the WebSocket server, and both receive the text transcriptions captured, and instruct the phone to listen for voice input.

Any machine on the network may then issue a request to the control server over TCP, which will trigger the necessary simulated screen taps to make the phone's start listening for speech, and then transmit back to the control server the text transcription captured, which is then passed on to the requester.

## Installation
### Phone
1. Install Termux. This is freely available without using the Google Play store, on [F-Droid][f-droid].
2. Install Node.JS using the command `pkg install nodejs`, run within a Termux terminal.
3. Clone this repository using Termux: `git clone https://github.com/hackergrrl/offline-android-speech-recognition`
4. Run the web server using Termux: `cd offline-android-speech-recognition; npm install; node server.js`
5. Open a web browser and navigate it to `http://localhost:9001`. *The background will turn blue to indicate a positive connection to the web server. Red indicates something is amiss.*
6. Tap on the text field to focus it and bring up the virtual keyboard.
7. Tap on the little microphone icon, ![microphone icon](mic-icon.png).
8. This will change the keyboard to a UI component with a large microphone icon:
![microphone keyboard](mic-keyboard.png).

7. The phone setup is now complete.

### Computer
1. Install all dependencies.
2. Clone this repository: `git clone https://github.com/hackergrrl/offline-android-speech-recognition`
3. Plug in the phone to the computer using a USB cable.
4. Run the included `init.sh` script to set up ADB port forwarding, so the control server can communicate with the WebSocket server.
5. Run `node control.js`, which will connect to the phone's WebSocket server.
6. Test the interface by running a command on your own computer like `netcat 192.168.1.103 9003`, to connect to the control server. Type `listen` and press enter. The phone's background will change from blue to green, indicating it is listening for voice input. The transcribed result (or an error) is written back.

## API
The control server exposes API access via a TCP server on port 9003. It accepts one command, terminated by a newline: `listen`. This cues the phone to listen for speech in the room or area. After the speech ends, the API will write back the text transcript in lower case. If there is an error, the text returned will be `ERROR: <text>`.

## Device Compatibility
|Device|Android Version|Works|Notes|
|---|---|---|---|
|Google Pixel 1|10|✅||

## Contributions
I would like to hear back from people about what devices and versions of Android do and do not work with this software, so that I might build out a more accurate compatibility table. Please open a Pull Request with the results of your own tests, or, better, any patches that add support for additional devices.

## Disclaimer
This was tested with a single device. There is a good chance it will not work as-is with other devices. The speech virtual keyboard interface may look or work differently, and devices with different pixel densities may result in the simulated tap coordinates in `control.js` not lining up.

## License
Copyright (c) 2023 Kira Oakley

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[f-droid]: https://f-droid.org

