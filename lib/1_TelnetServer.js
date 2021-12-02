var net          = require( 'net' ),
    EventEmitter = require( 'events' ).EventEmitter,
    TelnetClient = require( './2_TelnetClient.js' );

module.exports = TelnetServer;

/**
 * @extends EventEmitter
 * @param {object|null} options 
 * @param {function=} opt_callback
 */
function TelnetServer( options, opt_callback ){
    this._options  = options || {};
    this._callback = opt_callback;
  
    EventEmitter.call( this );
  
    this.server = net.createServer( TelnetServer_onCreateServer );
    this.server._telnetServer = this;

    this.server.on( 'error'    , TelnetServer_onServerError );
    this.server.on( 'listening', TelnetServer_onServerListenig );
    this.server.on( 'close'    , TelnetServer_onServerClose );

    return this;
};

TelnetServer.prototype.__proto__ = EventEmitter.prototype;

TelnetServer.prototype.address = function(){
    return this.server.address();
};
TelnetServer.prototype.close = function( opt_callback ){
    return this.server.close( opt_callback );
};
TelnetServer.prototype.getConnections = function( opt_callback ){
    return this.server.getConnections( opt_callback );
};
TelnetServer.prototype.listen = function( arg0, arg1, arg2, arg3 ){
    return this.server.listen( arg0, arg1, arg2, arg3 );
};

    function TelnetServer_onCreateServer( socket ){
        var telnetServer = this._telnetServer,
            options      = telnetServer._options,
            client       = new TelnetClient(
                    {
                        tty       : options.tty,
                        convertLF : options.convertLF,
                        debug     : options.debug,
                        input     : socket,
                        output    : socket,
                        server    : telnetServer
                    }
                );

        telnetServer.emit( 'connection', client );
        telnetServer.emit( 'client'    , client ); // compat
        if( telnetServer._callback ){
            telnetServer._callback( client );
        };
    };

    var TelnetServer_emit  = EventEmitter.prototype.emit,
        TelnetServer_slice = [].slice;

    function TelnetServer_onServerError(){
        return TelnetServer_emit.apply( this._telnetServer, [ 'error' ].concat( TelnetServer_slice.call( arguments ) ) );
    };
    function TelnetServer_onServerListenig(){
        return TelnetServer_emit.apply( this._telnetServer, [ 'listening' ].concat( TelnetServer_slice.call( arguments ) ) );
    };
    function TelnetServer_onServerClose(){
        return TelnetServer_emit.apply( this._telnetServer, [ 'close' ].concat( TelnetServer_slice.call( arguments ) ) );
    };