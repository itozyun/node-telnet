node-telnet
===========
### Telnet implementation for Node.js


This module offers an implementation of the [Telnet Protocol (RFC854)][rfc],
making it possible to write a telnet server that can interact with the various
telnet features.

### Implemented Options:

| **Name**            | **Event**             |**Specification**
|:--------------------|:----------------------|:-------------------------
| Binary transmission | `'transmit binary'`   | [RFC856](http://tools.ietf.org/html/rfc856)
| Echo                | `'echo'`              | [RFC857](http://tools.ietf.org/html/rfc857)
| Suppress Go Ahead   | `'suppress go ahead'` | [RFC858](http://tools.ietf.org/html/rfc858)
| Window Size         | `'window size'`       | [RFC1073](http://tools.ietf.org/html/rfc1073)

[rfc]: http://tools.ietf.org/html/rfc854
