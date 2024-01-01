const http = require('http')
const fs = require('fs')
const WebSocket = require('ws')

const server = http.createServer((req, res) => {
  if (req.url === '/index.html' || req.url === '/') {
    fs.createReadStream('index.html').pipe(res)
  } else {
    res.statusCode = 404
    res.end('404 not found')
  }
})
server.listen(9001, err => {
  if (err) throw err
  console.log('Listening on http://localhost:9001')
})

let controlSockets = []
let webSockets = []
const wserver = new WebSocket.Server({
  port: 9002
})
wserver.on('connection', function (socket) {
  console.log('New websocket connection', socket._socket.remoteAddress)
  socket.on('message', function (buf) {
    const str = buf.toString()
    const msg = JSON.parse(str)
    if (msg.type === 'state-ctl') {
      webSockets.forEach(s => s.send(str))
    } else if (msg.type === 'mode') {
      socket._mode = msg.mode
      if (msg.mode === 'control') controlSockets.push(socket)
      if (msg.mode === 'web') webSockets.push(socket)
    } else {
      controlSockets.forEach(s => s.send(buf))
    }
  })
  socket.on('close', function () {
    console.log('Lost websocket connection', socket._socket.remoteAddress)
    controlSockets = controlSockets.filter(s => s !== socket)
    webSockets = webSockets.filter(s => s !== socket)
  })
})
