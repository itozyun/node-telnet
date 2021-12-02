var assert        = require( 'assert' ),
    Stream        = require( 'stream' ).Stream,
    util          = require( 'util' ),
    CONST         = require( './0_CONST.js' ),
    COMMANDS      = CONST.COMMANDS,
    COMMAND_NAMES = CONST.COMMAND_NAMES,
    OPTIONS       = CONST.OPTIONS,
    OPTION_NAMES  = CONST.OPTION_NAMES,
    SUB           = CONST.SUB;

module.exports = TelnetClient;

/**
 * @extends Stream
 * @param {object|Socket|EventEmitter} options
 */
function TelnetClient( options ){
    Stream.call( this );

    if( options.addListener ){ // ?
        options = {
            input  : arguments[0],
            output : arguments[1],
            server : arguments[2]
        };
    };

    if( options.socket ){
        options.input  = options.socket;
        options.output = options.socket;
    };

    if( !options.output ){
        options.output = options.input;
        options.socket = options.input;
    };

    this.input    = options.input;
    this.output   = options.output;
    this.socket   = options.socket;
    this.server   = options.server;
    this.env      = {};
    this.terminal = 'ansi';

    this.options = options;
    this.options.convertLF = options.convertLF !== false;

    if( this.options.tty ){
        this.setRawMode = TelnetClient_setRawMode;
        this.isTTY      = true;
        this.isRaw      = false;
        this.columns    = 80;
        this.rows       = 24;
    };

    this.open();
};

TelnetClient.prototype.__proto__ = Stream.prototype;

TelnetClient.prototype.debug = function(){
    var args = Array.prototype.slice.call( arguments ),
        msg;

    if( !this.remoteAddress && this.input.remoteAddress ){
        this.remoteAddress = this.input.remoteAddress;
    };

    args.push( '(' + this.remoteAddress + ')' );

    if( this.listeners( 'debug' ).length ){
        msg = util.format.apply( util.format, args );
        this.emit( 'debug', msg );
    };

    if( this.server && this.server.listeners( 'debug' ).length ){
        msg = util.format.apply( util.format, args );
        this.server.emit( 'debug', msg );
    };

    if( this.options.debug ){
        args.push( '(' + this.input.remoteAddress + ')' );
        console.error( args );
    };
};
  
TelnetClient.prototype.open = function(){
    this.input._telnetClient = this;

    this.input.on( 'end'  , TelnetClient_onEnd   );
    this.input.on( 'close', TelnetClient_onClose );
    this.input.on( 'drain', TelnetClient_onDrain );
    this.input.on( 'error', TelnetClient_onError );
    this.input.on( 'data' , TelnetClient_onData  );

    if( this.options.tty ){
        this.do( OPTIONS.TRANSMIT_BINARY );
        this.do( OPTIONS.TERMINAL_TYPE );
        this.do( OPTIONS.NAWS );
        this.do( OPTIONS.NEW_ENVIRON );
    };
};

    function TelnetClient_onEnd(){
        this._telnetClient.debug( 'ended' );
        this._telnetClient.emit( 'end' );
    };
    function TelnetClient_onClose(){
        this._telnetClient.debug( 'closed' );
        this._telnetClient.emit( 'close' );
    };
    function TelnetClient_onDrain(){
        this._telnetClient.emit( 'drain' );
    };
    function TelnetClient_onError( err ){
        this._telnetClient.debug( 'error: %s', err ? err.message + '' : 'Unknown' );
        this._telnetClient.emit( 'error', err );
    };
    function TelnetClient_onData( data ){
        this._telnetClient.parse( data );
    };

TelnetClient.prototype.do = function( optionCode ){
    return this.output.write( Buffer.from( [ COMMANDS.IAC, COMMANDS.DO, optionCode ] ) );
};
TelnetClient.prototype.dont = function( optionCode ){
    return this.output.write( Buffer.from( [ COMMANDS.IAC, COMMANDS.DONT, optionCode ] ) );
};
TelnetClient.prototype.will = function( optionCode ){
    return this.output.write( Buffer.from( [ COMMANDS.IAC, COMMANDS.WILL, optionCode ] ) );
};
TelnetClient.prototype.wont = function( optionCode ){
    return this.output.write( Buffer.from( [ COMMANDS.IAC, COMMANDS.WONT, optionCode ] ) );
};

