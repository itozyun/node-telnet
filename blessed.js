/**
 * Original:
 *   https://github.com/chjj/node-telnet2 > README.md > Example
 */
var telnet  = require('./');
var blessed = require('./.submodules/neo-blessed');
var Iconv   = require('iconv').Iconv;
var iconv   = new Iconv('UTF-8', 'EUC-JP' + '//TRANSLIT//IGNORE'); // http://alcoholiclover.blog.fc2.com/blog-entry-5.html

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
    };
};

telnet({ tty: true, convertLF : false, debug : true }, function(client) {
    // 'readline' will call `setRawMode` when it is a function
    client.setRawMode = setRawMode;

    client.on('suppress go ahead',  console.log)
    client.on('echo', console.log)
    client.on('window size', console.log)
    client.on('x display location', console.log)
    client.on('terminal speed', console.log)
    client.on('environment variables', function( cmd ){ console.log( 'environment variables: name:' + cmd.name + ',value:' + cmd.value + ',type:' + cmd.type ) })
    client.on('env', function( a, b, c ){ console.log( 'env:' + a + ',' + b + ',' + c ) })
    client.on('term', function( t ){ console.log( 'term:' + t ); })
    client.on('transmit binary', console.log)
    client.on('status', console.log)
    client.on('linemode', console.log)
    client.on('authentication', console.log)

    client.on('term', function(terminal) {
        if( terminal === 'ansi' || terminal === 'vtnt' || terminal === 'vt100' || terminal === 'vt52' ){
            terminal = 'windows-ansi';
        };
        screen.terminal = terminal;
        screen.render();
    });

    client.on('size', function(width, height) {
        client.columns = width;
        client.rows = height;
        client.emit('resize');
    });

  var _write = client.write;
    client.write = function( data ){
        var utf8 = data.toString( 'utf8' ).replace(/\r?\n/g, '\r\n');

        var i = 0, l = utf8.length, chr, str = '';

        for( ; i < l; ++i ){
            if( utf8[ i ].charCodeAt( 0 ) < 32 ){
                chr = '.';
            } else {
                chr = utf8[ i ];
            };
            str += chr;
        };

        var retStr = iconv.convert( utf8 );
        
        console.log( str );
        _write.call( client, retStr );
    };

    var screen = blessed.screen({
        smartCSR: true,
        input: client,
        output: client,
        // terminal: 'windows-ansi',
        fullUnicode: true,
        forceUnicode: true
    });

    client.on('close', function() {
        if (!screen.destroyed) {
            screen.destroy();
        }
    });

    screen.key(['C-c', 'q'], function(ch, key) {
        screen.destroy();
    });

    screen.on('destroy', function() {
        if (client.writable) {
            client.destroy();
        }
    });

    screen.data.main = blessed.box({
        parent: screen,
        left: 0,
        top: 'center',
        width: '40%',
        height: '80%',
        border: 'line',
        content: 'Welcome to my server. Here is your own private session. ですよ。──┏━┳━┳━┳━┓┗━┻━┻━┻━┛┣━╋━╋━╋━┫┃─│┌┐┘└├┬┤┴┼'
    });

    screen.render();

    client.do( telnet.OPTIONS.X_DISPLAY_LOCATION );
    client.do( telnet.OPTIONS.ECHO );
}).listen(2300);