/**
 * Telnet server implementation.
 *
 * References:
 *  - http://tools.ietf.org/html/rfc854
 *  - http://support.microsoft.com/kb/231866
 *  - http://www.iana.org/assignments/telnet-options
 *
 */

/**
 * Constants
 */
var CONST = require( './0_CONST.js' );

/**
 * Client
 */
var TelnetClient = require( './2_TelnetClient.js' );

/**
 * Server
 */
var TelnetServer = require( './1_TelnetServer.js' );

/**
 * Telnet
 */
/**
 * 
 * @param {Object|Socket} options 
 * @returns {TelnetServer|TelnetClient}
 */
function Telnet( options, opt_callback ){
    if( options && ( options.input || options.addListener ) ){
        return new TelnetClient( arguments[ 0 ], arguments[ 1 ], arguments[ 2 ]);
    };
    return new TelnetServer( options, opt_callback );
};

/**
 * Expose
 */
Telnet.COMMANDS      = CONST.COMMANDS;
Telnet.COMMAND_NAMES = CONST.COMMAND_NAMES;
Telnet.OPTIONS       = CONST.OPTIONS;
Telnet.OPTION_NAMES  = CONST.OPTION_NAMES;
Telnet.SUB           = CONST.SUB;

Telnet.Client =
Telnet.TelnetClient =
Telnet.createClient = function(){ return new TelnetClient( arguments[0], arguments[1], arguments[2] ) };

Telnet.Server =
Telnet.TelnetServer =
Telnet.createServer = function( options, opt_callback ){ return new TelnetServer( options, opt_callback ) };

module.exports = Telnet;