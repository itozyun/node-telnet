
/**
 * Usage of node-telnet with node's REPL, in full-featured "terminal" mode.
 * (Requires node >= v0.7.7)
 */

var telnet = require('./')
  , repl = require('repl')
  , port = Number(process.argv[2]) || 1337

var server = telnet.createServer(null, function (client) {

  client.on('window size', function (e) {
    if (e.command === 'sb') {
      // a real "resize" event; 'readline' listens for this
      client.columns = e.columns
      client.rows = e.rows
      client.emit('resize')
    }
  })

  client.on('suppress go ahead',  console.log)
  client.on('echo', console.log)
  client.on('window size', console.log)
  client.on('x display location', console.log)
  client.on('terminal speed', console.log)
  client.on('environment variables', console.log)
  client.on('transmit binary', console.log)
  client.on('status', console.log)
  client.on('linemode', console.log)
  client.on('authentication', console.log)

  // 'readline' will call `setRawMode` when it is a function
  client.setRawMode = setRawMode

  // make unicode characters work properly
  client.do( telnet.OPTIONS.TRANSMIT_BINARY );

  // emit 'window size' events
  client.do( telnet.OPTIONS.NAWS );

  // create the REPL
  var r = repl.start({
      input: client
    , output: client
    , prompt: 'telnet repl> '
    , terminal: true
    , useGlobal: false
  }).on('exit', function () {
    client.end()
  })

  r.context.r = r
  r.context.client = client
  r.context.socket = client

})

server.on('error', function (err) {
  if (err.code == 'EACCES') {
    console.error('%s: You must be "root" to bind to port %d', err.code, port)
  } else {
    throw err
  }
})

server.on('listening', function () {
  console.log('node repl telnet(1) server listening on port %d', this.address().port)
  console.log('  $ telnet localhost' + (port != 23 ? ' ' + port : ''))
})

server.listen(port)

/**
 * The equivalent of "raw mode" via telnet option commands.
 * Set this function on a telnet `client` instance.
 */
function setRawMode( mode ){
    if( mode ){
        this.do( telnet.OPTIONS.SUPPRESS_GO_AHEAD );
        this.will( telnet.OPTIONS.SUPPRESS_GO_AHEAD );
        this.will( telnet.OPTIONS.ECHO );
    } else {
        this.dont( telnet.OPTIONS.SUPPRESS_GO_AHEAD );
        this.wont( telnet.OPTIONS.SUPPRESS_GO_AHEAD );
        this.wont( telnet.OPTIONS.ECHO );
    }
};