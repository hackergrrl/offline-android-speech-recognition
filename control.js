const WebSocket = require('ws')
const spawn = require('child_process').spawnSync
const net = require('net')
const path = require('path')

const State = {
  DISCONNECTED: 'DISCONNECTED',
  OFF: 'OFF',
  READY: 'READY',
  RESULTS: 'RESULTS'
}
let sockets = []
let timeout = null
let state
let ws

function connect () {
  // Ensure ADB ports are being forwarded.
  spawn(path.join(process.cwd(), 'init.sh'))

  ws = new WebSocket('ws://0.0.0.0:9002')
  ws.once('close', () => {
    ws = null
    setState(State.DISCONNECTED)
    setTimeout(connect, 5000)
  })
  ws.once('error', console.error)
  ws.once('open', function open () {
    ws.send(JSON.stringify({ type: 'mode', mode: 'control' }))
    setState(State.OFF)
    console.log('Connected to WebSocket server.')
  })
  ws.on('message', function message (data) {
    data = JSON.parse(data.toString())
    if (data.type === 'result') {
      writeAll(data.text.toLowerCase())
      setState(State.OFF)
    } else if (state !== State.OFF && data.type === 'oninput') {
      setState(State.RESULTS)
      timeout = setTimeout(() => {
        setState(State.OFF)
      }, 1400)
    }
  })
}

function tapCentre () {
  spawn('adb', 'shell input tap 500 1400'.split(' '))
}

function setState (s) {
  if (timeout) clearTimeout(timeout)
  timeout = null
  state = s
  if (ws) ws.send(JSON.stringify({ type: 'state-ctl', state }))
}

function writeAll (msg) {
  sockets.forEach(s => s.write(msg))
}

net.createServer((socket) => {
  console.log('Incoming connection.')
  sockets.push(socket)
  socket.on('close', () => {
    console.log('Connection lost.')
    sockets = sockets.filter(s => s !== socket)
  })
  socket.on('data', buf => {
    const text = buf.toString().trim()
    if (text === 'listen') {
      if (state === State.DISCONNECTED) {
        writeAll('ERROR: control server unable to connect to Android device')
        return
      }
      tapCentre()
      setState(State.READY)
      timeout = setTimeout(() => {
        writeAll('nevermind')
        setState(State.OFF)
      }, 5000)
    }
  })
}).listen(9003, err => {
  if (err) throw err
  console.log('Listening on http://localhost:9003')
})

setState(State.DISCONNECTED)
connect()