function TelnetClient_setRawMode( mode ){
    this.isRaw = mode;
    if( this.writable ){
        if( mode ){
            this.debug('switching to raw:');
            this.do( OPTIONS.SUPPRESS_GO_AHEAD );
            this.will( OPTIONS.SUPPRESS_GO_AHEAD );
            this.will( OPTIONS.ECHO );
            this.debug('switched to raw');
        } else {
            this.debug('switching to cooked:');
            this.dont( OPTIONS.SUPPRESS_GO_AHEAD );
            this.wont( OPTIONS.SUPPRESS_GO_AHEAD );
            this.wont( OPTIONS.ECHO );
            this.debug('switched to cooked');
        };
    };
};

TelnetClient.prototype.__defineGetter__( 'readable', function(){
    return this.input.readable;
});

TelnetClient.prototype.__defineGetter__( 'writable', function(){
    return this.output.writable;
});

TelnetClient.prototype.__defineGetter__( 'destroyed', function(){
    return this.output.destroyed;
});

TelnetClient.prototype.pause = function(){
    return this.input.pause.apply( this.output, arguments );
};

TelnetClient.prototype.resume = function(){
    return this.input.resume.apply( this.output, arguments );
};

TelnetClient.prototype.write = function(){
    if( this.options.convertLF ){
        arguments[ 0 ] = arguments[ 0 ].toString( 'utf8' ).replace( /\r?\n/g, '\r\n' );
    };
    return this.output.write.apply( this.output, arguments );
};

TelnetClient.prototype.end = function(){
    return this.output.end.apply( this.output, arguments );
};

TelnetClient.prototype.destroy = function(){
    return this.output.destroy.apply( this.output, arguments );
};

TelnetClient.prototype.destroySoon = function(){
    return this.output.destroySoon.apply( this.output, arguments );
};

TelnetClient.prototype.parse = function( data ){
    var bufs = []
      , i = 0
      , l = 0
      , z
      , needsPush = false
      , cdata
      , iacCode
      , iacName
      , commandCode
      , commandName
      , optionCode
      , optionName
      , cmd
      , len;

    if( this._last ){
        data = Buffer.concat( [ this._last.data, data ] );
        i = this._last.i;
        l = this._last.l;
        delete this._last;
    };

    for( z = data.length - 1 ; i <= z; ++i ){
        if( 2 <= z - i
            && COMMANDS.IAC === data[ i ]
            && COMMAND_NAMES[ data[ i + 1 ] ]
            &&  OPTION_NAMES[ data[ i + 2 ] ]
        ){
            cdata = data.slice(i);

            iacCode     = cdata.readUInt8(0);
            iacName     = COMMAND_NAMES[iacCode];
            commandCode = cdata.readUInt8(1);
            commandName = COMMAND_NAMES[commandCode];
            optionCode  = cdata.readUInt8(2);
            optionName  = OPTION_NAMES[optionCode];

            cmd = {
                command     : commandName, // compat
                option      : optionName.split( '_' ).join( ' ' ), // compat
                iacCode     : iacCode,
                iacName     : iacName,
                commandCode : commandCode,
                commandName : commandName,
                optionCode  : optionCode,
                optionName  : optionName,
                data        : cdata
            };

            // compat
            if( cmd.option === 'new environ' ){
                cmd.option = 'environment variables';
            } else if( cmd.option === 'naws' ){
                cmd.option = 'window size';
            };

            if( TelnetClient_Parser[ cmd.optionName ] ){
                try {
                    len = TelnetClient_Parser[ cmd.optionName ]( this, cmd );
                } catch (O_o){
                    if( !( O_o instanceof RangeError ) ){
                        this.debug( 'error: %s', O_o.message );
                        this.emit( 'error', O_o );
                        return;
                    };
                    len = -1;
                    this.debug( 'Not enough data to parse.' );
                };
            } else {
                if( cmd.commandCode === COMMANDS.SB ){
                    len = 0;
                    while( cdata[len] && cdata[len] !== COMMANDS.SE ){
                        len++;
                    };
                    if( !cdata[len] ){
                        len = 3;
                    } else {
                        len++;
                    };
                } else {
                    len = 3;
                };
                cmd.data = cdata.slice( 0, len );
                this.debug( 'Unknown option: %s', cmd.optionName );
            };

            if( len === -1 ){
                this.debug( 'Waiting for more data.' );
                this.debug( iacName, commandName, optionName, cmd.values || len );
                this._last = {
                    data : data,
                    i    : i,
                    l    : l
                };
                return;
            };

            this.debug( iacName, commandName, optionName, cmd.values || len );
            this.emit( 'command', cmd );

            needsPush = true;
            l = i + len;
            i += len - 1;
        } else if( data[ i ] === COMMANDS.IAC && z - i < 2 ){
            this.debug( 'Waiting for more data.' );
            this._last = {
                data : data.slice( i ),
                i    : 0,
                l    : 0
            };
            if( i > l ){
                this.emit( 'data', data.slice( l, i ) );
            };
            return;
        } else if( needsPush || i === z ){
            bufs.push( data.slice( l, i + 1 ) );
            needsPush = false;
        };
    };

    if( bufs.length ){
        this.emit( 'data', Buffer.concat( bufs ) );
    };
};

