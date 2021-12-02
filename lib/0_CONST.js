/**
 * Constants
 */
var COMMANDS = {
    SE:   240, // end of subnegotiation parameters
    NOP:  241, // no operation
    DM:   242, // data mark
    BRK:  243, // break
    IP:   244, // suspend (a.k.a. "interrupt process")
    AO:   245, // abort output
    AYT:  246, // are you there?
    EC:   247, // erase character
    EL:   248, // erase line
    GA:   249, // go ahead
    SB:   250, // subnegotiation
    WILL: 251, // will
    WONT: 252, // wont
    DO:   253, // do
    DONT: 254, // dont
    IAC:  255  // interpret as command
};

var COMMAND_NAMES = Object.keys(COMMANDS).reduce(function(out, key) {
    var value = COMMANDS[key];
    out[value] = key.toLowerCase();
    return out;
}, {});

var OPTIONS = {
    TRANSMIT_BINARY: 0,         // http://tools.ietf.org/html/rfc856
    ECHO: 1,                    // http://tools.ietf.org/html/rfc857
    RECONNECT: 2,               // http://tools.ietf.org/html/rfc671
    SUPPRESS_GO_AHEAD: 3,       // http://tools.ietf.org/html/rfc858
    AMSN: 4,                    // Approx Message Size Negotiation
                                // https://google.com/search?q=telnet+option+AMSN
    STATUS: 5,                  // http://tools.ietf.org/html/rfc859
    TIMING_MARK: 6,             // http://tools.ietf.org/html/rfc860
    RCTE: 7,                    // http://tools.ietf.org/html/rfc563
                                // http://tools.ietf.org/html/rfc726
    NAOL: 8,                    // (Negotiate) Output Line Width
                                // https://google.com/search?q=telnet+option+NAOL
                                // http://tools.ietf.org/html/rfc1073
    NAOP: 9,                    // (Negotiate) Output Page Size
                                // https://google.com/search?q=telnet+option+NAOP
                                // http://tools.ietf.org/html/rfc1073
    NAOCRD: 10,                 // http://tools.ietf.org/html/rfc652
    NAOHTS: 11,                 // http://tools.ietf.org/html/rfc653
    NAOHTD: 12,                 // http://tools.ietf.org/html/rfc654
    NAOFFD: 13,                 // http://tools.ietf.org/html/rfc655
    NAOVTS: 14,                 // http://tools.ietf.org/html/rfc656
    NAOVTD: 15,                 // http://tools.ietf.org/html/rfc657
    NAOLFD: 16,                 // http://tools.ietf.org/html/rfc658
    EXTEND_ASCII: 17,           // http://tools.ietf.org/html/rfc698
    LOGOUT: 18,                 // http://tools.ietf.org/html/rfc727
    BM: 19,                     // http://tools.ietf.org/html/rfc735
    DET: 20,                    // http://tools.ietf.org/html/rfc732
                                // http://tools.ietf.org/html/rfc1043
    SUPDUP: 21,                 // http://tools.ietf.org/html/rfc734
                                // http://tools.ietf.org/html/rfc736
    SUPDUP_OUTPUT: 22,          // http://tools.ietf.org/html/rfc749
    SEND_LOCATION: 23,          // http://tools.ietf.org/html/rfc779
    TERMINAL_TYPE: 24,          // http://tools.ietf.org/html/rfc1091
    END_OF_RECORD: 25,          // http://tools.ietf.org/html/rfc885
    TUID: 26,                   // http://tools.ietf.org/html/rfc927
    OUTMRK: 27,                 // http://tools.ietf.org/html/rfc933
    TTYLOC: 28,                 // http://tools.ietf.org/html/rfc946
    REGIME_3270: 29,            // http://tools.ietf.org/html/rfc1041
    X3_PAD: 30,                 // http://tools.ietf.org/html/rfc1053
    NAWS: 31,                   // http://tools.ietf.org/html/rfc1073
    TERMINAL_SPEED: 32,         // http://tools.ietf.org/html/rfc1079
    TOGGLE_FLOW_CONTROL: 33,    // http://tools.ietf.org/html/rfc1372
    LINEMODE: 34,               // http://tools.ietf.org/html/rfc1184
    X_DISPLAY_LOCATION: 35,     // http://tools.ietf.org/html/rfc1096
    ENVIRON: 36,                // http://tools.ietf.org/html/rfc1408
    AUTHENTICATION: 37,         // http://tools.ietf.org/html/rfc2941
                                // http://tools.ietf.org/html/rfc1416
                                // http://tools.ietf.org/html/rfc2942
                                // http://tools.ietf.org/html/rfc2943
                                // http://tools.ietf.org/html/rfc2951
    ENCRYPT: 38,                // http://tools.ietf.org/html/rfc2946
    NEW_ENVIRON: 39,            // http://tools.ietf.org/html/rfc1572
    TN3270E: 40,                // http://tools.ietf.org/html/rfc2355
    XAUTH: 41,                  // https://google.com/search?q=telnet+option+XAUTH
    CHARSET: 42,                // http://tools.ietf.org/html/rfc2066
    RSP: 43,                    // http://tools.ietf.org/html/draft-barnes-telnet-rsp-opt-01
    COM_PORT_OPTION: 44,        // http://tools.ietf.org/html/rfc2217
    SLE: 45,                    // http://tools.ietf.org/html/draft-rfced-exp-atmar-00
    START_TLS: 46,              // http://tools.ietf.org/html/draft-altman-telnet-starttls-02
    KERMIT: 47,                 // http://tools.ietf.org/html/rfc2840
    SEND_URL: 48,               // http://tools.ietf.org/html/draft-croft-telnet-url-trans-00
    FORWARD_X: 49,              // http://tools.ietf.org/html/draft-altman-telnet-fwdx-01
    PRAGMA_LOGON: 138,          // https://google.com/search?q=telnet+option+PRAGMA_LOGON
    SSPI_LOGON: 139,            // https://google.com/search?q=telnet+option+SSPI_LOGON
    PRAGMA_HEARTBEAT: 140,      // https://google.com/search?q=telnet+option+PRAMGA_HEARTBEAT
    EXOPL: 255                  // http://tools.ietf.org/html/rfc861
};

var OPTION_NAMES = Object.keys(OPTIONS).reduce(function(out, key) {
    var value = OPTIONS[key];
    out[value] = key.toLowerCase();
    return out;
}, {});

var SUB = {
    IS: 0,
    SEND: 1,
    INFO: 2,
    VARIABLE: 0,
    VALUE: 1,
    ESC: 2, // unused, for env
    USER_VARIABLE: 3
};

module.exports = {
    COMMANDS      : COMMANDS,
    COMMAND_NAMES : COMMAND_NAMES,
    OPTIONS       : OPTIONS,
    OPTION_NAMES  : OPTION_NAMES,
    SUB           : SUB
};