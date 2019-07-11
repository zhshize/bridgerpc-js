(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('bufferutil'), require('zlib'), require('utf-8-validate'), require('https'), require('net'), require('tls'), require('url'), require('events'), require('crypto'), require('http'), require('util'), require('stream')) :
  typeof define === 'function' && define.amd ? define(['bufferutil', 'zlib', 'utf-8-validate', 'https', 'net', 'tls', 'url', 'events', 'crypto', 'http', 'util', 'stream'], factory) :
  (global.bridgerpc = factory(global.bufferutil,global.zlib,global.utf8Validate,global.https,global.net,global.tls,global.url,global.events,global.crypto,global.http,global.util,global.stream));
}(this, (function (bufferutil,zlib,utf8Validate,https,net,tls,url,events,crypto,http,util,stream) { 'use strict';

  bufferutil = bufferutil && bufferutil.hasOwnProperty('default') ? bufferutil['default'] : bufferutil;
  zlib = zlib && zlib.hasOwnProperty('default') ? zlib['default'] : zlib;
  utf8Validate = utf8Validate && utf8Validate.hasOwnProperty('default') ? utf8Validate['default'] : utf8Validate;
  https = https && https.hasOwnProperty('default') ? https['default'] : https;
  net = net && net.hasOwnProperty('default') ? net['default'] : net;
  tls = tls && tls.hasOwnProperty('default') ? tls['default'] : tls;
  url = url && url.hasOwnProperty('default') ? url['default'] : url;
  events = events && events.hasOwnProperty('default') ? events['default'] : events;
  crypto = crypto && crypto.hasOwnProperty('default') ? crypto['default'] : crypto;
  http = http && http.hasOwnProperty('default') ? http['default'] : http;
  util = util && util.hasOwnProperty('default') ? util['default'] : util;
  stream = stream && stream.hasOwnProperty('default') ? stream['default'] : stream;

  function Queue(options) {
    if (!(this instanceof Queue)) {
      return new Queue(options);
    }

    options = options || {};
    this.concurrency = options.concurrency || Infinity;
    this.pending = 0;
    this.jobs = [];
    this.cbs = [];
    this._done = done.bind(this);
  }

  var arrayAddMethods = [
    'push',
    'unshift',
    'splice'
  ];

  arrayAddMethods.forEach(function(method) {
    Queue.prototype[method] = function() {
      var methodResult = Array.prototype[method].apply(this.jobs, arguments);
      this._run();
      return methodResult;
    };
  });

  Object.defineProperty(Queue.prototype, 'length', {
    get: function() {
      return this.pending + this.jobs.length;
    }
  });

  Queue.prototype._run = function() {
    if (this.pending === this.concurrency) {
      return;
    }
    if (this.jobs.length) {
      var job = this.jobs.shift();
      this.pending++;
      job(this._done);
      this._run();
    }

    if (this.pending === 0) {
      while (this.cbs.length !== 0) {
        var cb = this.cbs.pop();
        process.nextTick(cb);
      }
    }
  };

  Queue.prototype.onDone = function(cb) {
    if (typeof cb === 'function') {
      this.cbs.push(cb);
      this._run();
    }
  };

  function done() {
    this.pending--;
    this._run();
  }

  var C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_asyncLimiter = Queue;

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var constants = {
    BINARY_TYPES: ['nodebuffer', 'arraybuffer', 'fragments'],
    GUID: '258EAFA5-E914-47DA-95CA-C5AB0DC85B11',
    kStatusCode: Symbol('status-code'),
    kWebSocket: Symbol('websocket'),
    EMPTY_BUFFER: Buffer.alloc(0),
    NOOP: () => {}
  };

  var bufferUtil = createCommonjsModule(function (module) {

  const { EMPTY_BUFFER } = constants;

  /**
   * Merges an array of buffers into a new buffer.
   *
   * @param {Buffer[]} list The array of buffers to concat
   * @param {Number} totalLength The total length of buffers in the list
   * @return {Buffer} The resulting buffer
   * @public
   */
  function concat(list, totalLength) {
    if (list.length === 0) return EMPTY_BUFFER;
    if (list.length === 1) return list[0];

    const target = Buffer.allocUnsafe(totalLength);
    let offset = 0;

    for (let i = 0; i < list.length; i++) {
      const buf = list[i];
      buf.copy(target, offset);
      offset += buf.length;
    }

    return target;
  }

  /**
   * Masks a buffer using the given mask.
   *
   * @param {Buffer} source The buffer to mask
   * @param {Buffer} mask The mask to use
   * @param {Buffer} output The buffer where to store the result
   * @param {Number} offset The offset at which to start writing
   * @param {Number} length The number of bytes to mask.
   * @public
   */
  function _mask(source, mask, output, offset, length) {
    for (let i = 0; i < length; i++) {
      output[offset + i] = source[i] ^ mask[i & 3];
    }
  }

  /**
   * Unmasks a buffer using the given mask.
   *
   * @param {Buffer} buffer The buffer to unmask
   * @param {Buffer} mask The mask to use
   * @public
   */
  function _unmask(buffer, mask) {
    // Required until https://github.com/nodejs/node/issues/9006 is resolved.
    const length = buffer.length;
    for (let i = 0; i < length; i++) {
      buffer[i] ^= mask[i & 3];
    }
  }

  /**
   * Converts a buffer to an `ArrayBuffer`.
   *
   * @param {Buffer} buf The buffer to convert
   * @return {ArrayBuffer} Converted buffer
   * @public
   */
  function toArrayBuffer(buf) {
    if (buf.byteLength === buf.buffer.byteLength) {
      return buf.buffer;
    }

    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }

  /**
   * Converts `data` to a `Buffer`.
   *
   * @param {*} data The data to convert
   * @return {Buffer} The buffer
   * @throws {TypeError}
   * @public
   */
  function toBuffer(data) {
    toBuffer.readOnly = true;

    if (Buffer.isBuffer(data)) return data;

    let buf;

    if (data instanceof ArrayBuffer) {
      buf = Buffer.from(data);
    } else if (ArrayBuffer.isView(data)) {
      buf = viewToBuffer(data);
    } else {
      buf = Buffer.from(data);
      toBuffer.readOnly = false;
    }

    return buf;
  }

  /**
   * Converts an `ArrayBuffer` view into a buffer.
   *
   * @param {(DataView|TypedArray)} view The view to convert
   * @return {Buffer} Converted view
   * @private
   */
  function viewToBuffer(view) {
    const buf = Buffer.from(view.buffer);

    if (view.byteLength !== view.buffer.byteLength) {
      return buf.slice(view.byteOffset, view.byteOffset + view.byteLength);
    }

    return buf;
  }

  try {
    const bufferUtil = bufferutil;
    const bu = bufferUtil.BufferUtil || bufferUtil;

    module.exports = {
      concat,
      mask(source, mask, output, offset, length) {
        if (length < 48) _mask(source, mask, output, offset, length);
        else bu.mask(source, mask, output, offset, length);
      },
      toArrayBuffer,
      toBuffer,
      unmask(buffer, mask) {
        if (buffer.length < 32) _unmask(buffer, mask);
        else bu.unmask(buffer, mask);
      }
    };
  } catch (e) /* istanbul ignore next */ {
    module.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
  }
  });
  var bufferUtil_1 = bufferUtil.concat;
  var bufferUtil_2 = bufferUtil.mask;
  var bufferUtil_3 = bufferUtil.toArrayBuffer;
  var bufferUtil_4 = bufferUtil.toBuffer;
  var bufferUtil_5 = bufferUtil.unmask;

  const { kStatusCode, NOOP } = constants;

  const TRAILER = Buffer.from([0x00, 0x00, 0xff, 0xff]);
  const EMPTY_BLOCK = Buffer.from([0x00]);

  const kPerMessageDeflate = Symbol('permessage-deflate');
  const kTotalLength = Symbol('total-length');
  const kCallback = Symbol('callback');
  const kBuffers = Symbol('buffers');
  const kError = Symbol('error');

  //
  // We limit zlib concurrency, which prevents severe memory fragmentation
  // as documented in https://github.com/nodejs/node/issues/8871#issuecomment-250915913
  // and https://github.com/websockets/ws/issues/1202
  //
  // Intentionally global; it's the global thread pool that's an issue.
  //
  let zlibLimiter;

  /**
   * permessage-deflate implementation.
   */
  class PerMessageDeflate {
    /**
     * Creates a PerMessageDeflate instance.
     *
     * @param {Object} options Configuration options
     * @param {Boolean} options.serverNoContextTakeover Request/accept disabling
     *     of server context takeover
     * @param {Boolean} options.clientNoContextTakeover Advertise/acknowledge
     *     disabling of client context takeover
     * @param {(Boolean|Number)} options.serverMaxWindowBits Request/confirm the
     *     use of a custom server window size
     * @param {(Boolean|Number)} options.clientMaxWindowBits Advertise support
     *     for, or request, a custom client window size
     * @param {Object} options.zlibDeflateOptions Options to pass to zlib on deflate
     * @param {Object} options.zlibInflateOptions Options to pass to zlib on inflate
     * @param {Number} options.threshold Size (in bytes) below which messages
     *     should not be compressed
     * @param {Number} options.concurrencyLimit The number of concurrent calls to
     *     zlib
     * @param {Boolean} isServer Create the instance in either server or client
     *     mode
     * @param {Number} maxPayload The maximum allowed message length
     */
    constructor(options, isServer, maxPayload) {
      this._maxPayload = maxPayload | 0;
      this._options = options || {};
      this._threshold =
        this._options.threshold !== undefined ? this._options.threshold : 1024;
      this._isServer = !!isServer;
      this._deflate = null;
      this._inflate = null;

      this.params = null;

      if (!zlibLimiter) {
        const concurrency =
          this._options.concurrencyLimit !== undefined
            ? this._options.concurrencyLimit
            : 10;
        zlibLimiter = new C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_asyncLimiter({ concurrency });
      }
    }

    /**
     * @type {String}
     */
    static get extensionName() {
      return 'permessage-deflate';
    }

    /**
     * Create an extension negotiation offer.
     *
     * @return {Object} Extension parameters
     * @public
     */
    offer() {
      const params = {};

      if (this._options.serverNoContextTakeover) {
        params.server_no_context_takeover = true;
      }
      if (this._options.clientNoContextTakeover) {
        params.client_no_context_takeover = true;
      }
      if (this._options.serverMaxWindowBits) {
        params.server_max_window_bits = this._options.serverMaxWindowBits;
      }
      if (this._options.clientMaxWindowBits) {
        params.client_max_window_bits = this._options.clientMaxWindowBits;
      } else if (this._options.clientMaxWindowBits == null) {
        params.client_max_window_bits = true;
      }

      return params;
    }

    /**
     * Accept an extension negotiation offer/response.
     *
     * @param {Array} configurations The extension negotiation offers/reponse
     * @return {Object} Accepted configuration
     * @public
     */
    accept(configurations) {
      configurations = this.normalizeParams(configurations);

      this.params = this._isServer
        ? this.acceptAsServer(configurations)
        : this.acceptAsClient(configurations);

      return this.params;
    }

    /**
     * Releases all resources used by the extension.
     *
     * @public
     */
    cleanup() {
      if (this._inflate) {
        this._inflate.close();
        this._inflate = null;
      }

      if (this._deflate) {
        this._deflate.close();
        this._deflate = null;
      }
    }

    /**
     *  Accept an extension negotiation offer.
     *
     * @param {Array} offers The extension negotiation offers
     * @return {Object} Accepted configuration
     * @private
     */
    acceptAsServer(offers) {
      const opts = this._options;
      const accepted = offers.find((params) => {
        if (
          (opts.serverNoContextTakeover === false &&
            params.server_no_context_takeover) ||
          (params.server_max_window_bits &&
            (opts.serverMaxWindowBits === false ||
              (typeof opts.serverMaxWindowBits === 'number' &&
                opts.serverMaxWindowBits > params.server_max_window_bits))) ||
          (typeof opts.clientMaxWindowBits === 'number' &&
            !params.client_max_window_bits)
        ) {
          return false;
        }

        return true;
      });

      if (!accepted) {
        throw new Error('None of the extension offers can be accepted');
      }

      if (opts.serverNoContextTakeover) {
        accepted.server_no_context_takeover = true;
      }
      if (opts.clientNoContextTakeover) {
        accepted.client_no_context_takeover = true;
      }
      if (typeof opts.serverMaxWindowBits === 'number') {
        accepted.server_max_window_bits = opts.serverMaxWindowBits;
      }
      if (typeof opts.clientMaxWindowBits === 'number') {
        accepted.client_max_window_bits = opts.clientMaxWindowBits;
      } else if (
        accepted.client_max_window_bits === true ||
        opts.clientMaxWindowBits === false
      ) {
        delete accepted.client_max_window_bits;
      }

      return accepted;
    }

    /**
     * Accept the extension negotiation response.
     *
     * @param {Array} response The extension negotiation response
     * @return {Object} Accepted configuration
     * @private
     */
    acceptAsClient(response) {
      const params = response[0];

      if (
        this._options.clientNoContextTakeover === false &&
        params.client_no_context_takeover
      ) {
        throw new Error('Unexpected parameter "client_no_context_takeover"');
      }

      if (!params.client_max_window_bits) {
        if (typeof this._options.clientMaxWindowBits === 'number') {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        }
      } else if (
        this._options.clientMaxWindowBits === false ||
        (typeof this._options.clientMaxWindowBits === 'number' &&
          params.client_max_window_bits > this._options.clientMaxWindowBits)
      ) {
        throw new Error(
          'Unexpected or invalid parameter "client_max_window_bits"'
        );
      }

      return params;
    }

    /**
     * Normalize parameters.
     *
     * @param {Array} configurations The extension negotiation offers/reponse
     * @return {Array} The offers/response with normalized parameters
     * @private
     */
    normalizeParams(configurations) {
      configurations.forEach((params) => {
        Object.keys(params).forEach((key) => {
          let value = params[key];

          if (value.length > 1) {
            throw new Error(`Parameter "${key}" must have only a single value`);
          }

          value = value[0];

          if (key === 'client_max_window_bits') {
            if (value !== true) {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (!this._isServer) {
              throw new TypeError(
                `Invalid value for parameter "${key}": ${value}`
              );
            }
          } else if (key === 'server_max_window_bits') {
            const num = +value;
            if (!Number.isInteger(num) || num < 8 || num > 15) {
              throw new TypeError(
                `Invalid value for parameter "${key}": ${value}`
              );
            }
            value = num;
          } else if (
            key === 'client_no_context_takeover' ||
            key === 'server_no_context_takeover'
          ) {
            if (value !== true) {
              throw new TypeError(
                `Invalid value for parameter "${key}": ${value}`
              );
            }
          } else {
            throw new Error(`Unknown parameter "${key}"`);
          }

          params[key] = value;
        });
      });

      return configurations;
    }

    /**
     * Decompress data. Concurrency limited by async-limiter.
     *
     * @param {Buffer} data Compressed data
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @public
     */
    decompress(data, fin, callback) {
      zlibLimiter.push((done) => {
        this._decompress(data, fin, (err, result) => {
          done();
          callback(err, result);
        });
      });
    }

    /**
     * Compress data. Concurrency limited by async-limiter.
     *
     * @param {Buffer} data Data to compress
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @public
     */
    compress(data, fin, callback) {
      zlibLimiter.push((done) => {
        this._compress(data, fin, (err, result) => {
          done();
          callback(err, result);
        });
      });
    }

    /**
     * Decompress data.
     *
     * @param {Buffer} data Compressed data
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @private
     */
    _decompress(data, fin, callback) {
      const endpoint = this._isServer ? 'client' : 'server';

      if (!this._inflate) {
        const key = `${endpoint}_max_window_bits`;
        const windowBits =
          typeof this.params[key] !== 'number'
            ? zlib.Z_DEFAULT_WINDOWBITS
            : this.params[key];

        this._inflate = zlib.createInflateRaw({
          ...this._options.zlibInflateOptions,
          windowBits
        });
        this._inflate[kPerMessageDeflate] = this;
        this._inflate[kTotalLength] = 0;
        this._inflate[kBuffers] = [];
        this._inflate.on('error', inflateOnError);
        this._inflate.on('data', inflateOnData);
      }

      this._inflate[kCallback] = callback;

      this._inflate.write(data);
      if (fin) this._inflate.write(TRAILER);

      this._inflate.flush(() => {
        const err = this._inflate[kError];

        if (err) {
          this._inflate.close();
          this._inflate = null;
          callback(err);
          return;
        }

        const data = bufferUtil.concat(
          this._inflate[kBuffers],
          this._inflate[kTotalLength]
        );

        if (fin && this.params[`${endpoint}_no_context_takeover`]) {
          this._inflate.close();
          this._inflate = null;
        } else {
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
        }

        callback(null, data);
      });
    }

    /**
     * Compress data.
     *
     * @param {Buffer} data Data to compress
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @private
     */
    _compress(data, fin, callback) {
      if (!data || data.length === 0) {
        process.nextTick(callback, null, EMPTY_BLOCK);
        return;
      }

      const endpoint = this._isServer ? 'server' : 'client';

      if (!this._deflate) {
        const key = `${endpoint}_max_window_bits`;
        const windowBits =
          typeof this.params[key] !== 'number'
            ? zlib.Z_DEFAULT_WINDOWBITS
            : this.params[key];

        this._deflate = zlib.createDeflateRaw({
          ...this._options.zlibDeflateOptions,
          windowBits
        });

        this._deflate[kTotalLength] = 0;
        this._deflate[kBuffers] = [];

        //
        // An `'error'` event is emitted, only on Node.js < 10.0.0, if the
        // `zlib.DeflateRaw` instance is closed while data is being processed.
        // This can happen if `PerMessageDeflate#cleanup()` is called at the wrong
        // time due to an abnormal WebSocket closure.
        //
        this._deflate.on('error', NOOP);
        this._deflate.on('data', deflateOnData);
      }

      this._deflate.write(data);
      this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
        if (!this._deflate) {
          //
          // This `if` statement is only needed for Node.js < 10.0.0 because as of
          // commit https://github.com/nodejs/node/commit/5e3f5164, the flush
          // callback is no longer called if the deflate stream is closed while
          // data is being processed.
          //
          return;
        }

        let data = bufferUtil.concat(
          this._deflate[kBuffers],
          this._deflate[kTotalLength]
        );

        if (fin) data = data.slice(0, data.length - 4);

        if (fin && this.params[`${endpoint}_no_context_takeover`]) {
          this._deflate.close();
          this._deflate = null;
        } else {
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
        }

        callback(null, data);
      });
    }
  }

  var permessageDeflate = PerMessageDeflate;

  /**
   * The listener of the `zlib.DeflateRaw` stream `'data'` event.
   *
   * @param {Buffer} chunk A chunk of data
   * @private
   */
  function deflateOnData(chunk) {
    this[kBuffers].push(chunk);
    this[kTotalLength] += chunk.length;
  }

  /**
   * The listener of the `zlib.InflateRaw` stream `'data'` event.
   *
   * @param {Buffer} chunk A chunk of data
   * @private
   */
  function inflateOnData(chunk) {
    this[kTotalLength] += chunk.length;

    if (
      this[kPerMessageDeflate]._maxPayload < 1 ||
      this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload
    ) {
      this[kBuffers].push(chunk);
      return;
    }

    this[kError] = new RangeError('Max payload size exceeded');
    this[kError][kStatusCode] = 1009;
    this.removeListener('data', inflateOnData);
    this.reset();
  }

  /**
   * The listener of the `zlib.InflateRaw` stream `'error'` event.
   *
   * @param {Error} err The emitted error
   * @private
   */
  function inflateOnError(err) {
    //
    // There is no need to call `Zlib#close()` as the handle is automatically
    // closed when an error is emitted.
    //
    this[kPerMessageDeflate]._inflate = null;
    err[kStatusCode] = 1007;
    this[kCallback](err);
  }

  var validation = createCommonjsModule(function (module, exports) {

  try {
    const isValidUTF8 = utf8Validate;

    exports.isValidUTF8 =
      typeof isValidUTF8 === 'object'
        ? isValidUTF8.Validation.isValidUTF8 // utf-8-validate@<3.0.0
        : isValidUTF8;
  } catch (e) /* istanbul ignore next */ {
    exports.isValidUTF8 = () => true;
  }

  /**
   * Checks if a status code is allowed in a close frame.
   *
   * @param {Number} code The status code
   * @return {Boolean} `true` if the status code is valid, else `false`
   * @public
   */
  exports.isValidStatusCode = (code) => {
    return (
      (code >= 1000 &&
        code <= 1013 &&
        code !== 1004 &&
        code !== 1005 &&
        code !== 1006) ||
      (code >= 3000 && code <= 4999)
    );
  };
  });
  var validation_1 = validation.isValidUTF8;
  var validation_2 = validation.isValidStatusCode;

  const { Writable } = stream;


  const {
    BINARY_TYPES,
    EMPTY_BUFFER,
    kStatusCode: kStatusCode$1,
    kWebSocket
  } = constants;
  const { concat, toArrayBuffer, unmask } = bufferUtil;
  const { isValidStatusCode, isValidUTF8 } = validation;

  const GET_INFO = 0;
  const GET_PAYLOAD_LENGTH_16 = 1;
  const GET_PAYLOAD_LENGTH_64 = 2;
  const GET_MASK = 3;
  const GET_DATA = 4;
  const INFLATING = 5;

  /**
   * HyBi Receiver implementation.
   *
   * @extends stream.Writable
   */
  class Receiver extends Writable {
    /**
     * Creates a Receiver instance.
     *
     * @param {String} binaryType The type for binary data
     * @param {Object} extensions An object containing the negotiated extensions
     * @param {Number} maxPayload The maximum allowed message length
     */
    constructor(binaryType, extensions, maxPayload) {
      super();

      this._binaryType = binaryType || BINARY_TYPES[0];
      this[kWebSocket] = undefined;
      this._extensions = extensions || {};
      this._maxPayload = maxPayload | 0;

      this._bufferedBytes = 0;
      this._buffers = [];

      this._compressed = false;
      this._payloadLength = 0;
      this._mask = undefined;
      this._fragmented = 0;
      this._masked = false;
      this._fin = false;
      this._opcode = 0;

      this._totalPayloadLength = 0;
      this._messageLength = 0;
      this._fragments = [];

      this._state = GET_INFO;
      this._loop = false;
    }

    /**
     * Implements `Writable.prototype._write()`.
     *
     * @param {Buffer} chunk The chunk of data to write
     * @param {String} encoding The character encoding of `chunk`
     * @param {Function} cb Callback
     */
    _write(chunk, encoding, cb) {
      if (this._opcode === 0x08 && this._state == GET_INFO) return cb();

      this._bufferedBytes += chunk.length;
      this._buffers.push(chunk);
      this.startLoop(cb);
    }

    /**
     * Consumes `n` bytes from the buffered data.
     *
     * @param {Number} n The number of bytes to consume
     * @return {Buffer} The consumed bytes
     * @private
     */
    consume(n) {
      this._bufferedBytes -= n;

      if (n === this._buffers[0].length) return this._buffers.shift();

      if (n < this._buffers[0].length) {
        const buf = this._buffers[0];
        this._buffers[0] = buf.slice(n);
        return buf.slice(0, n);
      }

      const dst = Buffer.allocUnsafe(n);

      do {
        const buf = this._buffers[0];

        if (n >= buf.length) {
          this._buffers.shift().copy(dst, dst.length - n);
        } else {
          buf.copy(dst, dst.length - n, 0, n);
          this._buffers[0] = buf.slice(n);
        }

        n -= buf.length;
      } while (n > 0);

      return dst;
    }

    /**
     * Starts the parsing loop.
     *
     * @param {Function} cb Callback
     * @private
     */
    startLoop(cb) {
      let err;
      this._loop = true;

      do {
        switch (this._state) {
          case GET_INFO:
            err = this.getInfo();
            break;
          case GET_PAYLOAD_LENGTH_16:
            err = this.getPayloadLength16();
            break;
          case GET_PAYLOAD_LENGTH_64:
            err = this.getPayloadLength64();
            break;
          case GET_MASK:
            this.getMask();
            break;
          case GET_DATA:
            err = this.getData(cb);
            break;
          default:
            // `INFLATING`
            this._loop = false;
            return;
        }
      } while (this._loop);

      cb(err);
    }

    /**
     * Reads the first two bytes of a frame.
     *
     * @return {(RangeError|undefined)} A possible error
     * @private
     */
    getInfo() {
      if (this._bufferedBytes < 2) {
        this._loop = false;
        return;
      }

      const buf = this.consume(2);

      if ((buf[0] & 0x30) !== 0x00) {
        this._loop = false;
        return error(RangeError, 'RSV2 and RSV3 must be clear', true, 1002);
      }

      const compressed = (buf[0] & 0x40) === 0x40;

      if (compressed && !this._extensions[permessageDeflate.extensionName]) {
        this._loop = false;
        return error(RangeError, 'RSV1 must be clear', true, 1002);
      }

      this._fin = (buf[0] & 0x80) === 0x80;
      this._opcode = buf[0] & 0x0f;
      this._payloadLength = buf[1] & 0x7f;

      if (this._opcode === 0x00) {
        if (compressed) {
          this._loop = false;
          return error(RangeError, 'RSV1 must be clear', true, 1002);
        }

        if (!this._fragmented) {
          this._loop = false;
          return error(RangeError, 'invalid opcode 0', true, 1002);
        }

        this._opcode = this._fragmented;
      } else if (this._opcode === 0x01 || this._opcode === 0x02) {
        if (this._fragmented) {
          this._loop = false;
          return error(RangeError, `invalid opcode ${this._opcode}`, true, 1002);
        }

        this._compressed = compressed;
      } else if (this._opcode > 0x07 && this._opcode < 0x0b) {
        if (!this._fin) {
          this._loop = false;
          return error(RangeError, 'FIN must be set', true, 1002);
        }

        if (compressed) {
          this._loop = false;
          return error(RangeError, 'RSV1 must be clear', true, 1002);
        }

        if (this._payloadLength > 0x7d) {
          this._loop = false;
          return error(
            RangeError,
            `invalid payload length ${this._payloadLength}`,
            true,
            1002
          );
        }
      } else {
        this._loop = false;
        return error(RangeError, `invalid opcode ${this._opcode}`, true, 1002);
      }

      if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
      this._masked = (buf[1] & 0x80) === 0x80;

      if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
      else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
      else return this.haveLength();
    }

    /**
     * Gets extended payload length (7+16).
     *
     * @return {(RangeError|undefined)} A possible error
     * @private
     */
    getPayloadLength16() {
      if (this._bufferedBytes < 2) {
        this._loop = false;
        return;
      }

      this._payloadLength = this.consume(2).readUInt16BE(0);
      return this.haveLength();
    }

    /**
     * Gets extended payload length (7+64).
     *
     * @return {(RangeError|undefined)} A possible error
     * @private
     */
    getPayloadLength64() {
      if (this._bufferedBytes < 8) {
        this._loop = false;
        return;
      }

      const buf = this.consume(8);
      const num = buf.readUInt32BE(0);

      //
      // The maximum safe integer in JavaScript is 2^53 - 1. An error is returned
      // if payload length is greater than this number.
      //
      if (num > Math.pow(2, 53 - 32) - 1) {
        this._loop = false;
        return error(
          RangeError,
          'Unsupported WebSocket frame: payload length > 2^53 - 1',
          false,
          1009
        );
      }

      this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
      return this.haveLength();
    }

    /**
     * Payload length has been read.
     *
     * @return {(RangeError|undefined)} A possible error
     * @private
     */
    haveLength() {
      if (this._payloadLength && this._opcode < 0x08) {
        this._totalPayloadLength += this._payloadLength;
        if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
          this._loop = false;
          return error(RangeError, 'Max payload size exceeded', false, 1009);
        }
      }

      if (this._masked) this._state = GET_MASK;
      else this._state = GET_DATA;
    }

    /**
     * Reads mask bytes.
     *
     * @private
     */
    getMask() {
      if (this._bufferedBytes < 4) {
        this._loop = false;
        return;
      }

      this._mask = this.consume(4);
      this._state = GET_DATA;
    }

    /**
     * Reads data bytes.
     *
     * @param {Function} cb Callback
     * @return {(Error|RangeError|undefined)} A possible error
     * @private
     */
    getData(cb) {
      let data = EMPTY_BUFFER;

      if (this._payloadLength) {
        if (this._bufferedBytes < this._payloadLength) {
          this._loop = false;
          return;
        }

        data = this.consume(this._payloadLength);
        if (this._masked) unmask(data, this._mask);
      }

      if (this._opcode > 0x07) return this.controlMessage(data);

      if (this._compressed) {
        this._state = INFLATING;
        this.decompress(data, cb);
        return;
      }

      if (data.length) {
        //
        // This message is not compressed so its lenght is the sum of the payload
        // length of all fragments.
        //
        this._messageLength = this._totalPayloadLength;
        this._fragments.push(data);
      }

      return this.dataMessage();
    }

    /**
     * Decompresses data.
     *
     * @param {Buffer} data Compressed data
     * @param {Function} cb Callback
     * @private
     */
    decompress(data, cb) {
      const perMessageDeflate = this._extensions[permessageDeflate.extensionName];

      perMessageDeflate.decompress(data, this._fin, (err, buf) => {
        if (err) return cb(err);

        if (buf.length) {
          this._messageLength += buf.length;
          if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
            return cb(
              error(RangeError, 'Max payload size exceeded', false, 1009)
            );
          }

          this._fragments.push(buf);
        }

        const er = this.dataMessage();
        if (er) return cb(er);

        this.startLoop(cb);
      });
    }

    /**
     * Handles a data message.
     *
     * @return {(Error|undefined)} A possible error
     * @private
     */
    dataMessage() {
      if (this._fin) {
        const messageLength = this._messageLength;
        const fragments = this._fragments;

        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._fragments = [];

        if (this._opcode === 2) {
          let data;

          if (this._binaryType === 'nodebuffer') {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === 'arraybuffer') {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else {
            data = fragments;
          }

          this.emit('message', data);
        } else {
          const buf = concat(fragments, messageLength);

          if (!isValidUTF8(buf)) {
            this._loop = false;
            return error(Error, 'invalid UTF-8 sequence', true, 1007);
          }

          this.emit('message', buf.toString());
        }
      }

      this._state = GET_INFO;
    }

    /**
     * Handles a control message.
     *
     * @param {Buffer} data Data to handle
     * @return {(Error|RangeError|undefined)} A possible error
     * @private
     */
    controlMessage(data) {
      if (this._opcode === 0x08) {
        this._loop = false;

        if (data.length === 0) {
          this.emit('conclude', 1005, '');
          this.end();
        } else if (data.length === 1) {
          return error(RangeError, 'invalid payload length 1', true, 1002);
        } else {
          const code = data.readUInt16BE(0);

          if (!isValidStatusCode(code)) {
            return error(RangeError, `invalid status code ${code}`, true, 1002);
          }

          const buf = data.slice(2);

          if (!isValidUTF8(buf)) {
            return error(Error, 'invalid UTF-8 sequence', true, 1007);
          }

          this.emit('conclude', code, buf.toString());
          this.end();
        }
      } else if (this._opcode === 0x09) {
        this.emit('ping', data);
      } else {
        this.emit('pong', data);
      }

      this._state = GET_INFO;
    }
  }

  var receiver = Receiver;

  /**
   * Builds an error object.
   *
   * @param {(Error|RangeError)} ErrorCtor The error constructor
   * @param {String} message The error message
   * @param {Boolean} prefix Specifies whether or not to add a default prefix to
   *     `message`
   * @param {Number} statusCode The status code
   * @return {(Error|RangeError)} The error
   * @private
   */
  function error(ErrorCtor, message, prefix, statusCode) {
    const err = new ErrorCtor(
      prefix ? `Invalid WebSocket frame: ${message}` : message
    );

    Error.captureStackTrace(err, error);
    err[kStatusCode$1] = statusCode;
    return err;
  }

  const { randomFillSync } = crypto;


  const { EMPTY_BUFFER: EMPTY_BUFFER$1 } = constants;
  const { isValidStatusCode: isValidStatusCode$1 } = validation;
  const { mask: applyMask, toBuffer } = bufferUtil;

  const mask = Buffer.alloc(4);

  /**
   * HyBi Sender implementation.
   */
  class Sender {
    /**
     * Creates a Sender instance.
     *
     * @param {net.Socket} socket The connection socket
     * @param {Object} extensions An object containing the negotiated extensions
     */
    constructor(socket, extensions) {
      this._extensions = extensions || {};
      this._socket = socket;

      this._firstFragment = true;
      this._compress = false;

      this._bufferedBytes = 0;
      this._deflating = false;
      this._queue = [];
    }

    /**
     * Frames a piece of data according to the HyBi WebSocket protocol.
     *
     * @param {Buffer} data The data to frame
     * @param {Object} options Options object
     * @param {Number} options.opcode The opcode
     * @param {Boolean} options.readOnly Specifies whether `data` can be modified
     * @param {Boolean} options.fin Specifies whether or not to set the FIN bit
     * @param {Boolean} options.mask Specifies whether or not to mask `data`
     * @param {Boolean} options.rsv1 Specifies whether or not to set the RSV1 bit
     * @return {Buffer[]} The framed data as a list of `Buffer` instances
     * @public
     */
    static frame(data, options) {
      const merge = options.mask && options.readOnly;
      let offset = options.mask ? 6 : 2;
      let payloadLength = data.length;

      if (data.length >= 65536) {
        offset += 8;
        payloadLength = 127;
      } else if (data.length > 125) {
        offset += 2;
        payloadLength = 126;
      }

      const target = Buffer.allocUnsafe(merge ? data.length + offset : offset);

      target[0] = options.fin ? options.opcode | 0x80 : options.opcode;
      if (options.rsv1) target[0] |= 0x40;

      target[1] = payloadLength;

      if (payloadLength === 126) {
        target.writeUInt16BE(data.length, 2);
      } else if (payloadLength === 127) {
        target.writeUInt32BE(0, 2);
        target.writeUInt32BE(data.length, 6);
      }

      if (!options.mask) return [target, data];

      randomFillSync(mask, 0, 4);

      target[1] |= 0x80;
      target[offset - 4] = mask[0];
      target[offset - 3] = mask[1];
      target[offset - 2] = mask[2];
      target[offset - 1] = mask[3];

      if (merge) {
        applyMask(data, mask, target, offset, data.length);
        return [target];
      }

      applyMask(data, mask, data, 0, data.length);
      return [target, data];
    }

    /**
     * Sends a close message to the other peer.
     *
     * @param {(Number|undefined)} code The status code component of the body
     * @param {String} data The message component of the body
     * @param {Boolean} mask Specifies whether or not to mask the message
     * @param {Function} cb Callback
     * @public
     */
    close(code, data, mask, cb) {
      let buf;

      if (code === undefined) {
        buf = EMPTY_BUFFER$1;
      } else if (typeof code !== 'number' || !isValidStatusCode$1(code)) {
        throw new TypeError('First argument must be a valid error code number');
      } else if (data === undefined || data === '') {
        buf = Buffer.allocUnsafe(2);
        buf.writeUInt16BE(code, 0);
      } else {
        buf = Buffer.allocUnsafe(2 + Buffer.byteLength(data));
        buf.writeUInt16BE(code, 0);
        buf.write(data, 2);
      }

      if (this._deflating) {
        this.enqueue([this.doClose, buf, mask, cb]);
      } else {
        this.doClose(buf, mask, cb);
      }
    }

    /**
     * Frames and sends a close message.
     *
     * @param {Buffer} data The message to send
     * @param {Boolean} mask Specifies whether or not to mask `data`
     * @param {Function} cb Callback
     * @private
     */
    doClose(data, mask, cb) {
      this.sendFrame(
        Sender.frame(data, {
          fin: true,
          rsv1: false,
          opcode: 0x08,
          mask,
          readOnly: false
        }),
        cb
      );
    }

    /**
     * Sends a ping message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Boolean} mask Specifies whether or not to mask `data`
     * @param {Function} cb Callback
     * @public
     */
    ping(data, mask, cb) {
      const buf = toBuffer(data);

      if (this._deflating) {
        this.enqueue([this.doPing, buf, mask, toBuffer.readOnly, cb]);
      } else {
        this.doPing(buf, mask, toBuffer.readOnly, cb);
      }
    }

    /**
     * Frames and sends a ping message.
     *
     * @param {*} data The message to send
     * @param {Boolean} mask Specifies whether or not to mask `data`
     * @param {Boolean} readOnly Specifies whether `data` can be modified
     * @param {Function} cb Callback
     * @private
     */
    doPing(data, mask, readOnly, cb) {
      this.sendFrame(
        Sender.frame(data, {
          fin: true,
          rsv1: false,
          opcode: 0x09,
          mask,
          readOnly
        }),
        cb
      );
    }

    /**
     * Sends a pong message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Boolean} mask Specifies whether or not to mask `data`
     * @param {Function} cb Callback
     * @public
     */
    pong(data, mask, cb) {
      const buf = toBuffer(data);

      if (this._deflating) {
        this.enqueue([this.doPong, buf, mask, toBuffer.readOnly, cb]);
      } else {
        this.doPong(buf, mask, toBuffer.readOnly, cb);
      }
    }

    /**
     * Frames and sends a pong message.
     *
     * @param {*} data The message to send
     * @param {Boolean} mask Specifies whether or not to mask `data`
     * @param {Boolean} readOnly Specifies whether `data` can be modified
     * @param {Function} cb Callback
     * @private
     */
    doPong(data, mask, readOnly, cb) {
      this.sendFrame(
        Sender.frame(data, {
          fin: true,
          rsv1: false,
          opcode: 0x0a,
          mask,
          readOnly
        }),
        cb
      );
    }

    /**
     * Sends a data message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Object} options Options object
     * @param {Boolean} options.compress Specifies whether or not to compress `data`
     * @param {Boolean} options.binary Specifies whether `data` is binary or text
     * @param {Boolean} options.fin Specifies whether the fragment is the last one
     * @param {Boolean} options.mask Specifies whether or not to mask `data`
     * @param {Function} cb Callback
     * @public
     */
    send(data, options, cb) {
      const buf = toBuffer(data);
      const perMessageDeflate = this._extensions[permessageDeflate.extensionName];
      let opcode = options.binary ? 2 : 1;
      let rsv1 = options.compress;

      if (this._firstFragment) {
        this._firstFragment = false;
        if (rsv1 && perMessageDeflate) {
          rsv1 = buf.length >= perMessageDeflate._threshold;
        }
        this._compress = rsv1;
      } else {
        rsv1 = false;
        opcode = 0;
      }

      if (options.fin) this._firstFragment = true;

      if (perMessageDeflate) {
        const opts = {
          fin: options.fin,
          rsv1,
          opcode,
          mask: options.mask,
          readOnly: toBuffer.readOnly
        };

        if (this._deflating) {
          this.enqueue([this.dispatch, buf, this._compress, opts, cb]);
        } else {
          this.dispatch(buf, this._compress, opts, cb);
        }
      } else {
        this.sendFrame(
          Sender.frame(buf, {
            fin: options.fin,
            rsv1: false,
            opcode,
            mask: options.mask,
            readOnly: toBuffer.readOnly
          }),
          cb
        );
      }
    }

    /**
     * Dispatches a data message.
     *
     * @param {Buffer} data The message to send
     * @param {Boolean} compress Specifies whether or not to compress `data`
     * @param {Object} options Options object
     * @param {Number} options.opcode The opcode
     * @param {Boolean} options.readOnly Specifies whether `data` can be modified
     * @param {Boolean} options.fin Specifies whether or not to set the FIN bit
     * @param {Boolean} options.mask Specifies whether or not to mask `data`
     * @param {Boolean} options.rsv1 Specifies whether or not to set the RSV1 bit
     * @param {Function} cb Callback
     * @private
     */
    dispatch(data, compress, options, cb) {
      if (!compress) {
        this.sendFrame(Sender.frame(data, options), cb);
        return;
      }

      const perMessageDeflate = this._extensions[permessageDeflate.extensionName];

      this._deflating = true;
      perMessageDeflate.compress(data, options.fin, (_, buf) => {
        this._deflating = false;
        options.readOnly = false;
        this.sendFrame(Sender.frame(buf, options), cb);
        this.dequeue();
      });
    }

    /**
     * Executes queued send operations.
     *
     * @private
     */
    dequeue() {
      while (!this._deflating && this._queue.length) {
        const params = this._queue.shift();

        this._bufferedBytes -= params[1].length;
        Reflect.apply(params[0], this, params.slice(1));
      }
    }

    /**
     * Enqueues a send operation.
     *
     * @param {Array} params Send operation parameters.
     * @private
     */
    enqueue(params) {
      this._bufferedBytes += params[1].length;
      this._queue.push(params);
    }

    /**
     * Sends a frame.
     *
     * @param {Buffer[]} list The frame to send
     * @param {Function} cb Callback
     * @private
     */
    sendFrame(list, cb) {
      if (list.length === 2) {
        this._socket.cork();
        this._socket.write(list[0]);
        this._socket.write(list[1], cb);
        this._socket.uncork();
      } else {
        this._socket.write(list[0], cb);
      }
    }
  }

  var sender = Sender;

  /**
   * Class representing an event.
   *
   * @private
   */
  class Event {
    /**
     * Create a new `Event`.
     *
     * @param {String} type The name of the event
     * @param {Object} target A reference to the target to which the event was dispatched
     */
    constructor(type, target) {
      this.target = target;
      this.type = type;
    }
  }

  /**
   * Class representing a message event.
   *
   * @extends Event
   * @private
   */
  class MessageEvent extends Event {
    /**
     * Create a new `MessageEvent`.
     *
     * @param {(String|Buffer|ArrayBuffer|Buffer[])} data The received data
     * @param {WebSocket} target A reference to the target to which the event was dispatched
     */
    constructor(data, target) {
      super('message', target);

      this.data = data;
    }
  }

  /**
   * Class representing a close event.
   *
   * @extends Event
   * @private
   */
  class CloseEvent extends Event {
    /**
     * Create a new `CloseEvent`.
     *
     * @param {Number} code The status code explaining why the connection is being closed
     * @param {String} reason A human-readable string explaining why the connection is closing
     * @param {WebSocket} target A reference to the target to which the event was dispatched
     */
    constructor(code, reason, target) {
      super('close', target);

      this.wasClean = target._closeFrameReceived && target._closeFrameSent;
      this.reason = reason;
      this.code = code;
    }
  }

  /**
   * Class representing an open event.
   *
   * @extends Event
   * @private
   */
  class OpenEvent extends Event {
    /**
     * Create a new `OpenEvent`.
     *
     * @param {WebSocket} target A reference to the target to which the event was dispatched
     */
    constructor(target) {
      super('open', target);
    }
  }

  /**
   * Class representing an error event.
   *
   * @extends Event
   * @private
   */
  class ErrorEvent extends Event {
    /**
     * Create a new `ErrorEvent`.
     *
     * @param {Object} error The error that generated this event
     * @param {WebSocket} target A reference to the target to which the event was dispatched
     */
    constructor(error, target) {
      super('error', target);

      this.message = error.message;
      this.error = error;
    }
  }

  /**
   * This provides methods for emulating the `EventTarget` interface. It's not
   * meant to be used directly.
   *
   * @mixin
   */
  const EventTarget = {
    /**
     * Register an event listener.
     *
     * @param {String} method A string representing the event type to listen for
     * @param {Function} listener The listener to add
     * @public
     */
    addEventListener(method, listener) {
      if (typeof listener !== 'function') return;

      function onMessage(data) {
        listener.call(this, new MessageEvent(data, this));
      }

      function onClose(code, message) {
        listener.call(this, new CloseEvent(code, message, this));
      }

      function onError(error) {
        listener.call(this, new ErrorEvent(error, this));
      }

      function onOpen() {
        listener.call(this, new OpenEvent(this));
      }

      if (method === 'message') {
        onMessage._listener = listener;
        this.on(method, onMessage);
      } else if (method === 'close') {
        onClose._listener = listener;
        this.on(method, onClose);
      } else if (method === 'error') {
        onError._listener = listener;
        this.on(method, onError);
      } else if (method === 'open') {
        onOpen._listener = listener;
        this.on(method, onOpen);
      } else {
        this.on(method, listener);
      }
    },

    /**
     * Remove an event listener.
     *
     * @param {String} method A string representing the event type to remove
     * @param {Function} listener The listener to remove
     * @public
     */
    removeEventListener(method, listener) {
      const listeners = this.listeners(method);

      for (let i = 0; i < listeners.length; i++) {
        if (listeners[i] === listener || listeners[i]._listener === listener) {
          this.removeListener(method, listeners[i]);
        }
      }
    }
  };

  var eventTarget = EventTarget;

  //
  // Allowed token characters:
  //
  // '!', '#', '$', '%', '&', ''', '*', '+', '-',
  // '.', 0-9, A-Z, '^', '_', '`', a-z, '|', '~'
  //
  // tokenChars[32] === 0 // ' '
  // tokenChars[33] === 1 // '!'
  // tokenChars[34] === 0 // '"'
  // ...
  //
  // prettier-ignore
  const tokenChars = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0 - 15
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 16 - 31
    0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, // 32 - 47
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, // 48 - 63
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 64 - 79
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, // 80 - 95
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 96 - 111
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0 // 112 - 127
  ];

  /**
   * Adds an offer to the map of extension offers or a parameter to the map of
   * parameters.
   *
   * @param {Object} dest The map of extension offers or parameters
   * @param {String} name The extension or parameter name
   * @param {(Object|Boolean|String)} elem The extension parameters or the
   *     parameter value
   * @private
   */
  function push(dest, name, elem) {
    if (dest[name] === undefined) dest[name] = [elem];
    else dest[name].push(elem);
  }

  /**
   * Parses the `Sec-WebSocket-Extensions` header into an object.
   *
   * @param {String} header The field value of the header
   * @return {Object} The parsed object
   * @public
   */
  function parse(header) {
    const offers = Object.create(null);

    if (header === undefined || header === '') return offers;

    let params = Object.create(null);
    let mustUnescape = false;
    let isEscaping = false;
    let inQuotes = false;
    let extensionName;
    let paramName;
    let start = -1;
    let end = -1;
    let i = 0;

    for (; i < header.length; i++) {
      const code = header.charCodeAt(i);

      if (extensionName === undefined) {
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (code === 0x20 /* ' ' */ || code === 0x09 /* '\t' */) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 0x3b /* ';' */ || code === 0x2c /* ',' */) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }

          if (end === -1) end = i;
          const name = header.slice(start, end);
          if (code === 0x2c) {
            push(offers, name, params);
            params = Object.create(null);
          } else {
            extensionName = name;
          }

          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      } else if (paramName === undefined) {
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (code === 0x20 || code === 0x09) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 0x3b || code === 0x2c) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }

          if (end === -1) end = i;
          push(params, header.slice(start, end), true);
          if (code === 0x2c) {
            push(offers, extensionName, params);
            params = Object.create(null);
            extensionName = undefined;
          }

          start = end = -1;
        } else if (code === 0x3d /* '=' */ && start !== -1 && end === -1) {
          paramName = header.slice(start, i);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      } else {
        //
        // The value of a quoted-string after unescaping must conform to the
        // token ABNF, so only token characters are valid.
        // Ref: https://tools.ietf.org/html/rfc6455#section-9.1
        //
        if (isEscaping) {
          if (tokenChars[code] !== 1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (start === -1) start = i;
          else if (!mustUnescape) mustUnescape = true;
          isEscaping = false;
        } else if (inQuotes) {
          if (tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 0x22 /* '"' */ && start !== -1) {
            inQuotes = false;
            end = i;
          } else if (code === 0x5c /* '\' */) {
            isEscaping = true;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (code === 0x22 && header.charCodeAt(i - 1) === 0x3d) {
          inQuotes = true;
        } else if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (start !== -1 && (code === 0x20 || code === 0x09)) {
          if (end === -1) end = i;
        } else if (code === 0x3b || code === 0x2c) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }

          if (end === -1) end = i;
          let value = header.slice(start, end);
          if (mustUnescape) {
            value = value.replace(/\\/g, '');
            mustUnescape = false;
          }
          push(params, paramName, value);
          if (code === 0x2c) {
            push(offers, extensionName, params);
            params = Object.create(null);
            extensionName = undefined;
          }

          paramName = undefined;
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
    }

    if (start === -1 || inQuotes) {
      throw new SyntaxError('Unexpected end of input');
    }

    if (end === -1) end = i;
    const token = header.slice(start, end);
    if (extensionName === undefined) {
      push(offers, token, params);
    } else {
      if (paramName === undefined) {
        push(params, token, true);
      } else if (mustUnescape) {
        push(params, paramName, token.replace(/\\/g, ''));
      } else {
        push(params, paramName, token);
      }
      push(offers, extensionName, params);
    }

    return offers;
  }

  /**
   * Builds the `Sec-WebSocket-Extensions` header field value.
   *
   * @param {Object} extensions The map of extensions and parameters to format
   * @return {String} A string representing the given object
   * @public
   */
  function format(extensions) {
    return Object.keys(extensions)
      .map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations
          .map((params) => {
            return [extension]
              .concat(
                Object.keys(params).map((k) => {
                  let values = params[k];
                  if (!Array.isArray(values)) values = [values];
                  return values
                    .map((v) => (v === true ? k : `${k}=${v}`))
                    .join('; ');
                })
              )
              .join('; ');
          })
          .join(', ');
      })
      .join(', ');
  }

  var extension = { format, parse };

  const { randomBytes, createHash } = crypto;
  const { URL } = url;




  const {
    BINARY_TYPES: BINARY_TYPES$1,
    EMPTY_BUFFER: EMPTY_BUFFER$2,
    GUID,
    kStatusCode: kStatusCode$2,
    kWebSocket: kWebSocket$1,
    NOOP: NOOP$1
  } = constants;
  const { addEventListener, removeEventListener } = eventTarget;
  const { format: format$1, parse: parse$1 } = extension;
  const { toBuffer: toBuffer$1 } = bufferUtil;

  const readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
  const protocolVersions = [8, 13];
  const closeTimeout = 30 * 1000;

  /**
   * Class representing a WebSocket.
   *
   * @extends EventEmitter
   */
  class WebSocket extends events {
    /**
     * Create a new `WebSocket`.
     *
     * @param {(String|url.URL)} address The URL to which to connect
     * @param {(String|String[])} protocols The subprotocols
     * @param {Object} options Connection options
     */
    constructor(address, protocols, options) {
      super();

      this.readyState = WebSocket.CONNECTING;
      this.protocol = '';

      this._binaryType = BINARY_TYPES$1[0];
      this._closeFrameReceived = false;
      this._closeFrameSent = false;
      this._closeMessage = '';
      this._closeTimer = null;
      this._closeCode = 1006;
      this._extensions = {};
      this._receiver = null;
      this._sender = null;
      this._socket = null;

      if (address !== null) {
        this._bufferedAmount = 0;
        this._isServer = false;
        this._redirects = 0;

        if (Array.isArray(protocols)) {
          protocols = protocols.join(', ');
        } else if (typeof protocols === 'object' && protocols !== null) {
          options = protocols;
          protocols = undefined;
        }

        initAsClient(this, address, protocols, options);
      } else {
        this._isServer = true;
      }
    }

    get CONNECTING() {
      return WebSocket.CONNECTING;
    }
    get CLOSING() {
      return WebSocket.CLOSING;
    }
    get CLOSED() {
      return WebSocket.CLOSED;
    }
    get OPEN() {
      return WebSocket.OPEN;
    }

    /**
     * This deviates from the WHATWG interface since ws doesn't support the
     * required default "blob" type (instead we define a custom "nodebuffer"
     * type).
     *
     * @type {String}
     */
    get binaryType() {
      return this._binaryType;
    }

    set binaryType(type) {
      if (!BINARY_TYPES$1.includes(type)) return;

      this._binaryType = type;

      //
      // Allow to change `binaryType` on the fly.
      //
      if (this._receiver) this._receiver._binaryType = type;
    }

    /**
     * @type {Number}
     */
    get bufferedAmount() {
      if (!this._socket) return this._bufferedAmount;

      //
      // `socket.bufferSize` is `undefined` if the socket is closed.
      //
      return (this._socket.bufferSize || 0) + this._sender._bufferedBytes;
    }

    /**
     * @type {String}
     */
    get extensions() {
      return Object.keys(this._extensions).join();
    }

    /**
     * Set up the socket and the internal resources.
     *
     * @param {net.Socket} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Number} maxPayload The maximum allowed message size
     * @private
     */
    setSocket(socket, head, maxPayload) {
      const receiver$$1 = new receiver(
        this._binaryType,
        this._extensions,
        maxPayload
      );

      this._sender = new sender(socket, this._extensions);
      this._receiver = receiver$$1;
      this._socket = socket;

      receiver$$1[kWebSocket$1] = this;
      socket[kWebSocket$1] = this;

      receiver$$1.on('conclude', receiverOnConclude);
      receiver$$1.on('drain', receiverOnDrain);
      receiver$$1.on('error', receiverOnError);
      receiver$$1.on('message', receiverOnMessage);
      receiver$$1.on('ping', receiverOnPing);
      receiver$$1.on('pong', receiverOnPong);

      socket.setTimeout(0);
      socket.setNoDelay();

      if (head.length > 0) socket.unshift(head);

      socket.on('close', socketOnClose);
      socket.on('data', socketOnData);
      socket.on('end', socketOnEnd);
      socket.on('error', socketOnError);

      this.readyState = WebSocket.OPEN;
      this.emit('open');
    }

    /**
     * Emit the `'close'` event.
     *
     * @private
     */
    emitClose() {
      this.readyState = WebSocket.CLOSED;

      if (!this._socket) {
        this.emit('close', this._closeCode, this._closeMessage);
        return;
      }

      if (this._extensions[permessageDeflate.extensionName]) {
        this._extensions[permessageDeflate.extensionName].cleanup();
      }

      this._receiver.removeAllListeners();
      this.emit('close', this._closeCode, this._closeMessage);
    }

    /**
     * Start a closing handshake.
     *
     *          +----------+   +-----------+   +----------+
     *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
     *    |     +----------+   +-----------+   +----------+     |
     *          +----------+   +-----------+         |
     * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
     *          +----------+   +-----------+   |
     *    |           |                        |   +---+        |
     *                +------------------------+-->|fin| - - - -
     *    |         +---+                      |   +---+
     *     - - - - -|fin|<---------------------+
     *              +---+
     *
     * @param {Number} code Status code explaining why the connection is closing
     * @param {String} data A string explaining why the connection is closing
     * @public
     */
    close(code, data) {
      if (this.readyState === WebSocket.CLOSED) return;
      if (this.readyState === WebSocket.CONNECTING) {
        const msg = 'WebSocket was closed before the connection was established';
        return abortHandshake(this, this._req, msg);
      }

      if (this.readyState === WebSocket.CLOSING) {
        if (this._closeFrameSent && this._closeFrameReceived) this._socket.end();
        return;
      }

      this.readyState = WebSocket.CLOSING;
      this._sender.close(code, data, !this._isServer, (err) => {
        //
        // This error is handled by the `'error'` listener on the socket. We only
        // want to know if the close frame has been sent here.
        //
        if (err) return;

        this._closeFrameSent = true;
        if (this._closeFrameReceived) this._socket.end();
      });

      //
      // Specify a timeout for the closing handshake to complete.
      //
      this._closeTimer = setTimeout(
        this._socket.destroy.bind(this._socket),
        closeTimeout
      );
    }

    /**
     * Send a ping.
     *
     * @param {*} data The data to send
     * @param {Boolean} mask Indicates whether or not to mask `data`
     * @param {Function} cb Callback which is executed when the ping is sent
     * @public
     */
    ping(data, mask, cb) {
      if (this.readyState === WebSocket.CONNECTING) {
        throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
      }

      if (typeof data === 'function') {
        cb = data;
        data = mask = undefined;
      } else if (typeof mask === 'function') {
        cb = mask;
        mask = undefined;
      }

      if (typeof data === 'number') data = data.toString();

      if (this.readyState !== WebSocket.OPEN) {
        sendAfterClose(this, data, cb);
        return;
      }

      if (mask === undefined) mask = !this._isServer;
      this._sender.ping(data || EMPTY_BUFFER$2, mask, cb);
    }

    /**
     * Send a pong.
     *
     * @param {*} data The data to send
     * @param {Boolean} mask Indicates whether or not to mask `data`
     * @param {Function} cb Callback which is executed when the pong is sent
     * @public
     */
    pong(data, mask, cb) {
      if (this.readyState === WebSocket.CONNECTING) {
        throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
      }

      if (typeof data === 'function') {
        cb = data;
        data = mask = undefined;
      } else if (typeof mask === 'function') {
        cb = mask;
        mask = undefined;
      }

      if (typeof data === 'number') data = data.toString();

      if (this.readyState !== WebSocket.OPEN) {
        sendAfterClose(this, data, cb);
        return;
      }

      if (mask === undefined) mask = !this._isServer;
      this._sender.pong(data || EMPTY_BUFFER$2, mask, cb);
    }

    /**
     * Send a data message.
     *
     * @param {*} data The message to send
     * @param {Object} options Options object
     * @param {Boolean} options.compress Specifies whether or not to compress
     *     `data`
     * @param {Boolean} options.binary Specifies whether `data` is binary or text
     * @param {Boolean} options.fin Specifies whether the fragment is the last one
     * @param {Boolean} options.mask Specifies whether or not to mask `data`
     * @param {Function} cb Callback which is executed when data is written out
     * @public
     */
    send(data, options, cb) {
      if (this.readyState === WebSocket.CONNECTING) {
        throw new Error('WebSocket is not open: readyState 0 (CONNECTING)');
      }

      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      if (typeof data === 'number') data = data.toString();

      if (this.readyState !== WebSocket.OPEN) {
        sendAfterClose(this, data, cb);
        return;
      }

      const opts = {
        binary: typeof data !== 'string',
        mask: !this._isServer,
        compress: true,
        fin: true,
        ...options
      };

      if (!this._extensions[permessageDeflate.extensionName]) {
        opts.compress = false;
      }

      this._sender.send(data || EMPTY_BUFFER$2, opts, cb);
    }

    /**
     * Forcibly close the connection.
     *
     * @public
     */
    terminate() {
      if (this.readyState === WebSocket.CLOSED) return;
      if (this.readyState === WebSocket.CONNECTING) {
        const msg = 'WebSocket was closed before the connection was established';
        return abortHandshake(this, this._req, msg);
      }

      if (this._socket) {
        this.readyState = WebSocket.CLOSING;
        this._socket.destroy();
      }
    }
  }

  readyStates.forEach((readyState, i) => {
    WebSocket[readyState] = i;
  });

  //
  // Add the `onopen`, `onerror`, `onclose`, and `onmessage` attributes.
  // See https://html.spec.whatwg.org/multipage/comms.html#the-websocket-interface
  //
  ['open', 'error', 'close', 'message'].forEach((method) => {
    Object.defineProperty(WebSocket.prototype, `on${method}`, {
      /**
       * Return the listener of the event.
       *
       * @return {(Function|undefined)} The event listener or `undefined`
       * @public
       */
      get() {
        const listeners = this.listeners(method);
        for (let i = 0; i < listeners.length; i++) {
          if (listeners[i]._listener) return listeners[i]._listener;
        }

        return undefined;
      },
      /**
       * Add a listener for the event.
       *
       * @param {Function} listener The listener to add
       * @public
       */
      set(listener) {
        const listeners = this.listeners(method);
        for (let i = 0; i < listeners.length; i++) {
          //
          // Remove only the listeners added via `addEventListener`.
          //
          if (listeners[i]._listener) this.removeListener(method, listeners[i]);
        }
        this.addEventListener(method, listener);
      }
    });
  });

  WebSocket.prototype.addEventListener = addEventListener;
  WebSocket.prototype.removeEventListener = removeEventListener;

  var websocket = WebSocket;

  /**
   * Initialize a WebSocket client.
   *
   * @param {WebSocket} websocket The client to initialize
   * @param {(String|url.URL)} address The URL to which to connect
   * @param {String} protocols The subprotocols
   * @param {Object} options Connection options
   * @param {(Boolean|Object)} options.perMessageDeflate Enable/disable
   *     permessage-deflate
   * @param {Number} options.handshakeTimeout Timeout in milliseconds for the
   *     handshake request
   * @param {Number} options.protocolVersion Value of the `Sec-WebSocket-Version`
   *     header
   * @param {String} options.origin Value of the `Origin` or
   *     `Sec-WebSocket-Origin` header
   * @param {Number} options.maxPayload The maximum allowed message size
   * @param {Boolean} options.followRedirects Whether or not to follow redirects
   * @param {Number} options.maxRedirects The maximum number of redirects allowed
   * @private
   */
  function initAsClient(websocket, address, protocols, options) {
    const opts = {
      protocolVersion: protocolVersions[1],
      maxPayload: 100 * 1024 * 1024,
      perMessageDeflate: true,
      followRedirects: false,
      maxRedirects: 10,
      ...options,
      createConnection: undefined,
      socketPath: undefined,
      hostname: undefined,
      protocol: undefined,
      timeout: undefined,
      method: undefined,
      auth: undefined,
      host: undefined,
      path: undefined,
      port: undefined
    };

    if (!protocolVersions.includes(opts.protocolVersion)) {
      throw new RangeError(
        `Unsupported protocol version: ${opts.protocolVersion} ` +
          `(supported versions: ${protocolVersions.join(', ')})`
      );
    }

    let parsedUrl;

    if (address instanceof URL) {
      parsedUrl = address;
      websocket.url = address.href;
    } else {
      parsedUrl = new URL(address);
      websocket.url = address;
    }

    const isUnixSocket = parsedUrl.protocol === 'ws+unix:';

    if (!parsedUrl.host && (!isUnixSocket || !parsedUrl.pathname)) {
      throw new Error(`Invalid URL: ${websocket.url}`);
    }

    const isSecure =
      parsedUrl.protocol === 'wss:' || parsedUrl.protocol === 'https:';
    const defaultPort = isSecure ? 443 : 80;
    const key = randomBytes(16).toString('base64');
    const get = isSecure ? https.get : http.get;
    let perMessageDeflate;

    opts.createConnection = isSecure ? tlsConnect : netConnect;
    opts.defaultPort = opts.defaultPort || defaultPort;
    opts.port = parsedUrl.port || defaultPort;
    opts.host = parsedUrl.hostname.startsWith('[')
      ? parsedUrl.hostname.slice(1, -1)
      : parsedUrl.hostname;
    opts.headers = {
      'Sec-WebSocket-Version': opts.protocolVersion,
      'Sec-WebSocket-Key': key,
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      ...opts.headers
    };
    opts.path = parsedUrl.pathname + parsedUrl.search;
    opts.timeout = opts.handshakeTimeout;

    if (opts.perMessageDeflate) {
      perMessageDeflate = new permessageDeflate(
        opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
        false,
        opts.maxPayload
      );
      opts.headers['Sec-WebSocket-Extensions'] = format$1({
        [permessageDeflate.extensionName]: perMessageDeflate.offer()
      });
    }
    if (protocols) {
      opts.headers['Sec-WebSocket-Protocol'] = protocols;
    }
    if (opts.origin) {
      if (opts.protocolVersion < 13) {
        opts.headers['Sec-WebSocket-Origin'] = opts.origin;
      } else {
        opts.headers.Origin = opts.origin;
      }
    }
    if (parsedUrl.username || parsedUrl.password) {
      opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
    }

    if (isUnixSocket) {
      const parts = opts.path.split(':');

      opts.socketPath = parts[0];
      opts.path = parts[1];
    }

    let req = (websocket._req = get(opts));

    if (opts.timeout) {
      req.on('timeout', () => {
        abortHandshake(websocket, req, 'Opening handshake has timed out');
      });
    }

    req.on('error', (err) => {
      if (websocket._req.aborted) return;

      req = websocket._req = null;
      websocket.readyState = WebSocket.CLOSING;
      websocket.emit('error', err);
      websocket.emitClose();
    });

    req.on('response', (res) => {
      const location = res.headers.location;
      const statusCode = res.statusCode;

      if (
        location &&
        opts.followRedirects &&
        statusCode >= 300 &&
        statusCode < 400
      ) {
        if (++websocket._redirects > opts.maxRedirects) {
          abortHandshake(websocket, req, 'Maximum redirects exceeded');
          return;
        }

        req.abort();

        const addr = new URL(location, address);

        initAsClient(websocket, addr, protocols, options);
      } else if (!websocket.emit('unexpected-response', req, res)) {
        abortHandshake(
          websocket,
          req,
          `Unexpected server response: ${res.statusCode}`
        );
      }
    });

    req.on('upgrade', (res, socket, head) => {
      websocket.emit('upgrade', res);

      //
      // The user may have closed the connection from a listener of the `upgrade`
      // event.
      //
      if (websocket.readyState !== WebSocket.CONNECTING) return;

      req = websocket._req = null;

      const digest = createHash('sha1')
        .update(key + GUID)
        .digest('base64');

      if (res.headers['sec-websocket-accept'] !== digest) {
        abortHandshake(websocket, socket, 'Invalid Sec-WebSocket-Accept header');
        return;
      }

      const serverProt = res.headers['sec-websocket-protocol'];
      const protList = (protocols || '').split(/, */);
      let protError;

      if (!protocols && serverProt) {
        protError = 'Server sent a subprotocol but none was requested';
      } else if (protocols && !serverProt) {
        protError = 'Server sent no subprotocol';
      } else if (serverProt && !protList.includes(serverProt)) {
        protError = 'Server sent an invalid subprotocol';
      }

      if (protError) {
        abortHandshake(websocket, socket, protError);
        return;
      }

      if (serverProt) websocket.protocol = serverProt;

      if (perMessageDeflate) {
        try {
          const extensions = parse$1(res.headers['sec-websocket-extensions']);

          if (extensions[permessageDeflate.extensionName]) {
            perMessageDeflate.accept(extensions[permessageDeflate.extensionName]);
            websocket._extensions[
              permessageDeflate.extensionName
            ] = perMessageDeflate;
          }
        } catch (err) {
          abortHandshake(
            websocket,
            socket,
            'Invalid Sec-WebSocket-Extensions header'
          );
          return;
        }
      }

      websocket.setSocket(socket, head, opts.maxPayload);
    });
  }

  /**
   * Create a `net.Socket` and initiate a connection.
   *
   * @param {Object} options Connection options
   * @return {net.Socket} The newly created socket used to start the connection
   * @private
   */
  function netConnect(options) {
    options.path = options.socketPath;
    return net.connect(options);
  }

  /**
   * Create a `tls.TLSSocket` and initiate a connection.
   *
   * @param {Object} options Connection options
   * @return {tls.TLSSocket} The newly created socket used to start the connection
   * @private
   */
  function tlsConnect(options) {
    options.path = undefined;

    if (!options.servername && options.servername !== '') {
      options.servername = options.host;
    }

    return tls.connect(options);
  }

  /**
   * Abort the handshake and emit an error.
   *
   * @param {WebSocket} websocket The WebSocket instance
   * @param {(http.ClientRequest|net.Socket)} stream The request to abort or the
   *     socket to destroy
   * @param {String} message The error message
   * @private
   */
  function abortHandshake(websocket, stream$$1, message) {
    websocket.readyState = WebSocket.CLOSING;

    const err = new Error(message);
    Error.captureStackTrace(err, abortHandshake);

    if (stream$$1.setHeader) {
      stream$$1.abort();
      stream$$1.once('abort', websocket.emitClose.bind(websocket));
      websocket.emit('error', err);
    } else {
      stream$$1.destroy(err);
      stream$$1.once('error', websocket.emit.bind(websocket, 'error'));
      stream$$1.once('close', websocket.emitClose.bind(websocket));
    }
  }

  /**
   * Handle cases where the `ping()`, `pong()`, or `send()` methods are called
   * when the `readyState` attribute is `CLOSING` or `CLOSED`.
   *
   * @param {WebSocket} websocket The WebSocket instance
   * @param {*} data The data to send
   * @param {Function} cb Callback
   * @private
   */
  function sendAfterClose(websocket, data, cb) {
    if (data) {
      const length = toBuffer$1(data).length;

      //
      // The `_bufferedAmount` property is used only when the peer is a client and
      // the opening handshake fails. Under these circumstances, in fact, the
      // `setSocket()` method is not called, so the `_socket` and `_sender`
      // properties are set to `null`.
      //
      if (websocket._socket) websocket._sender._bufferedBytes += length;
      else websocket._bufferedAmount += length;
    }

    if (cb) {
      const err = new Error(
        `WebSocket is not open: readyState ${websocket.readyState} ` +
          `(${readyStates[websocket.readyState]})`
      );
      cb(err);
    }
  }

  /**
   * The listener of the `Receiver` `'conclude'` event.
   *
   * @param {Number} code The status code
   * @param {String} reason The reason for closing
   * @private
   */
  function receiverOnConclude(code, reason) {
    const websocket = this[kWebSocket$1];

    websocket._socket.removeListener('data', socketOnData);
    websocket._socket.resume();

    websocket._closeFrameReceived = true;
    websocket._closeMessage = reason;
    websocket._closeCode = code;

    if (code === 1005) websocket.close();
    else websocket.close(code, reason);
  }

  /**
   * The listener of the `Receiver` `'drain'` event.
   *
   * @private
   */
  function receiverOnDrain() {
    this[kWebSocket$1]._socket.resume();
  }

  /**
   * The listener of the `Receiver` `'error'` event.
   *
   * @param {(RangeError|Error)} err The emitted error
   * @private
   */
  function receiverOnError(err) {
    const websocket = this[kWebSocket$1];

    websocket._socket.removeListener('data', socketOnData);

    websocket.readyState = WebSocket.CLOSING;
    websocket._closeCode = err[kStatusCode$2];
    websocket.emit('error', err);
    websocket._socket.destroy();
  }

  /**
   * The listener of the `Receiver` `'finish'` event.
   *
   * @private
   */
  function receiverOnFinish() {
    this[kWebSocket$1].emitClose();
  }

  /**
   * The listener of the `Receiver` `'message'` event.
   *
   * @param {(String|Buffer|ArrayBuffer|Buffer[])} data The message
   * @private
   */
  function receiverOnMessage(data) {
    this[kWebSocket$1].emit('message', data);
  }

  /**
   * The listener of the `Receiver` `'ping'` event.
   *
   * @param {Buffer} data The data included in the ping frame
   * @private
   */
  function receiverOnPing(data) {
    const websocket = this[kWebSocket$1];

    websocket.pong(data, !websocket._isServer, NOOP$1);
    websocket.emit('ping', data);
  }

  /**
   * The listener of the `Receiver` `'pong'` event.
   *
   * @param {Buffer} data The data included in the pong frame
   * @private
   */
  function receiverOnPong(data) {
    this[kWebSocket$1].emit('pong', data);
  }

  /**
   * The listener of the `net.Socket` `'close'` event.
   *
   * @private
   */
  function socketOnClose() {
    const websocket = this[kWebSocket$1];

    this.removeListener('close', socketOnClose);
    this.removeListener('end', socketOnEnd);

    websocket.readyState = WebSocket.CLOSING;

    //
    // The close frame might not have been received or the `'end'` event emitted,
    // for example, if the socket was destroyed due to an error. Ensure that the
    // `receiver` stream is closed after writing any remaining buffered data to
    // it. If the readable side of the socket is in flowing mode then there is no
    // buffered data as everything has been already written and `readable.read()`
    // will return `null`. If instead, the socket is paused, any possible buffered
    // data will be read as a single chunk and emitted synchronously in a single
    // `'data'` event.
    //
    websocket._socket.read();
    websocket._receiver.end();

    this.removeListener('data', socketOnData);
    this[kWebSocket$1] = undefined;

    clearTimeout(websocket._closeTimer);

    if (
      websocket._receiver._writableState.finished ||
      websocket._receiver._writableState.errorEmitted
    ) {
      websocket.emitClose();
    } else {
      websocket._receiver.on('error', receiverOnFinish);
      websocket._receiver.on('finish', receiverOnFinish);
    }
  }

  /**
   * The listener of the `net.Socket` `'data'` event.
   *
   * @param {Buffer} chunk A chunk of data
   * @private
   */
  function socketOnData(chunk) {
    if (!this[kWebSocket$1]._receiver.write(chunk)) {
      this.pause();
    }
  }

  /**
   * The listener of the `net.Socket` `'end'` event.
   *
   * @private
   */
  function socketOnEnd() {
    const websocket = this[kWebSocket$1];

    websocket.readyState = WebSocket.CLOSING;
    websocket._receiver.end();
    this.end();
  }

  /**
   * The listener of the `net.Socket` `'error'` event.
   *
   * @private
   */
  function socketOnError() {
    const websocket = this[kWebSocket$1];

    this.removeListener('error', socketOnError);
    this.on('error', NOOP$1);

    if (websocket) {
      websocket.readyState = WebSocket.CLOSING;
      this.destroy();
    }
  }

  const { Duplex } = stream;

  /**
   * Emits the `'close'` event on a stream.
   *
   * @param {stream.Duplex} The stream.
   * @private
   */
  function emitClose(stream$$1) {
    stream$$1.emit('close');
  }

  /**
   * The listener of the `'end'` event.
   *
   * @private
   */
  function duplexOnEnd() {
    if (!this.destroyed && this._writableState.finished) {
      this.destroy();
    }
  }

  /**
   * The listener of the `'error'` event.
   *
   * @private
   */
  function duplexOnError(err) {
    this.removeListener('error', duplexOnError);
    this.destroy();
    if (this.listenerCount('error') === 0) {
      // Do not suppress the throwing behavior.
      this.emit('error', err);
    }
  }

  /**
   * Wraps a `WebSocket` in a duplex stream.
   *
   * @param {WebSocket} ws The `WebSocket` to wrap
   * @param {Object} options The options for the `Duplex` constructor
   * @return {stream.Duplex} The duplex stream
   * @public
   */
  function createWebSocketStream(ws, options) {
    let resumeOnReceiverDrain = true;

    function receiverOnDrain() {
      if (resumeOnReceiverDrain) ws._socket.resume();
    }

    if (ws.readyState === ws.CONNECTING) {
      ws.once('open', function open() {
        ws._receiver.removeAllListeners('drain');
        ws._receiver.on('drain', receiverOnDrain);
      });
    } else {
      ws._receiver.removeAllListeners('drain');
      ws._receiver.on('drain', receiverOnDrain);
    }

    const duplex = new Duplex({
      ...options,
      autoDestroy: false,
      emitClose: false,
      objectMode: false,
      readableObjectMode: false,
      writableObjectMode: false
    });

    ws.on('message', function message(msg) {
      if (!duplex.push(msg)) {
        resumeOnReceiverDrain = false;
        ws._socket.pause();
      }
    });

    ws.once('error', function error(err) {
      duplex.destroy(err);
    });

    ws.once('close', function close() {
      if (duplex.destroyed) return;

      duplex.push(null);
    });

    duplex._destroy = function(err, callback) {
      if (ws.readyState === ws.CLOSED) {
        callback(err);
        process.nextTick(emitClose, duplex);
        return;
      }

      ws.once('close', function close() {
        callback(err);
        process.nextTick(emitClose, duplex);
      });
      ws.terminate();
    };

    duplex._final = function(callback) {
      if (ws.readyState === ws.CONNECTING) {
        ws.once('open', function open() {
          duplex._final(callback);
        });
        return;
      }

      if (ws._socket._writableState.finished) {
        if (duplex._readableState.endEmitted) duplex.destroy();
        callback();
      } else {
        ws._socket.once('finish', function finish() {
          // `duplex` is not destroyed here because the `'end'` event will be
          // emitted on `duplex` after this `'finish'` event. The EOF signaling
          // `null` chunk is, in fact, pushed when the WebSocket emits `'close'`.
          callback();
        });
        ws.close();
      }
    };

    duplex._read = function() {
      if (ws.readyState === ws.OPEN && !resumeOnReceiverDrain) {
        resumeOnReceiverDrain = true;
        if (!ws._receiver._writableState.needDrain) ws._socket.resume();
      }
    };

    duplex._write = function(chunk, encoding, callback) {
      if (ws.readyState === ws.CONNECTING) {
        ws.once('open', function open() {
          duplex._write(chunk, encoding, callback);
        });
        return;
      }

      ws.send(chunk, callback);
    };

    duplex.on('end', duplexOnEnd);
    duplex.on('error', duplexOnError);
    return duplex;
  }

  var stream$1 = createWebSocketStream;

  const { createHash: createHash$1 } = crypto;
  const { createServer, STATUS_CODES } = http;



  const { format: format$2, parse: parse$2 } = extension;
  const { GUID: GUID$1 } = constants;

  const keyRegex = /^[+/0-9A-Za-z]{22}==$/;

  /**
   * Class representing a WebSocket server.
   *
   * @extends EventEmitter
   */
  class WebSocketServer extends events {
    /**
     * Create a `WebSocketServer` instance.
     *
     * @param {Object} options Configuration options
     * @param {Number} options.backlog The maximum length of the queue of pending
     *     connections
     * @param {Boolean} options.clientTracking Specifies whether or not to track
     *     clients
     * @param {Function} options.handleProtocols A hook to handle protocols
     * @param {String} options.host The hostname where to bind the server
     * @param {Number} options.maxPayload The maximum allowed message size
     * @param {Boolean} options.noServer Enable no server mode
     * @param {String} options.path Accept only connections matching this path
     * @param {(Boolean|Object)} options.perMessageDeflate Enable/disable
     *     permessage-deflate
     * @param {Number} options.port The port where to bind the server
     * @param {http.Server} options.server A pre-created HTTP/S server to use
     * @param {Function} options.verifyClient A hook to reject connections
     * @param {Function} callback A listener for the `listening` event
     */
    constructor(options, callback) {
      super();

      options = {
        maxPayload: 100 * 1024 * 1024,
        perMessageDeflate: false,
        handleProtocols: null,
        clientTracking: true,
        verifyClient: null,
        noServer: false,
        backlog: null, // use default (511 as implemented in net.js)
        server: null,
        host: null,
        path: null,
        port: null,
        ...options
      };

      if (options.port == null && !options.server && !options.noServer) {
        throw new TypeError(
          'One of the "port", "server", or "noServer" options must be specified'
        );
      }

      if (options.port != null) {
        this._server = createServer((req, res) => {
          const body = STATUS_CODES[426];

          res.writeHead(426, {
            'Content-Length': body.length,
            'Content-Type': 'text/plain'
          });
          res.end(body);
        });
        this._server.listen(
          options.port,
          options.host,
          options.backlog,
          callback
        );
      } else if (options.server) {
        this._server = options.server;
      }

      if (this._server) {
        this._removeListeners = addListeners(this._server, {
          listening: this.emit.bind(this, 'listening'),
          error: this.emit.bind(this, 'error'),
          upgrade: (req, socket, head) => {
            this.handleUpgrade(req, socket, head, (ws) => {
              this.emit('connection', ws, req);
            });
          }
        });
      }

      if (options.perMessageDeflate === true) options.perMessageDeflate = {};
      if (options.clientTracking) this.clients = new Set();
      this.options = options;
    }

    /**
     * Returns the bound address, the address family name, and port of the server
     * as reported by the operating system if listening on an IP socket.
     * If the server is listening on a pipe or UNIX domain socket, the name is
     * returned as a string.
     *
     * @return {(Object|String|null)} The address of the server
     * @public
     */
    address() {
      if (this.options.noServer) {
        throw new Error('The server is operating in "noServer" mode');
      }

      if (!this._server) return null;
      return this._server.address();
    }

    /**
     * Close the server.
     *
     * @param {Function} cb Callback
     * @public
     */
    close(cb) {
      if (cb) this.once('close', cb);

      //
      // Terminate all associated clients.
      //
      if (this.clients) {
        for (const client of this.clients) client.terminate();
      }

      const server = this._server;

      if (server) {
        this._removeListeners();
        this._removeListeners = this._server = null;

        //
        // Close the http server if it was internally created.
        //
        if (this.options.port != null) {
          server.close(() => this.emit('close'));
          return;
        }
      }

      process.nextTick(emitClose$1, this);
    }

    /**
     * See if a given request should be handled by this server instance.
     *
     * @param {http.IncomingMessage} req Request object to inspect
     * @return {Boolean} `true` if the request is valid, else `false`
     * @public
     */
    shouldHandle(req) {
      if (this.options.path) {
        const index = req.url.indexOf('?');
        const pathname = index !== -1 ? req.url.slice(0, index) : req.url;

        if (pathname !== this.options.path) return false;
      }

      return true;
    }

    /**
     * Handle a HTTP Upgrade request.
     *
     * @param {http.IncomingMessage} req The request object
     * @param {net.Socket} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Function} cb Callback
     * @public
     */
    handleUpgrade(req, socket, head, cb) {
      socket.on('error', socketOnError$1);

      const key =
        req.headers['sec-websocket-key'] !== undefined
          ? req.headers['sec-websocket-key'].trim()
          : false;
      const version = +req.headers['sec-websocket-version'];
      const extensions = {};

      if (
        req.method !== 'GET' ||
        req.headers.upgrade.toLowerCase() !== 'websocket' ||
        !key ||
        !keyRegex.test(key) ||
        (version !== 8 && version !== 13) ||
        !this.shouldHandle(req)
      ) {
        return abortHandshake$1(socket, 400);
      }

      if (this.options.perMessageDeflate) {
        const perMessageDeflate = new permessageDeflate(
          this.options.perMessageDeflate,
          true,
          this.options.maxPayload
        );

        try {
          const offers = parse$2(req.headers['sec-websocket-extensions']);

          if (offers[permessageDeflate.extensionName]) {
            perMessageDeflate.accept(offers[permessageDeflate.extensionName]);
            extensions[permessageDeflate.extensionName] = perMessageDeflate;
          }
        } catch (err) {
          return abortHandshake$1(socket, 400);
        }
      }

      //
      // Optionally call external client verification handler.
      //
      if (this.options.verifyClient) {
        const info = {
          origin:
            req.headers[`${version === 8 ? 'sec-websocket-origin' : 'origin'}`],
          secure: !!(req.connection.authorized || req.connection.encrypted),
          req
        };

        if (this.options.verifyClient.length === 2) {
          this.options.verifyClient(info, (verified, code, message, headers) => {
            if (!verified) {
              return abortHandshake$1(socket, code || 401, message, headers);
            }

            this.completeUpgrade(key, extensions, req, socket, head, cb);
          });
          return;
        }

        if (!this.options.verifyClient(info)) return abortHandshake$1(socket, 401);
      }

      this.completeUpgrade(key, extensions, req, socket, head, cb);
    }

    /**
     * Upgrade the connection to WebSocket.
     *
     * @param {String} key The value of the `Sec-WebSocket-Key` header
     * @param {Object} extensions The accepted extensions
     * @param {http.IncomingMessage} req The request object
     * @param {net.Socket} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Function} cb Callback
     * @private
     */
    completeUpgrade(key, extensions, req, socket, head, cb) {
      //
      // Destroy the socket if the client has already sent a FIN packet.
      //
      if (!socket.readable || !socket.writable) return socket.destroy();

      const digest = createHash$1('sha1')
        .update(key + GUID$1)
        .digest('base64');

      const headers = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${digest}`
      ];

      const ws = new websocket(null);
      let protocol = req.headers['sec-websocket-protocol'];

      if (protocol) {
        protocol = protocol.trim().split(/ *, */);

        //
        // Optionally call external protocol selection handler.
        //
        if (this.options.handleProtocols) {
          protocol = this.options.handleProtocols(protocol, req);
        } else {
          protocol = protocol[0];
        }

        if (protocol) {
          headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
          ws.protocol = protocol;
        }
      }

      if (extensions[permessageDeflate.extensionName]) {
        const params = extensions[permessageDeflate.extensionName].params;
        const value = format$2({
          [permessageDeflate.extensionName]: [params]
        });
        headers.push(`Sec-WebSocket-Extensions: ${value}`);
        ws._extensions = extensions;
      }

      //
      // Allow external modification/inspection of handshake headers.
      //
      this.emit('headers', headers, req);

      socket.write(headers.concat('\r\n').join('\r\n'));
      socket.removeListener('error', socketOnError$1);

      ws.setSocket(socket, head, this.options.maxPayload);

      if (this.clients) {
        this.clients.add(ws);
        ws.on('close', () => this.clients.delete(ws));
      }

      cb(ws);
    }
  }

  var websocketServer = WebSocketServer;

  /**
   * Add event listeners on an `EventEmitter` using a map of <event, listener>
   * pairs.
   *
   * @param {EventEmitter} server The event emitter
   * @param {Object.<String, Function>} map The listeners to add
   * @return {Function} A function that will remove the added listeners when called
   * @private
   */
  function addListeners(server, map) {
    for (const event of Object.keys(map)) server.on(event, map[event]);

    return function removeListeners() {
      for (const event of Object.keys(map)) {
        server.removeListener(event, map[event]);
      }
    };
  }

  /**
   * Emit a `'close'` event on an `EventEmitter`.
   *
   * @param {EventEmitter} server The event emitter
   * @private
   */
  function emitClose$1(server) {
    server.emit('close');
  }

  /**
   * Handle premature socket errors.
   *
   * @private
   */
  function socketOnError$1() {
    this.destroy();
  }

  /**
   * Close the connection when preconditions are not fulfilled.
   *
   * @param {net.Socket} socket The socket of the upgrade request
   * @param {Number} code The HTTP response status code
   * @param {String} [message] The HTTP response body
   * @param {Object} [headers] Additional HTTP response headers
   * @private
   */
  function abortHandshake$1(socket, code, message, headers) {
    if (socket.writable) {
      message = message || STATUS_CODES[code];
      headers = {
        Connection: 'close',
        'Content-type': 'text/html',
        'Content-Length': Buffer.byteLength(message),
        ...headers
      };

      socket.write(
        `HTTP/1.1 ${code} ${STATUS_CODES[code]}\r\n` +
          Object.keys(headers)
            .map((h) => `${h}: ${headers[h]}`)
            .join('\r\n') +
          '\r\n\r\n' +
          message
      );
    }

    socket.removeListener('error', socketOnError$1);
    socket.destroy();
  }

  websocket.createWebSocketStream = stream$1;
  websocket.Server = websocketServer;
  websocket.Receiver = receiver;
  websocket.Sender = sender;

  websocket.createWebSocketStream = stream$1;
  websocket.Server = websocketServer;
  websocket.Receiver = receiver;
  websocket.Sender = sender;

  var C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_ws = websocket;

  var node = C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_ws;

  /* globals Buffer */

  var bufferGlobal =
    c(("undefined" !== typeof Buffer) && Buffer) ||
    c(commonjsGlobal.Buffer) ||
    c(("undefined" !== typeof window) && window.Buffer) ||
    commonjsGlobal.Buffer;

  function c(B) {
    return B && B.isBuffer && B;
  }

  var toString = {}.toString;

  var C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_isarray = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
  };

  var bufferishArray = createCommonjsModule(function (module) {
  // bufferish-array.js



  var exports = module.exports = alloc(0);

  exports.alloc = alloc;
  exports.concat = bufferish.concat;
  exports.from = from;

  /**
   * @param size {Number}
   * @returns {Buffer|Uint8Array|Array}
   */

  function alloc(size) {
    return new Array(size);
  }

  /**
   * @param value {Array|ArrayBuffer|Buffer|String}
   * @returns {Array}
   */

  function from(value) {
    if (!bufferish.isBuffer(value) && bufferish.isView(value)) {
      // TypedArray to Uint8Array
      value = bufferish.Uint8Array.from(value);
    } else if (bufferish.isArrayBuffer(value)) {
      // ArrayBuffer to Uint8Array
      value = new Uint8Array(value);
    } else if (typeof value === "string") {
      // String to Array
      return bufferish.from.call(exports, value);
    } else if (typeof value === "number") {
      throw new TypeError('"value" argument must not be a number');
    }

    // Array-like to Array
    return Array.prototype.slice.call(value);
  }
  });

  var bufferishBuffer = createCommonjsModule(function (module) {
  // bufferish-buffer.js


  var Buffer = bufferish.global;

  var exports = module.exports = bufferish.hasBuffer ? alloc(0) : [];

  exports.alloc = bufferish.hasBuffer && Buffer.alloc || alloc;
  exports.concat = bufferish.concat;
  exports.from = from;

  /**
   * @param size {Number}
   * @returns {Buffer|Uint8Array|Array}
   */

  function alloc(size) {
    return new Buffer(size);
  }

  /**
   * @param value {Array|ArrayBuffer|Buffer|String}
   * @returns {Buffer}
   */

  function from(value) {
    if (!bufferish.isBuffer(value) && bufferish.isView(value)) {
      // TypedArray to Uint8Array
      value = bufferish.Uint8Array.from(value);
    } else if (bufferish.isArrayBuffer(value)) {
      // ArrayBuffer to Uint8Array
      value = new Uint8Array(value);
    } else if (typeof value === "string") {
      // String to Buffer
      return bufferish.from.call(exports, value);
    } else if (typeof value === "number") {
      throw new TypeError('"value" argument must not be a number');
    }

    // Array-like to Buffer
    if (Buffer.from && Buffer.from.length !== 1) {
      return Buffer.from(value); // node v6+
    } else {
      return new Buffer(value); // node v4
    }
  }
  });

  var bufferishUint8array = createCommonjsModule(function (module) {
  // bufferish-uint8array.js



  var exports = module.exports = bufferish.hasArrayBuffer ? alloc(0) : [];

  exports.alloc = alloc;
  exports.concat = bufferish.concat;
  exports.from = from;

  /**
   * @param size {Number}
   * @returns {Buffer|Uint8Array|Array}
   */

  function alloc(size) {
    return new Uint8Array(size);
  }

  /**
   * @param value {Array|ArrayBuffer|Buffer|String}
   * @returns {Uint8Array}
   */

  function from(value) {
    if (bufferish.isView(value)) {
      // TypedArray to ArrayBuffer
      var byteOffset = value.byteOffset;
      var byteLength = value.byteLength;
      value = value.buffer;
      if (value.byteLength !== byteLength) {
        if (value.slice) {
          value = value.slice(byteOffset, byteOffset + byteLength);
        } else {
          // Android 4.1 does not have ArrayBuffer.prototype.slice
          value = new Uint8Array(value);
          if (value.byteLength !== byteLength) {
            // TypedArray to ArrayBuffer to Uint8Array to Array
            value = Array.prototype.slice.call(value, byteOffset, byteOffset + byteLength);
          }
        }
      }
    } else if (typeof value === "string") {
      // String to Uint8Array
      return bufferish.from.call(exports, value);
    } else if (typeof value === "number") {
      throw new TypeError('"value" argument must not be a number');
    }

    return new Uint8Array(value);
  }
  });

  // buffer-lite.js

  var copy_1 = copy;
  var toString_1 = toString$1;
  var write_1 = write;

  /**
   * Buffer.prototype.write()
   *
   * @param string {String}
   * @param [offset] {Number}
   * @returns {Number}
   */

  function write(string, offset) {
    var buffer = this;
    var index = offset || (offset |= 0);
    var length = string.length;
    var chr = 0;
    var i = 0;
    while (i < length) {
      chr = string.charCodeAt(i++);

      if (chr < 128) {
        buffer[index++] = chr;
      } else if (chr < 0x800) {
        // 2 bytes
        buffer[index++] = 0xC0 | (chr >>> 6);
        buffer[index++] = 0x80 | (chr & 0x3F);
      } else if (chr < 0xD800 || chr > 0xDFFF) {
        // 3 bytes
        buffer[index++] = 0xE0 | (chr  >>> 12);
        buffer[index++] = 0x80 | ((chr >>> 6)  & 0x3F);
        buffer[index++] = 0x80 | (chr          & 0x3F);
      } else {
        // 4 bytes - surrogate pair
        chr = (((chr - 0xD800) << 10) | (string.charCodeAt(i++) - 0xDC00)) + 0x10000;
        buffer[index++] = 0xF0 | (chr >>> 18);
        buffer[index++] = 0x80 | ((chr >>> 12) & 0x3F);
        buffer[index++] = 0x80 | ((chr >>> 6)  & 0x3F);
        buffer[index++] = 0x80 | (chr          & 0x3F);
      }
    }
    return index - offset;
  }

  /**
   * Buffer.prototype.toString()
   *
   * @param [encoding] {String} ignored
   * @param [start] {Number}
   * @param [end] {Number}
   * @returns {String}
   */

  function toString$1(encoding, start, end) {
    var buffer = this;
    var index = start|0;
    if (!end) end = buffer.length;
    var string = '';
    var chr = 0;

    while (index < end) {
      chr = buffer[index++];
      if (chr < 128) {
        string += String.fromCharCode(chr);
        continue;
      }

      if ((chr & 0xE0) === 0xC0) {
        // 2 bytes
        chr = (chr & 0x1F) << 6 |
              (buffer[index++] & 0x3F);

      } else if ((chr & 0xF0) === 0xE0) {
        // 3 bytes
        chr = (chr & 0x0F)             << 12 |
              (buffer[index++] & 0x3F) << 6  |
              (buffer[index++] & 0x3F);

      } else if ((chr & 0xF8) === 0xF0) {
        // 4 bytes
        chr = (chr & 0x07)             << 18 |
              (buffer[index++] & 0x3F) << 12 |
              (buffer[index++] & 0x3F) << 6  |
              (buffer[index++] & 0x3F);
      }

      if (chr >= 0x010000) {
        // A surrogate pair
        chr -= 0x010000;

        string += String.fromCharCode((chr >>> 10) + 0xD800, (chr & 0x3FF) + 0xDC00);
      } else {
        string += String.fromCharCode(chr);
      }
    }

    return string;
  }

  /**
   * Buffer.prototype.copy()
   *
   * @param target {Buffer}
   * @param [targetStart] {Number}
   * @param [start] {Number}
   * @param [end] {Number}
   * @returns {number}
   */

  function copy(target, targetStart, start, end) {
    var i;
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (!targetStart) targetStart = 0;
    var len = end - start;

    if (target === this && start < targetStart && targetStart < end) {
      // descending
      for (i = len - 1; i >= 0; i--) {
        target[i + targetStart] = this[i + start];
      }
    } else {
      // ascending
      for (i = 0; i < len; i++) {
        target[i + targetStart] = this[i + start];
      }
    }

    return len;
  }

  var bufferLite = {
  	copy: copy_1,
  	toString: toString_1,
  	write: write_1
  };

  // bufferish-proto.js

  /* jshint eqnull:true */



  var copy_1$1 = copy$1;
  var slice_1 = slice;
  var toString_1$1 = toString$2;
  var write$1 = gen("write");


  var Buffer$1 = bufferish.global;

  var isBufferShim = bufferish.hasBuffer && ("TYPED_ARRAY_SUPPORT" in Buffer$1);
  var brokenTypedArray = isBufferShim && !Buffer$1.TYPED_ARRAY_SUPPORT;

  /**
   * @param target {Buffer|Uint8Array|Array}
   * @param [targetStart] {Number}
   * @param [start] {Number}
   * @param [end] {Number}
   * @returns {Buffer|Uint8Array|Array}
   */

  function copy$1(target, targetStart, start, end) {
    var thisIsBuffer = bufferish.isBuffer(this);
    var targetIsBuffer = bufferish.isBuffer(target);
    if (thisIsBuffer && targetIsBuffer) {
      // Buffer to Buffer
      return this.copy(target, targetStart, start, end);
    } else if (!brokenTypedArray && !thisIsBuffer && !targetIsBuffer &&
      bufferish.isView(this) && bufferish.isView(target)) {
      // Uint8Array to Uint8Array (except for minor some browsers)
      var buffer = (start || end != null) ? slice.call(this, start, end) : this;
      target.set(buffer, targetStart);
      return buffer.length;
    } else {
      // other cases
      return bufferLite.copy.call(this, target, targetStart, start, end);
    }
  }

  /**
   * @param [start] {Number}
   * @param [end] {Number}
   * @returns {Buffer|Uint8Array|Array}
   */

  function slice(start, end) {
    // for Buffer, Uint8Array (except for minor some browsers) and Array
    var f = this.slice || (!brokenTypedArray && this.subarray);
    if (f) return f.call(this, start, end);

    // Uint8Array (for minor some browsers)
    var target = bufferish.alloc.call(this, end - start);
    copy$1.call(this, target, 0, start, end);
    return target;
  }

  /**
   * Buffer.prototype.toString()
   *
   * @param [encoding] {String} ignored
   * @param [start] {Number}
   * @param [end] {Number}
   * @returns {String}
   */

  function toString$2(encoding, start, end) {
    var f = (!isBufferShim && bufferish.isBuffer(this)) ? this.toString : bufferLite.toString;
    return f.apply(this, arguments);
  }

  /**
   * @private
   */

  function gen(method) {
    return wrap;

    function wrap() {
      var f = this[method] || bufferLite[method];
      return f.apply(this, arguments);
    }
  }

  var bufferishProto = {
  	copy: copy_1$1,
  	slice: slice_1,
  	toString: toString_1$1,
  	write: write$1
  };

  var bufferish = createCommonjsModule(function (module, exports) {
  // bufferish.js

  var Buffer = exports.global = bufferGlobal;
  var hasBuffer = exports.hasBuffer = Buffer && !!Buffer.isBuffer;
  var hasArrayBuffer = exports.hasArrayBuffer = ("undefined" !== typeof ArrayBuffer);

  var isArray = exports.isArray = C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_isarray;
  exports.isArrayBuffer = hasArrayBuffer ? isArrayBuffer : _false;
  var isBuffer = exports.isBuffer = hasBuffer ? Buffer.isBuffer : _false;
  var isView = exports.isView = hasArrayBuffer ? (ArrayBuffer.isView || _is("ArrayBuffer", "buffer")) : _false;

  exports.alloc = alloc;
  exports.concat = concat;
  exports.from = from;

  var BufferArray = exports.Array = bufferishArray;
  var BufferBuffer = exports.Buffer = bufferishBuffer;
  var BufferUint8Array = exports.Uint8Array = bufferishUint8array;
  var BufferProto = exports.prototype = bufferishProto;

  /**
   * @param value {Array|ArrayBuffer|Buffer|String}
   * @returns {Buffer|Uint8Array|Array}
   */

  function from(value) {
    if (typeof value === "string") {
      return fromString.call(this, value);
    } else {
      return auto(this).from(value);
    }
  }

  /**
   * @param size {Number}
   * @returns {Buffer|Uint8Array|Array}
   */

  function alloc(size) {
    return auto(this).alloc(size);
  }

  /**
   * @param list {Array} array of (Buffer|Uint8Array|Array)s
   * @param [length]
   * @returns {Buffer|Uint8Array|Array}
   */

  function concat(list, length) {
    if (!length) {
      length = 0;
      Array.prototype.forEach.call(list, dryrun);
    }
    var ref = (this !== exports) && this || list[0];
    var result = alloc.call(ref, length);
    var offset = 0;
    Array.prototype.forEach.call(list, append);
    return result;

    function dryrun(buffer) {
      length += buffer.length;
    }

    function append(buffer) {
      offset += BufferProto.copy.call(buffer, result, offset);
    }
  }

  var _isArrayBuffer = _is("ArrayBuffer");

  function isArrayBuffer(value) {
    return (value instanceof ArrayBuffer) || _isArrayBuffer(value);
  }

  /**
   * @private
   */

  function fromString(value) {
    var expected = value.length * 3;
    var that = alloc.call(this, expected);
    var actual = BufferProto.write.call(that, value);
    if (expected !== actual) {
      that = BufferProto.slice.call(that, 0, actual);
    }
    return that;
  }

  function auto(that) {
    return isBuffer(that) ? BufferBuffer
      : isView(that) ? BufferUint8Array
      : isArray(that) ? BufferArray
      : hasBuffer ? BufferBuffer
      : hasArrayBuffer ? BufferUint8Array
      : BufferArray;
  }

  function _false() {
    return false;
  }

  function _is(name, key) {
    /* jshint eqnull:true */
    name = "[object " + name + "]";
    return function(value) {
      return (value != null) && {}.toString.call(key ? value[key] : value) === name;
    };
  }
  });
  var bufferish_1 = bufferish.global;
  var bufferish_2 = bufferish.hasBuffer;
  var bufferish_3 = bufferish.hasArrayBuffer;
  var bufferish_4 = bufferish.isArray;
  var bufferish_5 = bufferish.isArrayBuffer;
  var bufferish_6 = bufferish.isBuffer;
  var bufferish_7 = bufferish.isView;
  var bufferish_8 = bufferish.alloc;
  var bufferish_9 = bufferish.concat;
  var bufferish_10 = bufferish.Array;
  var bufferish_11 = bufferish.Buffer;
  var bufferish_12 = bufferish.Uint8Array;
  var bufferish_13 = bufferish.prototype;

  // ext-buffer.js

  var ExtBuffer_1 = ExtBuffer;



  function ExtBuffer(buffer, type) {
    if (!(this instanceof ExtBuffer)) return new ExtBuffer(buffer, type);
    this.buffer = bufferish.from(buffer);
    this.type = type;
  }

  var extBuffer = {
  	ExtBuffer: ExtBuffer_1
  };

  // ext-packer.js

  var setExtPackers_1 = setExtPackers;


  var Buffer$2 = bufferish.global;
  var packTypedArray = bufferish.Uint8Array.from;
  var _encode;

  var ERROR_COLUMNS = {name: 1, message: 1, stack: 1, columnNumber: 1, fileName: 1, lineNumber: 1};

  function setExtPackers(codec) {
    codec.addExtPacker(0x0E, Error, [packError, encode]);
    codec.addExtPacker(0x01, EvalError, [packError, encode]);
    codec.addExtPacker(0x02, RangeError, [packError, encode]);
    codec.addExtPacker(0x03, ReferenceError, [packError, encode]);
    codec.addExtPacker(0x04, SyntaxError, [packError, encode]);
    codec.addExtPacker(0x05, TypeError, [packError, encode]);
    codec.addExtPacker(0x06, URIError, [packError, encode]);

    codec.addExtPacker(0x0A, RegExp, [packRegExp, encode]);
    codec.addExtPacker(0x0B, Boolean, [packValueOf, encode]);
    codec.addExtPacker(0x0C, String, [packValueOf, encode]);
    codec.addExtPacker(0x0D, Date, [Number, encode]);
    codec.addExtPacker(0x0F, Number, [packValueOf, encode]);

    if ("undefined" !== typeof Uint8Array) {
      codec.addExtPacker(0x11, Int8Array, packTypedArray);
      codec.addExtPacker(0x12, Uint8Array, packTypedArray);
      codec.addExtPacker(0x13, Int16Array, packTypedArray);
      codec.addExtPacker(0x14, Uint16Array, packTypedArray);
      codec.addExtPacker(0x15, Int32Array, packTypedArray);
      codec.addExtPacker(0x16, Uint32Array, packTypedArray);
      codec.addExtPacker(0x17, Float32Array, packTypedArray);

      // PhantomJS/1.9.7 doesn't have Float64Array
      if ("undefined" !== typeof Float64Array) {
        codec.addExtPacker(0x18, Float64Array, packTypedArray);
      }

      // IE10 doesn't have Uint8ClampedArray
      if ("undefined" !== typeof Uint8ClampedArray) {
        codec.addExtPacker(0x19, Uint8ClampedArray, packTypedArray);
      }

      codec.addExtPacker(0x1A, ArrayBuffer, packTypedArray);
      codec.addExtPacker(0x1D, DataView, packTypedArray);
    }

    if (bufferish.hasBuffer) {
      codec.addExtPacker(0x1B, Buffer$2, bufferish.from);
    }
  }

  function encode(input) {
    if (!_encode) _encode = encode_1.encode; // lazy load
    return _encode(input);
  }

  function packValueOf(value) {
    return (value).valueOf();
  }

  function packRegExp(value) {
    value = RegExp.prototype.toString.call(value).split("/");
    value.shift();
    var out = [value.pop()];
    out.unshift(value.join("/"));
    return out;
  }

  function packError(value) {
    var out = {};
    for (var key in ERROR_COLUMNS) {
      out[key] = value[key];
    }
    return out;
  }

  var extPacker = {
  	setExtPackers: setExtPackers_1
  };

  var int64Buffer = createCommonjsModule(function (module, exports) {
  // int64-buffer.js

  /*jshint -W018 */ // Confusing use of '!'.
  /*jshint -W030 */ // Expected an assignment or function call and instead saw an expression.
  /*jshint -W093 */ // Did you mean to return a conditional instead of an assignment?

  var Uint64BE, Int64BE, Uint64LE, Int64LE;

  !function(exports) {
    // constants

    var UNDEFINED = "undefined";
    var BUFFER = (UNDEFINED !== typeof Buffer) && Buffer;
    var UINT8ARRAY = (UNDEFINED !== typeof Uint8Array) && Uint8Array;
    var ARRAYBUFFER = (UNDEFINED !== typeof ArrayBuffer) && ArrayBuffer;
    var ZERO = [0, 0, 0, 0, 0, 0, 0, 0];
    var isArray = Array.isArray || _isArray;
    var BIT32 = 4294967296;
    var BIT24 = 16777216;

    // storage class

    var storage; // Array;

    // generate classes

    Uint64BE = factory("Uint64BE", true, true);
    Int64BE = factory("Int64BE", true, false);
    Uint64LE = factory("Uint64LE", false, true);
    Int64LE = factory("Int64LE", false, false);

    // class factory

    function factory(name, bigendian, unsigned) {
      var posH = bigendian ? 0 : 4;
      var posL = bigendian ? 4 : 0;
      var pos0 = bigendian ? 0 : 3;
      var pos1 = bigendian ? 1 : 2;
      var pos2 = bigendian ? 2 : 1;
      var pos3 = bigendian ? 3 : 0;
      var fromPositive = bigendian ? fromPositiveBE : fromPositiveLE;
      var fromNegative = bigendian ? fromNegativeBE : fromNegativeLE;
      var proto = Int64.prototype;
      var isName = "is" + name;
      var _isInt64 = "_" + isName;

      // properties
      proto.buffer = void 0;
      proto.offset = 0;
      proto[_isInt64] = true;

      // methods
      proto.toNumber = toNumber;
      proto.toString = toString;
      proto.toJSON = toNumber;
      proto.toArray = toArray;

      // add .toBuffer() method only when Buffer available
      if (BUFFER) proto.toBuffer = toBuffer;

      // add .toArrayBuffer() method only when Uint8Array available
      if (UINT8ARRAY) proto.toArrayBuffer = toArrayBuffer;

      // isUint64BE, isInt64BE
      Int64[isName] = isInt64;

      // CommonJS
      exports[name] = Int64;

      return Int64;

      // constructor
      function Int64(buffer, offset, value, raddix) {
        if (!(this instanceof Int64)) return new Int64(buffer, offset, value, raddix);
        return init(this, buffer, offset, value, raddix);
      }

      // isUint64BE, isInt64BE
      function isInt64(b) {
        return !!(b && b[_isInt64]);
      }

      // initializer
      function init(that, buffer, offset, value, raddix) {
        if (UINT8ARRAY && ARRAYBUFFER) {
          if (buffer instanceof ARRAYBUFFER) buffer = new UINT8ARRAY(buffer);
          if (value instanceof ARRAYBUFFER) value = new UINT8ARRAY(value);
        }

        // Int64BE() style
        if (!buffer && !offset && !value && !storage) {
          // shortcut to initialize with zero
          that.buffer = newArray(ZERO, 0);
          return;
        }

        // Int64BE(value, raddix) style
        if (!isValidBuffer(buffer, offset)) {
          var _storage = storage || Array;
          raddix = offset;
          value = buffer;
          offset = 0;
          buffer = new _storage(8);
        }

        that.buffer = buffer;
        that.offset = offset |= 0;

        // Int64BE(buffer, offset) style
        if (UNDEFINED === typeof value) return;

        // Int64BE(buffer, offset, value, raddix) style
        if ("string" === typeof value) {
          fromString(buffer, offset, value, raddix || 10);
        } else if (isValidBuffer(value, raddix)) {
          fromArray(buffer, offset, value, raddix);
        } else if ("number" === typeof raddix) {
          writeInt32(buffer, offset + posH, value); // high
          writeInt32(buffer, offset + posL, raddix); // low
        } else if (value > 0) {
          fromPositive(buffer, offset, value); // positive
        } else if (value < 0) {
          fromNegative(buffer, offset, value); // negative
        } else {
          fromArray(buffer, offset, ZERO, 0); // zero, NaN and others
        }
      }

      function fromString(buffer, offset, str, raddix) {
        var pos = 0;
        var len = str.length;
        var high = 0;
        var low = 0;
        if (str[0] === "-") pos++;
        var sign = pos;
        while (pos < len) {
          var chr = parseInt(str[pos++], raddix);
          if (!(chr >= 0)) break; // NaN
          low = low * raddix + chr;
          high = high * raddix + Math.floor(low / BIT32);
          low %= BIT32;
        }
        if (sign) {
          high = ~high;
          if (low) {
            low = BIT32 - low;
          } else {
            high++;
          }
        }
        writeInt32(buffer, offset + posH, high);
        writeInt32(buffer, offset + posL, low);
      }

      function toNumber() {
        var buffer = this.buffer;
        var offset = this.offset;
        var high = readInt32(buffer, offset + posH);
        var low = readInt32(buffer, offset + posL);
        if (!unsigned) high |= 0; // a trick to get signed
        return high ? (high * BIT32 + low) : low;
      }

      function toString(radix) {
        var buffer = this.buffer;
        var offset = this.offset;
        var high = readInt32(buffer, offset + posH);
        var low = readInt32(buffer, offset + posL);
        var str = "";
        var sign = !unsigned && (high & 0x80000000);
        if (sign) {
          high = ~high;
          low = BIT32 - low;
        }
        radix = radix || 10;
        while (1) {
          var mod = (high % radix) * BIT32 + low;
          high = Math.floor(high / radix);
          low = Math.floor(mod / radix);
          str = (mod % radix).toString(radix) + str;
          if (!high && !low) break;
        }
        if (sign) {
          str = "-" + str;
        }
        return str;
      }

      function writeInt32(buffer, offset, value) {
        buffer[offset + pos3] = value & 255;
        value = value >> 8;
        buffer[offset + pos2] = value & 255;
        value = value >> 8;
        buffer[offset + pos1] = value & 255;
        value = value >> 8;
        buffer[offset + pos0] = value & 255;
      }

      function readInt32(buffer, offset) {
        return (buffer[offset + pos0] * BIT24) +
          (buffer[offset + pos1] << 16) +
          (buffer[offset + pos2] << 8) +
          buffer[offset + pos3];
      }
    }

    function toArray(raw) {
      var buffer = this.buffer;
      var offset = this.offset;
      storage = null; // Array
      if (raw !== false && offset === 0 && buffer.length === 8 && isArray(buffer)) return buffer;
      return newArray(buffer, offset);
    }

    function toBuffer(raw) {
      var buffer = this.buffer;
      var offset = this.offset;
      storage = BUFFER;
      if (raw !== false && offset === 0 && buffer.length === 8 && Buffer.isBuffer(buffer)) return buffer;
      var dest = new BUFFER(8);
      fromArray(dest, 0, buffer, offset);
      return dest;
    }

    function toArrayBuffer(raw) {
      var buffer = this.buffer;
      var offset = this.offset;
      var arrbuf = buffer.buffer;
      storage = UINT8ARRAY;
      if (raw !== false && offset === 0 && (arrbuf instanceof ARRAYBUFFER) && arrbuf.byteLength === 8) return arrbuf;
      var dest = new UINT8ARRAY(8);
      fromArray(dest, 0, buffer, offset);
      return dest.buffer;
    }

    function isValidBuffer(buffer, offset) {
      var len = buffer && buffer.length;
      offset |= 0;
      return len && (offset + 8 <= len) && ("string" !== typeof buffer[offset]);
    }

    function fromArray(destbuf, destoff, srcbuf, srcoff) {
      destoff |= 0;
      srcoff |= 0;
      for (var i = 0; i < 8; i++) {
        destbuf[destoff++] = srcbuf[srcoff++] & 255;
      }
    }

    function newArray(buffer, offset) {
      return Array.prototype.slice.call(buffer, offset, offset + 8);
    }

    function fromPositiveBE(buffer, offset, value) {
      var pos = offset + 8;
      while (pos > offset) {
        buffer[--pos] = value & 255;
        value /= 256;
      }
    }

    function fromNegativeBE(buffer, offset, value) {
      var pos = offset + 8;
      value++;
      while (pos > offset) {
        buffer[--pos] = ((-value) & 255) ^ 255;
        value /= 256;
      }
    }

    function fromPositiveLE(buffer, offset, value) {
      var end = offset + 8;
      while (offset < end) {
        buffer[offset++] = value & 255;
        value /= 256;
      }
    }

    function fromNegativeLE(buffer, offset, value) {
      var end = offset + 8;
      value++;
      while (offset < end) {
        buffer[offset++] = ((-value) & 255) ^ 255;
        value /= 256;
      }
    }

    // https://github.com/retrofox/is-array
    function _isArray(val) {
      return !!val && "[object Array]" == Object.prototype.toString.call(val);
    }

  }(typeof exports.nodeName !== 'string' ? exports : (commonjsGlobal || {}));
  });

  var read = function (buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = (nBytes * 8) - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? (nBytes - 1) : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];

    i += d;

    e = s & ((1 << (-nBits)) - 1);
    s >>= (-nBits);
    nBits += eLen;
    for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & ((1 << (-nBits)) - 1);
    e >>= (-nBits);
    nBits += mLen;
    for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : ((s ? -1 : 1) * Infinity)
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
  };

  var write$2 = function (buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = (nBytes * 8) - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
    var i = isLE ? 0 : (nBytes - 1);
    var d = isLE ? 1 : -1;
    var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = ((value * c) - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = (e << mLen) | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
  };

  var C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_ieee754 = {
  	read: read,
  	write: write$2
  };

  var writeUint8 = createCommonjsModule(function (module, exports) {
  // write-unit8.js

  var constant = exports.uint8 = new Array(256);

  for (var i = 0x00; i <= 0xFF; i++) {
    constant[i] = write0(i);
  }

  function write0(type) {
    return function(encoder) {
      var offset = encoder.reserve(1);
      encoder.buffer[offset] = type;
    };
  }
  });
  var writeUint8_1 = writeUint8.uint8;

  // write-token.js



  var Uint64BE = int64Buffer.Uint64BE;
  var Int64BE = int64Buffer.Int64BE;

  var uint8 = writeUint8.uint8;

  var Buffer$3 = bufferish.global;
  var IS_BUFFER_SHIM = bufferish.hasBuffer && ("TYPED_ARRAY_SUPPORT" in Buffer$3);
  var NO_TYPED_ARRAY = IS_BUFFER_SHIM && !Buffer$3.TYPED_ARRAY_SUPPORT;
  var Buffer_prototype = bufferish.hasBuffer && Buffer$3.prototype || {};

  var getWriteToken_1 = getWriteToken;

  function getWriteToken(options) {
    if (options && options.uint8array) {
      return init_uint8array();
    } else if (NO_TYPED_ARRAY || (bufferish.hasBuffer && options && options.safe)) {
      return init_safe();
    } else {
      return init_token();
    }
  }

  function init_uint8array() {
    var token = init_token();

    // float 32 -- 0xca
    // float 64 -- 0xcb
    token[0xca] = writeN(0xca, 4, writeFloatBE);
    token[0xcb] = writeN(0xcb, 8, writeDoubleBE);

    return token;
  }

  // Node.js and browsers with TypedArray

  function init_token() {
    // (immediate values)
    // positive fixint -- 0x00 - 0x7f
    // nil -- 0xc0
    // false -- 0xc2
    // true -- 0xc3
    // negative fixint -- 0xe0 - 0xff
    var token = uint8.slice();

    // bin 8 -- 0xc4
    // bin 16 -- 0xc5
    // bin 32 -- 0xc6
    token[0xc4] = write1(0xc4);
    token[0xc5] = write2(0xc5);
    token[0xc6] = write4(0xc6);

    // ext 8 -- 0xc7
    // ext 16 -- 0xc8
    // ext 32 -- 0xc9
    token[0xc7] = write1(0xc7);
    token[0xc8] = write2(0xc8);
    token[0xc9] = write4(0xc9);

    // float 32 -- 0xca
    // float 64 -- 0xcb
    token[0xca] = writeN(0xca, 4, (Buffer_prototype.writeFloatBE || writeFloatBE), true);
    token[0xcb] = writeN(0xcb, 8, (Buffer_prototype.writeDoubleBE || writeDoubleBE), true);

    // uint 8 -- 0xcc
    // uint 16 -- 0xcd
    // uint 32 -- 0xce
    // uint 64 -- 0xcf
    token[0xcc] = write1(0xcc);
    token[0xcd] = write2(0xcd);
    token[0xce] = write4(0xce);
    token[0xcf] = writeN(0xcf, 8, writeUInt64BE);

    // int 8 -- 0xd0
    // int 16 -- 0xd1
    // int 32 -- 0xd2
    // int 64 -- 0xd3
    token[0xd0] = write1(0xd0);
    token[0xd1] = write2(0xd1);
    token[0xd2] = write4(0xd2);
    token[0xd3] = writeN(0xd3, 8, writeInt64BE);

    // str 8 -- 0xd9
    // str 16 -- 0xda
    // str 32 -- 0xdb
    token[0xd9] = write1(0xd9);
    token[0xda] = write2(0xda);
    token[0xdb] = write4(0xdb);

    // array 16 -- 0xdc
    // array 32 -- 0xdd
    token[0xdc] = write2(0xdc);
    token[0xdd] = write4(0xdd);

    // map 16 -- 0xde
    // map 32 -- 0xdf
    token[0xde] = write2(0xde);
    token[0xdf] = write4(0xdf);

    return token;
  }

  // safe mode: for old browsers and who needs asserts

  function init_safe() {
    // (immediate values)
    // positive fixint -- 0x00 - 0x7f
    // nil -- 0xc0
    // false -- 0xc2
    // true -- 0xc3
    // negative fixint -- 0xe0 - 0xff
    var token = uint8.slice();

    // bin 8 -- 0xc4
    // bin 16 -- 0xc5
    // bin 32 -- 0xc6
    token[0xc4] = writeN(0xc4, 1, Buffer$3.prototype.writeUInt8);
    token[0xc5] = writeN(0xc5, 2, Buffer$3.prototype.writeUInt16BE);
    token[0xc6] = writeN(0xc6, 4, Buffer$3.prototype.writeUInt32BE);

    // ext 8 -- 0xc7
    // ext 16 -- 0xc8
    // ext 32 -- 0xc9
    token[0xc7] = writeN(0xc7, 1, Buffer$3.prototype.writeUInt8);
    token[0xc8] = writeN(0xc8, 2, Buffer$3.prototype.writeUInt16BE);
    token[0xc9] = writeN(0xc9, 4, Buffer$3.prototype.writeUInt32BE);

    // float 32 -- 0xca
    // float 64 -- 0xcb
    token[0xca] = writeN(0xca, 4, Buffer$3.prototype.writeFloatBE);
    token[0xcb] = writeN(0xcb, 8, Buffer$3.prototype.writeDoubleBE);

    // uint 8 -- 0xcc
    // uint 16 -- 0xcd
    // uint 32 -- 0xce
    // uint 64 -- 0xcf
    token[0xcc] = writeN(0xcc, 1, Buffer$3.prototype.writeUInt8);
    token[0xcd] = writeN(0xcd, 2, Buffer$3.prototype.writeUInt16BE);
    token[0xce] = writeN(0xce, 4, Buffer$3.prototype.writeUInt32BE);
    token[0xcf] = writeN(0xcf, 8, writeUInt64BE);

    // int 8 -- 0xd0
    // int 16 -- 0xd1
    // int 32 -- 0xd2
    // int 64 -- 0xd3
    token[0xd0] = writeN(0xd0, 1, Buffer$3.prototype.writeInt8);
    token[0xd1] = writeN(0xd1, 2, Buffer$3.prototype.writeInt16BE);
    token[0xd2] = writeN(0xd2, 4, Buffer$3.prototype.writeInt32BE);
    token[0xd3] = writeN(0xd3, 8, writeInt64BE);

    // str 8 -- 0xd9
    // str 16 -- 0xda
    // str 32 -- 0xdb
    token[0xd9] = writeN(0xd9, 1, Buffer$3.prototype.writeUInt8);
    token[0xda] = writeN(0xda, 2, Buffer$3.prototype.writeUInt16BE);
    token[0xdb] = writeN(0xdb, 4, Buffer$3.prototype.writeUInt32BE);

    // array 16 -- 0xdc
    // array 32 -- 0xdd
    token[0xdc] = writeN(0xdc, 2, Buffer$3.prototype.writeUInt16BE);
    token[0xdd] = writeN(0xdd, 4, Buffer$3.prototype.writeUInt32BE);

    // map 16 -- 0xde
    // map 32 -- 0xdf
    token[0xde] = writeN(0xde, 2, Buffer$3.prototype.writeUInt16BE);
    token[0xdf] = writeN(0xdf, 4, Buffer$3.prototype.writeUInt32BE);

    return token;
  }

  function write1(type) {
    return function(encoder, value) {
      var offset = encoder.reserve(2);
      var buffer = encoder.buffer;
      buffer[offset++] = type;
      buffer[offset] = value;
    };
  }

  function write2(type) {
    return function(encoder, value) {
      var offset = encoder.reserve(3);
      var buffer = encoder.buffer;
      buffer[offset++] = type;
      buffer[offset++] = value >>> 8;
      buffer[offset] = value;
    };
  }

  function write4(type) {
    return function(encoder, value) {
      var offset = encoder.reserve(5);
      var buffer = encoder.buffer;
      buffer[offset++] = type;
      buffer[offset++] = value >>> 24;
      buffer[offset++] = value >>> 16;
      buffer[offset++] = value >>> 8;
      buffer[offset] = value;
    };
  }

  function writeN(type, len, method, noAssert) {
    return function(encoder, value) {
      var offset = encoder.reserve(len + 1);
      encoder.buffer[offset++] = type;
      method.call(encoder.buffer, value, offset, noAssert);
    };
  }

  function writeUInt64BE(value, offset) {
    new Uint64BE(this, offset, value);
  }

  function writeInt64BE(value, offset) {
    new Int64BE(this, offset, value);
  }

  function writeFloatBE(value, offset) {
    C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_ieee754.write(this, value, offset, false, 23, 4);
  }

  function writeDoubleBE(value, offset) {
    C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_ieee754.write(this, value, offset, false, 52, 8);
  }

  var writeToken = {
  	getWriteToken: getWriteToken_1
  };

  // write-type.js



  var Uint64BE$1 = int64Buffer.Uint64BE;
  var Int64BE$1 = int64Buffer.Int64BE;




  var uint8$1 = writeUint8.uint8;
  var ExtBuffer$1 = extBuffer.ExtBuffer;

  var HAS_UINT8ARRAY = ("undefined" !== typeof Uint8Array);
  var HAS_MAP = ("undefined" !== typeof Map);

  var extmap = [];
  extmap[1] = 0xd4;
  extmap[2] = 0xd5;
  extmap[4] = 0xd6;
  extmap[8] = 0xd7;
  extmap[16] = 0xd8;

  var getWriteType_1 = getWriteType;

  function getWriteType(options) {
    var token = writeToken.getWriteToken(options);
    var useraw = options && options.useraw;
    var binarraybuffer = HAS_UINT8ARRAY && options && options.binarraybuffer;
    var isBuffer = binarraybuffer ? bufferish.isArrayBuffer : bufferish.isBuffer;
    var bin = binarraybuffer ? bin_arraybuffer : bin_buffer;
    var usemap = HAS_MAP && options && options.usemap;
    var map = usemap ? map_to_map : obj_to_map;

    var writeType = {
      "boolean": bool,
      "function": nil,
      "number": number,
      "object": (useraw ? object_raw : object),
      "string": _string(useraw ? raw_head_size : str_head_size),
      "symbol": nil,
      "undefined": nil
    };

    return writeType;

    // false -- 0xc2
    // true -- 0xc3
    function bool(encoder, value) {
      var type = value ? 0xc3 : 0xc2;
      token[type](encoder, value);
    }

    function number(encoder, value) {
      var ivalue = value | 0;
      var type;
      if (value !== ivalue) {
        // float 64 -- 0xcb
        type = 0xcb;
        token[type](encoder, value);
        return;
      } else if (-0x20 <= ivalue && ivalue <= 0x7F) {
        // positive fixint -- 0x00 - 0x7f
        // negative fixint -- 0xe0 - 0xff
        type = ivalue & 0xFF;
      } else if (0 <= ivalue) {
        // uint 8 -- 0xcc
        // uint 16 -- 0xcd
        // uint 32 -- 0xce
        type = (ivalue <= 0xFF) ? 0xcc : (ivalue <= 0xFFFF) ? 0xcd : 0xce;
      } else {
        // int 8 -- 0xd0
        // int 16 -- 0xd1
        // int 32 -- 0xd2
        type = (-0x80 <= ivalue) ? 0xd0 : (-0x8000 <= ivalue) ? 0xd1 : 0xd2;
      }
      token[type](encoder, ivalue);
    }

    // uint 64 -- 0xcf
    function uint64(encoder, value) {
      var type = 0xcf;
      token[type](encoder, value.toArray());
    }

    // int 64 -- 0xd3
    function int64(encoder, value) {
      var type = 0xd3;
      token[type](encoder, value.toArray());
    }

    // str 8 -- 0xd9
    // str 16 -- 0xda
    // str 32 -- 0xdb
    // fixstr -- 0xa0 - 0xbf
    function str_head_size(length) {
      return (length < 32) ? 1 : (length <= 0xFF) ? 2 : (length <= 0xFFFF) ? 3 : 5;
    }

    // raw 16 -- 0xda
    // raw 32 -- 0xdb
    // fixraw -- 0xa0 - 0xbf
    function raw_head_size(length) {
      return (length < 32) ? 1 : (length <= 0xFFFF) ? 3 : 5;
    }

    function _string(head_size) {
      return string;

      function string(encoder, value) {
        // prepare buffer
        var length = value.length;
        var maxsize = 5 + length * 3;
        encoder.offset = encoder.reserve(maxsize);
        var buffer = encoder.buffer;

        // expected header size
        var expected = head_size(length);

        // expected start point
        var start = encoder.offset + expected;

        // write string
        length = bufferishProto.write.call(buffer, value, start);

        // actual header size
        var actual = head_size(length);

        // move content when needed
        if (expected !== actual) {
          var targetStart = start + actual - expected;
          var end = start + length;
          bufferishProto.copy.call(buffer, buffer, targetStart, start, end);
        }

        // write header
        var type = (actual === 1) ? (0xa0 + length) : (actual <= 3) ? (0xd7 + actual) : 0xdb;
        token[type](encoder, length);

        // move cursor
        encoder.offset += length;
      }
    }

    function object(encoder, value) {
      // null
      if (value === null) return nil(encoder, value);

      // Buffer
      if (isBuffer(value)) return bin(encoder, value);

      // Array
      if (C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_isarray(value)) return array(encoder, value);

      // int64-buffer objects
      if (Uint64BE$1.isUint64BE(value)) return uint64(encoder, value);
      if (Int64BE$1.isInt64BE(value)) return int64(encoder, value);

      // ext formats
      var packer = encoder.codec.getExtPacker(value);
      if (packer) value = packer(value);
      if (value instanceof ExtBuffer$1) return ext(encoder, value);

      // plain old Objects or Map
      map(encoder, value);
    }

    function object_raw(encoder, value) {
      // Buffer
      if (isBuffer(value)) return raw(encoder, value);

      // others
      object(encoder, value);
    }

    // nil -- 0xc0
    function nil(encoder, value) {
      var type = 0xc0;
      token[type](encoder, value);
    }

    // fixarray -- 0x90 - 0x9f
    // array 16 -- 0xdc
    // array 32 -- 0xdd
    function array(encoder, value) {
      var length = value.length;
      var type = (length < 16) ? (0x90 + length) : (length <= 0xFFFF) ? 0xdc : 0xdd;
      token[type](encoder, length);

      var encode = encoder.codec.encode;
      for (var i = 0; i < length; i++) {
        encode(encoder, value[i]);
      }
    }

    // bin 8 -- 0xc4
    // bin 16 -- 0xc5
    // bin 32 -- 0xc6
    function bin_buffer(encoder, value) {
      var length = value.length;
      var type = (length < 0xFF) ? 0xc4 : (length <= 0xFFFF) ? 0xc5 : 0xc6;
      token[type](encoder, length);
      encoder.send(value);
    }

    function bin_arraybuffer(encoder, value) {
      bin_buffer(encoder, new Uint8Array(value));
    }

    // fixext 1 -- 0xd4
    // fixext 2 -- 0xd5
    // fixext 4 -- 0xd6
    // fixext 8 -- 0xd7
    // fixext 16 -- 0xd8
    // ext 8 -- 0xc7
    // ext 16 -- 0xc8
    // ext 32 -- 0xc9
    function ext(encoder, value) {
      var buffer = value.buffer;
      var length = buffer.length;
      var type = extmap[length] || ((length < 0xFF) ? 0xc7 : (length <= 0xFFFF) ? 0xc8 : 0xc9);
      token[type](encoder, length);
      uint8$1[value.type](encoder);
      encoder.send(buffer);
    }

    // fixmap -- 0x80 - 0x8f
    // map 16 -- 0xde
    // map 32 -- 0xdf
    function obj_to_map(encoder, value) {
      var keys = Object.keys(value);
      var length = keys.length;
      var type = (length < 16) ? (0x80 + length) : (length <= 0xFFFF) ? 0xde : 0xdf;
      token[type](encoder, length);

      var encode = encoder.codec.encode;
      keys.forEach(function(key) {
        encode(encoder, key);
        encode(encoder, value[key]);
      });
    }

    // fixmap -- 0x80 - 0x8f
    // map 16 -- 0xde
    // map 32 -- 0xdf
    function map_to_map(encoder, value) {
      if (!(value instanceof Map)) return obj_to_map(encoder, value);

      var length = value.size;
      var type = (length < 16) ? (0x80 + length) : (length <= 0xFFFF) ? 0xde : 0xdf;
      token[type](encoder, length);

      var encode = encoder.codec.encode;
      value.forEach(function(val, key, m) {
        encode(encoder, key);
        encode(encoder, val);
      });
    }

    // raw 16 -- 0xda
    // raw 32 -- 0xdb
    // fixraw -- 0xa0 - 0xbf
    function raw(encoder, value) {
      var length = value.length;
      var type = (length < 32) ? (0xa0 + length) : (length <= 0xFFFF) ? 0xda : 0xdb;
      token[type](encoder, length);
      encoder.send(value);
    }
  }

  var writeType = {
  	getWriteType: getWriteType_1
  };

  // codec-base.js



  var createCodec_1 = createCodec;
  var install_1 = install;
  var filter_1 = filter;



  function Codec(options) {
    if (!(this instanceof Codec)) return new Codec(options);
    this.options = options;
    this.init();
  }

  Codec.prototype.init = function() {
    var options = this.options;

    if (options && options.uint8array) {
      this.bufferish = bufferish.Uint8Array;
    }

    return this;
  };

  function install(props) {
    for (var key in props) {
      Codec.prototype[key] = add(Codec.prototype[key], props[key]);
    }
  }

  function add(a, b) {
    return (a && b) ? ab : (a || b);

    function ab() {
      a.apply(this, arguments);
      return b.apply(this, arguments);
    }
  }

  function join(filters) {
    filters = filters.slice();

    return function(value) {
      return filters.reduce(iterator, value);
    };

    function iterator(value, filter) {
      return filter(value);
    }
  }

  function filter(filter) {
    return C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_isarray(filter) ? join(filter) : filter;
  }

  // @public
  // msgpack.createCodec()

  function createCodec(options) {
    return new Codec(options);
  }

  // default shared codec

  var preset = createCodec({preset: true});

  var codecBase = {
  	createCodec: createCodec_1,
  	install: install_1,
  	filter: filter_1,
  	preset: preset
  };

  // write-core.js

  var ExtBuffer$2 = extBuffer.ExtBuffer;




  codecBase.install({
    addExtPacker: addExtPacker,
    getExtPacker: getExtPacker,
    init: init
  });

  var preset$1 = init.call(codecBase.preset);

  function getEncoder(options) {
    var writeType$$1 = writeType.getWriteType(options);
    return encode;

    function encode(encoder, value) {
      var func = writeType$$1[typeof value];
      if (!func) throw new Error("Unsupported type \"" + (typeof value) + "\": " + value);
      func(encoder, value);
    }
  }

  function init() {
    var options = this.options;
    this.encode = getEncoder(options);

    if (options && options.preset) {
      extPacker.setExtPackers(this);
    }

    return this;
  }

  function addExtPacker(etype, Class, packer) {
    packer = codecBase.filter(packer);
    var name = Class.name;
    if (name && name !== "Object") {
      var packers = this.extPackers || (this.extPackers = {});
      packers[name] = extPacker$$1;
    } else {
      // fallback for IE
      var list = this.extEncoderList || (this.extEncoderList = []);
      list.unshift([Class, extPacker$$1]);
    }

    function extPacker$$1(value) {
      if (packer) value = packer(value);
      return new ExtBuffer$2(value, etype);
    }
  }

  function getExtPacker(value) {
    var packers = this.extPackers || (this.extPackers = {});
    var c = value.constructor;
    var e = c && c.name && packers[c.name];
    if (e) return e;

    // fallback for IE
    var list = this.extEncoderList || (this.extEncoderList = []);
    var len = list.length;
    for (var i = 0; i < len; i++) {
      var pair = list[i];
      if (c === pair[0]) return pair[1];
    }
  }

  var writeCore = {
  	preset: preset$1
  };

  // flex-buffer.js

  var FlexDecoder_1 = FlexDecoder;
  var FlexEncoder_1 = FlexEncoder;



  var MIN_BUFFER_SIZE = 2048;
  var MAX_BUFFER_SIZE = 65536;
  var BUFFER_SHORTAGE = "BUFFER_SHORTAGE";

  function FlexDecoder() {
    if (!(this instanceof FlexDecoder)) return new FlexDecoder();
  }

  function FlexEncoder() {
    if (!(this instanceof FlexEncoder)) return new FlexEncoder();
  }

  FlexDecoder.mixin = mixinFactory(getDecoderMethods());
  FlexDecoder.mixin(FlexDecoder.prototype);

  FlexEncoder.mixin = mixinFactory(getEncoderMethods());
  FlexEncoder.mixin(FlexEncoder.prototype);

  function getDecoderMethods() {
    return {
      bufferish: bufferish,
      write: write,
      fetch: fetch,
      flush: flush,
      push: push$1,
      pull: pull,
      read: read$1,
      reserve: reserve,
      offset: 0
    };

    function write(chunk) {
      var prev = this.offset ? bufferish.prototype.slice.call(this.buffer, this.offset) : this.buffer;
      this.buffer = prev ? (chunk ? this.bufferish.concat([prev, chunk]) : prev) : chunk;
      this.offset = 0;
    }

    function flush() {
      while (this.offset < this.buffer.length) {
        var start = this.offset;
        var value;
        try {
          value = this.fetch();
        } catch (e) {
          if (e && e.message != BUFFER_SHORTAGE) throw e;
          // rollback
          this.offset = start;
          break;
        }
        this.push(value);
      }
    }

    function reserve(length) {
      var start = this.offset;
      var end = start + length;
      if (end > this.buffer.length) throw new Error(BUFFER_SHORTAGE);
      this.offset = end;
      return start;
    }
  }

  function getEncoderMethods() {
    return {
      bufferish: bufferish,
      write: write$3,
      fetch: fetch,
      flush: flush,
      push: push$1,
      pull: pull,
      read: read$1,
      reserve: reserve,
      send: send,
      maxBufferSize: MAX_BUFFER_SIZE,
      minBufferSize: MIN_BUFFER_SIZE,
      offset: 0,
      start: 0
    };

    function fetch() {
      var start = this.start;
      if (start < this.offset) {
        var end = this.start = this.offset;
        return bufferish.prototype.slice.call(this.buffer, start, end);
      }
    }

    function flush() {
      while (this.start < this.offset) {
        var value = this.fetch();
        if (value) this.push(value);
      }
    }

    function pull() {
      var buffers = this.buffers || (this.buffers = []);
      var chunk = buffers.length > 1 ? this.bufferish.concat(buffers) : buffers[0];
      buffers.length = 0; // buffer exhausted
      return chunk;
    }

    function reserve(length) {
      var req = length | 0;

      if (this.buffer) {
        var size = this.buffer.length;
        var start = this.offset | 0;
        var end = start + req;

        // is it long enough?
        if (end < size) {
          this.offset = end;
          return start;
        }

        // flush current buffer
        this.flush();

        // resize it to 2x current length
        length = Math.max(length, Math.min(size * 2, this.maxBufferSize));
      }

      // minimum buffer size
      length = Math.max(length, this.minBufferSize);

      // allocate new buffer
      this.buffer = this.bufferish.alloc(length);
      this.start = 0;
      this.offset = req;
      return 0;
    }

    function send(buffer) {
      var length = buffer.length;
      if (length > this.minBufferSize) {
        this.flush();
        this.push(buffer);
      } else {
        var offset = this.reserve(length);
        bufferish.prototype.copy.call(buffer, this.buffer, offset);
      }
    }
  }

  // common methods

  function write$3() {
    throw new Error("method not implemented: write()");
  }

  function fetch() {
    throw new Error("method not implemented: fetch()");
  }

  function read$1() {
    var length = this.buffers && this.buffers.length;

    // fetch the first result
    if (!length) return this.fetch();

    // flush current buffer
    this.flush();

    // read from the results
    return this.pull();
  }

  function push$1(chunk) {
    var buffers = this.buffers || (this.buffers = []);
    buffers.push(chunk);
  }

  function pull() {
    var buffers = this.buffers || (this.buffers = []);
    return buffers.shift();
  }

  function mixinFactory(source) {
    return mixin;

    function mixin(target) {
      for (var key in source) {
        target[key] = source[key];
      }
      return target;
    }
  }

  var flexBuffer = {
  	FlexDecoder: FlexDecoder_1,
  	FlexEncoder: FlexEncoder_1
  };

  // encode-buffer.js

  var EncodeBuffer_1 = EncodeBuffer;

  var preset$2 = writeCore.preset;

  var FlexEncoder$1 = flexBuffer.FlexEncoder;

  FlexEncoder$1.mixin(EncodeBuffer.prototype);

  function EncodeBuffer(options) {
    if (!(this instanceof EncodeBuffer)) return new EncodeBuffer(options);

    if (options) {
      this.options = options;
      if (options.codec) {
        var codec = this.codec = options.codec;
        if (codec.bufferish) this.bufferish = codec.bufferish;
      }
    }
  }

  EncodeBuffer.prototype.codec = preset$2;

  EncodeBuffer.prototype.write = function(input) {
    this.codec.encode(this, input);
  };

  var encodeBuffer = {
  	EncodeBuffer: EncodeBuffer_1
  };

  // encode.js

  var encode_2 = encode$1;

  var EncodeBuffer$1 = encodeBuffer.EncodeBuffer;

  function encode$1(input, options) {
    var encoder = new EncodeBuffer$1(options);
    encoder.write(input);
    return encoder.read();
  }

  var encode_1 = {
  	encode: encode_2
  };

  // ext-unpacker.js

  var setExtUnpackers_1 = setExtUnpackers;


  var Buffer$4 = bufferish.global;
  var _decode;

  var ERROR_COLUMNS$1 = {name: 1, message: 1, stack: 1, columnNumber: 1, fileName: 1, lineNumber: 1};

  function setExtUnpackers(codec) {
    codec.addExtUnpacker(0x0E, [decode, unpackError(Error)]);
    codec.addExtUnpacker(0x01, [decode, unpackError(EvalError)]);
    codec.addExtUnpacker(0x02, [decode, unpackError(RangeError)]);
    codec.addExtUnpacker(0x03, [decode, unpackError(ReferenceError)]);
    codec.addExtUnpacker(0x04, [decode, unpackError(SyntaxError)]);
    codec.addExtUnpacker(0x05, [decode, unpackError(TypeError)]);
    codec.addExtUnpacker(0x06, [decode, unpackError(URIError)]);

    codec.addExtUnpacker(0x0A, [decode, unpackRegExp]);
    codec.addExtUnpacker(0x0B, [decode, unpackClass(Boolean)]);
    codec.addExtUnpacker(0x0C, [decode, unpackClass(String)]);
    codec.addExtUnpacker(0x0D, [decode, unpackClass(Date)]);
    codec.addExtUnpacker(0x0F, [decode, unpackClass(Number)]);

    if ("undefined" !== typeof Uint8Array) {
      codec.addExtUnpacker(0x11, unpackClass(Int8Array));
      codec.addExtUnpacker(0x12, unpackClass(Uint8Array));
      codec.addExtUnpacker(0x13, [unpackArrayBuffer, unpackClass(Int16Array)]);
      codec.addExtUnpacker(0x14, [unpackArrayBuffer, unpackClass(Uint16Array)]);
      codec.addExtUnpacker(0x15, [unpackArrayBuffer, unpackClass(Int32Array)]);
      codec.addExtUnpacker(0x16, [unpackArrayBuffer, unpackClass(Uint32Array)]);
      codec.addExtUnpacker(0x17, [unpackArrayBuffer, unpackClass(Float32Array)]);

      // PhantomJS/1.9.7 doesn't have Float64Array
      if ("undefined" !== typeof Float64Array) {
        codec.addExtUnpacker(0x18, [unpackArrayBuffer, unpackClass(Float64Array)]);
      }

      // IE10 doesn't have Uint8ClampedArray
      if ("undefined" !== typeof Uint8ClampedArray) {
        codec.addExtUnpacker(0x19, unpackClass(Uint8ClampedArray));
      }

      codec.addExtUnpacker(0x1A, unpackArrayBuffer);
      codec.addExtUnpacker(0x1D, [unpackArrayBuffer, unpackClass(DataView)]);
    }

    if (bufferish.hasBuffer) {
      codec.addExtUnpacker(0x1B, unpackClass(Buffer$4));
    }
  }

  function decode(input) {
    if (!_decode) _decode = decode_1.decode; // lazy load
    return _decode(input);
  }

  function unpackRegExp(value) {
    return RegExp.apply(null, value);
  }

  function unpackError(Class) {
    return function(value) {
      var out = new Class();
      for (var key in ERROR_COLUMNS$1) {
        out[key] = value[key];
      }
      return out;
    };
  }

  function unpackClass(Class) {
    return function(value) {
      return new Class(value);
    };
  }

  function unpackArrayBuffer(value) {
    return (new Uint8Array(value)).buffer;
  }

  var extUnpacker = {
  	setExtUnpackers: setExtUnpackers_1
  };

  // read-format.js



  var Uint64BE$2 = int64Buffer.Uint64BE;
  var Int64BE$2 = int64Buffer.Int64BE;

  var getReadFormat_1 = getReadFormat;
  var readUint8 = uint8$2;




  var HAS_MAP$1 = ("undefined" !== typeof Map);
  var NO_ASSERT = true;

  function getReadFormat(options) {
    var binarraybuffer = bufferish.hasArrayBuffer && options && options.binarraybuffer;
    var int64 = options && options.int64;
    var usemap = HAS_MAP$1 && options && options.usemap;

    var readFormat = {
      map: (usemap ? map_to_map : map_to_obj),
      array: array,
      str: str,
      bin: (binarraybuffer ? bin_arraybuffer : bin_buffer),
      ext: ext,
      uint8: uint8$2,
      uint16: uint16,
      uint32: uint32,
      uint64: read$2(8, int64 ? readUInt64BE_int64 : readUInt64BE),
      int8: int8,
      int16: int16,
      int32: int32,
      int64: read$2(8, int64 ? readInt64BE_int64 : readInt64BE),
      float32: read$2(4, readFloatBE),
      float64: read$2(8, readDoubleBE)
    };

    return readFormat;
  }

  function map_to_obj(decoder, len) {
    var value = {};
    var i;
    var k = new Array(len);
    var v = new Array(len);

    var decode = decoder.codec.decode;
    for (i = 0; i < len; i++) {
      k[i] = decode(decoder);
      v[i] = decode(decoder);
    }
    for (i = 0; i < len; i++) {
      value[k[i]] = v[i];
    }
    return value;
  }

  function map_to_map(decoder, len) {
    var value = new Map();
    var i;
    var k = new Array(len);
    var v = new Array(len);

    var decode = decoder.codec.decode;
    for (i = 0; i < len; i++) {
      k[i] = decode(decoder);
      v[i] = decode(decoder);
    }
    for (i = 0; i < len; i++) {
      value.set(k[i], v[i]);
    }
    return value;
  }

  function array(decoder, len) {
    var value = new Array(len);
    var decode = decoder.codec.decode;
    for (var i = 0; i < len; i++) {
      value[i] = decode(decoder);
    }
    return value;
  }

  function str(decoder, len) {
    var start = decoder.reserve(len);
    var end = start + len;
    return bufferishProto.toString.call(decoder.buffer, "utf-8", start, end);
  }

  function bin_buffer(decoder, len) {
    var start = decoder.reserve(len);
    var end = start + len;
    var buf = bufferishProto.slice.call(decoder.buffer, start, end);
    return bufferish.from(buf);
  }

  function bin_arraybuffer(decoder, len) {
    var start = decoder.reserve(len);
    var end = start + len;
    var buf = bufferishProto.slice.call(decoder.buffer, start, end);
    return bufferish.Uint8Array.from(buf).buffer;
  }

  function ext(decoder, len) {
    var start = decoder.reserve(len+1);
    var type = decoder.buffer[start++];
    var end = start + len;
    var unpack = decoder.codec.getExtUnpacker(type);
    if (!unpack) throw new Error("Invalid ext type: " + (type ? ("0x" + type.toString(16)) : type));
    var buf = bufferishProto.slice.call(decoder.buffer, start, end);
    return unpack(buf);
  }

  function uint8$2(decoder) {
    var start = decoder.reserve(1);
    return decoder.buffer[start];
  }

  function int8(decoder) {
    var start = decoder.reserve(1);
    var value = decoder.buffer[start];
    return (value & 0x80) ? value - 0x100 : value;
  }

  function uint16(decoder) {
    var start = decoder.reserve(2);
    var buffer = decoder.buffer;
    return (buffer[start++] << 8) | buffer[start];
  }

  function int16(decoder) {
    var start = decoder.reserve(2);
    var buffer = decoder.buffer;
    var value = (buffer[start++] << 8) | buffer[start];
    return (value & 0x8000) ? value - 0x10000 : value;
  }

  function uint32(decoder) {
    var start = decoder.reserve(4);
    var buffer = decoder.buffer;
    return (buffer[start++] * 16777216) + (buffer[start++] << 16) + (buffer[start++] << 8) + buffer[start];
  }

  function int32(decoder) {
    var start = decoder.reserve(4);
    var buffer = decoder.buffer;
    return (buffer[start++] << 24) | (buffer[start++] << 16) | (buffer[start++] << 8) | buffer[start];
  }

  function read$2(len, method) {
    return function(decoder) {
      var start = decoder.reserve(len);
      return method.call(decoder.buffer, start, NO_ASSERT);
    };
  }

  function readUInt64BE(start) {
    return new Uint64BE$2(this, start).toNumber();
  }

  function readInt64BE(start) {
    return new Int64BE$2(this, start).toNumber();
  }

  function readUInt64BE_int64(start) {
    return new Uint64BE$2(this, start);
  }

  function readInt64BE_int64(start) {
    return new Int64BE$2(this, start);
  }

  function readFloatBE(start) {
    return C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_ieee754.read(this, start, false, 23, 4);
  }

  function readDoubleBE(start) {
    return C__Users_zhangshize_source_repos_bridgerpcJs_node_modules_ieee754.read(this, start, false, 52, 8);
  }

  var readFormat = {
  	getReadFormat: getReadFormat_1,
  	readUint8: readUint8
  };

  // read-token.js



  var getReadToken_1 = getReadToken;

  function getReadToken(options) {
    var format = readFormat.getReadFormat(options);

    if (options && options.useraw) {
      return init_useraw(format);
    } else {
      return init_token$1(format);
    }
  }

  function init_token$1(format) {
    var i;
    var token = new Array(256);

    // positive fixint -- 0x00 - 0x7f
    for (i = 0x00; i <= 0x7f; i++) {
      token[i] = constant(i);
    }

    // fixmap -- 0x80 - 0x8f
    for (i = 0x80; i <= 0x8f; i++) {
      token[i] = fix(i - 0x80, format.map);
    }

    // fixarray -- 0x90 - 0x9f
    for (i = 0x90; i <= 0x9f; i++) {
      token[i] = fix(i - 0x90, format.array);
    }

    // fixstr -- 0xa0 - 0xbf
    for (i = 0xa0; i <= 0xbf; i++) {
      token[i] = fix(i - 0xa0, format.str);
    }

    // nil -- 0xc0
    token[0xc0] = constant(null);

    // (never used) -- 0xc1
    token[0xc1] = null;

    // false -- 0xc2
    // true -- 0xc3
    token[0xc2] = constant(false);
    token[0xc3] = constant(true);

    // bin 8 -- 0xc4
    // bin 16 -- 0xc5
    // bin 32 -- 0xc6
    token[0xc4] = flex(format.uint8, format.bin);
    token[0xc5] = flex(format.uint16, format.bin);
    token[0xc6] = flex(format.uint32, format.bin);

    // ext 8 -- 0xc7
    // ext 16 -- 0xc8
    // ext 32 -- 0xc9
    token[0xc7] = flex(format.uint8, format.ext);
    token[0xc8] = flex(format.uint16, format.ext);
    token[0xc9] = flex(format.uint32, format.ext);

    // float 32 -- 0xca
    // float 64 -- 0xcb
    token[0xca] = format.float32;
    token[0xcb] = format.float64;

    // uint 8 -- 0xcc
    // uint 16 -- 0xcd
    // uint 32 -- 0xce
    // uint 64 -- 0xcf
    token[0xcc] = format.uint8;
    token[0xcd] = format.uint16;
    token[0xce] = format.uint32;
    token[0xcf] = format.uint64;

    // int 8 -- 0xd0
    // int 16 -- 0xd1
    // int 32 -- 0xd2
    // int 64 -- 0xd3
    token[0xd0] = format.int8;
    token[0xd1] = format.int16;
    token[0xd2] = format.int32;
    token[0xd3] = format.int64;

    // fixext 1 -- 0xd4
    // fixext 2 -- 0xd5
    // fixext 4 -- 0xd6
    // fixext 8 -- 0xd7
    // fixext 16 -- 0xd8
    token[0xd4] = fix(1, format.ext);
    token[0xd5] = fix(2, format.ext);
    token[0xd6] = fix(4, format.ext);
    token[0xd7] = fix(8, format.ext);
    token[0xd8] = fix(16, format.ext);

    // str 8 -- 0xd9
    // str 16 -- 0xda
    // str 32 -- 0xdb
    token[0xd9] = flex(format.uint8, format.str);
    token[0xda] = flex(format.uint16, format.str);
    token[0xdb] = flex(format.uint32, format.str);

    // array 16 -- 0xdc
    // array 32 -- 0xdd
    token[0xdc] = flex(format.uint16, format.array);
    token[0xdd] = flex(format.uint32, format.array);

    // map 16 -- 0xde
    // map 32 -- 0xdf
    token[0xde] = flex(format.uint16, format.map);
    token[0xdf] = flex(format.uint32, format.map);

    // negative fixint -- 0xe0 - 0xff
    for (i = 0xe0; i <= 0xff; i++) {
      token[i] = constant(i - 0x100);
    }

    return token;
  }

  function init_useraw(format) {
    var i;
    var token = init_token$1(format).slice();

    // raw 8 -- 0xd9
    // raw 16 -- 0xda
    // raw 32 -- 0xdb
    token[0xd9] = token[0xc4];
    token[0xda] = token[0xc5];
    token[0xdb] = token[0xc6];

    // fixraw -- 0xa0 - 0xbf
    for (i = 0xa0; i <= 0xbf; i++) {
      token[i] = fix(i - 0xa0, format.bin);
    }

    return token;
  }

  function constant(value) {
    return function() {
      return value;
    };
  }

  function flex(lenFunc, decodeFunc) {
    return function(decoder) {
      var len = lenFunc(decoder);
      return decodeFunc(decoder, len);
    };
  }

  function fix(len, method) {
    return function(decoder) {
      return method(decoder, len);
    };
  }

  var readToken = {
  	getReadToken: getReadToken_1
  };

  // read-core.js

  var ExtBuffer$3 = extBuffer.ExtBuffer;

  var readUint8$1 = readFormat.readUint8;



  codecBase.install({
    addExtUnpacker: addExtUnpacker,
    getExtUnpacker: getExtUnpacker,
    init: init$1
  });

  var preset$3 = init$1.call(codecBase.preset);

  function getDecoder(options) {
    var readToken$$1 = readToken.getReadToken(options);
    return decode;

    function decode(decoder) {
      var type = readUint8$1(decoder);
      var func = readToken$$1[type];
      if (!func) throw new Error("Invalid type: " + (type ? ("0x" + type.toString(16)) : type));
      return func(decoder);
    }
  }

  function init$1() {
    var options = this.options;
    this.decode = getDecoder(options);

    if (options && options.preset) {
      extUnpacker.setExtUnpackers(this);
    }

    return this;
  }

  function addExtUnpacker(etype, unpacker) {
    var unpackers = this.extUnpackers || (this.extUnpackers = []);
    unpackers[etype] = codecBase.filter(unpacker);
  }

  function getExtUnpacker(type) {
    var unpackers = this.extUnpackers || (this.extUnpackers = []);
    return unpackers[type] || extUnpacker$$1;

    function extUnpacker$$1(buffer) {
      return new ExtBuffer$3(buffer, type);
    }
  }

  var readCore = {
  	preset: preset$3
  };

  // decode-buffer.js

  var DecodeBuffer_1 = DecodeBuffer;

  var preset$4 = readCore.preset;

  var FlexDecoder$1 = flexBuffer.FlexDecoder;

  FlexDecoder$1.mixin(DecodeBuffer.prototype);

  function DecodeBuffer(options) {
    if (!(this instanceof DecodeBuffer)) return new DecodeBuffer(options);

    if (options) {
      this.options = options;
      if (options.codec) {
        var codec = this.codec = options.codec;
        if (codec.bufferish) this.bufferish = codec.bufferish;
      }
    }
  }

  DecodeBuffer.prototype.codec = preset$4;

  DecodeBuffer.prototype.fetch = function() {
    return this.codec.decode(this);
  };

  var decodeBuffer = {
  	DecodeBuffer: DecodeBuffer_1
  };

  // decode.js

  var decode_2 = decode$1;

  var DecodeBuffer$1 = decodeBuffer.DecodeBuffer;

  function decode$1(input, options) {
    var decoder = new DecodeBuffer$1(options);
    decoder.write(input);
    return decoder.read();
  }

  var decode_1 = {
  	decode: decode_2
  };

  var eventLite = createCommonjsModule(function (module) {
  /**
   * event-lite.js - Light-weight EventEmitter (less than 1KB when gzipped)
   *
   * @copyright Yusuke Kawasaki
   * @license MIT
   * @constructor
   * @see https://github.com/kawanet/event-lite
   * @see http://kawanet.github.io/event-lite/EventLite.html
   * @example
   * var EventLite = require("event-lite");
   *
   * function MyClass() {...}             // your class
   *
   * EventLite.mixin(MyClass.prototype);  // import event methods
   *
   * var obj = new MyClass();
   * obj.on("foo", function() {...});     // add event listener
   * obj.once("bar", function() {...});   // add one-time event listener
   * obj.emit("foo");                     // dispatch event
   * obj.emit("bar");                     // dispatch another event
   * obj.off("foo");                      // remove event listener
   */

  function EventLite() {
    if (!(this instanceof EventLite)) return new EventLite();
  }

  (function(EventLite) {
    // export the class for node.js
    module.exports = EventLite;

    // property name to hold listeners
    var LISTENERS = "listeners";

    // methods to export
    var methods = {
      on: on,
      once: once,
      off: off,
      emit: emit
    };

    // mixin to self
    mixin(EventLite.prototype);

    // export mixin function
    EventLite.mixin = mixin;

    /**
     * Import on(), once(), off() and emit() methods into target object.
     *
     * @function EventLite.mixin
     * @param target {Prototype}
     */

    function mixin(target) {
      for (var key in methods) {
        target[key] = methods[key];
      }
      return target;
    }

    /**
     * Add an event listener.
     *
     * @function EventLite.prototype.on
     * @param type {string}
     * @param func {Function}
     * @returns {EventLite} Self for method chaining
     */

    function on(type, func) {
      getListeners(this, type).push(func);
      return this;
    }

    /**
     * Add one-time event listener.
     *
     * @function EventLite.prototype.once
     * @param type {string}
     * @param func {Function}
     * @returns {EventLite} Self for method chaining
     */

    function once(type, func) {
      var that = this;
      wrap.originalListener = func;
      getListeners(that, type).push(wrap);
      return that;

      function wrap() {
        off.call(that, type, wrap);
        func.apply(this, arguments);
      }
    }

    /**
     * Remove an event listener.
     *
     * @function EventLite.prototype.off
     * @param [type] {string}
     * @param [func] {Function}
     * @returns {EventLite} Self for method chaining
     */

    function off(type, func) {
      var that = this;
      var listners;
      if (!arguments.length) {
        delete that[LISTENERS];
      } else if (!func) {
        listners = that[LISTENERS];
        if (listners) {
          delete listners[type];
          if (!Object.keys(listners).length) return off.call(that);
        }
      } else {
        listners = getListeners(that, type, true);
        if (listners) {
          listners = listners.filter(ne);
          if (!listners.length) return off.call(that, type);
          that[LISTENERS][type] = listners;
        }
      }
      return that;

      function ne(test) {
        return test !== func && test.originalListener !== func;
      }
    }

    /**
     * Dispatch (trigger) an event.
     *
     * @function EventLite.prototype.emit
     * @param type {string}
     * @param [value] {*}
     * @returns {boolean} True when a listener received the event
     */

    function emit(type, value) {
      var that = this;
      var listeners = getListeners(that, type, true);
      if (!listeners) return false;
      var arglen = arguments.length;
      if (arglen === 1) {
        listeners.forEach(zeroarg);
      } else if (arglen === 2) {
        listeners.forEach(onearg);
      } else {
        var args = Array.prototype.slice.call(arguments, 1);
        listeners.forEach(moreargs);
      }
      return !!listeners.length;

      function zeroarg(func) {
        func.call(that);
      }

      function onearg(func) {
        func.call(that, value);
      }

      function moreargs(func) {
        func.apply(that, args);
      }
    }

    /**
     * @ignore
     */

    function getListeners(that, type, readonly) {
      if (readonly && !that[LISTENERS]) return;
      var listeners = that[LISTENERS] || (that[LISTENERS] = {});
      return listeners[type] || (listeners[type] = []);
    }

  })(EventLite);
  });

  // encoder.js

  var Encoder_1 = Encoder;


  var EncodeBuffer$2 = encodeBuffer.EncodeBuffer;

  function Encoder(options) {
    if (!(this instanceof Encoder)) return new Encoder(options);
    EncodeBuffer$2.call(this, options);
  }

  Encoder.prototype = new EncodeBuffer$2();

  eventLite.mixin(Encoder.prototype);

  Encoder.prototype.encode = function(chunk) {
    this.write(chunk);
    this.emit("data", this.read());
  };

  Encoder.prototype.end = function(chunk) {
    if (arguments.length) this.encode(chunk);
    this.flush();
    this.emit("end");
  };

  var encoder = {
  	Encoder: Encoder_1
  };

  // decoder.js

  var Decoder_1 = Decoder;


  var DecodeBuffer$2 = decodeBuffer.DecodeBuffer;

  function Decoder(options) {
    if (!(this instanceof Decoder)) return new Decoder(options);
    DecodeBuffer$2.call(this, options);
  }

  Decoder.prototype = new DecodeBuffer$2();

  eventLite.mixin(Decoder.prototype);

  Decoder.prototype.decode = function(chunk) {
    if (arguments.length) this.write(chunk);
    this.flush();
  };

  Decoder.prototype.push = function(chunk) {
    this.emit("data", chunk);
  };

  Decoder.prototype.end = function(chunk) {
    this.decode(chunk);
    this.emit("end");
  };

  var decoder = {
  	Decoder: Decoder_1
  };

  // encode-stream.js

  var createEncodeStream = EncodeStream;


  var Transform = stream.Transform;
  var EncodeBuffer$3 = encodeBuffer.EncodeBuffer;

  util.inherits(EncodeStream, Transform);

  var DEFAULT_OPTIONS = {objectMode: true};

  function EncodeStream(options) {
    if (!(this instanceof EncodeStream)) return new EncodeStream(options);
    if (options) {
      options.objectMode = true;
    } else {
      options = DEFAULT_OPTIONS;
    }
    Transform.call(this, options);

    var stream$$1 = this;
    var encoder = this.encoder = new EncodeBuffer$3(options);
    encoder.push = function(chunk) {
      stream$$1.push(chunk);
    };
  }

  EncodeStream.prototype._transform = function(chunk, encoding, callback) {
    this.encoder.write(chunk);
    if (callback) callback();
  };

  EncodeStream.prototype._flush = function(callback) {
    this.encoder.flush();
    if (callback) callback();
  };

  var encodeStream = {
  	createEncodeStream: createEncodeStream
  };

  // decode-stream.js

  var createDecodeStream = DecodeStream;


  var Transform$1 = stream.Transform;
  var DecodeBuffer$3 = decodeBuffer.DecodeBuffer;

  util.inherits(DecodeStream, Transform$1);

  var DEFAULT_OPTIONS$1 = {objectMode: true};

  function DecodeStream(options) {
    if (!(this instanceof DecodeStream)) return new DecodeStream(options);
    if (options) {
      options.objectMode = true;
    } else {
      options = DEFAULT_OPTIONS$1;
    }
    Transform$1.call(this, options);
    var stream$$1 = this;
    var decoder = this.decoder = new DecodeBuffer$3(options);
    decoder.push = function(chunk) {
      stream$$1.push(chunk);
    };
  }

  DecodeStream.prototype._transform = function(chunk, encoding, callback) {
    this.decoder.write(chunk);
    this.decoder.flush();
    if (callback) callback();
  };

  var decodeStream = {
  	createDecodeStream: createDecodeStream
  };

  // ext.js

  // load both interfaces



  var createCodec$1 = codecBase.createCodec;

  var ext$1 = {
  	createCodec: createCodec$1
  };

  // codec.js

  // load both interfaces



  // @public
  // msgpack.codec.preset

  var codec_1 = {
    preset: codecBase.preset
  };

  var codec = {
  	codec: codec_1
  };

  // msgpack.js

  var encode$2 = encode_1.encode;
  var decode$2 = decode_1.decode;

  var Encoder$1 = encoder.Encoder;
  var Decoder$1 = decoder.Decoder;

  var createEncodeStream$1 = encodeStream.createEncodeStream;
  var createDecodeStream$1 = decodeStream.createDecodeStream;

  var createCodec$2 = ext$1.createCodec;
  var codec$1 = codec.codec;

  var msgpackLite = {
  	encode: encode$2,
  	decode: decode$2,
  	Encoder: Encoder$1,
  	Decoder: Decoder$1,
  	createEncodeStream: createEncodeStream$1,
  	createDecodeStream: createDecodeStream$1,
  	createCodec: createCodec$2,
  	codec: codec$1
  };

  var RpcResponse = /** @class */ (function () {
      function RpcResponse() {
          this.bridgerpc = "1.0";
          this.id = null;
          this.result = null;
          this.error = null;
      }
      RpcResponse.prototype.encodeToMessagePack = function () {
          var r = {
              bridgerpc: this.bridgerpc,
              id: this.id,
              result: this.result,
              error: null,
          };
          if (this.error !== null || this.error !== undefined) {
              var error = this.error;
              r.error = {
                  code: error.code,
                  message: error.message,
                  data: error.data
              };
          }
          return msgpackLite.encode(r);
      };
      return RpcResponse;
  }());

  var RpcError = /** @class */ (function () {
      function RpcError() {
          this.code = 0;
          this.message = "";
          this.data = null;
      }
      return RpcError;
  }());

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */
  /* global Reflect, Promise */

  var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
      return extendStatics(d, b);
  };

  function __extends(d, b) {
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  var OperationTimeoutError = /** @class */ (function (_super) {
      __extends(OperationTimeoutError, _super);
      function OperationTimeoutError() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      return OperationTimeoutError;
  }(Error));

  // Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
  var BridgeRpc = /** @class */ (function () {
      function BridgeRpc(url$$1, protocols, options) {
          if (typeof protocols === 'object' && protocols !== null) {
              options = protocols;
              protocols = undefined;
          }
          this.rawSocket = new node(url$$1, protocols, options);
          this.handlers = new RequestHandlerDictionary();
          this.notificationHandlers = new NotificationHandlerDictionary();
          this.callbacks = new CallbackDictionary();
          this.initialize();
      }
      BridgeRpc.prototype.onRequest = function (method, handler) {
          this.handlers[method] = handler;
      };
      BridgeRpc.prototype.onNotify = function (method, handler) {
          var m = this.notificationHandlers[method];
          if (m === null || m === undefined) {
              this.notificationHandlers[method] = new Array();
          }
          this.notificationHandlers[method].push(handler);
      };
      BridgeRpc.prototype.request = function (method, data, timeoutMilliSeconds) {
          var _this = this;
          if (timeoutMilliSeconds === void 0) { timeoutMilliSeconds = 5000; }
          var id = BridgeRpc.randomString();
          this.rawSocket.send(msgpackLite.encode({
              bridgerpc: '1.0',
              method: method,
              data: data,
              id: id
          }));
          return new Promise(function (resolve, reject) {
              _this.callbacks[id] = new RpcCallback(resolve, reject);
              setTimeout(function () {
                  if (_this.callbacks.hasOwnProperty(id)) {
                      _this.callbacks[id].reject(new OperationTimeoutError("Rpc request timeout (" + timeoutMilliSeconds + " ms)"));
                  }
              }, timeoutMilliSeconds);
          });
      };
      BridgeRpc.prototype.notify = function (method, data) {
          this.rawSocket.send(msgpackLite.encode({
              bridgerpc: '1.0',
              method: method,
              data: data,
              id: null
          }));
      };
      BridgeRpc.prototype.initialize = function () {
          this.rawSocket.binaryType = 'arraybuffer';
          this.rawSocket.onmessage = this.onMessage.bind(this);
      };
      BridgeRpc.prototype.onMessage = function (event) {
          var data = msgpackLite.decode(event.data);
          if (data.method !== undefined && data.method !== null) {
              // It's a request or notification
              if (data.id !== undefined && data.id !== null) {
                  // It's a request
                  var request = data;
                  var handler = this.handlers[request.method];
                  if (handler === null || handler === undefined) {
                      // Method not found
                      this.rawSocket.send(BridgeRpc.methodNotFoundResponse(request).encodeToMessagePack());
                      return;
                  }
                  var res = void 0;
                  try {
                      res = handler(request);
                      if (res === undefined || res === null) {
                          // Internal Error
                          this.rawSocket.send(BridgeRpc.internalErrorResponse(request, "Method called, but no response.", null));
                          return;
                      }
                  }
                  catch (e) {
                      // Internal Error
                      this.rawSocket.send(BridgeRpc.internalErrorResponse(request, "Error occurred when method calling.", e));
                      return;
                  }
                  var response = res;
                  response.id = request.id;
                  this.rawSocket.send(response.encodeToMessagePack());
              }
              else {
                  // It's a notification
                  var notification = data;
                  var handlers = this.handlers[notification.method];
                  if (handlers.length === 0) ;
                  try {
                      this.notificationHandlers[notification.method]
                          .forEach(function (handler) {
                          handler(data);
                      });
                  }
                  catch (e) {
                      // ignore
                  }
              }
          }
          else {
              // It's a response
              var response = data;
              var callback = this.callbacks[response.id];
              try {
                  callback.resolve(response);
                  delete this.callbacks[response.id];
              }
              catch (e) {
                  // ignore
              }
          }
      };
      BridgeRpc.prototype.close = function (code, reason) {
          this.rawSocket.close(code, reason);
      };
      BridgeRpc.methodNotFoundResponse = function (request) {
          var error = new RpcError();
          error.code = -3;
          error.message = 'Method not found.';
          error.data = request;
          var response = new RpcResponse();
          response.error = error;
          response.result = null;
          response.id = request.id;
          return response;
      };
      BridgeRpc.internalErrorResponse = function (request, message, error) {
          var err = new RpcError();
          err.code = -10;
          err.message = message;
          err.data = error;
          var response = new RpcResponse();
          response.error = err;
          response.result = null;
          response.id = request.id;
          return response;
      };
      BridgeRpc.randomString = function () {
          return Math.random().toString(36).substring(2, 10) +
              Math.random().toString(36).substring(2, 10);
      };
      return BridgeRpc;
  }());
  var RequestHandlerDictionary = /** @class */ (function () {
      function RequestHandlerDictionary() {
      }
      return RequestHandlerDictionary;
  }());
  var NotificationHandlerDictionary = /** @class */ (function () {
      function NotificationHandlerDictionary() {
      }
      return NotificationHandlerDictionary;
  }());
  var RpcCallback = /** @class */ (function () {
      function RpcCallback(resolve, reject) {
          this.resolve = resolve;
          this.reject = reject;
      }
      return RpcCallback;
  }());
  var CallbackDictionary = /** @class */ (function () {
      function CallbackDictionary() {
      }
      return CallbackDictionary;
  }());

  return BridgeRpc;

})));
//# sourceMappingURL=bridgerpc.umd.js.map