TelnetClient_Parser = {
    echo : function( telnetClient, cmd ){
        if( cmd.data.length < 3 ) return -1;
        cmd.data = cmd.data.slice( 0, 3 );
        telnetClient.emit( 'echo', cmd );
        return 3;
    },
    status : function( telnetClient, cmd ){
        if( cmd.data.length < 3 ) return -1;
        cmd.data = cmd.data.slice( 0, 3 );
        telnetClient.emit( 'status', cmd );
        return 3;
    },
    linemode : function( telnetClient, cmd ){
        if( cmd.data.length < 3 ) return -1;
        cmd.data = cmd.data.slice( 0, 3 );
        telnetClient.emit( 'linemode', cmd );
        return 3;
    },
    transmit_binary : function( telnetClient, cmd ){
        if( cmd.data.length < 3 ) return -1;
        cmd.data = cmd.data.slice( 0, 3 );
        telnetClient.emit( 'transmit binary', cmd );
        return 3;
    },
    authentication : function( telnetClient, cmd ){
        if( cmd.data.length < 3 ) return -1;
        cmd.data = cmd.data.slice( 0, 3 );
        telnetClient.emit( 'authentication', cmd );
        return 3;
    },
    terminal_speed : function( telnetClient, cmd ){
        if( cmd.data.length < 3 ) return -1;
        cmd.data = cmd.data.slice( 0, 3 );
        telnetClient.emit( 'terminal speed', cmd );
        return 3;
    },
    remote_flow_control : function( telnetClient, cmd ){
        if( cmd.data.length < 3 ) return -1;
        cmd.data = cmd.data.slice( 0, 3 );
        telnetClient.emit( 'remote flow control', cmd );
        return 3;
    },
    x_display_location : function( telnetClient, cmd ){
        if( cmd.data.length < 3 ) return -1;
        cmd.data = cmd.data.slice( 0, 3 );
        telnetClient.emit( 'x display location', cmd );
        return 3;
    },
    suppress_go_ahead : function( telnetClient, cmd ){
        if( cmd.data.length < 3 ) return -1;
        cmd.data = cmd.data.slice( 0, 3 );
        telnetClient.emit( 'suppress go ahead', cmd );
        return 3;
    },
    naws : function( telnetClient, cmd ){
        var data = cmd.data;
        var i = 0;

        if( cmd.commandCode !== COMMANDS.SB ){
            if( data.length < 3 ) return -1;
            cmd.data = data.slice( 0, 3 );
            telnetClient.emit( 'window size', cmd ); // compat
            telnetClient.emit( 'naws', cmd );
            return 3;
        };

        if( data.length < 9 ) return -1;

        var iac1   = data.readUInt8( i );
        var sb     = data.readUInt8( ++i );
        var naws   = data.readUInt8( ++i );
        var width  = data.readUInt16BE( ++i );
        var height = data.readUInt16BE( ( i += 2 ) );
        var iac2   = data.readUInt8( ( i += 2 )  );
        var se     = data.readUInt8( ++i );

        assert( iac1 === COMMANDS.IAC );
        assert( sb   === COMMANDS.SB  );
        assert( naws === OPTIONS.NAWS );
        assert( iac2 === COMMANDS.IAC );
        assert( se   === COMMANDS.SE  );

        cmd.cols    =
        cmd.columns =
        cmd.width   = width;
        cmd.rows    =
        cmd.height  = height;

        cmd.values = [ width, height ];

        cmd.data   = data.slice( 0, ++i );

        if( telnetClient.options.tty ){
            telnetClient.columns = width;
            telnetClient.rows    = height;
            telnetClient.emit( 'resize' );
        };

        telnetClient.emit( 'window size', cmd ); // compat
        telnetClient.emit( 'naws', cmd );
        telnetClient.emit( 'size', width, height );

        return i;
    },
    new_environ : function( telnetClient, cmd ){
        var data = cmd.data;
        var i = 0;

        if( cmd.commandCode !== COMMANDS.SB ){
            if( data.length < 3 ) return -1;
            cmd.data = data.slice( 0, 3 );
            telnetClient.emit( 'environment variables', cmd ); // compat
            telnetClient.emit( 'new environ', cmd );
            return 3;
        };

        if( data.length < 10 ) return -1;

        var iac1     = data.readUInt8( i );
        var sb       = data.readUInt8( ++i );
        var newenv   = data.readUInt8( ++i );
        var info     = data.readUInt8( ++i );
        var variable = data.readUInt8( ++i );
        i += 1;

        var name = '', s;
        for( s = i; i < data.length; ++i ){
            if( data[i] === SUB.VALUE ){
                name = data.toString('ascii', s, i);
                ++i;
                break;
            };
        };

        var value = '';
        for( s = i; i < data.length; ++i ){
            if( data[i] === COMMANDS.IAC ){
                value = data.toString( 'ascii', s, i );
                break;
            };
        };

        var iac2 = data.readUInt8( i );
        var se   = data.readUInt8( ++i );

        assert( iac1     === COMMANDS.IAC );
        assert( sb       === COMMANDS.SB );
        assert( newenv   === OPTIONS.NEW_ENVIRON );
        assert( info     === SUB.INFO );
        assert( variable === SUB.VARIABLE || variable === SUB.USER_VARIABLE );
        assert( name.length > 0 );
        assert( value.length > 0 );
        assert( iac2     === COMMANDS.IAC );
        assert( se       === COMMANDS.SE );

        cmd.name  = name;
        cmd.value = value;
        cmd.type  = variable === SUB.VARIABLE
          ? 'system'
          : 'user';

        // Always uppercase for some reason.
        if( name === 'TERM' ){
            value =
            cmd.value =
            telnetClient.terminal = value.toLowerCase();
            telnetClient.emit( 'term', value );
        };

        cmd.values = [ name, value, type ];

        cmd.data = data.slice( 0, ++i );

        telnetClient.env[ name ] = value;

        telnetClient.emit( 'environment variables', cmd ); // compat
        telnetClient.emit( 'new environ', cmd );
        telnetClient.emit( 'env', cmd.name, cmd.value, cmd.type );

        return i;
    },
    terminal_type : function( telnetClient, cmd ){
        var data = cmd.data;
        var i = 0;
      
        if( cmd.commandCode !== COMMANDS.SB ){
            if( data.length < 3 ) return -1;
            cmd.data = data.slice( 0, 3 );
            telnetClient.emit( 'terminal type', cmd );
            if( cmd.commandCode === COMMANDS.WILL ){
                telnetClient.output.write( Buffer.from( [
                    COMMANDS.IAC,
                    COMMANDS.SB,
                    OPTIONS.TERMINAL_TYPE,
                    SUB.SEND,
                    COMMANDS.IAC,
                    COMMANDS.SE
                ] ) );
            };
            return 3;
        };

        if( data.length < 7 ) return -1;

        var iac1     = data.readUInt8( i );
        var sb       = data.readUInt8( ++i );
        var termtype = data.readUInt8( ++i );
        var is       = data.readUInt8( ++i );
        i += 1;

        var name, s;
        for( s = i; i < data.length; ++i ){
            if( data[i] === COMMANDS.IAC ){
                name = data.toString( 'ascii', s, i );
                break;
            };
        };

        var iac2 = data.readUInt8( i );
        var se   = data.readUInt8( ++i );

        assert( iac1     === COMMANDS.IAC );
        assert( sb       === COMMANDS.SB );
        assert( termtype === OPTIONS.TERMINAL_TYPE );
        assert( is       === SUB.IS );
        assert( name.length > 0 );
        assert( iac2     === COMMANDS.IAC );
        assert( se       === COMMANDS.SE );

        // Always uppercase for some reason.
        cmd.name = name = name.toLowerCase();

        cmd.values = [ name ];

        cmd.data = data.slice( 0, ++i );

        telnetClient.terminal = name;

        telnetClient.emit( 'terminal type', cmd );
        telnetClient.emit( 'term', name );

        return i;
    }
};

// compat
TelnetClient_Parser.window_size = TelnetClient_Parser.naws;

// compat
TelnetClient_Parser.environment_variables = TelnetClient_Parser.new_environ;