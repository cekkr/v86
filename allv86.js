
// ---- File: src/const.js ----
const
    LOG_ALL = -1,
    LOG_NONE = 0,

    LOG_OTHER =  0x0000001,
    LOG_CPU =    0x0000002,
    LOG_FPU =    0x0000004,
    LOG_MEM =    0x0000008,
    LOG_DMA =    0x0000010,
    LOG_IO =     0x0000020,
    LOG_PS2 =    0x0000040,
    LOG_PIC =    0x0000080,
    LOG_VGA =    0x0000100,
    LOG_PIT =    0x0000200,
    LOG_MOUSE =  0x0000400,
    LOG_PCI =    0x0000800,
    LOG_BIOS =   0x0001000,
    LOG_FLOPPY = 0x0002000,
    LOG_SERIAL = 0x0004000,
    LOG_DISK =   0x0008000,
    LOG_RTC =    0x0010000,
    // unused    0x0020000,
    LOG_ACPI =   0x0040000,
    LOG_APIC =   0x0080000,
    LOG_NET =    0x0100000,
    LOG_VIRTIO = 0x0200000,
    LOG_9P =     0x0400000,
    LOG_SB16 =   0x0800000,
    LOG_FETCH =  0x1000000;


/**
 * @type {Array<Array<string|number>>}
 */
const LOG_NAMES = [
    [1, ""],
    [LOG_CPU, "CPU"],
    [LOG_DISK, "DISK"],
    [LOG_FPU, "FPU"],
    [LOG_MEM, "MEM"],
    [LOG_DMA, "DMA"],
    [LOG_IO, "IO"],
    [LOG_PS2, "PS2"],
    [LOG_PIC, "PIC"],
    [LOG_VGA, "VGA"],
    [LOG_PIT, "PIT"],
    [LOG_MOUSE, "MOUS"],
    [LOG_PCI, "PCI"],
    [LOG_BIOS, "BIOS"],
    [LOG_FLOPPY, "FLOP"],
    [LOG_SERIAL, "SERI"],
    [LOG_RTC, "RTC"],
    [LOG_ACPI, "ACPI"],
    [LOG_APIC, "APIC"],
    [LOG_NET, "NET"],
    [LOG_VIRTIO, "VIO"],
    [LOG_9P, "9P"],
    [LOG_SB16, "SB16"],
    [LOG_FETCH, "FETC"],
];

const
    // flags register bitflags
    FLAG_CARRY = 1,
    FLAG_PARITY = 4,
    FLAG_ADJUST = 16,
    FLAG_ZERO = 64,
    FLAG_SIGN = 128,
    FLAG_TRAP = 256,
    FLAG_INTERRUPT = 512,
    FLAG_DIRECTION = 1024,
    FLAG_OVERFLOW = 2048,
    FLAG_IOPL = 1 << 12 | 1 << 13,
    FLAG_NT = 1 << 14,
    FLAG_RF = 1 << 16,
    FLAG_VM = 1 << 17,
    FLAG_AC = 1 << 18,
    FLAG_VIF = 1 << 19,
    FLAG_VIP = 1 << 20,
    FLAG_ID = 1 << 21,

    // default values of reserved flags bits
    FLAGS_DEFAULT = 1 << 1,

    REG_EAX = 0,
    REG_ECX = 1,
    REG_EDX = 2,
    REG_EBX = 3,
    REG_ESP = 4,
    REG_EBP = 5,
    REG_ESI = 6,
    REG_EDI = 7,

    REG_ES = 0,
    REG_CS = 1,
    REG_SS = 2,
    REG_DS = 3,
    REG_FS = 4,
    REG_GS = 5,

    REG_LDTR = 7; // local descriptor table register

const
    // The minimum number of bytes that can be memory-mapped by one device.
    MMAP_BLOCK_BITS = 17,
    MMAP_BLOCK_SIZE = 1 << MMAP_BLOCK_BITS,
    MMAP_MAX = 0x100000000;

const CR0_PG = 1 << 31;
const CR4_PAE = 1 << 5;


// https://github.com/qemu/seabios/blob/14221cd86eadba82255fdc55ed174d401c7a0a04/src/fw/paravirt.c#L205-L219

const FW_CFG_SIGNATURE = 0x00;
const FW_CFG_ID = 0x01;
const FW_CFG_RAM_SIZE = 0x03;
const FW_CFG_NB_CPUS = 0x05;
const FW_CFG_MAX_CPUS = 0x0F;
const FW_CFG_NUMA = 0x0D;
const FW_CFG_FILE_DIR = 0x19;

const FW_CFG_CUSTOM_START = 0x8000;
// This value is specific to v86, choosen to hopefully not collide with other indexes
const FW_CFG_FILE_START = 0xC000;
const FW_CFG_SIGNATURE_QEMU = 0x554D4551;


// See same constant in jit.rs
const WASM_TABLE_SIZE = 900;

const WASM_TABLE_OFFSET = 1024;

const MIXER_CHANNEL_LEFT = 0;
const MIXER_CHANNEL_RIGHT = 1;
const MIXER_CHANNEL_BOTH = 2;
const MIXER_SRC_MASTER = 0;
const MIXER_SRC_PCSPEAKER = 1;
const MIXER_SRC_DAC = 2;


// ---- File: src/log.js ----
if(typeof DEBUG === "undefined")
{
    globalThis.DEBUG = true;
}





/** @const */
var LOG_TO_FILE = false;

var LOG_LEVEL = LOG_ALL & ~LOG_PS2 & ~LOG_PIT & ~LOG_VIRTIO & ~LOG_9P & ~LOG_PIC &
                          ~LOG_DMA & ~LOG_SERIAL & ~LOG_NET & ~LOG_FLOPPY & ~LOG_DISK & ~LOG_VGA & ~LOG_SB16;

function set_log_level(level) {
    LOG_LEVEL = level;
}

var log_data = [];

function do_the_log(message)
{
    if(LOG_TO_FILE)
    {
        log_data.push(message, "\n");
    }
    else
    {
        console.log(message);
    }
}

/**
 * @type {function((string|number), number=)}
 */
const dbg_log = (function()
{
    if(!DEBUG)
    {
        return function() {};
    }

    /** @type {Object.<number, string>} */
    const dbg_names = LOG_NAMES.reduce(function(a, x)
    {
        a[x[0]] = x[1];
        return a;
    }, {});

    var log_last_message = "";
    var log_message_repetitions = 0;

    /**
     * @param {number=} level
     */
    function dbg_log_(stuff, level)
    {
        if(!DEBUG) return;

        level = level || 1;

        if(level & LOG_LEVEL)
        {
            var level_name = dbg_names[level] || "",
                message = "[" + pads(level_name, 4) + "] " + stuff;

            if(message === log_last_message)
            {
                log_message_repetitions++;

                if(log_message_repetitions < 2048)
                {
                    return;
                }
            }

            var now = new Date();
            var time_str = pad0(now.getHours(), 2) + ":" +
                           pad0(now.getMinutes(), 2) + ":" +
                           pad0(now.getSeconds(), 2) + "+" +
                           pad0(now.getMilliseconds(), 3) + " ";

            if(log_message_repetitions)
            {
                if(log_message_repetitions === 1)
                {
                    do_the_log(time_str + log_last_message);
                }
                else
                {
                    do_the_log("Previous message repeated " + log_message_repetitions + " times");
                }

                log_message_repetitions = 0;
            }

            do_the_log(time_str + message);
            log_last_message = message;
        }
    }

    return dbg_log_;
})();

/**
 * @param {number=} level
 */
function dbg_trace(level)
{
    if(!DEBUG) return;

    dbg_log(Error().stack, level);
}

/**
 * console.assert is fucking slow
 * @param {string=} msg
 * @param {number=} level
 */
function dbg_assert(cond, msg, level)
{
    if(!DEBUG) return;

    if(!cond)
    {
        dbg_assert_failed(msg);
    }
}


function dbg_assert_failed(msg)
{
    debugger;
    console.trace();

    if(msg)
    {
        throw "Assert failed: " + msg;
    }
    else
    {
        throw "Assert failed";
    }
}


// ---- File: src/lib.js ----


// pad string with spaces on the right
function pads(str, len)
{
    str = (str || str === 0) ? str + "" : "";
    return str.padEnd(len, " ");
}

// pad string with zeros on the left
function pad0(str, len)
{
    str = (str || str === 0) ? str + "" : "";
    return str.padStart(len, "0");
}

var view = function(constructor, memory, offset, length)
{
    dbg_assert(offset >= 0);
    return new Proxy({},
        {
            get: function(target, property, receiver)
            {
                const b = new constructor(memory.buffer, offset, length);
                const x = b[property];
                if(typeof x === "function")
                {
                    return x.bind(b);
                }
                dbg_assert(/^\d+$/.test(property) || property === "buffer" || property === "length" ||
                    property === "BYTES_PER_ELEMENT" || property === "byteOffset");
                return x;
            },
            set: function(target, property, value, receiver)
            {
                dbg_assert(/^\d+$/.test(property));
                new constructor(memory.buffer, offset, length)[property] = value;
                return true;
            },
        });
};

/**
 * number to hex
 * @param {number} n
 * @param {number=} len
 * @return {string}
 */
function h(n, len)
{
    if(!n)
    {
        var str = "";
    }
    else
    {
        var str = n.toString(16);
    }

    return "0x" + pad0(str.toUpperCase(), len || 1);
}

function hex_dump(buffer)
{
    function hex(n, len)
    {
        return pad0(n.toString(16).toUpperCase(), len);
    }

    const result = [];
    let offset = 0;

    for(; offset + 15 < buffer.length; offset += 16)
    {
        let line = hex(offset, 5) + "   ";

        for(let j = 0; j < 0x10; j++)
        {
            line += hex(buffer[offset + j], 2) + " ";
        }

        line += "  ";

        for(let j = 0; j < 0x10; j++)
        {
            const x = buffer[offset + j];
            line += (x >= 33 && x !== 34 && x !== 92 && x <= 126) ? String.fromCharCode(x) : ".";
        }

        result.push(line);
    }

    let line = hex(offset, 5) + "   ";

    for(; offset < buffer.length; offset++)
    {
        line += hex(buffer[offset], 2) + " ";
    }

    const remainder = offset & 0xF;
    line += "   ".repeat(0x10 - remainder);
    line += "  ";

    for(let j = 0; j < remainder; j++)
    {
        const x = buffer[offset + j];
        line += (x >= 33 && x !== 34 && x !== 92 && x <= 126) ? String.fromCharCode(x) : ".";
    }

    result.push(line);

    return "\n" + result.join("\n") + "\n";
}

/* global require */
var get_rand_int;
if(typeof crypto !== "undefined" && crypto.getRandomValues)
{
    const rand_data = new Int32Array(1);

    get_rand_int = function()
    {
        crypto.getRandomValues(rand_data);
        return rand_data[0];
    };
}
else if(typeof require !== "undefined")
{
    /** @type {{ randomBytes: Function }} */
    const crypto = require("crypto");

    get_rand_int = function()
    {
        return crypto.randomBytes(4)["readInt32LE"](0);
    };
}
else if(typeof process !== "undefined")
    {
        import("node:" + "crypto").then(crypto => {
            get_rand_int = function()
            {
                return crypto["randomBytes"](4)["readInt32LE"](0);
            };
        });
    }
else
{
    dbg_assert(false, "Unsupported platform: No cryptographic random values");
}

var int_log2;

if(typeof Math.clz32 === "function" && Math.clz32(0) === 32 && Math.clz32(0x12345) === 15 && Math.clz32(-1) === 0)
{
    /**
     * calculate the integer logarithm base 2
     * @param {number} x
     * @return {number}
     */
    int_log2 = function(x)
    {
        dbg_assert(x > 0);

        return 31 - Math.clz32(x);
    };
} else {

    var int_log2_table = new Int8Array(256);

    for(var i = 0, b = -2; i < 256; i++)
    {
        if(!(i & i - 1))
            b++;

        int_log2_table[i] = b;
    }

    /**
     * calculate the integer logarithm base 2
     * @param {number} x
     * @return {number}
     */
    int_log2 = function(x)
    {
        x >>>= 0;
        dbg_assert(x > 0);

        // http://jsperf.com/integer-log2/6
        var tt = x >>> 16;

        if(tt)
        {
            var t = tt >>> 8;
            if(t)
            {
                return 24 + int_log2_table[t];
            }
            else
            {
                return 16 + int_log2_table[tt];
            }
        }
        else
        {
            var t = x >>> 8;
            if(t)
            {
                return 8 + int_log2_table[t];
            }
            else
            {
                return int_log2_table[x];
            }
        }
    };
}

const round_up_to_next_power_of_2 = function(x)
{
    dbg_assert(x >= 0);
    return x <= 1 ? 1 : 1 << 1 + int_log2(x - 1);
};

if(DEBUG)
{
    dbg_assert(int_log2(1) === 0);
    dbg_assert(int_log2(2) === 1);
    dbg_assert(int_log2(7) === 2);
    dbg_assert(int_log2(8) === 3);
    dbg_assert(int_log2(123456789) === 26);

    dbg_assert(round_up_to_next_power_of_2(0) === 1);
    dbg_assert(round_up_to_next_power_of_2(1) === 1);
    dbg_assert(round_up_to_next_power_of_2(2) === 2);
    dbg_assert(round_up_to_next_power_of_2(7) === 8);
    dbg_assert(round_up_to_next_power_of_2(8) === 8);
    dbg_assert(round_up_to_next_power_of_2(123456789) === 134217728);
}

/**
 * @constructor
 *
 * Queue wrapper around Uint8Array
 * Used by devices such as the PS2 controller
 */
function ByteQueue(size)
{
    var data = new Uint8Array(size),
        start,
        end;

    dbg_assert((size & size - 1) === 0);

    this.length = 0;

    this.push = function(item)
    {
        if(this.length === size)
        {
            // intentional overwrite
        }
        else
        {
            this.length++;
        }

        data[end] = item;
        end = end + 1 & size - 1;
    };

    this.shift = function()
    {
        if(!this.length)
        {
            return -1;
        }
        else
        {
            var item = data[start];

            start = start + 1 & size - 1;
            this.length--;

            return item;
        }
    };

    this.peek = function()
    {
        if(!this.length)
        {
            return -1;
        }
        else
        {
            return data[start];
        }
    };

    this.clear = function()
    {
        start = 0;
        end = 0;
        this.length = 0;
    };

    this.clear();
}


/**
 * @constructor
 *
 * Queue wrapper around Float32Array
 * Used by devices such as the sound blaster sound card
 */
function FloatQueue(size)
{
    this.size = size;
    this.data = new Float32Array(size);
    this.start = 0;
    this.end = 0;
    this.length = 0;

    dbg_assert((size & size - 1) === 0);
}

FloatQueue.prototype.push = function(item)
{
    if(this.length === this.size)
    {
        // intentional overwrite
        this.start = this.start + 1 & this.size - 1;
    }
    else
    {
        this.length++;
    }

    this.data[this.end] = item;
    this.end = this.end + 1 & this.size - 1;
};

FloatQueue.prototype.shift = function()
{
    if(!this.length)
    {
        return undefined;
    }
    else
    {
        var item = this.data[this.start];

        this.start = this.start + 1 & this.size - 1;
        this.length--;

        return item;
    }
};

FloatQueue.prototype.shift_block = function(count)
{
    var slice = new Float32Array(count);

    if(count > this.length)
    {
        count = this.length;
    }
    var slice_end = this.start + count;

    var partial = this.data.subarray(this.start, slice_end);

    slice.set(partial);
    if(slice_end >= this.size)
    {
        slice_end -= this.size;
        slice.set(this.data.subarray(0, slice_end), partial.length);
    }
    this.start = slice_end;

    this.length -= count;

    return slice;
};

FloatQueue.prototype.peek = function()
{
    if(!this.length)
    {
        return undefined;
    }
    else
    {
        return this.data[this.start];
    }
};

FloatQueue.prototype.clear = function()
{
    this.start = 0;
    this.end = 0;
    this.length = 0;
};


/**
 * Simple circular queue for logs
 *
 * @param {number} size
 * @constructor
 */
function CircularQueue(size)
{
    this.data = [];
    this.index = 0;
    this.size = size;
}

CircularQueue.prototype.add = function(item)
{
    this.data[this.index] = item;
    this.index = (this.index + 1) % this.size;
};

CircularQueue.prototype.toArray = function()
{
    return [].slice.call(this.data, this.index).concat([].slice.call(this.data, 0, this.index));
};

CircularQueue.prototype.clear = function()
{
    this.data = [];
    this.index = 0;
};

/**
 * @param {Array} new_data
 */
CircularQueue.prototype.set = function(new_data)
{
    this.data = new_data;
    this.index = 0;
};

function dump_file(ab, name)
{
    if(!Array.isArray(ab))
    {
        ab = [ab];
    }

    var blob = new Blob(ab);
    download(blob, name);
}

function download(file_or_blob, name)
{
    var a = document.createElement("a");
    a["download"] = name;
    a.href = window.URL.createObjectURL(file_or_blob);
    a.dataset["downloadurl"] = ["application/octet-stream", a["download"], a.href].join(":");

    if(document.createEvent)
    {
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent("click", true, true, window,
                          0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(ev);
    }
    else
    {
        a.click();
    }

    window.URL.revokeObjectURL(a.href);
}

/**
 * A simple 1d bitmap
 * @constructor
 */
var Bitmap = function(length_or_buffer)
{
    if(typeof length_or_buffer === "number")
    {
        this.view = new Uint8Array(length_or_buffer + 7 >> 3);
    }
    else if(length_or_buffer instanceof ArrayBuffer)
    {
        this.view = new Uint8Array(length_or_buffer);
    }
    else
    {
        dbg_assert(false, "Bitmap: Invalid argument");
    }
};

Bitmap.prototype.set = function(index, value)
{
    const bit_index = index & 7;
    const byte_index = index >> 3;
    const bit_mask = 1 << bit_index;

    this.view[byte_index] =
        value ? this.view[byte_index] | bit_mask : this.view[byte_index] & ~bit_mask;
};

Bitmap.prototype.get = function(index)
{
    const bit_index = index & 7;
    const byte_index = index >> 3;

    return this.view[byte_index] >> bit_index & 1;
};

Bitmap.prototype.get_buffer = function()
{
    return this.view.buffer;
};

var load_file;
var get_file_size;

if(typeof XMLHttpRequest === "undefined" ||
    typeof process !== "undefined" && process.versions && process.versions.node)
{
    let fs;

    /**
     * @param {string} filename
     * @param {Object} options
     * @param {number=} n_tries
     */
    load_file = async function(filename, options, n_tries)
    {
        if(!fs)
        {
            // string concat to work around closure compiler 'Invalid module path "node:fs/promises" for resolution mode'
            fs = await import("node:" + "fs/promises");
        }

        if(options.range)
        {
            dbg_assert(!options.as_json);

            const fd = await fs["open"](filename, "r");

            const length = options.range.length;
            const buffer = Buffer.allocUnsafe(length);

            try
            {
                /** @type {{ bytesRead: Number }} */
                const result = await fd["read"]({
                    buffer,
                    position: options.range.start
                });
                dbg_assert(result.bytesRead === length);
            }
            finally
            {
                await fd["close"]();
            }

            options.done && options.done(new Uint8Array(buffer));
        }
        else
        {
            const o = {
                encoding: options.as_json ? "utf-8" : null,
            };

            const data = await fs["readFile"](filename, o);
            const result = options.as_json ? JSON.parse(data) : new Uint8Array(data).buffer;

            options.done(result);
        }
    };

    get_file_size = async function(path)
    {
        if(!fs)
        {
            // string concat to work around closure compiler 'Invalid module path "node:fs/promises" for resolution mode'
            fs = await import("node:" + "fs/promises");
        }
        const stat = await fs["stat"](path);
        return stat.size;
    };
}
else
{
    /**
     * @param {string} filename
     * @param {Object} options
     * @param {number=} n_tries
     */
    load_file = async function(filename, options, n_tries)
    {
        var http = new XMLHttpRequest();

        http.open(options.method || "get", filename, true);

        if(options.as_json)
        {
            http.responseType = "json";
        }
        else
        {
            http.responseType = "arraybuffer";
        }

        if(options.headers)
        {
            var header_names = Object.keys(options.headers);

            for(var i = 0; i < header_names.length; i++)
            {
                var name = header_names[i];
                http.setRequestHeader(name, options.headers[name]);
            }
        }

        if(options.range)
        {
            const start = options.range.start;
            const end = start + options.range.length - 1;
            http.setRequestHeader("Range", "bytes=" + start + "-" + end);
            http.setRequestHeader("X-Accept-Encoding", "identity");

            // Abort if server responds with complete file in response to range
            // request, to prevent downloading large files from broken http servers
            http.onreadystatechange = function()
            {
                if(http.status === 200)
                {
                    console.error("Server sent full file in response to ranged request, aborting", { filename });
                    http.abort();
                }
            };
        }

        http.onload = function(e)
        {
            if(http.readyState === 4)
            {
                if(http.status !== 200 && http.status !== 206)
                {
                    console.error("Loading the image " + filename + " failed (status %d)", http.status);
                    if(http.status >= 500 && http.status < 600)
                    {
                        retry();
                    }
                }
                else if(http.response)
                {
                    if(options.range)
                    {
                        const enc = http.getResponseHeader("Content-Encoding");
                        if(enc && enc !== "identity")
                        {
                            console.error("Server sent Content-Encoding in response to ranged request", {filename, enc});
                        }
                    }
                    options.done && options.done(http.response, http);
                }
            }
        };

        http.onerror = function(e)
        {
            console.error("Loading the image " + filename + " failed", e);
            retry();
        };

        if(options.progress)
        {
            http.onprogress = function(e)
            {
                options.progress(e);
            };
        }

        http.send(null);

        function retry()
        {
            const number_of_tries = n_tries || 0;
            const timeout = [1, 1, 2, 3, 5, 8, 13, 21][number_of_tries] || 34;
            setTimeout(() => {
                load_file(filename, options, number_of_tries + 1);
            }, 1000 * timeout);
        }
    };

    get_file_size = async function(url)
    {
        return new Promise((resolve, reject) => {
            load_file(url, {
                done: (buffer, http) =>
                {
                    var header = http.getResponseHeader("Content-Range") || "";
                    var match = header.match(/\/(\d+)\s*$/);

                    if(match)
                    {
                        resolve(+match[1]);
                    }
                    else
                    {
                        const error = new Error("`Range: bytes=...` header not supported (Got `" + header + "`)");
                        reject(error);
                    }
                },
                headers: {
                    Range: "bytes=0-0",
                    "X-Accept-Encoding": "identity"
                }
            });
        });
    };
}

// Reads len characters at offset from Memory object mem as a JS string
function read_sized_string_from_mem(mem, offset, len)
{
    offset >>>= 0;
    len >>>= 0;
    return String.fromCharCode(...new Uint8Array(mem.buffer, offset, len));
}


// ---- File: src/buffer.js ----




// The smallest size the emulated hardware can emit
const BLOCK_SIZE = 256;

const ASYNC_SAFE = false;

/**
 * Synchronous access to ArrayBuffer
 * @constructor
 */
function SyncBuffer(buffer)
{
    dbg_assert(buffer instanceof ArrayBuffer);

    this.buffer = buffer;
    this.byteLength = buffer.byteLength;
    this.onload = undefined;
    this.onprogress = undefined;
}

SyncBuffer.prototype.load = function()
{
    this.onload && this.onload({ buffer: this.buffer });
};

/**
 * @this {SyncBuffer|SyncFileBuffer}
 * @param {number} start
 * @param {number} len
 * @param {function(!Uint8Array)} fn
 */
SyncBuffer.prototype.get = function(start, len, fn)
{
    dbg_assert(start + len <= this.byteLength);
    fn(new Uint8Array(this.buffer, start, len));
};

/**
 * @this {SyncBuffer|SyncFileBuffer}
 * @param {number} start
 * @param {!Uint8Array} slice
 * @param {function()} fn
 */
SyncBuffer.prototype.set = function(start, slice, fn)
{
    dbg_assert(start + slice.byteLength <= this.byteLength);

    new Uint8Array(this.buffer, start, slice.byteLength).set(slice);
    fn();
};

/**
 * @this {SyncBuffer|SyncFileBuffer}
 * @param {function(!ArrayBuffer)} fn
 */
SyncBuffer.prototype.get_buffer = function(fn)
{
    fn(this.buffer);
};

/**
 * @this {SyncBuffer|SyncFileBuffer}
 */
SyncBuffer.prototype.get_state = function()
{
    const state = [];
    state[0] = this.byteLength;
    state[1] = new Uint8Array(this.buffer);
    return state;
};

/**
 * @this {SyncBuffer|SyncFileBuffer}
 */
SyncBuffer.prototype.set_state = function(state)
{
    this.byteLength = state[0];
    this.buffer = state[1].slice().buffer;
};

/**
 * Asynchronous access to ArrayBuffer, loading blocks lazily as needed,
 * using the `Range: bytes=...` header
 *
 * @constructor
 * @param {string} filename Name of the file to download
 * @param {number|undefined} size
 * @param {number|undefined} fixed_chunk_size
 */
function AsyncXHRBuffer(filename, size, fixed_chunk_size)
{
    this.filename = filename;

    this.byteLength = size;

    this.block_cache = new Map();
    this.block_cache_is_write = new Set();

    this.fixed_chunk_size = fixed_chunk_size;
    this.cache_reads = !!fixed_chunk_size; // TODO: could also be useful in other cases (needs testing)

    this.onload = undefined;
    this.onprogress = undefined;
}

AsyncXHRBuffer.prototype.load = async function()
{
    if(this.byteLength !== undefined)
    {
        this.onload && this.onload(Object.create(null));
        return;
    }

    const size = await get_file_size(this.filename);
    this.byteLength = size;
    this.onload && this.onload(Object.create(null));
};

/**
 * @param {number} offset
 * @param {number} len
 * @this {AsyncXHRBuffer|AsyncXHRPartfileBuffer|AsyncFileBuffer}
 */
AsyncXHRBuffer.prototype.get_from_cache = function(offset, len)
{
    var number_of_blocks = len / BLOCK_SIZE;
    var block_index = offset / BLOCK_SIZE;

    for(var i = 0; i < number_of_blocks; i++)
    {
        var block = this.block_cache.get(block_index + i);

        if(!block)
        {
            return;
        }
    }

    if(number_of_blocks === 1)
    {
        return this.block_cache.get(block_index);
    }
    else
    {
        var result = new Uint8Array(len);
        for(var i = 0; i < number_of_blocks; i++)
        {
            result.set(this.block_cache.get(block_index + i), i * BLOCK_SIZE);
        }
        return result;
    }
};

/**
 * @param {number} offset
 * @param {number} len
 * @param {function(!Uint8Array)} fn
 */
AsyncXHRBuffer.prototype.get = function(offset, len, fn)
{
    dbg_assert(offset + len <= this.byteLength);
    dbg_assert(offset % BLOCK_SIZE === 0);
    dbg_assert(len % BLOCK_SIZE === 0);
    dbg_assert(len);

    var block = this.get_from_cache(offset, len);
    if(block)
    {
        if(ASYNC_SAFE)
        {
            setTimeout(fn.bind(this, block), 0);
        }
        else
        {
            fn(block);
        }
        return;
    }

    var requested_start = offset;
    var requested_length = len;
    if(this.fixed_chunk_size)
    {
        requested_start = offset - (offset % this.fixed_chunk_size);
        requested_length = Math.ceil((offset - requested_start + len) / this.fixed_chunk_size) * this.fixed_chunk_size;
    }

    load_file(this.filename, {
        done: function done(buffer)
        {
            var block = new Uint8Array(buffer);
            this.handle_read(requested_start, requested_length, block);
            if(requested_start === offset && requested_length === len)
            {
                fn(block);
            }
            else
            {
                fn(block.subarray(offset - requested_start, offset - requested_start + len));
            }
        }.bind(this),
        range: { start: requested_start, length: requested_length },
    });
};

/**
 * Relies on this.byteLength and this.block_cache
 *
 * @this {AsyncXHRBuffer|AsyncXHRPartfileBuffer|AsyncFileBuffer}
 *
 * @param {number} start
 * @param {!Uint8Array} data
 * @param {function()} fn
 */
AsyncXHRBuffer.prototype.set = function(start, data, fn)
{
    var len = data.length;
    dbg_assert(start + data.byteLength <= this.byteLength);
    dbg_assert(start % BLOCK_SIZE === 0);
    dbg_assert(len % BLOCK_SIZE === 0);
    dbg_assert(len);

    var start_block = start / BLOCK_SIZE;
    var block_count = len / BLOCK_SIZE;

    for(var i = 0; i < block_count; i++)
    {
        var block = this.block_cache.get(start_block + i);

        if(block === undefined)
        {
            const data_slice = data.slice(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE);
            this.block_cache.set(start_block + i, data_slice);
        }
        else
        {
            const data_slice = data.subarray(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE);
            dbg_assert(block.byteLength === data_slice.length);
            block.set(data_slice);
        }

        this.block_cache_is_write.add(start_block + i);
    }

    fn();
};

/**
 * @this {AsyncXHRBuffer|AsyncXHRPartfileBuffer|AsyncFileBuffer}
 * @param {number} offset
 * @param {number} len
 * @param {!Uint8Array} block
 */
AsyncXHRBuffer.prototype.handle_read = function(offset, len, block)
{
    // Used by AsyncXHRBuffer, AsyncXHRPartfileBuffer and AsyncFileBuffer
    // Overwrites blocks from the original source that have been written since

    var start_block = offset / BLOCK_SIZE;
    var block_count = len / BLOCK_SIZE;

    for(var i = 0; i < block_count; i++)
    {
        const cached_block = this.block_cache.get(start_block + i);

        if(cached_block)
        {
            block.set(cached_block, i * BLOCK_SIZE);
        }
        else if(this.cache_reads)
        {
            this.block_cache.set(start_block + i, block.slice(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE));
        }
    }
};

AsyncXHRBuffer.prototype.get_buffer = function(fn)
{
    // We must download all parts, unlikely a good idea for big files
    fn();
};

///**
// * @this {AsyncXHRBuffer|AsyncXHRPartfileBuffer|AsyncFileBuffer}
// */
//AsyncXHRBuffer.prototype.get_block_cache = function()
//{
//    var count = Object.keys(this.block_cache).length;

//    var buffer = new Uint8Array(count * BLOCK_SIZE);
//    var indices = [];

//    var i = 0;
//    for(var index of Object.keys(this.block_cache))
//    {
//        var block = this.block_cache.get(index);
//        dbg_assert(block.length === BLOCK_SIZE);
//        index = +index;
//        indices.push(index);
//        buffer.set(
//            block,
//            i * BLOCK_SIZE
//        );
//        i++;
//    }

//    return {
//        buffer,
//        indices,
//        block_size: BLOCK_SIZE,
//    };
//};

/**
 * @this {AsyncXHRBuffer|AsyncXHRPartfileBuffer|AsyncFileBuffer}
 */
AsyncXHRBuffer.prototype.get_state = function()
{
    const state = [];
    const block_cache = [];

    for(const [index, block] of this.block_cache)
    {
        dbg_assert(isFinite(index));
        if(this.block_cache_is_write.has(index))
        {
            block_cache.push([index, block]);
        }
    }

    state[0] = block_cache;
    return state;
};

/**
 * @this {AsyncXHRBuffer|AsyncXHRPartfileBuffer|AsyncFileBuffer}
 */
AsyncXHRBuffer.prototype.set_state = function(state)
{
    const block_cache = state[0];
    this.block_cache.clear();
    this.block_cache_is_write.clear();

    for(const [index, block] of block_cache)
    {
        dbg_assert(isFinite(index));
        this.block_cache.set(index, block);
        this.block_cache_is_write.add(index);
    }
};

/**
 * Asynchronous access to ArrayBuffer, loading blocks lazily as needed,
 * downloading files named filename-%d-%d.ext (where the %d are start and end offset).
 * Or, if partfile_alt_format is set, filename-%08d.ext (where %d is the part number, compatible with gnu split).
 *
 * @constructor
 * @param {string} filename Name of the file to download
 * @param {number|undefined} size
 * @param {number|undefined} fixed_chunk_size
 * @param {boolean|undefined} partfile_alt_format
 */
function AsyncXHRPartfileBuffer(filename, size, fixed_chunk_size, partfile_alt_format, zstd_decompress)
{
    const parts = filename.match(/\.[^\.]+(\.zst)?$/);

    this.extension = parts ? parts[0] : "";
    this.basename = filename.substring(0, filename.length - this.extension.length);

    this.is_zstd = this.extension.endsWith(".zst");

    if(!this.basename.endsWith("/"))
    {
        this.basename += "-";
    }

    this.block_cache = new Map();
    this.block_cache_is_write = new Set();

    this.byteLength = size;
    this.fixed_chunk_size = fixed_chunk_size;
    this.partfile_alt_format = !!partfile_alt_format;
    this.zstd_decompress = zstd_decompress;

    this.cache_reads = !!fixed_chunk_size; // TODO: could also be useful in other cases (needs testing)

    this.onload = undefined;
    this.onprogress = undefined;
}

AsyncXHRPartfileBuffer.prototype.load = function()
{
    if(this.byteLength !== undefined)
    {
        this.onload && this.onload(Object.create(null));
        return;
    }
    dbg_assert(false);
    this.onload && this.onload(Object.create(null));
};

/**
 * @param {number} offset
 * @param {number} len
 * @param {function(!Uint8Array)} fn
 */
AsyncXHRPartfileBuffer.prototype.get = function(offset, len, fn)
{
    dbg_assert(offset + len <= this.byteLength);
    dbg_assert(offset % BLOCK_SIZE === 0);
    dbg_assert(len % BLOCK_SIZE === 0);
    dbg_assert(len);

    const block = this.get_from_cache(offset, len);

    if(block)
    {
        if(ASYNC_SAFE)
        {
            setTimeout(fn.bind(this, block), 0);
        }
        else
        {
            fn(block);
        }
        return;
    }

    if(this.fixed_chunk_size)
    {
        const start_index = Math.floor(offset / this.fixed_chunk_size);
        const m_offset = offset - start_index * this.fixed_chunk_size;
        dbg_assert(m_offset >= 0);
        const total_count = Math.ceil((m_offset + len) / this.fixed_chunk_size);
        const blocks = new Uint8Array(total_count * this.fixed_chunk_size);
        let finished = 0;

        for(let i = 0; i < total_count; i++)
        {
            const offset = (start_index + i) * this.fixed_chunk_size;

            const part_filename =
                this.partfile_alt_format ?
                    // matches output of gnu split:
                    //   split -b 512 -a8 -d --additional-suffix .img w95.img w95-
                    this.basename + (start_index + i + "").padStart(8, "0") + this.extension
                :
                    this.basename + offset + "-" + (offset + this.fixed_chunk_size) + this.extension;

            // XXX: unnecessary allocation
            const block = this.get_from_cache(offset, this.fixed_chunk_size);

            if(block)
            {
                blocks.set(block, i * this.fixed_chunk_size);
                finished++;
                if(finished === total_count)
                {
                    fn(blocks.subarray(m_offset, m_offset + len));
                }
            }
            else
            {
                load_file(part_filename, {
                    done: async function done(buffer)
                    {
                        let block = new Uint8Array(buffer);

                        if(this.is_zstd)
                        {
                            const decompressed = await this.zstd_decompress(this.fixed_chunk_size, block);
                            block = new Uint8Array(decompressed);
                        }

                        blocks.set(block, i * this.fixed_chunk_size);
                        this.handle_read((start_index + i) * this.fixed_chunk_size, this.fixed_chunk_size|0, block);

                        finished++;
                        if(finished === total_count)
                        {
                            fn(blocks.subarray(m_offset, m_offset + len));
                        }
                    }.bind(this),
                });
            }
        }
    }
    else
    {
        const part_filename = this.basename + offset + "-" + (offset + len) + this.extension;

        load_file(part_filename, {
            done: function done(buffer)
            {
                dbg_assert(buffer.byteLength === len);
                var block = new Uint8Array(buffer);
                this.handle_read(offset, len, block);
                fn(block);
            }.bind(this),
        });
    }
};

AsyncXHRPartfileBuffer.prototype.get_from_cache = AsyncXHRBuffer.prototype.get_from_cache;
AsyncXHRPartfileBuffer.prototype.set = AsyncXHRBuffer.prototype.set;
AsyncXHRPartfileBuffer.prototype.handle_read = AsyncXHRBuffer.prototype.handle_read;
//AsyncXHRPartfileBuffer.prototype.get_block_cache = AsyncXHRBuffer.prototype.get_block_cache;
AsyncXHRPartfileBuffer.prototype.get_state = AsyncXHRBuffer.prototype.get_state;
AsyncXHRPartfileBuffer.prototype.set_state = AsyncXHRBuffer.prototype.set_state;

/**
 * Synchronous access to File, loading blocks from the input type=file
 * The whole file is loaded into memory during initialisation
 *
 * @constructor
 */
function SyncFileBuffer(file)
{
    this.file = file;
    this.byteLength = file.size;

    if(file.size > (1 << 30))
    {
        console.warn("SyncFileBuffer: Allocating buffer of " + (file.size >> 20) + " MB ...");
    }

    this.buffer = new ArrayBuffer(file.size);

    this.onload = undefined;
    this.onprogress = undefined;
}

SyncFileBuffer.prototype.load = function()
{
    this.load_next(0);
};

/**
 * @param {number} start
 */
SyncFileBuffer.prototype.load_next = function(start)
{
    const PART_SIZE = 4 << 20;

    var filereader = new FileReader();

    filereader.onload = function(e)
    {
        var buffer = new Uint8Array(e.target.result);
        new Uint8Array(this.buffer, start).set(buffer);
        this.load_next(start + PART_SIZE);
    }.bind(this);

    if(this.onprogress)
    {
        this.onprogress({
            loaded: start,
            total: this.byteLength,
            lengthComputable: true,
        });
    }

    if(start < this.byteLength)
    {
        var end = Math.min(start + PART_SIZE, this.byteLength);
        var slice = this.file.slice(start, end);
        filereader.readAsArrayBuffer(slice);
    }
    else
    {
        this.file = undefined;
        this.onload && this.onload({ buffer: this.buffer });
    }
};

SyncFileBuffer.prototype.get = SyncBuffer.prototype.get;
SyncFileBuffer.prototype.set = SyncBuffer.prototype.set;
SyncFileBuffer.prototype.get_buffer = SyncBuffer.prototype.get_buffer;
SyncFileBuffer.prototype.get_state = SyncBuffer.prototype.get_state;
SyncFileBuffer.prototype.set_state = SyncBuffer.prototype.set_state;

/**
 * Asynchronous access to File, loading blocks from the input type=file
 *
 * @constructor
 */
function AsyncFileBuffer(file)
{
    this.file = file;
    this.byteLength = file.size;

    this.block_cache = new Map();
    this.block_cache_is_write = new Set();

    this.onload = undefined;
    this.onprogress = undefined;
}

AsyncFileBuffer.prototype.load = function()
{
    this.onload && this.onload(Object.create(null));
};

/**
 * @param {number} offset
 * @param {number} len
 * @param {function(!Uint8Array)} fn
 */
AsyncFileBuffer.prototype.get = function(offset, len, fn)
{
    dbg_assert(offset % BLOCK_SIZE === 0);
    dbg_assert(len % BLOCK_SIZE === 0);
    dbg_assert(len);

    var block = this.get_from_cache(offset, len);
    if(block)
    {
        fn(block);
        return;
    }

    var fr = new FileReader();

    fr.onload = function(e)
    {
        var buffer = e.target.result;
        var block = new Uint8Array(buffer);

        this.handle_read(offset, len, block);
        fn(block);
    }.bind(this);

    fr.readAsArrayBuffer(this.file.slice(offset, offset + len));
};
AsyncFileBuffer.prototype.get_from_cache = AsyncXHRBuffer.prototype.get_from_cache;
AsyncFileBuffer.prototype.set = AsyncXHRBuffer.prototype.set;
AsyncFileBuffer.prototype.handle_read = AsyncXHRBuffer.prototype.handle_read;
AsyncFileBuffer.prototype.get_state = AsyncXHRBuffer.prototype.get_state;
AsyncFileBuffer.prototype.set_state = AsyncXHRBuffer.prototype.set_state;

AsyncFileBuffer.prototype.get_buffer = function(fn)
{
    // We must load all parts, unlikely a good idea for big files
    fn();
};

AsyncFileBuffer.prototype.get_as_file = function(name)
{
    var parts = [];
    var existing_blocks = Array.from(this.block_cache.keys()).sort(function(x, y) { return x - y; });

    var current_offset = 0;

    for(var i = 0; i < existing_blocks.length; i++)
    {
        var block_index = existing_blocks[i];
        var block = this.block_cache.get(block_index);
        var start = block_index * BLOCK_SIZE;
        dbg_assert(start >= current_offset);

        if(start !== current_offset)
        {
            parts.push(this.file.slice(current_offset, start));
            current_offset = start;
        }

        parts.push(block);
        current_offset += block.length;
    }

    if(current_offset !== this.file.size)
    {
        parts.push(this.file.slice(current_offset));
    }

    var file = new File(parts, name);
    dbg_assert(file.size === this.file.size);

    return file;
};

function buffer_from_object(obj, zstd_decompress_worker)
{
    // TODO: accept Uint8Array, ArrayBuffer, File, url rather than { url }

    if(obj.buffer instanceof ArrayBuffer)
    {
        return new SyncBuffer(obj.buffer);
    }
    else if(typeof File !== "undefined" && obj.buffer instanceof File)
    {
        // SyncFileBuffer:
        // - loads the whole disk image into memory, impossible for large files (more than 1GB)
        // - can later serve get/set operations fast and synchronously
        // - takes some time for first load, neglectable for small files (up to 100Mb)
        //
        // AsyncFileBuffer:
        // - loads slices of the file asynchronously as requested
        // - slower get/set

        // Heuristics: If file is larger than or equal to 256M, use AsyncFileBuffer
        let is_async = obj.async;
        if(is_async === undefined)
        {
            is_async = obj.buffer.size >= 256 * 1024 * 1024;
        }

        if(is_async)
        {
            return new AsyncFileBuffer(obj.buffer);
        }
        else
        {
            return new SyncFileBuffer(obj.buffer);
        }
    }
    else if(obj.url)
    {
        // Note: Only async for now

        if(obj.use_parts)
        {
            return new AsyncXHRPartfileBuffer(obj.url, obj.size, obj.fixed_chunk_size, false, zstd_decompress_worker);
        }
        else
        {
            return new AsyncXHRBuffer(obj.url, obj.size, obj.fixed_chunk_size);
        }
    }
    else
    {
        dbg_log("Ignored file: url=" + obj.url + " buffer=" + obj.buffer);
    }
}


// ---- File: src/dma.js ----




// For Types Only


/**
 * @constructor
 * @param {CPU} cpu
 */
function DMA(cpu)
{
    /** @const @type {CPU} */
    this.cpu = cpu;

    this.channel_page = new Uint8Array(8);
    this.channel_pagehi = new Uint8Array(8);
    this.channel_addr = new Uint16Array(8);
    this.channel_addr_init = new Uint16Array(8);
    this.channel_count = new Uint16Array(8);
    this.channel_count_init = new Uint16Array(8);
    this.channel_mask = new Uint8Array(8);
    this.channel_mode = new Uint8Array(8);
    this.unmask_listeners = [];

    this.lsb_msb_flipflop = 0;

    var io = cpu.io;

    io.register_write(0x00, this, this.port_addr_write.bind(this, 0));
    io.register_write(0x02, this, this.port_addr_write.bind(this, 1));
    io.register_write(0x04, this, this.port_addr_write.bind(this, 2));
    io.register_write(0x06, this, this.port_addr_write.bind(this, 3));
    io.register_write(0x01, this, this.port_count_write.bind(this, 0));
    io.register_write(0x03, this, this.port_count_write.bind(this, 1));
    io.register_write(0x05, this, this.port_count_write.bind(this, 2));
    io.register_write(0x07, this, this.port_count_write.bind(this, 3));

    io.register_read(0x00, this, this.port_addr_read.bind(this, 0));
    io.register_read(0x02, this, this.port_addr_read.bind(this, 1));
    io.register_read(0x04, this, this.port_addr_read.bind(this, 2));
    io.register_read(0x06, this, this.port_addr_read.bind(this, 3));
    io.register_read(0x01, this, this.port_count_read.bind(this, 0));
    io.register_read(0x03, this, this.port_count_read.bind(this, 1));
    io.register_read(0x05, this, this.port_count_read.bind(this, 2));
    io.register_read(0x07, this, this.port_count_read.bind(this, 3));

    io.register_write(0xC0, this, this.port_addr_write.bind(this, 4));
    io.register_write(0xC4, this, this.port_addr_write.bind(this, 5));
    io.register_write(0xC8, this, this.port_addr_write.bind(this, 6));
    io.register_write(0xCC, this, this.port_addr_write.bind(this, 7));
    io.register_write(0xC2, this, this.port_count_write.bind(this, 4));
    io.register_write(0xC6, this, this.port_count_write.bind(this, 5));
    io.register_write(0xCA, this, this.port_count_write.bind(this, 6));
    io.register_write(0xCE, this, this.port_count_write.bind(this, 7));

    io.register_read(0xC0, this, this.port_addr_read.bind(this, 4));
    io.register_read(0xC4, this, this.port_addr_read.bind(this, 5));
    io.register_read(0xC8, this, this.port_addr_read.bind(this, 6));
    io.register_read(0xCC, this, this.port_addr_read.bind(this, 7));
    io.register_read(0xC2, this, this.port_count_read.bind(this, 4));
    io.register_read(0xC6, this, this.port_count_read.bind(this, 5));
    io.register_read(0xCA, this, this.port_count_read.bind(this, 6));
    io.register_read(0xCE, this, this.port_count_read.bind(this, 7));

    io.register_write(0x87, this, this.port_page_write.bind(this, 0));
    io.register_write(0x83, this, this.port_page_write.bind(this, 1));
    io.register_write(0x81, this, this.port_page_write.bind(this, 2));
    io.register_write(0x82, this, this.port_page_write.bind(this, 3));
    io.register_write(0x8F, this, this.port_page_write.bind(this, 4));
    io.register_write(0x8B, this, this.port_page_write.bind(this, 5));
    io.register_write(0x89, this, this.port_page_write.bind(this, 6));
    io.register_write(0x8A, this, this.port_page_write.bind(this, 7));

    io.register_read(0x87, this, this.port_page_read.bind(this, 0));
    io.register_read(0x83, this, this.port_page_read.bind(this, 1));
    io.register_read(0x81, this, this.port_page_read.bind(this, 2));
    io.register_read(0x82, this, this.port_page_read.bind(this, 3));
    io.register_read(0x8F, this, this.port_page_read.bind(this, 4));
    io.register_read(0x8B, this, this.port_page_read.bind(this, 5));
    io.register_read(0x89, this, this.port_page_read.bind(this, 6));
    io.register_read(0x8A, this, this.port_page_read.bind(this, 7));

    io.register_write(0x487, this, this.port_pagehi_write.bind(this, 0));
    io.register_write(0x483, this, this.port_pagehi_write.bind(this, 1));
    io.register_write(0x481, this, this.port_pagehi_write.bind(this, 2));
    io.register_write(0x482, this, this.port_pagehi_write.bind(this, 3));
    io.register_write(0x48B, this, this.port_pagehi_write.bind(this, 5));
    io.register_write(0x489, this, this.port_pagehi_write.bind(this, 6));
    io.register_write(0x48A, this, this.port_pagehi_write.bind(this, 7));

    io.register_read(0x487, this, this.port_pagehi_read.bind(this, 0));
    io.register_read(0x483, this, this.port_pagehi_read.bind(this, 1));
    io.register_read(0x481, this, this.port_pagehi_read.bind(this, 2));
    io.register_read(0x482, this, this.port_pagehi_read.bind(this, 3));
    io.register_read(0x48B, this, this.port_pagehi_read.bind(this, 5));
    io.register_read(0x489, this, this.port_pagehi_read.bind(this, 6));
    io.register_read(0x48A, this, this.port_pagehi_read.bind(this, 7));

    io.register_write(0x0A, this, this.port_singlemask_write.bind(this, 0));
    io.register_write(0xD4, this, this.port_singlemask_write.bind(this, 4));
    io.register_write(0x0F, this, this.port_multimask_write.bind(this, 0));
    io.register_write(0xDE, this, this.port_multimask_write.bind(this, 4));

    io.register_read(0x0F, this, this.port_multimask_read.bind(this, 0));
    io.register_read(0xDE, this, this.port_multimask_read.bind(this, 4));

    io.register_write(0x0B, this, this.port_mode_write.bind(this, 0));
    io.register_write(0xD6, this, this.port_mode_write.bind(this, 4));

    io.register_write(0x0C, this, this.portC_write);
    io.register_write(0xD8, this, this.portC_write);
}

DMA.prototype.get_state = function()
{
    return [
        this.channel_page,
        this.channel_pagehi,
        this.channel_addr,
        this.channel_addr_init,
        this.channel_count,
        this.channel_count_init,
        this.channel_mask,
        this.channel_mode,
        this.lsb_msb_flipflop,
    ];
};

DMA.prototype.set_state = function(state)
{
    this.channel_page = state[0];
    this.channel_pagehi = state[1];
    this.channel_addr = state[2];
    this.channel_addr_init = state[3];
    this.channel_count = state[4];
    this.channel_count_init = state[5];
    this.channel_mask = state[6];
    this.channel_mode = state[7];
    this.lsb_msb_flipflop = state[8];
};

DMA.prototype.port_count_write = function(channel, data_byte)
{
    dbg_log("count write [" + channel + "] = " + h(data_byte), LOG_DMA);

    this.channel_count[channel] =
        this.flipflop_get(this.channel_count[channel], data_byte, false);

    this.channel_count_init[channel] =
        this.flipflop_get(this.channel_count_init[channel], data_byte, true);
};

DMA.prototype.port_count_read = function(channel)
{
    dbg_log("count read [" + channel + "] -> " + h(this.channel_count[channel]), LOG_DMA);
    return this.flipflop_read(this.channel_count[channel]);
};

DMA.prototype.port_addr_write = function(channel, data_byte)
{
    dbg_log("addr write [" + channel + "] = " + h(data_byte), LOG_DMA);

    this.channel_addr[channel] =
        this.flipflop_get(this.channel_addr[channel], data_byte, false);

    this.channel_addr_init[channel] =
        this.flipflop_get(this.channel_addr_init[channel], data_byte, true);
};

DMA.prototype.port_addr_read = function(channel)
{
    dbg_log("addr read [" + channel + "] -> " + h(this.channel_addr[channel]), LOG_DMA);
    return this.flipflop_read(this.channel_addr[channel]);
};

DMA.prototype.port_pagehi_write = function(channel, data_byte)
{
    dbg_log("pagehi write [" + channel + "] = " + h(data_byte), LOG_DMA);
    this.channel_pagehi[channel] = data_byte;
};

DMA.prototype.port_pagehi_read = function(channel)
{
    dbg_log("pagehi read [" + channel + "]", LOG_DMA);
    return this.channel_pagehi[channel];
};

DMA.prototype.port_page_write = function(channel, data_byte)
{
    dbg_log("page write [" + channel + "] = " + h(data_byte), LOG_DMA);
    this.channel_page[channel] = data_byte;
};

DMA.prototype.port_page_read = function(channel)
{
    dbg_log("page read [" + channel + "]", LOG_DMA);
    return this.channel_page[channel];
};

DMA.prototype.port_singlemask_write = function(channel_offset, data_byte)
{
    var channel = (data_byte & 0x3) + channel_offset;
    var value = data_byte & 0x4 ? 1 : 0;
    dbg_log("singlechannel mask write [" + channel + "] = " + value, LOG_DMA);
    this.update_mask(channel, value);
};

DMA.prototype.port_multimask_write = function(channel_offset, data_byte)
{
    dbg_log("multichannel mask write: " + h(data_byte), LOG_DMA);
    for(var i = 0; i < 4; i++)
    {
        this.update_mask(channel_offset + i, data_byte & (1 << i));
    }
};

DMA.prototype.port_multimask_read = function(channel_offset)
{
    var value = 0;
    value |= this.channel_mask[channel_offset + 0];
    value |= this.channel_mask[channel_offset + 1] << 1;
    value |= this.channel_mask[channel_offset + 2] << 2;
    value |= this.channel_mask[channel_offset + 3] << 3;
    dbg_log("multichannel mask read: " + h(value), LOG_DMA);
    return value;
};

DMA.prototype.port_mode_write = function(channel_offset, data_byte)
{
    var channel = (data_byte & 0x3) + channel_offset;
    dbg_log("mode write [" + channel + "] = " + h(data_byte), LOG_DMA);
    this.channel_mode[channel] = data_byte;
};

DMA.prototype.portC_write = function(data_byte)
{
    dbg_log("flipflop reset", LOG_DMA);
    this.lsb_msb_flipflop = 0;
};

DMA.prototype.on_unmask = function(fn, this_value)
{
    this.unmask_listeners.push({
        fn: fn,
        this_value: this_value,
    });
};

DMA.prototype.update_mask = function(channel, value)
{
    if(this.channel_mask[channel] !== value)
    {
        this.channel_mask[channel] = value;

        if(!value)
        {
            dbg_log("firing on_unmask(" + channel + ")", LOG_DMA);
            for(var i = 0; i < this.unmask_listeners.length; i++)
            {
                this.unmask_listeners[i].fn.call(
                    this.unmask_listeners[i].this_value,
                    channel
                );
            }
        }
    }
};

// read data, write to memory
DMA.prototype.do_read = function(buffer, start, len, channel, fn)
{
    var read_count = this.count_get_8bit(channel),
        addr = this.address_get_8bit(channel);

    dbg_log("DMA write channel " + channel, LOG_DMA);
    dbg_log("to " + h(addr) + " len " + h(read_count), LOG_DMA);

    if(len < read_count)
    {
        dbg_log("DMA should read more than provided: " + h(len) + " " + h(read_count), LOG_DMA);
    }

    if(start + read_count > buffer.byteLength)
    {
        dbg_log("DMA read outside of buffer", LOG_DMA);
        fn(true);
    }
    else
    {
        var cpu = this.cpu;
        this.channel_addr[channel] += read_count;

        buffer.get(start, read_count, function(data)
        {
            cpu.write_blob(data, addr);
            fn(false);
        });
    }
};

// write data, read memory
// start and len in bytes
DMA.prototype.do_write = function(buffer, start, len, channel, fn)
{
    var read_count = (this.channel_count[channel] + 1) & 0xFFFF,
        bytes_per_count = channel >= 5 ? 2 : 1,
        read_bytes = read_count * bytes_per_count,
        addr = this.address_get_8bit(channel),
        unfinished = false,
        want_more = false,
        autoinit = this.channel_mode[channel] & 0x10;

    dbg_log("DMA write channel " + channel, LOG_DMA);
    dbg_log("to " + h(addr) + " len " + h(read_bytes), LOG_DMA);

    if(len < read_bytes)
    {
        dbg_log("DMA should read more than provided", LOG_DMA);
        read_count = Math.floor(len / bytes_per_count);
        read_bytes = read_count * bytes_per_count;
        unfinished = true;
    }
    else if(len > read_bytes)
    {
        dbg_log("DMA attempted to read more than provided", LOG_DMA);
        want_more = true;
    }

    if(start + read_bytes > buffer.byteLength)
    {
        dbg_log("DMA write outside of buffer", LOG_DMA);
        fn(true);
    }
    else
    {
        this.channel_addr[channel] += read_count;
        this.channel_count[channel] -= read_count;
        // when complete, counter should underflow to 0xFFFF

        if(!unfinished && autoinit)
        {
            dbg_log("DMA autoinit", LOG_DMA);
            this.channel_addr[channel] = this.channel_addr_init[channel];
            this.channel_count[channel] = this.channel_count_init[channel];
        }

        buffer.set(start,
                this.cpu.mem8.subarray(addr, addr + read_bytes),
                () =>
                {
                    if(want_more && autoinit)
                    {
                        dbg_log("DMA continuing from start", LOG_DMA);
                        this.do_write(buffer, start + read_bytes, len - read_bytes, channel, fn);
                    }
                    else
                    {
                        fn(false);
                    }
                }
            );
    }
};

DMA.prototype.address_get_8bit = function(channel)
{
    var addr = this.channel_addr[channel];

    // http://wiki.osdev.org/ISA_DMA#16_bit_issues
    if(channel >= 5)
    {
        addr = (addr << 1);
    }

    addr &= 0xFFFF;
    addr |= this.channel_page[channel] << 16;
    addr |= this.channel_pagehi[channel] << 24;

    return addr;
};

DMA.prototype.count_get_8bit = function(channel)
{
    var count = this.channel_count[channel] + 1;

    if(channel >= 5)
    {
        count *= 2;
    }

    return count;
};

DMA.prototype.flipflop_get = function(old_dword, new_byte, continuing)
{
    if(!continuing)
    {
        this.lsb_msb_flipflop ^= 1;
    }

    if(this.lsb_msb_flipflop)
    {
        // low byte
        return old_dword & ~0xFF | new_byte;
    }
    else
    {
        // high byte
        return old_dword & ~0xFF00 | new_byte << 8;
    }
};

DMA.prototype.flipflop_read = function(dword)
{
    this.lsb_msb_flipflop ^= 1;

    if(this.lsb_msb_flipflop)
    {
        // low byte
        return dword & 0xFF;
    }
    else
    {
        // high byte
        return (dword >> 8) & 0xFF;
    }
};


// ---- File: src/io.js ----




// For Types Only


// Enables logging all IO port reads and writes. Very verbose
const LOG_ALL_IO = false;

/**
 * The ISA IO bus
 * Devices register their ports here
 *
 * @constructor
 * @param {CPU} cpu
 */
function IO(cpu)
{
    /** @const */
    this.ports = [];

    /** @const @type {CPU} */
    this.cpu = cpu;

    for(var i = 0; i < 0x10000; i++)
    {
        this.ports[i] = this.create_empty_entry();
    }

    var memory_size = cpu.memory_size[0];

    for(var i = 0; (i << MMAP_BLOCK_BITS) < memory_size; i++)
    {
        // avoid sparse arrays
        cpu.memory_map_read8[i] = cpu.memory_map_write8[i] = undefined;
        cpu.memory_map_read32[i] = cpu.memory_map_write32[i] = undefined;
    }

    this.mmap_register(memory_size, MMAP_MAX - memory_size,
        function(addr) {
            // read outside of the memory size
            dbg_log("Read from unmapped memory space, addr=" + h(addr >>> 0, 8), LOG_IO);
            return 0xFF;
        },
        function(addr, value) {
            // write outside of the memory size
            dbg_log("Write to unmapped memory space, addr=" + h(addr >>> 0, 8) + " value=" + h(value, 2), LOG_IO);
        },
        function(addr) {
            dbg_log("Read from unmapped memory space, addr=" + h(addr >>> 0, 8), LOG_IO);
            return -1;
        },
        function(addr, value) {
            dbg_log("Write to unmapped memory space, addr=" + h(addr >>> 0, 8) + " value=" + h(value >>> 0, 8), LOG_IO);
        }
    );
}

IO.prototype.create_empty_entry = function()
{
    return {
        read8: this.empty_port_read8,
        read16: this.empty_port_read16,
        read32: this.empty_port_read32,

        write8: this.empty_port_write,
        write16: this.empty_port_write,
        write32: this.empty_port_write,

        device: undefined,
    };
};

IO.prototype.empty_port_read8 = function()
{
    return 0xFF;
};

IO.prototype.empty_port_read16 = function()
{
    return 0xFFFF;
};

IO.prototype.empty_port_read32 = function()
{
    return -1;
};

IO.prototype.empty_port_write = function(x)
{
};


/**
 * @param {number} port_addr
 * @param {Object} device
 * @param {function(number):number=} r8
 * @param {function(number):number=} r16
 * @param {function(number):number=} r32
 */
IO.prototype.register_read = function(port_addr, device, r8, r16, r32)
{
    dbg_assert(typeof port_addr === "number");
    dbg_assert(typeof device === "object");
    dbg_assert(!r8 || typeof r8 === "function");
    dbg_assert(!r16 || typeof r16 === "function");
    dbg_assert(!r32 || typeof r32 === "function");
    dbg_assert(r8 || r16 || r32);

    if(DEBUG)
    {
        var fail = function(n) {
            dbg_assert(false, "Overlapped read" + n + " " + h(port_addr, 4) + " (" + device.name + ")");
            return -1 >>> (32 - n) | 0;
        };
        if(!r8) r8 = fail.bind(this, 8);
        if(!r16) r16 = fail.bind(this, 16);
        if(!r32) r32 = fail.bind(this, 32);
    }

    if(r8) this.ports[port_addr].read8 = r8;
    if(r16) this.ports[port_addr].read16 = r16;
    if(r32) this.ports[port_addr].read32 = r32;
    this.ports[port_addr].device = device;
};

/**
 * @param {number} port_addr
 * @param {Object} device
 * @param {function(number)=} w8
 * @param {function(number)=} w16
 * @param {function(number)=} w32
 */
IO.prototype.register_write = function(port_addr, device, w8, w16, w32)
{
    dbg_assert(typeof port_addr === "number");
    dbg_assert(typeof device === "object");
    dbg_assert(!w8 || typeof w8 === "function");
    dbg_assert(!w16 || typeof w16 === "function");
    dbg_assert(!w32 || typeof w32 === "function");
    dbg_assert(w8 || w16 || w32);

    if(DEBUG)
    {
        var fail = function(n) {
            dbg_assert(false, "Overlapped write" + n + " " + h(port_addr) + " (" + device.name + ")");
        };
        if(!w8) w8 = fail.bind(this, 8);
        if(!w16) w16 = fail.bind(this, 16);
        if(!w32) w32 = fail.bind(this, 32);
    }

    if(w8) this.ports[port_addr].write8 = w8;
    if(w16) this.ports[port_addr].write16 = w16;
    if(w32) this.ports[port_addr].write32 = w32;
    this.ports[port_addr].device = device;
};

/**
 * > Any two consecutive 8-bit ports can be treated as a 16-bit port;
 * > and four consecutive 8-bit ports can be treated as a 32-bit port
 * > http://css.csail.mit.edu/6.858/2012/readings/i386/s08_01.htm
 *
 * This info is not correct for all ports, but handled by the following functions
 *
 * Register the write of 2 or 4 consecutive 8-bit ports, 1 or 2 16-bit
 * ports and 0 or 1 32-bit ports
 *
 * @param {number} port_addr
 * @param {!Object} device
 * @param {function():number} r8_1
 * @param {function():number} r8_2
 * @param {function():number=} r8_3
 * @param {function():number=} r8_4
 */
IO.prototype.register_read_consecutive = function(port_addr, device, r8_1, r8_2, r8_3, r8_4)
{
    dbg_assert(arguments.length === 4 || arguments.length === 6);

    function r16_1()
    {
        return r8_1.call(this) |
                r8_2.call(this) << 8;
    }
    function r16_2()
    {
        return r8_3.call(this) |
                r8_4.call(this) << 8;
    }
    function r32()
    {
        return r8_1.call(this) |
                r8_2.call(this) << 8 |
                r8_3.call(this) << 16 |
                r8_4.call(this) << 24;
    }

    if(r8_3 && r8_4)
    {
        this.register_read(port_addr, device, r8_1, r16_1, r32);
        this.register_read(port_addr + 1, device, r8_2);
        this.register_read(port_addr + 2, device, r8_3, r16_2);
        this.register_read(port_addr + 3, device, r8_4);
    }
    else
    {
        this.register_read(port_addr, device, r8_1, r16_1);
        this.register_read(port_addr + 1, device, r8_2);
    }
};

/**
 * @param {number} port_addr
 * @param {!Object} device
 * @param {function(number)} w8_1
 * @param {function(number)} w8_2
 * @param {function(number)=} w8_3
 * @param {function(number)=} w8_4
 */
IO.prototype.register_write_consecutive = function(port_addr, device, w8_1, w8_2, w8_3, w8_4)
{
    dbg_assert(arguments.length === 4 || arguments.length === 6);

    function w16_1(data)
    {
        w8_1.call(this, data & 0xFF);
        w8_2.call(this, data >> 8 & 0xFF);
    }
    function w16_2(data)
    {
        w8_3.call(this, data & 0xFF);
        w8_4.call(this, data >> 8 & 0xFF);
    }
    function w32(data)
    {
        w8_1.call(this, data & 0xFF);
        w8_2.call(this, data >> 8 & 0xFF);
        w8_3.call(this, data >> 16 & 0xFF);
        w8_4.call(this, data >>> 24);
    }

    if(w8_3 && w8_4)
    {
        this.register_write(port_addr,     device, w8_1, w16_1, w32);
        this.register_write(port_addr + 1, device, w8_2);
        this.register_write(port_addr + 2, device, w8_3, w16_2);
        this.register_write(port_addr + 3, device, w8_4);
    }
    else
    {
        this.register_write(port_addr,     device, w8_1, w16_1);
        this.register_write(port_addr + 1, device, w8_2);
    }
};

IO.prototype.mmap_read32_shim = function(addr)
{
    var aligned_addr = addr >>> MMAP_BLOCK_BITS;
    var fn = this.cpu.memory_map_read8[aligned_addr];

    return fn(addr) | fn(addr + 1) << 8 |
            fn(addr + 2) << 16 | fn(addr + 3) << 24;
};

IO.prototype.mmap_write32_shim = function(addr, value)
{
    var aligned_addr = addr >>> MMAP_BLOCK_BITS;
    var fn = this.cpu.memory_map_write8[aligned_addr];

    fn(addr, value & 0xFF);
    fn(addr + 1, value >> 8 & 0xFF);
    fn(addr + 2, value >> 16 & 0xFF);
    fn(addr + 3, value >>> 24);
};

/**
 * @param {number} addr
 * @param {number} size
 * @param {*} read_func8
 * @param {*} write_func8
 * @param {*=} read_func32
 * @param {*=} write_func32
 */
IO.prototype.mmap_register = function(addr, size, read_func8, write_func8, read_func32, write_func32)
{
    dbg_log("mmap_register addr=" + h(addr >>> 0, 8) + " size=" + h(size, 8), LOG_IO);

    dbg_assert((addr & MMAP_BLOCK_SIZE - 1) === 0);
    dbg_assert(size && (size & MMAP_BLOCK_SIZE - 1) === 0);

    if(!read_func32)
        read_func32 = this.mmap_read32_shim.bind(this);

    if(!write_func32)
        write_func32 = this.mmap_write32_shim.bind(this);

    var aligned_addr = addr >>> MMAP_BLOCK_BITS;

    for(; size > 0; aligned_addr++)
    {
        this.cpu.memory_map_read8[aligned_addr] = read_func8;
        this.cpu.memory_map_write8[aligned_addr] = write_func8;
        this.cpu.memory_map_read32[aligned_addr] = read_func32;
        this.cpu.memory_map_write32[aligned_addr] = write_func32;

        size -= MMAP_BLOCK_SIZE;
    }
};


IO.prototype.port_write8 = function(port_addr, data)
{
    var entry = this.ports[port_addr];

    if(entry.write8 === this.empty_port_write || LOG_ALL_IO)
    {
        dbg_log(
            "write8 port #" + h(port_addr, 4) + " <- " + h(data, 2) + this.get_port_description(port_addr),
            LOG_IO
        );
    }
    return entry.write8.call(entry.device, data);
};

IO.prototype.port_write16 = function(port_addr, data)
{
    var entry = this.ports[port_addr];

    if(entry.write16 === this.empty_port_write || LOG_ALL_IO)
    {
        dbg_log(
            "write16 port #" + h(port_addr, 4) + " <- " + h(data, 4) + this.get_port_description(port_addr),
            LOG_IO
        );
    }
    return entry.write16.call(entry.device, data);
};

IO.prototype.port_write32 = function(port_addr, data)
{
    var entry = this.ports[port_addr];

    if(entry.write32 === this.empty_port_write || LOG_ALL_IO)
    {
        dbg_log(
            "write32 port #" + h(port_addr, 4) + " <- " + h(data >>> 0, 8) + this.get_port_description(port_addr),
            LOG_IO
        );
    }
    return entry.write32.call(entry.device, data);
};

IO.prototype.port_read8 = function(port_addr)
{
    var entry = this.ports[port_addr];

    if(entry.read8 === this.empty_port_read8 || LOG_ALL_IO)
    {
        dbg_log(
            "read8 port  #" + h(port_addr, 4) + this.get_port_description(port_addr),
            LOG_IO
        );
    }
    var value = entry.read8.call(entry.device, port_addr);
    dbg_assert(typeof value === "number");
    dbg_assert(value < 0x100 && value >= 0, "8 bit port returned large value: " + h(port_addr));
    return value;
};

IO.prototype.port_read16 = function(port_addr)
{
    var entry = this.ports[port_addr];

    if(entry.read16 === this.empty_port_read16 || LOG_ALL_IO)
    {
        dbg_log(
            "read16 port  #" + h(port_addr, 4) + this.get_port_description(port_addr),
            LOG_IO
        );
    }
    var value = entry.read16.call(entry.device, port_addr);
    dbg_assert(typeof value === "number");
    dbg_assert(value < 0x10000 && value >= 0, "16 bit port returned large value: " + h(port_addr));
    return value;
};

IO.prototype.port_read32 = function(port_addr)
{
    var entry = this.ports[port_addr];

    if(entry.read32 === this.empty_port_read32 || LOG_ALL_IO)
    {
        dbg_log(
            "read32 port  #" + h(port_addr, 4) + this.get_port_description(port_addr),
            LOG_IO
        );
    }
    var value = entry.read32.call(entry.device, port_addr);
    dbg_assert((value | 0) === value);
    return value;
};

// via seabios ioport.h
var debug_port_list = {
    0x0004: "PORT_DMA_ADDR_2",
    0x0005: "PORT_DMA_CNT_2",
    0x000a: "PORT_DMA1_MASK_REG",
    0x000b: "PORT_DMA1_MODE_REG",
    0x000c: "PORT_DMA1_CLEAR_FF_REG",
    0x000d: "PORT_DMA1_MASTER_CLEAR",
    0x0020: "PORT_PIC1_CMD",
    0x0021: "PORT_PIC1_DATA",
    0x0040: "PORT_PIT_COUNTER0",
    0x0041: "PORT_PIT_COUNTER1",
    0x0042: "PORT_PIT_COUNTER2",
    0x0043: "PORT_PIT_MODE",
    0x0060: "PORT_PS2_DATA",
    0x0061: "PORT_PS2_CTRLB",
    0x0064: "PORT_PS2_STATUS",
    0x0070: "PORT_CMOS_INDEX",
    0x0071: "PORT_CMOS_DATA",
    0x0080: "PORT_DIAG",
    0x0081: "PORT_DMA_PAGE_2",
    0x0092: "PORT_A20",
    0x00a0: "PORT_PIC2_CMD",
    0x00a1: "PORT_PIC2_DATA",
    0x00b2: "PORT_SMI_CMD",
    0x00b3: "PORT_SMI_STATUS",
    0x00d4: "PORT_DMA2_MASK_REG",
    0x00d6: "PORT_DMA2_MODE_REG",
    0x00da: "PORT_DMA2_MASTER_CLEAR",
    0x00f0: "PORT_MATH_CLEAR",
    0x0170: "PORT_ATA2_CMD_BASE",
    0x01f0: "PORT_ATA1_CMD_BASE",
    0x0278: "PORT_LPT2",
    0x02e8: "PORT_SERIAL4",
    0x02f8: "PORT_SERIAL2",
    0x0374: "PORT_ATA2_CTRL_BASE",
    0x0378: "PORT_LPT1",
    0x03e8: "PORT_SERIAL3",
    //0x03f4: "PORT_ATA1_CTRL_BASE",
    0x03f0: "PORT_FD_BASE",
    0x03f2: "PORT_FD_DOR",
    0x03f4: "PORT_FD_STATUS",
    0x03f5: "PORT_FD_DATA",
    0x03f6: "PORT_HD_DATA",
    0x03f7: "PORT_FD_DIR",
    0x03f8: "PORT_SERIAL1",
    0x0cf8: "PORT_PCI_CMD",
    0x0cf9: "PORT_PCI_REBOOT",
    0x0cfc: "PORT_PCI_DATA",
    0x0402: "PORT_BIOS_DEBUG",
    0x0510: "PORT_QEMU_CFG_CTL",
    0x0511: "PORT_QEMU_CFG_DATA",
    0xb000: "PORT_ACPI_PM_BASE",
    0xb100: "PORT_SMB_BASE",
    0x8900: "PORT_BIOS_APM"
};

IO.prototype.get_port_description = function(addr)
{
    if(debug_port_list[addr])
    {
        return "  (" + debug_port_list[addr] + ")";
    }
    else
    {
        return "";
    }
};


// ---- File: src/bus.js ----


var Bus = {};

/** @constructor */
function BusConnector()
{
    this.listeners = {};
    this.pair = undefined;
}

/**
 * @param {string} name
 * @param {function(?)} fn
 * @param {Object} this_value
 */
BusConnector.prototype.register = function(name, fn, this_value)
{
    var listeners = this.listeners[name];

    if(listeners === undefined)
    {
        listeners = this.listeners[name] = [];
    }

    listeners.push({
        fn: fn,
        this_value: this_value,
    });
};

/**
 * Unregister one message with the given name and callback
 *
 * @param {string} name
 * @param {function(?)} fn
 */
BusConnector.prototype.unregister = function(name, fn)
{
    var listeners = this.listeners[name];

    if(listeners === undefined)
    {
        return;
    }

    this.listeners[name] = listeners.filter(function(l)
    {
        return l.fn !== fn;
    });
};

/**
 * Send ("emit") a message
 *
 * @param {string} name
 * @param {*=} value
 * @param {*=} unused_transfer
 */
BusConnector.prototype.send = function(name, value, unused_transfer)
{
    if(!this.pair)
    {
        return;
    }

    var listeners = this.pair.listeners[name];

    if(listeners === undefined)
    {
        return;
    }

    for(var i = 0; i < listeners.length; i++)
    {
        var listener = listeners[i];
        listener.fn.call(listener.this_value, value);
    }
};

/**
 * Send a message, guaranteeing that it is received asynchronously
 *
 * @param {string} name
 * @param {Object=} value
 */
BusConnector.prototype.send_async = function(name, value)
{
    dbg_assert(arguments.length === 1 || arguments.length === 2);

    setTimeout(this.send.bind(this, name, value), 0);
};

Bus.create = function()
{
    var c0 = new BusConnector();
    var c1 = new BusConnector();

    c0.pair = c1;
    c1.pair = c0;

    return [c0, c1];
};


// ---- File: src/sb16.js ----





// For Types Only






// Useful documentation, articles, and source codes for reference:
// ===============================================================
//
// Official Hardware Programming Guide
// -> https://pdos.csail.mit.edu/6.828/2011/readings/hardware/SoundBlaster.pdf
//
// Official Yamaha YMF262 Manual
// -> http://map.grauw.nl/resources/sound/yamaha_ymf262.pdf
//
// OPL3 Programming Guide
// -> http://www.fit.vutbr.cz/~arnost/opl/opl3.html
//
// DOSBox
// -> https://sourceforge.net/p/dosbox/code-0/HEAD/tree/dosbox/branches/mamesound/src/hardware/sblaster.cpp
// -> https://github.com/duganchen/dosbox/blob/master/src/hardware/sblaster.cpp
// -> https://github.com/joncampbell123/dosbox-x/blob/master/src/hardware/sblaster.cpp
//
// QEMU
// -> https://github.com/qemu/qemu/blob/master/hw/audio/sb16.c
// -> https://github.com/hackndev/qemu/blob/master/hw/sb16.c
//
// VirtualBox
// -> https://www.virtualbox.org/svn/vbox/trunk/src/VBox/Devices/Audio/DevSB16.cpp
// -> https://github.com/mdaniel/virtualbox-org-svn-vbox-trunk/blob/master/src/VBox/Devices/Audio/DevSB16.cpp

const
    // Used for drivers to identify device (DSP command 0xE3).
    DSP_COPYRIGHT = "COPYRIGHT (C) CREATIVE TECHNOLOGY LTD, 1992.",

    // Value of the current DSP command that indicates that the
    // next command/data write in port 2xC should be interpreted
    // as a command number.
    DSP_NO_COMMAND = 0,

    // Size (bytes) of the DSP write/read buffers
    DSP_BUFSIZE = 64,

    // Size (bytes) of the buffers containing floating point linear PCM audio.
    DSP_DACSIZE = 65536,

    // Size (bytes) of the buffer in which DMA transfers are temporarily
    // stored before being processed.
    SB_DMA_BUFSIZE = 65536,

    // Number of samples to attempt to retrieve per transfer.
    SB_DMA_BLOCK_SAMPLES = 1024,

    // Usable DMA channels.
    SB_DMA0 = 0,
    SB_DMA1 = 1,
    SB_DMA3 = 3,
    SB_DMA5 = 5,
    SB_DMA6 = 6,
    SB_DMA7 = 7,

    // Default DMA channels.
    SB_DMA_CHANNEL_8BIT = SB_DMA1,
    SB_DMA_CHANNEL_16BIT = SB_DMA5,

    // Usable IRQ channels.
    SB_IRQ2 = 2,
    SB_IRQ5 = 5,
    SB_IRQ7 = 7,
    SB_IRQ10 = 10,

    // Default IRQ channel.
    SB_IRQ = SB_IRQ5,

    // Indices to the irq_triggered register.
    SB_IRQ_8BIT = 0x1,
    SB_IRQ_16BIT = 0x2,
    SB_IRQ_MIDI = 0x1,
    SB_IRQ_MPU = 0x4;


// Probably less efficient, but it's more maintainable, instead
// of having a single large unorganised and decoupled table.
var DSP_COMMAND_SIZES = new Uint8Array(256);
var DSP_COMMAND_HANDLERS = [];
var MIXER_READ_HANDLERS = [];
var MIXER_WRITE_HANDLERS = [];
var MIXER_REGISTER_IS_LEGACY = new Uint8Array(256);
var FM_HANDLERS = [];


/**
 * Sound Blaster 16 Emulator, or so it seems.
 * @constructor
 * @param {CPU} cpu
 * @param {BusConnector} bus
 */
function SB16(cpu, bus)
{
    /** @const @type {CPU} */
    this.cpu = cpu;

    /** @const @type {BusConnector} */
    this.bus = bus;

    // I/O Buffers.
    this.write_buffer = new ByteQueue(DSP_BUFSIZE);
    this.read_buffer = new ByteQueue(DSP_BUFSIZE);
    this.read_buffer_lastvalue = 0;

    // Current DSP command info.
    this.command = DSP_NO_COMMAND;
    this.command_size = 0;

    // Mixer.
    this.mixer_current_address = 0;
    this.mixer_registers = new Uint8Array(256);
    this.mixer_reset();

    // Dummy status and test registers.
    this.dummy_speaker_enabled = false;
    this.test_register = 0;

    // DSP state.
    this.dsp_highspeed = false;
    this.dsp_stereo = false;
    this.dsp_16bit = false;
    this.dsp_signed = false;

    // DAC buffer.
    // The final destination for audio data before being sent off
    // to Web Audio APIs.
    // Format:
    // Floating precision linear PCM, nominal between -1 and 1.
    this.dac_buffers = [
      new FloatQueue(DSP_DACSIZE),
      new FloatQueue(DSP_DACSIZE),
    ];

    // Direct Memory Access transfer info.
    this.dma = cpu.devices.dma;
    this.dma_sample_count = 0;
    this.dma_bytes_count = 0;
    this.dma_bytes_left = 0;
    this.dma_bytes_block = 0;
    this.dma_irq = 0;
    this.dma_channel = 0;
    this.dma_channel_8bit = SB_DMA_CHANNEL_8BIT;
    this.dma_channel_16bit = SB_DMA_CHANNEL_16BIT;
    this.dma_autoinit = false;
    this.dma_buffer = new ArrayBuffer(SB_DMA_BUFSIZE);
    this.dma_buffer_int8 = new Int8Array(this.dma_buffer);
    this.dma_buffer_uint8 = new Uint8Array(this.dma_buffer);
    this.dma_buffer_int16 = new Int16Array(this.dma_buffer);
    this.dma_buffer_uint16 = new Uint16Array(this.dma_buffer);
    this.dma_syncbuffer = new SyncBuffer(this.dma_buffer);
    this.dma_waiting_transfer = false;
    this.dma_paused = false;
    this.sampling_rate = 22050;
    bus.send("dac-tell-sampling-rate", this.sampling_rate);
    this.bytes_per_sample = 1;

    // DMA identification data.
    this.e2_value = 0xAA;
    this.e2_count = 0;

    // ASP data: not understood by me.
    this.asp_registers = new Uint8Array(256);

    // MPU.
    this.mpu_read_buffer = new ByteQueue(DSP_BUFSIZE);
    this.mpu_read_buffer_lastvalue = 0;

    // FM Synthesizer.
    this.fm_current_address0 = 0;
    this.fm_current_address1 = 0;
    this.fm_waveform_select_enable = false;

    // Interrupts.
    this.irq = SB_IRQ;
    this.irq_triggered = new Uint8Array(0x10);

    // IO Ports.
    // http://homepages.cae.wisc.edu/~brodskye/sb16doc/sb16doc.html#DSPPorts
    // https://pdos.csail.mit.edu/6.828/2011/readings/hardware/SoundBlaster.pdf

    cpu.io.register_read_consecutive(0x220, this,
        this.port2x0_read, this.port2x1_read, this.port2x2_read, this.port2x3_read);
    cpu.io.register_read_consecutive(0x388, this,
        this.port2x0_read, this.port2x1_read);

    cpu.io.register_read_consecutive(0x224, this,
        this.port2x4_read, this.port2x5_read);

    cpu.io.register_read(0x226, this, this.port2x6_read);
    cpu.io.register_read(0x227, this, this.port2x7_read);
    cpu.io.register_read(0x228, this, this.port2x8_read);
    cpu.io.register_read(0x229, this, this.port2x9_read);

    cpu.io.register_read(0x22A, this, this.port2xA_read);
    cpu.io.register_read(0x22B, this, this.port2xB_read);
    cpu.io.register_read(0x22C, this, this.port2xC_read);
    cpu.io.register_read(0x22D, this, this.port2xD_read);

    cpu.io.register_read_consecutive(0x22E, this,
        this.port2xE_read, this.port2xF_read);

    cpu.io.register_write_consecutive(0x220, this,
        this.port2x0_write, this.port2x1_write, this.port2x2_write, this.port2x3_write);
    cpu.io.register_write_consecutive(0x388, this,
        this.port2x0_write, this.port2x1_write);

    cpu.io.register_write_consecutive(0x224, this,
        this.port2x4_write, this.port2x5_write);

    cpu.io.register_write(0x226, this, this.port2x6_write);
    cpu.io.register_write(0x227, this, this.port2x7_write);

    cpu.io.register_write_consecutive(0x228, this,
        this.port2x8_write, this.port2x9_write);

    cpu.io.register_write(0x22A, this, this.port2xA_write);
    cpu.io.register_write(0x22B, this, this.port2xB_write);
    cpu.io.register_write(0x22C, this, this.port2xC_write);
    cpu.io.register_write(0x22D, this, this.port2xD_write);
    cpu.io.register_write(0x22E, this, this.port2xE_write);
    cpu.io.register_write(0x22F, this, this.port2xF_write);

    cpu.io.register_read_consecutive(0x330, this, this.port3x0_read, this.port3x1_read);
    cpu.io.register_write_consecutive(0x330, this, this.port3x0_write, this.port3x1_write);

    this.dma.on_unmask(this.dma_on_unmask, this);

    bus.register("dac-request-data", function()
    {
        this.dac_handle_request();
    }, this);
    bus.register("speaker-has-initialized", function()
    {
        this.mixer_reset();
    }, this);
    bus.send("speaker-confirm-initialized");

    this.dsp_reset();
}

//
// General
//

SB16.prototype.dsp_reset = function()
{
    this.write_buffer.clear();
    this.read_buffer.clear();

    this.command = DSP_NO_COMMAND;
    this.command_size = 0;

    this.dummy_speaker_enabled = false;
    this.test_register = 0;

    this.dsp_highspeed = false;
    this.dsp_stereo = false;
    this.dsp_16bit = false;
    this.dsp_signed = false;

    this.dac_buffers[0].clear();
    this.dac_buffers[1].clear();

    this.dma_sample_count = 0;
    this.dma_bytes_count = 0;
    this.dma_bytes_left = 0;
    this.dma_bytes_block = 0;
    this.dma_irq = 0;
    this.dma_channel = 0;
    this.dma_autoinit = false;
    this.dma_buffer_uint8.fill(0);
    this.dma_waiting_transfer = false;
    this.dma_paused = false;

    this.e2_value = 0xAA;
    this.e2_count = 0;

    this.sampling_rate = 22050;
    this.bytes_per_sample = 1;

    this.lower_irq(SB_IRQ_8BIT);
    this.irq_triggered.fill(0);

    this.asp_registers.fill(0);
    this.asp_registers[5] = 0x01;
    this.asp_registers[9] = 0xF8;
};

SB16.prototype.get_state = function()
{
    var state = [];

    // state[0] = this.write_buffer;
    // state[1] = this.read_buffer;
    state[2] = this.read_buffer_lastvalue;

    state[3] = this.command;
    state[4] = this.command_size;

    state[5] = this.mixer_current_address;
    state[6] = this.mixer_registers;

    state[7] = this.dummy_speaker_enabled;
    state[8] = this.test_register;

    state[9] = this.dsp_highspeed;
    state[10] = this.dsp_stereo;
    state[11] = this.dsp_16bit;
    state[12] = this.dsp_signed;

    // state[13] = this.dac_buffers;
    //state[14]

    state[15] = this.dma_sample_count;
    state[16] = this.dma_bytes_count;
    state[17] = this.dma_bytes_left;
    state[18] = this.dma_bytes_block;
    state[19] = this.dma_irq;
    state[20] = this.dma_channel;
    state[21] = this.dma_channel_8bit;
    state[22] = this.dma_channel_16bit;
    state[23] = this.dma_autoinit;
    state[24] = this.dma_buffer_uint8;
    state[25] = this.dma_waiting_transfer;
    state[26] = this.dma_paused;
    state[27] = this.sampling_rate;
    state[28] = this.bytes_per_sample;

    state[29] = this.e2_value;
    state[30] = this.e2_count;

    state[31] = this.asp_registers;

    // state[32] = this.mpu_read_buffer;
    state[33] = this.mpu_read_buffer_last_value;

    state[34] = this.irq;
    state[35] = this.irq_triggered;
    //state[36]

    return state;
};

SB16.prototype.set_state = function(state)
{
    // this.write_buffer = state[0];
    // this.read_buffer = state[1];
    this.read_buffer_lastvalue = state[2];

    this.command = state[3];
    this.command_size = state[4];

    this.mixer_current_address = state[5];
    this.mixer_registers = state[6];
    this.mixer_full_update();

    this.dummy_speaker_enabled = state[7];
    this.test_register = state[8];

    this.dsp_highspeed = state[9];
    this.dsp_stereo = state[10];
    this.dsp_16bit = state[11];
    this.dsp_signed = state[12];

    // this.dac_buffers = state[13];
    //state[14]

    this.dma_sample_count = state[15];
    this.dma_bytes_count = state[16];
    this.dma_bytes_left = state[17];
    this.dma_bytes_block = state[18];
    this.dma_irq = state[19];
    this.dma_channel = state[20];
    this.dma_channel_8bit = state[21];
    this.dma_channel_16bit = state[22];
    this.dma_autoinit = state[23];
    this.dma_buffer_uint8 = state[24];
    this.dma_waiting_transfer = state[25];
    this.dma_paused = state[26];
    this.sampling_rate = state[27];
    this.bytes_per_sample = state[28];

    this.e2_value = state[29];
    this.e2_count = state[30];

    this.asp_registers = state[31];

    // this.mpu_read_buffer = state[32];
    this.mpu_read_buffer_last_value = state[33];

    this.irq = state[34];
    this.irq_triggered = state[35];
    //state[36];

    this.dma_buffer = this.dma_buffer_uint8.buffer;
    this.dma_buffer_int8 = new Int8Array(this.dma_buffer);
    this.dma_buffer_int16 = new Int16Array(this.dma_buffer);
    this.dma_buffer_uint16 = new Uint16Array(this.dma_buffer);
    this.dma_syncbuffer = new SyncBuffer(this.dma_buffer);

    if(this.dma_paused)
    {
        this.bus.send("dac-disable");
    }
    else
    {
        this.bus.send("dac-enable");
    }
};

//
// I/O handlers
//

SB16.prototype.port2x0_read = function()
{
    dbg_log("220 read: fm music status port (unimplemented)", LOG_SB16);
    return 0xFF;
};

SB16.prototype.port2x1_read = function()
{
    dbg_log("221 read: fm music data port (write only)", LOG_SB16);
    return 0xFF;
};

SB16.prototype.port2x2_read = function()
{
    dbg_log("222 read: advanced fm music status port (unimplemented)", LOG_SB16);
    return 0xFF;
};

SB16.prototype.port2x3_read = function()
{
    dbg_log("223 read: advanced music data port (write only)", LOG_SB16);
    return 0xFF;
};

// Mixer Address Port.
SB16.prototype.port2x4_read = function()
{
    dbg_log("224 read: mixer address port", LOG_SB16);
    return this.mixer_current_address;
};

// Mixer Data Port.
SB16.prototype.port2x5_read = function()
{
    dbg_log("225 read: mixer data port", LOG_SB16);
    return this.mixer_read(this.mixer_current_address);
};

SB16.prototype.port2x6_read = function()
{
    dbg_log("226 read: (write only)", LOG_SB16);
    return 0xFF;
};

SB16.prototype.port2x7_read = function()
{
    dbg_log("227 read: undocumented", LOG_SB16);
    return 0xFF;
};

SB16.prototype.port2x8_read = function()
{
    dbg_log("228 read: fm music status port (unimplemented)", LOG_SB16);
    return 0xFF;
};

SB16.prototype.port2x9_read = function()
{
    dbg_log("229 read: fm music data port (write only)", LOG_SB16);
    return 0xFF;
};

// Read Data.
// Used to access in-bound DSP data.
SB16.prototype.port2xA_read = function()
{
    dbg_log("22A read: read data", LOG_SB16);
    if(this.read_buffer.length)
    {
        this.read_buffer_lastvalue = this.read_buffer.shift();
    }
    dbg_log(" <- " + this.read_buffer_lastvalue + " " + h(this.read_buffer_lastvalue) + " '" + String.fromCharCode(this.read_buffer_lastvalue) + "'", LOG_SB16);
    return this.read_buffer_lastvalue;
};

SB16.prototype.port2xB_read = function()
{
    dbg_log("22B read: undocumented", LOG_SB16);
    return 0xFF;
};

// Write-Buffer Status.
// Indicates whether the DSP is ready to accept commands or data.
SB16.prototype.port2xC_read = function()
{
    dbg_log("22C read: write-buffer status", LOG_SB16);
    // Always return ready (bit-7 set to low)
    return 0x7F;
};

SB16.prototype.port2xD_read = function()
{
    dbg_log("22D read: undocumented", LOG_SB16);
    return 0xFF;
};

// Read-Buffer Status.
// Indicates whether there is any in-bound data available for reading.
// Also used to acknowledge DSP 8-bit interrupt.
SB16.prototype.port2xE_read = function()
{
    dbg_log("22E read: read-buffer status / irq 8bit ack.", LOG_SB16);
    if(this.irq_triggered[SB_IRQ_8BIT])
    {
        this.lower_irq(SB_IRQ_8BIT);
    }
    var ready = this.read_buffer.length && !this.dsp_highspeed;
    return (ready << 7) | 0x7F;
};

// DSP 16-bit interrupt acknowledgement.
SB16.prototype.port2xF_read = function()
{
    dbg_log("22F read: irq 16bit ack", LOG_SB16);
    this.lower_irq(SB_IRQ_16BIT);
    return 0;
};


// FM Address Port - primary register.
SB16.prototype.port2x0_write = function(value)
{
    dbg_log("220 write: (unimplemented) fm register 0 address = " + h(value), LOG_SB16);
    this.fm_current_address0 = 0;
};

// FM Data Port - primary register.
SB16.prototype.port2x1_write = function(value)
{
    dbg_log("221 write: (unimplemented) fm register 0 data = " + h(value), LOG_SB16);
    var handler = FM_HANDLERS[this.fm_current_address0];
    if(!handler)
    {
        handler = this.fm_default_write;
    }
    handler.call(this, value, 0, this.fm_current_address0);
};

// FM Address Port - secondary register.
SB16.prototype.port2x2_write = function(value)
{
    dbg_log("222 write: (unimplemented) fm register 1 address = " + h(value), LOG_SB16);
    this.fm_current_address1 = 0;
};

// FM Data Port - secondary register.
SB16.prototype.port2x3_write = function(value)
{
    dbg_log("223 write: (unimplemented) fm register 1 data =" + h(value), LOG_SB16);
    var handler = FM_HANDLERS[this.fm_current_address1];
    if(!handler)
    {
        handler = this.fm_default_write;
    }
    handler.call(this, value, 1, this.fm_current_address1);
};

// Mixer Address Port.
SB16.prototype.port2x4_write = function(value)
{
    dbg_log("224 write: mixer address = " + h(value), LOG_SB16);
    this.mixer_current_address = value;
};

// Mixer Data Port.
SB16.prototype.port2x5_write = function(value)
{
    dbg_log("225 write: mixer data = " + h(value), LOG_SB16);
    this.mixer_write(this.mixer_current_address, value);
};

// Reset.
// Used to reset the DSP to its default state and to exit highspeed mode.
SB16.prototype.port2x6_write = function(yesplease)
{
    dbg_log("226 write: reset = " + h(yesplease), LOG_SB16);

    if(this.dsp_highspeed)
    {
        dbg_log(" -> exit highspeed", LOG_SB16);
        this.dsp_highspeed = false;
    }
    else if(yesplease)
    {
        dbg_log(" -> reset", LOG_SB16);
        this.dsp_reset();
    }

    // Signal completion.
    this.read_buffer.clear();
    this.read_buffer.push(0xAA);
};

SB16.prototype.port2x7_write = function(value)
{
    dbg_log("227 write: undocumented", LOG_SB16);
};

SB16.prototype.port2x8_write = function(value)
{
    dbg_log("228 write: fm music register port (unimplemented)", LOG_SB16);
};

SB16.prototype.port2x9_write = function(value)
{
    dbg_log("229 write: fm music data port (unimplemented)", LOG_SB16);
};

SB16.prototype.port2xA_write = function(value)
{
    dbg_log("22A write: dsp read data port (read only)", LOG_SB16);
};

SB16.prototype.port2xB_write = function(value)
{
    dbg_log("22B write: undocumented", LOG_SB16);
};

// Write Command/Data.
// Used to send commands or data to the DSP.
SB16.prototype.port2xC_write = function(value)
{
    dbg_log("22C write: write command/data", LOG_SB16);

    if(this.command === DSP_NO_COMMAND)
    {
        // New command.
        dbg_log("22C write: command = " + h(value), LOG_SB16);
        this.command = value;
        this.write_buffer.clear();
        this.command_size = DSP_COMMAND_SIZES[value];
    }
    else
    {
        // More data for current command.
        dbg_log("22C write: data: " + h(value), LOG_SB16);
        this.write_buffer.push(value);
    }

    // Perform command when we have all the needed data.
    if(this.write_buffer.length >= this.command_size)
    {
        this.command_do();
    }
};

SB16.prototype.port2xD_write = function(value)
{
    dbg_log("22D write: undocumented", LOG_SB16);
};

SB16.prototype.port2xE_write = function(value)
{
    dbg_log("22E write: dsp read buffer status (read only)", LOG_SB16);
};

SB16.prototype.port2xF_write = function(value)
{
    dbg_log("22F write: undocumented", LOG_SB16);
};


// MPU UART Mode - Data Port
SB16.prototype.port3x0_read = function()
{
    dbg_log("330 read: mpu data", LOG_SB16);

    if(this.mpu_read_buffer.length)
    {
        this.mpu_read_buffer_lastvalue = this.mpu_read_buffer.shift();
    }
    dbg_log(" <- " + h(this.mpu_read_buffer_lastvalue), LOG_SB16);

    return this.mpu_read_buffer_lastvalue;
};
SB16.prototype.port3x0_write = function(value)
{
    dbg_log("330 write: mpu data (unimplemented) : " + h(value), LOG_SB16);
};

// MPU UART Mode - Status Port
SB16.prototype.port3x1_read = function()
{
    dbg_log("331 read: mpu status", LOG_SB16);

    var status = 0;
    status |= 0x40 * 0; // Output Ready
    status |= 0x80 * !this.mpu_read_buffer.length; // Input Ready

    return status;
};

// MPU UART Mode - Command Port
SB16.prototype.port3x1_write = function(value)
{
    dbg_log("331 write: mpu command: " + h(value), LOG_SB16);
    if(value === 0xFF)
    {
        // Command acknowledge.
        this.mpu_read_buffer.clear();
        this.mpu_read_buffer.push(0xFE);
    }
};

//
// DSP command handlers
//

SB16.prototype.command_do = function()
{
    var handler = DSP_COMMAND_HANDLERS[this.command];
    if(!handler)
    {
        handler = this.dsp_default_handler;
    }
    handler.call(this);

    // Reset Inputs.
    this.command = DSP_NO_COMMAND;
    this.command_size = 0;
    this.write_buffer.clear();
};

SB16.prototype.dsp_default_handler = function()
{
    dbg_log("Unhandled command: " + h(this.command), LOG_SB16);
};

/**
 * @param {Array} commands
 * @param {number} size
 * @param {function()=} handler
 */
function register_dsp_command(commands, size, handler)
{
    if(!handler)
    {
        handler = SB16.prototype.dsp_default_handler;
    }
    for(var i = 0; i < commands.length; i++)
    {
        DSP_COMMAND_SIZES[commands[i]] = size;
        DSP_COMMAND_HANDLERS[commands[i]] = handler;
    }
}

function any_first_digit(base)
{
    var commands = [];
    for(var i = 0; i < 16; i++)
    {
        commands.push(base + i);
    }
    return commands;
}

// ASP set register
register_dsp_command([0x0E], 2, function()
{
    this.asp_registers[this.write_buffer.shift()] = this.write_buffer.shift();
});

// ASP get register
register_dsp_command([0x0F], 1, function()
{
    this.read_buffer.clear();
    this.read_buffer.push(this.asp_registers[this.write_buffer.shift()]);
});

// 8-bit direct mode single byte digitized sound output.
register_dsp_command([0x10], 1, function()
{
    var value = audio_normalize(this.write_buffer.shift(), 127.5, -1);

    this.dac_buffers[0].push(value);
    this.dac_buffers[1].push(value);
    this.bus.send("dac-enable");
});

// 8-bit single-cycle DMA mode digitized sound output.
register_dsp_command([0x14, 0x15], 2, function()
{
    this.dma_irq = SB_IRQ_8BIT;
    this.dma_channel = this.dma_channel_8bit;
    this.dma_autoinit = false;
    this.dsp_signed = false;
    this.dsp_16bit = false;
    this.dsp_highspeed = false;
    this.dma_transfer_size_set();
    this.dma_transfer_start();
});

// Creative 8-bit to 2-bit ADPCM single-cycle DMA mode digitized sound output.
register_dsp_command([0x16], 2);

// Creative 8-bit to 2-bit ADPCM single-cycle DMA mode digitzed sound output
// with reference byte.
register_dsp_command([0x17], 2);

// 8-bit auto-init DMA mode digitized sound output.
register_dsp_command([0x1C], 0, function()
{
    this.dma_irq = SB_IRQ_8BIT;
    this.dma_channel = this.dma_channel_8bit;
    this.dma_autoinit = true;
    this.dsp_signed = false;
    this.dsp_16bit = false;
    this.dsp_highspeed = false;
    this.dma_transfer_start();
});

// Creative 8-bit to 2-bit ADPCM auto-init DMA mode digitized sound output
// with reference byte.
register_dsp_command([0x1F], 0);

// 8-bit direct mode single byte digitized sound input.
register_dsp_command([0x20], 0, function()
{
    // Fake silent input.
    this.read_buffer.clear();
    this.read_buffer.push(0x7f);
});

// 8-bit single-cycle DMA mode digitized sound input.
register_dsp_command([0x24], 2);

// 8-bit auto-init DMA mode digitized sound input.
register_dsp_command([0x2C], 0);

// Polling mode MIDI input.
register_dsp_command([0x30], 0);

// Interrupt mode MIDI input.
register_dsp_command([0x31], 0);

// UART polling mode MIDI I/O.
register_dsp_command([0x34], 0);

// UART interrupt mode MIDI I/O.
register_dsp_command([0x35], 0);

// UART polling mode MIDI I/O with time stamping.
register_dsp_command([0x36], 0);

// UART interrupt mode MIDI I/O with time stamping.
register_dsp_command([0x37], 0);

// MIDI output.
register_dsp_command([0x38], 0);

// Set digitized sound transfer Time Constant.
register_dsp_command([0x40], 1, function()
{
    // Note: bTimeConstant = 256 * time constant
    this.sampling_rate_change(
        1000000 / (256 - this.write_buffer.shift()) / this.get_channel_count()
    );
});

// Set digitized sound output sampling rate.
// Set digitized sound input sampling rate.
register_dsp_command([0x41, 0x42], 2, function()
{
    this.sampling_rate_change((this.write_buffer.shift() << 8) | this.write_buffer.shift());
});

// Set DSP block transfer size.
register_dsp_command([0x48], 2, function()
{
    // TODO: should be in bytes, but if this is only used
    // for 8 bit transfers, then this number is the same
    // as number of samples?
    // Wrong: e.g. stereo requires two bytes per sample.
    this.dma_transfer_size_set();
});

// Creative 8-bit to 4-bit ADPCM single-cycle DMA mode digitized sound output.
register_dsp_command([0x74], 2);

// Creative 8-bit to 4-bit ADPCM single-cycle DMA mode digitized sound output
// with referene byte.
register_dsp_command([0x75], 2);

// Creative 8-bit to 3-bit ADPCM single-cycle DMA mode digitized sound output.
register_dsp_command([0x76], 2);

// Creative 8-bit to 3-bit ADPCM single-cycle DMA mode digitized sound output
// with referene byte.
register_dsp_command([0x77], 2);

// Creative 8-bit to 4-bit ADPCM auto-init DMA mode digitized sound output
// with reference byte.
register_dsp_command([0x7D], 0);

// Creative 8-bit to 3-bit ADPCM auto-init DMA mode digitized sound output
// with reference byte.
register_dsp_command([0x7F], 0);

// Pause DAC for a duration.
register_dsp_command([0x80], 2);

// 8-bit high-speed auto-init DMA mode digitized sound output.
register_dsp_command([0x90], 0, function()
{
    this.dma_irq = SB_IRQ_8BIT;
    this.dma_channel = this.dma_channel_8bit;
    this.dma_autoinit = true;
    this.dsp_signed = false;
    this.dsp_highspeed = true;
    this.dsp_16bit = false;
    this.dma_transfer_start();
});

// 8-bit high-speed single-cycle DMA mode digitized sound input.
register_dsp_command([0x91], 0);

// 8-bit high-speed auto-init DMA mode digitized sound input.
register_dsp_command([0x98], 0);

// 8-bit high-speed single-cycle DMA mode digitized sound input.
register_dsp_command([0x99], 0);

// Set input mode to mono.
register_dsp_command([0xA0], 0);

// Set input mode to stereo.
register_dsp_command([0xA8], 0);

// Program 16-bit DMA mode digitized sound I/O.
register_dsp_command(any_first_digit(0xB0), 3, function()
{
    if(this.command & (1 << 3))
    {
        // Analogue to digital not implemented.
        this.dsp_default_handler();
        return;
    }
    var mode = this.write_buffer.shift();
    this.dma_irq = SB_IRQ_16BIT;
    this.dma_channel = this.dma_channel_16bit;
    this.dma_autoinit = !!(this.command & (1 << 2));
    this.dsp_signed = !!(mode & (1 << 4));
    this.dsp_stereo = !!(mode & (1 << 5));
    this.dsp_16bit = true;
    this.dma_transfer_size_set();
    this.dma_transfer_start();
});

// Program 8-bit DMA mode digitized sound I/O.
register_dsp_command(any_first_digit(0xC0), 3, function()
{
    if(this.command & (1 << 3))
    {
        // Analogue to digital not implemented.
        this.dsp_default_handler();
        return;
    }
    var mode = this.write_buffer.shift();
    this.dma_irq = SB_IRQ_8BIT;
    this.dma_channel = this.dma_channel_8bit;
    this.dma_autoinit = !!(this.command & (1 << 2));
    this.dsp_signed = !!(mode & (1 << 4));
    this.dsp_stereo = !!(mode & (1 << 5));
    this.dsp_16bit = false;
    this.dma_transfer_size_set();
    this.dma_transfer_start();
});

// Pause 8-bit DMA mode digitized sound I/O.
register_dsp_command([0xD0], 0, function()
{
    this.dma_paused = true;
    this.bus.send("dac-disable");
});

// Turn on speaker.
// Documented to have no effect on SB16.
register_dsp_command([0xD1], 0, function()
{
    this.dummy_speaker_enabled = true;
});

// Turn off speaker.
// Documented to have no effect on SB16.
register_dsp_command([0xD3], 0, function()
{
    this.dummy_speaker_enabled = false;
});

// Continue 8-bit DMA mode digitized sound I/O.
register_dsp_command([0xD4], 0, function()
{
    this.dma_paused = false;
    this.bus.send("dac-enable");
});

// Pause 16-bit DMA mode digitized sound I/O.
register_dsp_command([0xD5], 0, function()
{
    this.dma_paused = true;
    this.bus.send("dac-disable");
});

// Continue 16-bit DMA mode digitized sound I/O.
register_dsp_command([0xD6], 0, function()
{
    this.dma_paused = false;
    this.bus.send("dac-enable");
});

// Get speaker status.
register_dsp_command([0xD8], 0, function()
{
    this.read_buffer.clear();
    this.read_buffer.push(this.dummy_speaker_enabled * 0xFF);
});

// Exit 16-bit auto-init DMA mode digitized sound I/O.
// Exit 8-bit auto-init mode digitized sound I/O.
register_dsp_command([0xD9, 0xDA], 0, function()
{
    this.dma_autoinit = false;
});

// DSP identification
register_dsp_command([0xE0], 1, function()
{
    this.read_buffer.clear();
    this.read_buffer.push(~this.write_buffer.shift());
});

// Get DSP version number.
register_dsp_command([0xE1], 0, function()
{
    this.read_buffer.clear();
    this.read_buffer.push(4);
    this.read_buffer.push(5);
});

// DMA identification.
register_dsp_command([0xE2], 1);

// Get DSP copyright.
register_dsp_command([0xE3], 0, function()
{
    this.read_buffer.clear();
    for(var i = 0; i < DSP_COPYRIGHT.length; i++)
    {
        this.read_buffer.push(DSP_COPYRIGHT.charCodeAt(i));
    }
    // Null terminator.
    this.read_buffer.push(0);
});

// Write test register.
register_dsp_command([0xE4], 1, function()
{
    this.test_register = this.write_buffer.shift();
});

// Read test register.
register_dsp_command([0xE8], 0, function()
{
    this.read_buffer.clear();
    this.read_buffer.push(this.test_register);
});

// Trigger IRQ
register_dsp_command([0xF2, 0xF3], 0, function()
{
    this.raise_irq();
});

// ASP - unknown function
var SB_F9 = new Uint8Array(256);
SB_F9[0x0E] = 0xFF;
SB_F9[0x0F] = 0x07;
SB_F9[0x37] = 0x38;
register_dsp_command([0xF9], 1, function()
{
    var input = this.write_buffer.shift();
    dbg_log("dsp 0xf9: unknown function. input: " + input, LOG_SB16);

    this.read_buffer.clear();
    this.read_buffer.push(SB_F9[input]);
});

//
// Mixer Handlers (CT1745)
//

SB16.prototype.mixer_read = function(address)
{
    var handler = MIXER_READ_HANDLERS[address];
    var data;
    if(handler)
    {
        data = handler.call(this);
    }
    else
    {
        data = this.mixer_registers[address];
        dbg_log("unhandled mixer register read. addr:" + h(address) + " data:" + h(data), LOG_SB16);
    }
    return data;
};

SB16.prototype.mixer_write = function(address, data)
{
    var handler = MIXER_WRITE_HANDLERS[address];
    if(handler)
    {
        handler.call(this, data);
    }
    else
    {
        dbg_log("unhandled mixer register write. addr:" + h(address) + " data:" + h(data), LOG_SB16);
    }
};

SB16.prototype.mixer_default_read = function()
{
    dbg_log("mixer register read. addr:" + h(this.mixer_current_address), LOG_SB16);
    return this.mixer_registers[this.mixer_current_address];
};

SB16.prototype.mixer_default_write = function(data)
{
    dbg_log("mixer register write. addr:" + h(this.mixer_current_address) + " data:" + h(data), LOG_SB16);
    this.mixer_registers[this.mixer_current_address] = data;
};

SB16.prototype.mixer_reset = function()
{
    // Values intentionally in decimal.
    // Default values available at
    // https://pdos.csail.mit.edu/6.828/2011/readings/hardware/SoundBlaster.pdf
    this.mixer_registers[0x04] = 12 << 4 | 12;
    this.mixer_registers[0x22] = 12 << 4 | 12;
    this.mixer_registers[0x26] = 12 << 4 | 12;
    this.mixer_registers[0x28] = 0;
    this.mixer_registers[0x2E] = 0;
    this.mixer_registers[0x0A] = 0;
    this.mixer_registers[0x30] = 24 << 3;
    this.mixer_registers[0x31] = 24 << 3;
    this.mixer_registers[0x32] = 24 << 3;
    this.mixer_registers[0x33] = 24 << 3;
    this.mixer_registers[0x34] = 24 << 3;
    this.mixer_registers[0x35] = 24 << 3;
    this.mixer_registers[0x36] = 0;
    this.mixer_registers[0x37] = 0;
    this.mixer_registers[0x38] = 0;
    this.mixer_registers[0x39] = 0;
    this.mixer_registers[0x3B] = 0;
    this.mixer_registers[0x3C] = 0x1F;
    this.mixer_registers[0x3D] = 0x15;
    this.mixer_registers[0x3E] = 0x0B;
    this.mixer_registers[0x3F] = 0;
    this.mixer_registers[0x40] = 0;
    this.mixer_registers[0x41] = 0;
    this.mixer_registers[0x42] = 0;
    this.mixer_registers[0x43] = 0;
    this.mixer_registers[0x44] = 8 << 4;
    this.mixer_registers[0x45] = 8 << 4;
    this.mixer_registers[0x46] = 8 << 4;
    this.mixer_registers[0x47] = 8 << 4;

    this.mixer_full_update();
};

SB16.prototype.mixer_full_update = function()
{
    // Start at 1. Don't re-reset.
    for(var i = 1; i < this.mixer_registers.length; i++)
    {
        if(MIXER_REGISTER_IS_LEGACY[i])
        {
            // Legacy registers are actually mapped to other register locations. Update
            // using the new registers rather than the legacy registers.
            continue;
        }
        this.mixer_write(i, this.mixer_registers[i]);
    }
};

/**
 * @param{number} address
 * @param{function():number=} handler
 */
function register_mixer_read(address, handler)
{
    if(!handler)
    {
        handler = SB16.prototype.mixer_default_read;
    }
    MIXER_READ_HANDLERS[address] = handler;
}

/**
 * @param{number} address
 * @param{function(number)=} handler
 */
function register_mixer_write(address, handler)
{
    if(!handler)
    {
        handler = SB16.prototype.mixer_default_write;
    }
    MIXER_WRITE_HANDLERS[address] = handler;
}

// Legacy registers map each nibble to the last 4 bits of the new registers
function register_mixer_legacy(address_old, address_new_left, address_new_right)
{
    MIXER_REGISTER_IS_LEGACY[address_old] = 1;

    /** @this {SB16} */
    MIXER_READ_HANDLERS[address_old] = function()
    {
        var left = this.mixer_registers[address_new_left] & 0xF0;
        var right = this.mixer_registers[address_new_right] >>> 4;
        return left | right;
    };

    /** @this {SB16} */
    MIXER_WRITE_HANDLERS[address_old] = function(data)
    {
        this.mixer_registers[address_old] = data;
        var prev_left = this.mixer_registers[address_new_left];
        var prev_right = this.mixer_registers[address_new_right];
        var left = (data & 0xF0) | (prev_left & 0x0F);
        var right = (data << 4 & 0xF0) | (prev_right & 0x0F);

        this.mixer_write(address_new_left, left);
        this.mixer_write(address_new_right, right);
    };
}

/**
 * @param {number} address
 * @param {number} mixer_source
 * @param {number} channel
 */
function register_mixer_volume(address, mixer_source, channel)
{
    MIXER_READ_HANDLERS[address] = SB16.prototype.mixer_default_read;

    /** @this {SB16} */
    MIXER_WRITE_HANDLERS[address] = function(data)
    {
        this.mixer_registers[address] = data;
        this.bus.send("mixer-volume",
        [
            mixer_source,
            channel,
            (data >>> 2) - 62
        ]);
    };
}

// Reset.
register_mixer_read(0x00, function()
{
    this.mixer_reset();
    return 0;
});
register_mixer_write(0x00);

// Legacy Voice Volume Left/Right.
register_mixer_legacy(0x04, 0x32, 0x33);

// Legacy Mic Volume. TODO.
//register_mixer_read(0x0A);
//register_mixer_write(0x0A, function(data)
//{
//    this.mixer_registers[0x0A] = data;
//    var prev = this.mixer_registers[0x3A];
//    this.mixer_write(0x3A, data << 5 | (prev & 0x0F));
//});

// Legacy Master Volume Left/Right.
register_mixer_legacy(0x22, 0x30, 0x31);
// Legacy Midi Volume Left/Right.
register_mixer_legacy(0x26, 0x34, 0x35);
// Legacy CD Volume Left/Right.
register_mixer_legacy(0x28, 0x36, 0x37);
// Legacy Line Volume Left/Right.
register_mixer_legacy(0x2E, 0x38, 0x39);

// Master Volume Left.
register_mixer_volume(0x30, MIXER_SRC_MASTER, MIXER_CHANNEL_LEFT);
// Master Volume Right.
register_mixer_volume(0x31, MIXER_SRC_MASTER, MIXER_CHANNEL_RIGHT);
// Voice Volume Left.
register_mixer_volume(0x32, MIXER_SRC_DAC, MIXER_CHANNEL_LEFT);
// Voice Volume Right.
register_mixer_volume(0x33, MIXER_SRC_DAC, MIXER_CHANNEL_RIGHT);
// MIDI Volume Left. TODO.
//register_mixer_volume(0x34, MIXER_SRC_SYNTH, MIXER_CHANNEL_LEFT);
// MIDI Volume Right. TODO.
//register_mixer_volume(0x35, MIXER_SRC_SYNTH, MIXER_CHANNEL_RIGHT);
// CD Volume Left. TODO.
//register_mixer_volume(0x36, MIXER_SRC_CD, MIXER_CHANNEL_LEFT);
// CD Volume Right. TODO.
//register_mixer_volume(0x37, MIXER_SRC_CD, MIXER_CHANNEL_RIGHT);
// Line Volume Left. TODO.
//register_mixer_volume(0x38, MIXER_SRC_LINE, MIXER_CHANNEL_LEFT);
// Line Volume Right. TODO.
//register_mixer_volume(0x39, MIXER_SRC_LINE, MIXER_CHANNEL_RIGHT);
// Mic Volume. TODO.
//register_mixer_volume(0x3A, MIXER_SRC_MIC, MIXER_CHANNEL_BOTH);

// PC Speaker Volume.
register_mixer_read(0x3B);
register_mixer_write(0x3B, function(data)
{
    this.mixer_registers[0x3B] = data;
    this.bus.send("mixer-volume", [MIXER_SRC_PCSPEAKER, MIXER_CHANNEL_BOTH, (data >>> 6) * 6 - 18]);
});

// Output Mixer Switches. TODO.
//register_mixer_read(0x3C);
//register_mixer_write(0x3C, function(data)
//{
//    this.mixer_registers[0x3C] = data;
//
//    if(data & 0x01) this.bus.send("mixer-connect", [MIXER_SRC_MIC, MIXER_CHANNEL_BOTH]);
//    else this.bus.send("mixer-disconnect", [MIXER_SRC_MIC, MIXER_CHANNEL_BOTH]);
//
//    if(data & 0x02) this.bus.send("mixer-connect", [MIXER_SRC_CD, MIXER_CHANNEL_RIGHT]);
//    else this.bus.send("mixer-disconnect", [MIXER_SRC_CD, MIXER_CHANNEL_RIGHT]);
//
//    if(data & 0x04) this.bus.send("mixer-connect", [MIXER_SRC_CD, MIXER_CHANNEL_LEFT]);
//    else this.bus.send("mixer-disconnect", [MIXER_SRC_CD, MIXER_CHANNEL_LEFT]);
//
//    if(data & 0x08) this.bus.send("mixer-connect", [MIXER_SRC_LINE, MIXER_CHANNEL_RIGHT]);
//    else this.bus.send("mixer-disconnect", [MIXER_SRC_LINE, MIXER_CHANNEL_RIGHT]);
//
//    if(data & 0x10) this.bus.send("mixer-connect", [MIXER_SRC_LINE, MIXER_CHANNEL_LEFT]);
//    else this.bus.send("mixer-disconnect", [MIXER_SRC_LINE, MIXER_CHANNEL_LEFT]);
//});

// Input Mixer Left Switches. TODO.
//register_mixer_read(0x3D);
//register_mixer_write(0x3D);

// Input Mixer Right Switches. TODO.
//register_mixer_read(0x3E);
//register_mixer_write(0x3E);

// Input Gain Left. TODO.
//register_mixer_read(0x3F);
//register_mixer_write(0x3F);

// Input Gain Right. TODO.
//register_mixer_read(0x40);
//register_mixer_write(0x40);

// Output Gain Left.
register_mixer_read(0x41);
register_mixer_write(0x41, function(data)
{
    this.mixer_registers[0x41] = data;
    this.bus.send("mixer-gain-left", (data >>> 6) * 6);
});

// Output Gain Right.
register_mixer_read(0x42);
register_mixer_write(0x42, function(data)
{
    this.mixer_registers[0x42] = data;
    this.bus.send("mixer-gain-right", (data >>> 6) * 6);
});

// Mic AGC. TODO.
//register_mixer_read(0x43);
//register_mixer_write(0x43);

// Treble Left.
register_mixer_read(0x44);
register_mixer_write(0x44, function(data)
{
    this.mixer_registers[0x44] = data;
    data >>>= 3;
    this.bus.send("mixer-treble-left", data - (data < 16 ? 14 : 16));
});

// Treble Right.
register_mixer_read(0x45);
register_mixer_write(0x45, function(data)
{
    this.mixer_registers[0x45] = data;
    data >>>= 3;
    this.bus.send("mixer-treble-right", data - (data < 16 ? 14 : 16));
});

// Bass Left.
register_mixer_read(0x46);
register_mixer_write(0x46, function(data)
{
    this.mixer_registers[0x46] = data;
    data >>>= 3;
    this.bus.send("mixer-bass-right", data - (data < 16 ? 14 : 16));
});

// Bass Right.
register_mixer_read(0x47);
register_mixer_write(0x47, function(data)
{
    this.mixer_registers[0x47] = data;
    data >>>= 3;
    this.bus.send("mixer-bass-right", data - (data < 16 ? 14 : 16));
});

// IRQ Select.
register_mixer_read(0x80, function()
{
    switch(this.irq)
    {
        case SB_IRQ2: return 0x1;
        case SB_IRQ5: return 0x2;
        case SB_IRQ7: return 0x4;
        case SB_IRQ10: return 0x8;
        default: return 0x0;
    }
});
register_mixer_write(0x80, function(bits)
{
    if(bits & 0x1) this.irq = SB_IRQ2;
    if(bits & 0x2) this.irq = SB_IRQ5;
    if(bits & 0x4) this.irq = SB_IRQ7;
    if(bits & 0x8) this.irq = SB_IRQ10;
});

// DMA Select.
register_mixer_read(0x81, function()
{
    var ret = 0;
    switch(this.dma_channel_8bit)
    {
        case SB_DMA0: ret |= 0x1; break;
        case SB_DMA1: ret |= 0x2; break;
        // Channel 2 is hardwired to floppy disk.
        case SB_DMA3: ret |= 0x8; break;
    }
    switch(this.dma_channel_16bit)
    {
        // Channel 4 cannot be used.
        case SB_DMA5: ret |= 0x20; break;
        case SB_DMA6: ret |= 0x40; break;
        case SB_DMA7: ret |= 0x80; break;
    }
    return ret;
});
register_mixer_write(0x81, function(bits)
{
    if(bits & 0x1) this.dma_channel_8bit = SB_DMA0;
    if(bits & 0x2) this.dma_channel_8bit = SB_DMA1;
    if(bits & 0x8) this.dma_channel_8bit = SB_DMA3;
    if(bits & 0x20) this.dma_channel_16bit = SB_DMA5;
    if(bits & 0x40) this.dma_channel_16bit = SB_DMA6;
    if(bits & 0x80) this.dma_channel_16bit = SB_DMA7;
});

// IRQ Status.
register_mixer_read(0x82, function()
{
    var ret = 0x20;
    for(var i = 0; i < 16; i++)
    {
        ret |= i * this.irq_triggered[i];
    }
    return ret;
});

//
// FM Handlers
//

SB16.prototype.fm_default_write = function(data, register, address)
{
    dbg_log("unhandled fm register write. addr:" + register + "|" + h(address) + " data:" + h(data), LOG_SB16);
    // No need to save into a dummy register as the registers are write-only.
};

/**
 * @param{Array} addresses
 * @param{function(number, number, number)=} handler
 */
function register_fm_write(addresses, handler)
{
    if(!handler)
    {
        handler = SB16.prototype.fm_default_write;
    }
    for(var i = 0; i < addresses.length; i++)
    {
        FM_HANDLERS[addresses[i]] = handler;
    }
}

function between(start, end)
{
    var a = [];
    for(var i = start; i <= end; i++)
    {
        a.push(i);
    }
    return a;
}

const SB_FM_OPERATORS_BY_OFFSET = new Uint8Array(32);
SB_FM_OPERATORS_BY_OFFSET[0x00] = 0;
SB_FM_OPERATORS_BY_OFFSET[0x01] = 1;
SB_FM_OPERATORS_BY_OFFSET[0x02] = 2;
SB_FM_OPERATORS_BY_OFFSET[0x03] = 3;
SB_FM_OPERATORS_BY_OFFSET[0x04] = 4;
SB_FM_OPERATORS_BY_OFFSET[0x05] = 5;
SB_FM_OPERATORS_BY_OFFSET[0x08] = 6;
SB_FM_OPERATORS_BY_OFFSET[0x09] = 7;
SB_FM_OPERATORS_BY_OFFSET[0x0A] = 8;
SB_FM_OPERATORS_BY_OFFSET[0x0B] = 9;
SB_FM_OPERATORS_BY_OFFSET[0x0C] = 10;
SB_FM_OPERATORS_BY_OFFSET[0x0D] = 11;
SB_FM_OPERATORS_BY_OFFSET[0x10] = 12;
SB_FM_OPERATORS_BY_OFFSET[0x11] = 13;
SB_FM_OPERATORS_BY_OFFSET[0x12] = 14;
SB_FM_OPERATORS_BY_OFFSET[0x13] = 15;
SB_FM_OPERATORS_BY_OFFSET[0x14] = 16;
SB_FM_OPERATORS_BY_OFFSET[0x15] = 17;

function get_fm_operator(register, offset)
{
    return register * 18 + SB_FM_OPERATORS_BY_OFFSET[offset];
}

register_fm_write([0x01], function(bits, register, address)
{
    this.fm_waveform_select_enable[register] = bits & 0x20 > 0;
    this.fm_update_waveforms();
});

// Timer 1 Count.
register_fm_write([0x02]);

// Timer 2 Count.
register_fm_write([0x03]);

register_fm_write([0x04], function(bits, register, address)
{
    switch(register)
    {
        case 0:
            // if(bits & 0x80)
            // {
            //     // IQR Reset
            // }
            // else
            // {
            //     // Timer masks and on/off
            // }
            break;
        case 1:
            // Four-operator enable
            break;
    }
});

register_fm_write([0x05], function(bits, register, address)
{
    if(register === 0)
    {
        // No registers documented here.
        this.fm_default_write(bits, register, address);
    }
    else
    {
        // OPL3 Mode Enable
    }
});

register_fm_write([0x08], function(bits, register, address)
{
    // Composite sine wave on/off
    // Note select (keyboard split selection method)
});

register_fm_write(between(0x20, 0x35), function(bits, register, address)
{
    var operator = get_fm_operator(register, address - 0x20);
    // Tremolo
    // Vibrato
    // Sustain
    // KSR Envelope Scaling
    // Frequency Multiplication Factor
});

register_fm_write(between(0x40, 0x55), function(bits, register, address)
{
    var operator = get_fm_operator(register, address - 0x40);
    // Key Scale Level
    // Output Level
});

register_fm_write(between(0x60, 0x75), function(bits, register, address)
{
    var operator = get_fm_operator(register, address - 0x60);
    // Attack Rate
    // Decay Rate
});

register_fm_write(between(0x80, 0x95), function(bits, register, address)
{
    var operator = get_fm_operator(register, address - 0x80);
    // Sustain Level
    // Release Rate
});

register_fm_write(between(0xA0, 0xA8), function(bits, register, address)
{
    var channel = address - 0xA0;
    // Frequency Number (Lower 8 bits)
});

register_fm_write(between(0xB0, 0xB8), function(bits, register, address)
{
    // Key-On
    // Block Number
    // Frequency Number (Higher 2 bits)
});

register_fm_write([0xBD], function(bits, register, address)
{
    // Tremelo Depth
    // Vibrato Depth
    // Percussion Mode
    // Bass Drum Key-On
    // Snare Drum Key-On
    // Tom-Tom Key-On
    // Cymbal Key-On
    // Hi-Hat Key-On
});

register_fm_write(between(0xC0, 0xC8), function(bits, register, address)
{
    // Right Speaker Enable
    // Left Speaker Enable
    // Feedback Modulation Factor
    // Synthesis Type
});

register_fm_write(between(0xE0, 0xF5), function(bits, register, address)
{
    var operator = get_fm_operator(register, address - 0xE0);
    // Waveform Select
});

//
// FM behaviours
//

SB16.prototype.fm_update_waveforms = function()
{
    // To be implemented.
};

//
// General behaviours
//

SB16.prototype.sampling_rate_change = function(rate)
{
    this.sampling_rate = rate;
    this.bus.send("dac-tell-sampling-rate", rate);
};

SB16.prototype.get_channel_count = function()
{
    return this.dsp_stereo ? 2 : 1;
};

SB16.prototype.dma_transfer_size_set = function()
{
    this.dma_sample_count = 1 + (this.write_buffer.shift() << 0) + (this.write_buffer.shift() << 8);
};

SB16.prototype.dma_transfer_start = function()
{
    dbg_log("begin dma transfer", LOG_SB16);

    // (1) Setup appropriate settings.

    this.bytes_per_sample = 1;
    if(this.dsp_16bit) this.bytes_per_sample *= 2;

    // Don't count stereo interleaved bits apparently.
    // Disabling this line is needed for sounds to work correctly,
    // especially double buffering autoinit mode.
    // Learnt the hard way.
    // if(this.dsp_stereo) this.bytes_per_sample *= 2;

    this.dma_bytes_count = this.dma_sample_count * this.bytes_per_sample;
    this.dma_bytes_block = SB_DMA_BLOCK_SAMPLES * this.bytes_per_sample;

    // Ensure block size is small enough but not too small, and is divisible by 4
    var max_bytes_block = Math.max(this.dma_bytes_count >> 2 & ~0x3, 32);
    this.dma_bytes_block = Math.min(max_bytes_block, this.dma_bytes_block);

    // (2) Wait until channel is unmasked (if not already)
    this.dma_waiting_transfer = true;
    if(!this.dma.channel_mask[this.dma_channel])
    {
        this.dma_on_unmask(this.dma_channel);
    }
};

SB16.prototype.dma_on_unmask = function(channel)
{
    if(channel !== this.dma_channel || !this.dma_waiting_transfer)
    {
        return;
    }

    // (3) Configure amount of bytes left to transfer and tell speaker adapter
    // to start requesting transfers
    this.dma_waiting_transfer = false;
    this.dma_bytes_left = this.dma_bytes_count;
    this.dma_paused = false;
    this.bus.send("dac-enable");
};

SB16.prototype.dma_transfer_next = function()
{
    dbg_log("dma transfering next block", LOG_SB16);

    var size = Math.min(this.dma_bytes_left, this.dma_bytes_block);
    var samples = Math.floor(size / this.bytes_per_sample);

    this.dma.do_write(this.dma_syncbuffer, 0, size, this.dma_channel, (error) =>
    {
        dbg_log("dma block transfer " + (error ? "unsuccessful" : "successful"), LOG_SB16);
        if(error) return;

        this.dma_to_dac(samples);
        this.dma_bytes_left -= size;

        if(!this.dma_bytes_left)
        {
            // Completed requested transfer of given size.
            this.raise_irq(this.dma_irq);

            if(this.dma_autoinit)
            {
                // Restart the transfer.
                this.dma_bytes_left = this.dma_bytes_count;
            }
        }
    });
};

SB16.prototype.dma_to_dac = function(sample_count)
{
    var amplitude = this.dsp_16bit ? 32767.5 : 127.5;
    var offset = this.dsp_signed ? 0 : -1;
    var repeats = this.dsp_stereo ? 1 : 2;

    var buffer;
    if(this.dsp_16bit)
    {
        buffer = this.dsp_signed ? this.dma_buffer_int16 : this.dma_buffer_uint16;
    }
    else
    {
        buffer = this.dsp_signed ? this.dma_buffer_int8 : this.dma_buffer_uint8;
    }

    var channel = 0;
    for(var i = 0; i < sample_count; i++)
    {
        var sample = audio_normalize(buffer[i], amplitude, offset);
        for(var j = 0; j < repeats; j++)
        {
            this.dac_buffers[channel].push(sample);
            channel ^= 1;
        }
    }

    this.dac_send();
};

SB16.prototype.dac_handle_request = function()
{
    if(!this.dma_bytes_left || this.dma_paused)
    {
        // No more data to transfer or is paused. Send whatever is in the buffers.
        this.dac_send();
    }
    else
    {
        this.dma_transfer_next();
    }
};

SB16.prototype.dac_send = function()
{
    if(!this.dac_buffers[0].length)
    {
        return;
    }

    var out0 = this.dac_buffers[0].shift_block(this.dac_buffers[0].length);
    var out1 = this.dac_buffers[1].shift_block(this.dac_buffers[1].length);
    this.bus.send("dac-send-data", [out0, out1], [out0.buffer, out1.buffer]);
};

SB16.prototype.raise_irq = function(type)
{
    dbg_log("raise irq", LOG_SB16);
    this.irq_triggered[type] = 1;
    this.cpu.device_raise_irq(this.irq);
};

SB16.prototype.lower_irq = function(type)
{
    dbg_log("lower irq", LOG_SB16);
    this.irq_triggered[type] = 0;
    this.cpu.device_lower_irq(this.irq);
};

//
// Helpers
//

function audio_normalize(value, amplitude, offset)
{
    return audio_clip(value / amplitude + offset, -1, 1);
}

function audio_clip(value, low, high)
{
    return (value < low) * low + (value > high) * high + (low <= value && value <= high) * value;
}


// ---- File: src/apic.js ----
// See Intel's System Programming Guide







// For Types Only


const APIC_LOG_VERBOSE = false;

// should probably be kept in sync with TSC_RATE in cpu.rs
const APIC_TIMER_FREQ = 1 * 1000 * 1000;

const APIC_ADDRESS = 0xFEE00000;

const APIC_TIMER_MODE_MASK = 3 << 17;

const APIC_TIMER_MODE_ONE_SHOT = 0;

const APIC_TIMER_MODE_PERIODIC = 1 << 17;

const APIC_TIMER_MODE_TSC = 2 << 17;


const DELIVERY_MODES = [
    "Fixed (0)",
    "Lowest Prio (1)",
    "SMI (2)",
    "Reserved (3)",
    "NMI (4)",
    "INIT (5)",
    "Reserved (6)",
    "ExtINT (7)",
];

const DESTINATION_MODES = ["physical", "logical"];


/**
 * @constructor
 * @param {CPU} cpu
 */
function APIC(cpu)
{
    /** @type {CPU} */
    this.cpu = cpu;

    this.apic_id = 0;

    this.timer_divider = 0;
    this.timer_divider_shift = 1;
    this.timer_initial_count = 0;
    this.timer_current_count = 0;

    this.next_tick = v86.microtick();

    this.lvt_timer = IOAPIC_CONFIG_MASKED;
    this.lvt_thermal_sensor = IOAPIC_CONFIG_MASKED;
    this.lvt_perf_counter = IOAPIC_CONFIG_MASKED;
    this.lvt_int0 = IOAPIC_CONFIG_MASKED;
    this.lvt_int1 = IOAPIC_CONFIG_MASKED;
    this.lvt_error = IOAPIC_CONFIG_MASKED;

    this.tpr = 0;
    this.icr0 = 0;
    this.icr1 = 0;

    this.irr = new Int32Array(8);
    this.isr = new Int32Array(8);
    this.tmr = new Int32Array(8);

    this.spurious_vector = 0xFE;
    this.destination_format = -1;
    this.local_destination = 0;

    this.error = 0;
    this.read_error = 0;

    cpu.io.mmap_register(APIC_ADDRESS, 0x100000,
        (addr) =>
        {
            dbg_log("Unsupported read8 from apic: " + h(addr >>> 0), LOG_APIC);
            var off = addr & 3;
            addr &= ~3;
            return this.read32(addr) >> (off * 8) & 0xFF;
        },
        (addr, value) =>
        {
            dbg_log("Unsupported write8 from apic: " + h(addr) + " <- " + h(value), LOG_APIC);
            dbg_trace();
            dbg_assert(false);
        },
        (addr) => this.read32(addr),
        (addr, value) => this.write32(addr, value)
    );
}

APIC.prototype.read32 = function(addr)
{
    addr = addr - APIC_ADDRESS | 0;

    switch(addr)
    {
        case 0x20:
            dbg_log("APIC read id", LOG_APIC);
            return this.apic_id;

        case 0x30:
            // version
            dbg_log("APIC read version", LOG_APIC);
            return 0x50014;

        case 0x80:
            APIC_LOG_VERBOSE && dbg_log("APIC read tpr", LOG_APIC);
            return this.tpr;

        case 0xD0:
            dbg_log("Read local destination", LOG_APIC);
            return this.local_destination;

        case 0xE0:
            dbg_log("Read destination format", LOG_APIC);
            return this.destination_format;

        case 0xF0:
            return this.spurious_vector;

        case 0x100:
        case 0x110:
        case 0x120:
        case 0x130:
        case 0x140:
        case 0x150:
        case 0x160:
        case 0x170:
            var index = addr - 0x100 >> 4;
            dbg_log("Read isr " + index + ": " + h(this.isr[index] >>> 0, 8), LOG_APIC);
            return this.isr[index];

        case 0x180:
        case 0x190:
        case 0x1A0:
        case 0x1B0:
        case 0x1C0:
        case 0x1D0:
        case 0x1E0:
        case 0x1F0:
            var index = addr - 0x180 >> 4;
            dbg_log("Read tmr " + index + ": " + h(this.tmr[index] >>> 0, 8), LOG_APIC);
            return this.tmr[index];

        case 0x200:
        case 0x210:
        case 0x220:
        case 0x230:
        case 0x240:
        case 0x250:
        case 0x260:
        case 0x270:
            var index = addr - 0x200 >> 4;
            dbg_log("Read irr " + index + ": " + h(this.irr[index] >>> 0, 8), LOG_APIC);
            return this.irr[index];

        case 0x280:
            dbg_log("Read error: " + h(this.read_error >>> 0, 8), LOG_APIC);
            return this.read_error;

        case 0x300:
            APIC_LOG_VERBOSE && dbg_log("APIC read icr0", LOG_APIC);
            return this.icr0;

        case 0x310:
            dbg_log("APIC read icr1", LOG_APIC);
            return this.icr1;

        case 0x320:
            dbg_log("read timer lvt", LOG_APIC);
            return this.lvt_timer;

        case 0x330:
            dbg_log("read lvt thermal sensor", LOG_APIC);
            return this.lvt_thermal_sensor;

        case 0x340:
            dbg_log("read lvt perf counter", LOG_APIC);
            return this.lvt_perf_counter;

        case 0x350:
            dbg_log("read lvt int0", LOG_APIC);
            return this.lvt_int0;

        case 0x360:
            dbg_log("read lvt int1", LOG_APIC);
            return this.lvt_int1;

        case 0x370:
            dbg_log("read lvt error", LOG_APIC);
            return this.lvt_error;

        case 0x3E0:
            // divider
            dbg_log("read timer divider", LOG_APIC);
            return this.timer_divider;

        case 0x380:
            dbg_log("read timer initial count", LOG_APIC);
            return this.timer_initial_count;

        case 0x390:
            dbg_log("read timer current count: " + h(this.timer_current_count >>> 0, 8), LOG_APIC);
            return this.timer_current_count;

        default:
            dbg_log("APIC read " + h(addr), LOG_APIC);
            dbg_assert(false);
            return 0;
    }
};

APIC.prototype.write32 = function(addr, value)
{
    addr = addr - APIC_ADDRESS | 0;

    switch(addr)
    {
        case 0x20:
            dbg_log("APIC write id: " + h(value >>> 8, 8), LOG_APIC);
            this.apic_id = value;
            break;

        case 0x30:
            // version
            dbg_log("APIC write version: " + h(value >>> 0, 8) + ", ignored", LOG_APIC);
            break;

        case 0x80:
            APIC_LOG_VERBOSE && dbg_log("Set tpr: " + h(value & 0xFF, 2), LOG_APIC);
            this.tpr = value & 0xFF;
            this.check_vector();
            break;

        case 0xB0:
            var highest_isr = this.highest_isr();
            if(highest_isr !== -1)
            {
                APIC_LOG_VERBOSE && dbg_log("eoi: " + h(value >>> 0, 8) + " for vector " + h(highest_isr), LOG_APIC);
                this.register_clear_bit(this.isr, highest_isr);
                if(this.register_get_bit(this.tmr, highest_isr))
                {
                    // Send eoi to all IO APICs
                    this.cpu.devices.ioapic.remote_eoi(highest_isr);
                }
                this.check_vector();
            }
            else
            {
                dbg_log("Bad eoi: No isr set", LOG_APIC);
            }
            break;

        case 0xD0:
            dbg_log("Set local destination: " + h(value >>> 0, 8), LOG_APIC);
            this.local_destination = value & 0xFF000000;
            break;

        case 0xE0:
            dbg_log("Set destination format: " + h(value >>> 0, 8), LOG_APIC);
            this.destination_format = value | 0xFFFFFF;
            break;

        case 0xF0:
            dbg_log("Set spurious vector: " + h(value >>> 0, 8), LOG_APIC);
            this.spurious_vector = value;
            break;

        case 0x280:
            // updated readable error register with real error
            dbg_log("Write error: " + h(value >>> 0, 8), LOG_APIC);
            this.read_error = this.error;
            this.error = 0;
            break;

        case 0x300:
            var vector = value & 0xFF;
            var delivery_mode = value >> 8 & 7;
            var destination_mode = value >> 11 & 1;
            var is_level = value >> 15 & 1;
            var destination_shorthand = value >> 18 & 3;
            var destination = this.icr1 >>> 24;
            dbg_log("APIC write icr0: " + h(value, 8) + " vector=" + h(vector, 2) + " " +
                    "destination_mode=" + DESTINATION_MODES[destination_mode] + " delivery_mode=" + DELIVERY_MODES[delivery_mode] + " " +
                    "destination_shorthand=" + ["no", "self", "all with self", "all without self"][destination_shorthand], LOG_APIC);

            value &= ~(1 << 12);
            this.icr0 = value;

            if(destination_shorthand === 0)
            {
                // no shorthand
                this.route(vector, delivery_mode, is_level, destination, destination_mode);
            }
            else if(destination_shorthand === 1)
            {
                // self
                this.deliver(vector, IOAPIC_DELIVERY_FIXED, is_level);
            }
            else if(destination_shorthand === 2)
            {
                // all including self
                this.deliver(vector, delivery_mode, is_level);
            }
            else if(destination_shorthand === 3)
            {
                // all but self
            }
            else
            {
                dbg_assert(false);
            }
            break;

        case 0x310:
            dbg_log("APIC write icr1: " + h(value >>> 0, 8), LOG_APIC);
            this.icr1 = value;
            break;

        case 0x320:
            dbg_log("timer lvt: " + h(value >>> 0, 8), LOG_APIC);
            this.lvt_timer = value;
            break;

        case 0x330:
            dbg_log("lvt thermal sensor: " + h(value >>> 0, 8), LOG_APIC);
            this.lvt_thermal_sensor = value;
            break;

        case 0x340:
            dbg_log("lvt perf counter: " + h(value >>> 0, 8), LOG_APIC);
            this.lvt_perf_counter = value;
            break;

        case 0x350:
            dbg_log("lvt int0: " + h(value >>> 0, 8), LOG_APIC);
            this.lvt_int0 = value;
            break;

        case 0x360:
            dbg_log("lvt int1: " + h(value >>> 0, 8), LOG_APIC);
            this.lvt_int1 = value;
            break;

        case 0x370:
            dbg_log("lvt error: " + h(value >>> 0, 8), LOG_APIC);
            this.lvt_error = value;
            break;

        case 0x3E0:
            dbg_log("timer divider: " + h(value >>> 0, 8), LOG_APIC);
            this.timer_divider = value;

            var divide_shift = value & 0b11 | (value & 0b1000) >> 1;
            this.timer_divider_shift = divide_shift === 0b111 ? 0 : divide_shift + 1;
            break;

        case 0x380:
            dbg_log("timer initial: " + h(value >>> 0, 8), LOG_APIC);
            this.timer_initial_count = value >>> 0;
            this.timer_current_count = value >>> 0;

            this.next_tick = v86.microtick();
            this.timer_active = true;
            break;

        case 0x390:
            dbg_log("timer current: " + h(value >>> 0, 8), LOG_APIC);
            dbg_assert(false, "read-only register");
            break;

        default:
            dbg_log("APIC write32 " + h(addr) + " <- " + h(value >>> 0, 8), LOG_APIC);
            dbg_assert(false);
    }
};

APIC.prototype.timer = function(now)
{
    if(this.timer_current_count === 0)
    {
        return 100;
    }

    const freq = APIC_TIMER_FREQ / (1 << this.timer_divider_shift);

    const steps = (now - this.next_tick) * freq >>> 0;

    this.next_tick += steps / freq;
    this.timer_current_count -= steps;

    if(this.timer_current_count <= 0)
    {
        var mode = this.lvt_timer & APIC_TIMER_MODE_MASK;

        if(mode === APIC_TIMER_MODE_PERIODIC)
        {
            this.timer_current_count = this.timer_current_count % this.timer_initial_count;

            if(this.timer_current_count <= 0)
            {
                this.timer_current_count += this.timer_initial_count;
            }
            dbg_assert(this.timer_current_count !== 0);

            if((this.lvt_timer & IOAPIC_CONFIG_MASKED) === 0)
            {
                this.deliver(this.lvt_timer & 0xFF, IOAPIC_DELIVERY_FIXED, false);
            }
        }
        else if(mode === APIC_TIMER_MODE_ONE_SHOT)
        {
            this.timer_current_count = 0;
            dbg_log("APIC timer one shot end", LOG_APIC);

            if((this.lvt_timer & IOAPIC_CONFIG_MASKED) === 0)
            {
                this.deliver(this.lvt_timer & 0xFF, IOAPIC_DELIVERY_FIXED, false);
            }
        }
    }

    return Math.max(0, this.timer_current_count / freq);
};

APIC.prototype.route = function(vector, mode, is_level, destination, destination_mode)
{
    // TODO
    this.deliver(vector, mode, is_level);
};

APIC.prototype.deliver = function(vector, mode, is_level)
{
    APIC_LOG_VERBOSE && dbg_log("Deliver " + h(vector, 2) + " mode=" + mode + " level=" + is_level, LOG_APIC);

    if(mode === IOAPIC_DELIVERY_INIT)
    {
        // TODO
        return;
    }

    if(mode === IOAPIC_DELIVERY_NMI)
    {
        // TODO
        return;
    }

    if(vector < 0x10 || vector === 0xFF)
    {
        dbg_assert(false, "TODO: Invalid vector");
    }

    if(this.register_get_bit(this.irr, vector))
    {
        dbg_log("Not delivered: irr already set, vector=" + h(vector, 2), LOG_APIC);
        return;
    }

    this.register_set_bit(this.irr, vector);

    if(is_level)
    {
        this.register_set_bit(this.tmr, vector);
    }
    else
    {
        this.register_clear_bit(this.tmr, vector);
    }

    this.check_vector();
};

APIC.prototype.highest_irr = function()
{
    var highest = this.register_get_highest_bit(this.irr);
    dbg_assert(highest !== 0xFF);
    dbg_assert(highest >= 0x10 || highest === -1);
    return highest;
};

APIC.prototype.highest_isr = function()
{
    var highest = this.register_get_highest_bit(this.isr);
    dbg_assert(highest !== 0xFF);
    dbg_assert(highest >= 0x10 || highest === -1);
    return highest;
};

APIC.prototype.check_vector = function()
{
    var highest_irr = this.highest_irr();

    if(highest_irr === -1)
    {
        return;
    }

    var highest_isr = this.highest_isr();

    if(highest_isr >= highest_irr)
    {
        APIC_LOG_VERBOSE && dbg_log("Higher isr, isr=" + h(highest_isr) + " irr=" + h(highest_irr), LOG_APIC);
        return;
    }

    if((highest_irr & 0xF0) <= (this.tpr & 0xF0))
    {
        APIC_LOG_VERBOSE && dbg_log("Higher tpr, tpr=" + h(this.tpr & 0xF0) + " irr=" + h(highest_irr), LOG_APIC);
        return;
    }

    this.cpu.handle_irqs();
};

APIC.prototype.acknowledge_irq = function()
{
    var highest_irr = this.highest_irr();

    if(highest_irr === -1)
    {
        //dbg_log("Spurious", LOG_APIC);
        return -1;
    }

    var highest_isr = this.highest_isr();

    if(highest_isr >= highest_irr)
    {
        APIC_LOG_VERBOSE && dbg_log("Higher isr, isr=" + h(highest_isr) + " irr=" + h(highest_irr), LOG_APIC);
        return -1;
    }

    if((highest_irr & 0xF0) <= (this.tpr & 0xF0))
    {
        APIC_LOG_VERBOSE && dbg_log("Higher tpr, tpr=" + h(this.tpr & 0xF0) + " irr=" + h(highest_irr), LOG_APIC);
        return -1;
    }

    this.register_clear_bit(this.irr, highest_irr);
    this.register_set_bit(this.isr, highest_irr);

    APIC_LOG_VERBOSE && dbg_log("Calling vector " + h(highest_irr), LOG_APIC);

    this.check_vector();

    return highest_irr;
};

APIC.prototype.get_state = function()
{
    var state = [];

    state[0] = this.apic_id;
    state[1] = this.timer_divider;
    state[2] = this.timer_divider_shift;
    state[3] = this.timer_initial_count;
    state[4] = this.timer_current_count;
    state[5] = this.next_tick;
    state[6] = this.lvt_timer;
    state[7] = this.lvt_perf_counter;
    state[8] = this.lvt_int0;
    state[9] = this.lvt_int1;
    state[10] = this.lvt_error;
    state[11] = this.tpr;
    state[12] = this.icr0;
    state[13] = this.icr1;
    state[14] = this.irr;
    state[15] = this.isr;
    state[16] = this.tmr;
    state[17] = this.spurious_vector;
    state[18] = this.destination_format;
    state[19] = this.local_destination;
    state[20] = this.error;
    state[21] = this.read_error;
    state[22] = this.lvt_thermal_sensor;

    return state;
};

APIC.prototype.set_state = function(state)
{
    this.apic_id = state[0];
    this.timer_divider = state[1];
    this.timer_divider_shift = state[2];
    this.timer_initial_count = state[3];
    this.timer_current_count = state[4];
    this.next_tick = state[5];
    this.lvt_timer = state[6];
    this.lvt_perf_counter = state[7];
    this.lvt_int0 = state[8];
    this.lvt_int1 = state[9];
    this.lvt_error = state[10];
    this.tpr = state[11];
    this.icr0 = state[12];
    this.icr1 = state[13];
    this.irr = state[14];
    this.isr = state[15];
    this.tmr = state[16];
    this.spurious_vector = state[17];
    this.destination_format = state[18];
    this.local_destination = state[19];
    this.error = state[20];
    this.read_error = state[21];
    this.lvt_thermal_sensor = state[22] || IOAPIC_CONFIG_MASKED;
};

// functions operating on 256-bit registers (for irr, isr, tmr)
APIC.prototype.register_get_bit = function(v, bit)
{
    dbg_assert(bit >= 0 && bit < 256);
    return v[bit >> 5] >> (bit & 31) & 1;
};

APIC.prototype.register_set_bit = function(v, bit)
{
    dbg_assert(bit >= 0 && bit < 256);
    v[bit >> 5] |= 1 << (bit & 31);
};

APIC.prototype.register_clear_bit = function(v, bit)
{
    dbg_assert(bit >= 0 && bit < 256);
    v[bit >> 5] &= ~(1 << (bit & 31));
};

APIC.prototype.register_get_highest_bit = function(v)
{
    for(var i = 7; i >= 0; i--)
    {
        var word = v[i];

        if(word)
        {
            return int_log2(word >>> 0) | i << 5;
        }
    }

    return -1;
};


// ---- File: src/ioapic.js ----
// http://download.intel.com/design/chipsets/datashts/29056601.pdf






// For Types Only



const IOAPIC_ADDRESS = 0xFEC00000;

const IOREGSEL = 0;

const IOWIN = 0x10;

const IOAPIC_IRQ_COUNT = 24;

const IOAPIC_ID = 0; // must match value in seabios

const IOAPIC_CONFIG_TRIGGER_MODE_LEVEL = 1 << 15;

const IOAPIC_CONFIG_MASKED = 1 << 16;

const IOAPIC_CONFIG_DELIVS = 1 << 12;

const IOAPIC_CONFIG_REMOTE_IRR = 1 << 14;

const IOAPIC_CONFIG_READONLY_MASK = IOAPIC_CONFIG_REMOTE_IRR | IOAPIC_CONFIG_DELIVS | 0xFFFE0000;

const IOAPIC_DELIVERY_FIXED = 0;
const IOAPIC_DELIVERY_LOWEST_PRIORITY = 1;
const IOAPIC_DELIVERY_NMI = 4;
const IOAPIC_DELIVERY_INIT = 5;


/**
 * @constructor
 * @param {CPU} cpu
 */
function IOAPIC(cpu)
{
    /** @type {CPU} */
    this.cpu = cpu;

    this.ioredtbl_config = new Int32Array(IOAPIC_IRQ_COUNT);
    this.ioredtbl_destination = new Int32Array(IOAPIC_IRQ_COUNT);

    for(var i = 0; i < this.ioredtbl_config.length; i++)
    {
        // disable interrupts
        this.ioredtbl_config[i] = IOAPIC_CONFIG_MASKED;
    }

    // IOAPIC register selection
    this.ioregsel = 0;

    this.ioapic_id = IOAPIC_ID;

    this.irr = 0;
    this.irq_value = 0;

    dbg_assert(MMAP_BLOCK_SIZE >= 0x20);
    cpu.io.mmap_register(IOAPIC_ADDRESS, MMAP_BLOCK_SIZE,
        (addr) =>
        {
            addr = addr - IOAPIC_ADDRESS | 0;

            if(addr >= IOWIN && addr < IOWIN + 4)
            {
                const byte = addr - IOWIN;
                dbg_log("ioapic read8 byte " + byte + " " + h(this.ioregsel), LOG_APIC);
                return this.read(this.ioregsel) >> (8 * byte) & 0xFF;
            }
            else
            {
                dbg_log("Unexpected IOAPIC register read: " + h(addr >>> 0), LOG_APIC);
                dbg_assert(false);
                return 0;
            }
        },
        (addr, value) =>
        {
            dbg_assert(false, "unsupported write8 from ioapic: " + h(addr >>> 0));
        },
        (addr) =>
        {
            addr = addr - IOAPIC_ADDRESS | 0;

            if(addr === IOREGSEL)
            {
                return this.ioregsel;
            }
            else if(addr === IOWIN)
            {
                return this.read(this.ioregsel);
            }
            else
            {
                dbg_log("Unexpected IOAPIC register read: " + h(addr >>> 0), LOG_APIC);
                dbg_assert(false);
                return 0;
            }
        },
        (addr, value) =>
        {
            addr = addr - IOAPIC_ADDRESS | 0;

            if(addr === IOREGSEL)
            {
                this.ioregsel = value;
            }
            else if(addr === IOWIN)
            {
                this.write(this.ioregsel, value);
            }
            else
            {
                dbg_log("Unexpected IOAPIC register write: " + h(addr >>> 0) + " <- " + h(value >>> 0, 8), LOG_APIC);
                dbg_assert(false);
            }
        });
}

IOAPIC.prototype.remote_eoi = function(vector)
{
    for(var i = 0; i < IOAPIC_IRQ_COUNT; i++)
    {
        var config = this.ioredtbl_config[i];

        if((config & 0xFF) === vector && (config & IOAPIC_CONFIG_REMOTE_IRR))
        {
            dbg_log("Clear remote IRR for irq=" + h(i), LOG_APIC);
            this.ioredtbl_config[i] &= ~IOAPIC_CONFIG_REMOTE_IRR;
            this.check_irq(i);
        }
    }
};

IOAPIC.prototype.check_irq = function(irq)
{
    var mask = 1 << irq;

    if((this.irr & mask) === 0)
    {
        return;
    }

    var config = this.ioredtbl_config[irq];

    if((config & IOAPIC_CONFIG_MASKED) === 0)
    {
        var delivery_mode = config >> 8 & 7;
        var destination_mode = config >> 11 & 1;
        var vector = config & 0xFF;
        var destination = this.ioredtbl_destination[irq] >>> 24;
        var is_level = (config & IOAPIC_CONFIG_TRIGGER_MODE_LEVEL) === IOAPIC_CONFIG_TRIGGER_MODE_LEVEL;

        if((config & IOAPIC_CONFIG_TRIGGER_MODE_LEVEL) === 0)
        {
            this.irr &= ~mask;
        }
        else
        {
            this.ioredtbl_config[irq] |= IOAPIC_CONFIG_REMOTE_IRR;

            if(config & IOAPIC_CONFIG_REMOTE_IRR)
            {
                dbg_log("No route: level interrupt and remote IRR still set", LOG_APIC);
                return;
            }
        }

        if(delivery_mode === IOAPIC_DELIVERY_FIXED || delivery_mode === IOAPIC_DELIVERY_LOWEST_PRIORITY)
        {
            this.cpu.devices.apic.route(vector, delivery_mode, is_level, destination, destination_mode);
        }
        else
        {
            dbg_assert(false, "TODO");
        }

        this.ioredtbl_config[irq] &= ~IOAPIC_CONFIG_DELIVS;
    }
};

IOAPIC.prototype.set_irq = function(i)
{
    if(i >= IOAPIC_IRQ_COUNT)
    {
        dbg_assert(false, "Bad irq: " + i, LOG_APIC);
        return;
    }

    var mask = 1 << i;

    if((this.irq_value & mask) === 0)
    {
        APIC_LOG_VERBOSE && dbg_log("apic set irq " + i, LOG_APIC);

        this.irq_value |= mask;

        var config = this.ioredtbl_config[i];
        if((config & (IOAPIC_CONFIG_TRIGGER_MODE_LEVEL|IOAPIC_CONFIG_MASKED)) ===
                        IOAPIC_CONFIG_MASKED)
        {
            // edge triggered and masked
            return;
        }

        this.irr |= mask;

        this.check_irq(i);
    }
};

IOAPIC.prototype.clear_irq = function(i)
{
    if(i >= IOAPIC_IRQ_COUNT)
    {
        dbg_assert(false, "Bad irq: " + i, LOG_APIC);
        return;
    }

    var mask = 1 << i;

    if((this.irq_value & mask) === mask)
    {
        this.irq_value &= ~mask;

        var config = this.ioredtbl_config[i];
        if(config & IOAPIC_CONFIG_TRIGGER_MODE_LEVEL)
        {
            this.irr &= ~mask;
        }
    }
};

IOAPIC.prototype.read = function(reg)
{
    if(reg === 0)
    {
        dbg_log("IOAPIC Read id", LOG_APIC);
        return this.ioapic_id << 24;
    }
    else if(reg === 1)
    {
        dbg_log("IOAPIC Read version", LOG_APIC);
        return 0x11 | IOAPIC_IRQ_COUNT - 1 << 16;
    }
    else if(reg === 2)
    {
        dbg_log("IOAPIC Read arbitration id", LOG_APIC);
        return this.ioapic_id << 24;
    }
    else if(reg >= 0x10 && reg < 0x10 + 2 * IOAPIC_IRQ_COUNT)
    {
        var irq = reg - 0x10 >> 1;
        var index = reg & 1;

        if(index)
        {
            var value = this.ioredtbl_destination[irq];
            dbg_log("IOAPIC Read destination irq=" + h(irq) + " -> " + h(value, 8), LOG_APIC);
        }
        else
        {
            var value = this.ioredtbl_config[irq];
            dbg_log("IOAPIC Read config irq=" + h(irq) + " -> " + h(value, 8), LOG_APIC);
        }
        return value;
    }
    else
    {
        dbg_log("IOAPIC register read outside of range " + h(reg), LOG_APIC);
        dbg_assert(false);
        return 0;
    }
};

IOAPIC.prototype.write = function(reg, value)
{
    //dbg_log("IOAPIC write " + h(reg) + " <- " + h(value, 8), LOG_APIC);

    if(reg === 0)
    {
        this.ioapic_id = value >>> 24 & 0x0F;
    }
    else if(reg === 1 || reg === 2)
    {
        dbg_log("Invalid write: " + reg, LOG_APIC);
    }
    else if(reg >= 0x10 && reg < 0x10 + 2 * IOAPIC_IRQ_COUNT)
    {
        var irq = reg - 0x10 >> 1;
        var index = reg & 1;

        if(index)
        {
            this.ioredtbl_destination[irq] = value & 0xFF000000;
            dbg_log("Write destination " + h(value >>> 0, 8) + " irq=" + h(irq) + " dest=" + h(value >>> 24, 2), LOG_APIC);
        }
        else
        {
            var old_value = this.ioredtbl_config[irq];
            this.ioredtbl_config[irq] = value & ~IOAPIC_CONFIG_READONLY_MASK | old_value & IOAPIC_CONFIG_READONLY_MASK;

            var vector = value & 0xFF;
            var delivery_mode = value >> 8 & 7;
            var destination_mode = value >> 11 & 1;
            var is_level = value >> 15 & 1;
            var disabled = value >> 16 & 1;

            dbg_log("Write config " + h(value >>> 0, 8) +
                    " irq=" + h(irq) +
                    " vector=" + h(vector, 2) +
                    " deliverymode=" + DELIVERY_MODES[delivery_mode] +
                    " destmode=" + DESTINATION_MODES[destination_mode] +
                    " is_level=" + is_level +
                    " disabled=" + disabled, LOG_APIC);

            this.check_irq(irq);
        }
    }
    else
    {
        dbg_log("IOAPIC register write outside of range " + h(reg) + ": " + h(value >>> 0, 8), LOG_APIC);
        dbg_assert(false);
    }
};

IOAPIC.prototype.get_state = function()
{
    var state = [];
    state[0] = this.ioredtbl_config;
    state[1] = this.ioredtbl_destination;
    state[2] = this.ioregsel;
    state[3] = this.ioapic_id;
    state[4] = this.irr;
    state[5] = this.irq_value;
    return state;
};

IOAPIC.prototype.set_state = function(state)
{
    this.ioredtbl_config = state[0];
    this.ioredtbl_destination = state[1];
    this.ioregsel = state[2];
    this.ioapic_id = state[3];
    this.irr = state[4];
    this.irq_value = state[5];
};


// ---- File: src/acpi.js ----
// http://www.uefi.org/sites/default/files/resources/ACPI_6_1.pdf






// For Types Only


const PMTIMER_FREQ_SECONDS = 3579545;

/**
 * @constructor
 * @param {CPU} cpu
 */
function ACPI(cpu)
{
    /** @type {CPU} */
    this.cpu = cpu;

    var io = cpu.io;

    var acpi = {
        pci_id: 0x07 << 3,
        pci_space: [
            0x86, 0x80, 0x13, 0x71, 0x07, 0x00, 0x80, 0x02, 0x08, 0x00, 0x80, 0x06, 0x00, 0x00, 0x80, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0x01, 0x00, 0x00,
        ],
        pci_bars: [],
        name: "acpi",
    };

    // 00:07.0 Bridge: Intel Corporation 82371AB/EB/MB PIIX4 ACPI (rev 08)
    cpu.devices.pci.register_device(acpi);

    this.timer_last_value = 0;
    this.timer_imprecision_offset = 0;

    this.status = 1;
    this.pm1_status = 0;
    this.pm1_enable = 0;
    this.last_timer = this.get_timer(v86.microtick());

    this.gpe = new Uint8Array(4);

    io.register_read(0xB000, this, undefined, function()
    {
        dbg_log("ACPI pm1_status read", LOG_ACPI);
        return this.pm1_status;
    });
    io.register_write(0xB000, this, undefined, function(value)
    {
        dbg_log("ACPI pm1_status write: " + h(value, 4), LOG_ACPI);
        this.pm1_status &= ~value;
    });

    io.register_read(0xB002, this, undefined, function()
    {
        dbg_log("ACPI pm1_enable read", LOG_ACPI);
        return this.pm1_enable;
    });
    io.register_write(0xB002, this, undefined, function(value)
    {
        dbg_log("ACPI pm1_enable write: " + h(value), LOG_ACPI);
        this.pm1_enable = value;
    });

    // ACPI status
    io.register_read(0xB004, this, undefined, function()
    {
        dbg_log("ACPI status read", LOG_ACPI);
        return this.status;
    });
    io.register_write(0xB004, this, undefined, function(value)
    {
        dbg_log("ACPI status write: " + h(value), LOG_ACPI);
        this.status = value;
    });

    // ACPI, pmtimer
    io.register_read(0xB008, this, undefined, undefined, function()
    {
        var value = this.get_timer(v86.microtick()) & 0xFFFFFF;
        //dbg_log("pmtimer read: " + h(value >>> 0), LOG_ACPI);
        return value;
    });

    // ACPI, gpe
    io.register_read(0xAFE0, this, function()
    {
        dbg_log("Read gpe#0", LOG_ACPI);
        return this.gpe[0];
    });
    io.register_read(0xAFE1, this, function()
    {
        dbg_log("Read gpe#1", LOG_ACPI);
        return this.gpe[1];
    });
    io.register_read(0xAFE2, this, function()
    {
        dbg_log("Read gpe#2", LOG_ACPI);
        return this.gpe[2];
    });
    io.register_read(0xAFE3, this, function()
    {
        dbg_log("Read gpe#3", LOG_ACPI);
        return this.gpe[3];
    });

    io.register_write(0xAFE0, this, function(value)
    {
        dbg_log("Write gpe#0: " + h(value), LOG_ACPI);
        this.gpe[0] = value;
    });
    io.register_write(0xAFE1, this, function(value)
    {
        dbg_log("Write gpe#1: " + h(value), LOG_ACPI);
        this.gpe[1] = value;
    });
    io.register_write(0xAFE2, this, function(value)
    {
        dbg_log("Write gpe#2: " + h(value), LOG_ACPI);
        this.gpe[2] = value;
    });
    io.register_write(0xAFE3, this, function(value)
    {
        dbg_log("Write gpe#3: " + h(value), LOG_ACPI);
        this.gpe[3] = value;
    });
}

ACPI.prototype.timer = function(now)
{
    var timer = this.get_timer(now);
    var highest_bit_changed = ((timer ^ this.last_timer) & (1 << 23)) !== 0;

    if((this.pm1_enable & 1) && highest_bit_changed)
    {
        dbg_log("ACPI raise irq", LOG_ACPI);
        this.pm1_status |= 1;
        this.cpu.device_raise_irq(9);
    }
    else
    {
        this.cpu.device_lower_irq(9);
    }

    this.last_timer = timer;
    return 100; // TODO
};

ACPI.prototype.get_timer = function(now)
{
    const t = Math.round(now * (PMTIMER_FREQ_SECONDS / 1000));

    // Due to the low precision of JavaScript's time functions we increment the
    // returned timer value every time it is read

    if(t === this.timer_last_value)
    {
        // don't go past 1ms

        if(this.timer_imprecision_offset < PMTIMER_FREQ_SECONDS / 1000)
        {
            this.timer_imprecision_offset++;
        }
    }
    else
    {
        dbg_assert(t > this.timer_last_value);

        const previous_timer = this.timer_last_value + this.timer_imprecision_offset;

        // don't go back in time

        if(previous_timer <= t)
        {
            this.timer_imprecision_offset = 0;
            this.timer_last_value = t;
        }
        else
        {
            dbg_log("Warning: Overshot pmtimer, waiting;" +
                    " current=" + t +
                    " last=" + this.timer_last_value +
                    " offset=" + this.timer_imprecision_offset, LOG_ACPI);
        }
    }

    return this.timer_last_value + this.timer_imprecision_offset;
};

ACPI.prototype.get_state = function()
{
    var state = [];
    state[0] = this.status;
    state[1] = this.pm1_status;
    state[2] = this.pm1_enable;
    state[3] = this.gpe;
    return state;
};

ACPI.prototype.set_state = function(state)
{
    this.status = state[0];
    this.pm1_status = state[1];
    this.pm1_enable = state[2];
    this.gpe = state[3];
};


// ---- File: src/pit.js ----





// For Types Only



// In kHz
const OSCILLATOR_FREQ = 1193.1816666; // 1.193182 MHz

/**
 * @constructor
 *
 * Programmable Interval Timer
 */
function PIT(cpu, bus)
{
    /** @const @type {CPU} */
    this.cpu = cpu;

    this.bus = bus;

    this.counter_start_time = new Float64Array(3);
    this.counter_start_value = new Uint16Array(3);

    this.counter_next_low = new Uint8Array(4);
    this.counter_enabled = new Uint8Array(4);
    this.counter_mode = new Uint8Array(4);
    this.counter_read_mode = new Uint8Array(4);

    // 2 = latch low, 1 = latch high, 0 = no latch
    this.counter_latch = new Uint8Array(4);
    this.counter_latch_value = new Uint16Array(3);

    this.counter_reload = new Uint16Array(3);

    // TODO:
    // - counter2 can be controlled by an input

    cpu.io.register_read(0x61, this, function()
    {
        var now = v86.microtick();

        var ref_toggle = (now * (1000 * 1000 / 15000)) & 1;
        var counter2_out = this.did_rollover(2, now);

        return ref_toggle << 4 | counter2_out << 5;
    });
    cpu.io.register_write(0x61, this, function(data)
    {
        if(data & 1)
        {
            this.bus.send("pcspeaker-enable");
        }
        else
        {
            this.bus.send("pcspeaker-disable");
        }
    });

    cpu.io.register_read(0x40, this, function() { return this.counter_read(0); });
    cpu.io.register_read(0x41, this, function() { return this.counter_read(1); });
    cpu.io.register_read(0x42, this, function() { return this.counter_read(2); });

    cpu.io.register_write(0x40, this, function(data) { this.counter_write(0, data); });
    cpu.io.register_write(0x41, this, function(data) { this.counter_write(1, data); });
    cpu.io.register_write(0x42, this, function(data) {
        this.counter_write(2, data);
        this.bus.send("pcspeaker-update", [this.counter_mode[2], this.counter_reload[2]]);
    });

    cpu.io.register_write(0x43, this, this.port43_write);
}

PIT.prototype.get_state = function()
{
    var state = [];

    state[0] = this.counter_next_low;
    state[1] = this.counter_enabled;
    state[2] = this.counter_mode;
    state[3] = this.counter_read_mode;
    state[4] = this.counter_latch;
    state[5] = this.counter_latch_value;
    state[6] = this.counter_reload;
    state[7] = this.counter_start_time;
    state[8] = this.counter_start_value;

    return state;
};

PIT.prototype.set_state = function(state)
{
    this.counter_next_low = state[0];
    this.counter_enabled = state[1];
    this.counter_mode = state[2];
    this.counter_read_mode = state[3];
    this.counter_latch = state[4];
    this.counter_latch_value = state[5];
    this.counter_reload = state[6];
    this.counter_start_time = state[7];
    this.counter_start_value = state[8];
};

PIT.prototype.timer = function(now, no_irq)
{
    var time_to_next_interrupt = 100;

    // counter 0 produces interrupts
    if(!no_irq)
    {
        if(this.counter_enabled[0] && this.did_rollover(0, now))
        {
            this.counter_start_value[0] = this.get_counter_value(0, now);
            this.counter_start_time[0] = now;

            dbg_log("pit interrupt. new value: " + this.counter_start_value[0], LOG_PIT);

            // This isn't strictly correct, but it's necessary since browsers
            // may sleep longer than necessary to trigger the else branch below
            // and clear the irq
            this.cpu.device_lower_irq(0);

            this.cpu.device_raise_irq(0);
            var mode = this.counter_mode[0];

            if(mode === 0)
            {
                this.counter_enabled[0] = 0;
            }
        }
        else
        {
            this.cpu.device_lower_irq(0);
        }

        if(this.counter_enabled[0])
        {
            const diff = now - this.counter_start_time[0];
            const diff_in_ticks = Math.floor(diff * OSCILLATOR_FREQ);
            const ticks_missing = this.counter_start_value[0] - diff_in_ticks; // XXX: to simplify
            time_to_next_interrupt = ticks_missing / OSCILLATOR_FREQ;
        }
    }

    return time_to_next_interrupt;
};

PIT.prototype.get_counter_value = function(i, now)
{
    if(!this.counter_enabled[i])
    {
        return 0;
    }

    var diff = now - this.counter_start_time[i];
    var diff_in_ticks = Math.floor(diff * OSCILLATOR_FREQ);

    var value = this.counter_start_value[i] - diff_in_ticks;

    dbg_log("diff=" + diff + " dticks=" + diff_in_ticks + " value=" + value + " reload=" + this.counter_reload[i], LOG_PIT);

    var reload = this.counter_reload[i];

    if(value >= reload)
    {
        dbg_log("Warning: Counter" + i + " value " + value  + " is larger than reload " + reload, LOG_PIT);
        value %= reload;
    }
    else if(value < 0)
    {
        value = value % reload + reload;
    }

    return value;
};

PIT.prototype.did_rollover = function(i, now)
{
    var diff = now - this.counter_start_time[i];

    if(diff < 0)
    {
        // should only happen after restore_state
        dbg_log("Warning: PIT timer difference is negative, resetting (timer " + i + ")");
        return true;
    }
    var diff_in_ticks = Math.floor(diff * OSCILLATOR_FREQ);
    //dbg_log(i + ": diff=" + diff + " start_time=" + this.counter_start_time[i] + " diff_in_ticks=" + diff_in_ticks + " (" + diff * OSCILLATOR_FREQ + ") start_value=" + this.counter_start_value[i] + " did_rollover=" + (this.counter_start_value[i] < diff_in_ticks), LOG_PIT);

    return this.counter_start_value[i] < diff_in_ticks;
};

PIT.prototype.counter_read = function(i)
{
    var latch = this.counter_latch[i];

    if(latch)
    {
        this.counter_latch[i]--;

        if(latch === 2)
        {
            return this.counter_latch_value[i] & 0xFF;
        }
        else
        {
            return this.counter_latch_value[i] >> 8;
        }
    }
    else
    {
        var next_low = this.counter_next_low[i];

        if(this.counter_mode[i] === 3)
        {
            this.counter_next_low[i] ^= 1;
        }

        var value = this.get_counter_value(i, v86.microtick());

        if(next_low)
        {
            return value & 0xFF;
        }
        else
        {
            return value >> 8;
        }
    }
};

PIT.prototype.counter_write = function(i, value)
{
    if(this.counter_next_low[i])
    {
        this.counter_reload[i] = this.counter_reload[i] & ~0xFF | value;
    }
    else
    {
        this.counter_reload[i] = this.counter_reload[i] & 0xFF | value << 8;
    }

    if(this.counter_read_mode[i] !== 3 || !this.counter_next_low[i])
    {
        if(!this.counter_reload[i])
        {
            this.counter_reload[i] = 0xFFFF;
        }

        // depends on the mode, should actually
        // happen on the first tick
        this.counter_start_value[i] = this.counter_reload[i];

        this.counter_enabled[i] = true;

        this.counter_start_time[i] = v86.microtick();

        dbg_log("counter" + i + " reload=" + h(this.counter_reload[i]) +
                " tick=" + (this.counter_reload[i] || 0x10000) / OSCILLATOR_FREQ + "ms", LOG_PIT);
    }

    if(this.counter_read_mode[i] === 3)
    {
        this.counter_next_low[i] ^= 1;
    }
};

PIT.prototype.port43_write = function(reg_byte)
{
    var mode = reg_byte >> 1 & 7,
        binary_mode = reg_byte & 1,
        i = reg_byte >> 6 & 3,
        read_mode = reg_byte >> 4 & 3;

    if(i === 1)
    {
        dbg_log("Unimplemented timer1", LOG_PIT);
    }

    if(i === 3)
    {
        dbg_log("Unimplemented read back", LOG_PIT);
        return;
    }

    if(read_mode === 0)
    {
        // latch
        this.counter_latch[i] = 2;
        var value = this.get_counter_value(i, v86.microtick());
        dbg_log("latch: " + value, LOG_PIT);
        this.counter_latch_value[i] = value ? value - 1 : 0;

        return;
    }

    if(mode >= 6)
    {
        // 6 and 7 are aliased to 2 and 3
        mode &= ~4;
    }

    dbg_log("Control: mode=" + mode + " ctr=" + i +
            " read_mode=" + read_mode + " bcd=" + binary_mode, LOG_PIT);

    if(read_mode === 1)
    {
        // msb
        this.counter_next_low[i] = 0;
    }
    else if(read_mode === 2)
    {
        // lsb
        this.counter_next_low[i] = 1;
    }
    else
    {
        // first lsb then msb
        this.counter_next_low[i] = 1;
    }

    if(i === 0)
    {
        this.cpu.device_lower_irq(0);
    }

    if(mode === 0)
    {
    }
    else if(mode === 3 || mode === 2)
    {
        // what is the difference
    }
    else
    {
        dbg_log("Unimplemented counter mode: " + h(mode), LOG_PIT);
    }

    this.counter_mode[i] = mode;
    this.counter_read_mode[i] = read_mode;

    if(i === 2)
    {
        this.bus.send("pcspeaker-update", [this.counter_mode[2], this.counter_reload[2]]);
    }
};

PIT.prototype.dump = function()
{
    const reload = this.counter_reload[0];
    const time = (reload || 0x10000) / OSCILLATOR_FREQ;
    dbg_log("counter0 ticks every " + time + "ms (reload=" + reload + ")");
};


// ---- File: src/uart.js ----




// For Types Only



/*
 * Serial ports
 * http://wiki.osdev.org/UART
 * https://github.com/s-macke/jor1k/blob/master/js/worker/dev/uart.js
 * https://www.freebsd.org/doc/en/articles/serial-uart/
 */

const DLAB = 0x80;

const UART_IER_MSI  = 0x08; /* Modem Status Changed int. */
const UART_IER_THRI = 0x02; /* Enable Transmitter holding register int. */
const UART_IER_RDI = 0x01; /* Enable receiver data interrupt */

const UART_IIR_MSI = 0x00; /* Modem status interrupt (Low priority) */
const UART_IIR_NO_INT = 0x01;
const UART_IIR_THRI = 0x02; /* Transmitter holding register empty */
const UART_IIR_RDI = 0x04; /* Receiver data interrupt */
const UART_IIR_RLSI = 0x06; /* Receiver line status interrupt (High p.) */
const UART_IIR_CTI = 0x0c; /* Character timeout */

const UART_LSR_DATA_READY        = 0x1;  // data available
const UART_LSR_TX_EMPTY        = 0x20; // TX (THR) buffer is empty
const UART_LSR_TRANSMITTER_EMPTY = 0x40; // TX empty and line is idle

// Modem status register
const UART_MSR_DCD = 0x7; // Data Carrier Detect
const UART_MSR_RI = 0x6; // Ring Indicator
const UART_MSR_DSR = 0x5; // Data Set Ready
const UART_MSR_CTS = 0x4; // Clear To Send
// Delta bits
const UART_MSR_DDCD = 0x3; // Delta DCD
const UART_MSR_TERI = 0x2; // Trailing Edge RI
const UART_MSR_DDSR = 0x1; // Delta DSR
const UART_MSR_DCTS = 0x0; // Delta CTS


/**
 * @constructor
 * @param {CPU} cpu
 * @param {number} port
 * @param {BusConnector} bus
 */
function UART(cpu, port, bus)
{
    /** @const @type {BusConnector} */
    this.bus = bus;

    /** @const @type {CPU} */
    this.cpu = cpu;

    this.ints = 1 << UART_IIR_THRI;

    this.baud_rate = 0;

    this.line_control = 0;

    // line status register
    this.lsr = UART_LSR_TRANSMITTER_EMPTY | UART_LSR_TX_EMPTY;

    this.fifo_control = 0;

    // interrupts enable
    this.ier = 0;

    // interrupt identification register
    this.iir = UART_IIR_NO_INT;

    this.modem_control = 0;
    this.modem_status = 0;

    this.scratch_register = 0;

    this.irq = 0;

    this.input = [];

    this.current_line = "";

    switch(port)
    {
        case 0x3F8:
            this.com = 0;
            this.irq = 4;
            break;
        case 0x2F8:
            this.com = 1;
            this.irq = 3;
            break;
        case 0x3E8:
            this.com = 2;
            this.irq = 4;
            break;
        case 0x2E8:
            this.com = 3;
            this.irq = 3;
            break;
        default:
            dbg_log("Invalid serial port: " + h(port), LOG_SERIAL);
            this.com = 0;
            this.irq = 4;
    }

    this.bus.register("serial" + this.com + "-input", function(data)
    {
        this.data_received(data);
    }, this);

    this.bus.register("serial" + this.com + "-modem-status-input", function(data)
    {
        this.set_modem_status(data);
    }, this);

    // Set individual modem status bits

    this.bus.register("serial" + this.com + "-carrier-detect-input", function(data)
    {
        const status = data ?
            this.modem_status | (1 << UART_MSR_DCD) | (1 << UART_MSR_DDCD) :
            this.modem_status & ~(1 << UART_MSR_DCD) & ~(1 << UART_MSR_DDCD);
        this.set_modem_status(status);
    }, this);

    this.bus.register("serial" + this.com + "-ring-indicator-input", function(data)
    {
        const status = data ?
            this.modem_status | (1 << UART_MSR_RI) | (1 << UART_MSR_TERI) :
            this.modem_status & ~(1 << UART_MSR_RI) & ~(1 << UART_MSR_TERI);
        this.set_modem_status(status);
    }, this);

    this.bus.register("serial" + this.com + "-data-set-ready-input", function(data)
    {
        const status = data ?
            this.modem_status | (1 << UART_MSR_DSR) | (1 << UART_MSR_DDSR) :
            this.modem_status & ~(1 << UART_MSR_DSR) & ~(1 << UART_MSR_DDSR);
        this.set_modem_status(status);
    }, this);

    this.bus.register("serial" + this.com + "-clear-to-send-input", function(data)
    {
        const status = data ?
            this.modem_status | (1 << UART_MSR_CTS) | (1 << UART_MSR_DCTS) :
            this.modem_status & ~(1 << UART_MSR_CTS) & ~(1 << UART_MSR_DCTS);
        this.set_modem_status(status);
    }, this);

    var io = cpu.io;

    io.register_write(port, this, function(out_byte)
    {
        this.write_data(out_byte);
    }, function(out_word)
    {
        this.write_data(out_word & 0xFF);
        this.write_data(out_word >> 8);
    });

    io.register_write(port | 1, this, function(out_byte)
    {
        if(this.line_control & DLAB)
        {
            this.baud_rate = this.baud_rate & 0xFF | out_byte << 8;
            dbg_log("baud rate: " + h(this.baud_rate), LOG_SERIAL);
        }
        else
        {
            if((this.ier & UART_IIR_THRI) === 0 && (out_byte & UART_IIR_THRI))
            {
                // re-throw THRI if it was masked
                this.ThrowInterrupt(UART_IIR_THRI);
            }

            this.ier = out_byte & 0xF;
            dbg_log("interrupt enable: " + h(out_byte), LOG_SERIAL);
            this.CheckInterrupt();
        }
    });

    io.register_read(port, this, function()
    {
        if(this.line_control & DLAB)
        {
            return this.baud_rate & 0xFF;
        }
        else
        {
            let data = 0;

            if(this.input.length === 0)
            {
                dbg_log("Read input empty", LOG_SERIAL);
            }
            else
            {
                data = this.input.shift();
                dbg_log("Read input: " + h(data), LOG_SERIAL);
            }

            if(this.input.length === 0)
            {
                this.lsr &= ~UART_LSR_DATA_READY;
                this.ClearInterrupt(UART_IIR_CTI);
                this.ClearInterrupt(UART_IIR_RDI);
            }

            return data;
        }
    });

    io.register_read(port | 1, this, function()
    {
        if(this.line_control & DLAB)
        {
            return this.baud_rate >> 8;
        }
        else
        {
            return this.ier & 0xF;
        }
    });

    io.register_read(port | 2, this, function()
    {
        var ret = this.iir & 0xF;
        dbg_log("read interrupt identification: " + h(this.iir), LOG_SERIAL);

        if(this.iir === UART_IIR_THRI) {
            this.ClearInterrupt(UART_IIR_THRI);
        }

        if(this.fifo_control & 1) ret |= 0xC0;

        return ret;
    });
    io.register_write(port | 2, this, function(out_byte)
    {
        dbg_log("fifo control: " + h(out_byte), LOG_SERIAL);
        this.fifo_control = out_byte;
    });

    io.register_read(port | 3, this, function()
    {
        dbg_log("read line control: " + h(this.line_control), LOG_SERIAL);
        return this.line_control;
    });
    io.register_write(port | 3, this, function(out_byte)
    {
        dbg_log("line control: " + h(out_byte), LOG_SERIAL);
        this.line_control = out_byte;
    });


    io.register_read(port | 4, this, function()
    {
        return this.modem_control;
    });
    io.register_write(port | 4, this, function(out_byte)
    {
        dbg_log("modem control: " + h(out_byte), LOG_SERIAL);
        this.modem_control = out_byte;
    });

    io.register_read(port | 5, this, function()
    {
        dbg_log("read line status: " + h(this.lsr), LOG_SERIAL);
        return this.lsr;
    });
    io.register_write(port | 5, this, function(out_byte)
    {
        dbg_log("Factory test write", LOG_SERIAL);
    });

    io.register_read(port | 6, this, function()
    {
        dbg_log("read modem status: " + h(this.modem_status), LOG_SERIAL);
        // Clear delta bits
        this.modem_status &= 0xF0;
        return this.modem_status;
    });
    io.register_write(port | 6, this, function(out_byte)
    {
        dbg_log("write modem status: " + h(out_byte), LOG_SERIAL);
        this.set_modem_status(out_byte);
    });

    io.register_read(port | 7, this, function()
    {
        return this.scratch_register;
    });
    io.register_write(port | 7, this, function(out_byte)
    {
        this.scratch_register = out_byte;
    });
}

UART.prototype.get_state = function()
{
    var state = [];

    state[0] = this.ints;
    state[1] = this.baud_rate;
    state[2] = this.line_control;
    state[3] = this.lsr;
    state[4] = this.fifo_control;
    state[5] = this.ier;
    state[6] = this.iir;
    state[7] = this.modem_control;
    state[8] = this.modem_status;
    state[9] = this.scratch_register;
    state[10] = this.irq;

    return state;
};

UART.prototype.set_state = function(state)
{
    this.ints = state[0];
    this.baud_rate = state[1];
    this.line_control = state[2];
    this.lsr = state[3];
    this.fifo_control = state[4];
    this.ier = state[5];
    this.iir = state[6];
    this.modem_control = state[7];
    this.modem_status = state[8];
    this.scratch_register = state[9];
    this.irq = state[10];
};

UART.prototype.CheckInterrupt = function() {
    if((this.ints & (1 << UART_IIR_CTI))  && (this.ier & UART_IER_RDI)) {
        this.iir = UART_IIR_CTI;
        this.cpu.device_raise_irq(this.irq);
    } else
    if((this.ints & (1 << UART_IIR_RDI))  && (this.ier & UART_IER_RDI)) {
        this.iir = UART_IIR_RDI;
        this.cpu.device_raise_irq(this.irq);
    } else
    if((this.ints & (1 << UART_IIR_THRI)) && (this.ier & UART_IER_THRI)) {
        this.iir = UART_IIR_THRI;
        this.cpu.device_raise_irq(this.irq);
    } else
    if((this.ints & (1 << UART_IIR_MSI))  && (this.ier & UART_IER_MSI)) {
        this.iir = UART_IIR_MSI;
        this.cpu.device_raise_irq(this.irq);
    } else {
        this.iir = UART_IIR_NO_INT;
        this.cpu.device_lower_irq(this.irq);
    }
};

UART.prototype.ThrowInterrupt = function(line) {
    this.ints |= (1 << line);
    this.CheckInterrupt();
};

UART.prototype.ClearInterrupt = function(line) {
    this.ints &= ~(1 << line);
    this.CheckInterrupt();
};

/**
 * @param {number} data
 */
UART.prototype.data_received = function(data)
{
    dbg_log("input: " + h(data), LOG_SERIAL);
    this.input.push(data);

    this.lsr |= UART_LSR_DATA_READY;

    if(this.fifo_control & 1)
    {
        this.ThrowInterrupt(UART_IIR_CTI);
    }
    else
    {
        this.ThrowInterrupt(UART_IIR_RDI);
    }
};

UART.prototype.write_data = function(out_byte)
{
    if(this.line_control & DLAB)
    {
        this.baud_rate = this.baud_rate & ~0xFF | out_byte;
        return;
    }

    dbg_log("data: " + h(out_byte), LOG_SERIAL);

    this.ThrowInterrupt(UART_IIR_THRI);

    this.bus.send("serial" + this.com + "-output-byte", out_byte);

    if(DEBUG)
    {
        var char = String.fromCharCode(out_byte);
        this.current_line += char;

        if(char === "\n")
        {
            const line = this.current_line.trimRight().replace(/[\x00-\x08\x0b-\x1f\x7f\x80-\xff]/g, "");
            dbg_log("SERIAL: " + line);
            this.current_line = "";
        }
    }
};

UART.prototype.set_modem_status = function(status)
{
    dbg_log("modem status: " + h(status), LOG_SERIAL);
    const prev_delta_bits = this.modem_status & 0x0F;
    // compare the bits that have changed and shift them into the delta bits
    let delta = (this.modem_status ^ status) >> 4;
    // The delta should stay set if they were previously set
    delta |= prev_delta_bits;

    // update the current modem status
    this.modem_status = status;
    // update the delta bits based on the changes and previous
    // values, but also leave the delta bits set if they were
    // passed in as part of the status
    this.modem_status |= delta;
};


// ---- File: src/pci.js ----




// For Types Only


// http://wiki.osdev.org/PCI

const PCI_CONFIG_ADDRESS = 0xCF8;
const PCI_CONFIG_DATA = 0xCFC;

/**
 * @constructor
 * @param {CPU} cpu
 */
function PCI(cpu)
{
    this.pci_addr = new Uint8Array(4);
    this.pci_value = new Uint8Array(4);
    this.pci_response = new Uint8Array(4);
    this.pci_status = new Uint8Array(4);

    this.pci_addr32 = new Int32Array(this.pci_addr.buffer);
    this.pci_value32 = new Int32Array(this.pci_value.buffer);
    this.pci_response32 = new Int32Array(this.pci_response.buffer);
    this.pci_status32 = new Int32Array(this.pci_status.buffer);

    this.device_spaces = [];
    this.devices = [];

    /** @const @type {CPU} */
    this.cpu = cpu;

    for(var i = 0; i < 256; i++)
    {
        this.device_spaces[i] = undefined;
        this.devices[i] = undefined;
    }

    this.io = cpu.io;

    cpu.io.register_write(PCI_CONFIG_DATA, this,
        function(value)
        {
            this.pci_write8(this.pci_addr32[0], value);
        },
        function(value)
        {
            this.pci_write16(this.pci_addr32[0], value);
        },
        function(value)
        {
            this.pci_write32(this.pci_addr32[0], value);
        });

    cpu.io.register_write(PCI_CONFIG_DATA + 1, this,
        function(value)
        {
            this.pci_write8(this.pci_addr32[0] + 1 | 0, value);
        });

    cpu.io.register_write(PCI_CONFIG_DATA + 2, this,
        function(value)
        {
            this.pci_write8(this.pci_addr32[0] + 2 | 0, value);
        },
        function(value)
        {
            this.pci_write16(this.pci_addr32[0] + 2 | 0, value);
        });

    cpu.io.register_write(PCI_CONFIG_DATA + 3, this,
        function(value)
        {
            this.pci_write8(this.pci_addr32[0] + 3 | 0, value);
        });

    cpu.io.register_read_consecutive(PCI_CONFIG_DATA, this,
        function()
        {
            return this.pci_response[0];
        },
        function()
        {
            return this.pci_response[1];
        },
        function()
        {
            return this.pci_response[2];
        },
        function()
        {
            return this.pci_response[3];
        }
    );

    cpu.io.register_read_consecutive(PCI_CONFIG_ADDRESS, this,
        function()
        {
            return this.pci_status[0];
        },
        function()
        {
            return this.pci_status[1];
        },
        function()
        {
            return this.pci_status[2];
        },
        function()
        {
            return this.pci_status[3];
        }
    );

    cpu.io.register_write_consecutive(PCI_CONFIG_ADDRESS, this,
        function(out_byte)
        {
            this.pci_addr[0] = out_byte & 0xFC;
        },
        function(out_byte)
        {
            if((this.pci_addr[1] & 0x06) === 0x02 && (out_byte & 0x06) === 0x06)
            {
                dbg_log("CPU reboot via PCI");
                cpu.reboot_internal();
                return;
            }

            this.pci_addr[1] = out_byte;
        },
        function(out_byte)
        {
            this.pci_addr[2] = out_byte;
        },
        function(out_byte)
        {
            this.pci_addr[3] = out_byte;
            this.pci_query();
        }
    );


    // Some experimental PCI devices taken from my PC:

    // 00:00.0 Host bridge: Intel Corporation 4 Series Chipset DRAM Controller (rev 02)
    //var host_bridge = {
    //    pci_id: 0,
    //    pci_space: [
    //        0x86, 0x80, 0x20, 0x2e, 0x06, 0x00, 0x90, 0x20, 0x02, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00,
    //        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    //        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x43, 0x10, 0xd3, 0x82,
    //        0x00, 0x00, 0x00, 0x00, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    //    ],
    //    pci_bars: [],
    //};

    // This needs to be set in order for seabios to not execute code outside of
    // mapped memory. While we map the BIOS into high memory, we don't allow
    // executing code there, which enables optimisations in read_imm8.
    // See [make_bios_writable_intel] in src/fw/shadow.c in seabios for details
    const PAM0 = 0x10;

    var host_bridge = {
        pci_id: 0,
        pci_space: [
            // 00:00.0 Host bridge: Intel Corporation 440FX - 82441FX PMC [Natoma] (rev 02)
            0x86, 0x80, 0x37, 0x12, 0x00, 0x00, 0x00, 0x00,  0x02, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  0x00, PAM0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ],
        pci_bars: [],
        name: "82441FX PMC",
    };
    this.register_device(host_bridge);

    this.isa_bridge = {
        pci_id: 1 << 3,
        pci_space: [
            // 00:01.0 ISA bridge: Intel Corporation 82371SB PIIX3 ISA [Natoma/Triton II]
            0x86, 0x80, 0x00, 0x70, 0x07, 0x00, 0x00, 0x02, 0x00, 0x00, 0x01, 0x06, 0x00, 0x00, 0x80, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ],
        pci_bars: [],
        name: "82371SB PIIX3 ISA",
    };
    this.isa_bridge_space = this.register_device(this.isa_bridge);
    this.isa_bridge_space8 = new Uint8Array(this.isa_bridge_space.buffer);

    // 00:1e.0 PCI bridge: Intel Corporation 82801 PCI Bridge (rev 90)
    //this.register_device([
    //    0x86, 0x80, 0x4e, 0x24, 0x07, 0x01, 0x10, 0x00, 0x90, 0x01, 0x04, 0x06, 0x00, 0x00, 0x01, 0x00,
    //    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, 0x05, 0x20, 0xe0, 0xe0, 0x80, 0x22,
    //    0xb0, 0xfe, 0xb0, 0xfe, 0xf1, 0xff, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    //    0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0x00, 0x02, 0x00,
    //], 0x1e << 3);
}

PCI.prototype.get_state = function()
{
    var state = [];

    for(var i = 0; i < 256; i++)
    {
        state[i] = this.device_spaces[i];
    }

    state[256] = this.pci_addr;
    state[257] = this.pci_value;
    state[258] = this.pci_response;
    state[259] = this.pci_status;

    return state;
};

PCI.prototype.set_state = function(state)
{
    for(var i = 0; i < 256; i++)
    {
        var device = this.devices[i];
        var space = state[i];

        if(!device || !space)
        {
            if(device)
            {
                dbg_log("Warning: While restoring PCI device: Device exists in current " +
                        "configuration but not in snapshot (" + device.name + ")");
            }
            if(space)
            {
                dbg_log("Warning: While restoring PCI device: Device doesn't exist in current " +
                        "configuration but does in snapshot (device " + h(i, 2) + ")");
            }
            continue;
        }

        for(var bar_nr = 0; bar_nr < device.pci_bars.length; bar_nr++)
        {
            var value = space[(0x10 >> 2) + bar_nr];

            if(value & 1)
            {
                var bar = device.pci_bars[bar_nr];
                var from = bar.original_bar & ~1 & 0xFFFF;
                var to = value & ~1 & 0xFFFF;
                this.set_io_bars(bar, from, to);
            }
            else
            {
                // memory, cannot be changed
            }
        }

        this.device_spaces[i].set(space);
    }

    this.pci_addr.set(state[256]);
    this.pci_value.set(state[257]);
    this.pci_response.set(state[258]);
    this.pci_status.set(state[259]);
};

PCI.prototype.pci_query = function()
{
    var dbg_line = "query";

    // Bit | .31                     .0
    // Fmt | EBBBBBBBBDDDDDFFFRRRRRR00

    var bdf = this.pci_addr[2] << 8 | this.pci_addr[1],
        addr = this.pci_addr[0] & 0xFC,
        //devfn = bdf & 0xFF,
        //bus = bdf >> 8,
        dev = bdf >> 3 & 0x1F,
        //fn = bdf & 7,
        enabled = this.pci_addr[3] >> 7;

    dbg_line += " enabled=" + enabled;
    dbg_line += " bdf=" + h(bdf, 4);
    dbg_line += " dev=" + h(dev, 2);
    dbg_line += " addr=" + h(addr, 2);

    var device = this.device_spaces[bdf];

    if(device !== undefined)
    {
        this.pci_status32[0] = 0x80000000 | 0;

        if(addr < device.byteLength)
        {
            this.pci_response32[0] = device[addr >> 2];
        }
        else
        {
            // required by freebsd-9.1
            this.pci_response32[0] = 0;
        }

        dbg_line += " " + h(this.pci_addr32[0] >>> 0, 8) + " -> " + h(this.pci_response32[0] >>> 0, 8);

        if(addr >= device.byteLength)
        {
            dbg_line += " (undef)";
        }

        dbg_line += " (" + this.devices[bdf].name + ")";

        dbg_log(dbg_line, LOG_PCI);
    }
    else
    {
        this.pci_response32[0] = -1;
        this.pci_status32[0] = 0;
    }
};

PCI.prototype.pci_write8 = function(address, written)
{
    var bdf = address >> 8 & 0xFFFF;
    var addr = address & 0xFF;

    var space = new Uint8Array(this.device_spaces[bdf].buffer);
    var device = this.devices[bdf];

    if(!space)
    {
        return;
    }

    dbg_assert(!(addr >= 0x10 && addr < 0x2C || addr >= 0x30 && addr < 0x34),
               "PCI: Expected 32-bit write, got 8-bit (addr: " + h(addr) + ")");

    dbg_log("PCI write8 dev=" + h(bdf >> 3, 2) + " (" + device.name + ") addr=" + h(addr, 4) +
            " value=" + h(written, 2), LOG_PCI);

    space[addr] = written;
};

PCI.prototype.pci_write16 = function(address, written)
{
    dbg_assert((address & 1) === 0);

    var bdf = address >> 8 & 0xFFFF;
    var addr = address & 0xFF;

    var space = new Uint16Array(this.device_spaces[bdf].buffer);
    var device = this.devices[bdf];

    if(!space)
    {
        return;
    }

    if(addr >= 0x10 && addr < 0x2C)
    {
        // Bochs bios
        dbg_log("Warning: PCI: Expected 32-bit write, got 16-bit (addr: " + h(addr) + ")");
        return;
    }

    dbg_assert(!(addr >= 0x30 && addr < 0x34),
        "PCI: Expected 32-bit write, got 16-bit (addr: " + h(addr) + ")");

    dbg_log("PCI writ16 dev=" + h(bdf >> 3, 2) + " (" + device.name + ") addr=" + h(addr, 4) +
            " value=" + h(written, 4), LOG_PCI);

    space[addr >>> 1] = written;
};

PCI.prototype.pci_write32 = function(address, written)
{
    dbg_assert((address & 3) === 0);

    var bdf = address >> 8 & 0xFFFF;
    var addr = address & 0xFF;

    var space = this.device_spaces[bdf];
    var device = this.devices[bdf];

    if(!space)
    {
        return;
    }

    if(addr >= 0x10 && addr < 0x28)
    {
        var bar_nr = addr - 0x10 >> 2;
        var bar = device.pci_bars[bar_nr];

        dbg_log("BAR" + bar_nr + " exists=" + (bar ? "y" : "n") + " changed to " +
                h(written >>> 0) + " dev=" + h(bdf >> 3, 2) + " (" + device.name + ") ", LOG_PCI);

        if(bar)
        {
            dbg_assert(!(bar.size & bar.size - 1), "bar size should be power of 2");

            var space_addr = addr >> 2;
            var type = space[space_addr] & 1;

            if((written | 3 | bar.size - 1)  === -1) // size check
            {
                written = ~(bar.size - 1) | type;

                if(type === 0)
                {
                    space[space_addr] = written;
                }
            }
            else
            {
                if(type === 0)
                {
                    // memory
                    var original_bar = bar.original_bar;

                    if((written & ~0xF) !== (original_bar & ~0xF))
                    {
                        // seabios
                        dbg_log("Warning: Changing memory bar not supported, ignored", LOG_PCI);
                    }

                    // changing isn't supported yet, reset to default
                    space[space_addr] = original_bar;
                }
            }

            if(type === 1)
            {
                // io
                dbg_assert(type === 1);

                var from = space[space_addr] & ~1 & 0xFFFF;
                var to = written & ~1 & 0xFFFF;
                dbg_log("io bar changed from " + h(from >>> 0, 8) +
                        " to " + h(to >>> 0, 8) + " size=" + bar.size, LOG_PCI);
                this.set_io_bars(bar, from, to);
                space[space_addr] = written | 1;
            }
        }
        else
        {
            space[addr >> 2] = 0;
        }

        dbg_log("BAR effective value: " + h(space[addr >> 2] >>> 0), LOG_PCI);
    }
    else if(addr === 0x30)
    {
        dbg_log("PCI write rom address dev=" + h(bdf >> 3, 2) + " (" + device.name + ")" +
                " value=" + h(written >>> 0, 8), LOG_PCI);

        if(device.pci_rom_size)
        {
            if((written | 0x7FF) === (0xFFFFFFFF|0))
            {
                space[addr >> 2] = -device.pci_rom_size | 0;
            }
            else
            {
                space[addr >> 2] = device.pci_rom_address | 0;
            }
        }
        else
        {
            space[addr >> 2] = 0;
        }
    }
    else if(addr === 0x04)
    {
        dbg_log("PCI write dev=" + h(bdf >> 3, 2) + " (" + device.name + ") addr=" + h(addr, 4) +
                " value=" + h(written >>> 0, 8), LOG_PCI);
    }
    else
    {
        dbg_log("PCI write dev=" + h(bdf >> 3, 2) + " (" + device.name + ") addr=" + h(addr, 4) +
                " value=" + h(written >>> 0, 8), LOG_PCI);
        space[addr >>> 2] = written;
    }
};

PCI.prototype.register_device = function(device)
{
    dbg_assert(device.pci_id !== undefined);
    dbg_assert(device.pci_space !== undefined);
    dbg_assert(device.pci_bars !== undefined);

    var device_id = device.pci_id;

    dbg_log("PCI register bdf=" + h(device_id) + " (" + device.name + ")", LOG_PCI);

    dbg_assert(!this.devices[device_id]);
    dbg_assert(device.pci_space.length >= 64);
    dbg_assert(device_id < this.devices.length);

    // convert bytewise notation from lspci to double words
    var space = new Int32Array(64);
    space.set(new Int32Array(new Uint8Array(device.pci_space).buffer));
    this.device_spaces[device_id] = space;
    this.devices[device_id] = device;

    var bar_space = space.slice(4, 10);

    for(var i = 0; i < device.pci_bars.length; i++)
    {
        var bar = device.pci_bars[i];

        if(!bar)
        {
            continue;
        }

        var bar_base = bar_space[i];
        var type = bar_base & 1;

        bar.original_bar = bar_base;
        bar.entries = [];

        if(type === 0)
        {
            // memory, not needed currently
        }
        else
        {
            dbg_assert(type === 1);
            var port = bar_base & ~1;

            for(var j = 0; j < bar.size; j++)
            {
                bar.entries[j] = this.io.ports[port + j];
            }
        }
    }

    return space;
};

PCI.prototype.set_io_bars = function(bar, from, to)
{
    var count = bar.size;
    dbg_log("Move io bars: from=" + h(from) + " to=" + h(to) + " count=" + count, LOG_PCI);

    var ports = this.io.ports;

    for(var i = 0; i < count; i++)
    {
        var old_entry = ports[from + i];

        if(from + i >= 0x1000)
        {
            ports[from + i] = this.io.create_empty_entry();
        }

        if(old_entry.read8 === this.io.empty_port_read8 &&
           old_entry.read16 === this.io.empty_port_read16 &&
           old_entry.read32 === this.io.empty_port_read32 &&
           old_entry.write8 === this.io.empty_port_write &&
           old_entry.write16 === this.io.empty_port_write &&
           old_entry.write32 === this.io.empty_port_write)
        {
            // happens when a device doesn't register its full range (currently ne2k and virtio)
            dbg_log("Warning: Bad IO bar: Source not mapped, port=" + h(from + i, 4), LOG_PCI);
        }

        var entry = bar.entries[i];
        var empty_entry = ports[to + i];
        dbg_assert(entry && empty_entry);

        if(to + i >= 0x1000)
        {
            ports[to + i] = entry;
        }

        if(empty_entry.read8 === this.io.empty_port_read8 ||
            empty_entry.read16 === this.io.empty_port_read16 ||
            empty_entry.read32 === this.io.empty_port_read32 ||
            empty_entry.write8 === this.io.empty_port_write ||
            empty_entry.write16 === this.io.empty_port_write ||
            empty_entry.write32 === this.io.empty_port_write)
        {
            // These can fail if the os maps an io port in multiple bars (indicating a bug)
            // XXX: Fails during restore_state
            dbg_log("Warning: Bad IO bar: Target already mapped, port=" + h(to + i, 4), LOG_PCI);
        }
    }
};

PCI.prototype.raise_irq = function(pci_id)
{
    var space = this.device_spaces[pci_id];
    dbg_assert(space);

    var pin = (space[0x3C >>> 2] >> 8 & 0xFF) - 1;
    var device = (pci_id >> 3) - 1 & 0xFF;
    var parent_pin = pin + device & 3;
    var irq = this.isa_bridge_space8[0x60 + parent_pin];

    //dbg_log("PCI raise irq " + h(irq) + " dev=" + h(device, 2) +
    //        " (" + this.devices[pci_id].name + ")", LOG_PCI);
    this.cpu.device_raise_irq(irq);
};

PCI.prototype.lower_irq = function(pci_id)
{
    var space = this.device_spaces[pci_id];
    dbg_assert(space);

    var pin = space[0x3C >>> 2] >> 8 & 0xFF;
    var device = pci_id >> 3 & 0xFF;
    var parent_pin = pin + device - 2 & 3;
    var irq = this.isa_bridge_space8[0x60 + parent_pin];

    //dbg_log("PCI lower irq " + h(irq) + " dev=" + h(device, 2) +
    //        " (" + this.devices[pci_id].name + ")", LOG_PCI);
    this.cpu.device_lower_irq(irq);
};


// ---- File: src/ne2k.js ----




// For Types Only




// http://www.ethernut.de/pdf/8019asds.pdf

const NE2K_LOG_VERBOSE = false;
const NE2K_LOG_PACKETS = false;

const E8390_CMD = 0x00; /* The command register (for all pages) */

/* Page 0 register offsets. */
const EN0_CLDALO = 0x01; /* Low byte of current local dma addr RD */
const EN0_STARTPG = 0x01; /* Starting page of ring bfr WR */
const EN0_CLDAHI = 0x02; /* High byte of current local dma addr RD */
const EN0_STOPPG = 0x02; /* Ending page +1 of ring bfr WR */
const EN0_BOUNDARY = 0x03; /* Boundary page of ring bfr RD WR */
const EN0_TSR = 0x04; /* Transmit status reg RD */
const EN0_TPSR = 0x04; /* Transmit starting page WR */
const EN0_NCR = 0x05; /* Number of collision reg RD */
const EN0_TCNTLO = 0x05; /* Low byte of tx byte count WR */
const EN0_FIFO = 0x06; /* FIFO RD */
const EN0_TCNTHI = 0x06; /* High byte of tx byte count WR */
const EN0_ISR = 0x07; /* Interrupt status reg RD WR */
const EN0_CRDALO = 0x08; /* low byte of current remote dma address RD */
const EN0_RSARLO = 0x08; /* Remote start address reg 0 */
const EN0_CRDAHI = 0x09; /* high byte, current remote dma address RD */
const EN0_RSARHI = 0x09; /* Remote start address reg 1 */
const EN0_RCNTLO = 0x0a; /* Remote byte count reg WR */
const EN0_RCNTHI = 0x0b; /* Remote byte count reg WR */
const EN0_RSR = 0x0c; /* rx status reg RD */
const EN0_RXCR = 0x0c; /* RX configuration reg WR */
const EN0_TXCR = 0x0d; /* TX configuration reg WR */
const EN0_COUNTER0 = 0x0d; /* Rcv alignment error counter RD */
const EN0_DCFG = 0x0e; /* Data configuration reg WR */
const EN0_COUNTER1 = 0x0e; /* Rcv CRC error counter RD */
const EN0_IMR = 0x0f; /* Interrupt mask reg WR */
const EN0_COUNTER2 = 0x0f; /* Rcv missed frame error counter RD */

const NE_DATAPORT = 0x10; /* NatSemi-defined port window offset. */
const NE_RESET = 0x1f; /* Issue a read to reset, a write to clear. */

/* Bits in EN0_ISR - Interrupt status register */
const ENISR_RX = 0x01; /* Receiver, no error */
const ENISR_TX = 0x02; /* Transmitter, no error */
const ENISR_RX_ERR = 0x04; /* Receiver, with error */
const ENISR_TX_ERR = 0x08; /* Transmitter, with error */
const ENISR_OVER = 0x10; /* Receiver overwrote the ring */
const ENISR_COUNTERS = 0x20; /* Counters need emptying */
const ENISR_RDC = 0x40; /* remote dma complete */
const ENISR_RESET = 0x80; /* Reset completed */
const ENISR_ALL = 0x3f; /* Interrupts we will enable */

const ENRSR_RXOK = 0x01; /* Received a good packet */

const START_PAGE = 0x40;
const START_RX_PAGE = 0x40 + 12;
const STOP_PAGE = 0x80;


// Search and replace MAC addresses in ethernet, arp and dhcp packets.
// Used after restoring an OS from memory dump, so that multiple instances of
// that OS can run at the same time with different external MAC addresses.
// Crude but seems to work.
function translate_mac_address(packet, search_mac, replacement_mac)
{
    if(packet[0] === search_mac[0] &&
       packet[1] === search_mac[1] &&
       packet[2] === search_mac[2] &&
       packet[3] === search_mac[3] &&
       packet[4] === search_mac[4] &&
       packet[5] === search_mac[5])
    {
        dbg_log("Replace mac in eth destination field", LOG_NET);

        packet[0] = replacement_mac[0];
        packet[1] = replacement_mac[1];
        packet[2] = replacement_mac[2];
        packet[3] = replacement_mac[3];
        packet[4] = replacement_mac[4];
        packet[5] = replacement_mac[5];
    }

    if(packet[6 + 0] === search_mac[0] &&
       packet[6 + 1] === search_mac[1] &&
       packet[6 + 2] === search_mac[2] &&
       packet[6 + 3] === search_mac[3] &&
       packet[6 + 4] === search_mac[4] &&
       packet[6 + 5] === search_mac[5])
    {
        dbg_log("Replace mac in eth source field", LOG_NET);

        packet[6 + 0] = replacement_mac[0];
        packet[6 + 1] = replacement_mac[1];
        packet[6 + 2] = replacement_mac[2];
        packet[6 + 3] = replacement_mac[3];
        packet[6 + 4] = replacement_mac[4];
        packet[6 + 5] = replacement_mac[5];
    }

    const ethertype = packet[12] << 8 | packet[13];

    if(ethertype === 0x0800)
    {
        // ipv4
        const ipv4_packet = packet.subarray(14);
        const ipv4_version = ipv4_packet[0] >> 4;

        if(ipv4_version !== 4)
        {
            dbg_log("Expected ipv4.version==4 but got: " + ipv4_version, LOG_NET);
            return;
        }

        const ipv4_ihl = ipv4_packet[0] & 0xF;
        dbg_assert(ipv4_ihl === 5, "TODO: ihl!=5");

        const ipv4_proto = ipv4_packet[9];
        if(ipv4_proto === 0x11)
        {
            // udp
            const udp_packet = ipv4_packet.subarray(5 * 4);
            const source_port = udp_packet[0] << 8 | udp_packet[1];
            const destination_port = udp_packet[2] << 8 | udp_packet[3];
            const checksum = udp_packet[6] << 8 | udp_packet[7];

            dbg_log("udp srcport=" + source_port + " dstport=" + destination_port + " checksum=" + h(checksum, 4), LOG_NET);

            if(source_port === 67 || destination_port === 67)
            {
                // dhcp
                const dhcp_packet = udp_packet.subarray(8);
                const dhcp_magic = dhcp_packet[0xEC] << 24 | dhcp_packet[0xED] << 16 | dhcp_packet[0xEE] << 8 | dhcp_packet[0xEF];

                if(dhcp_magic !== 0x63825363)
                {
                    dbg_log("dhcp packet didn't match magic: " + h(dhcp_magic, 8));
                    return;
                }

                if(dhcp_packet[28 + 0] === search_mac[0] &&
                   dhcp_packet[28 + 1] === search_mac[1] &&
                   dhcp_packet[28 + 2] === search_mac[2] &&
                   dhcp_packet[28 + 3] === search_mac[3] &&
                   dhcp_packet[28 + 4] === search_mac[4] &&
                   dhcp_packet[28 + 5] === search_mac[5])
                {
                    dbg_log("Replace mac in dhcp.chaddr", LOG_NET);

                    dhcp_packet[28 + 0] = replacement_mac[0];
                    dhcp_packet[28 + 1] = replacement_mac[1];
                    dhcp_packet[28 + 2] = replacement_mac[2];
                    dhcp_packet[28 + 3] = replacement_mac[3];
                    dhcp_packet[28 + 4] = replacement_mac[4];
                    dhcp_packet[28 + 5] = replacement_mac[5];

                    udp_packet[6] = udp_packet[7] = 0; // zero udp checksum
                }

                let offset = 0xF0;
                while(offset < dhcp_packet.length)
                {
                    const dhcp_option_type = dhcp_packet[offset++];

                    if(dhcp_option_type === 0xFF)
                    {
                        break;
                    }

                    const length = dhcp_packet[offset++];

                    if(dhcp_option_type === 0x3D && // client identifier
                       dhcp_packet[offset + 0] === 0x01 && // ethernet
                       dhcp_packet[offset + 1] === search_mac[0] &&
                       dhcp_packet[offset + 2] === search_mac[1] &&
                       dhcp_packet[offset + 3] === search_mac[2] &&
                       dhcp_packet[offset + 4] === search_mac[3] &&
                       dhcp_packet[offset + 5] === search_mac[4] &&
                       dhcp_packet[offset + 6] === search_mac[5])
                    {
                        dbg_log("Replace mac in dhcp.clientidentifier", LOG_NET);

                        dhcp_packet[offset + 1] = replacement_mac[0];
                        dhcp_packet[offset + 2] = replacement_mac[1];
                        dhcp_packet[offset + 3] = replacement_mac[2];
                        dhcp_packet[offset + 4] = replacement_mac[3];
                        dhcp_packet[offset + 5] = replacement_mac[4];
                        dhcp_packet[offset + 6] = replacement_mac[5];

                        udp_packet[6] = udp_packet[7] = 0; // zero udp checksum
                    }

                    offset += length;
                }
            }
        }
        else
        {
            // tcp, ...
        }
    }
    else if(ethertype === 0x0806)
    {
        // arp
        const arp_packet = packet.subarray(14);
        dbg_log("arp oper=" + arp_packet[7] + " " + format_mac(arp_packet.subarray(8, 8+6)) + " " + format_mac(arp_packet.subarray(18, 18+6)), LOG_NET);

        if(arp_packet[8 + 0] === search_mac[0] &&
           arp_packet[8 + 1] === search_mac[1] &&
           arp_packet[8 + 2] === search_mac[2] &&
           arp_packet[8 + 3] === search_mac[3] &&
           arp_packet[8 + 4] === search_mac[4] &&
           arp_packet[8 + 5] === search_mac[5])
        {
            dbg_log("Replace mac in arp.sha", LOG_NET);

            arp_packet[8 + 0] = replacement_mac[0];
            arp_packet[8 + 1] = replacement_mac[1];
            arp_packet[8 + 2] = replacement_mac[2];
            arp_packet[8 + 3] = replacement_mac[3];
            arp_packet[8 + 4] = replacement_mac[4];
            arp_packet[8 + 5] = replacement_mac[5];
        }
    }
    else
    {
        // TODO: ipv6, ...
    }
}

function format_mac(mac)
{
    return [
        mac[0].toString(16).padStart(2, "0"),
        mac[1].toString(16).padStart(2, "0"),
        mac[2].toString(16).padStart(2, "0"),
        mac[3].toString(16).padStart(2, "0"),
        mac[4].toString(16).padStart(2, "0"),
        mac[5].toString(16).padStart(2, "0"),
    ].join(":");
}

function dump_packet(packet, prefix)
{
    const ethertype = packet[12] << 8 | packet[13] << 0;
    if(ethertype === 0x0800)
    {
        const ipv4_packet = packet.subarray(14);
        const ipv4_len = ipv4_packet[2] << 8 | ipv4_packet[3];
        const ipv4_proto = ipv4_packet[9];
        if(ipv4_proto === 0x11)
        {
            const udp_packet = ipv4_packet.subarray(5 * 4);
            const source_port = udp_packet[0] << 8 | udp_packet[1];
            const destination_port = udp_packet[2] << 8 | udp_packet[3];
            const checksum = udp_packet[6] << 8 | udp_packet[7];

            if(source_port === 67 || destination_port === 67)
            {
                const dhcp_packet = udp_packet.subarray(8);
                const dhcp_chaddr = dhcp_packet.subarray(28, 28+6);
                dbg_log(prefix + " len=" + packet.length + " ethertype=" + h(ethertype) + " ipv4.len=" + ipv4_len + " ipv4.proto=" + h(packet[14 + 9]) + " udp.srcport=" + source_port + " udp.dstport=" + destination_port + " udp.chksum=" + h(checksum, 4) + " dhcp.chaddr=" + format_mac(dhcp_chaddr));
            }
            else
            {
                dbg_log(prefix + " len=" + packet.length + " ethertype=" + h(ethertype) + " ipv4.len=" + ipv4_len + " ipv4.proto=" + h(packet[14 + 9]) + " udp.srcport=" + source_port + " udp.dstport=" + destination_port + " udp.chksum=" + h(checksum, 4));
            }
        }
        else if(ipv4_proto === 0x01)
        {
        }
        else
        {
            dbg_log(prefix + " len=" + packet.length + " ethertype=" + h(ethertype) + " ipv4.len=" + ipv4_len + " ipv4.proto=" + h(packet[14 + 9]));
        }
    }
    else
    {
        const arp_packet = packet.subarray(14);
        dbg_log(prefix + " len=" + packet.length + " ethertype=" + h(ethertype) + " arp");
    }
    dbg_log(hex_dump(packet));
}

/**
 * @constructor
 * @param {CPU} cpu
 * @param {BusConnector} bus
 * @param {Boolean} preserve_mac_from_state_image
 * @param {Boolean} mac_address_translation
 * @param {number} [id=0] id
 */
function Ne2k(cpu, bus, preserve_mac_from_state_image, mac_address_translation, id)
{
    /** @const @type {CPU} */
    this.cpu = cpu;

    /** @const @type {PCI} */
    this.pci = cpu.devices.pci;

    this.id = id || 0;
    this.preserve_mac_from_state_image = preserve_mac_from_state_image;
    this.mac_address_translation = mac_address_translation;

    /** @const @type {BusConnector} */
    this.bus = bus;
    this.bus.register("net" + this.id + "-receive", function(data)
    {
        this.receive(data);
    }, this);

    this.port = 0x300 + 0x100 * this.id;

    this.name = "ne2k";

    const use_pci = true;

    if(use_pci)
    {
        this.pci_space = [
            0xec, 0x10, 0x29, 0x80, 0x03, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00,
            this.port & 0xFF | 1, this.port >> 8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf4, 0x1a, 0x00, 0x11,
            0x00, 0x00, 0xb8, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
        ];
        this.pci_id = (this.id === 0 ? 0x05 : (0x07 + this.id)) << 3;
        this.pci_bars = [
            {
                size: 32,
            },
        ];
    }

    this.isr = 0;
    this.imr = 0; // interrupt mask register

    this.cr = 1;

    this.dcfg = 0;

    this.rcnt = 0;

    this.tcnt = 0;
    this.tpsr = 0;
    this.memory = new Uint8Array(256 * 0x80);

    this.rxcr = 0;
    this.txcr = 0;
    this.tsr = 1;

    // mac address
    this.mac = new Uint8Array([
        0x00, 0x22, 0x15,
        Math.random() * 255 | 0,
        Math.random() * 255 | 0,
        Math.random() * 255 | 0,
    ]);

    this.bus.send("net" + this.id + "-mac", format_mac(this.mac));

    // multicast addresses
    this.mar = Uint8Array.of(0xFF, 0xFF, 0xFF, 0xFF,  0xFF, 0xFF, 0xFF, 0xFF);

    // Used for mac address translation
    // The mac the OS thinks it has
    this.mac_address_in_state = null;

    for(var i = 0; i < 6; i++)
    {
        this.memory[i << 1] = this.memory[i << 1 | 1] = this.mac[i];
    }

    // the PROM signature of 0x57, 0x57 is also doubled
    // resulting in setting the 4 bytes at the end, 28, 29, 30 and 31 to 0x57
    this.memory[14 << 1] = this.memory[14 << 1 | 1] = 0x57;
    this.memory[15 << 1] = this.memory[15 << 1 | 1] = 0x57;

    dbg_log("Mac: " + format_mac(this.mac), LOG_NET);

    this.rsar = 0;

    this.pstart = START_PAGE;
    this.pstop = STOP_PAGE;

    this.curpg = START_RX_PAGE;
    this.boundary = START_RX_PAGE;

    var io = cpu.io;

    io.register_read(this.port | E8390_CMD, this, function()
    {
        dbg_log("Read cmd", LOG_NET);
        return this.cr;
    });

    io.register_write(this.port | E8390_CMD, this, function(data_byte)
    {
        this.cr = data_byte;
        dbg_log("Write command: " + h(data_byte, 2) + " newpg=" + (this.cr >> 6) + " txcr=" + h(this.txcr, 2), LOG_NET);

        if(this.cr & 1)
        {
            return;
        }

        if((data_byte & 0x18) && this.rcnt === 0)
        {
            this.do_interrupt(ENISR_RDC);
        }

        if(data_byte & 4)
        {
            var start = this.tpsr << 8;
            var data = this.memory.subarray(start, start + this.tcnt);

            if(NE2K_LOG_PACKETS)
            {
                dump_packet(data, "send");
            }

            if(this.mac_address_in_state)
            {
                data = new Uint8Array(data); // make a copy
                translate_mac_address(data, this.mac_address_in_state, this.mac);
            }

            this.bus.send("net" + this.id + "-send", data);
            this.bus.send("eth-transmit-end", [data.length]);
            this.cr &= ~4;
            this.do_interrupt(ENISR_TX);

            dbg_log("Command: Transfer. length=" + h(data.byteLength), LOG_NET);
        }
    });

    io.register_read(this.port | EN0_COUNTER0, this, function()
    {
        var pg = this.get_page();
        if(pg === 1)
        {
            dbg_log("Read mar5", LOG_NET);
            return this.mar[5];
        }
        else
        {
            dbg_log("Read counter0 pg=" + pg, LOG_NET);
            return 0;
        }
    });

    io.register_read(this.port | EN0_COUNTER1, this, function()
    {
        var pg = this.get_page();
        if(pg === 1)
        {
            dbg_log("Read mar6", LOG_NET);
            return this.mar[6];
        }
        else
        {
            dbg_log("Read8 counter1 pg=" + pg, LOG_NET);
            return 0;
        }
    }, function()
    {
        dbg_log("Read16 counter1 pg=" + this.get_page(), LOG_NET);
        // openbsd
        return 0;
    }
    );

    io.register_read(this.port | EN0_COUNTER2, this, function()
    {
        var pg = this.get_page();
        if(pg === 1)
        {
            dbg_log("Read mar7", LOG_NET);
            return this.mar[7];
        }
        else
        {
            dbg_log("Read counter2 pg=" + pg, LOG_NET);
            return 0;
        }
    });

    io.register_read(this.port | NE_RESET, this, function()
    {
        var pg = this.get_page();
        dbg_log("Read reset", LOG_NET);
        this.do_interrupt(ENISR_RESET);
        return 0;
    });

    io.register_write(this.port | NE_RESET, this, function(data_byte)
    {
        var pg = this.get_page();
        dbg_log("Write reset: " + h(data_byte, 2), LOG_NET);
        //this.isr &= ~ENISR_RESET;
    });

    io.register_read(this.port | EN0_STARTPG, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            return this.pstart;
        }
        else if(pg === 1)
        {
            dbg_log("Read pg1/01 (mac[0])", LOG_NET);
            return this.mac[0];
        }
        else if(pg === 2)
        {
            return this.pstart;
        }
        else
        {
            dbg_log("Read pg" + pg + "/01");
            dbg_assert(false);
            return 0;
        }
    });

    io.register_write(this.port | EN0_STARTPG, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("start page: " + h(data_byte, 2), LOG_NET);
            this.pstart = data_byte;
        }
        else if(pg === 1)
        {
            dbg_log("mac[0] = " + h(data_byte), LOG_NET);
            this.mac[0] = data_byte;
        }
        else if(pg === 3)
        {
            dbg_log("Unimplemented: Write pg3/01 (9346CR): " + h(data_byte), LOG_NET);
        }
        else
        {
            dbg_log("Write pg" + pg + "/01: " + h(data_byte), LOG_NET);
            dbg_assert(false);
        }
    });


    io.register_read(this.port | EN0_STOPPG, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            return this.pstop;
        }
        else if(pg === 1)
        {
            dbg_log("Read pg1/02 (mac[1])", LOG_NET);
            return this.mac[1];
        }
        else if(pg === 2)
        {
            return this.pstop;
        }
        else
        {
            dbg_log("Read pg" + pg + "/02", LOG_NET);
            dbg_assert(false);
            return 0;
        }
    });

    io.register_write(this.port | EN0_STOPPG, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("stop page: " + h(data_byte, 2), LOG_NET);
            if(data_byte > (this.memory.length >> 8))
            {
                data_byte = this.memory.length >> 8;
                dbg_log("XXX: Adjusting stop page to " + h(data_byte), LOG_NET);
            }
            this.pstop = data_byte;
        }
        else if(pg === 1)
        {
            dbg_log("mac[1] = " + h(data_byte), LOG_NET);
            this.mac[1] = data_byte;
        }
        else
        {
            dbg_log("Write pg" + pg + "/02: " + h(data_byte), LOG_NET);
            dbg_assert(false);
        }
    });

    io.register_read(this.port | EN0_ISR, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Read isr: " + h(this.isr, 2), LOG_NET);
            return this.isr;
        }
        else if(pg === 1)
        {
            dbg_log("Read curpg: " + h(this.curpg, 2), LOG_NET);
            return this.curpg;
        }
        else
        {
            dbg_assert(false);
            return 0;
        }
    });

    io.register_write(this.port | EN0_ISR, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            // acknowledge interrupts where bit is set
            dbg_log("Write isr: " + h(data_byte, 2), LOG_NET);
            this.isr &= ~data_byte;
            this.update_irq();
        }
        else if(pg === 1)
        {
            dbg_log("Write curpg: " + h(data_byte, 2), LOG_NET);
            this.curpg = data_byte;
        }
        else
        {
            dbg_assert(false);
        }
    });

    io.register_write(this.port | EN0_TXCR, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            this.txcr = data_byte;
            dbg_log("Write tx config: " + h(data_byte, 2), LOG_NET);
        }
        else
        {
            dbg_log("Unimplemented: Write pg" + pg + "/0d " + h(data_byte, 2), LOG_NET);
        }
    });

    io.register_write(this.port | EN0_DCFG, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Write data configuration: " + h(data_byte, 2), LOG_NET);
            this.dcfg = data_byte;
        }
        else
        {
            dbg_log("Unimplemented: Write pg" + pg + "/0e " + h(data_byte, 2), LOG_NET);
        }
    });

    io.register_read(this.port | EN0_RCNTLO, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Read pg0/0a", LOG_NET);
            return 0x50;
        }
        else if(pg === 1)
        {
            dbg_log("Read mar2", LOG_NET);
            return this.mar[2];
        }
        else
        {
            dbg_assert(false, "TODO");
            return 0;
        }
    });

    io.register_write(this.port | EN0_RCNTLO, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Write remote byte count low: " + h(data_byte, 2), LOG_NET);
            this.rcnt = this.rcnt & 0xFF00 | data_byte & 0xFF;
        }
        else
        {
            dbg_log("Unimplemented: Write pg" + pg + "/0a " + h(data_byte, 2), LOG_NET);
        }
    });

    io.register_read(this.port | EN0_RCNTHI, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Read pg0/0b", LOG_NET);
            return 0x43;
        }
        else if(pg === 1)
        {
            dbg_log("Read mar3", LOG_NET);
            return this.mar[3];
        }
        else
        {
            dbg_assert(false, "TODO");
            return 0;
        }
    });

    io.register_write(this.port | EN0_RCNTHI, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Write remote byte count high: " + h(data_byte, 2), LOG_NET);
            this.rcnt = this.rcnt & 0xFF | data_byte << 8 & 0xFF00;
        }
        else
        {
            dbg_log("Unimplemented: Write pg" + pg + "/0b " + h(data_byte, 2), LOG_NET);
        }
    });

    io.register_read(this.port | EN0_RSARLO, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Read remote start address low", LOG_NET);
            return this.rsar & 0xFF;
        }
        else if(pg === 1)
        {
            dbg_log("Read mar0", LOG_NET);
            return this.mar[0];
        }
        else
        {
            dbg_log("Unimplemented: Read pg" + pg + "/08", LOG_NET);
            dbg_assert(false);
            return 0;
        }
    });

    io.register_write(this.port | EN0_RSARLO, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Write remote start address low: " + h(data_byte, 2), LOG_NET);
            this.rsar = this.rsar & 0xFF00 | data_byte & 0xFF;
        }
        else
        {
            dbg_log("Unimplemented: Write pg" + pg + "/08 " + h(data_byte, 2), LOG_NET);
        }
    });

    io.register_read(this.port | EN0_RSARHI, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Read remote start address high", LOG_NET);
            return this.rsar >> 8 & 0xFF;
        }
        else if(pg === 1)
        {
            dbg_log("Read mar1", LOG_NET);
            return this.mar[1];
        }
        else
        {
            dbg_log("Unimplemented: Read pg" + pg + "/09", LOG_NET);
            dbg_assert(false);
            return 0;
        }
    });

    io.register_write(this.port | EN0_RSARHI, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Write remote start address low: " + h(data_byte, 2), LOG_NET);
            this.rsar = this.rsar & 0xFF | data_byte << 8 & 0xFF00;
        }
        else
        {
            dbg_log("Unimplemented: Write pg" + pg + "/09 " + h(data_byte, 2), LOG_NET);
        }
    });

    io.register_write(this.port | EN0_IMR, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Write interrupt mask register: " + h(data_byte, 2) + " isr=" + h(this.isr, 2), LOG_NET);
            this.imr = data_byte;
            this.update_irq();
        }
        else
        {
            dbg_log("Unimplemented: Write pg" + pg + "/0f " + h(data_byte, 2), LOG_NET);
        }
    });

    io.register_read(this.port | EN0_BOUNDARY, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Read boundary: " + h(this.boundary, 2), LOG_NET);
            return this.boundary;
        }
        else if(pg === 1)
        {
            dbg_log("Read pg1/03 (mac[2])", LOG_NET);
            return this.mac[2];
        }
        else if(pg === 3)
        {
            dbg_log("Unimplemented: Read pg3/03 (CONFIG0)", LOG_NET);
            return 0;
        }
        else
        {
            dbg_log("Read pg" + pg + "/03", LOG_NET);
            dbg_assert(false);
            return 0;
        }
    });

    io.register_write(this.port | EN0_BOUNDARY, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Write boundary: " + h(data_byte, 2), LOG_NET);
            this.boundary = data_byte;
        }
        else if(pg === 1)
        {
            dbg_log("mac[2] = " + h(data_byte), LOG_NET);
            this.mac[2] = data_byte;
        }
        else
        {
            dbg_log("Write pg" + pg + "/03: " + h(data_byte), LOG_NET);
            dbg_assert(false);
        }
    });

    io.register_read(this.port | EN0_TSR, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            return this.tsr;
        }
        else if(pg === 1)
        {
            dbg_log("Read pg1/04 (mac[3])", LOG_NET);
            return this.mac[3];
        }
        else
        {
            dbg_log("Read pg" + pg + "/04", LOG_NET);
            dbg_assert(false);
            return 0;
        }
    });

    io.register_write(this.port | EN0_TPSR, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Write tpsr: " + h(data_byte, 2), LOG_NET);
            this.tpsr = data_byte;
        }
        else if(pg === 1)
        {
            dbg_log("mac[3] = " + h(data_byte), LOG_NET);
            this.mac[3] = data_byte;
        }
        else
        {
            dbg_log("Write pg" + pg + "/04: " + h(data_byte), LOG_NET);
            dbg_assert(false);
        }
    });

    io.register_read(this.port | EN0_TCNTLO, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Unimplemented: Read pg0/05 (NCR: Number of Collisions Register)", LOG_NET);
            return 0;
        }
        else if(pg === 1)
        {
            dbg_log("Read pg1/05 (mac[4])", LOG_NET);
            return this.mac[4];
        }
        else if(pg === 3)
        {
            dbg_log("Unimplemented: Read pg3/05 (CONFIG2)", LOG_NET);
            return 0;
        }
        else
        {
            dbg_log("Read pg" + pg + "/05", LOG_NET);
            dbg_assert(false);
            return 0;
        }
    });

    io.register_write(this.port | EN0_TCNTLO, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Write tcnt low: " + h(data_byte, 2), LOG_NET);
            this.tcnt = this.tcnt & ~0xFF | data_byte;
        }
        else if(pg === 1)
        {
            dbg_log("mac[4] = " + h(data_byte), LOG_NET);
            this.mac[4] = data_byte;
        }
        else if(pg === 3)
        {
            dbg_log("Unimplemented: Write pg3/05 (CONFIG2): " + h(data_byte), LOG_NET);
        }
        else
        {
            dbg_log("Write pg" + pg + "/05: " + h(data_byte), LOG_NET);
            dbg_assert(false);
        }
    });

    io.register_read(this.port | EN0_TCNTHI, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_assert(false, "TODO");
            return 0;
        }
        else if(pg === 1)
        {
            dbg_log("Read pg1/06 (mac[5])", LOG_NET);
            return this.mac[5];
        }
        else if(pg === 3)
        {
            dbg_log("Unimplemented: Read pg3/06 (CONFIG3)", LOG_NET);
            return 0;
        }
        else
        {
            dbg_log("Read pg" + pg + "/06", LOG_NET);
            dbg_assert(false);
            return 0;
        }
    });

    io.register_write(this.port | EN0_TCNTHI, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("Write tcnt high: " + h(data_byte, 2), LOG_NET);
            this.tcnt = this.tcnt & 0xFF | data_byte << 8;
        }
        else if(pg === 1)
        {
            dbg_log("mac[5] = " + h(data_byte), LOG_NET);
            this.mac[5] = data_byte;
        }
        else if(pg === 3)
        {
            dbg_log("Unimplemented: Write pg3/06 (CONFIG3): " + h(data_byte), LOG_NET);
        }
        else
        {
            dbg_log("Write pg" + pg + "/06: " + h(data_byte), LOG_NET);
            dbg_assert(false);
        }
    });

    io.register_read(this.port | EN0_RSR, this, function()
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            return 1 | 1 << 3; // receive status ok
        }
        else if(pg === 1)
        {
            dbg_log("Read mar4", LOG_NET);
            return this.mar[4];
        }
        else
        {
            dbg_log("Unimplemented: Read pg" + pg + "/0c", LOG_NET);
            dbg_assert(false);
            return 0;
        }
    });

    io.register_write(this.port | EN0_RXCR, this, function(data_byte)
    {
        var pg = this.get_page();
        if(pg === 0)
        {
            dbg_log("RX configuration reg write: " + h(data_byte, 2), LOG_NET);
            this.rxcr = data_byte;
        }
        else
        {
            dbg_log("Unimplemented: Write pg" + pg + "/0c: " + h(data_byte), LOG_NET);
        }
    });

    io.register_read(this.port | NE_DATAPORT | 0, this,
            this.data_port_read8,
            this.data_port_read16,
            this.data_port_read32);
    io.register_write(this.port | NE_DATAPORT | 0, this,
            this.data_port_write16,
            this.data_port_write16,
            this.data_port_write32);

    if(use_pci)
    {
        cpu.devices.pci.register_device(this);
    }
}

Ne2k.prototype.get_state = function()
{
    var state = [];

    state[0] = this.isr;
    state[1] = this.imr;
    state[2] = this.cr;
    state[3] = this.dcfg;
    state[4] = this.rcnt;
    state[5] = this.tcnt;
    state[6] = this.tpsr;
    state[7] = this.rsar;
    state[8] = this.pstart;
    state[9] = this.curpg;
    state[10] = this.boundary;
    state[11] = this.pstop;
    state[12] = this.rxcr;
    state[13] = this.txcr;
    state[14] = this.tsr;
    state[15] = this.mac;
    state[16] = this.memory;

    return state;
};

Ne2k.prototype.set_state = function(state)
{
    this.isr = state[0];
    this.imr = state[1];
    this.cr = state[2];
    this.dcfg = state[3];
    this.rcnt = state[4];
    this.tcnt = state[5];
    this.tpsr = state[6];
    this.rsar = state[7];
    this.pstart = state[8];
    this.curpg = state[9];
    this.boundary = state[10];
    this.pstop = state[11];
    this.rxcr = state[12];
    this.txcr = state[13];
    this.tsr = state[14];

    if(this.preserve_mac_from_state_image)
    {
        this.mac = state[15];
        this.memory = state[16];
    }
    else if(this.mac_address_translation)
    {
        this.mac_address_in_state = state[15];
        this.memory = state[16];

        dbg_log("Using mac address translation" +
            " guest_os_mac=" + format_mac(this.mac_address_in_state) +
            " real_mac=" + format_mac(this.mac), LOG_NET);
    }
    this.bus.send("net" + this.id + "-mac", format_mac(this.mac));
};

Ne2k.prototype.do_interrupt = function(ir_mask)
{
    dbg_log("Do interrupt " + h(ir_mask, 2), LOG_NET);
    this.isr |= ir_mask;
    this.update_irq();
};

Ne2k.prototype.update_irq = function()
{
    if(this.imr & this.isr)
    {
        this.pci.raise_irq(this.pci_id);
    }
    else
    {
        this.pci.lower_irq(this.pci_id);
    }
};

Ne2k.prototype.data_port_write = function(data_byte)
{
    if(NE2K_LOG_VERBOSE)
    {
        dbg_log("Write data port: data=" + h(data_byte & 0xFF, 2) +
                                " rsar=" + h(this.rsar, 4) +
                                " rcnt=" + h(this.rcnt, 4), LOG_NET);
    }

    if(this.rsar <= 0x10 || this.rsar >= (START_PAGE << 8) && this.rsar < (STOP_PAGE << 8))
    {
        this.memory[this.rsar] = data_byte;
    }

    this.rsar++;
    this.rcnt--;

    if(this.rsar >= (this.pstop << 8))
    {
        this.rsar += (this.pstart - this.pstop) << 8;
    }

    if(this.rcnt === 0)
    {
        this.do_interrupt(ENISR_RDC);
    }
};

Ne2k.prototype.data_port_write16 = function(data)
{
    this.data_port_write(data);

    if(this.dcfg & 1)
    {
        this.data_port_write(data >> 8);
    }
};

Ne2k.prototype.data_port_write32 = function(data)
{
    this.data_port_write(data);
    this.data_port_write(data >> 8);
    this.data_port_write(data >> 16);
    this.data_port_write(data >> 24);
};

Ne2k.prototype.data_port_read = function()
{
    let data = 0;

    if(this.rsar < (STOP_PAGE << 8))
    {
        data = this.memory[this.rsar];
    }

    if(NE2K_LOG_VERBOSE)
    {
        dbg_log("Read data port: data=" + h(data, 2) +
                               " rsar=" + h(this.rsar, 4) +
                               " rcnt=" + h(this.rcnt, 4), LOG_NET);
    }

    this.rsar++;
    this.rcnt--;

    if(this.rsar >= (this.pstop << 8))
    {
        this.rsar += (this.pstart - this.pstop) << 8;
    }

    if(this.rcnt === 0)
    {
        this.do_interrupt(ENISR_RDC);
    }

    return data;
};

Ne2k.prototype.data_port_read8 = function()
{
    return this.data_port_read16() & 0xFF;
};

Ne2k.prototype.data_port_read16 = function()
{
    if(this.dcfg & 1)
    {
        return this.data_port_read() | this.data_port_read() << 8;
    }
    else
    {
        return this.data_port_read();
    }
};

Ne2k.prototype.data_port_read32 = function()
{
    return this.data_port_read() | this.data_port_read() << 8 |
            this.data_port_read() << 16 | this.data_port_read() << 24;
};

Ne2k.prototype.receive = function(data)
{
    // called from the adapter when data is received over the network

    if(this.cr & 1)
    {
        // stop bit set
        return;
    }

    if(NE2K_LOG_PACKETS)
    {
        dump_packet(data, "receive");
    }

    this.bus.send("eth-receive-end", [data.length]);

    if(this.rxcr & 0x10)
    {
        // promiscuous
    }
    else if((this.rxcr & 4) &&
            data[0] === 0xFF && data[1] === 0xFF && data[2] === 0xFF &&
            data[3] === 0xFF && data[4] === 0xFF && data[5] === 0xFF)
    {
        // broadcast
    }
    else if((this.rxcr & 8) && (data[0] & 1) === 1)
    {
        // multicast
        // XXX
        return;
    }
    else if(data[0] === this.mac[0] && data[1] === this.mac[1] &&
            data[2] === this.mac[2] && data[3] === this.mac[3] &&
            data[4] === this.mac[4] && data[5] === this.mac[5])
    {
    }
    else
    {
        return;
    }

    if(this.mac_address_in_state)
    {
        data = new Uint8Array(data); // make a copy
        translate_mac_address(data, this.mac, this.mac_address_in_state);
    }

    var packet_length = Math.max(60, data.length);

    var offset = this.curpg << 8;
    var total_length = packet_length + 4;
    var data_start = offset + 4;
    var next = this.curpg + 1 + (total_length >> 8);

    var end = offset + total_length;

    const needed = 1 + (total_length >> 8);

    // boundary == curpg interpreted as ringbuffer empty
    const available = this.boundary > this.curpg ?
        this.boundary - this.curpg :
        this.pstop - this.curpg + this.boundary - this.pstart;

    if(available < needed &&
        this.boundary !== 0 // XXX: ReactOS sets this to 0 initially and never updates it unless it receives a packet
    )
    {
        dbg_log("Buffer full, dropping packet pstart=" + h(this.pstart) + " pstop=" + h(this.pstop) +
            " curpg=" + h(this.curpg) + " needed=" + h(needed) + " boundary=" + h(this.boundary) + " available=" + h(available), LOG_NET);
        return;
    }

    if(end > (this.pstop << 8))
    {
        // Shouldn't happen because at this size it can't cross a page,
        // so we can skip filling with zeroes
        dbg_assert(data.length >= 60);

        var cut = (this.pstop << 8) - data_start;
        dbg_assert(cut >= 0);

        this.memory.set(data.subarray(0, cut), data_start);
        this.memory.set(data.subarray(cut), this.pstart << 8);
        dbg_log("rcv cut=" + h(cut), LOG_NET);
    }
    else
    {
        this.memory.set(data, data_start);

        if(data.length < 60)
        {
            this.memory.fill(0, data_start + data.length, data_start + 60);
        }
    }

    if(next >= this.pstop)
    {
        next += this.pstart - this.pstop;
    }

    // write packet header
    this.memory[offset] = ENRSR_RXOK; // status
    this.memory[offset + 1] = next;
    this.memory[offset + 2] = total_length;
    this.memory[offset + 3] = total_length >> 8;

    this.curpg = next;

    dbg_log("rcv offset=" + h(offset) + " len=" + h(total_length) + " next=" + h(next), LOG_NET);

    this.do_interrupt(ENISR_RX);
};

Ne2k.prototype.get_page = function()
{
    return this.cr >> 6 & 3;
};


// ---- File: src/virtio.js ----




// For Types Only



// http://docs.oasis-open.org/virtio/virtio/v1.0/virtio-v1.0.html

const VIRTIO_PCI_VENDOR_ID = 0x1AF4;
// Identifies vendor-specific PCI capability.
const VIRTIO_PCI_CAP_VENDOR = 0x09;
// Length (bytes) of VIRTIO_PCI_CAP linked list entry.
const VIRTIO_PCI_CAP_LENGTH = 16;

// Capability types.

const VIRTIO_PCI_CAP_COMMON_CFG = 1;
const VIRTIO_PCI_CAP_NOTIFY_CFG = 2;
const VIRTIO_PCI_CAP_ISR_CFG = 3;
const VIRTIO_PCI_CAP_DEVICE_CFG = 4;
const VIRTIO_PCI_CAP_PCI_CFG = 5;

// Status bits (device_status values).

const VIRTIO_STATUS_ACKNOWLEDGE = 1;
const VIRTIO_STATUS_DRIVER = 2;
const VIRTIO_STATUS_DRIVER_OK = 4;
const VIRTIO_STATUS_FEATURES_OK = 8;
const VIRTIO_STATUS_DEVICE_NEEDS_RESET = 64;
const VIRTIO_STATUS_FAILED = 128;

// ISR bits (isr_status values).

const VIRTIO_ISR_QUEUE = 1;
const VIRTIO_ISR_DEVICE_CFG = 2;

// Feature bits (bit positions).

const VIRTIO_F_RING_INDIRECT_DESC = 28;
const VIRTIO_F_RING_EVENT_IDX = 29;
const VIRTIO_F_VERSION_1 = 32;

// Queue struct sizes.

// Size (bytes) of the virtq_desc struct per queue size.
const VIRTQ_DESC_ENTRYSIZE = 16;
// Size (bytes) of the virtq_avail struct ignoring ring entries.
const VIRTQ_AVAIL_BASESIZE = 6;
// Size (bytes) of the virtq_avail struct per queue size.
const VIRTQ_AVAIL_ENTRYSIZE = 2;
// Size (bytes) of the virtq_used struct ignoring ring entries.
const VIRTQ_USED_BASESIZE = 6;
// Size (bytes) of the virtq_desc struct per queue size.
const VIRTQ_USED_ENTRYSIZE = 8;
// Mask for wrapping the idx field of the virtq_used struct so that the value
// naturally overflows after 65535 (idx is a word).
const VIRTQ_IDX_MASK = 0xFFFF;

// Queue flags.

const VIRTQ_DESC_F_NEXT = 1;
const VIRTQ_DESC_F_WRITE = 2;
const VIRTQ_DESC_F_INDIRECT = 4;
const VIRTQ_AVAIL_F_NO_INTERRUPT = 1;
const VIRTQ_USED_F_NO_NOTIFY = 1;

// Closure Compiler Types.

/**
 * @typedef {!Array<{
 *     bytes: number,
 *     name: string,
 *     read: function():number,
 *     write: function(number)
 * }>}
 */
var VirtIO_CapabilityStruct;

/**
 * @typedef {
 * {
 *     type: number,
 *     bar: number,
 *     port: number,
 *     use_mmio: boolean,
 *     offset: number,
 *     extra: Uint8Array,
 *     struct: VirtIO_CapabilityStruct,
 * }}
 */
var VirtIO_CapabilityInfo;

/**
 * @typedef {
 * {
 *     size_supported: number,
 *     notify_offset: number,
 * }}
 */
var VirtQueue_Options;

/**
 * @typedef {
 * {
 *     initial_port: number,
 *     queues: !Array<VirtQueue_Options>,
 *     features: !Array<number>,
 *     on_driver_ok: function(),
 * }}
 */
var VirtIO_CommonCapabilityOptions;

/**
 * @typedef {
 * {
 *     initial_port: number,
 *     single_handler: boolean,
 *     handlers: !Array<function()>,
 * }}
 */
var VirtIO_NotificationCapabilityOptions;

/**
 * @typedef {
 * {
 *     initial_port: number,
 * }}
 */
var VirtIO_ISRCapabilityOptions;

/**
 * @typedef {
 * {
 *     initial_port: number,
 *     struct: VirtIO_CapabilityStruct,
 * }}
 */
var VirtIO_DeviceSpecificCapabilityOptions;

/**
 * @typedef {
 * {
 *     name: string,
 *     pci_id: number,
 *     device_id: number,
 *     subsystem_device_id: number,
 *     common: VirtIO_CommonCapabilityOptions,
 *     notification: VirtIO_NotificationCapabilityOptions,
 *     isr_status: VirtIO_ISRCapabilityOptions,
 *     device_specific: (undefined | VirtIO_DeviceSpecificCapabilityOptions),
 * }}
 */
var VirtIO_Options;

/**
 * @constructor
 * @param {CPU} cpu
 * @param {VirtIO_Options} options
 */
function VirtIO(cpu, options)
{
    const io = cpu.io;

    /** @const @type {CPU} */
    this.cpu = cpu;

    /** @const @type {PCI} */
    this.pci = cpu.devices.pci;

    this.device_id = options.device_id;

    this.pci_space =
    [
        // Vendor ID
        VIRTIO_PCI_VENDOR_ID & 0xFF, VIRTIO_PCI_VENDOR_ID >> 8,
        // Device ID
        options.device_id & 0xFF, options.device_id >> 8,
        // Command
        0x07, 0x05,
        // Status - enable capabilities list
        0x10, 0x00,
        // Revision ID
        0x01,
        // Prof IF, Subclass, Class code
        0x00, 0x02, 0x00,
        // Cache line size
        0x00,
        // Latency Timer
        0x00,
        // Header Type
        0x00,
        // Built-in self test
        0x00,
        // BAR0
        0x01, 0xa8, 0x00, 0x00,
        // BAR1
        0x00, 0x10, 0xbf, 0xfe,
        // BAR2
        0x00, 0x00, 0x00, 0x00,
        // BAR3
        0x00, 0x00, 0x00, 0x00,
        // BAR4
        0x00, 0x00, 0x00, 0x00,
        // BAR5
        0x00, 0x00, 0x00, 0x00,
        // CardBus CIS pointer
        0x00, 0x00, 0x00, 0x00,
        // Subsystem vendor ID
        VIRTIO_PCI_VENDOR_ID & 0xFF, VIRTIO_PCI_VENDOR_ID >> 8,
        // Subsystem ID
        options.subsystem_device_id & 0xFF, options.subsystem_device_id >> 8,
        // Expansion ROM base address
        0x00, 0x00, 0x00, 0x00,
        // Capabilities pointer
        0x40,
        // Reserved
        0x00, 0x00, 0x00,
        // Reserved
        0x00, 0x00, 0x00, 0x00,
        // Interrupt line
        0x00,
        // Interrupt pin
        0x01,
        // Min grant
        0x00,
        // Max latency
        0x00,
    ];

    // Prevent sparse arrays by preallocating.
    this.pci_space = this.pci_space.concat(Array(256 - this.pci_space.length).fill(0));
    // Remaining PCI space is appended by capabilities further below.

    this.pci_id = options.pci_id;

    // PCI bars gets filled in by capabilities further below.
    this.pci_bars = [];

    this.name = options.name;

    // Feature bits grouped in dwords, dword selected by decive_feature_select.
    this.device_feature_select = 0;
    this.driver_feature_select = 0;

    // Unspecified upper bound. Assume 4*32=128 bits.
    this.device_feature = new Uint32Array(4);
    this.driver_feature = new Uint32Array(4);
    for(const f of options.common.features)
    {
        dbg_assert(f >= 0,
            "VirtIO device<" + this.name + "> feature bit numbers must be non-negative");
        dbg_assert(f < 128,
            "VirtIO device<" + this.name + "> feature bit numbers assumed less than 128 in implementation");

        // Feature bits are grouped in 32 bits.
        this.device_feature[f >>> 5] |= 1 << (f & 0x1F);
        this.driver_feature[f >>> 5] |= 1 << (f & 0x1F);
    }

    dbg_assert(options.common.features.includes(VIRTIO_F_VERSION_1),
        "VirtIO device<" + this.name + "> only non-transitional devices are supported");

    // Indicates whether driver_feature bits is subset of device_feature bits.
    this.features_ok = true;

    this.device_status = 0;

    this.config_has_changed = false;
    this.config_generation = 0;

    /** @type {!Array<VirtQueue>} */
    this.queues = [];
    for(const queue_options of options.common.queues)
    {
        this.queues.push(new VirtQueue(cpu, this, queue_options));
    }
    this.queue_select = 0;
    this.queue_selected = this.queues[0];

    this.isr_status = 0;

    // Verify notification options.
    if(DEBUG)
    {
        const offsets = new Set();
        for(const offset of this.queues.map(q => q.notify_offset))
        {
            const effective_offset = options.notification.single_handler ? 0 : offset;
            offsets.add(effective_offset);
            dbg_assert(options.notification.handlers[effective_offset],
                "VirtIO device<" + this.name + "> every queue's notifier must exist");
        }
        for(const [index, handler] of options.notification.handlers.entries())
        {
            dbg_assert(!handler || offsets.has(index),
                "VirtIO device<" + this.name +"> no defined notify handler should be unused");
        }
    }

    /** @type {!Array<VirtIO_CapabilityInfo>} */
    const capabilities = [];
    capabilities.push(this.create_common_capability(options.common));
    capabilities.push(this.create_notification_capability(options.notification));
    capabilities.push(this.create_isr_capability(options.isr_status));
    if(options.device_specific)
    {
        capabilities.push(this.create_device_specific_capability(options.device_specific));
    }
    this.init_capabilities(capabilities);

    cpu.devices.pci.register_device(this);
    this.reset();
}

/**
 * @param {VirtIO_CommonCapabilityOptions} options
 * @return {VirtIO_CapabilityInfo}
 */
VirtIO.prototype.create_common_capability = function(options)
{
    return {
        type: VIRTIO_PCI_CAP_COMMON_CFG,
        bar: 0,
        port: options.initial_port,
        use_mmio: false,
        offset: 0,
        extra: new Uint8Array(0),
        struct:
        [
            {
                bytes: 4,
                name: "device_feature_select",
                read: () => this.device_feature_select,
                write: data =>
                {
                    this.device_feature_select = data;
                },
            },
            {
                bytes: 4,
                name: "device_feature",
                read: () => this.device_feature[this.device_feature_select] || 0,
                write: data => { /* read only */ },
            },
            {
                bytes: 4,
                name: "driver_feature_select",
                read: () => this.driver_feature_select,
                write: data =>
                {
                    this.driver_feature_select = data;
                },
            },
            {
                bytes: 4,
                name: "driver_feature",
                read: () => this.driver_feature[this.driver_feature_select] || 0,
                write: data =>
                {
                    const supported_feature = this.device_feature[this.driver_feature_select];

                    if(this.driver_feature_select < this.driver_feature.length)
                    {
                        // Note: only set subset of device_features is set.
                        // Required in our implementation for is_feature_negotiated().
                        this.driver_feature[this.driver_feature_select] = data & supported_feature;
                    }

                    // Check that driver features is an inclusive subset of device features.
                    const invalid_bits = data & ~supported_feature;
                    this.features_ok = this.features_ok && !invalid_bits;
                },
            },
            {
                bytes: 2,
                name: "msix_config",
                read: () =>
                {
                    dbg_log("No msi-x capability supported.", LOG_VIRTIO);
                    return 0xFFFF;
                },
                write: data =>
                {
                    dbg_log("No msi-x capability supported.", LOG_VIRTIO);
                },
            },
            {
                bytes: 2,
                name: "num_queues",
                read: () => this.queues.length,
                write: data => { /* read only */ },
            },
            {
                bytes: 1,
                name: "device_status",
                read: () => this.device_status,
                write: data =>
                {
                    if(data === 0)
                    {
                        dbg_log("Reset device<" + this.name + ">", LOG_VIRTIO);
                        this.reset();
                    }
                    else if(data & VIRTIO_STATUS_FAILED)
                    {
                        dbg_log("Warning: Device<" + this.name + "> status failed", LOG_VIRTIO);
                    }
                    else
                    {
                        dbg_log("Device<" + this.name +"> status: " +
                                ((data & VIRTIO_STATUS_ACKNOWLEDGE) ? "ACKNOWLEDGE " : "") +
                                ((data & VIRTIO_STATUS_DRIVER) ? "DRIVER " : "") +
                                ((data & VIRTIO_STATUS_DRIVER_OK) ? "DRIVER_OK" : "") +
                                ((data & VIRTIO_STATUS_FEATURES_OK) ? "FEATURES_OK " : "") +
                                ((data & VIRTIO_STATUS_DEVICE_NEEDS_RESET) ? "DEVICE_NEEDS_RESET" : ""),
                                LOG_VIRTIO);
                    }

                    if((data & ~this.device_status & VIRTIO_STATUS_DRIVER_OK) &&
                        (this.device_status & VIRTIO_STATUS_DEVICE_NEEDS_RESET))
                    {
                        // We couldn't notify NEEDS_RESET earlier because DRIVER_OK was not set.
                        // Now it has been set, notify now.
                        this.notify_config_changes();
                    }

                    // Don't set FEATURES_OK if our device doesn't support requested features.
                    if(!this.features_ok)
                    {
                        if(DEBUG && (data & VIRTIO_STATUS_FEATURES_OK))
                        {
                            dbg_log("Removing FEATURES_OK", LOG_VIRTIO);
                        }
                        data &= ~VIRTIO_STATUS_FEATURES_OK;
                    }

                    this.device_status = data;

                    if(data & ~this.device_status & VIRTIO_STATUS_DRIVER_OK)
                    {
                        options.on_driver_ok();
                    }
                },
            },
            {
                bytes: 1,
                name: "config_generation",
                read: () => this.config_generation,
                write: data => { /* read only */ },
            },
            {
                bytes: 2,
                name: "queue_select",
                read: () => this.queue_select,
                write: data =>
                {
                    this.queue_select = data;

                    if(this.queue_select < this.queues.length)
                    {
                        this.queue_selected = this.queues[this.queue_select];
                    }
                    else
                    {
                        // Allow queue_select >= num_queues.
                        this.queue_selected = null;
                        // Drivers can then detect that the queue is not available
                        // using the below fields.
                    }
                },
            },
            {
                bytes: 2,
                name: "queue_size",
                read: () => this.queue_selected ? this.queue_selected.size : 0,
                write: data =>
                {
                    if(!this.queue_selected)
                    {
                        return;
                    }
                    if(data & data - 1)
                    {
                        dbg_log("Warning: dev<" + this.name +"> " +
                                "Given queue size was not a power of 2. " +
                                "Rounding up to next power of 2.", LOG_VIRTIO);
                        data = 1 << (int_log2(data - 1) + 1);
                    }
                    if(data > this.queue_selected.size_supported)
                    {
                        dbg_log("Warning: dev<" + this.name +"> " +
                                "Trying to set queue size greater than supported. " +
                                "Clamping to supported size.", LOG_VIRTIO);
                        data = this.queue_selected.size_supported;
                    }
                    this.queue_selected.set_size(data);
                },
            },
            {
                bytes: 2,
                name: "queue_msix_vector",
                read: () =>
                {
                    dbg_log("No msi-x capability supported.", LOG_VIRTIO);
                    return 0xFFFF;
                },
                write: data =>
                {
                    dbg_log("No msi-x capability supported.", LOG_VIRTIO);
                },
            },
            {
                bytes: 2,
                name: "queue_enable",
                read: () => this.queue_selected ? this.queue_selected.enabled | 0 : 0,
                write: data =>
                {
                    if(!this.queue_selected)
                    {
                        return;
                    }
                    if(data === 1)
                    {
                        if(this.queue_selected.is_configured())
                        {
                            this.queue_selected.enable();
                        }
                        else
                        {
                            dbg_log("Driver bug: tried enabling unconfigured queue", LOG_VIRTIO);
                        }
                    }
                    else if(data === 0)
                    {
                        dbg_log("Driver bug: tried writing 0 to queue_enable", LOG_VIRTIO);
                    }
                },
            },
            {
                bytes: 2,
                name: "queue_notify_off",
                read: () => this.queue_selected ? this.queue_selected.notify_offset : 0,
                write: data => { /* read only */ },
            },
            {
                bytes: 4,
                name: "queue_desc (low dword)",
                read: () => this.queue_selected ? this.queue_selected.desc_addr : 0,
                write: data =>
                {
                    if(this.queue_selected) this.queue_selected.desc_addr = data;
                },
            },
            {
                bytes: 4,
                name: "queue_desc (high dword)",
                read: () => 0,
                write: data =>
                {
                    if(data !== 0) dbg_log("Warning: High dword of 64 bit queue_desc ignored:" + data, LOG_VIRTIO);
                },
            },
            {
                bytes: 4,
                name: "queue_avail (low dword)",
                read: () => this.queue_selected ? this.queue_selected.avail_addr : 0,
                write: data =>
                {
                    if(this.queue_selected) this.queue_selected.avail_addr = data;
                },
            },
            {
                bytes: 4,
                name: "queue_avail (high dword)",
                read: () => 0,
                write: data =>
                {
                    if(data !== 0) dbg_log("Warning: High dword of 64 bit queue_avail ignored:" + data, LOG_VIRTIO);
                },
            },
            {
                bytes: 4,
                name: "queue_used (low dword)",
                read: () => this.queue_selected ? this.queue_selected.used_addr : 0,
                write: data =>
                {
                    if(this.queue_selected) this.queue_selected.used_addr = data;
                },
            },
            {
                bytes: 4,
                name: "queue_used (high dword)",
                read: () => 0,
                write: data =>
                {
                    if(data !== 0) dbg_log("Warning: High dword of 64 bit queue_used ignored:" + data, LOG_VIRTIO);
                },
            },
        ],
    };
};

/**
 * @param {VirtIO_NotificationCapabilityOptions} options
 * @return {VirtIO_CapabilityInfo}
 */
VirtIO.prototype.create_notification_capability = function(options)
{
    const notify_struct = [];
    let notify_off_multiplier;

    if(options.single_handler)
    {
        dbg_assert(options.handlers.length === 1,
            "VirtIO device<" + this.name + "> too many notify handlers specified: expected single handler");

        // Forces all queues to use the same address for notifying.
        notify_off_multiplier = 0;
    }
    else
    {
        notify_off_multiplier = 2;
    }

    for(const [i, handler] of options.handlers.entries())
    {
        notify_struct.push(
        {
            bytes: 2,
            name: "notify" + i,
            read: () => 0xFFFF,
            write: handler || (data => {}),
        });
    }

    return {
        type: VIRTIO_PCI_CAP_NOTIFY_CFG,
        bar: 1,
        port: options.initial_port,
        use_mmio: false,
        offset: 0,
        extra: new Uint8Array(
        [
            notify_off_multiplier & 0xFF,
            (notify_off_multiplier >> 8) & 0xFF,
            (notify_off_multiplier >> 16) & 0xFF,
            notify_off_multiplier >> 24,
        ]),
        struct: notify_struct,
    };
};

/**
 * @param {VirtIO_ISRCapabilityOptions} options
 * @return {VirtIO_CapabilityInfo}
 */
VirtIO.prototype.create_isr_capability = function(options)
{
    return {
        type: VIRTIO_PCI_CAP_ISR_CFG,
        bar: 2,
        port: options.initial_port,
        use_mmio: false,
        offset: 0,
        extra: new Uint8Array(0),
        struct:
        [
            {
                bytes: 1,
                name: "isr_status",
                read: () =>
                {
                    const isr_status = this.isr_status;
                    this.lower_irq();
                    return isr_status;
                },
                write: data => { /* read only */ },
            },
        ],
    };
};

/**
 * @param {VirtIO_DeviceSpecificCapabilityOptions} options
 * @return {VirtIO_CapabilityInfo}
 */
VirtIO.prototype.create_device_specific_capability = function(options)
{
    dbg_assert(~options.offset & 0x3,
            "VirtIO device<" + this.name + "> device specific cap offset must be 4-byte aligned");

    return {
        type: VIRTIO_PCI_CAP_DEVICE_CFG,
        bar: 3,
        port: options.initial_port,
        use_mmio: false,
        offset: 0,
        extra: new Uint8Array(0),
        struct: options.struct,
    };
};

/**
 * Writes capabilities into pci_space and hook up IO/MMIO handlers.
 * Call only within constructor.
 * @param {!Array<VirtIO_CapabilityInfo>} capabilities
 */
VirtIO.prototype.init_capabilities = function(capabilities)
{
    // Next available offset for capabilities linked list.
    let cap_next = this.pci_space[0x34] = 0x40;

    // Current offset.
    let cap_ptr = cap_next;

    for(const cap of capabilities)
    {
        const cap_len = VIRTIO_PCI_CAP_LENGTH + cap.extra.length;

        cap_ptr = cap_next;
        cap_next = cap_ptr + cap_len;

        dbg_assert(cap_next <= 256,
            "VirtIO device<" + this.name + "> can't fit all capabilities into 256byte configspace");

        dbg_assert(0 <= cap.bar && cap.bar < 6,
            "VirtIO device<" + this.name + "> capability invalid bar number");

        let bar_size = cap.struct.reduce((bytes, field) => bytes + field.bytes, 0);
        bar_size += cap.offset;

        // Round up to next power of 2,
        // Minimum 16 bytes for its size to be detectable in general (esp. mmio).
        bar_size = bar_size < 16 ? 16 : 1 << (int_log2(bar_size - 1) + 1);

        dbg_assert((cap.port & (bar_size - 1)) === 0,
            "VirtIO device<" + this.name + "> capability port should be aligned to pci bar size");

        this.pci_bars[cap.bar] =
        {
            size: bar_size,
        };

        this.pci_space[cap_ptr] = VIRTIO_PCI_CAP_VENDOR;
        this.pci_space[cap_ptr + 1] = cap_next;
        this.pci_space[cap_ptr + 2] = cap_len;
        this.pci_space[cap_ptr + 3] = cap.type;
        this.pci_space[cap_ptr + 4] = cap.bar;

        this.pci_space[cap_ptr + 5] = 0; // Padding.
        this.pci_space[cap_ptr + 6] = 0; // Padding.
        this.pci_space[cap_ptr + 7] = 0; // Padding.

        this.pci_space[cap_ptr + 8] = cap.offset & 0xFF;
        this.pci_space[cap_ptr + 9] = (cap.offset >>> 8) & 0xFF;
        this.pci_space[cap_ptr + 10] = (cap.offset >>> 16) & 0xFF;
        this.pci_space[cap_ptr + 11] = cap.offset >>> 24;

        this.pci_space[cap_ptr + 12] = bar_size & 0xFF;
        this.pci_space[cap_ptr + 13] = (bar_size >>> 8) & 0xFF;
        this.pci_space[cap_ptr + 14] = (bar_size >>> 16) & 0xFF;
        this.pci_space[cap_ptr + 15] = bar_size >>> 24;

        for(const [i, extra_byte] of cap.extra.entries())
        {
            this.pci_space[cap_ptr + 16 + i] = extra_byte;
        }

        const bar_offset = 0x10 + 4 * cap.bar;
        this.pci_space[bar_offset] = (cap.port & 0xFE) | !cap.use_mmio;
        this.pci_space[bar_offset + 1] = (cap.port >>> 8) & 0xFF;
        this.pci_space[bar_offset + 2] = (cap.port >>> 16) & 0xFF;
        this.pci_space[bar_offset + 3] = (cap.port >>> 24) & 0xFF;

        let port = cap.port + cap.offset;

        for(const field of cap.struct)
        {
            let read = field.read;
            let write = field.write;

            if(DEBUG)
            {
                read = () =>
                {
                    const val = field.read();

                    dbg_log("Device<" + this.name + "> " +
                            "cap[" + cap.type + "] " +
                            "read[" + field.name + "] " +
                            "=> " + h(val, field.bytes * 8),
                        LOG_VIRTIO);

                    return val;
                };
                write = data =>
                {
                    dbg_log("Device<" + this.name + "> " +
                            "cap[" + cap.type + "] " +
                            "write[" + field.name + "] " +
                            "<= " + h(data, field.bytes * 8),
                        LOG_VIRTIO);

                    field.write(data);
                };
            }

            if(cap.use_mmio)
            {
                dbg_assert(false, "VirtIO device <" + this.name + "> mmio capability not implemented.");
            }
            else
            {
                // DSL (2.4 kernel) does these reads
                const shim_read8_on_16 = function(addr)
                {
                    dbg_log("Warning: 8-bit read from 16-bit virtio port", LOG_VIRTIO);
                    return read(addr & ~1) >> ((addr & 1) << 3) & 0xFF;
                };
                const shim_read8_on_32 = function(addr)
                {
                    dbg_log("Warning: 8-bit read from 32-bit virtio port", LOG_VIRTIO);
                    return read(addr & ~3) >> ((addr & 3) << 3) & 0xFF;
                };

                switch(field.bytes)
                {
                    case 4:
                        this.cpu.io.register_read(port, this, shim_read8_on_32, undefined, read);
                        this.cpu.io.register_read(port + 1, this, shim_read8_on_32);
                        this.cpu.io.register_read(port + 2, this, shim_read8_on_32);
                        this.cpu.io.register_read(port + 3, this, shim_read8_on_32);
                        this.cpu.io.register_write(port, this, undefined, undefined, write);
                        break;
                    case 2:
                        this.cpu.io.register_read(port, this, shim_read8_on_16, read);
                        this.cpu.io.register_read(port + 1, this, shim_read8_on_16);
                        this.cpu.io.register_write(port, this, undefined, write);
                        break;
                    case 1:
                        this.cpu.io.register_read(port, this, read);
                        this.cpu.io.register_write(port, this, write);
                        break;
                    default:
                        dbg_assert(false,
                            "VirtIO device <" + this.name + "> invalid capability field width of " +
                            field.bytes + " bytes");
                        break;
                }
            }

            port += field.bytes;
        }
    }

    // Terminate linked list with the pci config access capability.

    const cap_len = VIRTIO_PCI_CAP_LENGTH + 4;
    dbg_assert(cap_next + cap_len <= 256,
        "VirtIO device<" + this.name + "> can't fit all capabilities into 256byte configspace");
    this.pci_space[cap_next] = VIRTIO_PCI_CAP_VENDOR;
    this.pci_space[cap_next + 1] = 0; // cap next (null terminator)
    this.pci_space[cap_next + 2] = cap_len;
    this.pci_space[cap_next + 3] = VIRTIO_PCI_CAP_PCI_CFG; // cap type
    this.pci_space[cap_next + 4] = 0; // bar (written by device)
    this.pci_space[cap_next + 5] = 0; // Padding.
    this.pci_space[cap_next + 6] = 0; // Padding.
    this.pci_space[cap_next + 7] = 0; // Padding.

    // Remaining fields are configured by driver when needed.

    // offset
    this.pci_space[cap_next + 8] = 0;
    this.pci_space[cap_next + 9] = 0;
    this.pci_space[cap_next + 10] = 0;
    this.pci_space[cap_next + 11] = 0;

    // bar size
    this.pci_space[cap_next + 12] = 0;
    this.pci_space[cap_next + 13] = 0;
    this.pci_space[cap_next + 14] = 0;
    this.pci_space[cap_next + 15] = 0;

    // cfg_data
    this.pci_space[cap_next + 16] = 0;
    this.pci_space[cap_next + 17] = 0;
    this.pci_space[cap_next + 18] = 0;
    this.pci_space[cap_next + 19] = 0;

    //
    // TODO
    // The pci config access capability is required by spec, but so far, devices
    // seem to work well without it.
    // This capability provides a cfg_data field (at cap_next + 16 for 4 bytes)
    // that acts like a window to the previous bars. The driver writes the bar number,
    // offset, and length values in this capability, and the cfg_data field should
    // mirror the data referred by the bar, offset and length. Here, length can be
    // 1, 2, or 4.
    //
    // This requires some sort of pci devicespace read and write handlers.
};

VirtIO.prototype.get_state = function()
{
    let state = [];

    state[0] = this.device_feature_select;
    state[1] = this.driver_feature_select;
    state[2] = this.device_feature;
    state[3] = this.driver_feature;
    state[4] = this.features_ok;
    state[5] = this.device_status;
    state[6] = this.config_has_changed;
    state[7] = this.config_generation;
    state[8] = this.isr_status;
    state[9] = this.queue_select;
    state = state.concat(this.queues);

    return state;
};

VirtIO.prototype.set_state = function(state)
{
    this.device_feature_select = state[0];
    this.driver_feature_select = state[1];
    this.device_feature = state[2];
    this.driver_feature = state[3];
    this.features_ok = state[4];
    this.device_status = state[5];
    this.config_has_changed = state[6];
    this.config_generation = state[7];
    this.isr_status = state[8];
    this.queue_select = state[9];
    let i = 0;
    for(const queue of state.slice(10))
    {
        this.queues[i].set_state(queue);
        i++;
    }
    this.queue_selected = this.queues[this.queue_select] || null;
};

VirtIO.prototype.reset = function()
{
    this.device_feature_select = 0;
    this.driver_feature_select = 0;
    this.driver_feature.set(this.device_feature);

    this.features_ok = true;
    this.device_status = 0;

    this.queue_select = 0;
    this.queue_selected = this.queues[0];

    for(const queue of this.queues)
    {
        queue.reset();
    }

    this.config_has_changed = false;
    this.config_generation = 0;

    this.lower_irq();
};

/**
 * Call this when device-specific configuration state changes.
 * Also called when status DEVICE_NEEDS_RESET is set.
 */
VirtIO.prototype.notify_config_changes = function()
{
    this.config_has_changed = true;

    if(this.device_status & VIRTIO_STATUS_DRIVER_OK)
    {
        this.raise_irq(VIRTIO_ISR_DEVICE_CFG);
    }
    else
    {
        dbg_assert(false,
            "VirtIO device<" + this.name + "> attempted to notify driver before DRIVER_OK");
    }
};

/**
 * To be called after reading any field whose write can trigger notify_config_changes().
 */
VirtIO.prototype.update_config_generation = function()
{
    if(this.config_has_changed)
    {
        this.config_generation++;
        this.config_generation &= 0xFF;
        this.config_has_changed = false;
    }
};

VirtIO.prototype.is_feature_negotiated = function(feature)
{
    // Feature bits are grouped in 32 bits.
    // Note: earlier we chose not to set invalid features into driver_feature.
    return (this.driver_feature[feature >>> 5] & (1 << (feature & 0x1F))) > 0;
};

/**
 * Call this if an irrecoverable error has been occured.
 * Notifies driver if DRIVER_OK, or when DRIVER_OK gets set.
 */
VirtIO.prototype.needs_reset = function()
{
    dbg_log("Device<" + this.name + "> experienced error - requires reset", LOG_VIRTIO);
    this.device_status |= VIRTIO_STATUS_DEVICE_NEEDS_RESET;

    if(this.device_status & VIRTIO_STATUS_DRIVER_OK)
    {
        this.notify_config_changes();
    }
};

VirtIO.prototype.raise_irq = function(type)
{
    dbg_log("Raise irq " + h(type), LOG_VIRTIO);
    this.isr_status |= type;
    this.pci.raise_irq(this.pci_id);
};

VirtIO.prototype.lower_irq = function()
{
    dbg_log("Lower irq ", LOG_VIRTIO);
    this.isr_status = 0;
    this.pci.lower_irq(this.pci_id);
};

/**
 * @constructor
 * @param {CPU} cpu
 * @param {VirtQueue_Options} options
 */
function VirtQueue(cpu, virtio, options)
{
    /** @const @type {CPU} */
    this.cpu = cpu;

    /** @const @type {VirtIO} */
    this.virtio = virtio;

    // Number of entries.
    this.size = options.size_supported;
    this.size_supported = options.size_supported;
    this.mask = this.size - 1;
    this.enabled = false;
    this.notify_offset = options.notify_offset;

    this.desc_addr = 0;

    this.avail_addr = 0;
    this.avail_last_idx = 0;

    this.used_addr = 0;
    this.num_staged_replies = 0;

    this.reset();
}

VirtQueue.prototype.get_state = function()
{
    const state = [];

    state[0] = this.size;
    state[1] = this.size_supported;
    state[2] = this.enabled;
    state[3] = this.notify_offset;
    state[4] = this.desc_addr;
    state[5] = this.avail_addr;
    state[6] = this.avail_last_idx;
    state[7] = this.used_addr;
    state[8] = this.num_staged_replies;
    state[9] = 1;

    return state;
};

VirtQueue.prototype.set_state = function(state)
{
    this.size = state[0];
    this.size_supported = state[1];
    this.enabled = state[2];
    this.notify_offset = state[3];
    this.desc_addr = state[4];
    this.avail_addr = state[5];
    this.avail_last_idx = state[6];
    this.used_addr = state[7];
    this.num_staged_replies = state[8];

    this.mask = this.size - 1;
    this.fix_wrapping = state[9] !== 1;
};

VirtQueue.prototype.reset = function()
{
    this.enabled = false;
    this.desc_addr = 0;
    this.avail_addr = 0;
    this.avail_last_idx = 0;
    this.used_addr = 0;
    this.num_staged_replies = 0;
    this.set_size(this.size_supported);
};

VirtQueue.prototype.is_configured = function()
{
    return this.desc_addr && this.avail_addr && this.used_addr;
};

VirtQueue.prototype.enable = function()
{
    dbg_assert(this.is_configured(), "VirtQueue must be configured before enabled");
    this.enabled = true;
};

VirtQueue.prototype.set_size = function(size)
{
    dbg_assert((size & size - 1) === 0, "VirtQueue size must be power of 2 or zero");
    dbg_assert(size <= this.size_supported, "VirtQueue size must be within supported size");
    this.size = size;
    this.mask = size - 1;
};

/**
 * @return {number}
 */
VirtQueue.prototype.count_requests = function()
{
    dbg_assert(this.avail_addr, "VirtQueue addresses must be configured before use");
    if(this.fix_wrapping) {
        this.fix_wrapping = false;
        this.avail_last_idx = (this.avail_get_idx() & ~this.mask) + (this.avail_last_idx & this.mask);
    }
    return (this.avail_get_idx() - this.avail_last_idx) & 0xFFFF;
};

/**
 * @return {boolean}
 */
VirtQueue.prototype.has_request = function()
{
    dbg_assert(this.avail_addr, "VirtQueue addresses must be configured before use");
    return this.count_requests() !== 0;
};

/**
 * @return {VirtQueueBufferChain}
 */
VirtQueue.prototype.pop_request = function()
{
    dbg_assert(this.avail_addr, "VirtQueue addresses must be configured before use");
    dbg_assert(this.has_request(), "VirtQueue must not pop nonexistent request");

    const desc_idx = this.avail_get_entry(this.avail_last_idx);
    dbg_log("Pop request: avail_last_idx=" + this.avail_last_idx +
        " desc_idx=" + desc_idx, LOG_VIRTIO);

    const bufchain = new VirtQueueBufferChain(this, desc_idx);

    this.avail_last_idx = (this.avail_last_idx + 1) & 0xFFFF;

    return bufchain;
};

/**
 * Stage a buffer chain into the used ring.
 * Can call push_reply many times before flushing to batch replies together.
 * Note: this reply is not visible to driver until flush_replies is called.
 * @param {VirtQueueBufferChain} bufchain
 */
VirtQueue.prototype.push_reply = function(bufchain)
{
    dbg_assert(this.used_addr, "VirtQueue addresses must be configured before use");
    dbg_assert(this.num_staged_replies < this.size, "VirtQueue replies must not exceed queue size");

    const used_idx = this.used_get_idx() + this.num_staged_replies & this.mask;
    dbg_log("Push reply: used_idx=" + used_idx +
        " desc_idx=" + bufchain.head_idx, LOG_VIRTIO);

    this.used_set_entry(used_idx, bufchain.head_idx, bufchain.length_written);
    this.num_staged_replies++;
};

/**
 * Makes replies visible to driver by updating the used ring idx and
 * firing appropriate interrupt if needed.
 */
VirtQueue.prototype.flush_replies = function()
{
    dbg_assert(this.used_addr, "VirtQueue addresses must be configured before use");

    if(this.num_staged_replies === 0)
    {
        dbg_log("flush_replies: Nothing to flush", LOG_VIRTIO);
        return;
    }

    dbg_log("Flushing " + this.num_staged_replies + " replies", LOG_VIRTIO);
    const old_idx = this.used_get_idx();
    const new_idx = old_idx + this.num_staged_replies & VIRTQ_IDX_MASK;
    this.used_set_idx(new_idx);

    this.num_staged_replies = 0;

    if(this.virtio.is_feature_negotiated(VIRTIO_F_RING_EVENT_IDX))
    {
        const used_event = this.avail_get_used_event();

        // Fire irq when idx values associated with the pushed reply buffers
        // has reached or gone past used_event.
        let has_passed = old_idx <= used_event && used_event < new_idx;

        // Has overflowed? Assumes num_staged_replies > 0.
        if(new_idx <= old_idx)
        {
            has_passed = used_event < new_idx || old_idx <= used_event;
        }

        // Commented out: Workaround for sometimes loading from the filesystem hangs and the emulator stays idle
        //if(has_passed)
        {
            this.virtio.raise_irq(VIRTIO_ISR_QUEUE);
        }
    }
    else
    {
        if(~this.avail_get_flags() & VIRTQ_AVAIL_F_NO_INTERRUPT)
        {
            this.virtio.raise_irq(VIRTIO_ISR_QUEUE);
        }
    }
};

/**
 * If using VIRTIO_F_RING_EVENT_IDX, device must tell driver when
 * to get notifications or else driver won't notify regularly.
 * If not using VIRTIO_F_RING_EVENT_IDX, driver will ignore avail_event
 * and notify every request regardless unless NO_NOTIFY is set (TODO implement when needed).
 * @param {number} num_skipped_requests Zero = get notified in the next request.
 */
VirtQueue.prototype.notify_me_after = function(num_skipped_requests)
{
    dbg_assert(num_skipped_requests >= 0, "Must skip a non-negative number of requests");

    // The 16 bit idx field wraps around after 2^16.
    const avail_event = this.avail_get_idx() + num_skipped_requests & 0xFFFF;
    this.used_set_avail_event(avail_event);
};

/**
 * @param {number} table_address The physical address of the start of the desc table.
 * @param {number} i
 */
VirtQueue.prototype.get_descriptor = function(table_address, i)
{
    return {
        addr_low: this.cpu.read32s(table_address + i * VIRTQ_DESC_ENTRYSIZE),
        addr_high: this.cpu.read32s(table_address + i * VIRTQ_DESC_ENTRYSIZE + 4),
        len: this.cpu.read32s(table_address + i * VIRTQ_DESC_ENTRYSIZE + 8),
        flags: this.cpu.read16(table_address + i * VIRTQ_DESC_ENTRYSIZE + 12),
        next: this.cpu.read16(table_address + i * VIRTQ_DESC_ENTRYSIZE + 14),
    };
};

// Avail ring fields

VirtQueue.prototype.avail_get_flags = function()
{
    return this.cpu.read16(this.avail_addr);
};

VirtQueue.prototype.avail_get_idx = function()
{
    return this.cpu.read16(this.avail_addr + 2);
};

VirtQueue.prototype.avail_get_entry = function(i)
{
    return this.cpu.read16(this.avail_addr + 4 + VIRTQ_AVAIL_ENTRYSIZE * (i & this.mask));
};

VirtQueue.prototype.avail_get_used_event = function()
{
    return this.cpu.read16(this.avail_addr + 4 + VIRTQ_AVAIL_ENTRYSIZE * this.size);
};

// Used ring fields

VirtQueue.prototype.used_get_flags = function()
{
    return this.cpu.read16(this.used_addr);
};

VirtQueue.prototype.used_set_flags = function(value)
{
    this.cpu.write16(this.used_addr, value);
};

VirtQueue.prototype.used_get_idx = function()
{
    return this.cpu.read16(this.used_addr + 2);
};

VirtQueue.prototype.used_set_idx = function(value)
{
    this.cpu.write16(this.used_addr + 2, value);
};

VirtQueue.prototype.used_set_entry = function(i, desc_idx, length_written)
{
    this.cpu.write32(this.used_addr + 4 + VIRTQ_USED_ENTRYSIZE * i, desc_idx);
    this.cpu.write32(this.used_addr + 8 + VIRTQ_USED_ENTRYSIZE * i, length_written);
};

VirtQueue.prototype.used_set_avail_event = function(value)
{
    this.cpu.write16(this.used_addr + 4 + VIRTQ_USED_ENTRYSIZE * this.size, value);
};

/**
 * Traverses through descriptor chain starting at head_id.
 * Provides means to read/write to buffers represented by the descriptors.
 * @constructor
 * @param {VirtQueue} virtqueue
 * @param {number} head_idx
 */
function VirtQueueBufferChain(virtqueue, head_idx)
{
    /** @const @type {CPU} */
    this.cpu = virtqueue.cpu;

    /** @const @type {VirtIO} */
    this.virtio = virtqueue.virtio;

    this.head_idx = head_idx;

    this.read_buffers = [];
    // Pointers for sequential consumption via get_next_blob.
    this.read_buffer_idx = 0;
    this.read_buffer_offset = 0;
    this.length_readable = 0;

    this.write_buffers = [];
    // Pointers for sequential write via set_next_blob.
    this.write_buffer_idx = 0;
    this.write_buffer_offset = 0;
    this.length_written = 0;
    this.length_writable = 0;

    // Traverse chain to discover buffers.
    // - There shouldn't be an excessive amount of descriptor elements.
    let table_address = virtqueue.desc_addr;
    let desc_idx = head_idx;
    let chain_length = 0;
    let chain_max = virtqueue.size;
    let writable_region = false;
    const has_indirect_feature = this.virtio.is_feature_negotiated(VIRTIO_F_RING_INDIRECT_DESC);
    dbg_log("<<< Descriptor chain start", LOG_VIRTIO);
    do
    {
        const desc = virtqueue.get_descriptor(table_address, desc_idx);

        dbg_log("descriptor: idx=" + desc_idx + " addr=" + h(desc.addr_high, 8) + ":" + h(desc.addr_low, 8) +
            " len=" + h(desc.len, 8) + " flags=" + h(desc.flags, 4) + " next=" + h(desc.next, 4), LOG_VIRTIO);

        if(has_indirect_feature && (desc.flags & VIRTQ_DESC_F_INDIRECT))
        {
            if(DEBUG && (desc.flags & VIRTQ_DESC_F_NEXT))
            {
                dbg_log("Driver bug: has set VIRTQ_DESC_F_NEXT flag in an indirect table descriptor", LOG_VIRTIO);
            }

            // Carry on using indirect table, starting at first entry.
            table_address = desc.addr_low;
            desc_idx = 0;
            chain_length = 0;
            chain_max = desc.len / VIRTQ_DESC_ENTRYSIZE;
            dbg_log("start indirect", LOG_VIRTIO);
            continue;
        }

        if(desc.flags & VIRTQ_DESC_F_WRITE)
        {
            writable_region = true;
            this.write_buffers.push(desc);
            this.length_writable += desc.len;
        }
        else
        {
            if(writable_region)
            {
                dbg_log("Driver bug: readonly buffer after writeonly buffer within chain", LOG_VIRTIO);
                break;
            }
            this.read_buffers.push(desc);
            this.length_readable += desc.len;
        }

        chain_length++;
        if(chain_length > chain_max)
        {
            dbg_log("Driver bug: descriptor chain cycle detected", LOG_VIRTIO);
            break;
        }

        if(desc.flags & VIRTQ_DESC_F_NEXT)
        {
            desc_idx = desc.next;
        }
        else
        {
            break;
        }
    }
    while(true);
    dbg_log("Descriptor chain end >>>", LOG_VIRTIO);
}

/**
 * Reads the next blob of memory represented by the buffer chain into dest_buffer.
 * @param {Uint8Array} dest_buffer
 * @return {number} Number of bytes successfully read.
 */
VirtQueueBufferChain.prototype.get_next_blob = function(dest_buffer)
{
    let dest_offset = 0;
    let remaining = dest_buffer.length;

    while(remaining)
    {
        if(this.read_buffer_idx === this.read_buffers.length)
        {
            dbg_log("Device<" + this.virtio.name + "> Read more than device-readable buffers has", LOG_VIRTIO);
            break;
        }

        const buf = this.read_buffers[this.read_buffer_idx];
        const read_address = buf.addr_low + this.read_buffer_offset;
        let read_length = buf.len - this.read_buffer_offset;

        if(read_length > remaining)
        {
            read_length = remaining;
            this.read_buffer_offset += remaining;
        }
        else
        {
            this.read_buffer_idx++;
            this.read_buffer_offset = 0;
        }

        dest_buffer.set(this.cpu.read_blob(read_address, read_length), dest_offset);

        dest_offset += read_length;
        remaining -= read_length;
    }

    return dest_offset;
};

/**
 * Appends contents of src_buffer into the memory represented by the buffer chain.
 * @param {Uint8Array} src_buffer
 * @return {number} Number of bytes successfully written.
 */
VirtQueueBufferChain.prototype.set_next_blob = function(src_buffer)
{
    let src_offset = 0;
    let remaining = src_buffer.length;

    while(remaining)
    {
        if(this.write_buffer_idx === this.write_buffers.length)
        {
            dbg_log("Device<" + this.virtio.name + "> Write more than device-writable capacity", LOG_VIRTIO);
            break;
        }

        const buf = this.write_buffers[this.write_buffer_idx];
        const write_address = buf.addr_low + this.write_buffer_offset;
        let write_length = buf.len - this.write_buffer_offset;

        if(write_length > remaining)
        {
            write_length = remaining;
            this.write_buffer_offset += remaining;
        }
        else
        {
            this.write_buffer_idx++;
            this.write_buffer_offset = 0;
        }

        const src_end = src_offset + write_length;
        this.cpu.write_blob(src_buffer.subarray(src_offset, src_end), write_address);

        src_offset += write_length;
        remaining -= write_length;
    }

    this.length_written += src_offset;
    return src_offset;
};


// ---- File: lib/marshall.js ----
// -------------------------------------------------
// ------------------ Marshall ---------------------
// -------------------------------------------------
// helper functions for virtio and 9p.



const textde = new TextDecoder();
const texten = new TextEncoder();

// Inserts data from an array to a byte aligned struct in memory
function Marshall(typelist, input, struct, offset) {
    var item;
    var size = 0;
    for(var i=0; i < typelist.length; i++) {
        item = input[i];
        switch(typelist[i]) {
            case "w":
                struct[offset++] = item & 0xFF;
                struct[offset++] = (item >> 8) & 0xFF;
                struct[offset++] = (item >> 16) & 0xFF;
                struct[offset++] = (item >> 24) & 0xFF;
                size += 4;
                break;
            case "d": // double word
                struct[offset++] = item & 0xFF;
                struct[offset++] = (item >> 8) & 0xFF;
                struct[offset++] = (item >> 16) & 0xFF;
                struct[offset++] = (item >> 24) & 0xFF;
                struct[offset++] = 0x0;
                struct[offset++] = 0x0;
                struct[offset++] = 0x0;
                struct[offset++] = 0x0;
                size += 8;
                break;
            case "h":
                struct[offset++] = item & 0xFF;
                struct[offset++] = item >> 8;
                size += 2;
                break;
            case "b":
                struct[offset++] = item;
                size += 1;
                break;
            case "s":
                var lengthoffset = offset;
                var length = 0;
                struct[offset++] = 0; // set the length later
                struct[offset++] = 0;
                size += 2;

                var stringBytes = texten.encode(item);
                size += stringBytes.byteLength;
                length += stringBytes.byteLength;
                struct.set(stringBytes, offset);
                offset += stringBytes.byteLength;

                struct[lengthoffset+0] = length & 0xFF;
                struct[lengthoffset+1] = (length >> 8) & 0xFF;
                break;
            case "Q":
                Marshall(["b", "w", "d"], [item.type, item.version, item.path], struct, offset);
                offset += 13;
                size += 13;
                break;
            default:
                dbg_log("Marshall: Unknown type=" + typelist[i]);
                break;
        }
    }
    return size;
}


// Extracts data from a byte aligned struct in memory to an array
function Unmarshall(typelist, struct, state) {
    let offset = state.offset;
    var output = [];
    for(var i=0; i < typelist.length; i++) {
        switch(typelist[i]) {
            case "w":
                var val = struct[offset++];
                val += struct[offset++] << 8;
                val += struct[offset++] << 16;
                val += (struct[offset++] << 24) >>> 0;
                output.push(val);
                break;
            case "d":
                var val = struct[offset++];
                val += struct[offset++] << 8;
                val += struct[offset++] << 16;
                val += (struct[offset++] << 24) >>> 0;
                offset += 4;
                output.push(val);
                break;
            case "h":
                var val = struct[offset++];
                output.push(val + (struct[offset++] << 8));
                break;
            case "b":
                output.push(struct[offset++]);
                break;
            case "s":
                var len = struct[offset++];
                len += struct[offset++] << 8;

                var stringBytes = struct.slice(offset, offset + len);
                offset += len;
                output.push(textde.decode(stringBytes));
                break;
            case "Q":
                state.offset = offset;
                const qid = Unmarshall(["b", "w", "d"], struct, state);
                offset = state.offset;
                output.push({
                    type: qid[0],
                    version: qid[1],
                    path: qid[2],
                });
                break;
            default:
                dbg_log("Error in Unmarshall: Unknown type=" + typelist[i]);
                break;
        }
    }
    state.offset = offset;
    return output;
}


// ---- File: src/virtio_console.js ----




// For Types Only



// https://docs.oasis-open.org/virtio/virtio/v1.2/csd01/virtio-v1.2-csd01.html#x1-2900003

const VIRTIO_CONSOLE_DEVICE_READY     = 0;
const VIRTIO_CONSOLE_DEVICE_ADD       = 1;
const VIRTIO_CONSOLE_DEVICE_REMOVE    = 2;
const VIRTIO_CONSOLE_PORT_READY       = 3;
const VIRTIO_CONSOLE_CONSOLE_PORT     = 4;
const VIRTIO_CONSOLE_RESIZE           = 5;
const VIRTIO_CONSOLE_PORT_OPEN        = 6;
const VIRTIO_CONSOLE_PORT_NAME        = 7;

const VIRTIO_CONSOLE_F_SIZE           = 0;
const VIRTIO_CONSOLE_F_MULTIPORT      = 1;
const VIRTIO_CONSOLE_F_EMERG_WRITE    = 2;

/**
 * @constructor
 *
 * @param {CPU} cpu
 */
function VirtioConsole(cpu, bus)
{
    /** @const @type {BusConnector} */
    this.bus = bus;
    this.rows = 25;
    this.cols = 80;
    this.ports = 4;

    const queues = [
        {
            size_supported: 16,
            notify_offset: 0,
        },
        {
            size_supported: 16,
            notify_offset: 1,
        },
        {
            size_supported: 16,
            notify_offset: 2,
        },
        {
            size_supported: 16,
            notify_offset: 3,
        },
    ];

    for(let i = 1; i < this.ports; ++i)
    {
        queues.push({size_supported: 16, notify_offset: 0});
        queues.push({size_supported: 8, notify_offset: 1});
    }

    /** @type {VirtIO} */
    this.virtio = new VirtIO(cpu,
    {
        name: "virtio-console",
        pci_id: 0x0C << 3,
        device_id: 0x1043,
        subsystem_device_id: 3,
        common:
        {
            initial_port: 0xB800,
            queues: queues,
            features:
            [
                VIRTIO_CONSOLE_F_SIZE,
                VIRTIO_CONSOLE_F_MULTIPORT,
                VIRTIO_F_VERSION_1,
            ],
            on_driver_ok: () => {},
        },
        notification:
        {
            initial_port: 0xB900,
            single_handler: false,
            handlers:
            [
                (queue_id) =>
                {

                },
                (queue_id) =>
                {
                    const queue = this.virtio.queues[queue_id];
                    const port = queue_id > 3 ? (queue_id-3 >> 1) : 0;
                    while(queue.has_request())
                    {
                        const bufchain = queue.pop_request();
                        const buffer = new Uint8Array(bufchain.length_readable);
                        bufchain.get_next_blob(buffer);
                        this.bus.send("virtio-console" + port + "-output-bytes", buffer);
                        this.Ack(queue_id, bufchain);
                    }
                },
                (queue_id) =>
                {
                    if(queue_id !== 2)
                    {
                        dbg_assert(false, "VirtioConsole Notified for wrong queue: " + queue_id +
                            " (expected queue_id of 2)");
                        return;
                    }
                    const queue = this.virtio.queues[queue_id];
                    // Full buffer looks like an empty buffer so prevent it from filling
                    while(queue.count_requests() > queue.size - 2) queue.pop_request();
                },
                (queue_id) =>
                {
                    if(queue_id !== 3)
                    {
                        dbg_assert(false, "VirtioConsole Notified for wrong queue: " + queue_id +
                            " (expected queue_id of 3)");
                        return;
                    }
                    const queue = this.virtio.queues[queue_id];

                    while(queue.has_request())
                    {
                        const bufchain = queue.pop_request();
                        const buffer = new Uint8Array(bufchain.length_readable);
                        bufchain.get_next_blob(buffer);


                        const parts = marshall.Unmarshall(["w", "h", "h"], buffer, { offset : 0 });
                        const port = parts[0];
                        const event = parts[1];
                        const value = parts[2];


                        this.Ack(queue_id, bufchain);

                        switch(event) {
                            case VIRTIO_CONSOLE_DEVICE_READY:
                                for(let i = 0; i < this.ports; ++i) {
                                    this.SendEvent(i, VIRTIO_CONSOLE_DEVICE_ADD, 0);
                                }
                                break;
                            case VIRTIO_CONSOLE_PORT_READY:
                                this.Ack(queue_id, bufchain);
                                this.SendEvent(port, VIRTIO_CONSOLE_CONSOLE_PORT, 1);
                                this.SendName(port, "virtio-" + port);
                                this.SendEvent(port, VIRTIO_CONSOLE_PORT_OPEN, 1);

                                break;
                            case VIRTIO_CONSOLE_PORT_OPEN:
                                this.Ack(queue_id, bufchain);
                                if(port === 0) {
                                    this.SendWindowSize(port);
                                }
                                break;
                            default:
                                dbg_assert(false," VirtioConsole received unknown event: " + event[1]);
                                return;

                        }
                    }
                },
            ],
        },
        isr_status:
        {
            initial_port: 0xB700,
        },
        device_specific:
        {
            initial_port: 0xB600,
            struct:
            [
                {
                    bytes: 2,
                    name: "cols",
                    read: () => this.cols,
                    write: data => { /* read only */ },
                },
                {
                    bytes: 2,
                    name: "rows",
                    read: () => this.rows,
                    write: data => { /* read only */ },
                },
                {
                    bytes: 4,
                    name: "max_nr_ports",
                    read: () => this.ports,
                    write: data => { /* read only */ },
                },
                {
                    bytes: 4,
                    name: "emerg_wr",
                    read: () => 0,
                    write: data => {
                        dbg_assert(false, "Emergency write!");
                    },
                },
           ]
        },
    });

    for(let port = 0; port < this.ports; ++port) {
        const queue_id = port === 0 ? 0 : port * 2 + 2;
        this.bus.register("virtio-console" + port + "-input-bytes", function(data) {
            const queue = this.virtio.queues[queue_id];
            if(queue.has_request()) {
                const bufchain = queue.pop_request();
                this.Send(queue_id, bufchain, new Uint8Array(data));
            } else {
                //TODO: Buffer
            }
        }, this);

        this.bus.register("virtio-console" + port + "-resize", function(size) {
            if(port === 0) {
                this.cols = size[0];
                this.rows = size[1];
            }

            if(this.virtio.queues[2].is_configured() && this.virtio.queues[2].has_request()) {
                this.SendWindowSize(port, size[0], size[1]);
            }
        }, this);
    }
}

VirtioConsole.prototype.SendWindowSize = function(port, cols = undefined, rows = undefined)
{
    rows = rows || this.rows;
    cols = cols || this.cols;
    const bufchain = this.virtio.queues[2].pop_request();
    const buf = new Uint8Array(12);
    marshall.Marshall(["w", "h", "h", "h", "h"], [port, VIRTIO_CONSOLE_RESIZE, 0, rows, cols], buf, 0);
    this.Send(2, bufchain, buf);
};

VirtioConsole.prototype.SendName = function(port, name)
{
    const bufchain = this.virtio.queues[2].pop_request();
    const namex = new TextEncoder().encode(name);
    const buf = new Uint8Array(8 + namex.length + 1);
    marshall.Marshall(["w", "h", "h"], [port, VIRTIO_CONSOLE_PORT_NAME, 1], buf, 0);
    for( let i = 0; i < namex.length; ++i ) {
        buf[i+8] = namex[i];
    }
    buf[8 + namex.length] = 0;
    this.Send(2, bufchain, buf);
};


VirtioConsole.prototype.get_state = function()
{
    const state = [];

    state[0] = this.virtio;
    state[1] = this.rows;
    state[2] = this.cols;
    state[3] = this.ports;

    return state;
};

VirtioConsole.prototype.set_state = function(state)
{
    this.virtio.set_state(state[0]);
    this.rows = state[1];
    this.cols = state[2];
    this.ports = state[3];
};

VirtioConsole.prototype.reset = function() {
    this.virtio.reset();
};

VirtioConsole.prototype.SendEvent = function(port, event, value)
{
    const queue = this.virtio.queues[2];
    const bufchain = queue.pop_request();

    const buf = new Uint8Array(8);
    marshall.Marshall(["w","h","h"], [port, event, value], buf, 0);
    this.Send(2, bufchain, buf);
};

VirtioConsole.prototype.Send = function (queue_id, bufchain, blob)
{
    bufchain.set_next_blob(blob);
    this.virtio.queues[queue_id].push_reply(bufchain);
    this.virtio.queues[queue_id].flush_replies();
};

VirtioConsole.prototype.Ack = function (queue_id, bufchain)
{
    bufchain.set_next_blob(new Uint8Array(0));
    this.virtio.queues[queue_id].push_reply(bufchain);
    this.virtio.queues[queue_id].flush_replies();
};


// ---- File: src/ps2.js ----




// For Types Only




const PS2_LOG_VERBOSE = false;

/**
 * @constructor
 * @param {CPU} cpu
 * @param {BusConnector} bus
 */
function PS2(cpu, bus)
{
    /** @const @type {CPU} */
    this.cpu = cpu;

    /** @const @type {BusConnector} */
    this.bus = bus;

    this.reset();

    this.bus.register("keyboard-code", function(code)
    {
        this.kbd_send_code(code);
    }, this);

    this.bus.register("mouse-click", function(data)
    {
        this.mouse_send_click(data[0], data[1], data[2]);
    }, this);

    this.bus.register("mouse-delta", function(data)
    {
        this.mouse_send_delta(data[0], data[1]);
    }, this);

    this.bus.register("mouse-wheel", function(data)
    {
        this.wheel_movement -= data[0];
        this.wheel_movement -= data[1] * 2; // X Wheel Movement
        this.wheel_movement = Math.min(7, Math.max(-8, this.wheel_movement));
        this.send_mouse_packet(0, 0);
    }, this);

    cpu.io.register_read(0x60, this, this.port60_read);
    cpu.io.register_read(0x64, this, this.port64_read);

    cpu.io.register_write(0x60, this, this.port60_write);
    cpu.io.register_write(0x64, this, this.port64_write);
}

PS2.prototype.reset = function()
{
    /** @type {boolean} */
    this.enable_mouse_stream = false;

    /** @type {boolean} */
    this.use_mouse = false;

    /** @type {boolean} */
    this.have_mouse = true;

    /** @type {number} */
    this.mouse_delta_x = 0;
    /** @type {number} */
    this.mouse_delta_y = 0;
    /** @type {number} */
    this.mouse_clicks = 0;

    /** @type {boolean} */
    this.have_keyboard = true;

    /** @type {boolean} */
    this.enable_keyboard_stream = false;

    /** @type {boolean} */
    this.next_is_mouse_command = false;

    /** @type {boolean} */
    this.next_read_sample = false;

    /** @type {boolean} */
    this.next_read_led = false;

    /** @type {boolean} */
    this.next_handle_scan_code_set = false;

    /** @type {boolean} */
    this.next_read_rate = false;

    /** @type {boolean} */
    this.next_read_resolution = false;

    /**
     * @type {ByteQueue}
     */
    this.kbd_buffer = new ByteQueue(1024);

    this.last_port60_byte = 0;

    /** @type {number} */
    this.sample_rate = 100;

    /** @type {number} */
    this.mouse_detect_state = 0;

    /** @type {number} */
    this.mouse_id = 0x00;

    /** @type {boolean} */
    this.mouse_reset_workaround = false;

    /** @type {number} */
    this.wheel_movement = 0;

    /** @type {number} */
    this.resolution = 4;

    /** @type {boolean} */
    this.scaling2 = false;

    /** @type {number} */
    this.last_mouse_packet = -1;

    /**
     * @type {ByteQueue}
     */
    this.mouse_buffer = new ByteQueue(1024);

    /**
     * @type {boolean}
     * Also known as DBBOUT OBF - Output Buffer Full flag
     */
    this.next_byte_is_ready = false;

    /** @type {boolean} */
    this.next_byte_is_aux = false;

    this.command_register = 1 | 4;
    // TODO: What should be the initial value?
    this.controller_output_port = 0;
    this.read_output_register = false;
    this.read_command_register = false;
    this.read_controller_output_port = false;
};

PS2.prototype.get_state = function()
{
    var state = [];

    state[0] = this.enable_mouse_stream;
    state[1] = this.use_mouse;
    state[2] = this.have_mouse;
    state[3] = this.mouse_delta_x;
    state[4] = this.mouse_delta_y;
    state[5] = this.mouse_clicks;
    state[6] = this.have_keyboard;
    state[7] = this.enable_keyboard_stream;
    state[8] = this.next_is_mouse_command;
    state[9] = this.next_read_sample;
    state[10] = this.next_read_led;
    state[11] = this.next_handle_scan_code_set;
    state[12] = this.next_read_rate;
    state[13] = this.next_read_resolution;
    //state[14] = this.kbd_buffer;
    state[15] = this.last_port60_byte;
    state[16] = this.sample_rate;
    state[17] = this.resolution;
    state[18] = this.scaling2;
    //state[19] = this.mouse_buffer;
    state[20] = this.command_register;
    state[21] = this.read_output_register;
    state[22] = this.read_command_register;
    state[23] = this.controller_output_port;
    state[24] = this.read_controller_output_port;
    state[25] = this.mouse_id;
    state[26] = this.mouse_detect_state;
    state[27] = this.mouse_reset_workaround;

    return state;
};

PS2.prototype.set_state = function(state)
{
    this.enable_mouse_stream = state[0];
    this.use_mouse = state[1];
    this.have_mouse = state[2];
    this.mouse_delta_x = state[3];
    this.mouse_delta_y = state[4];
    this.mouse_clicks = state[5];
    this.have_keyboard = state[6];
    this.enable_keyboard_stream = state[7];
    this.next_is_mouse_command = state[8];
    this.next_read_sample = state[9];
    this.next_read_led = state[10];
    this.next_handle_scan_code_set = state[11];
    this.next_read_rate = state[12];
    this.next_read_resolution = state[13];
    //this.kbd_buffer = state[14];
    this.last_port60_byte = state[15];
    this.sample_rate = state[16];
    this.resolution = state[17];
    this.scaling2 = state[18];
    //this.mouse_buffer = state[19];
    this.command_register = state[20];
    this.read_output_register = state[21];
    this.read_command_register = state[22];
    this.controller_output_port = state[23];
    this.read_controller_output_port = state[24];
    this.mouse_id = state[25] || 0;
    this.mouse_detect_state = state[26] || 0;
    this.mouse_reset_workaround = state[27] || false;

    this.next_byte_is_ready = false;
    this.next_byte_is_aux = false;
    this.kbd_buffer.clear();
    this.mouse_buffer.clear();

    this.bus.send("mouse-enable", this.use_mouse);
};

PS2.prototype.raise_irq = function()
{
    if(this.next_byte_is_ready)
    {
        // Wait until previous byte is read
        // http://halicery.com/Hardware/8042/8042_1503033_TXT.htm
        return;
    }

    // Kbd has priority over aux
    if(this.kbd_buffer.length)
    {
        this.kbd_irq();
    }
    else if(this.mouse_buffer.length)
    {
        this.mouse_irq();
    }
};

PS2.prototype.mouse_irq = function()
{
    this.next_byte_is_ready = true;
    this.next_byte_is_aux = true;

    if(this.command_register & 2)
    {
        dbg_log("Mouse irq", LOG_PS2);

        // Pulse the irq line
        // Note: can't lower immediately after rising, so lower before rising
        // http://www.os2museum.com/wp/ibm-ps2-model-50-keyboard-controller/
        this.cpu.device_lower_irq(12);
        this.cpu.device_raise_irq(12);
    }
};

PS2.prototype.kbd_irq = function()
{
    this.next_byte_is_ready = true;
    this.next_byte_is_aux = false;

    if(this.command_register & 1)
    {
        dbg_log("Keyboard irq", LOG_PS2);

        // Pulse the irq line
        // Note: can't lower immediately after rising, so lower before rising
        // http://www.os2museum.com/wp/ibm-ps2-model-50-keyboard-controller/
        this.cpu.device_lower_irq(1);
        this.cpu.device_raise_irq(1);
    }
};

PS2.prototype.kbd_send_code = function(code)
{
    if(this.enable_keyboard_stream)
    {
        dbg_log("adding kbd code: " + h(code), LOG_PS2);
        this.kbd_buffer.push(code);
        this.raise_irq();
    }
};

PS2.prototype.mouse_send_delta = function(delta_x, delta_y)
{
    if(!this.have_mouse || !this.use_mouse)
    {
        return;
    }

    // note: delta_x or delta_y can be floating point numbers

    var factor = this.resolution * this.sample_rate / 80;

    this.mouse_delta_x += delta_x * factor;
    this.mouse_delta_y += delta_y * factor;

    if(this.enable_mouse_stream)
    {
        var change_x = this.mouse_delta_x | 0,
            change_y = this.mouse_delta_y | 0;

        if(change_x || change_y)
        {
            var now = Date.now();

            //if(now - this.last_mouse_packet < 1000 / this.sample_rate)
            //{
            //    // TODO: set timeout
            //    return;
            //}

            this.mouse_delta_x -= change_x;
            this.mouse_delta_y -= change_y;

            this.send_mouse_packet(change_x, change_y);
        }
    }
};

PS2.prototype.mouse_send_click = function(left, middle, right)
{
    if(!this.have_mouse || !this.use_mouse)
    {
        return;
    }

    this.mouse_clicks = left | right << 1 | middle << 2;

    if(this.enable_mouse_stream)
    {
        this.send_mouse_packet(0, 0);
    }
};

PS2.prototype.send_mouse_packet = function(dx, dy)
{
    var info_byte =
            (dy < 0) << 5 |
            (dx < 0) << 4 |
            1 << 3 |
            this.mouse_clicks,
        delta_x = dx,
        delta_y = dy;

    this.last_mouse_packet = Date.now();

    //if(this.scaling2)
    //{
    //    // only in automatic packets, not 0xEB requests
    //    delta_x = this.apply_scaling2(delta_x);
    //    delta_y = this.apply_scaling2(delta_y);
    //}

    this.mouse_buffer.push(info_byte);
    this.mouse_buffer.push(delta_x);
    this.mouse_buffer.push(delta_y);

    if(this.mouse_id === 0x04)
    {
        this.mouse_buffer.push(
            0 << 5 | // TODO: 5th button
            0 << 4 | // TODO: 4th button
            this.wheel_movement & 0x0F
        );
        this.wheel_movement = 0;
    }
    else if(this.mouse_id === 0x03)
    {
        this.mouse_buffer.push(this.wheel_movement & 0xFF); // Byte 4 - Z Movement
        this.wheel_movement = 0;
    }

    if(PS2_LOG_VERBOSE)
    {
        dbg_log("adding mouse packets: " + [info_byte, dx, dy], LOG_PS2);
    }

    this.raise_irq();
};

PS2.prototype.apply_scaling2 = function(n)
{
    // http://www.computer-engineering.org/ps2mouse/#Inputs.2C_Resolution.2C_and_Scaling
    var abs = Math.abs(n),
        sign = n >> 31;

    switch(abs)
    {
        case 0:
        case 1:
        case 3:
            return n;
        case 2:
            return sign;
        case 4:
            return 6 * sign;
        case 5:
            return 9 * sign;
        default:
            return n << 1;
    }
};

PS2.prototype.port60_read = function()
{
    //dbg_log("port 60 read: " + (buffer[0] || "(none)"));

    this.next_byte_is_ready = false;

    if(!this.kbd_buffer.length && !this.mouse_buffer.length)
    {
        // should not happen
        dbg_log("Port 60 read: Empty", LOG_PS2);
        return this.last_port60_byte;
    }

    if(this.next_byte_is_aux)
    {
        this.cpu.device_lower_irq(12);
        this.last_port60_byte = this.mouse_buffer.shift();
        dbg_log("Port 60 read (mouse): " + h(this.last_port60_byte), LOG_PS2);
    }
    else
    {
        this.cpu.device_lower_irq(1);
        this.last_port60_byte = this.kbd_buffer.shift();
        dbg_log("Port 60 read (kbd)  : " + h(this.last_port60_byte), LOG_PS2);
    }

    if(this.kbd_buffer.length || this.mouse_buffer.length)
    {
        this.raise_irq();
    }

    return this.last_port60_byte;
};

PS2.prototype.port64_read = function()
{
    // status port

    var status_byte = 0x10;

    if(this.next_byte_is_ready)
    {
        status_byte |= 0x1;
    }
    if(this.next_byte_is_aux)
    {
        status_byte |= 0x20;
    }

    dbg_log("port 64 read: " + h(status_byte), LOG_PS2);

    return status_byte;
};

PS2.prototype.port60_write = function(write_byte)
{
    dbg_log("port 60 write: " + h(write_byte), LOG_PS2);

    if(this.read_command_register)
    {
        this.command_register = write_byte;
        this.read_command_register = false;

        // not sure, causes "spurious ack" in Linux
        //this.kbd_buffer.push(0xFA);
        //this.kbd_irq();

        dbg_log("Keyboard command register = " + h(this.command_register), LOG_PS2);
    }
    else if(this.read_output_register)
    {
        this.read_output_register = false;

        this.mouse_buffer.clear();
        this.mouse_buffer.push(write_byte);
        this.mouse_irq();
    }
    else if(this.next_read_sample)
    {
        this.next_read_sample = false;
        this.mouse_buffer.clear();
        this.mouse_buffer.push(0xFA);

        this.sample_rate = write_byte;

        switch(this.mouse_detect_state)
        {
            case -1:
                if(write_byte === 60)
                {
                    // Detect Windows NT and turn on workaround the bug
                    // 200->100->80->60
                    this.mouse_reset_workaround = true;
                    this.mouse_detect_state = 0;
                }
                else
                {
                    this.mouse_reset_workaround = false;
                    this.mouse_detect_state = (write_byte === 200) ? 1 : 0;
                }
                break;
            case 0:
                if(write_byte === 200) this.mouse_detect_state = 1;
                break;
            case 1:
                if(write_byte === 100) this.mouse_detect_state = 2;
                else if(write_byte === 200) this.mouse_detect_state = 3;
                else this.mouse_detect_state = 0;
                break;
            case 2:
                // Host sends sample rate 200->100->80 to activate Intellimouse wheel
                if(write_byte === 80) this.mouse_id = 0x03;
                this.mouse_detect_state = -1;
                break;
            case 3:
                // Host sends sample rate 200->200->80 to activate Intellimouse 4th, 5th buttons
                if(write_byte === 80) this.mouse_id = 0x04;
                this.mouse_detect_state = -1;
                break;
        }

        dbg_log("mouse sample rate: " + h(write_byte) + ", mouse id: " + h(this.mouse_id), LOG_PS2);

        if(!this.sample_rate)
        {
            dbg_log("invalid sample rate, reset to 100", LOG_PS2);
            this.sample_rate = 100;
        }

        this.mouse_irq();
    }
    else if(this.next_read_resolution)
    {
        this.next_read_resolution = false;
        this.mouse_buffer.clear();
        this.mouse_buffer.push(0xFA);

        if(write_byte > 3)
        {
            this.resolution = 4;
            dbg_log("invalid resolution, resetting to 4", LOG_PS2);
        }
        else
        {
            this.resolution = 1 << write_byte;
            dbg_log("resolution: " + this.resolution, LOG_PS2);
        }
        this.mouse_irq();
    }
    else if(this.next_read_led)
    {
        // nope
        this.next_read_led = false;
        this.kbd_buffer.push(0xFA);
        this.kbd_irq();
    }
    else if(this.next_handle_scan_code_set)
    {
        this.next_handle_scan_code_set = false;

        this.kbd_buffer.push(0xFA);
        this.kbd_irq();

        if(write_byte)
        {
            // set scan code set
        }
        else
        {
            this.kbd_buffer.push(1);
        }
    }
    else if(this.next_read_rate)
    {
        // nope
        this.next_read_rate = false;
        this.kbd_buffer.push(0xFA);
        this.kbd_irq();
    }
    else if(this.next_is_mouse_command)
    {
        this.next_is_mouse_command = false;
        dbg_log("Port 60 data register write: " + h(write_byte), LOG_PS2);

        if(!this.have_mouse)
        {
            return;
        }

        // send ack
        this.kbd_buffer.clear();
        this.mouse_buffer.clear();
        this.mouse_buffer.push(0xFA);

        switch(write_byte)
        {
        case 0xE6:
            // set scaling to 1:1
            dbg_log("Scaling 1:1", LOG_PS2);
            this.scaling2 = false;
            break;
        case 0xE7:
            // set scaling to 2:1
            dbg_log("Scaling 2:1", LOG_PS2);
            this.scaling2 = true;
            break;
        case 0xE8:
            // set mouse resolution
            this.next_read_resolution = true;
            break;
        case 0xE9:
            // status request - send one packet
            this.send_mouse_packet(0, 0);
            break;
        case 0xEB:
            // request single packet
            dbg_log("unimplemented request single packet", LOG_PS2);
            this.send_mouse_packet(0, 0);
            break;
        case 0xF2:
            //  MouseID Byte
            dbg_log("required id: " + h(this.mouse_id), LOG_PS2);
            this.mouse_buffer.push(this.mouse_id);

            this.mouse_clicks = this.mouse_delta_x = this.mouse_delta_y = 0;
            // this.send_mouse_packet(0, 0);
            this.raise_irq();
            break;
        case 0xF3:
            // sample rate
            this.next_read_sample = true;
            break;
        case 0xF4:
            // enable streaming
            this.enable_mouse_stream = true;
            this.use_mouse = true;
            this.bus.send("mouse-enable", true);

            this.mouse_clicks = this.mouse_delta_x = this.mouse_delta_y = 0;
            break;
        case 0xF5:
            // disable streaming
            this.enable_mouse_stream = false;
            break;
        case 0xF6:
            // set defaults
            this.enable_mouse_stream = false;
            this.sample_rate = 100;
            this.scaling2 = false;
            this.resolution = 4;
            break;
        case 0xFF:
            // reset, send completion code
            dbg_log("Mouse reset", LOG_PS2);
            this.mouse_buffer.push(0xAA);
            this.mouse_buffer.push(0);

            this.use_mouse = true;
            this.bus.send("mouse-enable", true);

            this.enable_mouse_stream = false;
            this.sample_rate = 100;
            this.scaling2 = false;
            this.resolution = 4;

            if(!this.mouse_reset_workaround)
            {
                this.mouse_id = 0x00;
            }

            this.mouse_clicks = this.mouse_delta_x = this.mouse_delta_y = 0;
            break;

        default:
            dbg_log("Unimplemented mouse command: " + h(write_byte), LOG_PS2);
        }

        this.mouse_irq();
    }
    else if(this.read_controller_output_port)
    {
        this.read_controller_output_port = false;
        this.controller_output_port = write_byte;
        // If we ever want to implement A20 masking, here is where
        // we should turn the masking off if the second bit is on
    }
    else
    {
        dbg_log("Port 60 data register write: " + h(write_byte), LOG_PS2);

        // send ack
        this.mouse_buffer.clear();
        this.kbd_buffer.clear();
        this.kbd_buffer.push(0xFA);

        switch(write_byte)
        {
        case 0xED:
            this.next_read_led = true;
            break;
        case 0xF0:
            // get/set scan code set
            this.next_handle_scan_code_set = true;
            break;
        case 0xF2:
            // identify
            this.kbd_buffer.push(0xAB);
            this.kbd_buffer.push(0x83);
            break;
        case 0xF3:
            //  Set typematic rate and delay
            this.next_read_rate = true;
            break;
        case 0xF4:
            // enable scanning
            dbg_log("kbd enable scanning", LOG_PS2);
            this.enable_keyboard_stream = true;
            break;
        case 0xF5:
            // disable scanning
            dbg_log("kbd disable scanning", LOG_PS2);
            this.enable_keyboard_stream = false;
            break;
        case 0xF6:
            // reset defaults
            //this.enable_keyboard_stream = false;
            break;
        case 0xFF:
            this.kbd_buffer.clear();
            this.kbd_buffer.push(0xFA);
            this.kbd_buffer.push(0xAA);
            this.kbd_buffer.push(0);
            break;
        default:
            dbg_log("Unimplemented keyboard command: " + h(write_byte), LOG_PS2);
        }

        this.kbd_irq();
    }
};

PS2.prototype.port64_write = function(write_byte)
{
    dbg_log("port 64 write: " + h(write_byte), LOG_PS2);

    switch(write_byte)
    {
    case 0x20:
        this.kbd_buffer.clear();
        this.mouse_buffer.clear();
        this.kbd_buffer.push(this.command_register);
        this.kbd_irq();
        break;
    case 0x60:
        this.read_command_register = true;
        break;
    case 0xD1:
        this.read_controller_output_port = true;
        break;
    case 0xD3:
        this.read_output_register = true;
        break;
    case 0xD4:
        this.next_is_mouse_command = true;
        break;
    case 0xA7:
        // Disable second port
        dbg_log("Disable second port", LOG_PS2);
        this.command_register |= 0x20;
        break;
    case 0xA8:
        // Enable second port
        dbg_log("Enable second port", LOG_PS2);
        this.command_register &= ~0x20;
        break;
    case 0xA9:
        // test second ps/2 port
        this.kbd_buffer.clear();
        this.mouse_buffer.clear();
        this.kbd_buffer.push(0);
        this.kbd_irq();
        break;
    case 0xAA:
        this.kbd_buffer.clear();
        this.mouse_buffer.clear();
        this.kbd_buffer.push(0x55);
        this.kbd_irq();
        break;
    case 0xAB:
        // Test first PS/2 port
        this.kbd_buffer.clear();
        this.mouse_buffer.clear();
        this.kbd_buffer.push(0);
        this.kbd_irq();
        break;
    case 0xAD:
        // Disable Keyboard
        dbg_log("Disable Keyboard", LOG_PS2);
        this.command_register |= 0x10;
        break;
    case 0xAE:
        // Enable Keyboard
        dbg_log("Enable Keyboard", LOG_PS2);
        this.command_register &= ~0x10;
        break;
    case 0xFE:
        dbg_log("CPU reboot via PS2");
        this.cpu.reboot_internal();
        break;
    default:
        dbg_log("port 64: Unimplemented command byte: " + h(write_byte), LOG_PS2);
    }
};


// ---- File: src/elf.js ----


// A minimal elf parser for loading 32 bit, x86, little endian, executable elf files

const ELF_MAGIC = 0x464C457F;

const types = DataView.prototype;
const U8 = { size: 1, get: types.getUint8, set: types.setUint8, };
const U16 = { size: 2, get: types.getUint16, set: types.setUint16, };
const U32 = { size: 4, get: types.getUint32, set: types.setUint32, };
const pad = function(size)
{
    return {
        size,
        get: offset => -1,
    };
};

const Header = create_struct([
    { magic: U32, },

    { class: U8, },
    { data: U8, },
    { version0: U8, },
    { osabi: U8, },

    { abiversion: U8, },
    { pad0: pad(7) },

    { type: U16, },
    { machine: U16, },

    { version1: U32, },
    { entry: U32, },
    { phoff: U32, },
    { shoff: U32, },
    { flags: U32, },

    { ehsize: U16, },
    { phentsize: U16, },
    { phnum: U16, },
    { shentsize: U16, },
    { shnum: U16, },
    { shstrndx: U16, },
]);
console.assert(Header.reduce((a, entry) => a + entry.size, 0) === 52);

const ProgramHeader = create_struct([
    { type: U32, },
    { offset: U32, },
    { vaddr: U32, },
    { paddr: U32, },
    { filesz: U32, },
    { memsz: U32, },
    { flags: U32, },
    { align: U32, },
]);
console.assert(ProgramHeader.reduce((a, entry) => a + entry.size, 0) === 32);

const SectionHeader = create_struct([
    { name: U32, },
    { type: U32, },
    { flags: U32, },
    { addr: U32, },
    { offset: U32, },
    { size: U32, },
    { link: U32, },
    { info: U32, },
    { addralign: U32, },
    { entsize: U32, },
]);
console.assert(SectionHeader.reduce((a, entry) => a + entry.size, 0) === 40);


// From [{ name: type }, ...] to [{ name, type, size, get, set }, ...]
function create_struct(struct)
{
    return struct.map(function(entry)
    {
        const keys = Object.keys(entry);
        console.assert(keys.length === 1);
        const name = keys[0];
        const type = entry[name];

        console.assert(type.size > 0);

        return {
            name,
            type,
            size: type.size,
            get: type.get,
            set: type.set,
        };
    });
}

/** @param {ArrayBuffer} buffer */
function read_elf(buffer)
{
    const view = new DataView(buffer);

    const [header, offset] = read_struct(view, Header);
    console.assert(offset === 52);

    if(DEBUG)
    {
        for(const key of Object.keys(header))
        {
            dbg_log(key + ": 0x" + (header[key].toString(16) >>> 0));
        }
    }

    console.assert(header.magic === ELF_MAGIC, "Bad magic");
    console.assert(header.class === 1, "Unimplemented: 64 bit elf");
    console.assert(header.data === 1, "Unimplemented: big endian");
    console.assert(header.version0 === 1, "Bad version0");

    // 1, 2, 3, 4 specify whether the object is relocatable, executable,
    // shared, or core, respectively.
    console.assert(header.type === 2, "Unimplemented type");

    console.assert(header.version1 === 1, "Bad version1");

    // these are different in 64 bit
    console.assert(header.ehsize === 52, "Bad header size");
    console.assert(header.phentsize === 32, "Bad program header size");
    console.assert(header.shentsize === 40, "Bad section header size");

    const [program_headers, ph_offset] = read_structs(
        view_slice(view, header.phoff, header.phentsize * header.phnum),
        ProgramHeader,
        header.phnum);

    const [sections_headers, sh_offset] = read_structs(
        view_slice(view, header.shoff, header.shentsize * header.shnum),
        SectionHeader,
        header.shnum);

    if(DEBUG && LOG_LEVEL)
    {
        console.log("%d program headers:", program_headers.length);
        for(const program of program_headers)
        {
            console.log(
                "type=%s offset=%s vaddr=%s paddr=%s " +
                "filesz=%s memsz=%s flags=%s align=%s",
                program.type.toString(16),
                program.offset.toString(16),
                program.vaddr.toString(16),
                program.paddr.toString(16),
                program.filesz.toString(16),
                program.memsz.toString(16),
                program.flags.toString(16),
                program.align.toString(16)
            );
        }

        console.log("%d section headers:", sections_headers.length);
        for(const section of sections_headers)
        {
            console.log(
                "name=%s type=%s flags=%s addr=%s offset=%s " +
                "size=%s link=%s info=%s addralign=%s entsize=%s",
                section.name.toString(16),
                section.type.toString(16),
                section.flags.toString(16),
                section.addr.toString(16),
                section.offset.toString(16),
                section.size.toString(16),
                section.link.toString(16),
                section.info.toString(16),
                section.addralign.toString(16),
                section.entsize.toString(16)
            );
        }
    }

    return {
        header,
        program_headers,
        sections_headers,
    };
}

function read_struct(view, Struct)
{
    const result = {};
    let offset = 0;
    const LITTLE_ENDIAN = true; // big endian not supported yet

    for(const entry of Struct)
    {
        const value = entry.get.call(view, offset, LITTLE_ENDIAN);
        console.assert(result[entry.name] === undefined);
        result[entry.name] = value;
        offset += entry.size;
    }

    return [result, offset];
}

function read_structs(view, Struct, count)
{
    const result = [];
    let offset = 0;

    for(var i = 0; i < count; i++)
    {
        const [s, size] = read_struct(view_slice(view, offset), Struct);
        result.push(s);
        offset += size;
    }

    return [result, offset];
}

/** @param {number=} length */
function view_slice(view, offset, length)
{
    return new DataView(view.buffer, view.byteOffset + offset, length);
}


// ---- File: src/rtc.js ----





// For Types Only




const CMOS_RTC_SECONDS = 0x00;
const CMOS_RTC_SECONDS_ALARM = 0x01;
const CMOS_RTC_MINUTES = 0x02;
const CMOS_RTC_MINUTES_ALARM = 0x03;
const CMOS_RTC_HOURS = 0x04;
const CMOS_RTC_HOURS_ALARM = 0x05;
const CMOS_RTC_DAY_WEEK = 0x06;
const CMOS_RTC_DAY_MONTH = 0x07;
const CMOS_RTC_MONTH = 0x08;
const CMOS_RTC_YEAR = 0x09;
const CMOS_STATUS_A = 0x0a;
const CMOS_STATUS_B = 0x0b;
const CMOS_STATUS_C = 0x0c;
const CMOS_STATUS_D = 0x0d;
const CMOS_RESET_CODE = 0x0f;

const CMOS_FLOPPY_DRIVE_TYPE = 0x10;
const CMOS_DISK_DATA = 0x12;
const CMOS_EQUIPMENT_INFO = 0x14;
const CMOS_MEM_BASE_LOW = 0x15;
const CMOS_MEM_BASE_HIGH = 0x16;
const CMOS_MEM_OLD_EXT_LOW = 0x17;
const CMOS_MEM_OLD_EXT_HIGH = 0x18;
const CMOS_DISK_DRIVE1_TYPE = 0x19;
const CMOS_DISK_DRIVE2_TYPE = 0x1a;
const CMOS_DISK_DRIVE1_CYL = 0x1b;
const CMOS_DISK_DRIVE2_CYL = 0x24;
const CMOS_MEM_EXTMEM_LOW = 0x30;
const CMOS_MEM_EXTMEM_HIGH = 0x31;
const CMOS_CENTURY = 0x32;
const CMOS_MEM_EXTMEM2_LOW = 0x34;
const CMOS_MEM_EXTMEM2_HIGH = 0x35;
const CMOS_CENTURY2 = 0x37;
const CMOS_BIOS_BOOTFLAG1 = 0x38;
const CMOS_BIOS_DISKTRANSFLAG = 0x39;
const CMOS_BIOS_BOOTFLAG2 = 0x3d;
const CMOS_MEM_HIGHMEM_LOW = 0x5b;
const CMOS_MEM_HIGHMEM_MID = 0x5c;
const CMOS_MEM_HIGHMEM_HIGH = 0x5d;
const CMOS_BIOS_SMP_COUNT = 0x5f;

// see CPU.prototype.fill_cmos
const BOOT_ORDER_CD_FIRST = 0x123;
const BOOT_ORDER_HD_FIRST = 0x312;
const BOOT_ORDER_FD_FIRST = 0x321;

/**
 * RTC (real time clock) and CMOS
 * @constructor
 * @param {CPU} cpu
 */
function RTC(cpu)
{
    /** @const @type {CPU} */
    this.cpu = cpu;

    this.cmos_index = 0;
    this.cmos_data = new Uint8Array(128);

    // used for cmos entries
    this.rtc_time = Date.now();
    this.last_update = this.rtc_time;

    // used for periodic interrupt
    this.next_interrupt = 0;

    // next alarm interrupt
    this.next_interrupt_alarm = 0;

    this.periodic_interrupt = false;

    // corresponds to default value for cmos_a
    this.periodic_interrupt_time = 1000 / 1024;

    this.cmos_a = 0x26;
    this.cmos_b = 2;
    this.cmos_c = 0;

    this.nmi_disabled = 0;

    cpu.io.register_write(0x70, this, function(out_byte)
    {
        this.cmos_index = out_byte & 0x7F;
        this.nmi_disabled = out_byte >> 7;
    });

    cpu.io.register_write(0x71, this, this.cmos_port_write);
    cpu.io.register_read(0x71, this, this.cmos_port_read);
}

RTC.prototype.get_state = function()
{
    var state = [];

    state[0] = this.cmos_index;
    state[1] = this.cmos_data;
    state[2] = this.rtc_time;
    state[3] = this.last_update;
    state[4] = this.next_interrupt;
    state[5] = this.next_interrupt_alarm;
    state[6] = this.periodic_interrupt;
    state[7] = this.periodic_interrupt_time;
    state[8] = this.cmos_a;
    state[9] = this.cmos_b;
    state[10] = this.cmos_c;
    state[11] = this.nmi_disabled;

    return state;
};

RTC.prototype.set_state = function(state)
{
    this.cmos_index = state[0];
    this.cmos_data = state[1];
    this.rtc_time = state[2];
    this.last_update = state[3];
    this.next_interrupt = state[4];
    this.next_interrupt_alarm = state[5];
    this.periodic_interrupt = state[6];
    this.periodic_interrupt_time = state[7];
    this.cmos_a = state[8];
    this.cmos_b = state[9];
    this.cmos_c = state[10];
    this.nmi_disabled = state[11];
};

RTC.prototype.timer = function(time, legacy_mode)
{
    time = Date.now(); // XXX
    this.rtc_time += time - this.last_update;
    this.last_update = time;

    if(this.periodic_interrupt && this.next_interrupt < time)
    {
        this.cpu.device_raise_irq(8);
        this.cmos_c |= 1 << 6 | 1 << 7;

        this.next_interrupt += this.periodic_interrupt_time *
                Math.ceil((time - this.next_interrupt) / this.periodic_interrupt_time);
    }
    else if(this.next_interrupt_alarm && this.next_interrupt_alarm < time)
    {
        this.cpu.device_raise_irq(8);
        this.cmos_c |= 1 << 5 | 1 << 7;

        this.next_interrupt_alarm = 0;
    }

    let t = 100;

    if(this.periodic_interrupt && this.next_interrupt)
    {
        t = Math.min(t, Math.max(0, this.next_interrupt - time));
    }
    if(this.next_interrupt_alarm)
    {
        t = Math.min(t, Math.max(0, this.next_interrupt_alarm - time));
    }

    return t;
};

RTC.prototype.bcd_pack = function(n)
{
    var i = 0,
        result = 0,
        digit;

    while(n)
    {
        digit = n % 10;

        result |= digit << (4 * i);
        i++;
        n = (n - digit) / 10;
    }

    return result;
};

RTC.prototype.bcd_unpack = function(n)
{
    const low = n & 0xF;
    const high = n >> 4 & 0xF;

    dbg_assert(n < 0x100);
    dbg_assert(low < 10);
    dbg_assert(high < 10);

    return low + 10 * high;
};

RTC.prototype.encode_time = function(t)
{
    if(this.cmos_b & 4)
    {
        // binary mode
        return t;
    }
    else
    {
        return this.bcd_pack(t);
    }
};

RTC.prototype.decode_time = function(t)
{
    if(this.cmos_b & 4)
    {
        // binary mode
        return t;
    }
    else
    {
        return this.bcd_unpack(t);
    }
};

// TODO
// - interrupt on update
// - countdown
// - letting bios/os set values
// (none of these are used by seabios or the OSes we're
// currently testing)
RTC.prototype.cmos_port_read = function()
{
    var index = this.cmos_index;

    //this.cmos_index = 0xD;

    switch(index)
    {
        case CMOS_RTC_SECONDS:
            dbg_log("read second: " + h(this.encode_time(new Date(this.rtc_time).getUTCSeconds())), LOG_RTC);
            return this.encode_time(new Date(this.rtc_time).getUTCSeconds());
        case CMOS_RTC_MINUTES:
            dbg_log("read minute: " + h(this.encode_time(new Date(this.rtc_time).getUTCMinutes())), LOG_RTC);
            return this.encode_time(new Date(this.rtc_time).getUTCMinutes());
        case CMOS_RTC_HOURS:
            dbg_log("read hour: " + h(this.encode_time(new Date(this.rtc_time).getUTCHours())), LOG_RTC);
            // TODO: 12 hour mode
            return this.encode_time(new Date(this.rtc_time).getUTCHours());
        case CMOS_RTC_DAY_WEEK:
            dbg_log("read day: " + h(this.encode_time(new Date(this.rtc_time).getUTCDay() + 1)), LOG_RTC);
            return this.encode_time(new Date(this.rtc_time).getUTCDay() + 1);
        case CMOS_RTC_DAY_MONTH:
            dbg_log("read day of month: " + h(this.encode_time(new Date(this.rtc_time).getUTCDate())), LOG_RTC);
            return this.encode_time(new Date(this.rtc_time).getUTCDate());
        case CMOS_RTC_MONTH:
            dbg_log("read month: " + h(this.encode_time(new Date(this.rtc_time).getUTCMonth() + 1)), LOG_RTC);
            return this.encode_time(new Date(this.rtc_time).getUTCMonth() + 1);
        case CMOS_RTC_YEAR:
            dbg_log("read year: " + h(this.encode_time(new Date(this.rtc_time).getUTCFullYear() % 100)), LOG_RTC);
            return this.encode_time(new Date(this.rtc_time).getUTCFullYear() % 100);

        case CMOS_STATUS_A:
            if(v86.microtick() % 1000 >= 999)
            {
                // Set update-in-progress for one millisecond every second (we
                // may not have precision higher than that in browser
                // environments)
                return this.cmos_a | 0x80;
            }
            return this.cmos_a;
        case CMOS_STATUS_B:
            //dbg_log("cmos read from index " + h(index));
            return this.cmos_b;

        case CMOS_STATUS_C:
            // It is important to know that upon a IRQ 8, Status Register C
            // will contain a bitmask telling which interrupt happened.
            // What is important is that if register C is not read after an
            // IRQ 8, then the interrupt will not happen again.
            this.cpu.device_lower_irq(8);

            dbg_log("cmos reg C read", LOG_RTC);
            // Missing IRQF flag
            //return cmos_b & 0x70;
            var c = this.cmos_c;

            this.cmos_c &= ~0xF0;

            return c;

        case CMOS_STATUS_D:
            return 0;

        case CMOS_CENTURY:
        case CMOS_CENTURY2:
            dbg_log("read century: " + h(this.encode_time(new Date(this.rtc_time).getUTCFullYear() / 100 | 0)), LOG_RTC);
            return this.encode_time(new Date(this.rtc_time).getUTCFullYear() / 100 | 0);

        default:
            dbg_log("cmos read from index " + h(index), LOG_RTC);
            return this.cmos_data[this.cmos_index];
    }
};

RTC.prototype.cmos_port_write = function(data_byte)
{
    switch(this.cmos_index)
    {
        case 0xA:
            this.cmos_a = data_byte & 0x7F;
            this.periodic_interrupt_time = 1000 / (32768 >> (this.cmos_a & 0xF) - 1);

            dbg_log("Periodic interrupt, a=" + h(this.cmos_a, 2) + " t=" + this.periodic_interrupt_time , LOG_RTC);
            break;
        case 0xB:
            this.cmos_b = data_byte;
            if(this.cmos_b & 0x40)
            {
                this.next_interrupt = Date.now();
            }

            if(this.cmos_b & 0x20)
            {
                const now = new Date();

                const seconds = this.decode_time(this.cmos_data[CMOS_RTC_SECONDS_ALARM]);
                const minutes = this.decode_time(this.cmos_data[CMOS_RTC_MINUTES_ALARM]);
                const hours = this.decode_time(this.cmos_data[CMOS_RTC_HOURS_ALARM]);

                const alarm_date = new Date(Date.UTC(
                    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
                    hours, minutes, seconds
                ));

                const ms_from_now = alarm_date - now;
                dbg_log("RTC alarm scheduled for " + alarm_date +
                        " hh:mm:ss=" + hours + ":" + minutes + ":" + seconds +
                        " ms_from_now=" + ms_from_now, LOG_RTC);

                this.next_interrupt_alarm = +alarm_date;
            }

            if(this.cmos_b & 0x10) dbg_log("Unimplemented: updated interrupt", LOG_RTC);

            dbg_log("cmos b=" + h(this.cmos_b, 2), LOG_RTC);
            break;

        case CMOS_RTC_SECONDS_ALARM:
        case CMOS_RTC_MINUTES_ALARM:
        case CMOS_RTC_HOURS_ALARM:
            this.cmos_write(this.cmos_index, data_byte);
            break;

        default:
            dbg_log("cmos write index " + h(this.cmos_index) + ": " + h(data_byte), LOG_RTC);
    }

    this.periodic_interrupt = (this.cmos_b & 0x40) === 0x40 && (this.cmos_a & 0xF) > 0;
};

/**
 * @param {number} index
 */
RTC.prototype.cmos_read = function(index)
{
    dbg_assert(index < 128);
    return this.cmos_data[index];
};

/**
 * @param {number} index
 * @param {number} value
 */
RTC.prototype.cmos_write = function(index, value)
{
    dbg_log("cmos " + h(index) + " <- " + h(value), LOG_RTC);
    dbg_assert(index < 128);
    this.cmos_data[index] = value;
};


// ---- File: src/floppy.js ----
// https://www.isdaman.com/alsos/hardware/fdc/floppy.htm
// https://wiki.osdev.org/Floppy_Disk_Controller








// For Types Only




const DIR_DOOR = 0x80;
const ST1_NID  = 1 << 0;
const ST1_NDAT = 1 << 2;

/**
 * @constructor
 *
 * @param {CPU} cpu
 */
function FloppyController(cpu, fda_image, fdb_image)
{
    /** @const @type {IO|undefined} */
    this.io = cpu.io;

    /** @const @type {CPU} */
    this.cpu = cpu;

    /** @const @type {DMA} */
    this.dma = cpu.devices.dma;

    this.bytes_expecting = 0;
    this.receiving_command = new Uint8Array(10);
    this.receiving_index = 0;
    this.next_command = null;

    this.response_data = new Uint8Array(10);
    this.response_index = 0;
    this.response_length = 0;

    this.status_reg0 = 0;
    this.status_reg1 = 0;
    this.status_reg2 = 0;
    this.drive = 0;

    this.last_cylinder = 0;
    this.last_head = 0;
    this.last_sector = 1;

    // this should actually be write-only ... but people read it anyway
    this.dor = 0;
    this.dir = 0;
    this.fda_image = null;
    this.fdb_image = null;

    if(!fda_image)
    {
        this.eject_fda();
        this.cpu.devices.rtc.cmos_write(CMOS_FLOPPY_DRIVE_TYPE, 4 << 4);
    }
    else
    {
        this.set_fda(fda_image);
    }

    dbg_assert(!fdb_image, "FDB not supported");

    this.io.register_read(0x3F0, this, this.port3F0_read);
    this.io.register_read(0x3F2, this, this.port3F2_read);
    this.io.register_read(0x3F4, this, this.port3F4_read);
    this.io.register_read(0x3F5, this, this.port3F5_read);
    this.io.register_read(0x3F7, this, this.port3F7_read);

    this.io.register_write(0x3F2, this, this.port3F2_write);
    this.io.register_write(0x3F4, this, this.port3F4_write);
    this.io.register_write(0x3F5, this, this.port3F5_write);
}

FloppyController.prototype.eject_fda = function()
{
    this.fda_image = null;
    this.sectors_per_track = 0;
    this.number_of_heads = 0;
    this.number_of_cylinders = 0;
    this.dir = DIR_DOOR;
};

FloppyController.prototype.set_fda = function(fda_image)
{
    var floppy_types = {
        [160 * 1024]: { type: 1, tracks: 40, sectors: 8, heads: 1 },
        [180 * 1024]: { type: 1, tracks: 40, sectors: 9, heads: 1 },
        [200 * 1024]: { type: 1, tracks: 40, sectors: 10, heads: 1 },
        [320 * 1024]: { type: 1, tracks: 40, sectors: 8, heads: 2 },
        [360 * 1024]: { type: 1, tracks: 40, sectors: 9, heads: 2 },
        [400 * 1024]: { type: 1, tracks: 40, sectors: 10, heads: 2 },
        [720 * 1024]: { type: 3, tracks: 80, sectors: 9, heads: 2 },
        [1200 * 1024]: { type: 2, tracks: 80, sectors: 15, heads: 2 },
        [1440 * 1024]: { type: 4, tracks: 80, sectors: 18, heads: 2 },
        [1722 * 1024]: { type: 5, tracks: 82, sectors: 21, heads: 2 },
        [2880 * 1024]: { type: 5, tracks: 80, sectors: 36, heads: 2 },

        // not a real floppy type, used to support sectorlisp and friends
        512: { type: 1, tracks: 1, sectors: 1, heads: 1 },
    };

    let floppy_size = fda_image.byteLength;
    let floppy_type = floppy_types[floppy_size];

    if(!floppy_type)
    {
        floppy_size = fda_image.byteLength > 1440 * 1024 ? 2880 * 1024 : 1440 * 1024;
        floppy_type = floppy_types[floppy_size];

        // Note: this may prevent the "Get floppy image" functionality from working
        dbg_assert(fda_image.buffer && fda_image.buffer instanceof ArrayBuffer);
        const new_image = new Uint8Array(floppy_size);
        new_image.set(new Uint8Array(fda_image.buffer));
        fda_image = new SyncBuffer(new_image.buffer);

        dbg_log("Warning: Unkown floppy size: " + fda_image.byteLength + ", assuming " + floppy_size);
    }

    this.sectors_per_track = floppy_type.sectors;
    this.number_of_heads = floppy_type.heads;
    this.number_of_cylinders = floppy_type.tracks;
    this.fda_image = fda_image;
    this.dir = DIR_DOOR;

    // this is probably not supposed to change at runtime
    this.cpu.devices.rtc.cmos_write(CMOS_FLOPPY_DRIVE_TYPE, floppy_type.type << 4);
};


FloppyController.prototype.get_state = function()
{
    var state = [];

    state[0] = this.bytes_expecting;
    state[1] = this.receiving_command;
    state[2] = this.receiving_index;
    //state[3] = this.next_command;
    state[4] = this.response_data;
    state[5] = this.response_index;
    state[6] = this.response_length;

    state[8] = this.status_reg0;
    state[9] = this.status_reg1;
    state[10] = this.status_reg2;
    state[11] = this.drive;
    state[12] = this.last_cylinder;
    state[13] = this.last_head;
    state[14] = this.last_sector;
    state[15] = this.dor;
    state[16] = this.sectors_per_track;
    state[17] = this.number_of_heads;
    state[18] = this.number_of_cylinders;

    return state;
};

FloppyController.prototype.set_state = function(state)
{
    this.bytes_expecting = state[0];
    this.receiving_command = state[1];
    this.receiving_index = state[2];
    this.next_command = state[3];
    this.response_data = state[4];
    this.response_index = state[5];
    this.response_length = state[6];

    this.status_reg0 = state[8];
    this.status_reg1 = state[9];
    this.status_reg2 = state[10];
    this.drive = state[11];
    this.last_cylinder = state[12];
    this.last_head = state[13];
    this.last_sector = state[14];
    this.dor = state[15];
    this.sectors_per_track = state[16];
    this.number_of_heads = state[17];
    this.number_of_cylinders = state[18];
};

FloppyController.prototype.port3F0_read = function()
{
    dbg_log("3F0 read", LOG_FLOPPY);

    return 0;
};


FloppyController.prototype.port3F4_read = function()
{
    dbg_log("3F4 read", LOG_FLOPPY);

    var return_byte = 0x80;

    if(this.response_index < this.response_length)
    {
        return_byte |= 0x40 | 0x10;
    }

    if((this.dor & 8) === 0)
    {
        return_byte |= 0x20;
    }

    return return_byte;
};

FloppyController.prototype.port3F7_read = function()
{
    dbg_log("3F7 read", LOG_FLOPPY);
    return this.dir;
};

FloppyController.prototype.port3F5_read = function()
{
    if(this.response_index < this.response_length)
    {
        dbg_log("3F5 read: " + this.response_data[this.response_index], LOG_FLOPPY);
        this.cpu.device_lower_irq(6);
        return this.response_data[this.response_index++];
    }
    else
    {
        dbg_log("3F5 read, empty", LOG_FLOPPY);
        return 0xFF;
    }
};

FloppyController.prototype.port3F4_write = function(byte)
{
    dbg_log("3F4/data rate write: " + h(byte), LOG_FLOPPY);

    if(byte & 0x80)
    {
        dbg_log("dsr reset", LOG_FLOPPY);
        this.status_reg0 = 0xC0;
        this.cpu.device_raise_irq(6);
    }
};

FloppyController.prototype.port3F5_write = function(reg_byte)
{
    dbg_log("3F5 write " + h(reg_byte), LOG_FLOPPY);

    if(this.bytes_expecting > 0)
    {
        this.receiving_command[this.receiving_index++] = reg_byte;

        this.bytes_expecting--;

        if(this.bytes_expecting === 0)
        {
            if(DEBUG)
            {
                var log = "3F5 command received: ";
                for(var i = 0; i < this.receiving_index; i++)
                    log += h(this.receiving_command[i]) + " ";
                dbg_log(log, LOG_FLOPPY);
            }
            this.next_command.call(this, this.receiving_command);
        }
    }
    else
    {
        switch(reg_byte)
        {
            // TODO
            //case 2:
                //this.next_command = read_complete_track;
                //this.bytes_expecting = 8;
                //break;
            case 0x03:
                this.next_command = this.fix_drive_data;
                this.bytes_expecting = 2;
                break;
            case 0x13:
                this.next_command = this.configure;
                this.bytes_expecting = 3;
                break;
            case 0x04:
                this.next_command = this.check_drive_status;
                this.bytes_expecting = 1;
                break;
            // writes
            case 0x05:
            case 0x45:
            case 0xC5:
                this.next_command = function(args) { this.do_sector(true, args); };
                this.bytes_expecting = 8;
                break;
            case 0x06:
            case 0x46:
            case 0xC6:
            case 0xE6:
                this.next_command = function(args) { this.do_sector(false, args); };
                this.bytes_expecting = 8;
                break;
            case 0x07:
                this.next_command = this.calibrate;
                this.bytes_expecting = 1;
                break;
            case 0x08:
                this.check_interrupt_status();
                break;
            case 0x4A:
                this.next_command = this.read_sector_id;
                this.bytes_expecting = 1;
                break;
            case 0x0F:
                this.bytes_expecting = 2;
                this.next_command = this.seek;
                break;
            case 0x0E: // dump registers (not implemented)
            case 0x10: // determine controller version (winxp, not implemented)
                dbg_log(reg_byte === 0x0E ? "dump registers" : "determine controller version", LOG_FLOPPY);
                this.status_reg0 = 0x80;
                this.response_data[0] = this.status_reg0;
                this.response_index = 0;
                this.response_length = 1;
                this.bytes_expecting = 0;
                break;
            default:
                dbg_assert(false, "Unimplemented floppy command call " + h(reg_byte));
        }

        this.receiving_index = 0;
    }
};

FloppyController.prototype.port3F2_read = function()
{
    dbg_log("read 3F2: DOR", LOG_FLOPPY);
    return this.dor;
};

FloppyController.prototype.port3F2_write = function(value)
{
    if((value & 4) === 4 && (this.dor & 4) === 0)
    {
        // clear reset mode
        this.status_reg0 = 0xC0;
        this.cpu.device_raise_irq(6);
    }

    dbg_log("start motors: " + h(value >> 4), LOG_FLOPPY);
    dbg_log("enable dma/irq: " + !!(value & 8), LOG_FLOPPY);
    dbg_log("reset fdc: " + !!(value & 4), LOG_FLOPPY);
    dbg_log("drive select: " + (value & 3), LOG_FLOPPY);
    if((value & 3) !== 0)
    {
        dbg_log("guest: fdb not implemented", LOG_FLOPPY);
    }
    dbg_log("DOR = " + h(value), LOG_FLOPPY);

    this.dor = value;
};

FloppyController.prototype.check_drive_status = function(args)
{
    dbg_log("check drive status", LOG_FLOPPY);
    // do nothing if no fda
    if(this.fda_image)
    {
        this.status_reg1 = 0;
    }
    else
    {
        // TODO: is this right?
        this.status_reg1 = ST1_NDAT | ST1_NID;
    }

    this.response_index = 0;
    this.response_length = 1;
    this.response_data[0] = 0;
};

FloppyController.prototype.seek = function(args)
{
    dbg_log("seek", LOG_FLOPPY);
    if((args[0] & 3) !== 0)
    {
        dbg_log("seek on fdb", LOG_FLOPPY);
        this.raise_irq();
        return;
    }

    const new_cylinder = args[1];
    const new_head = args[0] >> 2 & 1;

    // clear eject flag if seek takes us to a new cylinder
    if(new_cylinder !== this.last_cylinder)
    {
        this.dir = 0x0;
    }
    // do nothing if no fda
    if(this.fda_image)
    {
        this.status_reg1 = 0;
    }
    else
    {
        // TODO: is this right?
        this.status_reg1 = ST1_NDAT | ST1_NID;
    }

    this.status_reg0 = 0x20;
    this.last_cylinder = new_cylinder;
    this.last_head = new_head;

    this.raise_irq();
};

FloppyController.prototype.calibrate = function(args)
{
    // TODO fdb support: args[0] indicates which drive
    dbg_log("floppy calibrate", LOG_FLOPPY);
    // This is implemented using seek to make sure last_cylinder, dir, etc are updated properly.
    this.seek([args[0], 0]);
};

FloppyController.prototype.check_interrupt_status = function()
{
    dbg_log("floppy check interrupt status", LOG_FLOPPY);

    this.response_index = 0;
    this.response_length = 2;

    this.response_data[0] = this.status_reg0;
    this.response_data[1] = this.last_cylinder;
};

FloppyController.prototype.do_sector = function(is_write, args)
{
    var head = args[2],
        cylinder = args[1],
        sector = args[3],
        sector_size = 128 << args[4],
        read_count = args[5] - args[3] + 1,

        read_offset = ((head + this.number_of_heads * cylinder) * this.sectors_per_track + sector - 1) * sector_size;

    dbg_log("Floppy " + (is_write ? "Write" : "Read"), LOG_FLOPPY);
    dbg_log("from " + h(read_offset) + " length " + h(read_count * sector_size), LOG_FLOPPY);
    dbg_log(cylinder + " / " + head + " / " + sector, LOG_FLOPPY);

    if(!args[4])
    {
        dbg_log("FDC: sector count is zero, use data length instead", LOG_FLOPPY);
    }

    if(!this.fda_image)
    {
        this.status_reg1 = ST1_NDAT | ST1_NID;
        return;
    }
    this.status_reg1 = 0;

    if(is_write)
    {
        this.dma.do_write(this.fda_image, read_offset, read_count * sector_size, 2, this.done.bind(this, args, cylinder, head, sector));
    }
    else
    {
        this.dma.do_read(this.fda_image, read_offset, read_count * sector_size, 2, this.done.bind(this, args, cylinder, head, sector));
    }
};

FloppyController.prototype.done = function(args, cylinder, head, sector, error)
{
    if(error)
    {
        // TODO: Set appropriate bits
        dbg_log("XXX: Unhandled floppy error", LOG_FLOPPY);
        return;
    }

    sector++;

    if(sector > this.sectors_per_track)
    {
        sector = 1;
        head++;

        if(head >= this.number_of_heads)
        {
            head = 0;
            cylinder++;
        }
    }

    // clear eject flag if seek or write has taken us to a new cylinder
    if(cylinder !== this.last_cylinder)
    {
        this.dir = 0x0;
    }

    this.status_reg0 = 0x20;
    this.last_cylinder = cylinder;
    this.last_head = head;
    this.last_sector = sector;

    this.response_index = 0;
    this.response_length = 7;

    this.response_data[0] = head << 2 | 0x20;
    this.response_data[1] = 0;
    this.response_data[2] = 0;
    this.response_data[3] = cylinder;
    this.response_data[4] = head;
    this.response_data[5] = sector;
    this.response_data[6] = args[4];

    this.raise_irq();
};

FloppyController.prototype.fix_drive_data = function(args)
{
    dbg_log("floppy fix drive data " + args.slice(0, this.bytes_expecting), LOG_FLOPPY);
};

FloppyController.prototype.configure = function(args)
{
    dbg_log("floppy configure " + args.slice(0, this.bytes_expecting), LOG_FLOPPY);
};

FloppyController.prototype.read_sector_id = function(args)
{
    dbg_log("floppy read sector id " + args, LOG_FLOPPY);

    this.response_index = 0;
    this.response_length = 7;

    this.response_data[0] = 0;
    this.response_data[1] = 0;
    this.response_data[2] = 0;
    this.response_data[3] = 0;
    this.response_data[4] = 0;
    this.response_data[5] = 0;
    this.response_data[6] = 0;

    this.raise_irq();
};

FloppyController.prototype.raise_irq = function()
{
    if(this.dor & 8)
    {
        this.cpu.device_raise_irq(6);
    }
};


// ---- File: src/ide.js ----





// For Types Only



const CDROM_SECTOR_SIZE = 2048;
const HD_SECTOR_SIZE = 512;

/**
 * @constructor
 * @param {CPU} cpu
 * @param {boolean} is_cd
 * @param {number} nr
 * @param {BusConnector} bus
 * */
function IDEDevice(cpu, master_buffer, slave_buffer, is_cd, nr, bus)
{
    this.master = new IDEInterface(this, cpu, master_buffer, is_cd, nr, 0, bus);
    this.slave = new IDEInterface(this, cpu, slave_buffer, false, nr, 1, bus);

    this.current_interface = this.master;

    this.cpu = cpu;

    // gets set via PCI in seabios, likely doesn't matter
    if(nr === 0)
    {
        this.ata_port = 0x1F0;
        this.irq = 14;

        this.pci_id = 0x1E << 3;
    }
    else if(nr === 1)
    {
        this.ata_port = 0x170;
        this.irq = 15;

        this.pci_id = 0x1F << 3;
    }
    else
    {
        dbg_assert(false, "IDE device with nr " + nr + " ignored", LOG_DISK);
    }

    // alternate status, starting at 3f4/374
    /** @type {number} */
    this.ata_port_high = this.ata_port | 0x204;

    /** @type {number} */
    this.master_port = 0xB400;

    this.pci_space = [
        0x86, 0x80, 0x10, 0x70, 0x05, 0x00, 0xA0, 0x02,
        0x00, 0x80, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        this.ata_port & 0xFF | 1, this.ata_port >> 8, 0x00, 0x00,
        this.ata_port_high & 0xFF | 1, this.ata_port_high >> 8, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, // second device
        0x00, 0x00, 0x00, 0x00, // second device
        this.master_port & 0xFF | 1,   this.master_port >> 8, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x43, 0x10, 0xD4, 0x82,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, this.irq, 0x01, 0x00, 0x00,

        // 0x40
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        // 0x80
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ];
    this.pci_bars = [
        {
            size: 8,
        },
        {
            size: 4,
        },
        undefined,
        undefined,
        {
            size: 0x10,
        },
    ];
    this.name = "ide" + nr;

    /** @type {number} */
    this.device_control = 2;

    // status
    cpu.io.register_read(this.ata_port | 7, this, function() {
        dbg_log("lower irq", LOG_DISK);
        this.cpu.device_lower_irq(this.irq);
        return this.read_status();
    });
    cpu.io.register_read(this.ata_port_high | 2, this, this.read_status);

    cpu.io.register_write(this.ata_port_high | 2, this, this.write_control);
    cpu.io.register_read(this.ata_port | 0, this, function()
    {
        return this.current_interface.read_data(1);
    }, function()
    {
        return this.current_interface.read_data(2);
    }, function()
    {
        return this.current_interface.read_data(4);
    });

    cpu.io.register_read(this.ata_port | 1, this, function()
    {
        dbg_log("Read error: " + h(this.current_interface.error & 0xFF) +
                " slave=" + (this.current_interface === this.slave), LOG_DISK);
        return this.current_interface.error & 0xFF;
    });
    cpu.io.register_read(this.ata_port | 2, this, function()
    {
        dbg_log("Read bytecount: " + h(this.current_interface.bytecount & 0xFF), LOG_DISK);
        return this.current_interface.bytecount & 0xFF;
    });
    cpu.io.register_read(this.ata_port | 3, this, function()
    {
        dbg_log("Read sector: " + h(this.current_interface.sector & 0xFF), LOG_DISK);
        return this.current_interface.sector & 0xFF;
    });

    cpu.io.register_read(this.ata_port | 4, this, function()
    {
        dbg_log("Read 1F4: " + h(this.current_interface.cylinder_low & 0xFF), LOG_DISK);
        return this.current_interface.cylinder_low & 0xFF;
    });
    cpu.io.register_read(this.ata_port | 5, this, function()
    {
        dbg_log("Read 1F5: " + h(this.current_interface.cylinder_high & 0xFF), LOG_DISK);
        return this.current_interface.cylinder_high & 0xFF;
    });
    cpu.io.register_read(this.ata_port | 6, this, function()
    {
        dbg_log("Read 1F6", LOG_DISK);
        return this.current_interface.drive_head & 0xFF;
    });

    cpu.io.register_write(this.ata_port | 0, this, function(data)
    {
        this.current_interface.write_data_port8(data);
    }, function(data)
    {
        this.current_interface.write_data_port16(data);
    }, function(data)
    {
        this.current_interface.write_data_port32(data);
    });

    cpu.io.register_write(this.ata_port | 1, this, function(data)
    {
        dbg_log("1F1/lba_count: " + h(data), LOG_DISK);
        this.master.lba_count = (this.master.lba_count << 8 | data) & 0xFFFF;
        this.slave.lba_count = (this.slave.lba_count << 8 | data) & 0xFFFF;
    });
    cpu.io.register_write(this.ata_port | 2, this, function(data)
    {
        dbg_log("1F2/bytecount: " + h(data), LOG_DISK);
        this.master.bytecount = (this.master.bytecount << 8 | data) & 0xFFFF;
        this.slave.bytecount = (this.slave.bytecount << 8 | data) & 0xFFFF;
    });
    cpu.io.register_write(this.ata_port | 3, this, function(data)
    {
        dbg_log("1F3/sector: " + h(data), LOG_DISK);
        this.master.sector = (this.master.sector << 8 | data) & 0xFFFF;
        this.slave.sector = (this.slave.sector << 8 | data) & 0xFFFF;
    });

    cpu.io.register_write(this.ata_port | 4, this, function(data)
    {
        dbg_log("1F4/sector low: " + h(data), LOG_DISK);
        this.master.cylinder_low = (this.master.cylinder_low << 8 | data) & 0xFFFF;
        this.slave.cylinder_low = (this.slave.cylinder_low << 8 | data) & 0xFFFF;
    });
    cpu.io.register_write(this.ata_port | 5, this, function(data)
    {
        dbg_log("1F5/sector high: " + h(data), LOG_DISK);
        this.master.cylinder_high = (this.master.cylinder_high << 8 | data) & 0xFFFF;
        this.slave.cylinder_high = (this.slave.cylinder_high << 8 | data) & 0xFFFF;
    });
    cpu.io.register_write(this.ata_port | 6, this, function(data)
    {
        var slave = data & 0x10;
        var mode = data & 0xE0;

        dbg_log("1F6/drive: " + h(data, 2), LOG_DISK);

        if(slave)
        {
            dbg_log("Slave", LOG_DISK);
            this.current_interface = this.slave;
        }
        else
        {
            this.current_interface = this.master;
        }

        this.master.drive_head = data;
        this.slave.drive_head = data;
        this.master.is_lba = this.slave.is_lba = data >> 6 & 1;
        this.master.head = this.slave.head = data & 0xF;
    });

    /** @type {number} */
    this.prdt_addr = 0;

    /** @type {number} */
    this.dma_status = 0;

    /** @type {number} */
    this.dma_command = 0;

    cpu.io.register_write(this.ata_port | 7, this, function(data)
    {
        dbg_log("lower irq", LOG_DISK);
        this.cpu.device_lower_irq(this.irq);
        this.current_interface.ata_command(data);
    });

    cpu.io.register_read(this.master_port | 4, this, undefined, undefined, this.dma_read_addr);
    cpu.io.register_write(this.master_port | 4, this, undefined, undefined, this.dma_set_addr);

    cpu.io.register_read(this.master_port, this,
                         this.dma_read_command8, undefined, this.dma_read_command);
    cpu.io.register_write(this.master_port, this,
                          this.dma_write_command8, undefined, this.dma_write_command);

    cpu.io.register_read(this.master_port | 2, this, this.dma_read_status);
    cpu.io.register_write(this.master_port | 2, this, this.dma_write_status);

    cpu.io.register_read(this.master_port | 0x8, this, function() {
        dbg_log("DMA read 0x8", LOG_DISK); return 0;
    });
    cpu.io.register_read(this.master_port | 0xA, this, function() {
        dbg_log("DMA read 0xA", LOG_DISK); return 0;
    });

    cpu.devices.pci.register_device(this);

    DEBUG && Object.seal(this);
}

IDEDevice.prototype.read_status = function()
{
    if(this.current_interface.buffer)
    {
        var ret = this.current_interface.status;
        dbg_log("ATA read status: " + h(ret, 2), LOG_DISK);
        return ret;
    }
    else
    {
        return 0;
    }
};

IDEDevice.prototype.write_control = function(data)
{
    dbg_log("set device control: " + h(data, 2) + " interrupts " +
            ((data & 2) ? "disabled" : "enabled"), LOG_DISK);

    if(data & 4)
    {
        dbg_log("Reset via control port", LOG_DISK);

        this.cpu.device_lower_irq(this.irq);

        this.master.device_reset();
        this.slave.device_reset();
    }

    this.device_control = data;
};

IDEDevice.prototype.dma_read_addr = function()
{
    dbg_log("dma get address: " + h(this.prdt_addr, 8), LOG_DISK);
    return this.prdt_addr;
};

IDEDevice.prototype.dma_set_addr = function(data)
{
    dbg_log("dma set address: " + h(data, 8), LOG_DISK);
    this.prdt_addr = data;
};

IDEDevice.prototype.dma_read_status = function()
{
    dbg_log("DMA read status: " + h(this.dma_status), LOG_DISK);
    return this.dma_status;
};

IDEDevice.prototype.dma_write_status = function(value)
{
    dbg_log("DMA set status: " + h(value), LOG_DISK);
    this.dma_status &= ~(value & 6);
};

IDEDevice.prototype.dma_read_command = function()
{
    return this.dma_read_command8() | this.dma_read_status() << 16;
};

IDEDevice.prototype.dma_read_command8 = function()
{
    dbg_log("DMA read command: " + h(this.dma_command), LOG_DISK);
    return this.dma_command;
};

IDEDevice.prototype.dma_write_command = function(value)
{
    dbg_log("DMA write command: " + h(value), LOG_DISK);

    this.dma_write_command8(value & 0xFF);
    this.dma_write_status(value >> 16 & 0xFF);
};

IDEDevice.prototype.dma_write_command8 = function(value)
{
    dbg_log("DMA write command8: " + h(value), LOG_DISK);

    const old_command = this.dma_command;
    this.dma_command = value & 0x9;

    if((old_command & 1) === (value & 1))
    {
        return;
    }

    if((value & 1) === 0)
    {
        this.dma_status &= ~1;
        return;
    }

    this.dma_status |= 1;

    switch(this.current_interface.current_command)
    {
        case 0x25:
        case 0xC8:
            this.current_interface.do_ata_read_sectors_dma();
            break;

        case 0xCA:
        case 0x35:
            this.current_interface.do_ata_write_sectors_dma();
            break;

        case 0xA0:
            this.current_interface.do_atapi_dma();
            break;

        default:
            dbg_log("Spurious dma command write, current command: " +
                    h(this.current_interface.current_command), LOG_DISK);
            dbg_assert(false);
    }
};

IDEDevice.prototype.push_irq = function()
{
    if((this.device_control & 2) === 0)
    {
        dbg_log("push irq", LOG_DISK);
        this.dma_status |= 4;
        this.cpu.device_raise_irq(this.irq);
    }
};

IDEDevice.prototype.get_state = function()
{
    var state = [];
    state[0] = this.master;
    state[1] = this.slave;
    state[2] = this.ata_port;
    state[3] = this.irq;
    state[4] = this.pci_id;
    state[5] = this.ata_port_high;
    state[6] = this.master_port;
    state[7] = this.name;
    state[8] = this.device_control;
    state[9] = this.prdt_addr;
    state[10] = this.dma_status;
    state[11] = this.current_interface === this.master;
    state[12] = this.dma_command;
    return state;
};

IDEDevice.prototype.set_state = function(state)
{
    this.master.set_state(state[0]);
    this.slave.set_state(state[1]);
    this.ata_port = state[2];
    this.irq = state[3];
    this.pci_id = state[4];
    this.ata_port_high = state[5];
    this.master_port = state[6];
    this.name = state[7];
    this.device_control = state[8];
    this.prdt_addr = state[9];
    this.dma_status = state[10];
    this.current_interface = state[11] ? this.master : this.slave;
    this.dma_command = state[12];
};


/**
 * @constructor
 */
function IDEInterface(device, cpu, buffer, is_cd, device_nr, interface_nr, bus)
{
    this.device = device;

    /** @const @type {BusConnector} */
    this.bus = bus;

    /**
     * @const
     * @type {number}
     */
    this.nr = device_nr;

    /** @const @type {CPU} */
    this.cpu = cpu;

    this.buffer = buffer;

    /** @type {number} */
    this.sector_size = is_cd ? CDROM_SECTOR_SIZE : HD_SECTOR_SIZE;

    /** @type {boolean} */
    this.is_atapi = is_cd;

    /** @type {number} */
    this.sector_count = 0;

    /** @type {number} */
    this.head_count = 0;

    /** @type {number} */
    this.sectors_per_track = 0;

    /** @type {number} */
    this.cylinder_count = 0;

    if(this.buffer)
    {
        this.sector_count = this.buffer.byteLength / this.sector_size;

        if(this.sector_count !== (this.sector_count | 0))
        {
            dbg_log("Warning: Disk size not aligned with sector size", LOG_DISK);
            this.sector_count = Math.ceil(this.sector_count);
        }

        if(is_cd)
        {
            this.head_count = 1;
            this.sectors_per_track = 0;
        }
        else
        {
            // "default" values: 16/63
            // common: 255, 63
            this.head_count = 16;
            this.sectors_per_track = 63;
        }


        this.cylinder_count = this.sector_count / this.head_count / this.sectors_per_track;

        if(this.cylinder_count !== (this.cylinder_count | 0))
        {
            dbg_log("Warning: Rounding up cylinder count. Choose different head number", LOG_DISK);
            this.cylinder_count = Math.floor(this.cylinder_count);
            //this.sector_count = this.cylinder_count * this.head_count *
            //                        this.sectors_per_track * this.sector_size;
        }

        //if(this.cylinder_count > 16383)
        //{
        //    this.cylinder_count = 16383;
        //}

        // disk translation: lba
        var rtc = cpu.devices.rtc;

        // master
        rtc.cmos_write(CMOS_BIOS_DISKTRANSFLAG,
            rtc.cmos_read(CMOS_BIOS_DISKTRANSFLAG) | 1 << this.nr * 4);
        rtc.cmos_write(CMOS_DISK_DATA, rtc.cmos_read(CMOS_DISK_DATA) & 0x0F | 0xF0);

        var reg = CMOS_DISK_DRIVE1_CYL;
        rtc.cmos_write(reg + 0, this.cylinder_count & 0xFF);
        rtc.cmos_write(reg + 1, this.cylinder_count >> 8 & 0xFF);
        rtc.cmos_write(reg + 2, this.head_count & 0xFF);
        rtc.cmos_write(reg + 3, 0xFF);
        rtc.cmos_write(reg + 4, 0xFF);
        rtc.cmos_write(reg + 5, 0xC8);
        rtc.cmos_write(reg + 6, this.cylinder_count & 0xFF);
        rtc.cmos_write(reg + 7, this.cylinder_count >> 8 & 0xFF);
        rtc.cmos_write(reg + 8, this.sectors_per_track & 0xFF);

        //rtc.cmos_write(CMOS_BIOS_DISKTRANSFLAG,
        //    rtc.cmos_read(CMOS_BIOS_DISKTRANSFLAG) | 1 << (nr * 4 + 2)); // slave
    }

    this.buffer = buffer;

    /** @type {number} */
    this.is_lba = 0;

    /** @type {number} */
    this.bytecount = 0;

    /** @type {number} */
    this.sector = 0;

    /** @type {number} */
    this.lba_count = 0;

    /** @type {number} */
    this.cylinder_low = 0;

    /** @type {number} */
    this.cylinder_high = 0;

    /** @type {number} */
    this.head = 0;

    /** @type {number} */
    this.drive_head = 0;

    /** @type {number} */
    this.status = 0x50;

    /** @type {number} */
    this.sectors_per_drq = 0x80;

    /** @type {number} */
    this.error = 0;

    /** @type {number} */
    this.data_pointer = 0;

    this.data = new Uint8Array(64 * 1024);
    this.data16 = new Uint16Array(this.data.buffer);
    this.data32 = new Int32Array(this.data.buffer);

    /** @type {number} */
    this.data_length = 0;

    /** @type {number} */
    this.data_end = 0;

    /** @type {number} */
    this.current_command = -1;

    /** @type {number} */
    this.current_atapi_command = -1;

    /** @type {number} */
    this.write_dest = 0;

    // cancellation support
    this.last_io_id = 0;
    this.in_progress_io_ids = new Set();
    this.cancelled_io_ids = new Set();

    Object.seal(this);
}

IDEInterface.prototype.device_reset = function()
{
    if(this.is_atapi)
    {
        this.status = 0;
        this.bytecount = 1;
        this.error = 1;
        this.sector = 1; // lba_low
        this.cylinder_low = 0x14; // lba_mid
        this.cylinder_high = 0xEB; // lba_high
    }
    else
    {
        this.status = 0x50 | 1;
        this.bytecount = 1;
        this.error = 1;
        this.sector = 1; // lba_low

        // 0, 0 needed by bochs bios
        this.cylinder_low = 0; // lba_mid
        this.cylinder_high = 0; // lba_high
    }

    this.cancel_io_operations();
};

IDEInterface.prototype.push_irq = function()
{
    this.device.push_irq();
};

IDEInterface.prototype.ata_command = function(cmd)
{
    dbg_log("ATA Command: " + h(cmd) + " slave=" + (this.drive_head >> 4 & 1), LOG_DISK);

    if(!this.buffer)
    {
        dbg_log("abort: No buffer", LOG_DISK);
        this.error = 4;
        this.status = 0x41;
        this.push_irq();
        return;
    }

    this.current_command = cmd;
    this.error = 0;

    switch(cmd)
    {
        case 0x08:
            dbg_log("ATA device reset", LOG_DISK);
            this.data_pointer = 0;
            this.data_end = 0;
            this.data_length = 0;
            this.device_reset();
            this.push_irq();
            break;

        case 0x10:
            // calibrate drive
            this.status = 0x50;
            this.cylinder_low = 0;
            this.push_irq();
            break;

        case 0xF8:
            // read native max address
            this.status = 0x50;
            var last_sector = this.sector_count - 1;
            this.sector = last_sector & 0xFF;
            this.cylinder_low = last_sector >> 8 & 0xFF;
            this.cylinder_high = last_sector >> 16 & 0xFF;
            this.drive_head = this.drive_head & 0xF0 | last_sector >> 24 & 0x0F;
            this.push_irq();
            break;

        case 0x27:
            // read native max address ext
            this.status = 0x50;
            var last_sector = this.sector_count - 1;
            this.sector = last_sector & 0xFF;
            this.cylinder_low = last_sector >> 8 & 0xFF;
            this.cylinder_high = last_sector >> 16 & 0xFF;
            this.sector |= last_sector >> 24 << 8 & 0xFF00;
            this.push_irq();
            break;

        case 0x20:
        case 0x24:
        case 0x29:
        case 0xC4:
            // 0x20 read sectors
            // 0x24 read sectors ext
            // 0xC4 read multiple
            // 0x29 read multiple ext
            this.ata_read_sectors(cmd);
            break;

        case 0x30:
        case 0x34:
        case 0x39:
        case 0xC5:
            // 0x30 write sectors
            // 0x34 write sectors ext
            // 0xC5 write multiple
            // 0x39 write multiple ext
            this.ata_write_sectors(cmd);
            break;

        case 0x90:
            // execute device diagnostic
            this.push_irq();
            this.error = 0x101;
            this.status = 0x50;
            break;

        case 0x91:
            // initialize device parameters
            this.status = 0x50;
            this.push_irq();
            break;

        case 0xA0:
            // ATA packet
            if(this.is_atapi)
            {
                this.status = 0x58;
                this.data_allocate(12);
                this.data_end = 12;
                this.bytecount = 1;
                this.push_irq();
            }
            break;

        case 0xA1:
            dbg_log("ATA identify packet device", LOG_DISK);

            if(this.is_atapi)
            {
                this.create_identify_packet();
                this.status = 0x58;

                this.cylinder_low = 0x14;
                this.cylinder_high = 0xEB;

                this.push_irq();
            }
            else
            {
                this.status = 0x41;
                this.push_irq();
            }
            break;

        case 0xC6:
            // set multiple mode
            // Logical sectors per DRQ Block in word 1
            dbg_log("Logical sectors per DRQ Block: " + h(this.bytecount & 0xFF), LOG_DISK);
            this.sectors_per_drq = this.bytecount & 0xFF;
            this.status = 0x50;
            this.push_irq();
            break;

        case 0x25: // read dma ext
        case 0xC8: // read dma
            this.ata_read_sectors_dma(cmd);
            break;

        case 0x35: // write dma ext
        case 0xCA: // write dma
            this.ata_write_sectors_dma(cmd);
            break;

        case 0x40:
            dbg_log("read verify sectors", LOG_DISK);
            this.status = 0x50;
            this.push_irq();
            break;

        case 0xDA:
            dbg_log("Unimplemented: get media status", LOG_DISK);
            this.status = 0x41;
            this.error = 4;
            this.push_irq();
            break;

        case 0xE0:
            dbg_log("ATA standby immediate", LOG_DISK);
            this.status = 0x50;
            this.push_irq();
            break;

        case 0xE1:
            dbg_log("ATA idle immediate", LOG_DISK);
            this.status = 0x50;
            this.push_irq();
            break;

        case 0xE7:
            dbg_log("ATA flush cache", LOG_DISK);
            this.status = 0x50;
            this.push_irq();
            break;

        case 0xEC:
            dbg_log("ATA identify device", LOG_DISK);

            if(this.is_atapi)
            {
                this.status = 0x41;
                this.error = 4;
                this.push_irq();
                return;
            }

            this.create_identify_packet();
            this.status = 0x58;

            this.push_irq();
            break;

        case 0xEA:
            dbg_log("flush cache ext", LOG_DISK);
            this.status = 0x50;
            this.push_irq();
            break;

        case 0xEF:
            dbg_log("set features: " + h(this.bytecount & 0xFF), LOG_DISK);
            this.status = 0x50;
            this.push_irq();
            break;

        case 0xDE:
            // obsolete
            this.status = 0x50;
            this.push_irq();
            break;

        case 0xF5:
            dbg_log("security freeze lock", LOG_DISK);
            this.status = 0x50;
            this.push_irq();
            break;

        case 0xF9:
            dbg_log("Unimplemented: set max address", LOG_DISK);
            this.status = 0x41;
            this.error = 4;
            break;

        default:
            dbg_assert(false, "New ATA cmd on 1F7: " + h(cmd), LOG_DISK);

            this.status = 0x41;
            // abort bit set
            this.error = 4;
    }
};

IDEInterface.prototype.atapi_handle = function()
{
    dbg_log("ATAPI Command: " + h(this.data[0]) +
            " slave=" + (this.drive_head >> 4 & 1), LOG_DISK);

    this.data_pointer = 0;
    this.current_atapi_command = this.data[0];

    switch(this.current_atapi_command)
    {
        case 0x00:
            dbg_log("test unit ready", LOG_DISK);
            // test unit ready
            this.data_allocate(0);
            this.data_end = this.data_length;
            this.status = 0x50;
            break;

        case 0x03:
            // request sense
            this.data_allocate(this.data[4]);
            this.data_end = this.data_length;
            this.status = 0x58;

            this.data[0] = 0x80 | 0x70;
            this.data[2] = 5; // illegal request
            this.data[7] = 8;
            break;

        case 0x12:
            // inquiry
            var length = this.data[4];
            this.status = 0x58;

            dbg_log("inquiry: " + h(this.data[1], 2) + " length=" + length, LOG_DISK);

            // http://www.t10.org/ftp/x3t9.2/document.87/87-106r0.txt
            //this.data_allocate(36);
            this.data.set([
                0x05, 0x80, 0x01, 0x31,
                // additional length
                31,
                0, 0, 0,

                // 8
                0x53, 0x4F, 0x4E, 0x59,
                0x20, 0x20, 0x20, 0x20,

                // 16
                0x43, 0x44, 0x2D, 0x52,
                0x4F, 0x4D, 0x20, 0x43,
                0x44, 0x55, 0x2D, 0x31,
                0x30, 0x30, 0x30, 0x20,

                // 32
                0x31, 0x2E, 0x31, 0x61,
            ]);
            this.data_end = this.data_length = Math.min(36, length);
            break;

        case 0x1A:
            // mode sense (6)
            this.data_allocate(this.data[4]);
            this.data_end = this.data_length;
            this.status = 0x58;
            break;

        case 0x1E:
            // prevent/allow medium removal
            this.data_allocate(0);
            this.data_end = this.data_length;
            this.status = 0x50;
            break;

        case 0x25:
            // read capacity
            var count = this.sector_count - 1;
            this.data_set(new Uint8Array([
                count >> 24 & 0xFF,
                count >> 16 & 0xFF,
                count >> 8 & 0xFF,
                count & 0xFF,
                0,
                0,
                this.sector_size >> 8 & 0xFF,
                this.sector_size & 0xFF,
            ]));
            this.data_end = this.data_length;
            this.status = 0x58;
            break;

        case 0x28:
            // read
            if(this.lba_count & 1)
            {
                this.atapi_read_dma(this.data);
            }
            else
            {
                this.atapi_read(this.data);
            }
            break;

        case 0x42:
            var length = this.data[8];
            this.data_allocate(Math.min(8, length));
            this.data_end = this.data_length;
            dbg_log("read q subcode: length=" + length, LOG_DISK);
            this.status = 0x58;
            break;

        case 0x43:
            // read toc
            var length = this.data[8] | this.data[7] << 8;
            var format = this.data[9] >> 6;

            this.data_allocate(length);
            this.data_end = this.data_length;
            dbg_log("read toc: " + h(format, 2) +
                    " length=" + length +
                    " " + (this.data[1] & 2) +
                    " " + h(this.data[6]), LOG_DISK);

            if(format === 0)
            {
                var sector_count = this.sector_count;
                this.data.set(new Uint8Array([
                    0, 18, // length
                    1, 1, // first and last session

                    0,
                    0x14,
                    1, // track number
                    0,
                    0, 0, 0, 0,

                    0,
                    0x16,
                    0xAA, // track number
                    0,
                    sector_count >> 24,
                    sector_count >> 16 & 0xFF,
                    sector_count >> 8 & 0xFF,
                    sector_count & 0xFF,
                ]));
            }
            else if(format === 1)
            {
                this.data.set(new Uint8Array([
                    0, 10, // length
                    1, 1, // first and last session
                    0, 0,
                    0, 0,
                    0, 0,
                    0, 0,
                ]));
            }
            else
            {
                dbg_assert(false, "Unimplemented format: " + format);
            }

            this.status = 0x58;
            break;

        case 0x46:
            // get configuration
            var length = this.data[8] | this.data[7] << 8;
            length = Math.min(length, 32);
            this.data_allocate(length);
            this.data_end = this.data_length;
            this.data[0] = length - 4 >> 24 & 0xFF;
            this.data[1] = length - 4 >> 16 & 0xFF;
            this.data[2] = length - 4 >> 8 & 0xFF;
            this.data[3] = length - 4 & 0xFF;
            this.data[6] = 0x08;
            this.data[10] = 3;
            this.status = 0x58;
            break;

        case 0x51:
            // read disk information
            this.data_allocate(0);
            this.data_end = this.data_length;
            this.status = 0x50;
            break;

        case 0x52:
            dbg_log("Unimplemented ATAPI command: " + h(this.data[0]), LOG_DISK);
            this.status = 0x51;
            this.data_length = 0;
            this.error = 5 << 4;
            break;

        case 0x5A:
            // mode sense
            var length = this.data[8] | this.data[7] << 8;
            var page_code = this.data[2];
            dbg_log("mode sense: " + h(page_code) + " length=" + length, LOG_DISK);
            if(page_code === 0x2A)
            {
                this.data_allocate(Math.min(30, length));
            }
            this.data_end = this.data_length;
            this.status = 0x58;
            break;

        case 0xBD:
            // mechanism status
            this.data_allocate(this.data[9] | this.data[8] << 8);
            this.data_end = this.data_length;
            this.data[5] = 1;
            this.status = 0x58;
            break;

        case 0x4A:
            this.status = 0x51;
            this.data_length = 0;
            this.error = 5 << 4;
            dbg_log("Unimplemented ATAPI command: " + h(this.data[0]), LOG_DISK);
            break;

        case 0xBE:
            // Hiren's boot CD
            dbg_log("Unimplemented ATAPI command: " + h(this.data[0]), LOG_DISK);
            this.data_allocate(0);
            this.data_end = this.data_length;
            this.status = 0x50;
            break;

        default:
            this.status = 0x51;
            this.data_length = 0;
            this.error = 5 << 4;
            dbg_log("Unimplemented ATAPI command: " + h(this.data[0]), LOG_DISK);
            dbg_assert(false);
    }

    this.bytecount = this.bytecount & ~7 | 2;

    if((this.status & 0x80) === 0)
    {
        this.push_irq();
    }

    if((this.status & 0x80) === 0 && this.data_length === 0)
    {
        this.bytecount |= 1;
        this.status &= ~8;
    }
};

IDEInterface.prototype.do_write = function()
{
    this.status = 0x50;

    dbg_assert(this.data_length <= this.data.length);
    var data = this.data.subarray(0, this.data_length);

    //dbg_log(hex_dump(data), LOG_DISK);
    dbg_assert(this.data_length % 512 === 0);
    this.ata_advance(this.current_command, this.data_length / 512);
    this.push_irq();

    this.buffer.set(this.write_dest, data, function()
    {
    });

    this.report_write(this.data_length);
};

IDEInterface.prototype.atapi_read = function(cmd)
{
    // Note: Big Endian
    var lba = cmd[2] << 24 | cmd[3] << 16 | cmd[4] << 8 | cmd[5];
    var count = cmd[7] << 8 | cmd[8];
    var flags = cmd[1];
    var byte_count = count * this.sector_size;
    var start = lba * this.sector_size;

    dbg_log("CD read lba=" + h(lba) +
            " lbacount=" + h(count) +
            " bytecount=" + h(byte_count) +
            " flags=" + h(flags), LOG_DISK);

    this.data_length = 0;
    var req_length = this.cylinder_high << 8 & 0xFF00 | this.cylinder_low & 0xFF;
    dbg_log(h(this.cylinder_high, 2) + " " + h(this.cylinder_low, 2), LOG_DISK);
    this.cylinder_low = this.cylinder_high = 0; // oak technology driver (windows 3.0)

    if(req_length === 0xFFFF)
        req_length--;

    if(req_length > byte_count)
    {
        req_length = byte_count;
    }

    if(start >= this.buffer.byteLength)
    {
        dbg_assert(false, "CD read: Outside of disk  end=" + h(start + byte_count) +
                          " size=" + h(this.buffer.byteLength), LOG_DISK);

        this.status = 0xFF;
        this.push_irq();
    }
    else if(byte_count === 0)
    {
        this.status = 0x50;

        this.data_pointer = 0;
        //this.push_irq();
    }
    else
    {
        byte_count = Math.min(byte_count, this.buffer.byteLength - start);
        this.status = 0x50 | 0x80;
        this.report_read_start();

        this.read_buffer(start, byte_count, (data) =>
        {
            //setTimeout(() => {
            dbg_log("cd read: data arrived", LOG_DISK);
            this.data_set(data);
            this.status = 0x58;
            this.bytecount = this.bytecount & ~7 | 2;

            this.push_irq();

            req_length &= ~3;

            this.data_end = req_length;
            if(this.data_end > this.data_length)
            {
                this.data_end = this.data_length;
            }
            this.cylinder_low = this.data_end & 0xFF;
            this.cylinder_high = this.data_end >> 8 & 0xFF;

            this.report_read_end(byte_count);
            //}, 10);
        });
    }
};

IDEInterface.prototype.atapi_read_dma = function(cmd)
{
    // Note: Big Endian
    var lba = cmd[2] << 24 | cmd[3] << 16 | cmd[4] << 8 | cmd[5];
    var count = cmd[7] << 8 | cmd[8];
    var flags = cmd[1];
    var byte_count = count * this.sector_size;
    var start = lba * this.sector_size;

    dbg_log("CD read DMA lba=" + h(lba) +
            " lbacount=" + h(count) +
            " bytecount=" + h(byte_count) +
            " flags=" + h(flags), LOG_DISK);

    if(start >= this.buffer.byteLength)
    {
        dbg_assert(false, "CD read: Outside of disk  end=" + h(start + byte_count) +
                          " size=" + h(this.buffer.byteLength), LOG_DISK);

        this.status = 0xFF;
        this.push_irq();
    }
    else
    {
        this.status = 0x50 | 0x80;
        this.report_read_start();

        this.read_buffer(start, byte_count, (data) =>
        {
            dbg_log("atapi_read_dma: Data arrived");
            this.report_read_end(byte_count);
            this.status = 0x58;
            this.bytecount = this.bytecount & ~7 | 2;
            this.data_set(data);

            this.do_atapi_dma();
        });
    }
};

IDEInterface.prototype.do_atapi_dma = function()
{
    if((this.device.dma_status & 1) === 0)
    {
        dbg_log("do_atapi_dma: Status not set", LOG_DISK);
        return;
    }

    if((this.status & 0x8) === 0)
    {
        dbg_log("do_atapi_dma: DRQ not set", LOG_DISK);
        return;
    }

    dbg_log("atapi dma transfer len=" + this.data_length, LOG_DISK);

    var prdt_start = this.device.prdt_addr;
    var offset = 0;

    var data = this.data;

    do {
        var addr = this.cpu.read32s(prdt_start);
        var count = this.cpu.read16(prdt_start + 4);
        var end = this.cpu.read8(prdt_start + 7) & 0x80;

        if(!count)
        {
            count = 0x10000;
        }

        dbg_log("dma read dest=" + h(addr) + " count=" + h(count) + " datalen=" + h(this.data_length), LOG_DISK);
        this.cpu.write_blob(data.subarray(offset, Math.min(offset + count, this.data_length)), addr);

        offset += count;
        prdt_start += 8;

        if(offset >= this.data_length && !end)
        {
            dbg_log("leave early end=" + (+end) +
                    " offset=" + h(offset) +
                    " data_length=" + h(this.data_length) +
                    " cmd=" + h(this.current_command), LOG_DISK);
            break;
        }
    }
    while(!end);

    dbg_log("end offset=" + offset, LOG_DISK);

    this.status = 0x50;
    this.device.dma_status &= ~1;
    this.bytecount = this.bytecount & ~7 | 3;
    this.push_irq();
};

IDEInterface.prototype.read_data = function(length)
{
    if(this.data_pointer < this.data_end)
    {
        dbg_assert(this.data_pointer + length - 1 < this.data_end);
        dbg_assert(this.data_pointer % length === 0, h(this.data_pointer) + " " + length);

        if(length === 1)
        {
            var result = this.data[this.data_pointer];
        }
        else if(length === 2)
        {
            var result = this.data16[this.data_pointer >>> 1];
        }
        else
        {
            var result = this.data32[this.data_pointer >>> 2];
        }

        this.data_pointer += length;

        var align = (this.data_end & 0xFFF) === 0 ? 0xFFF : 0xFF;
        if((this.data_pointer & align) === 0)
        {
            dbg_log("Read 1F0: " + h(this.data[this.data_pointer], 2) +
                        " cur=" + h(this.data_pointer) +
                        " cnt=" + h(this.data_length), LOG_DISK);
        }

        if(this.data_pointer >= this.data_end)
        {
            this.read_end();
        }

        return result;
    }
    else
    {
        dbg_log("Read 1F0: empty", LOG_DISK);

        this.data_pointer += length;
        return 0;
    }
};

IDEInterface.prototype.read_end = function()
{
    dbg_log("read_end cmd=" + h(this.current_command) + " data_pointer=" + h(this.data_pointer) +
            " end=" + h(this.data_end) + " length=" + h(this.data_length), LOG_DISK);

    if(this.current_command === 0xA0)
    {
        if(this.data_end === this.data_length)
        {
            this.status = 0x50;
            this.bytecount = this.bytecount & ~7 | 3;
            this.push_irq();
        }
        else
        {
            this.status = 0x58;
            this.bytecount = this.bytecount & ~7 | 2;
            this.push_irq();
            var byte_count = this.cylinder_high << 8 & 0xFF00 | this.cylinder_low & 0xFF;

            if(this.data_end + byte_count > this.data_length)
            {
                this.cylinder_low = (this.data_length - this.data_end) & 0xFF;
                this.cylinder_high = (this.data_length - this.data_end) >> 8 & 0xFF;
                this.data_end = this.data_length;
            }
            else
            {
                this.data_end += byte_count;
            }
            dbg_log("data_end=" + h(this.data_end), LOG_DISK);
        }
    }
    else
    {
        this.error = 0;
        if(this.data_pointer >= this.data_length)
        {
            this.status = 0x50;
        }
        else
        {
            if(this.current_command === 0xC4 || this.current_command === 0x29)
            {
                var sector_count = Math.min(this.sectors_per_drq,
                    (this.data_length - this.data_end) / 512);
                dbg_assert(sector_count % 1 === 0);
            }
            else
            {
                dbg_assert(this.current_command === 0x20 || this.current_command === 0x24);
                var sector_count = 1;
            }
            this.ata_advance(this.current_command, sector_count);
            this.data_end += 512 * sector_count;
            this.status = 0x58;
            this.push_irq();
        }
    }
};

IDEInterface.prototype.write_data_port = function(data, length)
{
    dbg_assert(this.data_pointer % length === 0);

    if(this.data_pointer >= this.data_end)
    {
        dbg_log("Redundant write to data port: " + h(data) + " count=" + h(this.data_end) +
                " cur=" + h(this.data_pointer), LOG_DISK);
    }
    else
    {
        var align = (this.data_end & 0xFFF) === 0 ? 0xFFF : 0xFF;
        if((this.data_pointer + length & align) === 0 || this.data_end < 20)
        {
            dbg_log("Data port: " + h(data >>> 0) + " count=" + h(this.data_end) +
                    " cur=" + h(this.data_pointer), LOG_DISK);
        }

        if(length === 1)
        {
            this.data[this.data_pointer++] = data;
        }
        else if(length === 2)
        {
            this.data16[this.data_pointer >>> 1] = data;
            this.data_pointer += 2;
        }
        else
        {
            this.data32[this.data_pointer >>> 2] = data;
            this.data_pointer += 4;
        }

        dbg_assert(this.data_pointer <= this.data_end);
        if(this.data_pointer === this.data_end)
        {
            this.write_end();
        }
    }
};

IDEInterface.prototype.write_data_port8 = function(data)
{
    this.write_data_port(data, 1);
};

IDEInterface.prototype.write_data_port16 = function(data)
{
    this.write_data_port(data, 2);
};

IDEInterface.prototype.write_data_port32 = function(data)
{
    this.write_data_port(data, 4);
};

IDEInterface.prototype.write_end = function()
{
    if(this.current_command === 0xA0)
    {
        this.atapi_handle();
    }
    else
    {
        dbg_log("write_end data_pointer=" + h(this.data_pointer) +
                " data_length=" + h(this.data_length), LOG_DISK);

        if(this.data_pointer >= this.data_length)
        {
            this.do_write();
        }
        else
        {
            dbg_assert(this.current_command === 0x30 ||
                this.current_command === 0x34 ||
                this.current_command === 0xC5,
                "Unexpected command: " + h(this.current_command));

            // XXX: Should advance here, but do_write does all the advancing
            //this.ata_advance(this.current_command, 1);
            this.status = 0x58;
            this.data_end += 512;
            this.push_irq();
        }
    }
};

IDEInterface.prototype.ata_advance = function(cmd, sectors)
{
    dbg_log("Advance sectors=" + sectors + " old_bytecount=" + this.bytecount, LOG_DISK);
    this.bytecount -= sectors;

    if(cmd === 0x24 || cmd === 0x29 || cmd === 0x34 || cmd === 0x39 ||
       cmd === 0x25 || cmd === 0x35)
    {
        var new_sector = sectors + this.get_lba48();
        this.sector = new_sector & 0xFF | new_sector >> 16 & 0xFF00;
        this.cylinder_low = new_sector >> 8 & 0xFF;
        this.cylinder_high = new_sector >> 16 & 0xFF;
    }
    else if(this.is_lba)
    {
        var new_sector = sectors + this.get_lba28();
        this.sector = new_sector & 0xFF;
        this.cylinder_low = new_sector >> 8 & 0xFF;
        this.cylinder_high = new_sector >> 16 & 0xFF;
        this.head = this.head & ~0xF | new_sector & 0xF;
    }
    else // chs
    {
        var new_sector = sectors + this.get_chs();

        var c = new_sector / (this.head_count * this.sectors_per_track) | 0;
        this.cylinder_low = c & 0xFF;
        this.cylinder_high = c >> 8 & 0xFF;
        this.head = (new_sector / this.sectors_per_track | 0) % this.head_count & 0xF;
        this.sector = (new_sector % this.sectors_per_track + 1) & 0xFF;

        dbg_assert(new_sector === this.get_chs());
    }
};

IDEInterface.prototype.ata_read_sectors = function(cmd)
{
    var is_lba48 = cmd === 0x24 || cmd === 0x29;
    var count = this.get_count(is_lba48);
    var lba = this.get_lba(is_lba48);

    var is_single = cmd === 0x20 || cmd === 0x24;

    var byte_count = count * this.sector_size;
    var start = lba * this.sector_size;

    dbg_log("ATA read cmd=" + h(cmd) +
            " mode=" + (this.is_lba ? "lba" : "chs") +
            " lba=" + h(lba) +
            " lbacount=" + h(count) +
            " bytecount=" + h(byte_count), LOG_DISK);

    if(start + byte_count > this.buffer.byteLength)
    {
        dbg_assert(false, "ATA read: Outside of disk", LOG_DISK);

        this.status = 0xFF;
        this.push_irq();
    }
    else
    {
        this.status = 0x80 | 0x40;
        this.report_read_start();

        this.read_buffer(start, byte_count, (data) =>
        {
            //setTimeout(() => {
            dbg_log("ata_read: Data arrived", LOG_DISK);

            this.data_set(data);
            this.status = 0x58;
            this.data_end = is_single ? 512 : Math.min(byte_count, this.sectors_per_drq * 512);
            this.ata_advance(cmd, is_single ? 1 : Math.min(count, this.sectors_per_track));

            this.push_irq();
            this.report_read_end(byte_count);
            //}, 10);
        });
    }
};

IDEInterface.prototype.ata_read_sectors_dma = function(cmd)
{
    var is_lba48 = cmd === 0x25;
    var count = this.get_count(is_lba48);
    var lba = this.get_lba(is_lba48);

    var byte_count = count * this.sector_size;
    var start = lba * this.sector_size;

    dbg_log("ATA DMA read lba=" + h(lba) +
            " lbacount=" + h(count) +
            " bytecount=" + h(byte_count), LOG_DISK);

    if(start + byte_count > this.buffer.byteLength)
    {
        dbg_assert(false, "ATA read: Outside of disk", LOG_DISK);

        this.status = 0xFF;
        this.push_irq();
        return;
    }

    this.status = 0x58;
    this.device.dma_status |= 1;
};

IDEInterface.prototype.do_ata_read_sectors_dma = function()
{
    var cmd = this.current_command;

    var is_lba48 = cmd === 0x25;
    var count = this.get_count(is_lba48);
    var lba = this.get_lba(is_lba48);

    var byte_count = count * this.sector_size;
    var start = lba * this.sector_size;

    dbg_assert(lba < this.buffer.byteLength);

    this.report_read_start();

    var orig_prdt_start = this.device.prdt_addr;

    this.read_buffer(start, byte_count, (data) =>
    {
        //setTimeout(function() {
        dbg_log("do_ata_read_sectors_dma: Data arrived", LOG_DISK);
        var prdt_start = this.device.prdt_addr;
        var offset = 0;

        dbg_assert(orig_prdt_start === prdt_start);

        do {
            var prd_addr = this.cpu.read32s(prdt_start);
            var prd_count = this.cpu.read16(prdt_start + 4);
            var end = this.cpu.read8(prdt_start + 7) & 0x80;

            if(!prd_count)
            {
                prd_count = 0x10000;
                dbg_log("dma: prd count was 0", LOG_DISK);
            }

            dbg_log("dma read transfer dest=" + h(prd_addr) +
                    " prd_count=" + h(prd_count), LOG_DISK);
            this.cpu.write_blob(data.subarray(offset, offset + prd_count), prd_addr);

            offset += prd_count;
            prdt_start += 8;
        }
        while(!end);

        dbg_assert(offset === byte_count);

        this.ata_advance(this.current_command, count);
        this.status = 0x50;
        this.device.dma_status &= ~1;
        this.current_command = -1;

        this.push_irq();

        this.report_read_end(byte_count);
        //}.bind(this), 10);
    });
};

IDEInterface.prototype.ata_write_sectors = function(cmd)
{
    var is_lba48 = cmd === 0x34 || cmd === 0x39;
    var count = this.get_count(is_lba48);
    var lba = this.get_lba(is_lba48);

    var is_single = cmd === 0x30 || cmd === 0x34;

    var byte_count = count * this.sector_size;
    var start = lba * this.sector_size;

    dbg_log("ATA write lba=" + h(lba) +
            " mode=" + (this.is_lba ? "lba" : "chs") +
            " lbacount=" + h(count) +
            " bytecount=" + h(byte_count), LOG_DISK);

    if(start + byte_count > this.buffer.byteLength)
    {
        dbg_assert(false, "ATA write: Outside of disk", LOG_DISK);

        this.status = 0xFF;
        this.push_irq();
    }
    else
    {
        this.status = 0x58;
        this.data_allocate_noclear(byte_count);
        this.data_end = is_single ? 512 : Math.min(byte_count, this.sectors_per_drq * 512);
        this.write_dest = start;
    }
};

IDEInterface.prototype.ata_write_sectors_dma = function(cmd)
{
    var is_lba48 = cmd === 0x35;
    var count = this.get_count(is_lba48);
    var lba = this.get_lba(is_lba48);

    var byte_count = count * this.sector_size;
    var start = lba * this.sector_size;

    dbg_log("ATA DMA write lba=" + h(lba) +
            " lbacount=" + h(count) +
            " bytecount=" + h(byte_count), LOG_DISK);

    if(start + byte_count > this.buffer.byteLength)
    {
        dbg_assert(false, "ATA DMA write: Outside of disk", LOG_DISK);

        this.status = 0xFF;
        this.push_irq();
        return;
    }

    this.status = 0x58;
    this.device.dma_status |= 1;
};

IDEInterface.prototype.do_ata_write_sectors_dma = function()
{
    var cmd = this.current_command;

    var is_lba48 = cmd === 0x35;
    var count = this.get_count(is_lba48);
    var lba = this.get_lba(is_lba48);

    var byte_count = count * this.sector_size;
    var start = lba * this.sector_size;

    var prdt_start = this.device.prdt_addr;
    var offset = 0;

    dbg_log("prdt addr: " + h(prdt_start, 8), LOG_DISK);

    const buffer = new Uint8Array(byte_count);

    do {
        var prd_addr = this.cpu.read32s(prdt_start);
        var prd_count = this.cpu.read16(prdt_start + 4);
        var end = this.cpu.read8(prdt_start + 7) & 0x80;

        if(!prd_count)
        {
            prd_count = 0x10000;
            dbg_log("dma: prd count was 0", LOG_DISK);
        }

        dbg_log("dma write transfer dest=" + h(prd_addr) + " prd_count=" + h(prd_count), LOG_DISK);

        var slice = this.cpu.mem8.subarray(prd_addr, prd_addr + prd_count);
        dbg_assert(slice.length === prd_count);

        buffer.set(slice, offset);

        //if(DEBUG)
        //{
        //    dbg_log(hex_dump(slice), LOG_DISK);
        //}

        offset += prd_count;
        prdt_start += 8;
    }
    while(!end);

    dbg_assert(offset === buffer.length);

    this.buffer.set(start, buffer, () =>
    {
        dbg_log("dma write completed", LOG_DISK);
        this.ata_advance(this.current_command, count);
        this.status = 0x50;
        this.push_irq();
        this.device.dma_status &= ~1;
        this.current_command = -1;
    });

    this.report_write(byte_count);
};

IDEInterface.prototype.get_chs = function()
{
    var c = this.cylinder_low & 0xFF | this.cylinder_high << 8 & 0xFF00;
    var h = this.head;
    var s = this.sector & 0xFF;

    dbg_log("get_chs: c=" + c + " h=" + h + " s=" + s, LOG_DISK);

    return (c * this.head_count + h) * this.sectors_per_track + s - 1;
};

IDEInterface.prototype.get_lba28 = function()
{
    return this.sector & 0xFF |
            this.cylinder_low << 8 & 0xFF00 |
            this.cylinder_high << 16 & 0xFF0000 |
            (this.head & 0xF) << 24;
};

IDEInterface.prototype.get_lba48 = function()
{
    // Note: Bits over 32 missing
    return (this.sector & 0xFF |
            this.cylinder_low << 8 & 0xFF00 |
            this.cylinder_high << 16 & 0xFF0000 |
            (this.sector >> 8) << 24 & 0xFF000000) >>> 0;
};

IDEInterface.prototype.get_lba = function(is_lba48)
{
    if(is_lba48)
    {
        return this.get_lba48();
    }
    else if(this.is_lba)
    {
        return this.get_lba28();
    }
    else
    {
        return this.get_chs();
    }
};

IDEInterface.prototype.get_count = function(is_lba48)
{
    if(is_lba48)
    {
        var count = this.bytecount;
        if(count === 0) count = 0x10000;
        return count;
    }
    else
    {
        var count = this.bytecount & 0xFF;
        if(count === 0) count = 0x100;
        return count;
    }
};

IDEInterface.prototype.create_identify_packet = function()
{
    // http://bochs.sourceforge.net/cgi-bin/lxr/source/iodev/harddrv.cc#L2821

    if(this.drive_head & 0x10)
    {
        // slave
        this.data_allocate(0);
        return;
    }

    for(var i = 0; i < 512; i++)
    {
        this.data[i] = 0;
    }

    var cylinder_count = Math.min(16383, this.cylinder_count);

    this.data_set([
        0x40, this.is_atapi ? 0x85 : 0,
        // 1 cylinders
        cylinder_count, cylinder_count >> 8,
        0, 0,

        // 3 heads
        this.head_count, this.head_count >> 8,
        this.sectors_per_track / 512, this.sectors_per_track / 512 >> 8,
        // 5
        0, 512 >> 8,
        // sectors per track
        this.sectors_per_track, this.sectors_per_track >> 8,
        0, 0, 0, 0, 0, 0,
        // 10-19 serial number
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        // 15
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        // 20
        3, 0,
        0, 2,
        4, 0,
        // 23-26 firmware revision
        0, 0, 0, 0, 0, 0, 0, 0,

        // 27 model number
        56, 118, 32, 54, 68, 72, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
        32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,

        // 47 max value for set multiple mode
        0x80, 0,
        1, 0,
        //0, 3,  // capabilities, 2: Only LBA / 3: LBA and DMA
        0, 2,  // capabilities, 2: Only LBA / 3: LBA and DMA
        // 50
        0, 0,
        0, 2,
        0, 2,
        7, 0,

        // 54 cylinders
        cylinder_count, cylinder_count >> 8,
        // 55 heads
        this.head_count, this.head_count >> 8,
        // 56 sectors per track
        this.sectors_per_track, 0,
        // capacity in sectors
        this.sector_count & 0xFF, this.sector_count >> 8 & 0xFF,
        this.sector_count >> 16 & 0xFF, this.sector_count >> 24 & 0xFF,

        0, 0,
        // 60
        this.sector_count & 0xFF, this.sector_count >> 8 & 0xFF,
        this.sector_count >> 16 & 0xFF, this.sector_count >> 24 & 0xFF,

        0, 0,
        // 63, dma supported mode, dma selected mode
        this.current_command === 0xA0 ? 0 : 7, this.current_command === 0xA0 ? 0 : 4,
        //0, 0, // no DMA

        0, 0,
        // 65
        30, 0, 30, 0, 30, 0, 30, 0, 0, 0,
        // 70
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        // 75
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        // 80
        0x7E, 0, 0, 0, 0, 0, 0, 0x74, 0, 0x40,
        // 85
        0, 0x40, 0, 0x74, 0, 0x40, 0, 0, 0, 0,
        // 90
        0, 0, 0, 0, 0, 0, 1, 0x60, 0, 0,
        // 95
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        // 100
        this.sector_count & 0xFF, this.sector_count >> 8 & 0xFF,
        this.sector_count >> 16 & 0xFF, this.sector_count >> 24 & 0xFF,
    ]);

    this.data_length = 512;
    this.data_end = 512;
};

IDEInterface.prototype.data_allocate = function(len)
{
    this.data_allocate_noclear(len);

    for(var i = 0; i < (len + 3 >> 2); i++)
    {
        this.data32[i] = 0;
    }
};

IDEInterface.prototype.data_allocate_noclear = function(len)
{
    if(this.data.length < len)
    {
        this.data = new Uint8Array(len + 3 & ~3);
        this.data16 = new Uint16Array(this.data.buffer);
        this.data32 = new Int32Array(this.data.buffer);
    }

    this.data_length = len;
    this.data_pointer = 0;
};

IDEInterface.prototype.data_set = function(data)
{
    this.data_allocate_noclear(data.length);
    this.data.set(data);
};

IDEInterface.prototype.report_read_start = function()
{
    this.bus.send("ide-read-start");
};

IDEInterface.prototype.report_read_end = function(byte_count)
{
    const sector_count = byte_count / this.sector_size | 0;
    this.bus.send("ide-read-end", [this.nr, byte_count, sector_count]);
};

IDEInterface.prototype.report_write = function(byte_count)
{
    const sector_count = byte_count / this.sector_size | 0;
    this.bus.send("ide-write-end", [this.nr, byte_count, sector_count]);
};

IDEInterface.prototype.read_buffer = function(start, length, callback)
{
    const id = this.last_io_id++;
    this.in_progress_io_ids.add(id);

    this.buffer.get(start, length, data =>
    {
        if(this.cancelled_io_ids.delete(id))
        {
            dbg_assert(!this.in_progress_io_ids.has(id));
            return;
        }

        const removed = this.in_progress_io_ids.delete(id);
        dbg_assert(removed);

        callback(data);
    });
};

IDEInterface.prototype.cancel_io_operations = function()
{
    for(const id of this.in_progress_io_ids)
    {
        this.cancelled_io_ids.add(id);
    }
    this.in_progress_io_ids.clear();
};

IDEInterface.prototype.get_state = function()
{
    var state = [];
    state[0] = this.bytecount;
    state[1] = this.cylinder_count;
    state[2] = this.cylinder_high;
    state[3] = this.cylinder_low;
    state[4] = this.data_pointer;
    state[5] = 0;
    state[6] = 0;
    state[7] = 0;
    state[8] = 0;
    state[9] = this.drive_head;
    state[10] = this.error;
    state[11] = this.head;
    state[12] = this.head_count;
    state[13] = this.is_atapi;
    state[14] = this.is_lba;
    state[15] = this.lba_count;
    state[16] = this.data;
    state[17] = this.data_length;
    state[18] = this.sector;
    state[19] = this.sector_count;
    state[20] = this.sector_size;
    state[21] = this.sectors_per_drq;
    state[22] = this.sectors_per_track;
    state[23] = this.status;
    state[24] = this.write_dest;
    state[25] = this.current_command;
    state[26] = this.data_end;
    state[27] = this.current_atapi_command;
    state[28] = this.buffer;
    return state;
};

IDEInterface.prototype.set_state = function(state)
{
    this.bytecount = state[0];
    this.cylinder_count = state[1];
    this.cylinder_high = state[2];
    this.cylinder_low = state[3];
    this.data_pointer = state[4];

    this.drive_head = state[9];
    this.error = state[10];
    this.head = state[11];
    this.head_count = state[12];
    this.is_atapi = state[13];
    this.is_lba = state[14];
    this.lba_count = state[15];
    this.data = state[16];
    this.data_length = state[17];
    this.sector = state[18];
    this.sector_count = state[19];
    this.sector_size = state[20];
    this.sectors_per_drq = state[21];
    this.sectors_per_track = state[22];
    this.status = state[23];
    this.write_dest = state[24];
    this.current_command = state[25];

    this.data_end = state[26];
    this.current_atapi_command = state[27];

    this.data16 = new Uint16Array(this.data.buffer);
    this.data32 = new Int32Array(this.data.buffer);

    this.buffer && this.buffer.set_state(state[28]);
};


// ---- File: src/virtio_net.js ----
// https://docs.oasis-open.org/virtio/virtio/v1.2/csd01/virtio-v1.2-csd01.html#x1-2900003






// For Types Only



const VIRTIO_NET_F_MAC = 5;
const VIRTIO_NET_F_CTRL_VQ = 17;
const VIRTIO_NET_F_STATUS = 16;
const VIRTIO_NET_F_MQ = 22;
const VIRTIO_NET_F_CTRL_MAC_ADDR = 23;
const VIRTIO_NET_F_MTU = 3;

const VIRTIO_NET_CTRL_MQ_VQ_PAIRS_SET = 0;
const VIRTIO_NET_CTRL_MAC_ADDR_SET = 1;

/**
 * @constructor
 * @param {CPU} cpu
 * @param {BusConnector} bus
 * @param {Boolean} preserve_mac_from_state_image
 */
function VirtioNet(cpu, bus, preserve_mac_from_state_image)
{
    /** @const @type {BusConnector} */
    this.bus = bus;
    this.id = cpu.devices.net ? 1 : 0;
    this.pairs = 1;
    this.status = 1;
    this.preserve_mac_from_state_image = preserve_mac_from_state_image;
    this.mac = new Uint8Array([
        0x00, 0x22, 0x15,
        Math.random() * 255 | 0,
        Math.random() * 255 | 0,
        Math.random() * 255 | 0,
    ]);

    this.bus.send("net" + this.id + "-mac", format_mac(this.mac));

    const queues = [];

    for(let i = 0; i < this.pairs; ++i)
    {
        queues.push({size_supported: 1024, notify_offset: 0});
        queues.push({size_supported: 1024, notify_offset: 1});
    }
    queues.push({
        size_supported: 16,
        notify_offset: 2,
    });

    /** @type {VirtIO} */
    this.virtio = new VirtIO(cpu,
    {
        name: "virtio-net",
        pci_id: 0x0A << 3,
        device_id: 0x1041,
        subsystem_device_id: 1,
        common:
        {
            initial_port: 0xC800,
            queues: queues,
            features:
            [
                VIRTIO_NET_F_MAC,
                VIRTIO_NET_F_STATUS,
                VIRTIO_NET_F_MQ,
                VIRTIO_NET_F_MTU,
                VIRTIO_NET_F_CTRL_VQ,
                VIRTIO_NET_F_CTRL_MAC_ADDR,
                VIRTIO_F_VERSION_1,
            ],
            on_driver_ok: () => {},
        },
        notification:
        {
            initial_port: 0xC900,
            single_handler: false,
            handlers:
            [
                (queue_id) =>
                {

                },
                (queue_id) =>
                {
                    const queue = this.virtio.queues[queue_id];

                    while(queue.has_request())
                    {
                        const bufchain = queue.pop_request();
                        const buffer = new Uint8Array(bufchain.length_readable);
                        bufchain.get_next_blob(buffer);
                        this.bus.send("net" + this.id + "-send", buffer.subarray(12));
                        this.bus.send("eth-transmit-end", [buffer.length - 12]);
                        this.virtio.queues[queue_id].push_reply(bufchain);
                    }
                    this.virtio.queues[queue_id].flush_replies();
                },
                (queue_id) =>
                {
                    if(queue_id !== this.pairs * 2)
                    {
                        dbg_assert(false, "VirtioNet Notified for wrong queue: " + queue_id +
                            " (expected queue_id of 3)");
                        return;
                    }
                    const queue = this.virtio.queues[queue_id];

                    while(queue.has_request())
                    {
                        const bufchain = queue.pop_request();
                        const buffer = new Uint8Array(bufchain.length_readable);
                        bufchain.get_next_blob(buffer);


                        const parts = marshall.Unmarshall(["b", "b"], buffer, { offset : 0 });
                        const xclass = parts[0];
                        const command = parts[1];


                        //this.Ack(queue_id, bufchain);

                        switch(xclass << 8 | command) {
                            case 4 << 8 | VIRTIO_NET_CTRL_MQ_VQ_PAIRS_SET:
                                const data =  marshall.Unmarshall(["h"], buffer, { offset : 2 });
                                dbg_assert(data[0] === 1);
                                this.Send(queue_id, bufchain, new Uint8Array([0]));
                                break;
                            case 1 << 8 | VIRTIO_NET_CTRL_MAC_ADDR_SET:
                                this.mac = buffer.subarray(2, 8);
                                this.Send(queue_id, bufchain, new Uint8Array([0]));
                                this.bus.send("net" + this.id + "-mac", format_mac(this.mac));
                                break;
                            default:
                                dbg_assert(false," VirtioNet received unknown command: " + xclass + ":" + command);
                                this.Send(queue_id, bufchain, new Uint8Array([1]));
                                return;

                        }
                    }
                },
            ],
        },
        isr_status:
        {
            initial_port: 0xC700,
        },
        device_specific:
        {
            initial_port: 0xC600,
            struct:
            [0,1,2,3,4,5].map((v,k) => ({
                bytes: 1,
                name: "mac_" + k,
                read: () => this.mac[k],
                write: data => { /* read only */ },
            })).concat(
            [
                {
                    bytes: 2,
                    name: "status",
                    read: () => this.status,
                    write: data => { /* read only */ },
                },
                {
                    bytes: 2,
                    name: "max_pairs",
                    read: () => this.pairs,
                    write: data => { /* read only */ },
                },
                {
                    bytes: 2,
                    name: "mtu",
                    read: () => 1500,
                    write: data => {},
                }
           ])
        },
    });

    this.bus.register("net" + this.id + "-receive", data => {
        this.bus.send("eth-receive-end", [data.length]);
        const with_header = new Uint8Array(12 + data.byteLength);
        const view = new DataView(with_header.buffer, with_header.byteOffset, with_header.byteLength);
        view.setInt16(10, 1);
        with_header.set(data, 12);

        const queue = this.virtio.queues[0];
        if(queue.has_request()) {
            const bufchain = queue.pop_request();
            bufchain.set_next_blob(with_header);
            this.virtio.queues[0].push_reply(bufchain);
            this.virtio.queues[0].flush_replies();
        } else {
            console.log("No buffer to write into!");
        }
    }, this);

}


VirtioNet.prototype.get_state = function()
{
    const state = [];
    state[0] = this.virtio;
    state[1] = this.id;
    state[2] = this.mac;
    return state;
};

VirtioNet.prototype.set_state = function(state)
{
    this.virtio.set_state(state[0]);
    this.id = state[1];
    if(this.preserve_mac_from_state_image)
    {
        this.mac = state[2];
        this.bus.send("net" + this.id + "-mac", format_mac(this.mac));
    }
};

VirtioNet.prototype.reset = function() {
    this.virtio.reset();
};

VirtioNet.prototype.Send = function (queue_id, bufchain, blob)
{
    bufchain.set_next_blob(blob);
    this.virtio.queues[queue_id].push_reply(bufchain);
    this.virtio.queues[queue_id].flush_replies();
};

VirtioNet.prototype.Ack = function (queue_id, bufchain)
{
    //bufchain.set_next_blob(new Uint8Array(0));
    this.virtio.queues[queue_id].push_reply(bufchain);
    this.virtio.queues[queue_id].flush_replies();
};


// ---- File: src/browser/screen.js ----


// Draws entire buffer and visualizes the layers that would be drawn
const DEBUG_SCREEN_LAYERS = DEBUG && false;

/**
 * Adapter to use visual screen in browsers (in contrast to node)
 * @constructor
 * @param {Object} options
 */
function ScreenAdapter(options, screen_fill_buffer)
{
    const screen_container = options.container;
    this.screen_fill_buffer = screen_fill_buffer;

    console.assert(screen_container, "options.container must be provided");

    const MODE_TEXT = 0;
    const MODE_GRAPHICAL = 1;
    const MODE_GRAPHICAL_TEXT = 2;

    const CHARACTER_INDEX = 0;
    const FLAGS_INDEX = 1;
    const BG_COLOR_INDEX = 2;
    const FG_COLOR_INDEX = 3;
    const TEXT_BUF_COMPONENT_SIZE = 4;

    const FLAG_BLINKING = 0x01;
    const FLAG_FONT_PAGE_B = 0x02;

    this.FLAG_BLINKING = FLAG_BLINKING;
    this.FLAG_FONT_PAGE_B = FLAG_FONT_PAGE_B;

    var
        graphic_screen = screen_container.getElementsByTagName("canvas")[0],
        graphic_context = graphic_screen.getContext("2d", { alpha: false }),

        text_screen = screen_container.getElementsByTagName("div")[0],
        cursor_element = document.createElement("div");

    var
        /** @type {number} */
        cursor_row,

        /** @type {number} */
        cursor_col,

        /** @type {number} */
        scale_x = options.scale !== undefined ? options.scale : 1,

        /** @type {number} */
        scale_y = options.scale !== undefined ? options.scale : 1,

        base_scale = 1,

        changed_rows,

        // current display mode: MODE_GRAPHICAL or either MODE_TEXT/MODE_GRAPHICAL_TEXT
        mode,

        // Index 0: ASCII code
        // Index 1: Flags bitset (see FLAG_...)
        // Index 2: Background color
        // Index 3: Foreground color
        text_mode_data,

        // number of columns
        text_mode_width,

        // number of rows
        text_mode_height,

        // graphical text mode's offscreen canvas contexts
        offscreen_context,
        offscreen_extra_context,

        // fonts
        font_context,
        font_image_data,
        font_is_visible = new Int8Array(8 * 256),
        font_height,
        font_width,
        font_width_9px,
        font_width_dbl,
        font_copy_8th_col,
        font_page_a = 0,
        font_page_b = 0,

        // blink state
        blink_visible,
        tm_last_update = 0,

        // cursor attributes
        cursor_start,
        cursor_end,
        cursor_enabled,

        // 8-bit Unicode character maps
        charmap_default = [],
        charmap = charmap_default,

        // render loop state
        timer_id = 0,
        paused = false;

    // 0x12345 -> "#012345"
    function number_as_color(n)
    {
        n = n.toString(16);
        return "#" + "0".repeat(6 - n.length) + n;
    }

    function render_font_bitmap(vga_bitmap)
    {
        // - Browsers impose limts on the X- and Y-axes of bitmaps (typically around 8 to 32k).
        //   Draw the 8 VGA font pages of 256 glyphs in 8 rows of 256 columns, this results
        //   in 2048, 2304 or 4096px on the X-axis (for 8, 9 or 16px VGA font width, resp.).
        //   This 2d layout is also convenient for glyph lookup when rendering text.
        // - Font bitmap pixels are black and either fully opaque (alpha 255) or fully transparent (0).
        const bitmap_width = font_width * 256;
        const bitmap_height = font_height * 8;

        let font_canvas = font_context ? font_context.canvas : null;
        if(!font_canvas || font_canvas.width !== bitmap_width || font_canvas.height !== bitmap_height)
        {
            if(!font_canvas)
            {
                font_canvas = new OffscreenCanvas(bitmap_width, bitmap_height);
                font_context = font_canvas.getContext("2d");
            }
            else
            {
                font_canvas.width = bitmap_width;
                font_canvas.height = bitmap_height;
            }
            font_image_data = font_context.createImageData(bitmap_width, bitmap_height);
        }

        const font_bitmap = font_image_data.data;
        let i_dst = 0, is_visible;
        const put_bit = font_width_dbl ?
            function(value)
            {
                is_visible = is_visible || value;
                font_bitmap[i_dst + 3] = value;
                font_bitmap[i_dst + 7] = value;
                i_dst += 8;
            } :
            function(value)
            {
                is_visible = is_visible || value;
                font_bitmap[i_dst + 3] = value;
                i_dst += 4;
            };

        // move i_vga from end of glyph to start of next glyph
        const vga_inc_chr = 32 - font_height;
        // move i_dst from end of font page (bitmap row) to start of next font page
        const dst_inc_row = bitmap_width * (font_height - 1) * 4;
        // move i_dst from end of glyph (bitmap column) to start of next glyph
        const dst_inc_col = (font_width - bitmap_width * font_height) * 4;
        // move i_dst from end of a glyph's scanline to start of its next scanline
        const dst_inc_line = font_width * 255 * 4;

        for(let i_chr_all = 0, i_vga = 0; i_chr_all < 2048; ++i_chr_all, i_vga += vga_inc_chr, i_dst += dst_inc_col)
        {
            const i_chr = i_chr_all % 256;
            if(i_chr_all && !i_chr)
            {
                i_dst += dst_inc_row;
            }
            is_visible = false;
            for(let i_line = 0; i_line < font_height; ++i_line, ++i_vga, i_dst += dst_inc_line)
            {
                const line_bits = vga_bitmap[i_vga];
                for(let i_bit = 0x80; i_bit > 0; i_bit >>= 1)
                {
                    put_bit(line_bits & i_bit ? 255 : 0);
                }
                if(font_width_9px)
                {
                    put_bit(font_copy_8th_col && i_chr >= 0xC0 && i_chr <= 0xDF && line_bits & 1 ? 255 : 0);
                }
            }
            font_is_visible[i_chr_all] = is_visible ? 1 : 0;
        }

        font_context.putImageData(font_image_data, 0, 0);
    }

    function render_changed_rows()
    {
        const font_canvas = font_context.canvas;
        const offscreen_extra_canvas = offscreen_extra_context.canvas;
        const txt_row_size = text_mode_width * TEXT_BUF_COMPONENT_SIZE;
        const gfx_width = text_mode_width * font_width;
        const row_extra_1_y = 0;
        const row_extra_2_y = font_height;

        let n_rows_rendered = 0;
        for(let row_i = 0, row_y = 0, txt_i = 0; row_i < text_mode_height; ++row_i, row_y += font_height)
        {
            if(!changed_rows[row_i])
            {
                txt_i += txt_row_size;
                continue;
            }
            ++n_rows_rendered;

            // clear extra row 2
            offscreen_extra_context.clearRect(0, row_extra_2_y, gfx_width, font_height);

            let fg_rgba, fg_x, bg_rgba, bg_x;
            for(let col_x = 0; col_x < gfx_width; col_x += font_width, txt_i += TEXT_BUF_COMPONENT_SIZE)
            {
                const chr = text_mode_data[txt_i + CHARACTER_INDEX];
                const chr_flags = text_mode_data[txt_i + FLAGS_INDEX];
                const chr_bg_rgba = text_mode_data[txt_i + BG_COLOR_INDEX];
                const chr_fg_rgba = text_mode_data[txt_i + FG_COLOR_INDEX];
                const chr_font_page = chr_flags & FLAG_FONT_PAGE_B ? font_page_b : font_page_a;
                const chr_visible = (!(chr_flags & FLAG_BLINKING) || blink_visible) && font_is_visible[(chr_font_page << 8) + chr];

                if(bg_rgba !== chr_bg_rgba)
                {
                    if(bg_rgba !== undefined)
                    {
                        // draw opaque block of background color into offscreen_context
                        offscreen_context.fillStyle = number_as_color(bg_rgba);
                        offscreen_context.fillRect(bg_x, row_y, col_x - bg_x, font_height);
                    }
                    bg_rgba = chr_bg_rgba;
                    bg_x = col_x;
                }

                if(fg_rgba !== chr_fg_rgba)
                {
                    if(fg_rgba !== undefined)
                    {
                        // draw opaque block of foreground color into extra row 1
                        offscreen_extra_context.fillStyle = number_as_color(fg_rgba);
                        offscreen_extra_context.fillRect(fg_x, row_extra_1_y, col_x - fg_x, font_height);
                    }
                    fg_rgba = chr_fg_rgba;
                    fg_x = col_x;
                }

                if(chr_visible)
                {
                    // copy transparent glyphs into extra row 2
                    offscreen_extra_context.drawImage(font_canvas,
                        chr * font_width, chr_font_page * font_height, font_width, font_height,
                        col_x, row_extra_2_y, font_width, font_height);
                }
            }

            // draw rightmost block of foreground color into extra row 1
            offscreen_extra_context.fillStyle = number_as_color(fg_rgba);
            offscreen_extra_context.fillRect(fg_x, row_extra_1_y, gfx_width - fg_x, font_height);

            // combine extra row 1 (colors) and 2 (glyphs) into extra row 1 (colored glyphs)
            offscreen_extra_context.globalCompositeOperation = "destination-in";
            offscreen_extra_context.drawImage(offscreen_extra_canvas,
                0, row_extra_2_y, gfx_width, font_height,
                0, row_extra_1_y, gfx_width, font_height);
            offscreen_extra_context.globalCompositeOperation = "source-over";

            // draw rightmost block of background color into offscreen_context
            offscreen_context.fillStyle = number_as_color(bg_rgba);
            offscreen_context.fillRect(bg_x, row_y, gfx_width - bg_x, font_height);

            // copy colored glyphs from extra row 1 into offscreen_context (on top of background colors)
            offscreen_context.drawImage(offscreen_extra_canvas,
                0, row_extra_1_y, gfx_width, font_height,
                0, row_y, gfx_width, font_height);
        }

        if(n_rows_rendered)
        {
            if(blink_visible && cursor_enabled && changed_rows[cursor_row])
            {
                const cursor_txt_i = (cursor_row * text_mode_width + cursor_col) * TEXT_BUF_COMPONENT_SIZE;
                const cursor_rgba = text_mode_data[cursor_txt_i + FG_COLOR_INDEX];
                offscreen_context.fillStyle = number_as_color(cursor_rgba);
                offscreen_context.fillRect(
                    cursor_col * font_width,
                    cursor_row * font_height + cursor_start,
                    font_width,
                    cursor_end - cursor_start + 1);
            }
            changed_rows.fill(0);
        }

        return n_rows_rendered;
    }

    function mark_blinking_rows_dirty()
    {
        const txt_row_size = text_mode_width * TEXT_BUF_COMPONENT_SIZE;
        for(let row_i = 0, txt_i = 0; row_i < text_mode_height; ++row_i)
        {
            if(changed_rows[row_i])
            {
                txt_i += txt_row_size;
                continue;
            }
            for(let col_i = 0; col_i < text_mode_width; ++col_i, txt_i += TEXT_BUF_COMPONENT_SIZE)
            {
                if(text_mode_data[txt_i + FLAGS_INDEX] & FLAG_BLINKING)
                {
                    changed_rows[row_i] = 1;
                    txt_i += txt_row_size - col_i * TEXT_BUF_COMPONENT_SIZE;
                    break;
                }
            }
        }
    }

    this.init = function()
    {
        // map 8-bit DOS codepage 437 character range 0-31 to 16-bit Unicode codepoints
        const charmap_low = new Uint16Array([
            0x20,   0x263A, 0x263B, 0x2665, 0x2666, 0x2663, 0x2660, 0x2022,
            0x25D8, 0x25CB, 0x25D9, 0x2642, 0x2640, 0x266A, 0x266B, 0x263C,
            0x25BA, 0x25C4, 0x2195, 0x203C, 0xB6,   0xA7,   0x25AC, 0x21A8,
            0x2191, 0x2193, 0x2192, 0x2190, 0x221F, 0x2194, 0x25B2, 0x25BC
        ]);
        // map 8-bit DOS codepage 437 character range 127-255 to 16-bit Unicode codepoints
        const charmap_high = new Uint16Array([
            0x2302,
            0xC7, 0xFC, 0xE9, 0xE2, 0xE4, 0xE0, 0xE5, 0xE7,
            0xEA, 0xEB, 0xE8, 0xEF, 0xEE, 0xEC, 0xC4, 0xC5,
            0xC9, 0xE6, 0xC6, 0xF4, 0xF6, 0xF2, 0xFB, 0xF9,
            0xFF, 0xD6, 0xDC, 0xA2, 0xA3, 0xA5, 0x20A7, 0x192,
            0xE1, 0xED, 0xF3, 0xFA, 0xF1, 0xD1, 0xAA, 0xBA,
            0xBF, 0x2310, 0xAC, 0xBD, 0xBC, 0xA1, 0xAB, 0xBB,
            0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x2561, 0x2562, 0x2556,
            0x2555, 0x2563, 0x2551, 0x2557, 0x255D, 0x255C, 0x255B, 0x2510,
            0x2514, 0x2534, 0x252C, 0x251C, 0x2500, 0x253C, 0x255E, 0x255F,
            0x255A, 0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256C, 0x2567,
            0x2568, 0x2564, 0x2565, 0x2559, 0x2558, 0x2552, 0x2553, 0x256B,
            0x256A, 0x2518, 0x250C, 0x2588, 0x2584, 0x258C, 0x2590, 0x2580,
            0x3B1, 0xDF, 0x393, 0x3C0, 0x3A3, 0x3C3, 0xB5, 0x3C4,
            0x3A6, 0x398, 0x3A9, 0x3B4, 0x221E, 0x3C6, 0x3B5, 0x2229,
            0x2261, 0xB1, 0x2265, 0x2264, 0x2320, 0x2321, 0xF7,
            0x2248, 0xB0, 0x2219, 0xB7, 0x221A, 0x207F, 0xB2, 0x25A0, 0xA0
        ]);

        // initialize 8-bit DOS codepage 437 map charmap[256] (Uint8 -> String[1])
        for(var i = 0, chr; i < 256; i++)
        {
            if(i > 126)
            {
                chr = charmap_high[i - 0x7F];
            }
            else if(i < 32)
            {
                chr = charmap_low[i];
            }
            else
            {
                chr = i;
            }
            charmap_default.push(String.fromCharCode(chr));
        }

        // setup text mode cursor DOM element
        cursor_element.classList.add("cursor");
        cursor_element.style.position = "absolute";
        cursor_element.style.backgroundColor = "#ccc";
        cursor_element.style.width = "7px";
        cursor_element.style.display = "inline-block";

        // initialize display mode and size to 80x25 text with 9x16 font
        this.set_mode(false);
        this.set_size_text(80, 25);
        if(mode === MODE_GRAPHICAL_TEXT)
        {
            this.set_size_graphical(720, 400, 720, 400);
        }

        // initialize CSS scaling
        this.set_scale(scale_x, scale_y);

        this.timer();
    };

    this.make_screenshot = function()
    {
        const image = new Image();

        if(mode === MODE_GRAPHICAL || mode === MODE_GRAPHICAL_TEXT)
        {
            image.src = graphic_screen.toDataURL("image/png");
        }
        else
        {
            // Default 720x400, but can be [8, 16] at 640x400
            const char_size = [9, 16];

            const canvas = document.createElement("canvas");
            canvas.width = text_mode_width * char_size[0];
            canvas.height = text_mode_height * char_size[1];
            const context = canvas.getContext("2d");
            context.imageSmoothingEnabled = false;
            context.font = window.getComputedStyle(text_screen).font;
            context.textBaseline = "top";

            for(let y = 0; y < text_mode_height; y++)
            {
                for(let x = 0; x < text_mode_width; x++)
                {
                    const index = (y * text_mode_width + x) * TEXT_BUF_COMPONENT_SIZE;
                    const character = text_mode_data[index + CHARACTER_INDEX];
                    const bg_color = text_mode_data[index + BG_COLOR_INDEX];
                    const fg_color = text_mode_data[index + FG_COLOR_INDEX];

                    context.fillStyle = number_as_color(bg_color);
                    context.fillRect(x * char_size[0], y * char_size[1], char_size[0], char_size[1]);
                    context.fillStyle = number_as_color(fg_color);
                    context.fillText(charmap[character], x * char_size[0], y * char_size[1]);
                }
            }

            if(cursor_element.style.display !== "none" && cursor_row < text_mode_height && cursor_col < text_mode_width)
            {
                context.fillStyle = cursor_element.style.backgroundColor;
                context.fillRect(
                    cursor_col * char_size[0],
                    cursor_row * char_size[1] + parseInt(cursor_element.style.marginTop, 10),
                    parseInt(cursor_element.style.width, 10),
                    parseInt(cursor_element.style.height, 10)
                );
            }

            image.src = canvas.toDataURL("image/png");
        }
        return image;
    };

    this.put_char = function(row, col, chr, flags, bg_color, fg_color)
    {
        dbg_assert(row >= 0 && row < text_mode_height);
        dbg_assert(col >= 0 && col < text_mode_width);
        dbg_assert(chr >= 0 && chr < 0x100);

        const p = TEXT_BUF_COMPONENT_SIZE * (row * text_mode_width + col);

        text_mode_data[p + CHARACTER_INDEX] = chr;
        text_mode_data[p + FLAGS_INDEX] = flags;
        text_mode_data[p + BG_COLOR_INDEX] = bg_color;
        text_mode_data[p + FG_COLOR_INDEX] = fg_color;

        changed_rows[row] = 1;
    };

    this.timer = function()
    {
        timer_id = requestAnimationFrame(() => this.update_screen());
    };

    this.update_screen = function()
    {
        if(!paused)
        {
            if(mode === MODE_TEXT)
            {
                this.update_text();
            }
            else if(mode === MODE_GRAPHICAL)
            {
                this.update_graphical();
            }
            else
            {
                this.update_graphical_text();
            }
        }
        this.timer();
    };

    this.update_text = function()
    {
        for(var i = 0; i < text_mode_height; i++)
        {
            if(changed_rows[i])
            {
                this.text_update_row(i);
                changed_rows[i] = 0;
            }
        }
    };

    this.update_graphical = function()
    {
        this.screen_fill_buffer();
    };

    this.update_graphical_text = function()
    {
        if(offscreen_context)
        {
            // toggle cursor and blinking character visibility at a frequency of ~3.75hz
            const tm_now = performance.now();
            if(tm_now - tm_last_update > 266)
            {
                blink_visible = !blink_visible;
                if(cursor_enabled)
                {
                    changed_rows[cursor_row] = 1;
                }
                mark_blinking_rows_dirty();
                tm_last_update = tm_now;
            }
            // copy to DOM canvas only if anything new was rendered
            if(render_changed_rows())
            {
                graphic_context.drawImage(offscreen_context.canvas, 0, 0);
            }
        }
    };

    this.destroy = function()
    {
        if(timer_id)
        {
            cancelAnimationFrame(timer_id);
            timer_id = 0;
        }
    };

    this.pause = function()
    {
        paused = true;
        cursor_element.classList.remove("blinking-cursor");
    };

    this.continue = function()
    {
        paused = false;
        cursor_element.classList.add("blinking-cursor");
    };

    this.set_mode = function(graphical)
    {
        mode = graphical ? MODE_GRAPHICAL : (options.use_graphical_text ? MODE_GRAPHICAL_TEXT : MODE_TEXT);

        if(mode === MODE_TEXT)
        {
            text_screen.style.display = "block";
            graphic_screen.style.display = "none";
        }
        else
        {
            text_screen.style.display = "none";
            graphic_screen.style.display = "block";

            if(mode === MODE_GRAPHICAL_TEXT && changed_rows)
            {
                changed_rows.fill(1);
            }
        }
    };

    this.set_font_bitmap = function(height, width_9px, width_dbl, copy_8th_col, vga_bitmap, vga_bitmap_changed)
    {
        const width = width_dbl ? 16 : (width_9px ? 9 : 8);
        if(font_height !== height || font_width !== width || font_width_9px !== width_9px ||
            font_width_dbl !== width_dbl || font_copy_8th_col !== copy_8th_col ||
            vga_bitmap_changed)
        {
            const size_changed = font_width !== width || font_height !== height;
            font_height = height;
            font_width = width;
            font_width_9px = width_9px;
            font_width_dbl = width_dbl;
            font_copy_8th_col = copy_8th_col;
            if(mode === MODE_GRAPHICAL_TEXT)
            {
                render_font_bitmap(vga_bitmap);
                changed_rows.fill(1);
                if(size_changed)
                {
                    this.set_size_graphical_text();
                }
            }
        }
    };

    this.set_font_page = function(page_a, page_b)
    {
        if(font_page_a !== page_a || font_page_b !== page_b)
        {
            font_page_a = page_a;
            font_page_b = page_b;
            changed_rows.fill(1);
        }
    };

    this.clear_screen = function()
    {
        graphic_context.fillStyle = "#000";
        graphic_context.fillRect(0, 0, graphic_screen.width, graphic_screen.height);
    };

    this.set_size_graphical_text = function()
    {
        if(!font_context)
        {
            return;
        }

        const gfx_width = font_width * text_mode_width;
        const gfx_height = font_height * text_mode_height;
        const offscreen_extra_height = font_height * 2;

        if(!offscreen_context || offscreen_context.canvas.width !== gfx_width ||
            offscreen_context.canvas.height !== gfx_height ||
            offscreen_extra_context.canvas.height !== offscreen_extra_height)
        {
            // resize offscreen canvases
            if(!offscreen_context)
            {
                const offscreen_canvas = new OffscreenCanvas(gfx_width, gfx_height);
                offscreen_context = offscreen_canvas.getContext("2d", { alpha: false });
                const offscreen_extra_canvas = new OffscreenCanvas(gfx_width, offscreen_extra_height);
                offscreen_extra_context = offscreen_extra_canvas.getContext("2d");
            }
            else
            {
                offscreen_context.canvas.width = gfx_width;
                offscreen_context.canvas.height = gfx_height;
                offscreen_extra_context.canvas.width = gfx_width;
                offscreen_extra_context.canvas.height = offscreen_extra_height;
            }

            // resize DOM canvas graphic_screen
            this.set_size_graphical(gfx_width, gfx_height, gfx_width, gfx_height);

            changed_rows.fill(1);
        }
    };

    /**
     * @param {number} cols
     * @param {number} rows
     */
    this.set_size_text = function(cols, rows)
    {
        if(cols === text_mode_width && rows === text_mode_height)
        {
            return;
        }

        changed_rows = new Int8Array(rows);
        text_mode_data = new Int32Array(cols * rows * TEXT_BUF_COMPONENT_SIZE);

        text_mode_width = cols;
        text_mode_height = rows;

        if(mode === MODE_TEXT)
        {
            while(text_screen.childNodes.length > rows)
            {
                text_screen.removeChild(text_screen.firstChild);
            }

            while(text_screen.childNodes.length < rows)
            {
                text_screen.appendChild(document.createElement("div"));
            }

            for(var i = 0; i < rows; i++)
            {
                this.text_update_row(i);
            }

            update_scale_text();
        }
        else if(mode === MODE_GRAPHICAL_TEXT)
        {
            this.set_size_graphical_text();
        }
    };

    this.set_size_graphical = function(width, height, buffer_width, buffer_height)
    {
        if(DEBUG_SCREEN_LAYERS)
        {
            // Draw the entire buffer. Useful for debugging
            // panning / page flipping / screen splitting code for both
            // v86 developers and os developers
            width = buffer_width;
            height = buffer_height;
        }

        graphic_screen.style.display = "block";

        graphic_screen.width = width;
        graphic_screen.height = height;

        // graphic_context must be reconfigured whenever its graphic_screen is resized
        graphic_context.imageSmoothingEnabled = false;

        // add some scaling to tiny resolutions
        if(width <= 640 &&
            width * 2 < window.innerWidth * window.devicePixelRatio &&
            height * 2 < window.innerHeight * window.devicePixelRatio)
        {
            base_scale = 2;
        }
        else
        {
            base_scale = 1;
        }

        update_scale_graphic();
    };

    this.set_charmap = function(text_charmap)
    {
        charmap = text_charmap || charmap_default;
    };

    this.set_scale = function(s_x, s_y)
    {
        scale_x = s_x;
        scale_y = s_y;

        update_scale_text();
        update_scale_graphic();
    };

    function update_scale_text()
    {
        elem_set_scale(text_screen, scale_x, scale_y, true);
    }

    function update_scale_graphic()
    {
        elem_set_scale(graphic_screen, scale_x * base_scale, scale_y * base_scale, false);
    }

    function elem_set_scale(elem, scale_x, scale_y, use_scale)
    {
        if(!scale_x || !scale_y)
        {
            return;
        }

        elem.style.width = "";
        elem.style.height = "";

        if(use_scale)
        {
            elem.style.transform = "";
        }

        var rectangle = elem.getBoundingClientRect();

        if(use_scale)
        {
            var scale_str = "";

            scale_str += scale_x === 1 ? "" : " scaleX(" + scale_x + ")";
            scale_str += scale_y === 1 ? "" : " scaleY(" + scale_y + ")";

            elem.style.transform = scale_str;
        }
        else
        {
            // unblur non-fractional scales
            if(scale_x % 1 === 0 && scale_y % 1 === 0)
            {
                graphic_screen.style["imageRendering"] = "crisp-edges"; // firefox
                graphic_screen.style["imageRendering"] = "pixelated";
                graphic_screen.style["-ms-interpolation-mode"] = "nearest-neighbor";
            }
            else
            {
                graphic_screen.style["imageRendering"] = "";
                graphic_screen.style["-ms-interpolation-mode"] = "";
            }

            // undo fractional css-to-device pixel ratios
            var device_pixel_ratio = window.devicePixelRatio || 1;
            if(device_pixel_ratio % 1 !== 0)
            {
                scale_x /= device_pixel_ratio;
                scale_y /= device_pixel_ratio;
            }
        }

        if(scale_x !== 1)
        {
            elem.style.width = rectangle.width * scale_x + "px";
        }
        if(scale_y !== 1)
        {
            elem.style.height = rectangle.height * scale_y + "px";
        }
    }

    this.update_cursor_scanline = function(start, end, enabled)
    {
        if(start !== cursor_start || end !== cursor_end || enabled !== cursor_enabled)
        {
            if(mode === MODE_TEXT)
            {
                if(enabled)
                {
                    cursor_element.style.display = "inline";
                    cursor_element.style.height = (end - start) + "px";
                    cursor_element.style.marginTop = start + "px";
                }
                else
                {
                    cursor_element.style.display = "none";
                }
            }
            else if(mode === MODE_GRAPHICAL_TEXT)
            {
                if(cursor_row < text_mode_height)
                {
                    changed_rows[cursor_row] = 1;
                }
            }

            cursor_start = start;
            cursor_end = end;
            cursor_enabled = enabled;
        }
    };

    this.update_cursor = function(row, col)
    {
        if(row !== cursor_row || col !== cursor_col)
        {
            if(row < text_mode_height)
            {
                changed_rows[row] = 1;
            }
            if(cursor_row < text_mode_height)
            {
                changed_rows[cursor_row] = 1;
            }

            cursor_row = row;
            cursor_col = col;
        }
    };

    this.text_update_row = function(row)
    {
        var offset = TEXT_BUF_COMPONENT_SIZE * row * text_mode_width,
            row_element,
            color_element,
            fragment;

        var blinking,
            bg_color,
            fg_color,
            text;

        row_element = text_screen.childNodes[row];
        fragment = document.createElement("div");

        for(var i = 0; i < text_mode_width; )
        {
            color_element = document.createElement("span");

            blinking = text_mode_data[offset + FLAGS_INDEX] & FLAG_BLINKING;
            bg_color = text_mode_data[offset + BG_COLOR_INDEX];
            fg_color = text_mode_data[offset + FG_COLOR_INDEX];

            if(blinking)
            {
                color_element.classList.add("blink");
            }

            color_element.style.backgroundColor = number_as_color(bg_color);
            color_element.style.color = number_as_color(fg_color);

            text = "";

            // put characters of the same color in one element
            while(i < text_mode_width &&
                (text_mode_data[offset + FLAGS_INDEX] & FLAG_BLINKING) === blinking &&
                text_mode_data[offset + BG_COLOR_INDEX] === bg_color &&
                text_mode_data[offset + FG_COLOR_INDEX] === fg_color)
            {
                var ascii = text_mode_data[offset + CHARACTER_INDEX];

                text += charmap[ascii];
                dbg_assert(charmap[ascii]);

                i++;
                offset += TEXT_BUF_COMPONENT_SIZE;

                if(row === cursor_row)
                {
                    if(i === cursor_col)
                    {
                        // next row will be cursor
                        // create new element
                        break;
                    }
                    else if(i === cursor_col + 1)
                    {
                        // found the cursor
                        cursor_element.style.backgroundColor = color_element.style.color;
                        fragment.appendChild(cursor_element);
                        break;
                    }
                }
            }

            color_element.textContent = text;
            fragment.appendChild(color_element);
        }

        row_element.parentNode.replaceChild(fragment, row_element);
    };

    this.update_buffer = function(layers)
    {
        if(DEBUG_SCREEN_LAYERS)
        {
            // For each visible layer that would've been drawn, draw a
            // rectangle to visualise the layer instead.
            graphic_context.strokeStyle = "#0F0";
            graphic_context.lineWidth = 4;
            for(const layer of layers)
            {
                graphic_context.strokeRect(
                    layer.buffer_x,
                    layer.buffer_y,
                    layer.buffer_width,
                    layer.buffer_height
                );
            }
            graphic_context.lineWidth = 1;
            return;
        }

        for(const layer of layers)
        {
            graphic_context.putImageData(
                layer.image_data,
                layer.screen_x - layer.buffer_x,
                layer.screen_y - layer.buffer_y,
                layer.buffer_x,
                layer.buffer_y,
                layer.buffer_width,
                layer.buffer_height
            );
        }
    };

    // XXX: duplicated in DummyScreenAdapter
    this.get_text_screen = function()
    {
        var screen = [];

        for(var i = 0; i < text_mode_height; i++)
        {
            screen.push(this.get_text_row(i));
        }

        return screen;
    };

    this.get_text_row = function(y)
    {
        let result = "";

        for(let x = 0; x < text_mode_width; x++)
        {
            const index = (y * text_mode_width + x) * TEXT_BUF_COMPONENT_SIZE;
            const character = text_mode_data[index + CHARACTER_INDEX];
            result += charmap[character];
        }

        return result;
    };

    this.init();
}


// ---- File: src/browser/dummy_screen.js ----


/**
 * @constructor
 */
function DummyScreenAdapter()
{
    var
        graphic_image_data,

        /** @type {number} */
        cursor_row = 0,

        /** @type {number} */
        cursor_col = 0,

        graphical_mode_width = 0,
        graphical_mode_height = 0,

        // are we in graphical mode now?
        is_graphical = false,

        // Index 0: ASCII code
        // Index 1: Blinking
        // Index 2: Background color
        // Index 3: Foreground color
        text_mode_data,

        // number of columns
        text_mode_width = 0,

        // number of rows
        text_mode_height = 0;

    this.put_char = function(row, col, chr, blinking, bg_color, fg_color)
    {
        dbg_assert(row >= 0 && row < text_mode_height);
        dbg_assert(col >= 0 && col < text_mode_width);
        text_mode_data[row * text_mode_width + col] = chr;
    };

    this.destroy = function() {};
    this.pause = function() {};
    this.continue = function() {};

    this.set_mode = function(graphical)
    {
        is_graphical = graphical;
    };

    this.set_font_bitmap = function(height, width_9px, width_dbl, copy_8th_col, bitmap, bitmap_changed)
    {
    };

    this.set_font_page = function(page_a, page_b)
    {
    };

    this.clear_screen = function()
    {
    };

    /**
     * @param {number} cols
     * @param {number} rows
     */
    this.set_size_text = function(cols, rows)
    {
        if(cols === text_mode_width && rows === text_mode_height)
        {
            return;
        }

        text_mode_data = new Uint8Array(cols * rows);
        text_mode_width = cols;
        text_mode_height = rows;
    };

    this.set_size_graphical = function(width, height)
    {
        graphical_mode_width = width;
        graphical_mode_height = height;
    };

    this.set_scale = function(s_x, s_y)
    {
    };

    this.update_cursor_scanline = function(start, end, max)
    {
    };

    this.update_cursor = function(row, col)
    {
        cursor_row = row;
        cursor_col = col;
    };

    this.update_buffer = function(layers)
    {
    };

    this.get_text_screen = function()
    {
        var screen = [];

        for(var i = 0; i < text_mode_height; i++)
        {
            screen.push(this.get_text_row(i));
        }

        return screen;
    };

    this.get_text_row = function(i)
    {
        const offset = i * text_mode_width;
        return String.fromCharCode.apply(String, text_mode_data.subarray(offset, offset + text_mode_width));
    };

    this.set_size_text(80, 25);
}


// ---- File: src/vga.js ----




// For Types Only






// Always 64k
const VGA_BANK_SIZE = 64 * 1024;

const MAX_XRES = 2560;
const MAX_YRES = 1600;
const MAX_BPP = 32;

//const VGA_LFB_ADDRESS = 0xFE000000; // set by seabios
const VGA_LFB_ADDRESS = 0xE0000000;

/**
 * Equals the maximum number of pixels for non svga.
 * 8 pixels per byte.
 */
const VGA_PIXEL_BUFFER_SIZE = 8 * VGA_BANK_SIZE;

const VGA_MIN_MEMORY_SIZE = 4 * VGA_BANK_SIZE;

/**
 * Avoid wrapping past VGA_LFB_ADDRESS
 */
const VGA_MAX_MEMORY_SIZE = 256 * 1024 * 1024;

/**
 * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#06}
 */
const VGA_HOST_MEMORY_SPACE_START = Uint32Array.from([
    0xA0000,
    0xA0000,
    0xB0000,
    0xB8000,
]);

/**
 * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#06}
 */
const VGA_HOST_MEMORY_SPACE_SIZE = Uint32Array.from([
    0x20000, // 128K
    0x10000, // 64K
    0x8000, // 32K
    0x8000, // 32K
]);

/**
 * @constructor
 * @param {CPU} cpu
 * @param {BusConnector} bus
 * @param {ScreenAdapter|DummyScreenAdapter} screen
 * @param {number} vga_memory_size
 */
function VGAScreen(cpu, bus, screen, vga_memory_size)
{
    this.cpu = cpu;

    /** @const */
    this.bus = bus;

    /** @const */
    this.screen = screen;

    this.vga_memory_size = vga_memory_size;

    /** @type {number} */
    this.cursor_address = 0;

    /** @type {number} */
    this.cursor_scanline_start = 0xE;

    /** @type {number} */
    this.cursor_scanline_end = 0xF;

    /**
     * Number of columns in text mode
     * @type {number}
     */
    this.max_cols = 80;

    /**
     * Number of rows in text mode
     * @type {number}
     */
    this.max_rows = 25;

    /**
     * Width in pixels in graphical mode
     * @type {number}
     */
    this.screen_width = 0;

    /**
     * Height in pixels in graphical mode
     * @type {number}
     */
    this.screen_height = 0;

    /**
     * Logical width in pixels of virtual buffer available for panning
     * @type {number}
     */
    this.virtual_width = 0;

    /**
     * Logical height in pixels of virtual buffer available for panning
     * @type {number}
     */
    this.virtual_height = 0;

    /**
     * The rectangular fragments of the image buffer, and their destination
     * locations, to be drawn every screen_fill_buffer during VGA modes.
     * @type {Array<Object<string, number>>}
     */
    this.layers = [];

    /**
     * video memory start address
     * @type {number}
     */
    this.start_address = 0;

    /**
     * Start address - a copy of start_address that only gets updated
     * during VSync, used for panning and page flipping
     * @type {number}
     */
    this.start_address_latched = 0;

    /**
     * Unimplemented CRTC registers go here
     */
    this.crtc = new Uint8Array(0x19);

    // Implemented CRTC registers:

    /** @type {number} */
    this.crtc_mode = 0;

    /** @type {number} */
    this.horizontal_display_enable_end = 0;

    /** @type {number} */
    this.horizontal_blank_start = 0;

    /** @type {number} */
    this.vertical_display_enable_end = 0;

    /** @type {number} */
    this.vertical_blank_start = 0;

    /** @type {number} */
    this.underline_location_register = 0;

    /** @type {number} */
    this.preset_row_scan = 0;

    /** @type {number} */
    this.offset_register = 0;

    /** @type {number} */
    this.line_compare = 0;

    // End of CRTC registers

    /** @type {boolean} */
    this.graphical_mode = false;

    /*
     * VGA palette containing 256 colors for video mode 13, svga 8bpp, etc.
     * Needs to be initialised by the BIOS
     */
    this.vga256_palette = new Int32Array(256);

    /**
     * VGA read latches
     * @type{number}
     */
    this.latch_dword = 0;

    /** @type {number} */
    this.svga_version = 0xB0C5;

    /** @type {number} */
    this.svga_width = 0;

    /** @type {number} */
    this.svga_height = 0;

    this.svga_enabled = false;

    /** @type {number} */
    this.svga_bpp = 32;

    /** @type {number} */
    this.svga_bank_offset = 0;

    /**
     * The video buffer offset created by VBE_DISPI_INDEX_Y_OFFSET
     * In bytes
     * @type {number}
     */
    this.svga_offset = 0;
    this.svga_offset_x = 0;
    this.svga_offset_y = 0;

    if(this.vga_memory_size === undefined || this.vga_memory_size < VGA_MIN_MEMORY_SIZE)
    {
        this.vga_memory_size = VGA_MIN_MEMORY_SIZE;
    }
    else if(this.vga_memory_size > VGA_MAX_MEMORY_SIZE)
    {
        this.vga_memory_size = VGA_MAX_MEMORY_SIZE;
    }
    else
    {
        // required for pci code
        this.vga_memory_size = round_up_to_next_power_of_2(this.vga_memory_size);
    }
    dbg_log("effective vga memory size: " + this.vga_memory_size, LOG_VGA);

    const pci_revision = 0; // set to 2 for qemu extended registers

    // Experimental, could probably need some changes
    // 01:00.0 VGA compatible controller: NVIDIA Corporation GT216 [GeForce GT 220] (rev a2)
    this.pci_space = [
        0x34, 0x12, 0x11, 0x11, 0x03, 0x01, 0x00, 0x00, pci_revision, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00,
        0x08, VGA_LFB_ADDRESS >>> 8, VGA_LFB_ADDRESS >>> 16, VGA_LFB_ADDRESS >>> 24,
                                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xbf, 0xfe, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf4, 0x1a, 0x00, 0x11,
        0x00, 0x00, 0xbe, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ];
    this.pci_id = 0x12 << 3;
    this.pci_bars = [
        {
            size: this.vga_memory_size,
        },
    ];

    // TODO: Should be matched with vga bios size and mapping address
    // Seabios config for this device:
    // CONFIG_VGA_PCI=y
    // CONFIG_OVERRIDE_PCI_ID=y
    // CONFIG_VGA_VID=0x10de
    // CONFIG_VGA_DID=0x0a20

    this.pci_rom_size = 0x10000;
    this.pci_rom_address = 0xFEB00000;

    this.name = "vga";

    this.index_crtc = 0;

    // index for setting colors through port 3C9h
    this.dac_color_index_write = 0;
    this.dac_color_index_read = 0;
    this.dac_state = 0;

    this.dac_mask = 0xFF;

    this.dac_map = new Uint8Array(0x10);

    this.attribute_controller_index = -1;
    this.palette_source = 0x20;
    this.attribute_mode = 0;
    this.color_plane_enable = 0;
    this.horizontal_panning = 0;
    this.color_select = 0;

    this.sequencer_index = -1;

    // bitmap of planes 0-3
    this.plane_write_bm = 0xF;
    this.sequencer_memory_mode = 0;
    this.clocking_mode = 0;
    this.graphics_index = -1;
    this.character_map_select = 0;

    this.plane_read = 0; // value 0-3, which plane to read
    this.planar_mode = 0;
    this.planar_rotate_reg = 0;
    this.planar_bitmap = 0xFF;
    this.planar_setreset = 0;
    this.planar_setreset_enable = 0;
    this.miscellaneous_graphics_register = 0;

    this.color_compare = 0;
    this.color_dont_care = 0;

    this.max_scan_line = 0;

    this.miscellaneous_output_register = 0xff;
    this.port_3DA_value = 0xFF;

    this.font_page_ab_enabled = false;

    var io = cpu.io;

    io.register_write(0x3C0, this, this.port3C0_write);
    io.register_read(0x3C0, this, this.port3C0_read, this.port3C0_read16);

    io.register_read(0x3C1, this, this.port3C1_read);
    io.register_write(0x3C2, this, this.port3C2_write);

    io.register_write_consecutive(0x3C4, this, this.port3C4_write, this.port3C5_write);

    io.register_read(0x3C4, this, this.port3C4_read);
    io.register_read(0x3C5, this, this.port3C5_read);

    io.register_write_consecutive(0x3CE, this, this.port3CE_write, this.port3CF_write);

    io.register_read(0x3CE, this, this.port3CE_read);
    io.register_read(0x3CF, this, this.port3CF_read);

    io.register_read(0x3C6, this, this.port3C6_read);
    io.register_write(0x3C6, this, this.port3C6_write);
    io.register_write(0x3C7, this, this.port3C7_write);
    io.register_read(0x3C7, this, this.port3C7_read);
    io.register_write(0x3C8, this, this.port3C8_write);
    io.register_read(0x3C8, this, this.port3C8_read);
    io.register_write(0x3C9, this, this.port3C9_write);
    io.register_read(0x3C9, this, this.port3C9_read);

    io.register_read(0x3CC, this, this.port3CC_read);

    io.register_write(0x3D4, this, this.port3D4_write, this.port3D4_write16);
    io.register_write(0x3D5, this, this.port3D5_write, this.port3D5_write16);

    io.register_read(0x3D4, this, this.port3D4_read);
    io.register_read(0x3D5, this, this.port3D5_read, this.port3D5_read16);

    // use same handlers for monochrome text-mode's alternate port addresses 0x3B4/0x3B5 as for the regular addresses (0x3D4/0x3D5)
    io.register_write(0x3B4, this, this.port3D4_write, this.port3D4_write16);
    io.register_write(0x3B5, this, this.port3D5_write, this.port3D5_write16);

    io.register_read(0x3B4, this, this.port3D4_read);
    io.register_read(0x3B5, this, this.port3D5_read, this.port3D5_read16);

    io.register_read(0x3CA, this, function() { dbg_log("3CA read", LOG_VGA); return 0; });

    // use same handler for monochrome text-mode's alternate port address 0x3BA as for its regular address (0x3DA)
    io.register_read(0x3DA, this, this.port3DA_read);
    io.register_read(0x3BA, this, this.port3DA_read);


    // Bochs VBE Extensions
    // http://wiki.osdev.org/Bochs_VBE_Extensions
    this.dispi_index = -1;
    this.dispi_enable_value = 0;

    io.register_write(0x1CE, this, undefined, this.port1CE_write);

    io.register_write(0x1CF, this, undefined, this.port1CF_write);
    io.register_read(0x1CF, this, undefined, this.port1CF_read);


    const vga_offset = cpu.svga_allocate_memory(this.vga_memory_size) >>> 0;
    this.svga_memory = view(Uint8Array, cpu.wasm_memory, vga_offset, this.vga_memory_size);

    this.diff_addr_min = this.vga_memory_size;
    this.diff_addr_max = 0;
    this.diff_plot_min = this.vga_memory_size;
    this.diff_plot_max = 0;

    this.image_data = null;

    this.vga_memory = new Uint8Array(4 * VGA_BANK_SIZE);
    this.plane0 = new Uint8Array(this.vga_memory.buffer, 0 * VGA_BANK_SIZE, VGA_BANK_SIZE);
    this.plane1 = new Uint8Array(this.vga_memory.buffer, 1 * VGA_BANK_SIZE, VGA_BANK_SIZE);
    this.plane2 = new Uint8Array(this.vga_memory.buffer, 2 * VGA_BANK_SIZE, VGA_BANK_SIZE);
    this.plane3 = new Uint8Array(this.vga_memory.buffer, 3 * VGA_BANK_SIZE, VGA_BANK_SIZE);
    this.pixel_buffer = new Uint8Array(VGA_PIXEL_BUFFER_SIZE);

    io.mmap_register(0xA0000, 0x20000,
        addr => this.vga_memory_read(addr),
        (addr, value) => this.vga_memory_write(addr, value),
    );

    cpu.devices.pci.register_device(this);
}

VGAScreen.prototype.get_state = function()
{
    var state = [];

    state[0] = this.vga_memory_size;
    state[1] = this.cursor_address;
    state[2] = this.cursor_scanline_start;
    state[3] = this.cursor_scanline_end;
    state[4] = this.max_cols;
    state[5] = this.max_rows;
    state[6] = this.vga_memory;
    state[7] = this.dac_state;
    state[8] = this.start_address;
    state[9] = this.graphical_mode;
    state[10] = this.vga256_palette;
    state[11] = this.latch_dword;
    state[12] = this.color_compare;
    state[13] = this.color_dont_care;
    state[14] = this.miscellaneous_graphics_register;
    state[15] = this.svga_width;
    state[16] = this.svga_height;
    state[17] = this.crtc_mode;
    state[18] = this.svga_enabled;
    state[19] = this.svga_bpp;
    state[20] = this.svga_bank_offset;
    state[21] = this.svga_offset;
    state[22] = this.index_crtc;
    state[23] = this.dac_color_index_write;
    state[24] = this.dac_color_index_read;
    state[25] = this.dac_map;
    state[26] = this.sequencer_index;
    state[27] = this.plane_write_bm;
    state[28] = this.sequencer_memory_mode;
    state[29] = this.graphics_index;
    state[30] = this.plane_read;
    state[31] = this.planar_mode;
    state[32] = this.planar_rotate_reg;
    state[33] = this.planar_bitmap;
    state[34] = this.max_scan_line;
    state[35] = this.miscellaneous_output_register;
    state[36] = this.port_3DA_value;
    state[37] = this.dispi_index;
    state[38] = this.dispi_enable_value;
    state[39] = this.svga_memory;
    // this.graphical_mode_is_linear
    state[41] = this.attribute_controller_index;
    state[42] = this.offset_register;
    state[43] = this.planar_setreset;
    state[44] = this.planar_setreset_enable;
    state[45] = this.start_address_latched;
    state[46] = this.crtc;
    state[47] = this.horizontal_display_enable_end;
    state[48] = this.horizontal_blank_start;
    state[49] = this.vertical_display_enable_end;
    state[50] = this.vertical_blank_start;
    state[51] = this.underline_location_register;
    state[52] = this.preset_row_scan;
    state[53] = this.offset_register;
    state[54] = this.palette_source;
    state[55] = this.attribute_mode;
    state[56] = this.color_plane_enable;
    state[57] = this.horizontal_panning;
    state[58] = this.color_select;
    state[59] = this.clocking_mode;
    state[60] = this.line_compare;
    state[61] = this.pixel_buffer;
    state[62] = this.dac_mask;
    state[63] = this.character_map_select;
    state[64] = this.font_page_ab_enabled;

    return state;
};

VGAScreen.prototype.set_state = function(state)
{
    this.vga_memory_size = state[0];
    this.cursor_address = state[1];
    this.cursor_scanline_start = state[2];
    this.cursor_scanline_end = state[3];
    this.max_cols = state[4];
    this.max_rows = state[5];
    state[6] && this.vga_memory.set(state[6]);
    this.dac_state = state[7];
    this.start_address = state[8];
    this.graphical_mode = state[9];
    this.vga256_palette = state[10];
    this.latch_dword = state[11];
    this.color_compare = state[12];
    this.color_dont_care = state[13];
    this.miscellaneous_graphics_register = state[14];
    this.svga_width = state[15];
    this.svga_height = state[16];
    this.crtc_mode = state[17];
    this.svga_enabled = state[18];
    this.svga_bpp = state[19];
    this.svga_bank_offset = state[20];
    this.svga_offset = state[21];
    this.index_crtc = state[22];
    this.dac_color_index_write = state[23];
    this.dac_color_index_read = state[24];
    this.dac_map = state[25];
    this.sequencer_index = state[26];
    this.plane_write_bm = state[27];
    this.sequencer_memory_mode = state[28];
    this.graphics_index = state[29];
    this.plane_read = state[30];
    this.planar_mode = state[31];
    this.planar_rotate_reg = state[32];
    this.planar_bitmap = state[33];
    this.max_scan_line = state[34];
    this.miscellaneous_output_register = state[35];
    this.port_3DA_value = state[36];
    this.dispi_index = state[37];
    this.dispi_enable_value = state[38];
    this.svga_memory.set(state[39]);
    // state[40];
    this.attribute_controller_index = state[41];
    this.offset_register = state[42];
    this.planar_setreset = state[43];
    this.planar_setreset_enable = state[44];
    this.start_address_latched = state[45];
    this.crtc.set(state[46]);
    this.horizontal_display_enable_end = state[47];
    this.horizontal_blank_start = state[48];
    this.vertical_display_enable_end = state[49];
    this.vertical_blank_start = state[50];
    this.underline_location_register = state[51];
    this.preset_row_scan = state[52];
    this.offset_register = state[53];
    this.palette_source = state[54];
    this.attribute_mode = state[55];
    this.color_plane_enable = state[56];
    this.horizontal_panning = state[57];
    this.color_select = state[58];
    this.clocking_mode = state[59];
    this.line_compare = state[60];
    state[61] && this.pixel_buffer.set(state[61]);
    this.dac_mask = state[62] === undefined ? 0xFF : state[62];
    this.character_map_select = state[63] === undefined ? 0 : state[63];
    this.font_page_ab_enabled = state[64] === undefined ? 0 : state[64];

    this.screen.set_mode(this.graphical_mode);

    if(this.graphical_mode)
    {
        // Ensure set_size_graphical will update
        this.screen_width = 0;
        this.screen_height = 0;

        if(this.svga_enabled)
        {
            this.set_size_graphical(this.svga_width, this.svga_height, this.svga_width, this.svga_height, this.svga_bpp);
            this.update_layers();
        }
        else
        {
            this.update_vga_size();
            this.update_layers();
            this.complete_replot();
        }
    }
    else
    {
        this.set_font_bitmap(true);
        this.set_size_text(this.max_cols, this.max_rows);
        this.set_font_page();
        this.update_cursor_scanline();
        this.update_cursor();
    }
    this.complete_redraw();
};

VGAScreen.prototype.vga_memory_read = function(addr)
{
    if(this.svga_enabled)
    {
        // vbe banked mode (accessing svga memory through the regular vga memory range)
        return this.cpu.read8((addr - 0xA0000 | this.svga_bank_offset) + VGA_LFB_ADDRESS | 0);
    }

    var memory_space_select = this.miscellaneous_graphics_register >> 2 & 0x3;
    addr -= VGA_HOST_MEMORY_SPACE_START[memory_space_select];

    // VGA chip only decodes addresses within the selected memory space.
    if(addr < 0 || addr >= VGA_HOST_MEMORY_SPACE_SIZE[memory_space_select])
    {
        dbg_log("vga read outside memory space: addr:" + h(addr), LOG_VGA);
        return 0;
    }

    this.latch_dword = this.plane0[addr];
    this.latch_dword |= this.plane1[addr] << 8;
    this.latch_dword |= this.plane2[addr] << 16;
    this.latch_dword |= this.plane3[addr] << 24;

    if(this.planar_mode & 0x08)
    {
        // read mode 1
        var reading = 0xFF;

        if(this.color_dont_care & 0x1)
        {
            reading &= this.plane0[addr] ^ ~(this.color_compare & 0x1 ? 0xFF : 0x00);
        }
        if(this.color_dont_care & 0x2)
        {
            reading &= this.plane1[addr] ^ ~(this.color_compare & 0x2 ? 0xFF : 0x00);
        }
        if(this.color_dont_care & 0x4)
        {
            reading &= this.plane2[addr] ^ ~(this.color_compare & 0x4 ? 0xFF : 0x00);
        }
        if(this.color_dont_care & 0x8)
        {
            reading &= this.plane3[addr] ^ ~(this.color_compare & 0x8 ? 0xFF : 0x00);
        }

        return reading;
    }
    else
    {
        // read mode 0

        var plane = this.plane_read;
        if(!this.graphical_mode)
        {
            // We store all text data linearly and font data in plane 2.
            // TODO: works well for planes 0 and 2, but what about plane 1?
            plane &= 0x3;
        }
        else if(this.sequencer_memory_mode & 0x8)
        {
            // Chain 4
            plane = addr & 0x3;
            addr &= ~0x3;
        }
        else if(this.planar_mode & 0x10)
        {
            // Odd/Even host read
            plane = addr & 0x1;
            addr &= ~0x1;
        }
        return this.vga_memory[plane << 16 | addr];
    }
};

VGAScreen.prototype.vga_memory_write = function(addr, value)
{
    if(this.svga_enabled)
    {
        // vbe banked mode (accessing svga memory through the regular vga memory range)
        this.cpu.write8((addr - 0xA0000 | this.svga_bank_offset) + VGA_LFB_ADDRESS | 0, value);
        return;
    }

    var memory_space_select = this.miscellaneous_graphics_register >> 2 & 0x3;
    addr -= VGA_HOST_MEMORY_SPACE_START[memory_space_select];

    if(addr < 0 || addr >= VGA_HOST_MEMORY_SPACE_SIZE[memory_space_select])
    {
        dbg_log("vga write outside memory space: addr:" + h(addr) + ", value:" + h(value), LOG_VGA);
        return;
    }

    if(this.graphical_mode)
    {
        this.vga_memory_write_graphical(addr, value);
    }
    else if(!(this.plane_write_bm & 0x3))
    {
        if(this.plane_write_bm & 0x4)
        {
            // write to plane 2 (font-bitmap)
            this.plane2[addr] = value;
        }
    }
    else
    {
        this.vga_memory_write_text_mode(addr, value);
    }
};

VGAScreen.prototype.vga_memory_write_graphical = function(addr, value)
{
    var plane_dword;
    var write_mode = this.planar_mode & 3;
    var bitmask = this.apply_feed(this.planar_bitmap);
    var setreset_dword = this.apply_expand(this.planar_setreset);
    var setreset_enable_dword = this.apply_expand(this.planar_setreset_enable);

    // Write modes - see http://www.osdever.net/FreeVGA/vga/graphreg.htm#05
    switch(write_mode)
    {
        case 0:
            value = this.apply_rotate(value);
            plane_dword = this.apply_feed(value);
            plane_dword = this.apply_setreset(plane_dword, setreset_enable_dword);
            plane_dword = this.apply_logical(plane_dword, this.latch_dword);
            plane_dword = this.apply_bitmask(plane_dword, bitmask);
            break;
        case 1:
            plane_dword = this.latch_dword;
            break;
        case 2:
            plane_dword = this.apply_expand(value);
            plane_dword = this.apply_logical(plane_dword, this.latch_dword);
            plane_dword = this.apply_bitmask(plane_dword, bitmask);
            break;
        case 3:
            value = this.apply_rotate(value);
            bitmask &= this.apply_feed(value);
            plane_dword = setreset_dword;
            plane_dword = this.apply_bitmask(plane_dword, bitmask);
            break;
    }

    var plane_select = 0xF;

    switch(this.sequencer_memory_mode & 0xC)
    {
        // Odd/Even (aka chain 2)
        case 0x0:
            plane_select = 0x5 << (addr & 0x1);
            addr &= ~0x1;
            break;

        // Chain 4
        // Note: FreeVGA may have mistakenly stated that this bit field is
        // for system read only, yet the IBM Open Source Graphics Programmer's
        // Reference Manual explicitly states "both read and write".
        case 0x8:
        case 0xC:
            plane_select = 1 << (addr & 0x3);
            addr &= ~0x3;
            break;
    }

    // Plane masks take precedence
    // See: http://www.osdever.net/FreeVGA/vga/seqreg.htm#02
    plane_select &= this.plane_write_bm;

    if(plane_select & 0x1) this.plane0[addr] = (plane_dword >> 0) & 0xFF;
    if(plane_select & 0x2) this.plane1[addr] = (plane_dword >> 8) & 0xFF;
    if(plane_select & 0x4) this.plane2[addr] = (plane_dword >> 16) & 0xFF;
    if(plane_select & 0x8) this.plane3[addr] = (plane_dword >> 24) & 0xFF;

    var pixel_addr = this.vga_addr_to_pixel(addr);
    this.partial_replot(pixel_addr, pixel_addr + 7);
};

/**
 * Copies data_byte into the four planes, with each plane
 * represented by an 8-bit field inside the dword.
 * @param {number} data_byte
 * @return {number} 32-bit number representing the bytes for each plane.
 */
VGAScreen.prototype.apply_feed = function(data_byte)
{
    var dword = data_byte;
    dword |= data_byte << 8;
    dword |= data_byte << 16;
    dword |= data_byte << 24;
    return dword;
};

/**
 * Expands bits 0 to 3 to ocupy bits 0 to 31. Each
 * bit is expanded to 0xFF if set or 0x00 if clear.
 * @param {number} data_byte
 * @return {number} 32-bit number representing the bytes for each plane.
 */
VGAScreen.prototype.apply_expand = function(data_byte)
{
    var dword = data_byte & 0x1 ? 0xFF : 0x00;
    dword |= (data_byte & 0x2 ? 0xFF : 0x00) << 8;
    dword |= (data_byte & 0x4 ? 0xFF : 0x00) << 16;
    dword |= (data_byte & 0x8 ? 0xFF : 0x00) << 24;
    return dword;
};

/**
 * Planar Write - Barrel Shifter
 * @param {number} data_byte
 * @return {number}
 * @see {@link http://www.phatcode.net/res/224/files/html/ch25/25-01.html#Heading3}
 * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#03}
 */
VGAScreen.prototype.apply_rotate = function(data_byte)
{
    var wrapped = data_byte | (data_byte << 8);
    var count = this.planar_rotate_reg & 0x7;
    var shifted = wrapped >>> count;
    return shifted & 0xFF;
};

/**
 * Planar Write - Set / Reset Circuitry
 * @param {number} data_dword
 * @param {number} enable_dword
 * @return {number}
 * @see {@link http://www.phatcode.net/res/224/files/html/ch25/25-03.html#Heading5}
 * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#00}
 */
VGAScreen.prototype.apply_setreset = function(data_dword, enable_dword)
{
    var setreset_dword = this.apply_expand(this.planar_setreset);
    data_dword |= enable_dword & setreset_dword;
    data_dword &= ~enable_dword | setreset_dword;
    return data_dword;
};

/**
 * Planar Write - ALU Unit
 * @param {number} data_dword
 * @param {number} latch_dword
 * @return {number}
 * @see {@link http://www.phatcode.net/res/224/files/html/ch24/24-01.html#Heading3}
 * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#03}
 */
VGAScreen.prototype.apply_logical = function(data_dword, latch_dword)
{
    switch(this.planar_rotate_reg & 0x18)
    {
        case 0x08:
            return data_dword & latch_dword;
        case 0x10:
            return data_dword | latch_dword;
        case 0x18:
            return data_dword ^ latch_dword;
    }
    return data_dword;
};

/**
 * Planar Write - Bitmask Unit
 * @param {number} data_dword
 * @param {number} bitmask_dword
 * @return {number}
 * @see {@link http://www.phatcode.net/res/224/files/html/ch25/25-01.html#Heading2}
 * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#08}
 */
VGAScreen.prototype.apply_bitmask = function(data_dword, bitmask_dword)
{
    var plane_dword = bitmask_dword & data_dword;
    plane_dword |= ~bitmask_dword & this.latch_dword;
    return plane_dword;
};

VGAScreen.prototype.text_mode_redraw = function()
{
    const split_screen_row = this.scan_line_to_screen_row(this.line_compare);
    const row_offset = Math.max(0, (this.offset_register * 2 - this.max_cols) * 2);
    const blink_enabled = this.attribute_mode & 1 << 3;
    const fg_color_mask = this.font_page_ab_enabled ? 7 : 0xF;
    const bg_color_mask = blink_enabled ? 7 : 0xF;
    const FLAG_BLINKING = this.screen.FLAG_BLINKING;
    const FLAG_FONT_PAGE_B = this.screen.FLAG_FONT_PAGE_B;

    let addr = this.start_address << 1;

    for(let row = 0; row < this.max_rows; row++)
    {
        if(row === split_screen_row)
        {
            addr = 0;
        }

        for(let col = 0; col < this.max_cols; col++)
        {
            const chr = this.vga_memory[addr];
            const color = this.vga_memory[addr | 1];
            const blinking = blink_enabled && (color & 1 << 7);
            const font_page_b = this.font_page_ab_enabled && !(color & 1 << 3);
            const flags = (blinking ? FLAG_BLINKING : 0) | (font_page_b ? FLAG_FONT_PAGE_B : 0);

            this.bus.send("screen-put-char", [row, col, chr]);

            this.screen.put_char(row, col, chr, flags,
                this.vga256_palette[this.dac_mask & this.dac_map[color >> 4 & bg_color_mask]],
                this.vga256_palette[this.dac_mask & this.dac_map[color & fg_color_mask]]);

            addr += 2;
        }

        addr += row_offset;
    }
};

VGAScreen.prototype.vga_memory_write_text_mode = function(addr, value)
{
    this.vga_memory[addr] = value;

    const max_cols = Math.max(this.max_cols, this.offset_register * 2);
    let row;
    let col;

    if((addr >> 1) >= this.start_address)
    {
        const memory_start = (addr >> 1) - this.start_address;
        row = memory_start / max_cols | 0;
        col = memory_start % max_cols;
    }
    else
    {
        const memory_start = addr >> 1;
        row = (memory_start / max_cols | 0) + this.scan_line_to_screen_row(this.line_compare);
        col = memory_start % max_cols;
    }

    dbg_assert(row >= 0 && col >= 0);

    if(col >= this.max_cols || row >= this.max_rows)
    {
        return;
    }

    let chr;
    let color;

    // XXX: Should handle 16 bit write if possible
    if(addr & 1)
    {
        color = value;
        chr = this.vga_memory[addr & ~1];
    }
    else
    {
        chr = value;
        color = this.vga_memory[addr | 1];
    }
    const blink_enabled = this.attribute_mode & 1 << 3;
    const blinking = blink_enabled && (color & 1 << 7);
    const font_page_b = this.font_page_ab_enabled && !(color & 1 << 3);
    const flags = (blinking ? this.screen.FLAG_BLINKING : 0) | (font_page_b ? this.screen.FLAG_FONT_PAGE_B : 0);
    const fg_color_mask = this.font_page_ab_enabled ? 7 : 0xF;
    const bg_color_mask = blink_enabled ? 7 : 0xF;

    this.bus.send("screen-put-char", [row, col, chr]);

    this.screen.put_char(row, col, chr, flags,
        this.vga256_palette[this.dac_mask & this.dac_map[color >> 4 & bg_color_mask]],
        this.vga256_palette[this.dac_mask & this.dac_map[color & fg_color_mask]]);
};

VGAScreen.prototype.update_cursor = function()
{
    const max_cols = Math.max(this.max_cols, this.offset_register * 2);
    let row;
    let col;

    if(this.cursor_address >= this.start_address)
    {
        row = (this.cursor_address - this.start_address) / max_cols | 0;
        col = (this.cursor_address - this.start_address) % max_cols;
    }
    else
    {
        row = (this.cursor_address / max_cols | 0) + this.scan_line_to_screen_row(this.line_compare);
        col = this.cursor_address % max_cols;
    }

    dbg_assert(row >= 0 && col >= 0);

    // NOTE: is allowed to be out of bounds
    this.screen.update_cursor(row, col);
};

VGAScreen.prototype.complete_redraw = function()
{
    dbg_log("complete redraw", LOG_VGA);

    if(this.graphical_mode)
    {
        if(this.svga_enabled)
        {
            this.cpu.svga_mark_dirty();
        }
        else
        {
            this.diff_addr_min = 0;
            this.diff_addr_max = VGA_PIXEL_BUFFER_SIZE;
        }
    }
    else
    {
        this.text_mode_redraw();
    }
};

VGAScreen.prototype.complete_replot = function()
{
    dbg_log("complete replot", LOG_VGA);

    if(!this.graphical_mode || this.svga_enabled)
    {
        return;
    }

    this.diff_plot_min = 0;
    this.diff_plot_max = VGA_PIXEL_BUFFER_SIZE;

    this.complete_redraw();
};

VGAScreen.prototype.partial_redraw = function(min, max)
{
    if(min < this.diff_addr_min) this.diff_addr_min = min;
    if(max > this.diff_addr_max) this.diff_addr_max = max;
};

VGAScreen.prototype.partial_replot = function(min, max)
{
    if(min < this.diff_plot_min) this.diff_plot_min = min;
    if(max > this.diff_plot_max) this.diff_plot_max = max;

    this.partial_redraw(min, max);
};

VGAScreen.prototype.reset_diffs = function()
{
    this.diff_addr_min = this.vga_memory_size;
    this.diff_addr_max = 0;
    this.diff_plot_min = this.vga_memory_size;
    this.diff_plot_max = 0;
};

VGAScreen.prototype.destroy = function()
{

};

VGAScreen.prototype.vga_bytes_per_line = function()
{
    var bytes_per_line = this.offset_register << 2;
    if(this.underline_location_register & 0x40) bytes_per_line <<= 1;
    else if(this.crtc_mode & 0x40) bytes_per_line >>>= 1;
    return bytes_per_line;
};

VGAScreen.prototype.vga_addr_shift_count = function()
{
    // Count in multiples of 0x40 for convenience
    // Left shift 2 for word mode - 2 bytes per dot clock
    var shift_count = 0x80;

    // Left shift 3 for byte mode - 1 byte per dot clock
    shift_count += ~this.underline_location_register & this.crtc_mode & 0x40;

    // Left shift 1 for doubleword mode - 4 bytes per dot clock
    shift_count -= this.underline_location_register & 0x40;

    // But shift one less if PEL width mode - 2 dot clocks per pixel
    shift_count -= this.attribute_mode & 0x40;

    return shift_count >>> 6;
};

VGAScreen.prototype.vga_addr_to_pixel = function(addr)
{
    var shift_count = this.vga_addr_shift_count();

    // Undo effects of substituted bits 13 and 14
    // Assumptions:
    //  - max_scan_line register is set to the values shown below
    //  - Each scan line stays within the offset alignment
    //  - No panning and no page flipping after drawing
    if(~this.crtc_mode & 0x3)
    {
        var pixel_addr = addr - this.start_address;

        // Remove substituted bits
        pixel_addr &= this.crtc_mode << 13 | ~0x6000;

        // Convert to 1 pixel per address
        pixel_addr <<= shift_count;

        // Decompose address
        var row = pixel_addr / this.virtual_width | 0;
        var col = pixel_addr % this.virtual_width;

        switch(this.crtc_mode & 0x3)
        {
            case 0x2:
                // Alternating rows using bit 13
                // Assumes max scan line = 1
                row = row << 1 | (addr >> 13 & 0x1);
                break;
            case 0x1:
                // Alternating rows using bit 14
                // Assumes max scan line = 3
                row = row << 1 | (addr >> 14 & 0x1);
                break;
            case 0x0:
                // Cycling through rows using bit 13 and 14
                // Assumes max scan line = 3
                row = row << 2 | (addr >> 13 & 0x3);
                break;
        }

        // Reassemble address
        return row * this.virtual_width + col + (this.start_address << shift_count);
    }
    else
    {
        // Convert to 1 pixel per address
        return addr << shift_count;
    }
};

VGAScreen.prototype.scan_line_to_screen_row = function(scan_line)
{
    // Double scanning. The clock to the row scan counter is halved
    // so it is not affected by the memory address bit substitutions below
    if(this.max_scan_line & 0x80)
    {
        scan_line >>>= 1;
    }

    // Maximum scan line, aka scan lines per character row
    // This is the number of repeats - 1 for graphic modes
    var repeat_factor = 1 + (this.max_scan_line & 0x1F);
    scan_line = Math.ceil(scan_line / repeat_factor);

    // Odd and Even Row Scan Counter
    // Despite repeated address counter values, because bit 13 of the shifted
    // address is substituted with bit 0 of the row scan counter, a different
    // display buffer address is generated instead of repeated
    // Assumes maximum scan line register is set to 2 or 4.
    // Note: can't assert this as register values may not be fully programmed.
    if(!(this.crtc_mode & 0x1))
    {
        scan_line <<= 1;
    }

    // Undo effects of substituted bit 14
    // Assumes maximum scan line register is set to 2 or 4
    // Note: can't assert this as register values may not be fully programmed.
    // Other maximum scan line register values would result in weird addressing
    // anyway
    if(!(this.crtc_mode & 0x2))
    {
        scan_line <<= 1;
    }

    return scan_line;
};

/**
 * @param {number} cols_count
 * @param {number} rows_count
 */
VGAScreen.prototype.set_size_text = function(cols_count, rows_count)
{
    dbg_assert(!this.graphical_mode);
    this.max_cols = cols_count;
    this.max_rows = rows_count;

    this.screen.set_size_text(cols_count, rows_count);
    this.bus.send("screen-set-size", [cols_count, rows_count, 0]);
};

VGAScreen.prototype.set_size_graphical = function(width, height, virtual_width, virtual_height, bpp)
{
    dbg_assert(this.graphical_mode);

    virtual_width = Math.max(virtual_width, 1);
    virtual_height = Math.max(virtual_height, 1);

    const needs_update =
        this.screen_width !== width ||
        this.screen_height !== height ||
        this.virtual_width !== virtual_width ||
        this.virtual_height !== virtual_height;

    if(needs_update)
    {
        this.screen_width = width;
        this.screen_height = height;
        this.virtual_width = virtual_width;
        this.virtual_height = virtual_height;

        if(typeof ImageData !== "undefined")
        {
            const size = virtual_width * virtual_height;
            const offset = this.cpu.svga_allocate_dest_buffer(size) >>> 0;

            this.dest_buffet_offset = offset;
            this.image_data = new ImageData(new Uint8ClampedArray(this.cpu.wasm_memory.buffer, offset, 4 * size), virtual_width, virtual_height);

            this.cpu.svga_mark_dirty();
        }
        else
        {
            // TODO: nodejs
        }

        this.screen.set_size_graphical(width, height, virtual_width, virtual_height);
        this.bus.send("screen-set-size", [width, height, bpp]);
    }
};

VGAScreen.prototype.update_vga_size = function()
{
    if(this.svga_enabled)
    {
        return;
    }

    var horizontal_characters = Math.min(1 + this.horizontal_display_enable_end,
        this.horizontal_blank_start);
    var vertical_scans = Math.min(1 + this.vertical_display_enable_end,
        this.vertical_blank_start);

    if(!horizontal_characters || !vertical_scans)
    {
        // Don't update if width or height is zero.
        // These happen when registers are not fully configured yet.
        return;
    }

    if(this.graphical_mode)
    {
        var screen_width = horizontal_characters << 3;

        // Offset is half the number of bytes/words/dwords (depending on clocking mode)
        // of display memory that each logical line occupies.
        // However, the number of pixels latched, regardless of addressing mode,
        // should always 8 pixels per character clock (except for 8 bit PEL width, in which
        // case 4 pixels).
        var virtual_width = this.offset_register << 4;

        // Pixel Width / PEL Width / Clock Select
        if(this.attribute_mode & 0x40)
        {
            screen_width >>>= 1;
            virtual_width >>>= 1;
        }

        var screen_height = this.scan_line_to_screen_row(vertical_scans);

        // The virtual buffer height is however many rows of data that can fit.
        // Previously drawn graphics outside of current memory address space can
        // still be drawn by setting start_address. The address at
        // VGA_HOST_MEMORY_SPACE_START[memory_space_select] is mapped to the first
        // byte of the frame buffer. Verified on some hardware.
        // Depended on by: Windows 98 start screen
        var available_bytes = VGA_HOST_MEMORY_SPACE_SIZE[0];

        const bytes_per_line = this.vga_bytes_per_line();
        const virtual_height = bytes_per_line ? Math.ceil(available_bytes / bytes_per_line) : screen_height;

        this.set_size_graphical(screen_width, screen_height, virtual_width, virtual_height, 8);

        this.update_vertical_retrace();
        this.update_layers();
    }
    else
    {
        if(this.max_scan_line & 0x80)
        {
            // Double scanning means that half of those scan lines
            // are just repeats
            vertical_scans >>>= 1;
        }

        var height = vertical_scans / (1 + (this.max_scan_line & 0x1F)) | 0;

        if(horizontal_characters && height)
        {
            this.set_size_text(horizontal_characters, height);
        }
    }
};

VGAScreen.prototype.update_layers = function()
{
    if(!this.graphical_mode)
    {
        this.text_mode_redraw();
    }

    if(this.svga_enabled)
    {
        this.layers = [];
        return;
    }

    if(!this.virtual_width || !this.screen_width)
    {
        // Avoid division by zero
        return;
    }

    if(!this.palette_source || (this.clocking_mode & 0x20))
    {
        // Palette source and screen disable bits = draw nothing
        // See http://www.phatcode.net/res/224/files/html/ch29/29-05.html#Heading6
        // and http://www.osdever.net/FreeVGA/vga/seqreg.htm#01
        this.layers = [];
        this.screen.clear_screen();
        return;
    }

    var start_addr = this.start_address_latched;

    var pixel_panning = this.horizontal_panning;
    if(this.attribute_mode & 0x40)
    {
        pixel_panning >>>= 1;
    }

    var byte_panning = this.preset_row_scan >> 5 & 0x3;
    var pixel_addr_start = this.vga_addr_to_pixel(start_addr + byte_panning);

    var start_buffer_row = pixel_addr_start / this.virtual_width | 0;
    var start_buffer_col = pixel_addr_start % this.virtual_width + pixel_panning;

    var split_screen_row = this.scan_line_to_screen_row(1 + this.line_compare);
    split_screen_row = Math.min(split_screen_row, this.screen_height);

    var split_buffer_height = this.screen_height - split_screen_row;

    this.layers = [];

    for(var x = -start_buffer_col, y = 0; x < this.screen_width; x += this.virtual_width, y++)
    {
        this.layers.push({
            image_data: this.image_data,
            screen_x: x,
            screen_y: 0,
            buffer_x: 0,
            buffer_y: start_buffer_row + y,
            buffer_width: this.virtual_width,
            buffer_height: split_screen_row,
        });
    }

    var start_split_col = 0;
    if(!(this.attribute_mode & 0x20))
    {
        // Pixel panning mode. Allow panning for the lower split screen
        start_split_col = this.vga_addr_to_pixel(byte_panning) + pixel_panning;
    }

    for(var x = -start_split_col, y = 0; x < this.screen_width; x += this.virtual_width, y++)
    {
        this.layers.push({
            image_data: this.image_data,
            screen_x: x,
            screen_y: split_screen_row,
            buffer_x: 0,
            buffer_y: y,
            buffer_width: this.virtual_width,
            buffer_height: split_buffer_height,
        });
    }
};

VGAScreen.prototype.update_vertical_retrace = function()
{
    // Emulate behaviour during VSync/VRetrace
    this.port_3DA_value |= 0x8;
    if(this.start_address_latched !== this.start_address)
    {
        this.start_address_latched = this.start_address;
        this.update_layers();
    }
};

VGAScreen.prototype.update_cursor_scanline = function()
{
    const disabled = this.cursor_scanline_start & 0x20;
    const max = this.max_scan_line & 0x1F;
    const start = Math.min(max, this.cursor_scanline_start & 0x1F);
    const end = Math.min(max, this.cursor_scanline_end & 0x1F);
    const visible = !disabled && start < end;
    this.screen.update_cursor_scanline(start, end, visible);
};

/**
 * Attribute controller register / index write
 * @see {@link http://www.osdever.net/FreeVGA/vga/attrreg.htm}
 * @see {@link http://www.mcamafia.de/pdf/ibm_vgaxga_trm2.pdf} page 89
 * @see {@link https://01.org/sites/default/files/documentation/intel-gfx-prm-osrc-hsw-display_0.pdf} page 48
 */
VGAScreen.prototype.port3C0_write = function(value)
{
    if(this.attribute_controller_index === -1)
    {
        dbg_log("attribute controller index register: " + h(value), LOG_VGA);
        this.attribute_controller_index = value & 0x1F;
        dbg_log("attribute actual index: " + h(this.attribute_controller_index), LOG_VGA);

        if(this.palette_source !== (value & 0x20))
        {
            // A method of blanking the screen.
            // See http://www.phatcode.net/res/224/files/html/ch29/29-05.html#Heading6
            this.palette_source = value & 0x20;
            this.update_layers();
        }
    }
    else
    {
        if(this.attribute_controller_index < 0x10)
        {
            dbg_log("internal palette: " + h(this.attribute_controller_index) + " -> " + h(value), LOG_VGA);
            this.dac_map[this.attribute_controller_index] = value;

            if(!(this.attribute_mode & 0x40))
            {
                this.complete_redraw();
            }
        }
        else
        switch(this.attribute_controller_index)
        {
            case 0x10:
                dbg_log("3C0 / attribute mode control: " + h(value), LOG_VGA);
                if(this.attribute_mode !== value)
                {
                    var previous_mode = this.attribute_mode;
                    this.attribute_mode = value;

                    const is_graphical = (value & 0x1) !== 0;
                    if(!this.svga_enabled && this.graphical_mode !== is_graphical)
                    {
                        this.graphical_mode = is_graphical;
                        this.screen.set_mode(this.graphical_mode);
                    }

                    if((previous_mode ^ value) & 0x40)
                    {
                        // PEL width changed. Pixel Buffer now invalidated
                        this.complete_replot();
                    }

                    this.update_vga_size();

                    // Data stored in image buffer are invalidated
                    this.complete_redraw();

                    this.set_font_bitmap(false);
                }
                break;
            case 0x12:
                dbg_log("3C0 / color plane enable: " + h(value), LOG_VGA);
                if(this.color_plane_enable !== value)
                {
                    this.color_plane_enable = value;

                    // Data stored in image buffer are invalidated
                    this.complete_redraw();
                }
                break;
            case 0x13:
                dbg_log("3C0 / horizontal panning: " + h(value), LOG_VGA);
                if(this.horizontal_panning !== value)
                {
                    this.horizontal_panning = value & 0xF;
                    this.update_layers();
                }
                break;
            case 0x14:
                dbg_log("3C0 / color select: " + h(value), LOG_VGA);
                if(this.color_select !== value)
                {
                    this.color_select = value;

                    // Data stored in image buffer are invalidated
                    this.complete_redraw();
                }
                break;
            default:
                dbg_log("3C0 / attribute controller write " + h(this.attribute_controller_index) + ": " + h(value), LOG_VGA);
        }

        this.attribute_controller_index = -1;
    }
};

VGAScreen.prototype.port3C0_read = function()
{
    dbg_log("3C0 read", LOG_VGA);
    return (this.attribute_controller_index | this.palette_source) & 0xFF;
};

VGAScreen.prototype.port3C0_read16 = function()
{
    dbg_log("3C0 read16", LOG_VGA);
    return this.port3C0_read() | this.port3C1_read() << 8 & 0xFF00;
};

VGAScreen.prototype.port3C1_read = function()
{
    if(this.attribute_controller_index < 0x10)
    {
        dbg_log("3C1 / internal palette read: " + h(this.attribute_controller_index) +
            " -> " + h(this.dac_map[this.attribute_controller_index]), LOG_VGA);
        return this.dac_map[this.attribute_controller_index] & 0xFF;
    }

    switch(this.attribute_controller_index)
    {
        case 0x10:
            dbg_log("3C1 / attribute mode read: " + h(this.attribute_mode), LOG_VGA);
            return this.attribute_mode;
        case 0x12:
            dbg_log("3C1 / color plane enable read: " + h(this.color_plane_enable), LOG_VGA);
            return this.color_plane_enable;
        case 0x13:
            dbg_log("3C1 / horizontal panning read: " + h(this.horizontal_panning), LOG_VGA);
            return this.horizontal_panning;
        case 0x14:
            dbg_log("3C1 / color select read: " + h(this.color_select), LOG_VGA);
            return this.color_select;
        default:
            dbg_log("3C1 / attribute controller read " + h(this.attribute_controller_index), LOG_VGA);
    }
    return 0xFF;

};

VGAScreen.prototype.port3C2_write = function(value)
{
    dbg_log("3C2 / miscellaneous output register = " + h(value), LOG_VGA);
    this.miscellaneous_output_register = value;
};

VGAScreen.prototype.port3C4_write = function(value)
{
    this.sequencer_index = value;
};

VGAScreen.prototype.port3C4_read = function()
{
    return this.sequencer_index;
};

/**
 * Sequencer register writes
 * @see {@link http://www.osdever.net/FreeVGA/vga/seqreg.htm}
 * @see {@link http://www.mcamafia.de/pdf/ibm_vgaxga_trm2.pdf} page 47
 * @see {@link https://01.org/sites/default/files/documentation/intel-gfx-prm-osrc-hsw-display_0.pdf} page 19
 */
VGAScreen.prototype.port3C5_write = function(value)
{
    switch(this.sequencer_index)
    {
        case 0x01:
            dbg_log("clocking mode: " + h(value), LOG_VGA);
            var previous_clocking_mode = this.clocking_mode;
            this.clocking_mode = value;
            if((previous_clocking_mode ^ value) & 0x20)
            {
                // Screen disable bit modified
                this.update_layers();
            }
            this.set_font_bitmap(false);
            break;
        case 0x02:
            dbg_log("plane write mask: " + h(value), LOG_VGA);
            var previous_plane_write_bm = this.plane_write_bm;
            this.plane_write_bm = value;
            if(!this.graphical_mode && previous_plane_write_bm & 0x4 && !(this.plane_write_bm & 0x4))
            {
                // End of font plane 2 write access
                this.set_font_bitmap(true);
            }
            break;
        case 0x03:
            dbg_log("character map select: " + h(value), LOG_VGA);
            var previous_character_map_select = this.character_map_select;
            this.character_map_select = value;
            if(!this.graphical_mode && previous_character_map_select !== value)
            {
                this.set_font_page();
            }
            break;
        case 0x04:
            dbg_log("sequencer memory mode: " + h(value), LOG_VGA);
            this.sequencer_memory_mode = value;
            break;
        default:
            dbg_log("3C5 / sequencer write " + h(this.sequencer_index) + ": " + h(value), LOG_VGA);
    }
};

VGAScreen.prototype.port3C5_read = function()
{
    dbg_log("3C5 / sequencer read " + h(this.sequencer_index), LOG_VGA);

    switch(this.sequencer_index)
    {
        case 0x01:
            return this.clocking_mode;
        case 0x02:
            return this.plane_write_bm;
        case 0x03:
            return this.character_map_select;
        case 0x04:
            return this.sequencer_memory_mode;
        case 0x06:
            return 0x12;
        default:
    }
    return 0;
};

VGAScreen.prototype.port3C6_write = function(data)
{
    if(this.dac_mask !== data)
    {
        this.dac_mask = data;
        this.complete_redraw();
    }
};

VGAScreen.prototype.port3C6_read = function()
{
    return this.dac_mask;
};

VGAScreen.prototype.port3C7_write = function(index)
{
    // index for reading the DAC
    dbg_log("3C7 write: " + h(index), LOG_VGA);
    this.dac_color_index_read = index * 3;
    this.dac_state &= 0x0;
};

VGAScreen.prototype.port3C7_read = function()
{
    // prepared to accept reads or writes
    return this.dac_state;
};

VGAScreen.prototype.port3C8_write = function(index)
{
    this.dac_color_index_write = index * 3;
    this.dac_state |= 0x3;
};

VGAScreen.prototype.port3C8_read = function()
{
    return this.dac_color_index_write / 3 & 0xFF;
};

/**
 * DAC color palette register writes
 * @see {@link http://www.osdever.net/FreeVGA/vga/colorreg.htm}
 * @see {@link http://www.mcamafia.de/pdf/ibm_vgaxga_trm2.pdf} page 104
 * @see {@link https://01.org/sites/default/files/documentation/intel-gfx-prm-osrc-hsw-display_0.pdf} page 57
 */
VGAScreen.prototype.port3C9_write = function(color_byte)
{
    var index = this.dac_color_index_write / 3 | 0,
        offset = this.dac_color_index_write % 3,
        color = this.vga256_palette[index];

    if((this.dispi_enable_value & 0x20) === 0)
    {
        color_byte &= 0x3F;
        const b = color_byte & 1;
        color_byte = color_byte << 2 | b << 1 | b;
    }

    if(offset === 0)
    {
        color = color & ~0xFF0000 | color_byte << 16;
    }
    else if(offset === 1)
    {
        color = color & ~0xFF00 | color_byte << 8;
    }
    else
    {
        color = color & ~0xFF | color_byte;
        dbg_log("dac set color, index=" + h(index) + " value=" + h(color), LOG_VGA);
    }

    if(this.vga256_palette[index] !== color)
    {
        this.vga256_palette[index] = color;
        this.complete_redraw();
    }
    this.dac_color_index_write++;
};

VGAScreen.prototype.port3C9_read = function()
{
    dbg_log("3C9 read", LOG_VGA);

    var index = this.dac_color_index_read / 3 | 0;
    var offset = this.dac_color_index_read % 3;
    var color = this.vga256_palette[index];
    var color8 = color >> (2 - offset) * 8 & 0xFF;

    this.dac_color_index_read++;

    if(this.dispi_enable_value & 0x20)
    {
        return color8;
    }
    else
    {
        return color8 >> 2;
    }
};

VGAScreen.prototype.port3CC_read = function()
{
    dbg_log("3CC read", LOG_VGA);
    return this.miscellaneous_output_register;
};

VGAScreen.prototype.port3CE_write = function(value)
{
    this.graphics_index = value;
};

VGAScreen.prototype.port3CE_read = function()
{
    return this.graphics_index;
};

/**
 * Graphics controller register writes
 * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm}
 * @see {@link http://www.mcamafia.de/pdf/ibm_vgaxga_trm2.pdf} page 78
 * @see {@link https://01.org/sites/default/files/documentation/intel-gfx-prm-osrc-hsw-display_0.pdf} page 29
 */
VGAScreen.prototype.port3CF_write = function(value)
{
    switch(this.graphics_index)
    {
        case 0:
            this.planar_setreset = value;
            dbg_log("plane set/reset: " + h(value), LOG_VGA);
            break;
        case 1:
            this.planar_setreset_enable = value;
            dbg_log("plane set/reset enable: " + h(value), LOG_VGA);
            break;
        case 2:
            this.color_compare = value;
            dbg_log("color compare: " + h(value), LOG_VGA);
            break;
        case 3:
            this.planar_rotate_reg = value;
            dbg_log("plane rotate: " + h(value), LOG_VGA);
            break;
        case 4:
            this.plane_read = value;
            dbg_log("plane read: " + h(value), LOG_VGA);
            break;
        case 5:
            var previous_planar_mode = this.planar_mode;
            this.planar_mode = value;
            dbg_log("planar mode: " + h(value), LOG_VGA);
            if((previous_planar_mode ^ value) & 0x60)
            {
                // Shift mode modified. Pixel buffer invalidated
                this.complete_replot();
            }
            break;
        case 6:
            dbg_log("miscellaneous graphics register: " + h(value), LOG_VGA);
            if(this.miscellaneous_graphics_register !== value)
            {
                this.miscellaneous_graphics_register = value;
                this.update_vga_size();
            }
            break;
        case 7:
            this.color_dont_care = value;
            dbg_log("color don't care: " + h(value), LOG_VGA);
            break;
        case 8:
            this.planar_bitmap = value;
            dbg_log("planar bitmap: " + h(value), LOG_VGA);
            break;
        default:
            dbg_log("3CF / graphics write " + h(this.graphics_index) + ": " + h(value), LOG_VGA);
    }
};

VGAScreen.prototype.port3CF_read = function()
{
    dbg_log("3CF / graphics read " + h(this.graphics_index), LOG_VGA);

    switch(this.graphics_index)
    {
        case 0:
            return this.planar_setreset;
        case 1:
            return this.planar_setreset_enable;
        case 2:
            return this.color_compare;
        case 3:
            return this.planar_rotate_reg;
        case 4:
            return this.plane_read;
        case 5:
            return this.planar_mode;
        case 6:
            return this.miscellaneous_graphics_register;
        case 7:
            return this.color_dont_care;
        case 8:
            return this.planar_bitmap;
        default:
    }
    return 0;
};

VGAScreen.prototype.port3D4_write = function(register)
{
    dbg_log("3D4 / crtc index: " + register, LOG_VGA);
    this.index_crtc = register;
};

VGAScreen.prototype.port3D4_write16 = function(register)
{
    this.port3D4_write(register & 0xFF);
    this.port3D5_write(register >> 8 & 0xFF);
};

VGAScreen.prototype.port3D4_read = function()
{
    dbg_log("3D4 read / crtc index: " + this.index_crtc, LOG_VGA);
    return this.index_crtc;
};

/**
 * CRT controller register writes
 * @see {@link http://www.osdever.net/FreeVGA/vga/crtcreg.htm}
 * @see {@link http://www.mcamafia.de/pdf/ibm_vgaxga_trm2.pdf} page 55
 * @see {@link https://01.org/sites/default/files/documentation/intel-gfx-prm-osrc-hsw-display_0.pdf} page 63
 */
VGAScreen.prototype.port3D5_write = function(value)
{
    switch(this.index_crtc)
    {
        case 0x1:
            dbg_log("3D5 / hdisp enable end write: " + h(value), LOG_VGA);
            if(this.horizontal_display_enable_end !== value)
            {
                this.horizontal_display_enable_end = value;
                this.update_vga_size();
            }
            break;
        case 0x2:
            if(this.horizontal_blank_start !== value)
            {
                this.horizontal_blank_start = value;
                this.update_vga_size();
            }
            break;
        case 0x7:
            dbg_log("3D5 / overflow register write: " + h(value), LOG_VGA);
            var previous_vertical_display_enable_end = this.vertical_display_enable_end;
            this.vertical_display_enable_end &= 0xFF;
            this.vertical_display_enable_end |= (value << 3 & 0x200) | (value << 7 & 0x100);
            if(previous_vertical_display_enable_end !== this.vertical_display_enable_end)
            {
                this.update_vga_size();
            }
            this.line_compare = (this.line_compare & 0x2FF) | (value << 4 & 0x100);

            var previous_vertical_blank_start = this.vertical_blank_start;
            this.vertical_blank_start = (this.vertical_blank_start & 0x2FF) | (value << 5 & 0x100);
            if(previous_vertical_blank_start !== this.vertical_blank_start)
            {
                this.update_vga_size();
            }
            this.update_layers();
            break;
        case 0x8:
            dbg_log("3D5 / preset row scan write: " + h(value), LOG_VGA);
            this.preset_row_scan = value;
            this.update_layers();
            break;
        case 0x9:
            dbg_log("3D5 / max scan line write: " + h(value), LOG_VGA);
            var previous_max_scan_line = this.max_scan_line;
            this.max_scan_line = value;
            this.line_compare = (this.line_compare & 0x1FF) | (value << 3 & 0x200);

            var previous_vertical_blank_start = this.vertical_blank_start;
            this.vertical_blank_start = (this.vertical_blank_start & 0x1FF) | (value << 4 & 0x200);
            if(((previous_max_scan_line ^ this.max_scan_line) & 0x9F) || previous_vertical_blank_start !== this.vertical_blank_start)
            {
                this.update_vga_size();
            }

            this.update_cursor_scanline();
            this.update_layers();

            this.set_font_bitmap(false);
            break;
        case 0xA:
            dbg_log("3D5 / cursor scanline start write: " + h(value), LOG_VGA);
            this.cursor_scanline_start = value;
            this.update_cursor_scanline();
            break;
        case 0xB:
            dbg_log("3D5 / cursor scanline end write: " + h(value), LOG_VGA);
            this.cursor_scanline_end = value;
            this.update_cursor_scanline();
            break;
        case 0xC:
            if((this.start_address >> 8 & 0xFF) !== value)
            {
                this.start_address = this.start_address & 0xff | value << 8;
                this.update_layers();
                if(~this.crtc_mode &  0x3)
                {
                    // Address substitution implementation depends on the
                    // starting row and column, so the pixel buffer is invalidated.
                    this.complete_replot();
                }
            }
            dbg_log("3D5 / start addr hi write: " + h(value) + " -> " + h(this.start_address, 4), LOG_VGA);
            break;
        case 0xD:
            if((this.start_address & 0xFF) !== value)
            {
                this.start_address = this.start_address & 0xff00 | value;
                this.update_layers();
                if(~this.crtc_mode &  0x3)
                {
                    // Address substitution implementation depends on the
                    // starting row and column, so the pixel buffer is invalidated.
                    this.complete_replot();
                }
            }
            dbg_log("3D5 / start addr lo write: " + h(value) + " -> " + h(this.start_address, 4), LOG_VGA);
            break;
        case 0xE:
            dbg_log("3D5 / cursor address hi write: " + h(value), LOG_VGA);
            this.cursor_address = this.cursor_address & 0xFF | value << 8;
            this.update_cursor();
            break;
        case 0xF:
            dbg_log("3D5 / cursor address lo write: " + h(value), LOG_VGA);
            this.cursor_address = this.cursor_address & 0xFF00 | value;
            this.update_cursor();
            break;
        case 0x12:
            dbg_log("3D5 / vdisp enable end write: " + h(value), LOG_VGA);
            if((this.vertical_display_enable_end & 0xFF) !== value)
            {
                this.vertical_display_enable_end = (this.vertical_display_enable_end & 0x300) | value;
                this.update_vga_size();
            }
            break;
        case 0x13:
            dbg_log("3D5 / offset register write: " + h(value), LOG_VGA);
            if(this.offset_register !== value)
            {
                this.offset_register = value;
                this.update_vga_size();

                if(~this.crtc_mode & 0x3)
                {
                    // Address substitution implementation depends on the
                    // virtual width, so the pixel buffer is invalidated.
                    this.complete_replot();
                }
            }
            break;
        case 0x14:
            dbg_log("3D5 / underline location write: " + h(value), LOG_VGA);
            if(this.underline_location_register !== value)
            {
                var previous_underline = this.underline_location_register;

                this.underline_location_register = value;
                this.update_vga_size();

                if((previous_underline ^ value) & 0x40)
                {
                    // Doubleword addressing changed. Pixel buffer invalidated.
                    this.complete_replot();
                }
            }
            break;
        case 0x15:
            dbg_log("3D5 / vertical blank start write: " + h(value), LOG_VGA);
            if((this.vertical_blank_start & 0xFF) !== value)
            {
                this.vertical_blank_start = (this.vertical_blank_start & 0x300) | value;
                this.update_vga_size();
            }
            break;
        case 0x17:
            dbg_log("3D5 / crtc mode write: " + h(value), LOG_VGA);
            if(this.crtc_mode !== value)
            {
                var previous_mode = this.crtc_mode;

                this.crtc_mode = value;
                this.update_vga_size();

                if((previous_mode ^ value) & 0x43)
                {
                    // Word/byte addressing changed or address substitution changed.
                    // Pixel buffer invalidated.
                    this.complete_replot();
                }
            }
            break;
        case 0x18:
            dbg_log("3D5 / line compare write: " + h(value), LOG_VGA);
            this.line_compare = (this.line_compare & 0x300) | value;
            this.update_layers();
            break;
        default:
            if(this.index_crtc < this.crtc.length)
            {
                this.crtc[this.index_crtc] = value;
            }
            dbg_log("3D5 / CRTC write " + h(this.index_crtc) + ": " + h(value), LOG_VGA);
    }

};

VGAScreen.prototype.port3D5_write16 = function(register)
{
    dbg_log("16-bit write to 3D5: " + h(register, 4), LOG_VGA);
    this.port3D5_write(register & 0xFF);
};

VGAScreen.prototype.port3D5_read = function()
{
    dbg_log("3D5 read " + h(this.index_crtc), LOG_VGA);

    switch(this.index_crtc)
    {
        case 0x1:
            return this.horizontal_display_enable_end;
        case 0x2:
            return this.horizontal_blank_start;
        case 0x7:
            return (this.vertical_display_enable_end >> 7 & 0x2) |
                (this.vertical_blank_start >> 5 & 0x8) |
                (this.line_compare >> 4 & 0x10) |
                (this.vertical_display_enable_end >> 3 & 0x40);
        case 0x8:
            return this.preset_row_scan;
        case 0x9:
            return this.max_scan_line;
        case 0xA:
            return this.cursor_scanline_start;
        case 0xB:
            return this.cursor_scanline_end;
        case 0xC:
            return this.start_address & 0xFF;
        case 0xD:
            return this.start_address >> 8;
        case 0xE:
            return this.cursor_address >> 8;
        case 0xF:
            return this.cursor_address & 0xFF;
        case 0x12:
            return this.vertical_display_enable_end & 0xFF;
        case 0x13:
            return this.offset_register;
        case 0x14:
            return this.underline_location_register;
        case 0x15:
            return this.vertical_blank_start & 0xFF;
        case 0x17:
            return this.crtc_mode;
        case 0x18:
            return this.line_compare & 0xFF;
    }

    if(this.index_crtc < this.crtc.length)
    {
        return this.crtc[this.index_crtc];
    }
    else
    {
        return 0;
    }
};

VGAScreen.prototype.port3D5_read16 = function()
{
    dbg_log("Warning: 16-bit read from 3D5", LOG_VGA);
    return this.port3D5_read();
};

VGAScreen.prototype.port3DA_read = function()
{
    dbg_log("3DA read - status 1 and clear attr index", LOG_VGA);

    var value = this.port_3DA_value;

    // Status register, bit 3 set by update_vertical_retrace
    // during screen-fill-buffer
    if(!this.graphical_mode)
    {
        // But screen-fill-buffer may not get triggered in text mode
        // so toggle it manually here
        if(this.port_3DA_value & 1)
        {
            this.port_3DA_value ^= 8;
        }
        this.port_3DA_value ^= 1;
    }
    else
    {
        this.port_3DA_value ^= 1;
        this.port_3DA_value &= 1;
    }
    this.attribute_controller_index = -1;
    return value;
};

VGAScreen.prototype.port1CE_write = function(value)
{
    this.dispi_index = value;
};

VGAScreen.prototype.port1CF_write = function(value)
{
    dbg_log("1CF / dispi write " + h(this.dispi_index) + ": " + h(value), LOG_VGA);

    const was_enabled = this.svga_enabled;

    switch(this.dispi_index)
    {
        case 0:
            if(value >= 0xB0C0 && value <= 0xB0C5)
            {
                this.svga_version = value;
            }
            else
            {
                dbg_log("Invalid version value: " + h(value), LOG_VGA);
            }
            break;
        case 1:
            this.svga_width = value;
            if(this.svga_width > MAX_XRES)
            {
                dbg_log("svga_width reduced from " + this.svga_width + " to " + MAX_XRES, LOG_VGA);
                this.svga_width = MAX_XRES;
            }
            break;
        case 2:
            this.svga_height = value;
            if(this.svga_height > MAX_YRES)
            {
                dbg_log("svga_height reduced from " + this.svga_height + " to " + MAX_YRES, LOG_VGA);
                this.svga_height = MAX_YRES;
            }
            break;
        case 3:
            this.svga_bpp = value;
            break;
        case 4:
            // enable, options
            this.svga_enabled = (value & 1) === 1;
            if(this.svga_enabled && (value & 0x80) === 0)
            {
                this.svga_memory.fill(0);
            }
            this.dispi_enable_value = value;
            break;
        case 5:
            dbg_log("SVGA bank offset: " + h(value << 16), LOG_VGA);
            this.svga_bank_offset = value << 16;
            break;
        case 8:
            // x offset
            dbg_log("SVGA X offset: " + h(value), LOG_VGA);
            if(this.svga_offset_x !== value)
            {
                this.svga_offset_x = value;
                this.svga_offset = this.svga_offset_y * this.svga_width + this.svga_offset_x;
                this.complete_redraw();
            }
            break;
        case 9:
            // y offset
            dbg_log("SVGA Y offset: " + h(value * this.svga_width) + " y=" + h(value), LOG_VGA);
            if(this.svga_offset_y !== value)
            {
                this.svga_offset_y = value;
                this.svga_offset = this.svga_offset_y * this.svga_width + this.svga_offset_x;
                this.complete_redraw();
            }
            break;
        default:
            dbg_log("Unimplemented dispi write index: " + h(this.dispi_index), LOG_VGA);
    }

    if(this.svga_enabled && (!this.svga_width || !this.svga_height))
    {
        dbg_log("SVGA: disabled because of invalid width/height: " + this.svga_width + "x" + this.svga_height, LOG_VGA);
        this.svga_enabled = false;
    }

    dbg_assert(this.svga_bpp !== 4, "unimplemented svga bpp: 4");
    dbg_assert(this.svga_bpp === 4 || this.svga_bpp === 8 ||
               this.svga_bpp === 15 || this.svga_bpp === 16 ||
               this.svga_bpp === 24 || this.svga_bpp === 32,
               "unexpected svga bpp: " + this.svga_bpp);

    if(this.svga_enabled)
    {
        dbg_log("SVGA: enabled, " + this.svga_width + "x" + this.svga_height + "x" + this.svga_bpp, LOG_VGA);
    }
    else
    {
        dbg_log("SVGA: disabled");
    }

    if(this.svga_enabled && !was_enabled)
    {
        this.svga_offset = 0;
        this.svga_offset_x = 0;
        this.svga_offset_y = 0;

        this.graphical_mode = true;
        this.screen.set_mode(this.graphical_mode);
        this.set_size_graphical(this.svga_width, this.svga_height, this.svga_width, this.svga_height, this.svga_bpp);
    }

    if(!this.svga_enabled)
    {
        this.svga_bank_offset = 0;
    }

    this.update_layers();
};

VGAScreen.prototype.port1CF_read = function()
{
    dbg_log("1CF / dispi read " + h(this.dispi_index), LOG_VGA);
    return this.svga_register_read(this.dispi_index);
};

VGAScreen.prototype.svga_register_read = function(n)
{
    switch(n)
    {
        case 0:
            return this.svga_version;
        case 1:
            return this.dispi_enable_value & 2 ? MAX_XRES : this.svga_width;
        case 2:
            return this.dispi_enable_value & 2 ? MAX_YRES : this.svga_height;
        case 3:
            return this.dispi_enable_value & 2 ? MAX_BPP : this.svga_bpp;
        case 4:
            return this.dispi_enable_value;
        case 5:
            return this.svga_bank_offset >>> 16;
        case 6:
            // virtual width
            if(this.screen_width)
            {
                return this.screen_width;
            }
            else
            {
                return 1; // seabios/windows98 divide exception
            }
            break;

        case 8:
            // x offset
            return this.svga_offset_x;
        case 9:
            return this.svga_offset_y;
        case 0x0A:
            // memory size in 64 kilobyte banks
            return this.vga_memory_size / VGA_BANK_SIZE | 0;
        default:
            dbg_log("Unimplemented dispi read index: " + h(this.dispi_index), LOG_VGA);
    }

    return 0xFF;
};

/**
 * Transfers graphics from VGA Planes to the Pixel Buffer
 * VGA Planes represent data stored on actual hardware.
 * Pixel Buffer caches the 4-bit or 8-bit color indices for each pixel.
 */
VGAScreen.prototype.vga_replot = function()
{
    // Round to multiple of 8 towards extreme
    var start = this.diff_plot_min & ~0xF;
    var end = Math.min((this.diff_plot_max | 0xF), VGA_PIXEL_BUFFER_SIZE - 1);

    var addr_shift = this.vga_addr_shift_count();
    var addr_substitution = ~this.crtc_mode & 0x3;

    var shift_mode = this.planar_mode & 0x60;
    var pel_width = this.attribute_mode & 0x40;

    for(var pixel_addr = start; pixel_addr <= end;)
    {
        var addr = pixel_addr >>> addr_shift;
        if(addr_substitution)
        {
            var row = pixel_addr / this.virtual_width | 0;
            var col = pixel_addr - this.virtual_width * row;

            switch(addr_substitution)
            {
                case 0x1:
                    // Alternating rows using bit 13
                    // Assumes max scan line = 1
                    addr = (row & 0x1) << 13;
                    row >>>= 1;
                    break;
                case 0x2:
                    // Alternating rows using bit 14
                    // Assumes max scan line = 3
                    addr = (row & 0x1) << 14;
                    row >>>= 1;
                    break;
                case 0x3:
                    // Cycling through rows using bit 13 and 14
                    // Assumes max scan line = 3
                    addr = (row & 0x3) << 13;
                    row >>>= 2;
                    break;
            }

            addr |= (row * this.virtual_width + col >>> addr_shift) + this.start_address;
        }

        var byte0 = this.plane0[addr];
        var byte1 = this.plane1[addr];
        var byte2 = this.plane2[addr];
        var byte3 = this.plane3[addr];

        var shift_loads = new Uint8Array(8);
        switch(shift_mode)
        {
            // Planar Shift Mode
            // See http://www.osdever.net/FreeVGA/vga/vgaseq.htm
            case 0x00:
                // Shift these, so that the bits for the color are in
                // the correct position in the for loop
                byte0 <<= 0;
                byte1 <<= 1;
                byte2 <<= 2;
                byte3 <<= 3;

                for(var i = 7; i >= 0; i--)
                {
                    shift_loads[7 - i] =
                            byte0 >> i & 1 |
                            byte1 >> i & 2 |
                            byte2 >> i & 4 |
                            byte3 >> i & 8;
                }
                break;

            // Packed Shift Mode, aka Interleaved Shift Mode
            // Video Modes 4h and 5h
            case 0x20:
                shift_loads[0] = (byte0 >> 6 & 0x3) | (byte2 >> 4 & 0xC);
                shift_loads[1] = (byte0 >> 4 & 0x3) | (byte2 >> 2 & 0xC);
                shift_loads[2] = (byte0 >> 2 & 0x3) | (byte2 >> 0 & 0xC);
                shift_loads[3] = (byte0 >> 0 & 0x3) | (byte2 << 2 & 0xC);

                shift_loads[4] = (byte1 >> 6 & 0x3) | (byte3 >> 4 & 0xC);
                shift_loads[5] = (byte1 >> 4 & 0x3) | (byte3 >> 2 & 0xC);
                shift_loads[6] = (byte1 >> 2 & 0x3) | (byte3 >> 0 & 0xC);
                shift_loads[7] = (byte1 >> 0 & 0x3) | (byte3 << 2 & 0xC);
                break;

            // 256-Color Shift Mode
            // Video Modes 13h and unchained 256 color
            case 0x40:
            case 0x60:
                shift_loads[0] = byte0 >> 4 & 0xF;
                shift_loads[1] = byte0 >> 0 & 0xF;
                shift_loads[2] = byte1 >> 4 & 0xF;
                shift_loads[3] = byte1 >> 0 & 0xF;
                shift_loads[4] = byte2 >> 4 & 0xF;
                shift_loads[5] = byte2 >> 0 & 0xF;
                shift_loads[6] = byte3 >> 4 & 0xF;
                shift_loads[7] = byte3 >> 0 & 0xF;
                break;
        }

        if(pel_width)
        {
            // Assemble from two sets of 4 bits.
            for(var i = 0, j = 0; i < 4; i++, pixel_addr++, j += 2)
            {
                this.pixel_buffer[pixel_addr] = (shift_loads[j] << 4) | shift_loads[j + 1];
            }
        }
        else
        {
            for(var i = 0; i < 8; i++, pixel_addr++)
            {
                this.pixel_buffer[pixel_addr] = shift_loads[i];
            }
        }
    }
};

/**
 * Transfers graphics from Pixel Buffer to Destination Image Buffer.
 * The 4-bit/8-bit color indices in the Pixel Buffer are passed through
 * the internal palette (dac_map) and the DAC palette (vga256_palette) to
 * obtain the final 32 bit color that the Canvas API uses.
 */
VGAScreen.prototype.vga_redraw = function()
{
    var start = this.diff_addr_min;
    var end = Math.min(this.diff_addr_max, VGA_PIXEL_BUFFER_SIZE - 1);
    const buffer = new Int32Array(this.cpu.wasm_memory.buffer, this.dest_buffet_offset, this.virtual_width * this.virtual_height);

    var mask = 0xFF;
    var colorset = 0x00;
    if(this.attribute_mode & 0x80)
    {
        // Palette bits 5/4 select
        mask &= 0xCF;
        colorset |= this.color_select << 4 & 0x30;
    }

    if(this.attribute_mode & 0x40)
    {
        // 8 bit mode

        for(var pixel_addr = start; pixel_addr <= end; pixel_addr++)
        {
            var color256 = (this.pixel_buffer[pixel_addr] & mask) | colorset;
            var color = this.vga256_palette[color256];

            buffer[pixel_addr] = color & 0xFF00 | color << 16 | color >> 16 | 0xFF000000;
        }
    }
    else
    {
        // 4 bit mode

        // Palette bits 7/6 select
        mask &= 0x3F;
        colorset |= this.color_select << 4 & 0xC0;

        for(var pixel_addr = start; pixel_addr <= end; pixel_addr++)
        {
            var color16 = this.pixel_buffer[pixel_addr] & this.color_plane_enable;
            var color256 = (this.dac_map[color16] & mask) | colorset;
            var color = this.vga256_palette[color256];

            buffer[pixel_addr] = color & 0xFF00 | color << 16 | color >> 16 | 0xFF000000;
        }
    }
};

VGAScreen.prototype.screen_fill_buffer = function()
{
    if(!this.graphical_mode)
    {
        // text mode
        // Update retrace behaviour anyway - programs waiting for signal before
        // changing to graphical mode
        this.update_vertical_retrace();
        return;
    }

    if(this.image_data.data.byteLength === 0)
    {
        // wasm memory resized
        const buffer = new Uint8ClampedArray(this.cpu.wasm_memory.buffer, this.dest_buffet_offset, 4 * this.virtual_width * this.virtual_height);
        this.image_data = new ImageData(buffer, this.virtual_width, this.virtual_height);
        this.update_layers();
    }

    if(this.svga_enabled)
    {
        let min_y = 0;
        let max_y = this.svga_height;

        if(this.svga_bpp === 8)
        {
            // XXX: Slow, should be ported to rust, but it doesn't have access to vga256_palette
            // XXX: Doesn't take svga_offset into account
            const buffer = new Int32Array(this.cpu.wasm_memory.buffer, this.dest_buffet_offset, this.screen_width * this.screen_height);
            const svga_memory = new Uint8Array(this.cpu.wasm_memory.buffer, this.svga_memory.byteOffset, this.vga_memory_size);

            for(var i = 0; i < buffer.length; i++)
            {
                var color = this.vga256_palette[svga_memory[i]];
                buffer[i] = color & 0xFF00 | color << 16 | color >> 16 | 0xFF000000;
            }
        }
        else
        {
            this.cpu.svga_fill_pixel_buffer(this.svga_bpp, this.svga_offset);

            const bytes_per_pixel = this.svga_bpp === 15 ? 2 : this.svga_bpp / 8;
            min_y = (((this.cpu.svga_dirty_bitmap_min_offset[0] / bytes_per_pixel | 0) - this.svga_offset) / this.svga_width | 0);
            max_y = (((this.cpu.svga_dirty_bitmap_max_offset[0] / bytes_per_pixel | 0) - this.svga_offset) / this.svga_width | 0) + 1;
        }

        if(min_y < max_y)
        {
            min_y = Math.max(min_y, 0);
            max_y = Math.min(max_y, this.svga_height);

            this.screen.update_buffer([{
                image_data: this.image_data,
                screen_x: 0, screen_y: min_y,
                buffer_x: 0, buffer_y: min_y,
                buffer_width: this.svga_width,
                buffer_height: max_y - min_y,
            }]);
        }
    }
    else
    {
        this.vga_replot();
        this.vga_redraw();
        this.screen.update_buffer(this.layers);
    }

    this.reset_diffs();
    this.update_vertical_retrace();
};

VGAScreen.prototype.set_font_bitmap = function(font_plane_dirty)
{
    const height = this.max_scan_line & 0x1f;
    if(height && !this.graphical_mode)
    {
        const width_dbl = !!(this.clocking_mode & 0x08);
        const width_9px = !width_dbl && !(this.clocking_mode & 0x01);
        const copy_8th_col = !!(this.attribute_mode & 0x04);
        this.screen.set_font_bitmap(
            height + 1,         // int height, font height 1..32px
            width_9px,          // bool width_9px, True: font width 9px, else 8px
            width_dbl,          // bool width_dbl, True: font width 16px (overrides width_9px)
            copy_8th_col,       // bool copy_8th_col, True: duplicate 8th into 9th column in ASCII chars 0xC0-0xDF
            this.plane2,        // Uint8Array font_bitmap[64k], static
            font_plane_dirty    // bool bitmap_changed, True: content of this.plane2 has changed
        );
    }
};

VGAScreen.prototype.set_font_page = function()
{
    // bits 2, 3 and 5 (LSB to MSB): VGA font page index of font A
    // bits 0, 1 and 4: VGA font page index of font B
    // linear_index_map[] maps VGA's non-liner font page index to linear index
    const linear_index_map = [0, 2, 4, 6, 1, 3, 5, 7];
    const vga_index_A = ((this.character_map_select & 0b1100) >> 2) | ((this.character_map_select & 0b100000) >> 3);
    const vga_index_B = (this.character_map_select & 0b11) | ((this.character_map_select & 0b10000) >> 2);
    this.font_page_ab_enabled = vga_index_A !== vga_index_B;
    this.screen.set_font_page(linear_index_map[vga_index_A], linear_index_map[vga_index_B]);
    this.complete_redraw();
};


// ---- File: src/virtio_balloon.js ----
// https://docs.oasis-open.org/virtio/virtio/v1.2/csd01/virtio-v1.2-csd01.html#x1-2900003






// For Types Only



const VIRTIO_BALLOON_F_MUST_TELL_HOST = 0;
const VIRTIO_BALLOON_F_STATS_VQ = 1;
const VIRTIO_BALLOON_F_DEFLATE_ON_OOM = 2;
const VIRTIO_BALLOON_F_FREE_PAGE_HINT = 3;

const STAT_NAMES = [
    "SWAP_IN",
    "SWAP_OUT",
    "MAJFLT",
    "MINFLT",
    "MEMFREE",
    "MEMTOT",
    "AVAIL",
    "CACHES",
    "HTLB_PGALLOC",
    "HTLB_PGFAIL",
];

/**
 * @constructor
 * @param {CPU} cpu
 * @param {BusConnector} bus
 */
function VirtioBalloon(cpu, bus)
{
    /** @const @type {BusConnector} */
    this.bus = bus;
    this.num_pages = 0;
    this.actual = 0;
    this.fp_cmd = 0;
    this.zeroed = 0;

    const queues = [
        {size_supported: 32, notify_offset: 0},
        {size_supported: 32, notify_offset: 0},
        {size_supported: 2, notify_offset: 1},
        {size_supported: 64, notify_offset: 2},
    ];

    //setInterval(() => this.GetStats(console.log.bind(console, "STATS")), 10000);

    /** @type {VirtIO} */
    this.virtio = new VirtIO(cpu,
    {
        name: "virtio-balloon",
        pci_id: 0x0B << 3,
        device_id: 0x1045,
        subsystem_device_id: 5,
        common:
        {
            initial_port: 0xD800,
            queues: queues,
            features:
            [
                VIRTIO_BALLOON_F_STATS_VQ,
                VIRTIO_BALLOON_F_FREE_PAGE_HINT,
                VIRTIO_F_VERSION_1,
            ],
            on_driver_ok: () => {
                dbg_log("Balloon setup", LOG_PCI);
            },
        },
        notification:
        {
            initial_port: 0xD900,
            single_handler: false,
            handlers:
            [
                (queue_id) =>
                {
                    const queue = this.virtio.queues[queue_id];
                    while(queue.has_request())
                    {
                        const bufchain = queue.pop_request();
                        const buffer = new Uint8Array(bufchain.length_readable);
                        bufchain.get_next_blob(buffer);
                        this.virtio.queues[queue_id].push_reply(bufchain);
                        let n = buffer.byteLength / 4;
                        this.actual += (queue_id === 0 ? n : -n);
                        //console.log(queue_id === 0 ? "Inflate" : "Deflate", this.num_pages, this.actual, bufchain.read_buffers);
                    }
                    this.virtio.queues[queue_id].flush_replies();
                },
                (queue_id) =>
                {
                    const queue = this.virtio.queues[queue_id];
                    if(queue.has_request())
                    {
                        const bufchain = queue.pop_request();
                        const buffer = new Uint8Array(bufchain.length_readable);
                        bufchain.get_next_blob(buffer);
                        let result = {};
                        for(let i = 0; i < bufchain.length_readable; i += 10) {
                            let [cat, value] = marshall.Unmarshall(["h", "d"], buffer, { offset : i });
                            result[STAT_NAMES[cat]] = value;
                        }
                        this.virtio.queues[queue_id].push_reply(bufchain);
                        if(this.stats_cb) this.stats_cb(result);
                    }
                },
                (queue_id) =>
                {
                    const queue = this.virtio.queues[queue_id];
                    while(queue.has_request())
                    {
                        const bufchain = queue.pop_request();
                        if(bufchain.length_readable > 0) {
                            const buffer = new Uint8Array(bufchain.length_readable);
                            bufchain.get_next_blob(buffer);
                            let [cmd] = marshall.Unmarshall(["w"], buffer, { offset : 0 });
                            if(cmd === 0) {
                                if(this.free_cb) this.free_cb(this.zeroed);
                                if(this.fp_cmd > 1) this.fp_cmd = 1; // Signal done
                                this.virtio.notify_config_changes();
                            }
                        }
                        if(bufchain.length_writable > 0) {
                            // console.log("Free pages hinted", bufchain.read_buffers, bufchain.write_buffers);
                            let zeros = new Uint8Array(0);
                            for(let i = 0; i < bufchain.write_buffers.length; ++i) {
                                let b = bufchain.write_buffers[i];
                                this.zeroed += b.len;
                                this.virtio.cpu.zero_memory(b.addr_low, b.len);
                            }
                        }
                        this.virtio.queues[queue_id].push_reply(bufchain);
                    }
                    this.virtio.queues[queue_id].flush_replies();
                },
            ],
        },
        isr_status:
        {
            initial_port: 0xD700,
        },
        device_specific:
        {
            initial_port: 0xD600,
            struct:
            [
                {
                    bytes: 4,
                    name: "num_pages",
                    read: () => this.num_pages,
                    write: data => { /* read only */ },
                },
                {
                    bytes: 4,
                    name: "actual",
                    read: () => {
                        return this.actual;
                    },
                    write: data => { /* read only */ },
                },
                {
                    bytes: 4,
                    name: "free_page_hint_cmd_id",
                    read: () => this.fp_cmd,
                    write: data => { /* read only */ },
                }
           ]
        },
    });
}

VirtioBalloon.prototype.Inflate = function(amount) {
    this.num_pages += amount;
    this.virtio.notify_config_changes();
};

VirtioBalloon.prototype.Deflate = function(amount) {
    this.num_pages -= amount;
    this.virtio.notify_config_changes();
};

VirtioBalloon.prototype.Cleanup = function(cb) {
    this.fp_cmd = 2;
    this.free_cb = cb;
    this.zeroed = 0;
    this.virtio.notify_config_changes();
};


VirtioBalloon.prototype.get_state = function()
{
    const state = [];
    state[0] = this.virtio;
    state[1] = this.num_pages;
    state[2] = this.actual;
    return state;
};

VirtioBalloon.prototype.set_state = function(state)
{
    this.virtio.set_state(state[0]);
    this.num_pages = state[1];
    this.actual = state[2];
};

VirtioBalloon.prototype.GetStats = function(data)
{
    this.stats_cb = data;
    const queue = this.virtio.queues[2];
    while(queue.has_request())
    {
        const bufchain = queue.pop_request();
        this.virtio.queues[2].push_reply(bufchain);
    }
    this.virtio.queues[2].flush_replies();
};

VirtioBalloon.prototype.Reset = function() {

};


// ---- File: src/browser/filestorage.js ----



/** @interface */
function FileStorageInterface() {}

/**
 * Read a portion of a file.
 * @param {string} sha256sum
 * @param {number} offset
 * @param {number} count
 * @return {!Promise<Uint8Array>} null if file does not exist.
 */
FileStorageInterface.prototype.read = function(sha256sum, offset, count) {};

/**
 * Add a read-only file to the filestorage.
 * @param {string} sha256sum
 * @param {!Uint8Array} data
 * @return {!Promise}
 */
FileStorageInterface.prototype.cache = function(sha256sum, data) {};

/**
 * Call this when the file won't be used soon, e.g. when a file closes or when this immutable
 * version is already out of date. It is used to help prevent accumulation of unused files in
 * memory in the long run for some FileStorage mediums.
 */
FileStorageInterface.prototype.uncache = function(sha256sum) {};

/**
 * @constructor
 * @implements {FileStorageInterface}
 */
function MemoryFileStorage()
{
    /**
     * From sha256sum to file data.
     * @type {Map<string,Uint8Array>}
     */
    this.filedata = new Map();
}

/**
 * @param {string} sha256sum
 * @param {number} offset
 * @param {number} count
 * @return {!Promise<Uint8Array>} null if file does not exist.
 */
MemoryFileStorage.prototype.read = async function(sha256sum, offset, count)
{
    dbg_assert(sha256sum, "MemoryFileStorage read: sha256sum should be a non-empty string");
    const data = this.filedata.get(sha256sum);

    if(!data)
    {
        return null;
    }

    return data.subarray(offset, offset + count);
};

/**
 * @param {string} sha256sum
 * @param {!Uint8Array} data
 */
MemoryFileStorage.prototype.cache = async function(sha256sum, data)
{
    dbg_assert(sha256sum, "MemoryFileStorage cache: sha256sum should be a non-empty string");
    this.filedata.set(sha256sum, data);
};

/**
 * @param {string} sha256sum
 */
MemoryFileStorage.prototype.uncache = function(sha256sum)
{
    this.filedata.delete(sha256sum);
};

/**
 * @constructor
 * @implements {FileStorageInterface}
 * @param {FileStorageInterface} file_storage
 * @param {string} baseurl
 */
function ServerFileStorageWrapper(file_storage, baseurl)
{
    dbg_assert(baseurl, "ServerMemoryFileStorage: baseurl should not be empty");

    if(!baseurl.endsWith("/"))
    {
        baseurl += "/";
    }

    this.storage = file_storage;
    this.baseurl = baseurl;
}

/**
 * @param {string} sha256sum
 * @return {!Promise<Uint8Array>}
 */
ServerFileStorageWrapper.prototype.load_from_server = function(sha256sum)
{
    return new Promise((resolve, reject) =>
    {
        load_file(this.baseurl + sha256sum, { done: async buffer =>
        {
            const data = new Uint8Array(buffer);
            await this.cache(sha256sum, data);
            resolve(data);
        }});
    });
};

/**
 * @param {string} sha256sum
 * @param {number} offset
 * @param {number} count
 * @return {!Promise<Uint8Array>}
 */
ServerFileStorageWrapper.prototype.read = async function(sha256sum, offset, count)
{
    const data = await this.storage.read(sha256sum, offset, count);
    if(!data)
    {
        const full_file = await this.load_from_server(sha256sum);
        return full_file.subarray(offset, offset + count);
    }
    return data;
};

/**
 * @param {string} sha256sum
 * @param {!Uint8Array} data
 */
ServerFileStorageWrapper.prototype.cache = async function(sha256sum, data)
{
    return await this.storage.cache(sha256sum, data);
};

/**
 * @param {string} sha256sum
 */
ServerFileStorageWrapper.prototype.uncache = function(sha256sum)
{
    this.storage.uncache(sha256sum);
};


// ---- File: lib/filesystem.js ----
// -------------------------------------------------
// ----------------- FILESYSTEM---------------------
// -------------------------------------------------
// Implementation of a unix filesystem in memory.









// For Types Only


const S_IRWXUGO = 0x1FF;
const S_IFMT = 0xF000;
const S_IFSOCK = 0xC000;
const S_IFLNK = 0xA000;
const S_IFREG = 0x8000;
const S_IFBLK = 0x6000;
const S_IFDIR = 0x4000;
const S_IFCHR = 0x2000;

//var S_IFIFO  0010000
//var S_ISUID  0004000
//var S_ISGID  0002000
//var S_ISVTX  0001000

var O_RDONLY = 0x0000; // open for reading only
var O_WRONLY = 0x0001; // open for writing only
var O_RDWR = 0x0002; // open for reading and writing
var O_ACCMODE = 0x0003; // mask for above modes

const STATUS_INVALID = -0x1;
const STATUS_OK = 0x0;
const STATUS_ON_STORAGE = 0x2;
const STATUS_UNLINKED = 0x4;
const STATUS_FORWARDING = 0x5;

//const texten = new TextEncoder();

/** @const */ var JSONFS_VERSION = 3;


/** @const */ var JSONFS_IDX_NAME = 0;
/** @const */ var JSONFS_IDX_SIZE = 1;
/** @const */ var JSONFS_IDX_MTIME = 2;
/** @const */ var JSONFS_IDX_MODE = 3;
/** @const */ var JSONFS_IDX_UID = 4;
/** @const */ var JSONFS_IDX_GID = 5;
/** @const */ var JSONFS_IDX_TARGET = 6;
/** @const */ var JSONFS_IDX_SHA256 = 6;


/**
 * @constructor
 * @param {!FileStorageInterface} storage
 * @param {{ last_qidnumber: number }=} qidcounter Another fs's qidcounter to synchronise with.
 */
function FS(storage, qidcounter) {
    /** @type {Array.<!Inode>} */
    this.inodes = [];
    this.events = [];

    this.storage = storage;

    this.qidcounter = qidcounter || { last_qidnumber: 0 };

    //this.tar = new TAR(this);

    this.inodedata = {};

    this.total_size = 256 * 1024 * 1024 * 1024;
    this.used_size = 0;

    /** @type {!Array<!FSMountInfo>} */
    this.mounts = [];

    //RegisterMessage("LoadFilesystem", this.LoadFilesystem.bind(this) );
    //RegisterMessage("MergeFile", this.MergeFile.bind(this) );
    //RegisterMessage("tar",
    //    function(data) {
    //        SendToMaster("tar", this.tar.Pack(data));
    //    }.bind(this)
    //);
    //RegisterMessage("sync",
    //    function(data) {
    //        SendToMaster("sync", this.tar.Pack(data));
    //    }.bind(this)
    //);

    // root entry
    this.CreateDirectory("", -1);
}

FS.prototype.get_state = function()
{
    let state = [];

    state[0] = this.inodes;
    state[1] = this.qidcounter.last_qidnumber;
    state[2] = [];
    for(const [id, data] of Object.entries(this.inodedata))
    {
        if((this.inodes[id].mode & S_IFDIR) === 0)
        {
            state[2].push([id, data]);
        }
    }
    state[3] = this.total_size;
    state[4] = this.used_size;
    state = state.concat(this.mounts);

    return state;
};

FS.prototype.set_state = function(state)
{
    this.inodes = state[0].map(state => { const inode = new Inode(0); inode.set_state(state); return inode; });
    this.qidcounter.last_qidnumber = state[1];
    this.inodedata = {};
    for(let [key, value] of state[2])
    {
        if(value.buffer.byteLength !== value.byteLength)
        {
            // make a copy if we didn't get one
            value = value.slice();
        }

        this.inodedata[key] = value;
    }
    this.total_size = state[3];
    this.used_size = state[4];
    this.mounts = state.slice(5);
};


// -----------------------------------------------------

FS.prototype.AddEvent = function(id, OnEvent) {
    var inode = this.inodes[id];
    if(inode.status === STATUS_OK || inode.status === STATUS_ON_STORAGE) {
        OnEvent();
    }
    else if(this.is_forwarder(inode))
    {
        this.follow_fs(inode).AddEvent(inode.foreign_id, OnEvent);
    }
    else
    {
        this.events.push({id: id, OnEvent: OnEvent});
    }
};

FS.prototype.HandleEvent = function(id) {
    const inode = this.inodes[id];
    if(this.is_forwarder(inode))
    {
        this.follow_fs(inode).HandleEvent(inode.foreign_id);
    }
    //dbg_log("number of events: " + this.events.length, LOG_9P);
    var newevents = [];
    for(var i=0; i<this.events.length; i++) {
        if(this.events[i].id === id) {
            this.events[i].OnEvent();
        } else {
            newevents.push(this.events[i]);
        }
    }
    this.events = newevents;
};

FS.prototype.load_from_json = function(fs)
{
    dbg_assert(fs, "Invalid fs passed to load_from_json");

    if(fs["version"] !== JSONFS_VERSION)
    {
        throw "The filesystem JSON format has changed. " +
              "Please update your fs2json (https://github.com/copy/fs2json) and recreate the filesystem JSON.";
    }

    var fsroot = fs["fsroot"];
    this.used_size = fs["size"];

    for(var i = 0; i < fsroot.length; i++) {
        this.LoadRecursive(fsroot[i], 0);
    }

    //if(DEBUG)
    //{
    //    this.Check();
    //}
};

FS.prototype.LoadRecursive = function(data, parentid)
{
    var inode = this.CreateInode();

    const name = data[JSONFS_IDX_NAME];
    inode.size = data[JSONFS_IDX_SIZE];
    inode.mtime = data[JSONFS_IDX_MTIME];
    inode.ctime = inode.mtime;
    inode.atime = inode.mtime;
    inode.mode = data[JSONFS_IDX_MODE];
    inode.uid = data[JSONFS_IDX_UID];
    inode.gid = data[JSONFS_IDX_GID];

    var ifmt = inode.mode & S_IFMT;

    if(ifmt === S_IFDIR)
    {
        this.PushInode(inode, parentid, name);
        this.LoadDir(this.inodes.length - 1, data[JSONFS_IDX_TARGET]);
    }
    else if(ifmt === S_IFREG)
    {
        inode.status = STATUS_ON_STORAGE;
        inode.sha256sum = data[JSONFS_IDX_SHA256];
        dbg_assert(inode.sha256sum);
        this.PushInode(inode, parentid, name);
    }
    else if(ifmt === S_IFLNK)
    {
        inode.symlink = data[JSONFS_IDX_TARGET];
        this.PushInode(inode, parentid, name);
    }
    else if(ifmt === S_IFSOCK)
    {
        // socket: ignore
    }
    else
    {
        dbg_log("Unexpected ifmt: " + h(ifmt) + " (" + name + ")", LOG_9P);
    }
};

FS.prototype.LoadDir = function(parentid, children)
{
    for(var i = 0; i < children.length; i++) {
        this.LoadRecursive(children[i], parentid);
    }
};


// -----------------------------------------------------

/**
 * @private
 * @param {Inode} inode
 * @return {boolean}
 */
FS.prototype.should_be_linked = function(inode)
{
    // Note: Non-root forwarder inode could still have a non-forwarder parent, so don't use
    // parent inode to check.
    return !this.is_forwarder(inode) || inode.foreign_id === 0;
};

/**
 * @private
 * @param {number} parentid
 * @param {number} idx
 * @param {string} name
 */
FS.prototype.link_under_dir = function(parentid, idx, name)
{
    const inode = this.inodes[idx];
    const parent_inode = this.inodes[parentid];

    dbg_assert(!this.is_forwarder(parent_inode),
        "Filesystem: Shouldn't link under fowarder parents");
    dbg_assert(this.IsDirectory(parentid),
        "Filesystem: Can't link under non-directories");
    dbg_assert(this.should_be_linked(inode),
        "Filesystem: Can't link across filesystems apart from their root");
    dbg_assert(inode.nlinks >= 0,
        "Filesystem: Found negative nlinks value of " + inode.nlinks);
    dbg_assert(!parent_inode.direntries.has(name),
        "Filesystem: Name '" + name + "' is already taken");

    parent_inode.direntries.set(name, idx);
    inode.nlinks++;

    if(this.IsDirectory(idx))
    {
        dbg_assert(!inode.direntries.has(".."),
            "Filesystem: Cannot link a directory twice");

        if(!inode.direntries.has(".")) inode.nlinks++;
        inode.direntries.set(".", idx);

        inode.direntries.set("..", parentid);
        parent_inode.nlinks++;
    }
};

/**
 * @private
 * @param {number} parentid
 * @param {string} name
 */
FS.prototype.unlink_from_dir = function(parentid, name)
{
    const idx = this.Search(parentid, name);
    const inode = this.inodes[idx];
    const parent_inode = this.inodes[parentid];

    dbg_assert(!this.is_forwarder(parent_inode), "Filesystem: Can't unlink from forwarders");
    dbg_assert(this.IsDirectory(parentid), "Filesystem: Can't unlink from non-directories");

    const exists = parent_inode.direntries.delete(name);
    if(!exists)
    {
        dbg_assert(false, "Filesystem: Can't unlink non-existent file: " + name);
        return;
    }

    inode.nlinks--;

    if(this.IsDirectory(idx))
    {
        dbg_assert(inode.direntries.get("..") === parentid,
            "Filesystem: Found directory with bad parent id");

        inode.direntries.delete("..");
        parent_inode.nlinks--;
    }

    dbg_assert(inode.nlinks >= 0,
        "Filesystem: Found negative nlinks value of " + inode.nlinks);
};

FS.prototype.PushInode = function(inode, parentid, name) {
    if(parentid !== -1) {
        this.inodes.push(inode);
        inode.fid = this.inodes.length - 1;
        this.link_under_dir(parentid, inode.fid, name);
        return;
    } else {
        if(this.inodes.length === 0) { // if root directory
            this.inodes.push(inode);
            inode.direntries.set(".", 0);
            inode.direntries.set("..", 0);
            inode.nlinks = 2;
            return;
        }
    }

    dbg_assert(false, "Error in Filesystem: Pushed inode with name = "+ name + " has no parent");
};

/** @constructor */
function Inode(qidnumber)
{
    this.direntries = new Map(); // maps filename to inode id
    this.status = 0;
    this.size = 0x0;
    this.uid = 0x0;
    this.gid = 0x0;
    this.fid = 0;
    this.ctime = 0;
    this.atime = 0;
    this.mtime = 0;
    this.major = 0x0;
    this.minor = 0x0;
    this.symlink = "";
    this.mode = 0x01ED;
    this.qid = {
        type: 0,
        version: 0,
        path: qidnumber,
    };
    this.caps = undefined;
    this.nlinks = 0;
    this.sha256sum = "";

    /** @type{!Array<!FSLockRegion>} */
    this.locks = []; // lock regions applied to the file, sorted by starting offset.

    // For forwarders:
    this.mount_id = -1; // which fs in this.mounts does this inode forward to?
    this.foreign_id = -1; // which foreign inode id does it represent?

    //this.qid_type = 0;
    //this.qid_version = 0;
    //this.qid_path = qidnumber;
}

Inode.prototype.get_state = function()
{
    const state = [];
    state[0] = this.mode;

    if((this.mode & S_IFMT) === S_IFDIR)
    {
        state[1] = [...this.direntries];
    }
    else if((this.mode & S_IFMT) === S_IFREG)
    {
        state[1] = this.sha256sum;
    }
    else if((this.mode & S_IFMT) === S_IFLNK)
    {
        state[1] = this.symlink;
    }
    else if((this.mode & S_IFMT) === S_IFSOCK)
    {
        state[1] = [this.minor, this.major];
    }
    else
    {
        state[1] = null;
    }

    state[2] = this.locks;
    state[3] = this.status;
    state[4] = this.size;
    state[5] = this.uid;
    state[6] = this.gid;
    state[7] = this.fid;
    state[8] = this.ctime;
    state[9] = this.atime;
    state[10] = this.mtime;
    state[11] = this.qid.version;
    state[12] = this.qid.path;
    state[13] = this.nlinks;

    //state[23] = this.mount_id;
    //state[24] = this.foreign_id;
    //state[25] = this.caps; // currently not writable
    return state;
};

Inode.prototype.set_state = function(state)
{
    this.mode = state[0];

    if((this.mode & S_IFMT) === S_IFDIR)
    {
        this.direntries = new Map();
        for(const [name, entry] of state[1])
        {
            this.direntries.set(name, entry);
        }
    }
    else if((this.mode & S_IFMT) === S_IFREG)
    {
        this.sha256sum = state[1];
    }
    else if((this.mode & S_IFMT) === S_IFLNK)
    {
        this.symlink = state[1];
    }
    else if((this.mode & S_IFMT) === S_IFSOCK)
    {
        [this.minor, this.major] = state[1];
    }
    else
    {
        // Nothing
    }

    this.locks = [];
    for(const lock_state of state[2])
    {
        const lock = new FSLockRegion();
        lock.set_state(lock_state);
        this.locks.push(lock);
    }
    this.status = state[3];
    this.size = state[4];
    this.uid = state[5];
    this.gid = state[6];
    this.fid = state[7];
    this.ctime = state[8];
    this.atime = state[9];
    this.mtime = state[10];
    this.qid.type = (this.mode & S_IFMT) >> 8;
    this.qid.version = state[11];
    this.qid.path = state[12];
    this.nlinks = state[13];

    //this.mount_id = state[23];
    //this.foreign_id = state[24];
    //this.caps = state[20];
};

/**
 * Clones given inode to new idx, effectively diverting the inode to new idx value.
 * Hence, original idx value is now free to use without losing the original information.
 * @private
 * @param {number} parentid Parent of target to divert.
 * @param {string} filename Name of target to divert.
 * @return {number} New idx of diversion.
 */
FS.prototype.divert = function(parentid, filename)
{
    const old_idx = this.Search(parentid, filename);
    const old_inode = this.inodes[old_idx];
    const new_inode = new Inode(-1);

    dbg_assert(old_inode, "Filesystem divert: name (" + filename + ") not found");
    dbg_assert(this.IsDirectory(old_idx) || old_inode.nlinks <= 1,
        "Filesystem: can't divert hardlinked file '" + filename + "' with nlinks=" +
        old_inode.nlinks);

    // Shallow copy is alright.
    Object.assign(new_inode, old_inode);

    const idx = this.inodes.length;
    this.inodes.push(new_inode);
    new_inode.fid = idx;

    // Relink references
    if(this.is_forwarder(old_inode))
    {
        this.mounts[old_inode.mount_id].backtrack.set(old_inode.foreign_id, idx);
    }
    if(this.should_be_linked(old_inode))
    {
        this.unlink_from_dir(parentid, filename);
        this.link_under_dir(parentid, idx, filename);
    }

    // Update children
    if(this.IsDirectory(old_idx) && !this.is_forwarder(old_inode))
    {
        for(const [name, child_id] of new_inode.direntries)
        {
            if(name === "." || name === "..") continue;
            if(this.IsDirectory(child_id))
            {
                this.inodes[child_id].direntries.set("..", idx);
            }
        }
    }

    // Relocate local data if any.
    this.inodedata[idx] = this.inodedata[old_idx];
    delete this.inodedata[old_idx];

    // Retire old reference information.
    old_inode.direntries = new Map();
    old_inode.nlinks = 0;

    return idx;
};

/**
 * Copy all non-redundant info.
 * References left untouched: local idx value and links
 * @private
 * @param {!Inode} src_inode
 * @param {!Inode} dest_inode
 */
FS.prototype.copy_inode = function(src_inode, dest_inode)
{
    Object.assign(dest_inode, src_inode, {
        fid: dest_inode.fid,
        direntries: dest_inode.direntries,
        nlinks: dest_inode.nlinks,
    });
};

FS.prototype.CreateInode = function() {
    //console.log("CreateInode", Error().stack);
    const now = Math.round(Date.now() / 1000);
    const inode = new Inode(++this.qidcounter.last_qidnumber);
    inode.atime = inode.ctime = inode.mtime = now;
    return inode;
};


// Note: parentid = -1 for initial root directory.
FS.prototype.CreateDirectory = function(name, parentid) {
    const parent_inode = this.inodes[parentid];
    if(parentid >= 0 && this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id = this.follow_fs(parent_inode).CreateDirectory(name, foreign_parentid);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var x = this.CreateInode();
    x.mode = 0x01FF | S_IFDIR;
    if(parentid >= 0) {
        x.uid = this.inodes[parentid].uid;
        x.gid = this.inodes[parentid].gid;
        x.mode = (this.inodes[parentid].mode & 0x1FF) | S_IFDIR;
    }
    x.qid.type = S_IFDIR >> 8;
    this.PushInode(x, parentid, name);
    this.NotifyListeners(this.inodes.length-1, "newdir");
    return this.inodes.length-1;
};

FS.prototype.CreateFile = function(filename, parentid) {
    const parent_inode = this.inodes[parentid];
    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id = this.follow_fs(parent_inode).CreateFile(filename, foreign_parentid);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var x = this.CreateInode();
    x.uid = this.inodes[parentid].uid;
    x.gid = this.inodes[parentid].gid;
    x.qid.type = S_IFREG >> 8;
    x.mode = (this.inodes[parentid].mode & 0x1B6) | S_IFREG;
    this.PushInode(x, parentid, filename);
    this.NotifyListeners(this.inodes.length-1, "newfile");
    return this.inodes.length-1;
};


FS.prototype.CreateNode = function(filename, parentid, major, minor) {
    const parent_inode = this.inodes[parentid];
    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id =
            this.follow_fs(parent_inode).CreateNode(filename, foreign_parentid, major, minor);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var x = this.CreateInode();
    x.major = major;
    x.minor = minor;
    x.uid = this.inodes[parentid].uid;
    x.gid = this.inodes[parentid].gid;
    x.qid.type = S_IFSOCK >> 8;
    x.mode = (this.inodes[parentid].mode & 0x1B6);
    this.PushInode(x, parentid, filename);
    return this.inodes.length-1;
};

FS.prototype.CreateSymlink = function(filename, parentid, symlink) {
    const parent_inode = this.inodes[parentid];
    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id =
            this.follow_fs(parent_inode).CreateSymlink(filename, foreign_parentid, symlink);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var x = this.CreateInode();
    x.uid = this.inodes[parentid].uid;
    x.gid = this.inodes[parentid].gid;
    x.qid.type = S_IFLNK >> 8;
    x.symlink = symlink;
    x.mode = S_IFLNK;
    this.PushInode(x, parentid, filename);
    return this.inodes.length-1;
};

FS.prototype.CreateTextFile = async function(filename, parentid, str) {
    const parent_inode = this.inodes[parentid];
    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id = await
            this.follow_fs(parent_inode).CreateTextFile(filename, foreign_parentid, str);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var id = this.CreateFile(filename, parentid);
    var x = this.inodes[id];
    var data = new Uint8Array(str.length);
    x.size = str.length;
    for(var j = 0; j < str.length; j++) {
        data[j] = str.charCodeAt(j);
    }
    await this.set_data(id, data);
    return id;
};

/**
 * @param {Uint8Array} buffer
 */
FS.prototype.CreateBinaryFile = async function(filename, parentid, buffer) {
    const parent_inode = this.inodes[parentid];
    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id = await
            this.follow_fs(parent_inode).CreateBinaryFile(filename, foreign_parentid, buffer);
        return this.create_forwarder(parent_inode.mount_id, foreign_id);
    }
    var id = this.CreateFile(filename, parentid);
    var x = this.inodes[id];
    var data = new Uint8Array(buffer.length);
    data.set(buffer);
    await this.set_data(id, data);
    x.size = buffer.length;
    return id;
};


FS.prototype.OpenInode = function(id, mode) {
    var inode = this.inodes[id];
    if(this.is_forwarder(inode))
    {
        return this.follow_fs(inode).OpenInode(inode.foreign_id, mode);
    }
    if((inode.mode&S_IFMT) === S_IFDIR) {
        this.FillDirectory(id);
    }
    /*
    var type = "";
    switch(inode.mode&S_IFMT) {
        case S_IFREG: type = "File"; break;
        case S_IFBLK: type = "Block Device"; break;
        case S_IFDIR: type = "Directory"; break;
        case S_IFCHR: type = "Character Device"; break;
    }
    */
    //dbg_log("open:" + this.GetFullPath(id) +  " type: " + inode.mode + " status:" + inode.status, LOG_9P);
    return true;
};

FS.prototype.CloseInode = async function(id) {
    //dbg_log("close: " + this.GetFullPath(id), LOG_9P);
    var inode = this.inodes[id];
    if(this.is_forwarder(inode))
    {
        return await this.follow_fs(inode).CloseInode(inode.foreign_id);
    }
    if(inode.status === STATUS_ON_STORAGE)
    {
        this.storage.uncache(inode.sha256sum);
    }
    if(inode.status === STATUS_UNLINKED) {
        //dbg_log("Filesystem: Delete unlinked file", LOG_9P);
        inode.status = STATUS_INVALID;
        await this.DeleteData(id);
    }
};

/**
 * @return {!Promise<number>} 0 if success, or -errno if failured.
 */
FS.prototype.Rename = async function(olddirid, oldname, newdirid, newname) {
    // dbg_log("Rename " + oldname + " to " + newname, LOG_9P);
    if((olddirid === newdirid) && (oldname === newname)) {
        return 0;
    }
    var oldid = this.Search(olddirid, oldname);
    if(oldid === -1)
    {
        return -ENOENT;
    }

    // For event notification near end of method.
    var oldpath = this.GetFullPath(olddirid) + "/" + oldname;

    var newid = this.Search(newdirid, newname);
    if(newid !== -1) {
        const ret = this.Unlink(newdirid, newname);
        if(ret < 0) return ret;
    }

    var idx = oldid; // idx contains the id which we want to rename
    var inode = this.inodes[idx];
    const olddir = this.inodes[olddirid];
    const newdir = this.inodes[newdirid];

    if(!this.is_forwarder(olddir) && !this.is_forwarder(newdir))
    {
        // Move inode within current filesystem.

        this.unlink_from_dir(olddirid, oldname);
        this.link_under_dir(newdirid, idx, newname);

        inode.qid.version++;
    }
    else if(this.is_forwarder(olddir) && olddir.mount_id === newdir.mount_id)
    {
        // Move inode within the same child filesystem.

        const ret = await
            this.follow_fs(olddir).Rename(olddir.foreign_id, oldname, newdir.foreign_id, newname);

        if(ret < 0) return ret;
    }
    else if(this.is_a_root(idx))
    {
        // The actual inode is a root of some descendant filesystem.
        // Moving mountpoint across fs not supported - needs to update all corresponding forwarders.
        dbg_log("XXX: Attempted to move mountpoint (" + oldname + ") - skipped", LOG_9P);
        return -EPERM;
    }
    else if(!this.IsDirectory(idx) && this.GetInode(idx).nlinks > 1)
    {
        // Move hardlinked inode vertically in mount tree.
        dbg_log("XXX: Attempted to move hardlinked file (" + oldname + ") " +
                "across filesystems - skipped", LOG_9P);
        return -EPERM;
    }
    else
    {
        // Jump between filesystems.

        // Can't work with both old and new inode information without first diverting the old
        // information into a new idx value.
        const diverted_old_idx = this.divert(olddirid, oldname);
        const old_real_inode = this.GetInode(idx);

        const data = await this.Read(diverted_old_idx, 0, old_real_inode.size);

        if(this.is_forwarder(newdir))
        {
            // Create new inode.
            const foreign_fs = this.follow_fs(newdir);
            const foreign_id = this.IsDirectory(diverted_old_idx) ?
                foreign_fs.CreateDirectory(newname, newdir.foreign_id) :
                foreign_fs.CreateFile(newname, newdir.foreign_id);

            const new_real_inode = foreign_fs.GetInode(foreign_id);
            this.copy_inode(old_real_inode, new_real_inode);

            // Point to this new location.
            this.set_forwarder(idx, newdir.mount_id, foreign_id);
        }
        else
        {
            // Replace current forwarder with real inode.
            this.delete_forwarder(inode);
            this.copy_inode(old_real_inode, inode);

            // Link into new location in this filesystem.
            this.link_under_dir(newdirid, idx, newname);
        }

        // Rewrite data to newly created destination.
        await this.ChangeSize(idx, old_real_inode.size);
        if(data && data.length)
        {
            await this.Write(idx, 0, data.length, data);
        }

        // Move children to newly created destination.
        if(this.IsDirectory(idx))
        {
            for(const child_filename of this.GetChildren(diverted_old_idx))
            {
                const ret = await this.Rename(diverted_old_idx, child_filename, idx, child_filename);
                if(ret < 0) return ret;
            }
        }

        // Perform destructive changes only after migration succeeded.
        await this.DeleteData(diverted_old_idx);
        const ret = this.Unlink(olddirid, oldname);
        if(ret < 0) return ret;
    }

    this.NotifyListeners(idx, "rename", {oldpath: oldpath});

    return 0;
};

FS.prototype.Write = async function(id, offset, count, buffer) {
    this.NotifyListeners(id, "write");
    var inode = this.inodes[id];

    if(this.is_forwarder(inode))
    {
        const foreign_id = inode.foreign_id;
        await this.follow_fs(inode).Write(foreign_id, offset, count, buffer);
        return;
    }

    var data = await this.get_buffer(id);

    if(!data || data.length < (offset+count)) {
        await this.ChangeSize(id, Math.floor(((offset+count)*3)/2));
        inode.size = offset + count;
        data = await this.get_buffer(id);
    } else
    if(inode.size < (offset+count)) {
        inode.size = offset + count;
    }
    if(buffer)
    {
        data.set(buffer.subarray(0, count), offset);
    }
    await this.set_data(id, data);
};

FS.prototype.Read = async function(inodeid, offset, count)
{
    const inode = this.inodes[inodeid];
    if(this.is_forwarder(inode))
    {
        const foreign_id = inode.foreign_id;
        return await this.follow_fs(inode).Read(foreign_id, offset, count);
    }

    return await this.get_data(inodeid, offset, count);
};

FS.prototype.Search = function(parentid, name) {
    const parent_inode = this.inodes[parentid];

    if(this.is_forwarder(parent_inode))
    {
        const foreign_parentid = parent_inode.foreign_id;
        const foreign_id = this.follow_fs(parent_inode).Search(foreign_parentid, name);
        if(foreign_id === -1) return -1;
        return this.get_forwarder(parent_inode.mount_id, foreign_id);
    }

    const childid = parent_inode.direntries.get(name);
    return childid === undefined ? -1 : childid;
};

FS.prototype.CountUsedInodes = function()
{
    let count = this.inodes.length;
    for(const { fs, backtrack } of this.mounts)
    {
        count += fs.CountUsedInodes();

        // Forwarder inodes don't count.
        count -=  backtrack.size;
    }
    return count;
};

FS.prototype.CountFreeInodes = function()
{
    let count = 1024 * 1024;
    for(const { fs } of this.mounts)
    {
        count += fs.CountFreeInodes();
    }
    return count;
};

FS.prototype.GetTotalSize = function() {
    let size = this.used_size;
    for(const { fs } of this.mounts)
    {
        size += fs.GetTotalSize();
    }
    return size;
    //var size = 0;
    //for(var i=0; i<this.inodes.length; i++) {
    //    var d = this.inodes[i].data;
    //    size += d ? d.length : 0;
    //}
    //return size;
};

FS.prototype.GetSpace = function() {
    let size = this.total_size;
    for(const { fs } of this.mounts)
    {
        size += fs.GetSpace();
    }
    return this.total_size;
};

/**
 * XXX: Not ideal.
 * @param {number} idx
 * @return {string}
 */
FS.prototype.GetDirectoryName = function(idx)
{
    const parent_inode = this.inodes[this.GetParent(idx)];

    if(this.is_forwarder(parent_inode))
    {
        return this.follow_fs(parent_inode).GetDirectoryName(this.inodes[idx].foreign_id);
    }

    // Root directory.
    if(!parent_inode) return "";

    for(const [name, childid] of parent_inode.direntries)
    {
        if(childid === idx) return name;
    }

    dbg_assert(false, "Filesystem: Found directory inode whose parent doesn't link to it");
    return "";
};

FS.prototype.GetFullPath = function(idx) {
    dbg_assert(this.IsDirectory(idx), "Filesystem: Cannot get full path of non-directory inode");

    var path = "";

    while(idx !== 0) {
        path = "/" + this.GetDirectoryName(idx) + path;
        idx = this.GetParent(idx);
    }
    return path.substring(1);
};

/**
 * @param {number} parentid
 * @param {number} targetid
 * @param {string} name
 * @return {number} 0 if success, or -errno if failured.
 */
FS.prototype.Link = function(parentid, targetid, name)
{
    if(this.IsDirectory(targetid))
    {
        return -EPERM;
    }

    const parent_inode = this.inodes[parentid];
    const inode = this.inodes[targetid];

    if(this.is_forwarder(parent_inode))
    {
        if(!this.is_forwarder(inode) || inode.mount_id !== parent_inode.mount_id)
        {
            dbg_log("XXX: Attempted to hardlink a file into a child filesystem - skipped", LOG_9P);
            return -EPERM;
        }
        return this.follow_fs(parent_inode).Link(parent_inode.foreign_id, inode.foreign_id, name);
    }

    if(this.is_forwarder(inode))
    {
        dbg_log("XXX: Attempted to hardlink file across filesystems - skipped", LOG_9P);
        return -EPERM;
    }

    this.link_under_dir(parentid, targetid, name);
    return 0;
};

FS.prototype.Unlink = function(parentid, name) {
    if(name === "." || name === "..")
    {
        // Also guarantees that root cannot be deleted.
        return -EPERM;
    }
    const idx = this.Search(parentid, name);
    const inode = this.inodes[idx];
    const parent_inode = this.inodes[parentid];
    //dbg_log("Unlink " + inode.name, LOG_9P);

    // forward if necessary
    if(this.is_forwarder(parent_inode))
    {
        dbg_assert(this.is_forwarder(inode), "Children of forwarders should be forwarders");

        const foreign_parentid = parent_inode.foreign_id;
        return this.follow_fs(parent_inode).Unlink(foreign_parentid, name);

        // Keep the forwarder dangling - file is still accessible.
    }

    if(this.IsDirectory(idx) && !this.IsEmpty(idx))
    {
        return -ENOTEMPTY;
    }

    this.unlink_from_dir(parentid, name);

    if(inode.nlinks === 0)
    {
        // don't delete the content. The file is still accessible
        inode.status = STATUS_UNLINKED;
        this.NotifyListeners(idx, "delete");
    }
    return 0;
};

FS.prototype.DeleteData = async function(idx)
{
    const inode = this.inodes[idx];
    if(this.is_forwarder(inode))
    {
        await this.follow_fs(inode).DeleteData(inode.foreign_id);
        return;
    }
    inode.size = 0;
    delete this.inodedata[idx];
};

/**
 * @private
 * @param {number} idx
 * @return {!Promise<Uint8Array>} The buffer that contains the file contents, which may be larger
 *      than the data itself. To ensure that any modifications done to this buffer is reflected
 *      to the file, call set_data with the modified buffer.
 */
FS.prototype.get_buffer = async function(idx)
{
    const inode = this.inodes[idx];
    dbg_assert(inode, `Filesystem get_buffer: idx ${idx} does not point to an inode`);

    if(this.inodedata[idx])
    {
        return this.inodedata[idx];
    }
    else if(inode.status === STATUS_ON_STORAGE)
    {
        dbg_assert(inode.sha256sum, "Filesystem get_data: found inode on server without sha256sum");
        return await this.storage.read(inode.sha256sum, 0, inode.size);
    }
    else
    {
        return null;
    }
};

/**
 * @private
 * @param {number} idx
 * @param {number} offset
 * @param {number} count
 * @return {!Promise<Uint8Array>}
 */
FS.prototype.get_data = async function(idx, offset, count)
{
    const inode = this.inodes[idx];
    dbg_assert(inode, `Filesystem get_data: idx ${idx} does not point to an inode`);

    if(this.inodedata[idx])
    {
        return this.inodedata[idx].subarray(offset, offset + count);
    }
    else if(inode.status === STATUS_ON_STORAGE)
    {
        dbg_assert(inode.sha256sum, "Filesystem get_data: found inode on server without sha256sum");
        return await this.storage.read(inode.sha256sum, offset, count);
    }
    else
    {
        return null;
    }
};

/**
 * @private
 * @param {number} idx
 * @param {Uint8Array} buffer
 */
FS.prototype.set_data = async function(idx, buffer)
{
    // Current scheme: Save all modified buffers into local inodedata.
    this.inodedata[idx] = buffer;
    if(this.inodes[idx].status === STATUS_ON_STORAGE)
    {
        this.inodes[idx].status = STATUS_OK;
        this.storage.uncache(this.inodes[idx].sha256sum);
    }
};

/**
 * @param {number} idx
 * @return {!Inode}
 */
FS.prototype.GetInode = function(idx)
{
    dbg_assert(!isNaN(idx), "Filesystem GetInode: NaN idx");
    dbg_assert(idx >= 0 && idx < this.inodes.length, "Filesystem GetInode: out of range idx:" + idx);

    const inode = this.inodes[idx];
    if(this.is_forwarder(inode))
    {
        return this.follow_fs(inode).GetInode(inode.foreign_id);
    }

    return inode;
};

FS.prototype.ChangeSize = async function(idx, newsize)
{
    var inode = this.GetInode(idx);
    var temp = await this.get_data(idx, 0, inode.size);
    //dbg_log("change size to: " + newsize, LOG_9P);
    if(newsize === inode.size) return;
    var data = new Uint8Array(newsize);
    inode.size = newsize;
    if(temp)
    {
        var size = Math.min(temp.length, inode.size);
        data.set(temp.subarray(0, size), 0);
    }
    await this.set_data(idx, data);
};

FS.prototype.SearchPath = function(path) {
    //path = path.replace(/\/\//g, "/");
    path = path.replace("//", "/");
    var walk = path.split("/");
    if(walk.length > 0 && walk[walk.length - 1].length === 0) walk.pop();
    if(walk.length > 0 && walk[0].length === 0) walk.shift();
    const n = walk.length;

    var parentid = -1;
    var id = 0;
    let forward_path = null;
    for(var i=0; i<n; i++) {
        parentid = id;
        id = this.Search(parentid, walk[i]);
        if(!forward_path && this.is_forwarder(this.inodes[parentid]))
        {
            forward_path = "/" + walk.slice(i).join("/");
        }
        if(id === -1) {
            if(i < n-1) return {id: -1, parentid: -1, name: walk[i], forward_path }; // one name of the path cannot be found
            return {id: -1, parentid: parentid, name: walk[i], forward_path}; // the last element in the path does not exist, but the parent
        }
    }
    return {id: id, parentid: parentid, name: walk[i], forward_path};
};
// -----------------------------------------------------

/**
 * @param {number} dirid
 * @param {Array<{parentid: number, name: string}>} list
 */
FS.prototype.GetRecursiveList = function(dirid, list) {
    if(this.is_forwarder(this.inodes[dirid]))
    {
        const foreign_fs = this.follow_fs(this.inodes[dirid]);
        const foreign_dirid = this.inodes[dirid].foreign_id;
        const mount_id = this.inodes[dirid].mount_id;

        const foreign_start = list.length;
        foreign_fs.GetRecursiveList(foreign_dirid, list);
        for(let i = foreign_start; i < list.length; i++)
        {
            list[i].parentid = this.get_forwarder(mount_id, list[i].parentid);
        }
        return;
    }
    for(const [name, id] of this.inodes[dirid].direntries)
    {
        if(name !== "." && name !== "..")
        {
            list.push({ parentid: dirid, name });
            if(this.IsDirectory(id))
            {
                this.GetRecursiveList(id, list);
            }
        }
    }
};

FS.prototype.RecursiveDelete = function(path) {
    var toDelete = [];
    var ids = this.SearchPath(path);
    if(ids.id === -1) return;

    this.GetRecursiveList(ids.id, toDelete);

    for(var i=toDelete.length-1; i>=0; i--)
    {
        const ret = this.Unlink(toDelete[i].parentid, toDelete[i].name);
        dbg_assert(ret === 0, "Filesystem RecursiveDelete failed at parent=" + toDelete[i].parentid +
            ", name='" + toDelete[i].name + "' with error code: " + (-ret));
    }
};

FS.prototype.DeleteNode = function(path) {
    var ids = this.SearchPath(path);
    if(ids.id === -1) return;

    if((this.inodes[ids.id].mode&S_IFMT) === S_IFREG){
        const ret = this.Unlink(ids.parentid, ids.name);
        dbg_assert(ret === 0, "Filesystem DeleteNode failed with error code: " + (-ret));
    }
    else if((this.inodes[ids.id].mode&S_IFMT) === S_IFDIR){
        this.RecursiveDelete(path);
        const ret = this.Unlink(ids.parentid, ids.name);
        dbg_assert(ret === 0, "Filesystem DeleteNode failed with error code: " + (-ret));
    }
};

/** @param {*=} info */
FS.prototype.NotifyListeners = function(id, action, info) {
    //if(info==undefined)
    //    info = {};

    //var path = this.GetFullPath(id);
    //if (this.watchFiles[path] === true && action=='write') {
    //  message.Send("WatchFileEvent", path);
    //}
    //for (var directory of this.watchDirectories) {
    //    if (this.watchDirectories.hasOwnProperty(directory)) {
    //        var indexOf = path.indexOf(directory)
    //        if(indexOf === 0 || indexOf === 1)
    //            message.Send("WatchDirectoryEvent", {path: path, event: action, info: info});
    //    }
    //}
};


FS.prototype.Check = function() {
    for(var i=1; i<this.inodes.length; i++)
    {
        if(this.inodes[i].status === STATUS_INVALID) continue;

        var inode = this.GetInode(i);
        if(inode.nlinks < 0) {
            dbg_log("Error in filesystem: negative nlinks=" + inode.nlinks + " at id =" + i, LOG_9P);
        }

        if(this.IsDirectory(i))
        {
            const inode = this.GetInode(i);
            if(this.IsDirectory(i) && this.GetParent(i) < 0) {
                dbg_log("Error in filesystem: negative parent id " + i, LOG_9P);
            }
            for(const [name, id] of inode.direntries)
            {
                if(name.length === 0) {
                    dbg_log("Error in filesystem: inode with no name and id " + id, LOG_9P);
                }

                for(const c of name) {
                    if(c < 32) {
                        dbg_log("Error in filesystem: Unallowed char in filename", LOG_9P);
                    }
                }
            }
        }
    }

};


FS.prototype.FillDirectory = function(dirid) {
    const inode = this.inodes[dirid];
    if(this.is_forwarder(inode))
    {
        // XXX: The ".." of a mountpoint should point back to an inode in this fs.
        // Otherwise, ".." gets the wrong qid and mode.
        this.follow_fs(inode).FillDirectory(inode.foreign_id);
        return;
    }

    let size = 0;
    for(const name of inode.direntries.keys())
    {
        size += 13 + 8 + 1 + 2 + texten.encode(name).length;
    }
    const data = this.inodedata[dirid] = new Uint8Array(size);
    inode.size = size;

    let offset = 0x0;
    for(const [name, id] of inode.direntries)
    {
        const child = this.GetInode(id);
        offset += marshall.Marshall(
            ["Q", "d", "b", "s"],
            [child.qid,
            offset+13+8+1+2+texten.encode(name).length,
            child.mode >> 12,
            name],
            data, offset);
    }
};

FS.prototype.RoundToDirentry = function(dirid, offset_target)
{
    const data = this.inodedata[dirid];
    dbg_assert(data, `FS directory data for dirid=${dirid} should be generated`);
    dbg_assert(data.length, "FS directory should have at least an entry");

    if(offset_target >= data.length)
    {
        return data.length;
    }

    let offset = 0;
    while(true)
    {
        const next_offset = marshall.Unmarshall(["Q", "d"], data, { offset })[1];
        if(next_offset > offset_target) break;
        offset = next_offset;
    }

    return offset;
};

/**
 * @param {number} idx
 * @return {boolean}
 */
FS.prototype.IsDirectory = function(idx)
{
    const inode = this.inodes[idx];
    if(this.is_forwarder(inode))
    {
        return this.follow_fs(inode).IsDirectory(inode.foreign_id);
    }
    return (inode.mode & S_IFMT) === S_IFDIR;
};

/**
 * @param {number} idx
 * @return {boolean}
 */
FS.prototype.IsEmpty = function(idx)
{
    const inode = this.inodes[idx];
    if(this.is_forwarder(inode))
    {
        return this.follow_fs(inode).IsDirectory(inode.foreign_id);
    }
    for(const name of inode.direntries.keys())
    {
        if(name !== "." && name !== "..") return false;
    }
    return true;
};

/**
 * @param {number} idx
 * @return {!Array<string>} List of children names
 */
FS.prototype.GetChildren = function(idx)
{
    dbg_assert(this.IsDirectory(idx), "Filesystem: cannot get children of non-directory inode");
    const inode = this.inodes[idx];
    if(this.is_forwarder(inode))
    {
        return this.follow_fs(inode).GetChildren(inode.foreign_id);
    }
    const children = [];
    for(const name of inode.direntries.keys())
    {
        if(name !== "." && name !== "..")
        {
            children.push(name);
        }
    }
    return children;
};

/**
 * @param {number} idx
 * @return {number} Local idx of parent
 */
FS.prototype.GetParent = function(idx)
{
    dbg_assert(this.IsDirectory(idx), "Filesystem: cannot get parent of non-directory inode");

    const inode = this.inodes[idx];

    if(this.should_be_linked(inode))
    {
        return inode.direntries.get("..");
    }
    else
    {
        const foreign_dirid = this.follow_fs(inode).GetParent(inode.foreign_id);
        dbg_assert(foreign_dirid !== -1, "Filesystem: should not have invalid parent ids");
        return this.get_forwarder(inode.mount_id, foreign_dirid);
    }
};


// -----------------------------------------------------

// only support for security.capabilities
// should return a  "struct vfs_cap_data" defined in
// linux/capability for format
// check also:
//   sys/capability.h
//   http://lxr.free-electrons.com/source/security/commoncap.c#L376
//   http://man7.org/linux/man-pages/man7/capabilities.7.html
//   http://man7.org/linux/man-pages/man8/getcap.8.html
//   http://man7.org/linux/man-pages/man3/libcap.3.html
FS.prototype.PrepareCAPs = function(id) {
    var inode = this.GetInode(id);
    if(inode.caps) return inode.caps.length;
    inode.caps = new Uint8Array(20);
    // format is little endian
    // note: getxattr returns -EINVAL if using revision 1 format.
    // note: getxattr presents revision 3 as revision 2 when revision 3 is not needed.
    // magic_etc (revision=0x02: 20 bytes)
    inode.caps[0]  = 0x00;
    inode.caps[1]  = 0x00;
    inode.caps[2]  = 0x00;
    inode.caps[3]  = 0x02;

    // lower
    // permitted (first 32 capabilities)
    inode.caps[4]  = 0xFF;
    inode.caps[5]  = 0xFF;
    inode.caps[6]  = 0xFF;
    inode.caps[7]  = 0xFF;
    // inheritable (first 32 capabilities)
    inode.caps[8]  = 0xFF;
    inode.caps[9]  = 0xFF;
    inode.caps[10] = 0xFF;
    inode.caps[11] = 0xFF;

    // higher
    // permitted (last 6 capabilities)
    inode.caps[12] = 0x3F;
    inode.caps[13] = 0x00;
    inode.caps[14] = 0x00;
    inode.caps[15] = 0x00;
    // inheritable (last 6 capabilities)
    inode.caps[16] = 0x3F;
    inode.caps[17] = 0x00;
    inode.caps[18] = 0x00;
    inode.caps[19] = 0x00;

    return inode.caps.length;
};

// -----------------------------------------------------

/**
 * @constructor
 * @param {FS} filesystem
 */
function FSMountInfo(filesystem)
{
    /** @type {FS}*/
    this.fs = filesystem;

    /**
     * Maps foreign inode id back to local inode id.
     * @type {!Map<number,number>}
     */
    this.backtrack = new Map();
}

FSMountInfo.prototype.get_state = function()
{
    const state = [];

    state[0] = this.fs;
    state[1] = [...this.backtrack];

    return state;
};

FSMountInfo.prototype.set_state = function(state)
{
    this.fs = state[0];
    this.backtrack = new Map(state[1]);
};

/**
 * @private
 * @param {number} idx Local idx of inode.
 * @param {number} mount_id Mount number of the destination fs.
 * @param {number} foreign_id Foreign idx of destination inode.
 */
FS.prototype.set_forwarder = function(idx, mount_id, foreign_id)
{
    const inode = this.inodes[idx];

    dbg_assert(inode.nlinks === 0,
        "Filesystem: attempted to convert an inode into forwarder before unlinking the inode");

    if(this.is_forwarder(inode))
    {
        this.mounts[inode.mount_id].backtrack.delete(inode.foreign_id);
    }

    inode.status = STATUS_FORWARDING;
    inode.mount_id = mount_id;
    inode.foreign_id = foreign_id;

    this.mounts[mount_id].backtrack.set(foreign_id, idx);
};

/**
 * @private
 * @param {number} mount_id Mount number of the destination fs.
 * @param {number} foreign_id Foreign idx of destination inode.
 * @return {number} Local idx of newly created forwarder.
 */
FS.prototype.create_forwarder = function(mount_id, foreign_id)
{
    const inode = this.CreateInode();

    const idx = this.inodes.length;
    this.inodes.push(inode);
    inode.fid = idx;

    this.set_forwarder(idx, mount_id, foreign_id);
    return idx;
};

/**
 * @private
 * @param {Inode} inode
 * @return {boolean}
 */
FS.prototype.is_forwarder = function(inode)
{
    return inode.status === STATUS_FORWARDING;
};

/**
 * Whether the inode it points to is a root of some filesystem.
 * @private
 * @param {number} idx
 * @return {boolean}
 */
FS.prototype.is_a_root = function(idx)
{
    return this.GetInode(idx).fid === 0;
};

/**
 * Ensures forwarder exists, and returns such forwarder, for the described foreign inode.
 * @private
 * @param {number} mount_id
 * @param {number} foreign_id
 * @return {number} Local idx of a forwarder to described inode.
 */
FS.prototype.get_forwarder = function(mount_id, foreign_id)
{
    const mount = this.mounts[mount_id];

    dbg_assert(foreign_id >= 0, "Filesystem get_forwarder: invalid foreign_id: " + foreign_id);
    dbg_assert(mount, "Filesystem get_forwarder: invalid mount number: " + mount_id);

    const result = mount.backtrack.get(foreign_id);

    if(result === undefined)
    {
        // Create if not already exists.
        return this.create_forwarder(mount_id, foreign_id);
    }

    return result;
};

/**
 * @private
 * @param {Inode} inode
 */
FS.prototype.delete_forwarder = function(inode)
{
    dbg_assert(this.is_forwarder(inode), "Filesystem delete_forwarder: expected forwarder");

    inode.status = STATUS_INVALID;
    this.mounts[inode.mount_id].backtrack.delete(inode.foreign_id);
};

/**
 * @private
 * @param {Inode} inode
 * @return {FS}
 */
FS.prototype.follow_fs = function(inode)
{
    const mount = this.mounts[inode.mount_id];

    dbg_assert(this.is_forwarder(inode),
        "Filesystem follow_fs: inode should be a forwarding inode");
    dbg_assert(mount, "Filesystem follow_fs: inode<id=" + inode.fid +
        "> should point to valid mounted FS");

    return mount.fs;
};

/**
 * Mount another filesystem to given path.
 * @param {string} path
 * @param {FS} fs
 * @return {number} inode id of mount point if successful, or -errno if mounting failed.
 */
FS.prototype.Mount = function(path, fs)
{
    dbg_assert(fs.qidcounter === this.qidcounter,
        "Cannot mount filesystem whose qid numbers aren't synchronised with current filesystem.");

    const path_infos = this.SearchPath(path);

    if(path_infos.parentid === -1)
    {
        dbg_log("Mount failed: parent for path not found: " + path, LOG_9P);
        return -ENOENT;
    }
    if(path_infos.id !== -1)
    {
        dbg_log("Mount failed: file already exists at path: " + path, LOG_9P);
        return -EEXIST;
    }
    if(path_infos.forward_path)
    {
        const parent = this.inodes[path_infos.parentid];
        const ret = this.follow_fs(parent).Mount(path_infos.forward_path, fs);
        if(ret < 0) return ret;
        return this.get_forwarder(parent.mount_id, ret);
    }

    const mount_id = this.mounts.length;
    this.mounts.push(new FSMountInfo(fs));

    const idx = this.create_forwarder(mount_id, 0);
    this.link_under_dir(path_infos.parentid, idx, path_infos.name);

    return idx;
};

/**
 * @constructor
 */
function FSLockRegion()
{
    this.type = P9_LOCK_TYPE_UNLCK;
    this.start = 0;
    this.length = Infinity;
    this.proc_id = -1;
    this.client_id = "";
}

FSLockRegion.prototype.get_state = function()
{
    const state = [];

    state[0] = this.type;
    state[1] = this.start;
    // Infinity is not JSON.stringify-able
    state[2] = this.length === Infinity ? 0 : this.length;
    state[3] = this.proc_id;
    state[4] = this.client_id;

    return state;
};

FSLockRegion.prototype.set_state = function(state)
{
    this.type = state[0];
    this.start = state[1];
    this.length = state[2] === 0 ? Infinity : state[2];
    this.proc_id = state[3];
    this.client_id = state[4];
};

/**
 * @return {FSLockRegion}
 */
FSLockRegion.prototype.clone = function()
{
    const new_region = new FSLockRegion();
    new_region.set_state(this.get_state());
    return new_region;
};

/**
 * @param {FSLockRegion} region
 * @return {boolean}
 */
FSLockRegion.prototype.conflicts_with = function(region)
{
    if(this.proc_id === region.proc_id && this.client_id === region.client_id) return false;
    if(this.type === P9_LOCK_TYPE_UNLCK || region.type === P9_LOCK_TYPE_UNLCK) return false;
    if(this.type !== P9_LOCK_TYPE_WRLCK && region.type !== P9_LOCK_TYPE_WRLCK) return false;
    if(this.start + this.length <= region.start) return false;
    if(region.start + region.length <= this.start) return false;
    return true;
};

/**
 * @param {FSLockRegion} region
 * @return {boolean}
 */
FSLockRegion.prototype.is_alike = function(region)
{
    return region.proc_id === this.proc_id &&
        region.client_id === this.client_id &&
        region.type === this.type;
};

/**
 * @param {FSLockRegion} region
 * @return {boolean}
 */
FSLockRegion.prototype.may_merge_after = function(region)
{
    return this.is_alike(region) && region.start + region.length === this.start;
};

/**
 * @param {number} type
 * @param {number} start
 * @param {number} length
 * @param {number} proc_id
 * @param {string} client_id
 * @return {!FSLockRegion}
 */
FS.prototype.DescribeLock = function(type, start, length, proc_id, client_id)
{
    dbg_assert(type === P9_LOCK_TYPE_RDLCK ||
        type === P9_LOCK_TYPE_WRLCK ||
        type === P9_LOCK_TYPE_UNLCK,
        "Filesystem: Invalid lock type: " + type);
    dbg_assert(start >= 0, "Filesystem: Invalid negative lock starting offset: " + start);
    dbg_assert(length > 0, "Filesystem: Invalid non-positive lock length: " + length);

    const lock = new FSLockRegion();
    lock.type = type;
    lock.start = start;
    lock.length = length;
    lock.proc_id = proc_id;
    lock.client_id = client_id;

    return lock;
};

/**
 * @param {number} id
 * @param {FSLockRegion} request
 * @return {FSLockRegion} The first conflicting lock found, or null if requested lock is possible.
 */
FS.prototype.GetLock = function(id, request)
{
    const inode = this.inodes[id];

    if(this.is_forwarder(inode))
    {
        const foreign_id = inode.foreign_id;
        return this.follow_fs(inode).GetLock(foreign_id, request);
    }

    for(const region of inode.locks)
    {
        if(request.conflicts_with(region))
        {
            return region.clone();
        }
    }
    return null;
};

/**
 * @param {number} id
 * @param {FSLockRegion} request
 * @param {number} flags
 * @return {number} One of P9_LOCK_SUCCESS / P9_LOCK_BLOCKED / P9_LOCK_ERROR / P9_LOCK_GRACE.
 */
FS.prototype.Lock = function(id, request, flags)
{
    const inode = this.inodes[id];

    if(this.is_forwarder(inode))
    {
        const foreign_id = inode.foreign_id;
        return this.follow_fs(inode).Lock(foreign_id, request, flags);
    }

    request = request.clone();

    // (1) Check whether lock is possible before any modification.
    if(request.type !== P9_LOCK_TYPE_UNLCK && this.GetLock(id, request))
    {
        return P9_LOCK_BLOCKED;
    }

    // (2) Subtract requested region from locks of the same owner.
    for(let i = 0; i < inode.locks.length; i++)
    {
        const region = inode.locks[i];

        dbg_assert(region.length > 0,
            "Filesystem: Found non-positive lock region length: " + region.length);
        dbg_assert(region.type === P9_LOCK_TYPE_RDLCK || region.type === P9_LOCK_TYPE_WRLCK,
            "Filesystem: Found invalid lock type: " + region.type);
        dbg_assert(!inode.locks[i-1] || inode.locks[i-1].start <= region.start,
            "Filesystem: Locks should be sorted by starting offset");

        // Skip to requested region.
        if(region.start + region.length <= request.start) continue;

        // Check whether we've skipped past the requested region.
        if(request.start + request.length <= region.start) break;

        // Skip over locks of different owners.
        if(region.proc_id !== request.proc_id || region.client_id !== request.client_id)
        {
            dbg_assert(!region.conflicts_with(request),
                "Filesytem: Found conflicting lock region, despite already checked for conflicts");
            continue;
        }

        // Pretend region would be split into parts 1 and 2.
        const start1 = region.start;
        const start2 = request.start + request.length;
        const length1 = request.start - start1;
        const length2 = region.start + region.length - start2;

        if(length1 > 0 && length2 > 0 && region.type === request.type)
        {
            // Requested region is already locked with the required type.
            // Return early - no need to modify anything.
            return P9_LOCK_SUCCESS;
        }

        if(length1 > 0)
        {
            // Shrink from right / first half of the split.
            region.length = length1;
        }

        if(length1 <= 0 && length2 > 0)
        {
            // Shrink from left.
            region.start = start2;
            region.length = length2;
        }
        else if(length2 > 0)
        {
            // Add second half of the split.

            // Fast-forward to correct location.
            while(i < inode.locks.length && inode.locks[i].start < start2) i++;

            inode.locks.splice(i, 0,
                this.DescribeLock(region.type, start2, length2, region.proc_id, region.client_id));
        }
        else if(length1 <= 0)
        {
            // Requested region completely covers this region. Delete.
            inode.locks.splice(i, 1);
            i--;
        }
    }

    // (3) Insert requested lock region as a whole.
    // No point in adding the requested lock region as fragmented bits in the above loop
    // and having to merge them all back into one.
    if(request.type !== P9_LOCK_TYPE_UNLCK)
    {
        let new_region = request;
        let has_merged = false;
        let i = 0;

        // Fast-forward to requested position, and try merging with previous region.
        for(; i < inode.locks.length; i++)
        {
            if(new_region.may_merge_after(inode.locks[i]))
            {
                inode.locks[i].length += request.length;
                new_region = inode.locks[i];
                has_merged = true;
            }
            if(request.start <= inode.locks[i].start) break;
        }

        if(!has_merged)
        {
            inode.locks.splice(i, 0, new_region);
            i++;
        }

        // Try merging with the subsequent alike region.
        for(; i < inode.locks.length; i++)
        {
            if(!inode.locks[i].is_alike(new_region)) continue;

            if(inode.locks[i].may_merge_after(new_region))
            {
                new_region.length += inode.locks[i].length;
                inode.locks.splice(i, 1);
            }

            // No more mergable regions after this.
            break;
        }
    }

    return P9_LOCK_SUCCESS;
};

FS.prototype.read_dir = function(path)
{
    const p = this.SearchPath(path);

    if(p.id === -1)
    {
        return undefined;
    }

    const dir = this.GetInode(p.id);

    return Array.from(dir.direntries.keys()).filter(path => path !== "." && path !== "..");
};

FS.prototype.read_file = function(file)
{
    const p = this.SearchPath(file);

    if(p.id === -1)
    {
        return Promise.resolve(null);
    }

    const inode = this.GetInode(p.id);

    return this.Read(p.id, 0, inode.size);
};


// ---- File: lib/9p.js ----
// -------------------------------------------------
// --------------------- 9P ------------------------
// -------------------------------------------------
// Implementation of the 9p filesystem device following the
// 9P2000.L protocol ( https://code.google.com/p/diod/wiki/protocol )








// For Types Only




/**
 * @const
 * More accurate filenames in 9p debug messages at the cost of performance.
 */
const TRACK_FILENAMES = false;

// Feature bit (bit position) for mount tag.
const VIRTIO_9P_F_MOUNT_TAG = 0;
// Assumed max tag length in bytes.
const VIRTIO_9P_MAX_TAGLEN = 254;

const MAX_REPLYBUFFER_SIZE = 16 * 1024 * 1024;

// TODO
// flush

const EPERM = 1;       /* Operation not permitted */
const ENOENT = 2;      /* No such file or directory */
const EEXIST = 17;      /* File exists */
const EINVAL = 22;     /* Invalid argument */
const EOPNOTSUPP = 95;  /* Operation is not supported */
const ENOTEMPTY = 39;  /* Directory not empty */
const EPROTO    = 71;  /* Protocol error */

var P9_SETATTR_MODE = 0x00000001;
var P9_SETATTR_UID = 0x00000002;
var P9_SETATTR_GID = 0x00000004;
var P9_SETATTR_SIZE = 0x00000008;
var P9_SETATTR_ATIME = 0x00000010;
var P9_SETATTR_MTIME = 0x00000020;
var P9_SETATTR_CTIME = 0x00000040;
var P9_SETATTR_ATIME_SET = 0x00000080;
var P9_SETATTR_MTIME_SET = 0x00000100;

var P9_STAT_MODE_DIR = 0x80000000;
var P9_STAT_MODE_APPEND = 0x40000000;
var P9_STAT_MODE_EXCL = 0x20000000;
var P9_STAT_MODE_MOUNT = 0x10000000;
var P9_STAT_MODE_AUTH = 0x08000000;
var P9_STAT_MODE_TMP = 0x04000000;
var P9_STAT_MODE_SYMLINK = 0x02000000;
var P9_STAT_MODE_LINK = 0x01000000;
var P9_STAT_MODE_DEVICE = 0x00800000;
var P9_STAT_MODE_NAMED_PIPE = 0x00200000;
var P9_STAT_MODE_SOCKET = 0x00100000;
var P9_STAT_MODE_SETUID = 0x00080000;
var P9_STAT_MODE_SETGID = 0x00040000;
var P9_STAT_MODE_SETVTX = 0x00010000;

const P9_LOCK_TYPE_RDLCK = 0;
const P9_LOCK_TYPE_WRLCK = 1;
const P9_LOCK_TYPE_UNLCK = 2;
const P9_LOCK_TYPES = ["shared", "exclusive", "unlock"];

const P9_LOCK_FLAGS_BLOCK = 1;
const P9_LOCK_FLAGS_RECLAIM = 2;

const P9_LOCK_SUCCESS = 0;
const P9_LOCK_BLOCKED = 1;
const P9_LOCK_ERROR = 2;
const P9_LOCK_GRACE = 3;

var FID_NONE = -1;
var FID_INODE = 1;
var FID_XATTR = 2;

function range(size)
{
    return Array.from(Array(size).keys());
}

/**
 * @constructor
 *
 * @param {FS} filesystem
 * @param {CPU} cpu
 */
function Virtio9p(filesystem, cpu, bus) {
    /** @type {FS} */
    this.fs = filesystem;

    /** @const @type {BusConnector} */
    this.bus = bus;

    //this.configspace = [0x0, 0x4, 0x68, 0x6F, 0x73, 0x74]; // length of string and "host" string
    //this.configspace = [0x0, 0x9, 0x2F, 0x64, 0x65, 0x76, 0x2F, 0x72, 0x6F, 0x6F, 0x74 ]; // length of string and "/dev/root" string
    this.configspace_tagname = [0x68, 0x6F, 0x73, 0x74, 0x39, 0x70]; // "host9p" string
    this.configspace_taglen = this.configspace_tagname.length; // num bytes
    this.VERSION = "9P2000.L";
    this.BLOCKSIZE = 8192; // Let's define one page.
    this.msize = 8192; // maximum message size
    this.replybuffer = new Uint8Array(this.msize*2); // Twice the msize to stay on the safe site
    this.replybuffersize = 0;

    this.fids = [];

    /** @type {VirtIO} */
    this.virtio = new VirtIO(cpu,
    {
        name: "virtio-9p",
        pci_id: 0x06 << 3,
        device_id: 0x1049,
        subsystem_device_id: 9,
        common:
        {
            initial_port: 0xA800,
            queues:
            [
                {
                    size_supported: 32,
                    notify_offset: 0,
                },
            ],
            features:
            [
                VIRTIO_9P_F_MOUNT_TAG,
                VIRTIO_F_VERSION_1,
                VIRTIO_F_RING_EVENT_IDX,
                VIRTIO_F_RING_INDIRECT_DESC,
            ],
            on_driver_ok: () => {},
        },
        notification:
        {
            initial_port: 0xA900,
            single_handler: false,
            handlers:
            [
                (queue_id) =>
                {
                    if(queue_id !== 0)
                    {
                        dbg_assert(false, "Virtio9P Notified for non-existent queue: " + queue_id +
                            " (expected queue_id of 0)");
                        return;
                    }
                    while(this.virtqueue.has_request())
                    {
                        const bufchain = this.virtqueue.pop_request();
                        this.ReceiveRequest(bufchain);
                    }
                    this.virtqueue.notify_me_after(0);
                    // Don't flush replies here: async replies are not completed yet.
                },
            ],
        },
        isr_status:
        {
            initial_port: 0xA700,
        },
        device_specific:
        {
            initial_port: 0xA600,
            struct:
            [
                {
                    bytes: 2,
                    name: "mount tag length",
                    read: () => this.configspace_taglen,
                    write: data => { /* read only */ },
                },
            ].concat(range(VIRTIO_9P_MAX_TAGLEN).map(index =>
                ({
                    bytes: 1,
                    name: "mount tag name " + index,
                    // Note: configspace_tagname may have changed after set_state
                    read: () => this.configspace_tagname[index] || 0,
                    write: data => { /* read only */ },
                })
            )),
        },
    });
    this.virtqueue = this.virtio.queues[0];
}

Virtio9p.prototype.get_state = function()
{
    var state = [];

    state[0] = this.configspace_tagname;
    state[1] = this.configspace_taglen;
    state[2] = this.virtio;
    state[3] = this.VERSION;
    state[4] = this.BLOCKSIZE;
    state[5] = this.msize;
    state[6] = this.replybuffer;
    state[7] = this.replybuffersize;
    state[8] = this.fids.map(function(f) { return [f.inodeid, f.type, f.uid, f.dbg_name]; });
    state[9] = this.fs;

    return state;
};

Virtio9p.prototype.set_state = function(state)
{
    this.configspace_tagname = state[0];
    this.configspace_taglen = state[1];
    this.virtio.set_state(state[2]);
    this.virtqueue = this.virtio.queues[0];
    this.VERSION = state[3];
    this.BLOCKSIZE = state[4];
    this.msize = state[5];
    this.replybuffer = state[6];
    this.replybuffersize = state[7];
    this.fids = state[8].map(function(f)
    {
        return { inodeid: f[0], type: f[1], uid: f[2], dbg_name: f[3] };
    });
    this.fs.set_state(state[9]);
};

// Note: dbg_name is only used for debugging messages and may not be the same as the filename,
// since it is not synchronised with renames done outside of 9p. Hard-links, linking and unlinking
// operations also mean that having a single filename no longer makes sense.
// Set TRACK_FILENAMES = true to sync dbg_name during 9p renames.
Virtio9p.prototype.Createfid = function(inodeid, type, uid, dbg_name) {
    return {inodeid, type, uid, dbg_name};
};

Virtio9p.prototype.update_dbg_name = function(idx, newname)
{
    for(const fid of this.fids)
    {
        if(fid.inodeid === idx) fid.dbg_name = newname;
    }
};

Virtio9p.prototype.reset = function() {
    this.fids = [];
    this.virtio.reset();
};


Virtio9p.prototype.BuildReply = function(id, tag, payloadsize) {
    dbg_assert(payloadsize >= 0, "9P: Negative payload size");
    marshall.Marshall(["w", "b", "h"], [payloadsize+7, id+1, tag], this.replybuffer, 0);
    if((payloadsize+7) >= this.replybuffer.length) {
        dbg_log("Error in 9p: payloadsize exceeds maximum length", LOG_9P);
    }
    //for(var i=0; i<payload.length; i++)
    //    this.replybuffer[7+i] = payload[i];
    this.replybuffersize = payloadsize+7;
};

Virtio9p.prototype.SendError = function (tag, errormsg, errorcode) {
    //var size = marshall.Marshall(["s", "w"], [errormsg, errorcode], this.replybuffer, 7);
    var size = marshall.Marshall(["w"], [errorcode], this.replybuffer, 7);
    this.BuildReply(6, tag, size);
};

Virtio9p.prototype.SendReply = function (bufchain) {
    dbg_assert(this.replybuffersize >= 0, "9P: Negative replybuffersize");
    bufchain.set_next_blob(this.replybuffer.subarray(0, this.replybuffersize));
    this.virtqueue.push_reply(bufchain);
    this.virtqueue.flush_replies();
};

Virtio9p.prototype.ReceiveRequest = async function (bufchain) {
    // TODO: split into header + data blobs to avoid unnecessary copying.
    const buffer = new Uint8Array(bufchain.length_readable);
    bufchain.get_next_blob(buffer);

    const state = { offset : 0 };
    var header = marshall.Unmarshall(["w", "b", "h"], buffer, state);
    var size = header[0];
    var id = header[1];
    var tag = header[2];
    //dbg_log("size:" + size + " id:" + id + " tag:" + tag, LOG_9P);

    switch(id)
    {
        case 8: // statfs
            size = this.fs.GetTotalSize(); // size used by all files
            var space = this.fs.GetSpace();
            var req = [];
            req[0] = 0x01021997;
            req[1] = this.BLOCKSIZE; // optimal transfer block size
            req[2] = Math.floor(space/req[1]); // free blocks
            req[3] = req[2] - Math.floor(size/req[1]); // free blocks in fs
            req[4] = req[2] - Math.floor(size/req[1]); // free blocks avail to non-superuser
            req[5] = this.fs.CountUsedInodes(); // total number of inodes
            req[6] = this.fs.CountFreeInodes();
            req[7] = 0; // file system id?
            req[8] = 256; // maximum length of filenames

            size = marshall.Marshall(["w", "w", "d", "d", "d", "d", "d", "d", "w"], req, this.replybuffer, 7);
            this.BuildReply(id, tag, size);
            this.SendReply(bufchain);
            break;

        case 112: // topen
        case 12: // tlopen
            var req = marshall.Unmarshall(["w", "w"], buffer, state);
            var fid = req[0];
            var mode = req[1];
            dbg_log("[open] fid=" + fid + ", mode=" + mode, LOG_9P);
            var idx = this.fids[fid].inodeid;
            var inode = this.fs.GetInode(idx);
            dbg_log("file open " + this.fids[fid].dbg_name, LOG_9P);
            //if (inode.status === STATUS_LOADING) return;
            var ret = this.fs.OpenInode(idx, mode);

            this.fs.AddEvent(this.fids[fid].inodeid,
                function() {
                    dbg_log("file opened " + this.fids[fid].dbg_name + " tag:"+tag, LOG_9P);
                    var req = [];
                    req[0] = inode.qid;
                    req[1] = this.msize - 24;
                    marshall.Marshall(["Q", "w"], req, this.replybuffer, 7);
                    this.BuildReply(id, tag, 13+4);
                    this.SendReply(bufchain);
                }.bind(this)
            );
            break;

        case 70: // link
            var req = marshall.Unmarshall(["w", "w", "s"], buffer, state);
            var dfid = req[0];
            var fid = req[1];
            var name = req[2];
            dbg_log("[link] dfid=" + dfid + ", name=" + name, LOG_9P);

            var ret = this.fs.Link(this.fids[dfid].inodeid, this.fids[fid].inodeid, name);

            if(ret < 0)
            {
                let error_message = "";
                if(ret === -EPERM) error_message = "Operation not permitted";
                else
                {
                    error_message = "Unknown error: " + (-ret);
                    dbg_assert(false, "[link]: Unexpected error code: " + (-ret));
                }
                this.SendError(tag, error_message, -ret);
                this.SendReply(bufchain);
                break;
            }

            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 16: // symlink
            var req = marshall.Unmarshall(["w", "s", "s", "w"], buffer, state);
            var fid = req[0];
            var name = req[1];
            var symgt = req[2];
            var gid = req[3];
            dbg_log("[symlink] fid=" + fid + ", name=" + name + ", symgt=" + symgt + ", gid=" + gid, LOG_9P);
            var idx = this.fs.CreateSymlink(name, this.fids[fid].inodeid, symgt);
            var inode = this.fs.GetInode(idx);
            inode.uid = this.fids[fid].uid;
            inode.gid = gid;
            marshall.Marshall(["Q"], [inode.qid], this.replybuffer, 7);
            this.BuildReply(id, tag, 13);
            this.SendReply(bufchain);
            break;

        case 18: // mknod
            var req = marshall.Unmarshall(["w", "s", "w", "w", "w", "w"], buffer, state);
            var fid = req[0];
            var name = req[1];
            var mode = req[2];
            var major = req[3];
            var minor = req[4];
            var gid = req[5];
            dbg_log("[mknod] fid=" + fid + ", name=" + name + ", major=" + major + ", minor=" + minor+ "", LOG_9P);
            var idx = this.fs.CreateNode(name, this.fids[fid].inodeid, major, minor);
            var inode = this.fs.GetInode(idx);
            inode.mode = mode;
            //inode.mode = mode | S_IFCHR; // XXX: fails "Mknod - fifo" test
            inode.uid = this.fids[fid].uid;
            inode.gid = gid;
            marshall.Marshall(["Q"], [inode.qid], this.replybuffer, 7);
            this.BuildReply(id, tag, 13);
            this.SendReply(bufchain);
            break;


        case 22: // TREADLINK
            var req = marshall.Unmarshall(["w"], buffer, state);
            var fid = req[0];
            var inode = this.fs.GetInode(this.fids[fid].inodeid);
            dbg_log("[readlink] fid=" + fid + " name=" + this.fids[fid].dbg_name + " target=" + inode.symlink, LOG_9P);
            size = marshall.Marshall(["s"], [inode.symlink], this.replybuffer, 7);
            this.BuildReply(id, tag, size);
            this.SendReply(bufchain);
            break;


        case 72: // tmkdir
            var req = marshall.Unmarshall(["w", "s", "w", "w"], buffer, state);
            var fid = req[0];
            var name = req[1];
            var mode = req[2];
            var gid = req[3];
            dbg_log("[mkdir] fid=" + fid + ", name=" + name + ", mode=" + mode + ", gid=" + gid, LOG_9P);
            var idx = this.fs.CreateDirectory(name, this.fids[fid].inodeid);
            var inode = this.fs.GetInode(idx);
            inode.mode = mode | S_IFDIR;
            inode.uid = this.fids[fid].uid;
            inode.gid = gid;
            marshall.Marshall(["Q"], [inode.qid], this.replybuffer, 7);
            this.BuildReply(id, tag, 13);
            this.SendReply(bufchain);
            break;

        case 14: // tlcreate
            var req = marshall.Unmarshall(["w", "s", "w", "w", "w"], buffer, state);
            var fid = req[0];
            var name = req[1];
            var flags = req[2];
            var mode = req[3];
            var gid = req[4];
            this.bus.send("9p-create", [name, this.fids[fid].inodeid]);
            dbg_log("[create] fid=" + fid + ", name=" + name + ", flags=" + flags + ", mode=" + mode + ", gid=" + gid, LOG_9P);
            var idx = this.fs.CreateFile(name, this.fids[fid].inodeid);
            this.fids[fid].inodeid = idx;
            this.fids[fid].type = FID_INODE;
            this.fids[fid].dbg_name = name;
            var inode = this.fs.GetInode(idx);
            inode.uid = this.fids[fid].uid;
            inode.gid = gid;
            inode.mode = mode | S_IFREG;
            marshall.Marshall(["Q", "w"], [inode.qid, this.msize - 24], this.replybuffer, 7);
            this.BuildReply(id, tag, 13+4);
            this.SendReply(bufchain);
            break;

        case 52: // lock
            var req = marshall.Unmarshall(["w", "b", "w", "d", "d", "w", "s"], buffer, state);
            var fid = req[0];
            var flags = req[2];
            var lock_length = req[4] === 0 ? Infinity : req[4];
            var lock_request = this.fs.DescribeLock(req[1], req[3], lock_length, req[5], req[6]);
            dbg_log("[lock] fid=" + fid +
                ", type=" + P9_LOCK_TYPES[lock_request.type] + ", start=" + lock_request.start +
                ", length=" + lock_request.length + ", proc_id=" + lock_request.proc_id);

            var ret = this.fs.Lock(this.fids[fid].inodeid, lock_request, flags);

            marshall.Marshall(["b"], [ret], this.replybuffer, 7);
            this.BuildReply(id, tag, 1);
            this.SendReply(bufchain);
            break;

        case 54: // getlock
            var req = marshall.Unmarshall(["w", "b", "d", "d", "w", "s"], buffer, state);
            var fid = req[0];
            var lock_length = req[3] === 0 ? Infinity : req[3];
            var lock_request = this.fs.DescribeLock(req[1], req[2], lock_length, req[4], req[5]);
            dbg_log("[getlock] fid=" + fid +
                ", type=" + P9_LOCK_TYPES[lock_request.type] + ", start=" + lock_request.start +
                ", length=" + lock_request.length + ", proc_id=" + lock_request.proc_id);

            var ret = this.fs.GetLock(this.fids[fid].inodeid, lock_request);

            if(!ret)
            {
                ret = lock_request;
                ret.type = P9_LOCK_TYPE_UNLCK;
            }

            var ret_length = ret.length === Infinity ? 0 : ret.length;

            size = marshall.Marshall(["b", "d", "d", "w", "s"],
                [ret.type, ret.start, ret_length, ret.proc_id, ret.client_id],
                this.replybuffer, 7);

            this.BuildReply(id, tag, size);
            this.SendReply(bufchain);
            break;

        case 24: // getattr
            var req = marshall.Unmarshall(["w", "d"], buffer, state);
            var fid = req[0];
            var inode = this.fs.GetInode(this.fids[fid].inodeid);
            dbg_log("[getattr]: fid=" + fid + " name=" + this.fids[fid].dbg_name + " request mask=" + req[1], LOG_9P);
            if(!inode || inode.status === STATUS_UNLINKED)
            {
                dbg_log("getattr: unlinked", LOG_9P);
                this.SendError(tag, "No such file or directory", ENOENT);
                this.SendReply(bufchain);
                break;
            }
            req[0] = req[1]; // request mask
            req[1] = inode.qid;

            req[2] = inode.mode;
            req[3] = inode.uid; // user id
            req[4] = inode.gid; // group id

            req[5] = inode.nlinks; // number of hard links
            req[6] = (inode.major<<8) | (inode.minor); // device id low
            req[7] = inode.size; // size low
            req[8] = this.BLOCKSIZE;
            req[9] = Math.floor(inode.size/512+1); // blk size low
            req[10] = inode.atime; // atime
            req[11] = 0x0;
            req[12] = inode.mtime; // mtime
            req[13] = 0x0;
            req[14] = inode.ctime; // ctime
            req[15] = 0x0;
            req[16] = 0x0; // btime
            req[17] = 0x0;
            req[18] = 0x0; // st_gen
            req[19] = 0x0; // data_version
            marshall.Marshall([
            "d", "Q",
            "w",
            "w", "w",
            "d", "d",
            "d", "d", "d",
            "d", "d", // atime
            "d", "d", // mtime
            "d", "d", // ctime
            "d", "d", // btime
            "d", "d",
            ], req, this.replybuffer, 7);
            this.BuildReply(id, tag, 8 + 13 + 4 + 4+ 4 + 8*15);
            this.SendReply(bufchain);
            break;

        case 26: // setattr
            var req = marshall.Unmarshall(["w", "w",
                "w", // mode
                "w", "w", // uid, gid
                "d", // size
                "d", "d", // atime
                "d", "d", // mtime
            ], buffer, state);
            var fid = req[0];
            var inode = this.fs.GetInode(this.fids[fid].inodeid);
            dbg_log("[setattr]: fid=" + fid + " request mask=" + req[1] + " name=" + this.fids[fid].dbg_name, LOG_9P);
            if(req[1] & P9_SETATTR_MODE) {
                // XXX: check mode (S_IFREG or S_IFDIR or similar should be set)
                inode.mode = req[2];
            }
            if(req[1] & P9_SETATTR_UID) {
                inode.uid = req[3];
            }
            if(req[1] & P9_SETATTR_GID) {
                inode.gid = req[4];
            }
            if(req[1] & P9_SETATTR_ATIME) {
                inode.atime = Math.floor((new Date()).getTime()/1000);
            }
            if(req[1] & P9_SETATTR_MTIME) {
                inode.mtime = Math.floor((new Date()).getTime()/1000);
            }
            if(req[1] & P9_SETATTR_CTIME) {
                inode.ctime = Math.floor((new Date()).getTime()/1000);
            }
            if(req[1] & P9_SETATTR_ATIME_SET) {
                inode.atime = req[6];
            }
            if(req[1] & P9_SETATTR_MTIME_SET) {
                inode.mtime = req[8];
            }
            if(req[1] & P9_SETATTR_SIZE) {
                await this.fs.ChangeSize(this.fids[fid].inodeid, req[5]);
            }
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 50: // fsync
            var req = marshall.Unmarshall(["w", "d"], buffer, state);
            var fid = req[0];
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 40: // TREADDIR
        case 116: // read
            var req = marshall.Unmarshall(["w", "d", "w"], buffer, state);
            var fid = req[0];
            var offset = req[1];
            var count = req[2];
            var inode = this.fs.GetInode(this.fids[fid].inodeid);
            if(id === 40) dbg_log("[treaddir]: fid=" + fid + " offset=" + offset + " count=" + count, LOG_9P);
            if(id === 116) dbg_log("[read]: fid=" + fid + " (" + this.fids[fid].dbg_name + ") offset=" + offset + " count=" + count + " fidtype=" + this.fids[fid].type, LOG_9P);
            if(!inode || inode.status === STATUS_UNLINKED)
            {
                dbg_log("read/treaddir: unlinked", LOG_9P);
                this.SendError(tag, "No such file or directory", ENOENT);
                this.SendReply(bufchain);
                break;
            }
            if(this.fids[fid].type === FID_XATTR) {
                if(inode.caps.length < offset+count) count = inode.caps.length - offset;
                for(var i=0; i<count; i++)
                    this.replybuffer[7+4+i] = inode.caps[offset+i];
                marshall.Marshall(["w"], [count], this.replybuffer, 7);
                this.BuildReply(id, tag, 4 + count);
                this.SendReply(bufchain);
            } else {
                this.fs.OpenInode(this.fids[fid].inodeid, undefined);
                const inodeid = this.fids[fid].inodeid;

                count = Math.min(count, this.replybuffer.length - (7 + 4));

                if(inode.size < offset+count) count = inode.size - offset;
                else if(id === 40)
                {
                    // for directories, return whole number of dir-entries.
                    count = this.fs.RoundToDirentry(inodeid, offset + count) - offset;
                }
                if(offset > inode.size)
                {
                    // offset can be greater than available - should return count of zero.
                    // See http://ericvh.github.io/9p-rfc/rfc9p2000.html#anchor30
                    count = 0;
                }

                this.bus.send("9p-read-start", [this.fids[fid].dbg_name]);

                const data = await this.fs.Read(inodeid, offset, count);

                this.bus.send("9p-read-end", [this.fids[fid].dbg_name, count]);

                if(data) {
                    this.replybuffer.set(data, 7 + 4);
                }
                marshall.Marshall(["w"], [count], this.replybuffer, 7);
                this.BuildReply(id, tag, 4 + count);
                this.SendReply(bufchain);
            }
            break;

        case 118: // write
            var req = marshall.Unmarshall(["w", "d", "w"], buffer, state);
            var fid = req[0];
            var offset = req[1];
            var count = req[2];

            const filename = this.fids[fid].dbg_name;

            dbg_log("[write]: fid=" + fid + " (" + filename + ") offset=" + offset + " count=" + count + " fidtype=" + this.fids[fid].type, LOG_9P);
            if(this.fids[fid].type === FID_XATTR)
            {
                // XXX: xattr not supported yet. Ignore write.
                this.SendError(tag, "Setxattr not supported", EOPNOTSUPP);
                this.SendReply(bufchain);
                break;
            }
            else
            {
                // XXX: Size of the subarray is unchecked
                await this.fs.Write(this.fids[fid].inodeid, offset, count, buffer.subarray(state.offset));
            }

            this.bus.send("9p-write-end", [filename, count]);

            marshall.Marshall(["w"], [count], this.replybuffer, 7);
            this.BuildReply(id, tag, 4);
            this.SendReply(bufchain);
            break;

        case 74: // RENAMEAT
            var req = marshall.Unmarshall(["w", "s", "w", "s"], buffer, state);
            var olddirfid = req[0];
            var oldname = req[1];
            var newdirfid = req[2];
            var newname = req[3];
            dbg_log("[renameat]: oldname=" + oldname + " newname=" + newname, LOG_9P);
            var ret = await this.fs.Rename(this.fids[olddirfid].inodeid, oldname, this.fids[newdirfid].inodeid, newname);
            if(ret < 0) {
                let error_message = "";
                if(ret === -ENOENT) error_message = "No such file or directory";
                else if(ret === -EPERM) error_message = "Operation not permitted";
                else if(ret === -ENOTEMPTY) error_message = "Directory not empty";
                else
                {
                    error_message = "Unknown error: " + (-ret);
                    dbg_assert(false, "[renameat]: Unexpected error code: " + (-ret));
                }
                this.SendError(tag, error_message, -ret);
                this.SendReply(bufchain);
                break;
            }
            if(TRACK_FILENAMES)
            {
                const newidx = this.fs.Search(this.fids[newdirfid].inodeid, newname);
                this.update_dbg_name(newidx, newname);
            }
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 76: // TUNLINKAT
            var req = marshall.Unmarshall(["w", "s", "w"], buffer, state);
            var dirfd = req[0];
            var name = req[1];
            var flags = req[2];
            dbg_log("[unlink]: dirfd=" + dirfd + " name=" + name + " flags=" + flags, LOG_9P);
            var fid = this.fs.Search(this.fids[dirfd].inodeid, name);
            if(fid === -1) {
                   this.SendError(tag, "No such file or directory", ENOENT);
                   this.SendReply(bufchain);
                   break;
            }
            var ret = this.fs.Unlink(this.fids[dirfd].inodeid, name);
            if(ret < 0) {
                let error_message = "";
                if(ret === -ENOTEMPTY) error_message = "Directory not empty";
                else if(ret === -EPERM) error_message = "Operation not permitted";
                else
                {
                    error_message = "Unknown error: " + (-ret);
                    dbg_assert(false, "[unlink]: Unexpected error code: " + (-ret));
                }
                this.SendError(tag, error_message, -ret);
                this.SendReply(bufchain);
                break;
            }
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 100: // version
            var version = marshall.Unmarshall(["w", "s"], buffer, state);
            dbg_log("[version]: msize=" + version[0] + " version=" + version[1], LOG_9P);
            if(this.msize !== version[0])
            {
                this.msize = version[0];
                this.replybuffer = new Uint8Array(Math.min(MAX_REPLYBUFFER_SIZE, this.msize*2));
            }
            size = marshall.Marshall(["w", "s"], [this.msize, this.VERSION], this.replybuffer, 7);
            this.BuildReply(id, tag, size);
            this.SendReply(bufchain);
            break;

        case 104: // attach
            // return root directorie's QID
            var req = marshall.Unmarshall(["w", "w", "s", "s", "w"], buffer, state);
            var fid = req[0];
            var uid = req[4];
            dbg_log("[attach]: fid=" + fid + " afid=" + h(req[1]) + " uname=" + req[2] + " aname=" + req[3], LOG_9P);
            this.fids[fid] = this.Createfid(0, FID_INODE, uid, "");
            var inode = this.fs.GetInode(this.fids[fid].inodeid);
            marshall.Marshall(["Q"], [inode.qid], this.replybuffer, 7);
            this.BuildReply(id, tag, 13);
            this.SendReply(bufchain);
            this.bus.send("9p-attach");
            break;

        case 108: // tflush
            var req = marshall.Unmarshall(["h"], buffer, state);
            var oldtag = req[0];
            dbg_log("[flush] " + tag, LOG_9P);
            //marshall.Marshall(["Q"], [inode.qid], this.replybuffer, 7);
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;


        case 110: // walk
            var req = marshall.Unmarshall(["w", "w", "h"], buffer, state);
            var fid = req[0];
            var nwfid = req[1];
            var nwname = req[2];
            dbg_log("[walk]: fid=" + req[0] + " nwfid=" + req[1] + " nwname=" + nwname, LOG_9P);
            if(nwname === 0) {
                this.fids[nwfid] = this.Createfid(this.fids[fid].inodeid, FID_INODE, this.fids[fid].uid, this.fids[fid].dbg_name);
                //this.fids[nwfid].inodeid = this.fids[fid].inodeid;
                marshall.Marshall(["h"], [0], this.replybuffer, 7);
                this.BuildReply(id, tag, 2);
                this.SendReply(bufchain);
                break;
            }
            var wnames = [];
            for(var i=0; i<nwname; i++) {
                wnames.push("s");
            }
            var walk = marshall.Unmarshall(wnames, buffer, state);
            var idx = this.fids[fid].inodeid;
            var offset = 7+2;
            var nwidx = 0;
            //console.log(idx, this.fs.GetInode(idx));
            dbg_log("walk in dir " + this.fids[fid].dbg_name  + " to: " + walk.toString(), LOG_9P);
            for(var i=0; i<nwname; i++) {
                idx = this.fs.Search(idx, walk[i]);

                if(idx === -1) {
                   dbg_log("Could not find: " + walk[i], LOG_9P);
                   break;
                }
                offset += marshall.Marshall(["Q"], [this.fs.GetInode(idx).qid], this.replybuffer, offset);
                nwidx++;
                //dbg_log(this.fids[nwfid].inodeid, LOG_9P);
                //this.fids[nwfid].inodeid = idx;
                //this.fids[nwfid].type = FID_INODE;
                this.fids[nwfid] = this.Createfid(idx, FID_INODE, this.fids[fid].uid, walk[i]);
            }
            marshall.Marshall(["h"], [nwidx], this.replybuffer, 7);
            this.BuildReply(id, tag, offset-7);
            this.SendReply(bufchain);
            break;

        case 120: // clunk
            var req = marshall.Unmarshall(["w"], buffer, state);
            dbg_log("[clunk]: fid=" + req[0], LOG_9P);
            if(this.fids[req[0]] && this.fids[req[0]].inodeid >=  0) {
                await this.fs.CloseInode(this.fids[req[0]].inodeid);
                this.fids[req[0]].inodeid = -1;
                this.fids[req[0]].type = FID_NONE;
            }
            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            break;

        case 32: // txattrcreate
            var req = marshall.Unmarshall(["w", "s", "d", "w"], buffer, state);
            var fid = req[0];
            var name = req[1];
            var attr_size = req[2];
            var flags = req[3];
            dbg_log("[txattrcreate]: fid=" + fid + " name=" + name + " attr_size=" + attr_size + " flags=" + flags, LOG_9P);

            // XXX: xattr not supported yet. E.g. checks corresponding to the flags needed.
            this.fids[fid].type = FID_XATTR;

            this.BuildReply(id, tag, 0);
            this.SendReply(bufchain);
            //this.SendError(tag, "Operation i not supported",  EINVAL);
            //this.SendReply(bufchain);
            break;

        case 30: // xattrwalk
            var req = marshall.Unmarshall(["w", "w", "s"], buffer, state);
            var fid = req[0];
            var newfid = req[1];
            var name = req[2];
            dbg_log("[xattrwalk]: fid=" + req[0] + " newfid=" + req[1] + " name=" + req[2], LOG_9P);

            // Workaround for Linux restarts writes until full blocksize
            this.SendError(tag, "Setxattr not supported", EOPNOTSUPP);
            this.SendReply(bufchain);
            /*
            this.fids[newfid] = this.Createfid(this.fids[fid].inodeid, FID_NONE, this.fids[fid].uid, this.fids[fid].dbg_name);
            //this.fids[newfid].inodeid = this.fids[fid].inodeid;
            //this.fids[newfid].type = FID_NONE;
            var length = 0;
            if (name === "security.capability") {
                length = this.fs.PrepareCAPs(this.fids[fid].inodeid);
                this.fids[newfid].type = FID_XATTR;
            }
            marshall.Marshall(["d"], [length], this.replybuffer, 7);
            this.BuildReply(id, tag, 8);
            this.SendReply(bufchain);
            */
            break;

        default:
            dbg_log("Error in Virtio9p: Unknown id " + id + " received", LOG_9P);
            dbg_assert(false);
            //this.SendError(tag, "Operation i not supported",  EOPNOTSUPP);
            //this.SendReply(bufchain);
            break;
    }

    //consistency checks if there are problems with the filesystem
    //this.fs.Check();
};


// ---- File: src/kernel.js ----




// https://www.kernel.org/doc/Documentation/x86/boot.txt

const LINUX_BOOT_HDR_SETUP_SECTS = 0x1F1;
const LINUX_BOOT_HDR_SYSSIZE = 0x1F4;
const LINUX_BOOT_HDR_VIDMODE = 0x1FA;
const LINUX_BOOT_HDR_BOOT_FLAG = 0x1FE;
const LINUX_BOOT_HDR_HEADER = 0x202;
const LINUX_BOOT_HDR_VERSION = 0x206;
const LINUX_BOOT_HDR_TYPE_OF_LOADER = 0x210;
const LINUX_BOOT_HDR_LOADFLAGS = 0x211;
const LINUX_BOOT_HDR_CODE32_START = 0x214;
const LINUX_BOOT_HDR_RAMDISK_IMAGE = 0x218;
const LINUX_BOOT_HDR_RAMDISK_SIZE = 0x21C;
const LINUX_BOOT_HDR_HEAP_END_PTR = 0x224;
const LINUX_BOOT_HDR_CMD_LINE_PTR = 0x228;
const LINUX_BOOT_HDR_INITRD_ADDR_MAX = 0x22C;
const LINUX_BOOT_HDR_KERNEL_ALIGNMENT = 0x230;
const LINUX_BOOT_HDR_RELOCATABLE_KERNEL = 0x234;
const LINUX_BOOT_HDR_MIN_ALIGNMENT = 0x235;
const LINUX_BOOT_HDR_XLOADFLAGS = 0x236;
const LINUX_BOOT_HDR_CMDLINE_SIZE = 0x238;
const LINUX_BOOT_HDR_PAYLOAD_OFFSET = 0x248;
const LINUX_BOOT_HDR_PAYLOAD_LENGTH = 0x24C;
const LINUX_BOOT_HDR_PREF_ADDRESS = 0x258;
const LINUX_BOOT_HDR_INIT_SIZE = 0x260;

const LINUX_BOOT_HDR_CHECKSUM1 = 0xAA55;
const LINUX_BOOT_HDR_CHECKSUM2 = 0x53726448;

const LINUX_BOOT_HDR_TYPE_OF_LOADER_NOT_ASSIGNED = 0xFF;

const LINUX_BOOT_HDR_LOADFLAGS_LOADED_HIGH = 1 << 0;
const LINUX_BOOT_HDR_LOADFLAGS_QUIET_FLAG = 1 << 5;
const LINUX_BOOT_HDR_LOADFLAGS_KEEP_SEGMENTS = 1 << 6;
const LINUX_BOOT_HDR_LOADFLAGS_CAN_USE_HEAPS = 1 << 7;


function load_kernel(mem8, bzimage, initrd, cmdline)
{
    dbg_log("Trying to load kernel of size " + bzimage.byteLength);

    const KERNEL_HIGH_ADDRESS = 0x100000;

    // Put the initrd at the 64 MB boundary. This means the minimum memory size
    // is 64 MB plus the size of the initrd.
    // Note: If set too low, kernel may fail to load the initrd with "invalid magic at start of compressed archive"
    const INITRD_ADDRESS = 64 << 20;

    const quiet = false;

    const bzimage8 = new Uint8Array(bzimage);
    const bzimage16 = new Uint16Array(bzimage);
    const bzimage32 = new Uint32Array(bzimage);

    const setup_sects = bzimage8[LINUX_BOOT_HDR_SETUP_SECTS] || 4;
    const syssize = bzimage32[LINUX_BOOT_HDR_SYSSIZE >> 2] << 4;

    const vidmode = bzimage16[LINUX_BOOT_HDR_VIDMODE >> 1];

    const checksum1 = bzimage16[LINUX_BOOT_HDR_BOOT_FLAG >> 1];
    if(checksum1 !== LINUX_BOOT_HDR_CHECKSUM1)
    {
        dbg_log("Bad checksum1: " + h(checksum1));
        return;
    }

    // Not aligned, so split into two 16-bit reads
    const checksum2 =
        bzimage16[LINUX_BOOT_HDR_HEADER >> 1] |
        bzimage16[LINUX_BOOT_HDR_HEADER + 2 >> 1] << 16;
    if(checksum2 !== LINUX_BOOT_HDR_CHECKSUM2)
    {
        dbg_log("Bad checksum2: " + h(checksum2));
        return;
    }

    const protocol = bzimage16[LINUX_BOOT_HDR_VERSION >> 1];
    dbg_assert(protocol >= 0x202); // older not supported by us

    const flags = bzimage8[LINUX_BOOT_HDR_LOADFLAGS];
    dbg_assert(flags & LINUX_BOOT_HDR_LOADFLAGS_LOADED_HIGH); // low kernels not supported by us

    // we don't relocate the kernel, so we don't care much about most of these

    const flags2 = bzimage16[LINUX_BOOT_HDR_XLOADFLAGS >> 1];
    const initrd_addr_max = bzimage32[LINUX_BOOT_HDR_INITRD_ADDR_MAX >> 2];
    const kernel_alignment = bzimage32[LINUX_BOOT_HDR_KERNEL_ALIGNMENT >> 2];
    const relocatable_kernel = bzimage8[LINUX_BOOT_HDR_RELOCATABLE_KERNEL];
    const min_alignment = bzimage8[LINUX_BOOT_HDR_MIN_ALIGNMENT];
    const cmdline_size = protocol >= 0x206 ? bzimage32[LINUX_BOOT_HDR_CMDLINE_SIZE >> 2] : 255;
    const payload_offset = bzimage32[LINUX_BOOT_HDR_PAYLOAD_OFFSET >> 2];
    const payload_length = bzimage32[LINUX_BOOT_HDR_PAYLOAD_LENGTH >> 2];
    const pref_address = bzimage32[LINUX_BOOT_HDR_PREF_ADDRESS >> 2];
    const pref_address_high = bzimage32[LINUX_BOOT_HDR_PREF_ADDRESS + 4 >> 2];
    const init_size = bzimage32[LINUX_BOOT_HDR_INIT_SIZE >> 2];

    dbg_log("kernel boot protocol version: " + h(protocol));
    dbg_log("flags=" + h(flags) + " xflags=" + h(flags2));
    dbg_log("code32_start=" + h(bzimage32[LINUX_BOOT_HDR_CODE32_START >> 2]));
    dbg_log("initrd_addr_max=" + h(initrd_addr_max));
    dbg_log("kernel_alignment=" + h(kernel_alignment));
    dbg_log("relocatable=" + relocatable_kernel);
    dbg_log("min_alignment=" + h(min_alignment));
    dbg_log("cmdline max=" + h(cmdline_size));
    dbg_log("payload offset=" + h(payload_offset) + " size=" + h(payload_length));
    dbg_log("pref_address=" + h(pref_address_high) + ":" + h(pref_address));
    dbg_log("init_size=" + h(init_size));

    const real_mode_segment = 0x8000;
    const base_ptr = real_mode_segment << 4;

    const heap_end = 0xE000;
    const heap_end_ptr = heap_end - 0x200;

    // fill in the kernel boot header with infos the kernel needs to know

    bzimage8[LINUX_BOOT_HDR_TYPE_OF_LOADER] = LINUX_BOOT_HDR_TYPE_OF_LOADER_NOT_ASSIGNED;

    const new_flags =
        (quiet ? flags | LINUX_BOOT_HDR_LOADFLAGS_QUIET_FLAG : flags & ~LINUX_BOOT_HDR_LOADFLAGS_QUIET_FLAG)
        & ~LINUX_BOOT_HDR_LOADFLAGS_KEEP_SEGMENTS
        | LINUX_BOOT_HDR_LOADFLAGS_CAN_USE_HEAPS;
    bzimage8[LINUX_BOOT_HDR_LOADFLAGS] = new_flags;

    bzimage16[LINUX_BOOT_HDR_HEAP_END_PTR >> 1] = heap_end_ptr;

    // should parse the vga=... paramter from cmdline here, but we don't really care
    bzimage16[LINUX_BOOT_HDR_VIDMODE >> 1] = 0xFFFF; // normal

    dbg_log("heap_end_ptr=" + h(heap_end_ptr));

    cmdline += "\x00";
    dbg_assert(cmdline.length < cmdline_size);

    const cmd_line_ptr = base_ptr + heap_end;
    dbg_log("cmd_line_ptr=" + h(cmd_line_ptr));

    bzimage32[LINUX_BOOT_HDR_CMD_LINE_PTR >> 2] = cmd_line_ptr;
    for(let i = 0; i < cmdline.length; i++)
    {
        mem8[cmd_line_ptr + i] = cmdline.charCodeAt(i);
    }

    const prot_mode_kernel_start = (setup_sects + 1) * 512;
    dbg_log("prot_mode_kernel_start=" + h(prot_mode_kernel_start));

    const real_mode_kernel = new Uint8Array(bzimage, 0, prot_mode_kernel_start);
    const protected_mode_kernel = new Uint8Array(bzimage, prot_mode_kernel_start);

    let ramdisk_address = 0;
    let ramdisk_size = 0;

    if(initrd)
    {
        ramdisk_address = INITRD_ADDRESS;
        ramdisk_size = initrd.byteLength;

        dbg_assert(KERNEL_HIGH_ADDRESS + protected_mode_kernel.length < ramdisk_address);

        mem8.set(new Uint8Array(initrd), ramdisk_address);
    }

    bzimage32[LINUX_BOOT_HDR_RAMDISK_IMAGE >> 2] = ramdisk_address;
    bzimage32[LINUX_BOOT_HDR_RAMDISK_SIZE >> 2] = ramdisk_size;

    dbg_assert(base_ptr + real_mode_kernel.length < 0xA0000);

    mem8.set(real_mode_kernel, base_ptr);
    mem8.set(protected_mode_kernel, KERNEL_HIGH_ADDRESS);

    return {
        name: "genroms/kernel.bin",
        data: make_linux_boot_rom(real_mode_segment, heap_end),
    };
}

function make_linux_boot_rom(real_mode_segment, heap_end)
{
    // This rom will be executed by seabios after its initialisation
    // It sets up segment registers, the stack and calls the kernel real mode entry point

    const SIZE = 0x200;

    const data8 = new Uint8Array(SIZE);
    const data16 = new Uint16Array(data8.buffer);

    data16[0] = 0xAA55;
    data8[2] = SIZE / 0x200;

    let i = 3;

    data8[i++] = 0xFA; // cli
    data8[i++] = 0xB8; // mov ax, real_mode_segment
    data8[i++] = real_mode_segment >> 0;
    data8[i++] = real_mode_segment >> 8;
    data8[i++] = 0x8E; // mov es, ax
    data8[i++] = 0xC0;
    data8[i++] = 0x8E; // mov ds, ax
    data8[i++] = 0xD8;
    data8[i++] = 0x8E; // mov fs, ax
    data8[i++] = 0xE0;
    data8[i++] = 0x8E; // mov gs, ax
    data8[i++] = 0xE8;
    data8[i++] = 0x8E; // mov ss, ax
    data8[i++] = 0xD0;
    data8[i++] = 0xBC; // mov sp, heap_end
    data8[i++] = heap_end >> 0;
    data8[i++] = heap_end >> 8;
    data8[i++] = 0xEA; // jmp (real_mode_segment+0x20):0x0
    data8[i++] = 0x00;
    data8[i++] = 0x00;
    data8[i++] = real_mode_segment + 0x20 >> 0;
    data8[i++] = real_mode_segment + 0x20 >> 8;

    dbg_assert(i < SIZE);

    const checksum_index = i;
    data8[checksum_index] = 0;

    let checksum = 0;

    for(let i = 0; i < data8.length; i++)
    {
        checksum += data8[i];
    }

    data8[checksum_index] = -checksum;

    return data8;
}


// ---- File: src/cpu.js ----






























// For Types Only



// Resources:
// https://pdos.csail.mit.edu/6.828/2006/readings/i386/toc.htm
// https://www-ssl.intel.com/content/www/us/en/processors/architectures-software-developer-manuals.html
// http://ref.x86asm.net/geek32.html

const DUMP_GENERATED_WASM = false;
const DUMP_UNCOMPILED_ASSEMBLY = false;

/** @constructor */
function CPU(bus, wm, stop_idling)
{
    this.stop_idling = stop_idling;
    this.wm = wm;
    this.wasm_patch();
    this.create_jit_imports();

    const memory = this.wm.exports.memory;

    this.wasm_memory = memory;

    this.memory_size = view(Uint32Array, memory, 812, 1);

    this.mem8 = new Uint8Array(0);
    this.mem32s = new Int32Array(this.mem8.buffer);

    this.segment_is_null = view(Uint8Array, memory, 724, 8);
    this.segment_offsets = view(Int32Array, memory, 736, 8);
    this.segment_limits = view(Uint32Array, memory, 768, 8);
    this.segment_access_bytes = view(Uint8Array, memory, 512, 8);

    /**
     * Wheter or not in protected mode
     */
    this.protected_mode = view(Int32Array, memory, 800, 1);

    this.idtr_size = view(Int32Array, memory, 564, 1);
    this.idtr_offset = view(Int32Array, memory, 568, 1);

    /**
     * global descriptor table register
     */
    this.gdtr_size = view(Int32Array, memory, 572, 1);
    this.gdtr_offset = view(Int32Array, memory, 576, 1);

    this.tss_size_32 = view(Int32Array, memory, 1128, 1);

    /*
     * whether or not a page fault occured
     */
    this.page_fault = view(Uint32Array, memory, 540, 8);

    this.cr = view(Int32Array, memory, 580, 8);

    // current privilege level
    this.cpl = view(Uint8Array, memory, 612, 1);

    // current operand/address size
    this.is_32 = view(Int32Array, memory, 804, 1);

    this.stack_size_32 = view(Int32Array, memory, 808, 1);

    /**
     * Was the last instruction a hlt?
     */
    this.in_hlt = view(Uint8Array, memory, 616, 1);

    this.last_virt_eip = view(Int32Array, memory, 620, 1);
    this.eip_phys = view(Int32Array, memory, 624, 1);


    this.sysenter_cs = view(Int32Array, memory, 636, 1);

    this.sysenter_esp = view(Int32Array, memory, 640, 1);

    this.sysenter_eip = view(Int32Array, memory, 644, 1);

    this.prefixes = view(Int32Array, memory, 648, 1);

    this.flags = view(Int32Array, memory, 120, 1);

    /**
     * bitmap of flags which are not updated in the flags variable
     * changed by arithmetic instructions, so only relevant to arithmetic flags
     */
    this.flags_changed = view(Int32Array, memory, 100, 1);

    /**
     * enough infos about the last arithmetic operation to compute eflags
     */
    this.last_op_size = view(Int32Array, memory, 96, 1);
    this.last_op1 = view(Int32Array, memory, 104, 1);
    this.last_result = view(Int32Array, memory, 112, 1);

    this.current_tsc = view(Uint32Array, memory, 960, 2); // 64 bit

    /** @type {!Object} */
    this.devices = {};

    this.instruction_pointer = view(Int32Array, memory, 556, 1);
    this.previous_ip = view(Int32Array, memory, 560, 1);

    // configured by guest
    this.apic_enabled = view(Uint8Array, memory, 548, 1);
    // configured when the emulator starts (changes bios initialisation)
    this.acpi_enabled = view(Uint8Array, memory, 552, 1);

    // managed in io.js
    /** @const */ this.memory_map_read8 = [];
    /** @const */ this.memory_map_write8 = [];
    /** @const */ this.memory_map_read32 = [];
    /** @const */ this.memory_map_write32 = [];

    /**
     * @const
     * @type {{main: ArrayBuffer, vga: ArrayBuffer}}
     */
    this.bios = {
        main: null,
        vga: null,
    };

    this.instruction_counter = view(Uint32Array, memory, 664, 1);

    // registers
    this.reg32 = view(Int32Array, memory, 64, 8);

    this.fpu_st = view(Int32Array, memory, 1152, 4 * 8);

    this.fpu_stack_empty = view(Uint8Array, memory, 816, 1);
    this.fpu_stack_empty[0] = 0xFF;
    this.fpu_stack_ptr = view(Uint8Array, memory, 1032, 1);
    this.fpu_stack_ptr[0] = 0;

    this.fpu_control_word = view(Uint16Array, memory, 1036, 1);
    this.fpu_control_word[0] = 0x37F;
    this.fpu_status_word = view(Uint16Array, memory, 1040, 1);
    this.fpu_status_word[0] = 0;
    this.fpu_ip = view(Int32Array, memory, 1048, 1);
    this.fpu_ip[0] = 0;
    this.fpu_ip_selector = view(Int32Array, memory, 1052, 1);
    this.fpu_ip_selector[0] = 0;
    this.fpu_opcode = view(Int32Array, memory, 1044, 1);
    this.fpu_opcode[0] = 0;
    this.fpu_dp = view(Int32Array, memory, 1056, 1);
    this.fpu_dp[0] = 0;
    this.fpu_dp_selector = view(Int32Array, memory, 1060, 1);
    this.fpu_dp_selector[0] = 0;

    this.reg_xmm32s = view(Int32Array, memory, 832, 8 * 4);

    this.mxcsr = view(Int32Array, memory, 824, 1);

    // segment registers, tr and ldtr
    this.sreg = view(Uint16Array, memory, 668, 8);

    // debug registers
    this.dreg = view(Int32Array, memory, 684, 8);

    this.reg_pdpte = view(Int32Array, memory, 968, 8);

    this.svga_dirty_bitmap_min_offset = view(Uint32Array, memory, 716, 1);
    this.svga_dirty_bitmap_max_offset = view(Uint32Array, memory, 720, 1);

    this.fw_value = [];
    this.fw_pointer = 0;
    this.option_roms = [];

    this.io = undefined;

    this.bus = bus;

    this.set_tsc(0, 0);

    this.debug_init();

    if(DEBUG)
    {
        this.seen_code = {};
        this.seen_code_uncompiled = {};
    }

    //Object.seal(this);
}

CPU.prototype.mmap_read8 = function(addr)
{
    const value = this.memory_map_read8[addr >>> MMAP_BLOCK_BITS](addr);
    dbg_assert(value >= 0 && value <= 0xFF);
    return value;
};

CPU.prototype.mmap_write8 = function(addr, value)
{
    dbg_assert(value >= 0 && value <= 0xFF);
    this.memory_map_write8[addr >>> MMAP_BLOCK_BITS](addr, value);
};

CPU.prototype.mmap_read16 = function(addr)
{
    var fn = this.memory_map_read8[addr >>> MMAP_BLOCK_BITS];
    const value = fn(addr) | fn(addr + 1 | 0) << 8;
    dbg_assert(value >= 0 && value <= 0xFFFF);
    return value;
};

CPU.prototype.mmap_write16 = function(addr, value)
{
    var fn = this.memory_map_write8[addr >>> MMAP_BLOCK_BITS];

    dbg_assert(value >= 0 && value <= 0xFFFF);
    fn(addr, value & 0xFF);
    fn(addr + 1 | 0, value >> 8);
};

CPU.prototype.mmap_read32 = function(addr)
{
    var aligned_addr = addr >>> MMAP_BLOCK_BITS;

    return this.memory_map_read32[aligned_addr](addr);
};

CPU.prototype.mmap_write32 = function(addr, value)
{
    var aligned_addr = addr >>> MMAP_BLOCK_BITS;

    this.memory_map_write32[aligned_addr](addr, value);
};

CPU.prototype.mmap_write64 = function(addr, value0, value1)
{
    var aligned_addr = addr >>> MMAP_BLOCK_BITS;
    // This should hold since writes across pages are split up
    dbg_assert(aligned_addr === (addr + 7) >>> MMAP_BLOCK_BITS);

    var write_func32 = this.memory_map_write32[aligned_addr];
    write_func32(addr, value0);
    write_func32(addr + 4, value1);
};

CPU.prototype.mmap_write128 = function(addr, value0, value1, value2, value3)
{
    var aligned_addr = addr >>> MMAP_BLOCK_BITS;
    // This should hold since writes across pages are split up
    dbg_assert(aligned_addr === (addr + 12) >>> MMAP_BLOCK_BITS);

    var write_func32 = this.memory_map_write32[aligned_addr];
    write_func32(addr, value0);
    write_func32(addr + 4, value1);
    write_func32(addr + 8, value2);
    write_func32(addr + 12, value3);
};

/**
 * @param {Array.<number>|Uint8Array} blob
 * @param {number} offset
 */
CPU.prototype.write_blob = function(blob, offset)
{
    dbg_assert(blob && blob.length >= 0);

    if(blob.length)
    {
        dbg_assert(!this.in_mapped_range(offset));
        dbg_assert(!this.in_mapped_range(offset + blob.length - 1));

        this.jit_dirty_cache(offset, offset + blob.length);
        this.mem8.set(blob, offset);
    }
};

CPU.prototype.read_blob = function(offset, length)
{
    if(length)
    {
        dbg_assert(!this.in_mapped_range(offset));
        dbg_assert(!this.in_mapped_range(offset + length - 1));
    }
    return this.mem8.subarray(offset, offset + length);
};

CPU.prototype.clear_opstats = function()
{
    new Uint8Array(this.wasm_memory.buffer, 0x8000, 0x20000).fill(0);
    this.wm.exports["profiler_init"]();
};

CPU.prototype.create_jit_imports = function()
{
    // Set this.jit_imports as generated WASM modules will expect

    const jit_imports = Object.create(null);

    jit_imports["m"] = this.wm.exports["memory"];

    for(const name of Object.keys(this.wm.exports))
    {
        if(name.startsWith("_") || name.startsWith("zstd") || name.endsWith("_js"))
        {
            continue;
        }

        jit_imports[name] = this.wm.exports[name];
    }

    this.jit_imports = jit_imports;
};

CPU.prototype.wasm_patch = function()
{
    const get_optional_import = name => this.wm.exports[name];

    const get_import = name =>
    {
        const f = get_optional_import(name);
        console.assert(f, "Missing import: " + name);
        return f;
    };

    this.reset_cpu = get_import("reset_cpu");

    this.getiopl = get_import("getiopl");
    this.get_eflags = get_import("get_eflags");

    this.handle_irqs = get_import("handle_irqs");

    this.main_loop = get_import("main_loop");

    this.set_jit_config = get_import("set_jit_config");

    this.read8 = get_import("read8");
    this.read16 = get_import("read16");
    this.read32s = get_import("read32s");
    this.write8 = get_import("write8");
    this.write16 = get_import("write16");
    this.write32 = get_import("write32");
    this.in_mapped_range = get_import("in_mapped_range");

    // used by nasmtests
    this.fpu_load_tag_word = get_import("fpu_load_tag_word");
    this.fpu_load_status_word = get_import("fpu_load_status_word");
    this.fpu_get_sti_f64 = get_import("fpu_get_sti_f64");

    this.translate_address_system_read = get_import("translate_address_system_read_js");

    this.get_seg_cs = get_import("get_seg_cs");
    this.get_real_eip = get_import("get_real_eip");

    this.clear_tlb = get_import("clear_tlb");
    this.full_clear_tlb = get_import("full_clear_tlb");
    this.update_state_flags = get_import("update_state_flags");

    this.set_tsc = get_import("set_tsc");
    this.store_current_tsc = get_import("store_current_tsc");

    this.set_cpuid_level = get_import("set_cpuid_level");

    this.pic_set_irq = get_import("pic_set_irq");
    this.pic_clear_irq = get_import("pic_clear_irq");

    if(DEBUG)
    {
        this.jit_force_generate_unsafe = get_optional_import("jit_force_generate_unsafe");
    }

    this.jit_clear_cache = get_import("jit_clear_cache_js");
    this.jit_dirty_cache = get_import("jit_dirty_cache");
    this.codegen_finalize_finished = get_import("codegen_finalize_finished");

    this.allocate_memory = get_import("allocate_memory");
    this.zero_memory = get_import("zero_memory");
    this.is_memory_zeroed = get_import("is_memory_zeroed");

    this.svga_allocate_memory = get_import("svga_allocate_memory");
    this.svga_allocate_dest_buffer = get_import("svga_allocate_dest_buffer");
    this.svga_fill_pixel_buffer = get_import("svga_fill_pixel_buffer");
    this.svga_mark_dirty = get_import("svga_mark_dirty");

    this.get_pic_addr_master = get_import("get_pic_addr_master");
    this.get_pic_addr_slave = get_import("get_pic_addr_slave");

    this.zstd_create_ctx = get_import("zstd_create_ctx");
    this.zstd_get_src_ptr = get_import("zstd_get_src_ptr");
    this.zstd_free_ctx = get_import("zstd_free_ctx");
    this.zstd_read = get_import("zstd_read");
    this.zstd_read_free = get_import("zstd_read_free");

    this.port20_read = get_import("port20_read");
    this.port21_read = get_import("port21_read");
    this.portA0_read = get_import("portA0_read");
    this.portA1_read = get_import("portA1_read");

    this.port20_write = get_import("port20_write");
    this.port21_write = get_import("port21_write");
    this.portA0_write = get_import("portA0_write");
    this.portA1_write = get_import("portA1_write");

    this.port4D0_read = get_import("port4D0_read");
    this.port4D1_read = get_import("port4D1_read");
    this.port4D0_write = get_import("port4D0_write");
    this.port4D1_write = get_import("port4D1_write");
};

CPU.prototype.jit_force_generate = function(addr)
{
    if(!this.jit_force_generate_unsafe)
    {
        dbg_assert(false, "Not supported in this wasm build: jit_force_generate_unsafe");
        return;
    }

    this.jit_force_generate_unsafe(addr);
};

CPU.prototype.jit_clear_func = function(index)
{
    dbg_assert(index >= 0 && index < WASM_TABLE_SIZE);
    this.wm.wasm_table.set(index + WASM_TABLE_OFFSET, null);
};

CPU.prototype.jit_clear_all_funcs = function()
{
    const table = this.wm.wasm_table;

    for(let i = 0; i < WASM_TABLE_SIZE; i++)
    {
        table.set(WASM_TABLE_OFFSET + i, null);
    }
};

CPU.prototype.get_state = function()
{
    var state = [];

    state[0] = this.memory_size[0];
    state[1] = new Uint8Array([...this.segment_is_null, ...this.segment_access_bytes]);
    state[2] = this.segment_offsets;
    state[3] = this.segment_limits;
    state[4] = this.protected_mode[0];
    state[5] = this.idtr_offset[0];
    state[6] = this.idtr_size[0];
    state[7] = this.gdtr_offset[0];
    state[8] = this.gdtr_size[0];
    state[9] = this.page_fault[0];
    state[10] = this.cr;
    state[11] = this.cpl[0];

    state[13] = this.is_32[0];

    state[16] = this.stack_size_32[0];
    state[17] = this.in_hlt[0];
    state[18] = this.last_virt_eip[0];
    state[19] = this.eip_phys[0];

    state[22] = this.sysenter_cs[0];
    state[23] = this.sysenter_eip[0];
    state[24] = this.sysenter_esp[0];
    state[25] = this.prefixes[0];
    state[26] = this.flags[0];
    state[27] = this.flags_changed[0];
    state[28] = this.last_op1[0];

    state[30] = this.last_op_size[0];

    state[37] = this.instruction_pointer[0];
    state[38] = this.previous_ip[0];
    state[39] = this.reg32;
    state[40] = this.sreg;
    state[41] = this.dreg;
    state[42] = this.reg_pdpte;

    this.store_current_tsc();
    state[43] = this.current_tsc;

    state[45] = this.devices.virtio_9p;
    state[46] = this.devices.apic;
    state[47] = this.devices.rtc;
    state[48] = this.devices.pci;
    state[49] = this.devices.dma;
    state[50] = this.devices.acpi;
    // 51 (formerly hpet)
    state[52] = this.devices.vga;
    state[53] = this.devices.ps2;
    state[54] = this.devices.uart0;
    state[55] = this.devices.fdc;
    state[56] = this.devices.cdrom;
    state[57] = this.devices.hda;
    state[58] = this.devices.pit;
    state[59] = this.devices.net;
    state[60] = this.get_state_pic();
    state[61] = this.devices.sb16;

    state[62] = this.fw_value;

    state[63] = this.devices.ioapic;

    state[64] = this.tss_size_32[0];

    state[66] = this.reg_xmm32s;

    state[67] = this.fpu_st;
    state[68] = this.fpu_stack_empty[0];
    state[69] = this.fpu_stack_ptr[0];
    state[70] = this.fpu_control_word[0];
    state[71] = this.fpu_ip[0];
    state[72] = this.fpu_ip_selector[0];
    state[73] = this.fpu_dp[0];
    state[74] = this.fpu_dp_selector[0];
    state[75] = this.fpu_opcode[0];

    const { packed_memory, bitmap } = this.pack_memory();
    state[77] = packed_memory;
    state[78] = new Uint8Array(bitmap.get_buffer());

    state[79] = this.devices.uart1;
    state[80] = this.devices.uart2;
    state[81] = this.devices.uart3;
    state[82] = this.devices.virtio_console;
    state[83] = this.devices.virtio_net;
    state[84] = this.devices.virtio_balloon;

    return state;
};

CPU.prototype.get_state_pic = function()
{
    const pic_size = 13;
    const pic = new Uint8Array(this.wasm_memory.buffer, this.get_pic_addr_master(), pic_size);
    const pic_slave = new Uint8Array(this.wasm_memory.buffer, this.get_pic_addr_slave(), pic_size);

    const state = [];
    const state_slave = [];

    state[0] = pic[0]; // irq_mask
    state[1] = pic[1]; // irq_map
    state[2] = pic[2]; // isr
    state[3] = pic[3]; // irr
    state[4] = pic[4]; // is_master
    state[5] = state_slave;
    state[6] = pic[6]; // expect_icw4
    state[7] = pic[7]; // state
    state[8] = pic[8]; // read_isr
    state[9] = pic[9]; // auto_eoi
    state[10] = pic[10]; // elcr
    state[11] = pic[11]; // irq_value
    state[12] = pic[12]; // special_mask_mode

    state_slave[0] = pic_slave[0]; // irq_mask
    state_slave[1] = pic_slave[1]; // irq_map
    state_slave[2] = pic_slave[2]; // isr
    state_slave[3] = pic_slave[3]; // irr
    state_slave[4] = pic_slave[4]; // is_master
    state_slave[5] = null;
    state_slave[6] = pic_slave[6]; // expect_icw4
    state_slave[7] = pic_slave[7]; // state
    state_slave[8] = pic_slave[8]; // read_isr
    state_slave[9] = pic_slave[9]; // auto_eoi
    state_slave[10] = pic_slave[10]; // elcr
    state_slave[11] = pic_slave[11]; // irq_value
    state_slave[12] = pic_slave[12]; // special_mask_mode

    return state;
};

CPU.prototype.set_state = function(state)
{
    this.memory_size[0] = state[0];

    if(this.mem8.length !== this.memory_size[0])
    {
        console.warn("Note: Memory size mismatch. we=" + this.mem8.length + " state=" + this.memory_size[0]);
    }

    if(state[1].length === 8)
    {
        // NOTE: support for old state images; delete this when bumping STATE_VERSION
        this.segment_is_null.set(state[1]);
        this.segment_access_bytes.fill(0x80 | (3 << 5) | 0x10 | 0x02);
        this.segment_access_bytes[REG_CS] = 0x80 | (3 << 5) | 0x10 | 0x08 | 0x02;
    }
    else if(state[1].length === 16)
    {
        this.segment_is_null.set(state[1].subarray(0, 8));
        this.segment_access_bytes.set(state[1].subarray(8, 16));
    }
    else
    {
        dbg_assert("Unexpected cpu segment state length:" + state[1].length);
    }
    this.segment_offsets.set(state[2]);
    this.segment_limits.set(state[3]);

    this.protected_mode[0] = state[4];
    this.idtr_offset[0] = state[5];
    this.idtr_size[0] = state[6];
    this.gdtr_offset[0] = state[7];
    this.gdtr_size[0] = state[8];
    this.page_fault[0] = state[9];
    this.cr.set(state[10]);
    this.cpl[0] = state[11];

    this.is_32[0] = state[13];

    this.stack_size_32[0] = state[16];

    this.in_hlt[0] = state[17];
    this.last_virt_eip[0] = state[18];
    this.eip_phys[0] = state[19];

    this.sysenter_cs[0] = state[22];
    this.sysenter_eip[0] = state[23];
    this.sysenter_esp[0] = state[24];
    this.prefixes[0] = state[25];

    this.flags[0] = state[26];
    this.flags_changed[0] = state[27];
    this.last_op1[0] = state[28];

    this.last_op_size[0] = state[30];

    this.instruction_pointer[0] = state[37];
    this.previous_ip[0] = state[38];
    this.reg32.set(state[39]);
    this.sreg.set(state[40]);
    this.dreg.set(state[41]);
    state[42] && this.reg_pdpte.set(state[42]);

    this.set_tsc(state[43][0], state[43][1]);

    this.devices.virtio_9p && this.devices.virtio_9p.set_state(state[45]);
    this.devices.apic && this.devices.apic.set_state(state[46]);
    this.devices.rtc && this.devices.rtc.set_state(state[47]);
    this.devices.pci && this.devices.pci.set_state(state[48]);
    this.devices.dma && this.devices.dma.set_state(state[49]);
    this.devices.acpi && this.devices.acpi.set_state(state[50]);
    // 51 (formerly hpet)
    this.devices.vga && this.devices.vga.set_state(state[52]);
    this.devices.ps2 && this.devices.ps2.set_state(state[53]);
    this.devices.uart0 && this.devices.uart0.set_state(state[54]);
    this.devices.fdc && this.devices.fdc.set_state(state[55]);
    this.devices.cdrom && this.devices.cdrom.set_state(state[56]);
    this.devices.hda && this.devices.hda.set_state(state[57]);
    this.devices.pit && this.devices.pit.set_state(state[58]);
    this.devices.net && this.devices.net.set_state(state[59]);
    this.set_state_pic(state[60]);
    this.devices.sb16 && this.devices.sb16.set_state(state[61]);

    this.devices.uart1 && this.devices.uart1.set_state(state[79]);
    this.devices.uart2 && this.devices.uart2.set_state(state[80]);
    this.devices.uart3 && this.devices.uart3.set_state(state[81]);
    this.devices.virtio_console && this.devices.virtio_console.set_state(state[82]);
    this.devices.virtio_net && this.devices.virtio_net.set_state(state[83]);
    this.devices.virtio_balloon && this.devices.virtio_balloon.set_state(state[84]);

    this.fw_value = state[62];

    this.devices.ioapic && this.devices.ioapic.set_state(state[63]);

    this.tss_size_32[0] = state[64];

    this.reg_xmm32s.set(state[66]);

    this.fpu_st.set(state[67]);
    this.fpu_stack_empty[0] = state[68];
    this.fpu_stack_ptr[0] = state[69];
    this.fpu_control_word[0] = state[70];
    this.fpu_ip[0] = state[71];
    this.fpu_ip_selector[0] = state[72];
    this.fpu_dp[0] = state[73];
    this.fpu_dp_selector[0] = state[74];
    this.fpu_opcode[0] = state[75];

    const bitmap = new Bitmap(state[78].buffer);
    const packed_memory = state[77];
    this.unpack_memory(bitmap, packed_memory);

    this.update_state_flags();

    this.full_clear_tlb();

    this.jit_clear_cache();
};

CPU.prototype.set_state_pic = function(state)
{
    // Note: This could exists for compatibility with old state images
    // It should be deleted when the state version changes

    const pic_size = 13;
    const pic = new Uint8Array(this.wasm_memory.buffer, this.get_pic_addr_master(), pic_size);
    const pic_slave = new Uint8Array(this.wasm_memory.buffer, this.get_pic_addr_slave(), pic_size);

    pic[0] = state[0]; // irq_mask
    pic[1] = state[1]; // irq_map
    pic[2] = state[2]; // isr
    pic[3] = state[3]; // irr
    pic[4] = state[4]; // is_master
    const state_slave = state[5];
    pic[6] = state[6]; // expect_icw4
    pic[7] = state[7]; // state
    pic[8] = state[8]; // read_isr
    pic[9] = state[9]; // auto_eoi
    pic[10] = state[10]; // elcr
    pic[11] = state[11]; // irq_value (undefined in old state images)
    pic[12] = state[12]; // special_mask_mode (undefined in old state images)

    pic_slave[0] = state_slave[0]; // irq_mask
    pic_slave[1] = state_slave[1]; // irq_map
    pic_slave[2] = state_slave[2]; // isr
    pic_slave[3] = state_slave[3]; // irr
    pic_slave[4] = state_slave[4]; // is_master
    // dummy
    pic_slave[6] = state_slave[6]; // expect_icw4
    pic_slave[7] = state_slave[7]; // state
    pic_slave[8] = state_slave[8]; // read_isr
    pic_slave[9] = state_slave[9]; // auto_eoi
    pic_slave[10] = state_slave[10]; // elcr
    pic_slave[11] = state_slave[11]; // irq_value (undefined in old state images)
    pic_slave[12] = state_slave[12]; // special_mask_mode (undefined in old state images)
};

CPU.prototype.pack_memory = function()
{
    dbg_assert((this.mem8.length & 0xFFF) === 0);

    const page_count = this.mem8.length >> 12;
    const nonzero_pages = [];
    for(let page = 0; page < page_count; page++)
    {
        if(!this.is_memory_zeroed(page << 12, 0x1000))
        {
            nonzero_pages.push(page);
        }
    }

    const bitmap = new Bitmap(page_count);
    const packed_memory = new Uint8Array(nonzero_pages.length << 12);

    for(const [i, page] of nonzero_pages.entries())
    {
        bitmap.set(page, 1);

        const offset = page << 12;
        const page_contents = this.mem8.subarray(offset, offset + 0x1000);
        packed_memory.set(page_contents, i << 12);
    }

    return { bitmap, packed_memory };
};

CPU.prototype.unpack_memory = function(bitmap, packed_memory)
{
    this.zero_memory(0, this.memory_size[0]);

    const page_count = this.memory_size[0] >> 12;
    let packed_page = 0;

    for(let page = 0; page < page_count; page++)
    {
        if(bitmap.get(page))
        {
            const offset = packed_page << 12;
            const view = packed_memory.subarray(offset, offset + 0x1000);
            this.mem8.set(view, page << 12);
            packed_page++;
        }
    }
};

CPU.prototype.reboot_internal = function()
{
    this.reset_cpu();

    this.fw_value = [];

    if(this.devices.virtio_9p)
    {
        this.devices.virtio_9p.reset();
    }
    if(this.devices.virtio_console)
    {
        this.devices.virtio_console.reset();
    }
    if(this.devices.virtio_net)
    {
        this.devices.virtio_net.reset();
    }
    if(this.devices.ps2)
    {
        this.devices.ps2.reset();
    }

    this.load_bios();
};

CPU.prototype.reset_memory = function()
{
    this.mem8.fill(0);
};

CPU.prototype.create_memory = function(size, minimum_size)
{
    if(size < minimum_size)
    {
        size = minimum_size;
        dbg_log("Rounding memory size up to " + size, LOG_CPU);
    }
    else if((size | 0) < 0)
    {
        size = Math.pow(2, 31) - MMAP_BLOCK_SIZE;
        dbg_log("Rounding memory size down to " + size, LOG_CPU);
    }

    size = ((size - 1) | (MMAP_BLOCK_SIZE - 1)) + 1 | 0;
    dbg_assert((size | 0) > 0);
    dbg_assert((size & MMAP_BLOCK_SIZE - 1) === 0);

    console.assert(this.memory_size[0] === 0, "Expected uninitialised memory");

    this.memory_size[0] = size;

    const memory_offset = this.allocate_memory(size);

    this.mem8 = view(Uint8Array, this.wasm_memory, memory_offset, size);
    this.mem32s = view(Uint32Array, this.wasm_memory, memory_offset, size >> 2);
};

/**
 * @param {BusConnector} device_bus
 */
CPU.prototype.init = function(settings, device_bus)
{
    this.create_memory(
        settings.memory_size || 64 * 1024 * 1024,
        settings.initrd ? 64 * 1024 * 1024 : 1024 * 1024,
    );

    if(settings.disable_jit)
    {
        this.set_jit_config(0, 1);
    }

    settings.cpuid_level && this.set_cpuid_level(settings.cpuid_level);

    this.acpi_enabled[0] = +settings.acpi;

    this.reset_cpu();

    var io = new IO(this);
    this.io = io;

    this.bios.main = settings.bios;
    this.bios.vga = settings.vga_bios;

    this.load_bios();

    if(settings.bzimage)
    {
        const option_rom = load_kernel(this.mem8, settings.bzimage, settings.initrd, settings.cmdline || "");

        if(option_rom)
        {
            this.option_roms.push(option_rom);
        }
    }

    io.register_read(0xB3, this, function()
    {
        // seabios smm_relocate_and_restore
        dbg_log("port 0xB3 read");
        return 0;
    });

    var a20_byte = 0;

    io.register_read(0x92, this, function()
    {
        return a20_byte;
    });

    io.register_write(0x92, this, function(out_byte)
    {
        a20_byte = out_byte;
    });

    io.register_read(0x511, this, function()
    {
        // bios config port (used by seabios and kvm-unit-test)
        if(this.fw_pointer < this.fw_value.length)
        {
            return this.fw_value[this.fw_pointer++];
        }
        else
        {
            dbg_assert(false, "config port: Read past value");
            return 0;
        }
    });
    io.register_write(0x510, this, undefined, function(value)
    {
        // https://wiki.osdev.org/QEMU_fw_cfg
        // https://github.com/qemu/qemu/blob/master/docs/specs/fw_cfg.txt

        dbg_log("bios config port, index=" + h(value));

        function i32(x)
        {
            return new Uint8Array(Int32Array.of(x).buffer);
        }

        function to_be16(x)
        {
            return x >> 8 | x << 8 & 0xFF00;
        }

        function to_be32(x)
        {
            return x << 24 | x << 8 & 0xFF0000 | x >> 8 & 0xFF00 | x >>> 24;
        }

        this.fw_pointer = 0;

        if(value === FW_CFG_SIGNATURE)
        {
            // Pretend to be qemu (for seabios)
            this.fw_value = i32(FW_CFG_SIGNATURE_QEMU);
        }
        else if(value === FW_CFG_ID)
        {
            this.fw_value = i32(0);
        }
        else if(value === FW_CFG_RAM_SIZE)
        {
            this.fw_value = i32(this.memory_size[0]);
        }
        else if(value === FW_CFG_NB_CPUS)
        {
            this.fw_value = i32(1);
        }
        else if(value === FW_CFG_MAX_CPUS)
        {
            this.fw_value = i32(1);
        }
        else if(value === FW_CFG_NUMA)
        {
            this.fw_value = new Uint8Array(16);
        }
        else if(value === FW_CFG_FILE_DIR)
        {
            const buffer_size = 4 + 64 * this.option_roms.length;
            const buffer32 = new Int32Array(buffer_size);
            const buffer8 = new Uint8Array(buffer32.buffer);

            buffer32[0] = to_be32(this.option_roms.length);

            for(let i = 0; i < this.option_roms.length; i++)
            {
                const { name, data } = this.option_roms[i];
                const file_struct_ptr = 4 + 64 * i;

                dbg_assert(FW_CFG_FILE_START + i < 0x10000);
                buffer32[file_struct_ptr + 0 >> 2] = to_be32(data.length);
                buffer32[file_struct_ptr + 4 >> 2] = to_be16(FW_CFG_FILE_START + i);

                dbg_assert(name.length < 64 - 8);

                for(let j = 0; j < name.length; j++)
                {
                    buffer8[file_struct_ptr + 8 + j] = name.charCodeAt(j);
                }
            }

            this.fw_value = buffer8;
        }
        else if(value >= FW_CFG_CUSTOM_START && value < FW_CFG_FILE_START)
        {
            this.fw_value = i32(0);
        }
        else if(value >= FW_CFG_FILE_START && value - FW_CFG_FILE_START < this.option_roms.length)
        {
            const i = value - FW_CFG_FILE_START;
            this.fw_value = this.option_roms[i].data;
        }
        else
        {
            dbg_log("Warning: Unimplemented fw index: " + h(value));
            this.fw_value = i32(0);
        }
    });

    if(DEBUG)
    {
        // Avoid logging noisey ports
        io.register_write(0x80, this, function(out_byte) {});
        io.register_read(0x80, this, function() { return 0xFF; });
        io.register_write(0xE9, this, function(out_byte) {});
    }

    io.register_read(0x20, this, this.port20_read);
    io.register_read(0x21, this, this.port21_read);
    io.register_read(0xA0, this, this.portA0_read);
    io.register_read(0xA1, this, this.portA1_read);

    io.register_write(0x20, this, this.port20_write);
    io.register_write(0x21, this, this.port21_write);
    io.register_write(0xA0, this, this.portA0_write);
    io.register_write(0xA1, this, this.portA1_write);

    io.register_read(0x4D0, this, this.port4D0_read);
    io.register_read(0x4D1, this, this.port4D1_read);
    io.register_write(0x4D0, this, this.port4D0_write);
    io.register_write(0x4D1, this, this.port4D1_write);

    this.devices = {};

    // TODO: Make this more configurable
    if(settings.load_devices)
    {
        this.devices.pci = new PCI(this);

        if(this.acpi_enabled[0])
        {
            this.devices.ioapic = new IOAPIC(this);
            this.devices.apic = new APIC(this);
            this.devices.acpi = new ACPI(this);
        }

        this.devices.rtc = new RTC(this);
        this.fill_cmos(this.devices.rtc, settings);

        this.devices.dma = new DMA(this);

        this.devices.vga = new VGAScreen(this, device_bus, settings.screen, settings.vga_memory_size || 8 * 1024 * 1024);

        this.devices.ps2 = new PS2(this, device_bus);

        this.devices.uart0 = new UART(this, 0x3F8, device_bus);

        if(settings.uart1)
        {
            this.devices.uart1 = new UART(this, 0x2F8, device_bus);
        }
        if(settings.uart2)
        {
            this.devices.uart2 = new UART(this, 0x3E8, device_bus);
        }
        if(settings.uart3)
        {
            this.devices.uart3 = new UART(this, 0x2E8, device_bus);
        }

        this.devices.fdc = new FloppyController(this, settings.fda, settings.fdb);

        var ide_device_count = 0;

        if(settings.hda)
        {
            this.devices.hda = new IDEDevice(this, settings.hda, settings.hdb, false, ide_device_count++, device_bus);
        }

        if(settings.cdrom)
        {
            this.devices.cdrom = new IDEDevice(this, settings.cdrom, undefined, true, ide_device_count++, device_bus);
        }

        this.devices.pit = new PIT(this, device_bus);

        if(settings.net_device.type === "ne2k")
        {
            this.devices.net = new Ne2k(this, device_bus, settings.preserve_mac_from_state_image, settings.mac_address_translation);
        }
        else if(settings.net_device.type === "virtio")
        {
            this.devices.virtio_net = new VirtioNet(this, device_bus, settings.preserve_mac_from_state_image);
        }

        if(settings.fs9p)
        {
            this.devices.virtio_9p = new Virtio9p(settings.fs9p, this, device_bus);
        }
        if(settings.virtio_console)
        {
            this.devices.virtio_console = new VirtioConsole(this, device_bus);
        }
        if(settings.virtio_balloon) {
            this.devices.virtio_balloon = new VirtioBalloon(this, device_bus);
        }

        if(true)
        {
            this.devices.sb16 = new SB16(this, device_bus);
        }
    }

    if(settings.multiboot)
    {
        dbg_log("loading multiboot", LOG_CPU);
        const option_rom = this.load_multiboot_option_rom(settings.multiboot, settings.initrd, settings.cmdline);

        if(option_rom)
        {
            if(this.bios.main)
            {
                dbg_log("adding option rom for multiboot", LOG_CPU);
                this.option_roms.push(option_rom);
            }
            else
            {
                dbg_log("loaded multiboot without bios", LOG_CPU);
                this.reg32[REG_EAX] = this.io.port_read32(0xF4);
            }
        }
    }

    if(DEBUG)
    {
        this.debug.init();
    }
};

CPU.prototype.load_multiboot = function (buffer)
{
    if(this.bios.main)
    {
        dbg_assert(false, "load_multiboot not supported with BIOS");
    }

    const option_rom = this.load_multiboot_option_rom(buffer, undefined, "");
    if(option_rom)
    {
        dbg_log("loaded multiboot", LOG_CPU);
        this.reg32[REG_EAX] = this.io.port_read32(0xF4);
    }
};

CPU.prototype.load_multiboot_option_rom = function(buffer, initrd, cmdline)
{
    // https://www.gnu.org/software/grub/manual/multiboot/multiboot.html

    dbg_log("Trying multiboot from buffer of size " + buffer.byteLength, LOG_CPU);

    const ELF_MAGIC = 0x464C457F;
    const MULTIBOOT_HEADER_MAGIC = 0x1BADB002;
    const MULTIBOOT_HEADER_MEMORY_INFO = 0x2;
    const MULTIBOOT_HEADER_ADDRESS = 0x10000;
    const MULTIBOOT_BOOTLOADER_MAGIC = 0x2BADB002;
    const MULTIBOOT_SEARCH_BYTES = 8192;
    const MULTIBOOT_INFO_STRUCT_LEN = 116;
    const MULTIBOOT_INFO_CMDLINE = 0x4;
    const MULTIBOOT_INFO_MEM_MAP = 0x40;

    if(buffer.byteLength < MULTIBOOT_SEARCH_BYTES)
    {
        var buf32 = new Int32Array(MULTIBOOT_SEARCH_BYTES / 4);
        new Uint8Array(buf32.buffer).set(new Uint8Array(buffer));
    }
    else
    {
        var buf32 = new Int32Array(buffer, 0, MULTIBOOT_SEARCH_BYTES / 4);
    }

    for(var offset = 0; offset < MULTIBOOT_SEARCH_BYTES; offset += 4)
    {
        if(buf32[offset >> 2] === MULTIBOOT_HEADER_MAGIC)
        {
            var flags = buf32[offset + 4 >> 2];
            var checksum = buf32[offset + 8 >> 2];
            var total = MULTIBOOT_HEADER_MAGIC + flags + checksum | 0;

            if(total)
            {
                dbg_log("Multiboot checksum check failed", LOG_CPU);
                continue;
            }
        }
        else
        {
            continue;
        }

        dbg_log("Multiboot magic found, flags: " + h(flags >>> 0, 8), LOG_CPU);
        // bit 0 : load modules on page boundaries (may as well, if we load modules)
        // bit 1 : provide a memory map (which we always will)
        dbg_assert((flags & ~MULTIBOOT_HEADER_ADDRESS & ~3) === 0, "TODO");

        // do this in a io register hook, so it can happen after BIOS does its work
        var cpu = this;

        this.io.register_read(0xF4, this, function () {return 0;} , function () { return 0;}, function () {
            // actually do the load and return the multiboot magic
            const multiboot_info_addr = 0x7C00;
            let multiboot_data = multiboot_info_addr + MULTIBOOT_INFO_STRUCT_LEN;
            let info = 0;

            // command line
            if(cmdline)
            {
                info |= MULTIBOOT_INFO_CMDLINE;

                cpu.write32(multiboot_info_addr + 16, multiboot_data);

                cmdline += "\x00";
                const encoder = new TextEncoder();
                const cmdline_utf8 = encoder.encode(cmdline);
                cpu.write_blob(cmdline_utf8, multiboot_data);
                multiboot_data += cmdline_utf8.length;
            }

            // memory map
            if(flags & MULTIBOOT_HEADER_MEMORY_INFO)
            {
                info |= MULTIBOOT_INFO_MEM_MAP;
                let multiboot_mmap_count = 0;
                cpu.write32(multiboot_info_addr + 44, 0);
                cpu.write32(multiboot_info_addr + 48, multiboot_data);

                // Create a memory map for the multiboot kernel
                // does not exclude traditional bios exclusions
                let start = 0;
                let was_memory = false;
                for(let addr = 0; addr < MMAP_MAX; addr += MMAP_BLOCK_SIZE)
                {
                    if(was_memory && cpu.memory_map_read8[addr >>> MMAP_BLOCK_BITS] !== undefined)
                    {
                        cpu.write32(multiboot_data, 20); // size
                        cpu.write32(multiboot_data + 4, start); //addr (64-bit)
                        cpu.write32(multiboot_data + 8, 0);
                        cpu.write32(multiboot_data + 12, addr - start); // len (64-bit)
                        cpu.write32(multiboot_data + 16, 0);
                        cpu.write32(multiboot_data + 20, 1); // type (MULTIBOOT_MEMORY_AVAILABLE)
                        multiboot_data += 24;
                        multiboot_mmap_count += 24;
                        was_memory = false;
                    }
                    else if(!was_memory && cpu.memory_map_read8[addr >>> MMAP_BLOCK_BITS] === undefined)
                    {
                        start = addr;
                        was_memory = true;
                    }
                }
                dbg_assert (!was_memory, "top of 4GB shouldn't have memory");
                cpu.write32(multiboot_info_addr + 44, multiboot_mmap_count);
            }

            cpu.write32(multiboot_info_addr, info);

            let entrypoint = 0;
            let top_of_load = 0;

            if(flags & MULTIBOOT_HEADER_ADDRESS)
            {
                dbg_log("Multiboot specifies its own address table", LOG_CPU);

                var header_addr = buf32[offset + 12 >> 2];
                var load_addr = buf32[offset + 16 >> 2];
                var load_end_addr = buf32[offset + 20 >> 2];
                var bss_end_addr = buf32[offset + 24 >> 2];
                var entry_addr = buf32[offset + 28 >> 2];

                dbg_log("header=" + h(header_addr, 8) +
                        " load=" + h(load_addr, 8) +
                        " load_end=" + h(load_end_addr, 8) +
                        " bss_end=" + h(bss_end_addr, 8) +
                        " entry=" + h(entry_addr, 8));

                dbg_assert(load_addr <= header_addr);

                var file_start = offset - (header_addr - load_addr);

                if(load_end_addr === 0)
                {
                    var length = undefined;
                }
                else
                {
                    dbg_assert(load_end_addr >= load_addr);
                    var length = load_end_addr - load_addr;
                }

                const blob = new Uint8Array(buffer, file_start, length);
                cpu.write_blob(blob, load_addr);

                entrypoint = entry_addr | 0;
                top_of_load = Math.max(load_end_addr, bss_end_addr);
            }
            else if(buf32[0] === ELF_MAGIC)
            {
                dbg_log("Multiboot image is in elf format", LOG_CPU);

                const elf = read_elf(buffer);

                entrypoint = elf.header.entry;

                for(const program of elf.program_headers)
                {
                    if(program.type === 0)
                    {
                        // null
                    }
                    else if(program.type === 1)
                    {
                        // load

                        dbg_assert(program.filesz <= program.memsz);

                        if(program.paddr + program.memsz < cpu.memory_size[0])
                        {
                            if(program.filesz) // offset might be outside of buffer if filesz is 0
                            {
                                const blob = new Uint8Array(buffer, program.offset, program.filesz);
                                cpu.write_blob(blob, program.paddr);
                            }
                            top_of_load = Math.max(top_of_load, program.paddr + program.memsz);
                            dbg_log("prg load " + program.paddr + " to " + (program.paddr + program.memsz), LOG_CPU);

                            // Since multiboot specifies that paging is disabled, we load to the physical address;
                            // but the entry point is specified in virtual addresses so adjust the entrypoint if needed

                            if(entrypoint === elf.header.entry && program.vaddr <= entrypoint && (program.vaddr + program.memsz) > entrypoint)
                            {
                                entrypoint = (entrypoint - program.vaddr) + program.paddr;
                            }
                        }
                        else
                        {
                            dbg_log("Warning: Skipped loading section, paddr=" + h(program.paddr) + " memsz=" + program.memsz, LOG_CPU);
                        }
                    }
                    else if(
                        program.type === 2 || // dynamic
                        program.type === 3 || // interp
                        program.type === 4 || // note
                        program.type === 6 || // phdr
                        program.type === 7 || // tls
                        program.type === 0x6474e550 || // gnu_eh_frame
                        program.type === 0x6474e551 || // gnu_stack
                        program.type === 0x6474e552 || // gnu_relro
                        program.type === 0x6474e553)   // gnu_property
                    {
                        dbg_log("skip load type " + program.type + " " + program.paddr + " to " + (program.paddr + program.memsz), LOG_CPU);
                        // ignore for now
                    }
                    else
                    {
                        dbg_assert(false, "unimplemented elf section type: " + h(program.type));
                    }
                }
            }
            else
            {
                dbg_assert(false, "Not a bootable multiboot format");
            }

            if(initrd)
            {
                cpu.write32(multiboot_info_addr + 20, 1); // mods_count
                cpu.write32(multiboot_info_addr + 24, multiboot_data); // mods_addr;

                var ramdisk_address = top_of_load;
                if((ramdisk_address & 4095) !== 0)
                {
                    ramdisk_address = (ramdisk_address & ~4095) + 4096;
                }
                dbg_log("ramdisk address " + ramdisk_address);
                var ramdisk_top = ramdisk_address + initrd.byteLength;

                cpu.write32(multiboot_data, ramdisk_address); // mod_start
                cpu.write32(multiboot_data + 4, ramdisk_top); // mod_end
                cpu.write32(multiboot_data + 8, 0); // string
                cpu.write32(multiboot_data + 12, 0); // reserved
                multiboot_data += 16;

                dbg_assert(ramdisk_top < cpu.memory_size[0]);

                cpu.write_blob(new Uint8Array(initrd), ramdisk_address);
            }

            // set state for multiboot

            cpu.reg32[REG_EBX] = multiboot_info_addr;
            cpu.cr[0] = 1;
            cpu.protected_mode[0] = +true;
            cpu.flags[0] = FLAGS_DEFAULT;
            cpu.is_32[0] = +true;
            cpu.stack_size_32[0] = +true;

            for(var i = 0; i < 6; i++)
            {
                cpu.segment_is_null[i] = 0;
                cpu.segment_offsets[i] = 0;
                cpu.segment_limits[i] = 0xFFFFFFFF;
                // cpu.segment_access_bytes[i]
                // Value doesn't matter, OS isn't allowed to reload without setting
                // up a proper GDT
                cpu.sreg[i] = 0xB002;
            }
            cpu.instruction_pointer[0] = cpu.get_seg_cs() + entrypoint | 0;
            cpu.update_state_flags();
            dbg_log("Starting multiboot kernel at:", LOG_CPU);
            cpu.debug.dump_state();
            cpu.debug.dump_regs();

            return MULTIBOOT_BOOTLOADER_MAGIC;
        });

        // only for kvm-unit-test
        this.io.register_write_consecutive(0xF4, this,
            function(value)
            {
                console.log("Test exited with code " + h(value, 2));
                throw "HALT";
            },
            function() {},
            function() {},
            function() {});

        // only for kvm-unit-test
        for(let i = 0; i <= 0xF; i++)
        {
            function handle_write(value)
            {
                dbg_log("kvm-unit-test: Set irq " + h(i) + " to " + h(value, 2));
                if(value)
                {
                    this.device_raise_irq(i);
                }
                else
                {
                    this.device_lower_irq(i);
                }
            }

            this.io.register_write(0x2000 + i, this, handle_write, handle_write, handle_write);
        }

        // This rom will be executed by seabios after its initialisation
        // It sets up the multiboot environment.
        const SIZE = 0x200;

        const data8 = new Uint8Array(SIZE);
        const data16 = new Uint16Array(data8.buffer);

        data16[0] = 0xAA55;
        data8[2] = SIZE / 0x200;
        let i = 3;
        // trigger load
        data8[i++] = 0x66; // in 0xF4
        data8[i++] = 0xE5;
        data8[i++] = 0xF4;

        dbg_assert(i < SIZE);

        const checksum_index = i;
        data8[checksum_index] = 0;

        let rom_checksum = 0;

        for(let i = 0; i < data8.length; i++)
        {
            rom_checksum += data8[i];
        }

        data8[checksum_index] = -rom_checksum;

        return {
            name: "genroms/multiboot.bin",
            data: data8
        };
    }
    dbg_log("Multiboot header not found", LOG_CPU);
};

CPU.prototype.fill_cmos = function(rtc, settings)
{
    var boot_order = settings.boot_order || BOOT_ORDER_CD_FIRST;

    // Used by seabios to determine the boot order
    //   Nibble
    //   1: FloppyPrio
    //   2: HDPrio
    //   3: CDPrio
    //   4: BEVPrio
    // bootflag 1, high nibble, lowest priority
    // Low nibble: Disable floppy signature check (1)
    rtc.cmos_write(CMOS_BIOS_BOOTFLAG1 , 1 | boot_order >> 4 & 0xF0);

    // bootflag 2, both nibbles, high and middle priority
    rtc.cmos_write(CMOS_BIOS_BOOTFLAG2, boot_order & 0xFF);

    // 640k or less if less memory is used
    rtc.cmos_write(CMOS_MEM_BASE_LOW, 640 & 0xFF);
    rtc.cmos_write(CMOS_MEM_BASE_HIGH, 640 >> 8);

    var memory_above_1m = 0; // in k
    if(this.memory_size[0] >= 1024 * 1024)
    {
        memory_above_1m = (this.memory_size[0] - 1024 * 1024) >> 10;
        memory_above_1m = Math.min(memory_above_1m, 0xFFFF);
    }

    rtc.cmos_write(CMOS_MEM_OLD_EXT_LOW, memory_above_1m & 0xFF);
    rtc.cmos_write(CMOS_MEM_OLD_EXT_HIGH, memory_above_1m >> 8 & 0xFF);
    rtc.cmos_write(CMOS_MEM_EXTMEM_LOW, memory_above_1m & 0xFF);
    rtc.cmos_write(CMOS_MEM_EXTMEM_HIGH, memory_above_1m >> 8 & 0xFF);

    var memory_above_16m = 0; // in 64k blocks
    if(this.memory_size[0] >= 16 * 1024 * 1024)
    {
        memory_above_16m = (this.memory_size[0] - 16 * 1024 * 1024) >> 16;
        memory_above_16m = Math.min(memory_above_16m, 0xFFFF);
    }
    rtc.cmos_write(CMOS_MEM_EXTMEM2_LOW, memory_above_16m & 0xFF);
    rtc.cmos_write(CMOS_MEM_EXTMEM2_HIGH, memory_above_16m >> 8 & 0xFF);

    // memory above 4G (not supported by this emulator)
    rtc.cmos_write(CMOS_MEM_HIGHMEM_LOW, 0);
    rtc.cmos_write(CMOS_MEM_HIGHMEM_MID, 0);
    rtc.cmos_write(CMOS_MEM_HIGHMEM_HIGH, 0);

    rtc.cmos_write(CMOS_EQUIPMENT_INFO, 0x2F);

    rtc.cmos_write(CMOS_BIOS_SMP_COUNT, 0);

    // Used by bochs BIOS to skip the boot menu delay.
    if(settings.fastboot) rtc.cmos_write(0x3f, 0x01);
};

CPU.prototype.load_bios = function()
{
    var bios = this.bios.main;
    var vga_bios = this.bios.vga;

    if(!bios)
    {
        dbg_log("Warning: No BIOS");
        return;
    }

    dbg_assert(bios instanceof ArrayBuffer);

    // load bios
    var data = new Uint8Array(bios),
        start = 0x100000 - bios.byteLength;

    this.write_blob(data, start);

    if(vga_bios)
    {
        dbg_assert(vga_bios instanceof ArrayBuffer);

        // load vga bios
        var vga_bios8 = new Uint8Array(vga_bios);

        // older versions of seabios
        this.write_blob(vga_bios8, 0xC0000);

        // newer versions of seabios (needs to match pci rom address, see vga.js)
        this.io.mmap_register(0xFEB00000, 0x100000,
            function(addr)
            {
                addr = (addr - 0xFEB00000) | 0;
                if(addr < vga_bios8.length)
                {
                    return vga_bios8[addr];
                }
                else
                {
                    return 0;
                }
            },
            function(addr, value)
            {
                dbg_assert(false, "Unexpected write to VGA rom");
            });
    }
    else
    {
        dbg_log("Warning: No VGA BIOS");
    }

    // seabios expects the bios to be mapped to 0xFFF00000 also
    this.io.mmap_register(0xFFF00000, 0x100000,
        function(addr)
        {
            addr &= 0xFFFFF;
            return this.mem8[addr];
        }.bind(this),
        function(addr, value)
        {
            addr &= 0xFFFFF;
            this.mem8[addr] = value;
        }.bind(this));
};

CPU.prototype.codegen_finalize = function(wasm_table_index, start, state_flags, ptr, len)
{
    ptr >>>= 0;
    len >>>= 0;

    dbg_assert(wasm_table_index >= 0 && wasm_table_index < WASM_TABLE_SIZE);

    const code = new Uint8Array(this.wasm_memory.buffer, ptr, len);

    if(DEBUG)
    {
        if(DUMP_GENERATED_WASM && !this.seen_code[start])
        {
            this.debug.dump_wasm(code);

            const DUMP_ASSEMBLY = false;

            if(DUMP_ASSEMBLY)
            {
                let end = 0;

                if((start ^ end) & ~0xFFF)
                {
                    dbg_log("truncated disassembly start=" + h(start >>> 0) + " end=" + h(end >>> 0));
                    end = (start | 0xFFF) + 1; // until the end of the page
                }

                dbg_assert(end >= start);

                const buffer = new Uint8Array(end - start);

                for(let i = start; i < end; i++)
                {
                    buffer[i - start] = this.read8(i);
                }

                this.debug.dump_code(this.is_32[0] ? 1 : 0, buffer, start);
            }
        }

        this.seen_code[start] = (this.seen_code[start] || 0) + 1;

        if(this.test_hook_did_generate_wasm)
        {
            this.test_hook_did_generate_wasm(code);
        }
    }

    const SYNC_COMPILATION = false;

    if(SYNC_COMPILATION)
    {
        const module = new WebAssembly.Module(code);
        const result = new WebAssembly.Instance(module, { "e": this.jit_imports });
        const f = result.exports["f"];

        this.wm.wasm_table.set(wasm_table_index + WASM_TABLE_OFFSET, f);
        this.codegen_finalize_finished(wasm_table_index, start, state_flags);

        if(this.test_hook_did_finalize_wasm)
        {
            this.test_hook_did_finalize_wasm(code);
        }

        return;
    }

    const result = WebAssembly.instantiate(code, { "e": this.jit_imports }).then(result => {
        const f = result.instance.exports["f"];

        this.wm.wasm_table.set(wasm_table_index + WASM_TABLE_OFFSET, f);
        this.codegen_finalize_finished(wasm_table_index, start, state_flags);

        if(this.test_hook_did_finalize_wasm)
        {
            this.test_hook_did_finalize_wasm(code);
        }
    });

    if(DEBUG)
    {
        result.catch(e => {
            console.log(e);
            debugger;
            throw e;
        });
    }
};

CPU.prototype.log_uncompiled_code = function(start, end)
{
    if(!DEBUG || !DUMP_UNCOMPILED_ASSEMBLY)
    {
        return;
    }

    if((this.seen_code_uncompiled[start] || 0) < 100)
    {
        this.seen_code_uncompiled[start] = (this.seen_code_uncompiled[start] || 0) + 1;

        end += 8; // final jump is not included

        if((start ^ end) & ~0xFFF)
        {
            dbg_log("truncated disassembly start=" + h(start >>> 0) + " end=" + h(end >>> 0));
            end = (start | 0xFFF) + 1; // until the end of the page
        }

        if(end < start) end = start;

        dbg_assert(end >= start);

        const buffer = new Uint8Array(end - start);

        for(let i = start; i < end; i++)
        {
            buffer[i - start] = this.read8(i);
        }

        dbg_log("Uncompiled code:");
        this.debug.dump_code(this.is_32[0] ? 1 : 0, buffer, start);
    }
};

CPU.prototype.dump_function_code = function(block_ptr, count)
{
    if(!DEBUG || !DUMP_GENERATED_WASM)
    {
        return;
    }

    const SIZEOF_BASIC_BLOCK_IN_DWORDS = 7;

    const mem32 = new Int32Array(this.wasm_memory.buffer);

    dbg_assert((block_ptr & 3) === 0);

    const is_32 = this.is_32[0];

    for(let i = 0; i < count; i++)
    {
        const struct_start = (block_ptr >> 2) + i * SIZEOF_BASIC_BLOCK_IN_DWORDS;
        const start = mem32[struct_start + 0];
        const end = mem32[struct_start + 1];
        const is_entry_block = mem32[struct_start + 6] & 0xFF00;

        const buffer = new Uint8Array(end - start);

        for(let i = start; i < end; i++)
        {
            buffer[i - start] = this.read8(this.translate_address_system_read(i));
        }

        dbg_log("---" + (is_entry_block ? " entry" : ""));
        this.debug.dump_code(is_32 ? 1 : 0, buffer, start);
    }
};

CPU.prototype.run_hardware_timers = function(acpi_enabled, now)
{
    const pit_time = this.devices.pit.timer(now, false);
    const rtc_time = this.devices.rtc.timer(now, false);

    let acpi_time = 100;
    let apic_time = 100;
    if(acpi_enabled)
    {
        acpi_time = this.devices.acpi.timer(now);
        apic_time = this.devices.apic.timer(now);
    }

    return Math.min(pit_time, rtc_time, acpi_time, apic_time);
};

CPU.prototype.device_raise_irq = function(i)
{
    dbg_assert(arguments.length === 1);
    this.pic_set_irq(i);

    if(this.devices.ioapic)
    {
        this.devices.ioapic.set_irq(i);
    }
};

CPU.prototype.device_lower_irq = function(i)
{
    this.pic_clear_irq(i);

    if(this.devices.ioapic)
    {
        this.devices.ioapic.clear_irq(i);
    }
};

CPU.prototype.debug_init = function()
{
    var cpu = this;
    var debug = {};
    this.debug = debug;

    debug.init = function()
    {
        if(!DEBUG) return;

        if(cpu.io)
        {
            // write seabios debug output to console
            var seabios_debug = "";

            cpu.io.register_write(0x402, this, handle); // seabios
            cpu.io.register_write(0x500, this, handle); // vgabios
        }

        function handle(out_byte)
        {
            if(out_byte === 10)
            {
                dbg_log(seabios_debug, LOG_BIOS);
                seabios_debug = "";
            }
            else
            {
                seabios_debug += String.fromCharCode(out_byte);
            }
        }
    };

    debug.get_regs_short = get_regs_short;
    debug.dump_regs = dump_regs_short;
    debug.get_state = get_state;
    debug.dump_state = dump_state;
    debug.dump_stack = dump_stack;

    debug.dump_page_structures = dump_page_structures;
    debug.dump_gdt_ldt = dump_gdt_ldt;
    debug.dump_idt = dump_idt;

    debug.get_memory_dump = get_memory_dump;
    debug.memory_hex_dump = memory_hex_dump;
    debug.used_memory_dump = used_memory_dump;

    function dump_stack(start, end)
    {
        if(!DEBUG) return;

        var esp = cpu.reg32[REG_ESP];
        dbg_log("========= STACK ==========");

        if(end >= start || end === undefined)
        {
            start = 5;
            end = -5;
        }

        for(var i = start; i > end; i--)
        {
            var line = "    ";

            if(!i) line = "=>  ";

            line += h(i, 2) + " | ";

            dbg_log(line + h(esp + 4 * i, 8) + " | " + h(cpu.read32s(esp + 4 * i) >>> 0));
        }
    }

    function get_state(where)
    {
        if(!DEBUG) return;

        var mode = cpu.protected_mode[0] ? "prot" : "real";
        var vm = (cpu.flags[0] & FLAG_VM) ? 1 : 0;
        var flags = cpu.get_eflags();
        var iopl = cpu.getiopl();
        var cpl = cpu.cpl[0];
        var cs_eip = h(cpu.sreg[REG_CS], 4) + ":" + h(cpu.get_real_eip() >>> 0, 8);
        var ss_esp = h(cpu.sreg[REG_SS], 4) + ":" + h(cpu.reg32[REG_ES] >>> 0, 8);
        var op_size = cpu.is_32[0] ? "32" : "16";
        var if_ = (cpu.flags[0] & FLAG_INTERRUPT) ? 1 : 0;

        var flag_names = {
            [FLAG_CARRY]: "c",
            [FLAG_PARITY]: "p",
            [FLAG_ADJUST]: "a",
            [FLAG_ZERO]: "z",
            [FLAG_SIGN]: "s",
            [FLAG_TRAP]: "t",
            [FLAG_INTERRUPT]: "i",
            [FLAG_DIRECTION]: "d",
            [FLAG_OVERFLOW]: "o",
        };
        var flag_string = "";

        for(var i = 0; i < 16; i++)
        {
            if(flag_names[1 << i])
            {
                if(flags & 1 << i)
                {
                    flag_string += flag_names[1 << i];
                }
                else
                {
                    flag_string += " ";
                }
            }
        }

        return ("mode=" + mode + "/" + op_size + " paging=" + (+((cpu.cr[0] & CR0_PG) !== 0)) +
                " pae=" + (+((cpu.cr[4] & CR4_PAE) !== 0)) +
                " iopl=" + iopl + " cpl=" + cpl + " if=" + if_ + " cs:eip=" + cs_eip +
                " cs_off=" + h(cpu.get_seg_cs() >>> 0, 8) +
                " flgs=" + h(cpu.get_eflags() >>> 0, 6) + " (" + flag_string + ")" +
                " ss:esp=" + ss_esp +
                " ssize=" + (+cpu.stack_size_32[0]) +
                (where ? " in " + where : ""));
    }

    function dump_state(where)
    {
        if(!DEBUG) return;

        dbg_log(get_state(where), LOG_CPU);
    }

    function get_regs_short()
    {
        if(!DEBUG) return;

        var
            r32 = { "eax": REG_EAX, "ecx": REG_ECX, "edx": REG_EDX, "ebx": REG_EBX,
                    "esp": REG_ESP, "ebp": REG_EBP, "esi": REG_ESI, "edi": REG_EDI },
            r32_names = ["eax", "ecx", "edx", "ebx", "esp", "ebp", "esi", "edi"],
            s = { "cs": REG_CS, "ds": REG_DS, "es": REG_ES, "fs": REG_FS, "gs": REG_GS, "ss": REG_SS },
            line1 = "",
            line2 = "";

        for(var i = 0; i < 4; i++)
        {
            line1 += r32_names[i] + "="  + h(cpu.reg32[r32[r32_names[i]]] >>> 0, 8) + " ";
            line2 += r32_names[i+4] + "="  + h(cpu.reg32[r32[r32_names[i+4]]] >>> 0, 8) + " ";
        }

        //line1 += " eip=" + h(cpu.get_real_eip() >>> 0, 8);
        //line2 += " flg=" + h(cpu.get_eflags(), 8);

        line1 += "  ds=" + h(cpu.sreg[REG_DS], 4) + " es=" + h(cpu.sreg[REG_ES], 4) + " fs=" + h(cpu.sreg[REG_FS], 4);
        line2 += "  gs=" + h(cpu.sreg[REG_GS], 4) + " cs=" + h(cpu.sreg[REG_CS], 4) + " ss=" + h(cpu.sreg[REG_SS], 4);

        return [line1, line2];
    }

    function dump_regs_short()
    {
        if(!DEBUG) return;

        var lines = get_regs_short();

        dbg_log(lines[0], LOG_CPU);
        dbg_log(lines[1], LOG_CPU);
    }

    function dump_gdt_ldt()
    {
        if(!DEBUG) return;

        dbg_log("gdt: (len = " + h(cpu.gdtr_size[0]) + ")");
        dump_table(cpu.translate_address_system_read(cpu.gdtr_offset[0]), cpu.gdtr_size[0]);

        dbg_log("\nldt: (len = " + h(cpu.segment_limits[REG_LDTR]) + ")");
        dump_table(cpu.translate_address_system_read(cpu.segment_offsets[REG_LDTR]), cpu.segment_limits[REG_LDTR]);

        function dump_table(addr, size)
        {
            for(var i = 0; i < size; i += 8, addr += 8)
            {
                var base = cpu.read16(addr + 2) |
                        cpu.read8(addr + 4) << 16 |
                        cpu.read8(addr + 7) << 24,

                    limit = cpu.read16(addr) | (cpu.read8(addr + 6) & 0xF) << 16,
                    access = cpu.read8(addr + 5),
                    flags = cpu.read8(addr + 6) >> 4,
                    flags_str = "",
                    dpl = access >> 5 & 3;

                if(!(access & 128))
                {
                    // present bit not set
                    //continue;
                    flags_str += "NP ";
                }
                else
                {
                    flags_str += " P ";
                }

                if(access & 16)
                {
                    if(flags & 4)
                    {
                        flags_str += "32b ";
                    }
                    else
                    {
                        flags_str += "16b ";
                    }

                    if(access & 8)
                    {
                        // executable
                        flags_str += "X ";

                        if(access & 4)
                        {
                            flags_str += "C ";
                        }
                    }
                    else
                    {
                        // data
                        flags_str += "R ";
                    }

                    flags_str += "RW ";
                }
                else
                {
                    // system
                    flags_str += "sys: " + h(access & 15);
                }

                if(flags & 8)
                {
                    limit = limit << 12 | 0xFFF;
                }

                dbg_log(h(i & ~7, 4) + " " + h(base >>> 0, 8) + " (" + h(limit >>> 0, 8) + " bytes) " +
                        flags_str + ";  dpl = " + dpl + ", a = " + access.toString(2) +
                        ", f = " + flags.toString(2));
            }
        }
    }

    function dump_idt()
    {
        if(!DEBUG) return;

        for(var i = 0; i < cpu.idtr_size[0]; i += 8)
        {
            var addr = cpu.translate_address_system_read(cpu.idtr_offset[0] + i),
                base = cpu.read16(addr) | cpu.read16(addr + 6) << 16,
                selector = cpu.read16(addr + 2),
                type = cpu.read8(addr + 5),
                line,
                dpl = type >> 5 & 3;

            if((type & 31) === 5)
            {
                line = "task gate ";
            }
            else if((type & 31) === 14)
            {
                line = "intr gate ";
            }
            else if((type & 31) === 15)
            {
                line = "trap gate ";
            }
            else
            {
                line = "invalid   ";
            }


            if(type & 128)
            {
                line += " P";
            }
            else
            {
                // present bit not set
                //continue;
                line += "NP";
            }


            dbg_log(h(i >> 3, 4) + " " + h(base >>> 0, 8) + ", " +
                    h(selector, 4) + "; " + line + ";  dpl = " + dpl + ", t = " + type.toString(2));
        }
    }

    function load_page_entry(dword_entry, pae, is_directory)
    {
        if(!DEBUG) return;

        if(!(dword_entry & 1))
        {
            // present bit not set
            return false;
        }

        var size = (dword_entry & 128) === 128,
            address;

        if(size && !is_directory)
        {
            address = dword_entry & (pae ? 0xFFE00000 : 0xFFC00000);
        }
        else
        {
            address = dword_entry & 0xFFFFF000;
        }

        return {
            size: size,
            global: (dword_entry & 256) === 256,
            accessed: (dword_entry & 0x20) === 0x20,
            dirty: (dword_entry & 0x40) === 0x40,
            cache_disable : (dword_entry & 16) === 16,
            user : (dword_entry & 4) === 4,
            read_write : (dword_entry & 2) === 2,
            address : address >>> 0
        };
    }

    function dump_page_structures() {
        var pae = !!(cpu.cr[4] & CR4_PAE);
        if(pae)
        {
            dbg_log("PAE enabled");

            for(var i = 0; i < 4; i++) {
                var addr = cpu.cr[3] + 8 * i;
                var dword = cpu.read32s(addr);
                if(dword & 1)
                {
                    dump_page_directory(dword & 0xFFFFF000, true, i << 30);
                }
            }
        }
        else
        {
            dbg_log("PAE disabled");
            dump_page_directory(cpu.cr[3], false, 0);
        }
    }

    /* NOTE: PAE entries are 64-bits, we ignore the high half here. */
    function dump_page_directory(pd_addr, pae, start)
    {
        if(!DEBUG) return;

        var n = pae ? 512 : 1024;
        var entry_size = pae ? 8 : 4;
        var pd_shift = pae ? 21 : 22;

        for(var i = 0; i < n; i++)
        {
            var addr = pd_addr + i * entry_size,
                dword = cpu.read32s(addr),
                entry = load_page_entry(dword, pae, true);

            if(!entry)
            {
                continue;
            }

            var flags = "";

            flags += entry.size ? "S " : "  ";
            flags += entry.accessed ? "A " : "  ";
            flags += entry.cache_disable ? "Cd " : "  ";
            flags += entry.user ? "U " : "  ";
            flags += entry.read_write ? "Rw " : "   ";

            if(entry.size)
            {
                dbg_log("=== " + h(start + (i << pd_shift) >>> 0, 8) + " -> " +
                    h(entry.address >>> 0, 8) + " | " + flags);
                continue;
            }
            else
            {
                dbg_log("=== " + h(start + (i << pd_shift) >>> 0, 8) + " | " + flags);
            }

            for(var j = 0; j < n; j++)
            {
                var sub_addr = entry.address + j * entry_size;
                dword = cpu.read32s(sub_addr);

                var subentry = load_page_entry(dword, pae, false);

                if(subentry)
                {
                    flags = "";

                    flags += subentry.cache_disable ? "Cd " : "   ";
                    flags += subentry.user ? "U " : "  ";
                    flags += subentry.read_write ? "Rw " : "   ";
                    flags += subentry.global ? "G " : "  ";
                    flags += subentry.accessed ? "A " : "  ";
                    flags += subentry.dirty ? "Di " : "   ";

                    dbg_log("# " + h(start + (i << pd_shift | j << 12) >>> 0, 8) + " -> " +
                            h(subentry.address, 8) + " | " + flags + "        (at " + h(sub_addr, 8) + ")");
                }
            }
        }
    }


    function get_memory_dump(start, count)
    {
        if(!DEBUG) return;

        if(start === undefined)
        {
            start = 0;
            count = cpu.memory_size[0];
        }
        else if(count === undefined)
        {
            count = start;
            start = 0;
        }

        return cpu.mem8.slice(start, start + count).buffer;
    }


    function memory_hex_dump(addr, length)
    {
        if(!DEBUG) return;

        length = length || 4 * 0x10;
        var line, byt;

        for(var i = 0; i < length >> 4; i++)
        {
            line = h(addr + (i << 4), 5) + "   ";

            for(var j = 0; j < 0x10; j++)
            {
                byt = cpu.read8(addr + (i << 4) + j);
                line += h(byt, 2) + " ";
            }

            line += "  ";

            for(j = 0; j < 0x10; j++)
            {
                byt = cpu.read8(addr + (i << 4) + j);
                line += (byt < 33 || byt > 126) ? "." : String.fromCharCode(byt);
            }

            dbg_log(line);
        }
    }

    function used_memory_dump()
    {
        if(!DEBUG) return;

        var width = 0x80,
            height = 0x10,
            block_size = cpu.memory_size[0] / width / height | 0,
            row;

        for(var i = 0; i < height; i++)
        {
            row = h(i * width * block_size, 8) + " | ";

            for(var j = 0; j < width; j++)
            {
                var used = cpu.mem32s[(i * width + j) * block_size] > 0;

                row += used ? "X" : " ";
            }

            dbg_log(row);
        }
    }


    debug.debug_interrupt = function(interrupt_nr)
    {
        //if(interrupt_nr === 0x20)
        //{
        //    //var vxd_device = cpu.safe_read16(cpu.instruction_pointer + 2);
        //    //var vxd_sub = cpu.safe_read16(cpu.instruction_pointer + 0);
        //    //var service = "";
        //    //if(vxd_device === 1)
        //    //{
        //    //    service = vxd_table1[vxd_sub];
        //    //}
        //    //dbg_log("vxd: " + h(vxd_device, 4) + " " + h(vxd_sub, 4) + " " + service);
        //}

        //if(interrupt_nr >= 0x21 && interrupt_nr < 0x30)
        //{
        //    dbg_log("dos: " + h(interrupt_nr, 2) + " ah=" + h(this.reg8[reg_ah], 2) + " ax=" + h(this.reg16[reg_ax], 4));
        //}

        //if(interrupt_nr === 0x13 && (this.reg8[reg_ah] | 1) === 0x43)
        //{
        //    this.debug.memory_hex_dump(this.get_seg(reg_ds) + this.reg16[reg_si], 0x18);
        //}

        //if(interrupt_nr == 0x10)
        //{
        //    dbg_log("int10 ax=" + h(this.reg16[reg_ax], 4) + " '" + String.fromCharCode(this.reg8[reg_al]) + "'");
        //    this.debug.dump_regs_short();
        //    if(this.reg8[reg_ah] == 0xe) vga.tt_write(this.reg8[reg_al]);
        //}

        //if(interrupt_nr === 0x13)
        //{
        //    this.debug.dump_regs_short();
        //}

        //if(interrupt_nr === 6)
        //{
        //    this.instruction_pointer += 2;
        //    dbg_log("BUG()", LOG_CPU);
        //    dbg_log("line=" + this.read_imm16() + " " +
        //            "file=" + this.read_string(this.translate_address_read(this.read_imm32s())), LOG_CPU);
        //    this.instruction_pointer -= 8;
        //    this.debug.dump_regs_short();
        //}

        //if(interrupt_nr === 0x80)
        //{
        //    dbg_log("linux syscall");
        //    this.debug.dump_regs_short();
        //}

        //if(interrupt_nr === 0x40)
        //{
        //    dbg_log("kolibri syscall");
        //    this.debug.dump_regs_short();
        //}
    };

    let cs;
    let capstone_decoder;

    debug.dump_code = function(is_32, buffer, start)
    {
        if(!capstone_decoder)
        {
            if(cs === undefined)
            {
                /* global require */
                if(typeof require === "function")
                {
                    cs = require("./capstone-x86.min.js");
                }
                else
                {
                    cs = window.cs;
                }

                if(cs === undefined)
                {
                    dbg_log("Warning: Missing capstone library, disassembly not available");
                    return;
                }
            }

            capstone_decoder = [
                new cs.Capstone(cs.ARCH_X86, cs.MODE_16),
                new cs.Capstone(cs.ARCH_X86, cs.MODE_32),
            ];
        }

        try
        {
            const instructions = capstone_decoder[is_32].disasm(buffer, start);

            instructions.forEach(function (instr) {
                dbg_log(h(instr.address >>> 0) + ": " +
                    pads(instr.bytes.map(x => h(x, 2).slice(-2)).join(" "), 20) + " " +
                    instr.mnemonic + " " + instr.op_str);
            });
            dbg_log("");
        }
        catch(e)
        {
            dbg_log("Could not disassemble: " + Array.from(buffer).map(x => h(x, 2)).join(" "));
        }
    };

    function dump_file(ab, name)
    {
        var blob = new Blob([ab]);

        var a = document.createElement("a");
        a["download"] = name;
        a.href = window.URL.createObjectURL(blob);
        a.dataset["downloadurl"] = ["application/octet-stream", a["download"], a.href].join(":");

        a.click();
        window.URL.revokeObjectURL(a.src);
    }

    let wabt;

    debug.dump_wasm = function(buffer)
    {
        /* global require */
        if(wabt === undefined)
        {
            if(typeof require === "function")
            {
                wabt = require("./libwabt.cjs");
            }
            else
            {
                wabt = new window.WabtModule;
            }

            if(wabt === undefined)
            {
                dbg_log("Warning: Missing libwabt, wasm dump not available");
                return;
            }
        }

        // Need to make a small copy otherwise libwabt goes nuts trying to copy
        // the whole underlying buffer
        buffer = buffer.slice();

        try
        {
            var module = wabt.readWasm(buffer, { readDebugNames: false });
            module.generateNames();
            module.applyNames();
            const result = module.toText({ foldExprs: true, inlineExport: true });
            dbg_log(result);
        }
        catch(e)
        {
            dump_file(buffer, "failed.wasm");
            console.log(e.toString());
        }
        finally
        {
            if(module)
            {
                module.destroy();
            }
        }
    };
};


// ---- File: src/state.js ----




const STATE_VERSION = 6;
const STATE_MAGIC = 0x86768676|0;
const STATE_INDEX_MAGIC = 0;
const STATE_INDEX_VERSION = 1;
const STATE_INDEX_TOTAL_LEN = 2;
const STATE_INDEX_INFO_LEN = 3;
const STATE_INFO_BLOCK_START = 16;

const ZSTD_MAGIC = 0xFD2FB528;

/** @constructor */
function StateLoadError(msg)
{
    this.message = msg;
}
StateLoadError.prototype = new Error;

const CONSTRUCTOR_TABLE = {
    "Uint8Array": Uint8Array,
    "Int8Array": Int8Array,
    "Uint16Array": Uint16Array,
    "Int16Array": Int16Array,
    "Uint32Array": Uint32Array,
    "Int32Array": Int32Array,
    "Float32Array": Float32Array,
    "Float64Array": Float64Array,
};

function save_object(obj, saved_buffers)
{
    if(typeof obj !== "object" || obj === null)
    {
        dbg_assert(typeof obj !== "function");
        return obj;
    }

    if(Array.isArray(obj))
    {
        return obj.map(x => save_object(x, saved_buffers));
    }

    if(obj.constructor === Object)
    {
        console.log(obj);
        dbg_assert(obj.constructor !== Object, "Expected non-object");
    }

    if(obj.BYTES_PER_ELEMENT)
    {
        // Uint8Array, etc.
        var buffer = new Uint8Array(obj.buffer, obj.byteOffset, obj.length * obj.BYTES_PER_ELEMENT);

        const constructor = obj.constructor.name.replace("bound ", "");

        dbg_assert(CONSTRUCTOR_TABLE[constructor]);

        return {
            "__state_type__": constructor,
            "buffer_id": saved_buffers.push(buffer) - 1,
        };
    }

    if(DEBUG && !obj.get_state)
    {
        console.log("Object without get_state: ", obj);
    }

    var state = obj.get_state();
    var result = [];

    for(var i = 0; i < state.length; i++)
    {
        var value = state[i];

        dbg_assert(typeof value !== "function");

        result[i] = save_object(value, saved_buffers);
    }

    return result;
}

function restore_buffers(obj, buffers)
{
    if(typeof obj !== "object" || obj === null)
    {
        dbg_assert(typeof obj !== "function");
        return obj;
    }

    if(Array.isArray(obj))
    {
        for(let i = 0; i < obj.length; i++)
        {
            obj[i] = restore_buffers(obj[i], buffers);
        }

        return obj;
    }

    const type = obj["__state_type__"];
    dbg_assert(type !== undefined);

    const constructor = CONSTRUCTOR_TABLE[type];
    dbg_assert(constructor, "Unkown type: " + type);

    const buffer = buffers[obj["buffer_id"]];
    return new constructor(buffer);
}

/* @param {CPU} cpu */
function save_state(cpu)
{
    var saved_buffers = [];
    var state = save_object(cpu, saved_buffers);

    var buffer_infos = [];
    var total_buffer_size = 0;

    for(var i = 0; i < saved_buffers.length; i++)
    {
        var len = saved_buffers[i].byteLength;

        buffer_infos[i] = {
            offset: total_buffer_size,
            length: len,
        };

        total_buffer_size += len;

        // align
        total_buffer_size = total_buffer_size + 3 & ~3;
    }

    var info_object = JSON.stringify({
        "buffer_infos": buffer_infos,
        "state": state,
    });
    var info_block = new TextEncoder().encode(info_object);

    var buffer_block_start = STATE_INFO_BLOCK_START + info_block.length;
    buffer_block_start = buffer_block_start + 3 & ~3;
    var total_size = buffer_block_start + total_buffer_size;

    //console.log("State: json_size=" + Math.ceil(buffer_block_start / 1024 / 1024) + "MB " +
    //               "buffer_size=" + Math.ceil(total_buffer_size / 1024 / 1024) + "MB");

    var result = new ArrayBuffer(total_size);

    var header_block = new Int32Array(
        result,
        0,
        STATE_INFO_BLOCK_START / 4
    );
    new Uint8Array(result, STATE_INFO_BLOCK_START, info_block.length).set(info_block);
    var buffer_block = new Uint8Array(
        result,
        buffer_block_start
    );

    header_block[STATE_INDEX_MAGIC] = STATE_MAGIC;
    header_block[STATE_INDEX_VERSION] = STATE_VERSION;
    header_block[STATE_INDEX_TOTAL_LEN] = total_size;
    header_block[STATE_INDEX_INFO_LEN] = info_block.length;

    for(var i = 0; i < saved_buffers.length; i++)
    {
        var buffer = saved_buffers[i];
        dbg_assert(buffer.constructor === Uint8Array);
        buffer_block.set(buffer, buffer_infos[i].offset);
    }

    dbg_log("State: json size " + (info_block.byteLength >> 10) + "k");
    dbg_log("State: Total buffers size " + (buffer_block.byteLength >> 10) + "k");

    return result;
}

/* @param {CPU} cpu */
function restore_state(cpu, state)
{
    state = new Uint8Array(state);

    function read_state_header(state, check_length)
    {
        const len = state.length;

        if(len < STATE_INFO_BLOCK_START)
        {
            throw new StateLoadError("Invalid length: " + len);
        }

        const header_block = new Int32Array(state.buffer, state.byteOffset, 4);

        if(header_block[STATE_INDEX_MAGIC] !== STATE_MAGIC)
        {
            throw new StateLoadError("Invalid header: " + h(header_block[STATE_INDEX_MAGIC] >>> 0));
        }

        if(header_block[STATE_INDEX_VERSION] !== STATE_VERSION)
        {
            throw new StateLoadError(
                    "Version mismatch: dump=" + header_block[STATE_INDEX_VERSION] +
                    " we=" + STATE_VERSION);
        }

        if(check_length && header_block[STATE_INDEX_TOTAL_LEN] !== len)
        {
            throw new StateLoadError(
                    "Length doesn't match header: " +
                    "real=" + len + " header=" + header_block[STATE_INDEX_TOTAL_LEN]);
        }

        return header_block[STATE_INDEX_INFO_LEN];
    }

    function read_info_block(info_block_buffer)
    {
        const info_block = new TextDecoder().decode(info_block_buffer);
        return JSON.parse(info_block);
    }

    if(new Uint32Array(state.buffer, 0, 1)[0] === ZSTD_MAGIC)
    {
        const ctx = cpu.zstd_create_ctx(state.length);

        new Uint8Array(cpu.wasm_memory.buffer, cpu.zstd_get_src_ptr(ctx), state.length).set(state);

        let ptr = cpu.zstd_read(ctx, 16);
        const header_block = new Uint8Array(cpu.wasm_memory.buffer, ptr, 16);
        const info_block_len = read_state_header(header_block, false);
        cpu.zstd_read_free(ptr, 16);

        ptr = cpu.zstd_read(ctx, info_block_len);
        const info_block_buffer = new Uint8Array(cpu.wasm_memory.buffer, ptr, info_block_len);
        const info_block_obj = read_info_block(info_block_buffer);
        cpu.zstd_read_free(ptr, info_block_len);

        let state_object = info_block_obj["state"];
        const buffer_infos = info_block_obj["buffer_infos"];
        const buffers = [];

        let position = STATE_INFO_BLOCK_START + info_block_len;

        for(const buffer_info of buffer_infos)
        {
            const front_padding = (position + 3 & ~3) - position;
            const CHUNK_SIZE = 1 * 1024 * 1024;

            if(buffer_info.length > CHUNK_SIZE)
            {
                const ptr = cpu.zstd_read(ctx, front_padding);
                cpu.zstd_read_free(ptr, front_padding);

                const buffer = new Uint8Array(buffer_info.length);
                buffers.push(buffer.buffer);

                let have = 0;
                while(have < buffer_info.length)
                {
                    const remaining = buffer_info.length - have;
                    dbg_assert(remaining >= 0);
                    const to_read = Math.min(remaining, CHUNK_SIZE);

                    const ptr = cpu.zstd_read(ctx, to_read);
                    buffer.set(new Uint8Array(cpu.wasm_memory.buffer, ptr, to_read), have);
                    cpu.zstd_read_free(ptr, to_read);

                    have += to_read;
                }
            }
            else
            {
                const ptr = cpu.zstd_read(ctx, front_padding + buffer_info.length);
                const offset = ptr + front_padding;
                buffers.push(cpu.wasm_memory.buffer.slice(offset, offset + buffer_info.length));
                cpu.zstd_read_free(ptr, front_padding + buffer_info.length);
            }

            position += front_padding + buffer_info.length;
        }

        state_object = restore_buffers(state_object, buffers);
        cpu.set_state(state_object);

        cpu.zstd_free_ctx(ctx);
    }
    else
    {
        const info_block_len = read_state_header(state, true);

        if(info_block_len < 0 || info_block_len + 12 >= state.length)
        {
            throw new StateLoadError("Invalid info block length: " + info_block_len);
        }

        const info_block_buffer = state.subarray(STATE_INFO_BLOCK_START, STATE_INFO_BLOCK_START + info_block_len);
        const info_block_obj = read_info_block(info_block_buffer);
        let state_object = info_block_obj["state"];
        const buffer_infos = info_block_obj["buffer_infos"];
        let buffer_block_start = STATE_INFO_BLOCK_START + info_block_len;
        buffer_block_start = buffer_block_start + 3 & ~3;

        const buffers = buffer_infos.map(buffer_info => {
            const offset = buffer_block_start + buffer_info.offset;
            return state.buffer.slice(offset, offset + buffer_info.length);
        });

        state_object = restore_buffers(state_object, buffers);
        cpu.set_state(state_object);
    }
}


// ---- File: src/main.js ----



/**
 * @constructor
 * @param {Object=} wasm
 */
function v86(bus, wasm)
{
    /** @type {boolean} */
    this.running = false;

    /** @type {boolean} */
    this.stopping = false;

    /** @type {boolean} */
    this.idle = true;

    this.tick_counter = 0;
    this.worker = null;

    /** @type {CPU} */
    this.cpu = new CPU(bus, wasm, () => { this.idle && this.next_tick(0); });

    this.bus = bus;

    this.register_yield();
}

v86.prototype.run = function()
{
    this.stopping = false;

    if(!this.running)
    {
        this.running = true;
        this.bus.send("emulator-started");
    }

    this.next_tick(0);
};

v86.prototype.do_tick = function()
{
    if(this.stopping || !this.running)
    {
        this.stopping = this.running = false;
        this.bus.send("emulator-stopped");
        return;
    }

    this.idle = false;
    const t = this.cpu.main_loop();

    this.next_tick(t);
};

v86.prototype.next_tick = function(t)
{
    const tick = ++this.tick_counter;
    this.idle = true;
    this.yield(t, tick);
};

v86.prototype.yield_callback = function(tick)
{
    if(tick === this.tick_counter)
    {
        this.do_tick();
    }
};

v86.prototype.stop = function()
{
    if(this.running)
    {
        this.stopping = true;
    }
};

v86.prototype.destroy = function()
{
    this.unregister_yield();
};

v86.prototype.restart = function()
{
    this.cpu.reset_cpu();
    this.cpu.load_bios();
};

v86.prototype.init = function(settings)
{
    this.cpu.init(settings, this.bus);
    this.bus.send("emulator-ready");
};

if(typeof process !== "undefined")
{
    v86.prototype.yield = function(t, tick)
    {
        /* global global */
        if(t < 1)
        {
            global.setImmediate(tick => this.yield_callback(tick), tick);
        }
        else
        {
            setTimeout(tick => this.yield_callback(tick), t, tick);
        }
    };

    v86.prototype.register_yield = function() {};
    v86.prototype.unregister_yield = function() {};
}
else if(typeof Worker !== "undefined")
{
    // XXX: This has a slightly lower throughput compared to window.postMessage

    function the_worker()
    {
        let timeout;
        globalThis.onmessage = function(e)
        {
            const t = e.data.t;
            timeout = timeout && clearTimeout(timeout);
            if(t < 1) postMessage(e.data.tick);
            else timeout = setTimeout(() => postMessage(e.data.tick), t);
        };
    }

    v86.prototype.register_yield = function()
    {
        const url = URL.createObjectURL(new Blob(["(" + the_worker.toString() + ")()"], { type: "text/javascript" }));
        this.worker = new Worker(url);
        this.worker.onmessage = e => this.yield_callback(e.data);
        URL.revokeObjectURL(url);
    };

    v86.prototype.yield = function(t, tick)
    {
        this.worker.postMessage({ t, tick });
    };

    v86.prototype.unregister_yield = function()
    {
        this.worker && this.worker.terminate();
        this.worker = null;
    };
}
//else if(typeof window !== "undefined" && typeof postMessage !== "undefined")
//{
//    // setImmediate shim for the browser.
//    // TODO: Make this deactivatable, for other applications
//    //       using postMessage
//
//    const MAGIC_POST_MESSAGE = 0xAA55;
//
//    v86.prototype.yield = function(t)
//    {
//        // XXX: Use t
//        window.postMessage(MAGIC_POST_MESSAGE, "*");
//    };
//
//    let tick;
//
//    v86.prototype.register_yield = function()
//    {
//        tick = e =>
//        {
//            if(e.source === window && e.data === MAGIC_POST_MESSAGE)
//            {
//                this.do_tick();
//            }
//        };
//
//        window.addEventListener("message", tick, false);
//    };
//
//    v86.prototype.unregister_yield = function()
//    {
//        window.removeEventListener("message", tick);
//        tick = null;
//    };
//}
else
{
    v86.prototype.yield = function(t)
    {
        setTimeout(() => { this.do_tick(); }, t);
    };

    v86.prototype.register_yield = function() {};
    v86.prototype.unregister_yield = function() {};
}

v86.prototype.save_state = function()
{
    // TODO: Should be implemented here, not on cpu
    return save_state(this.cpu);
};

v86.prototype.restore_state = function(state)
{
    // TODO: Should be implemented here, not on cpu
    return restore_state(this.cpu, state);
};

/* global require */
if(typeof performance === "object" && performance.now)
{
    v86.microtick = performance.now.bind(performance);
}
else if(typeof require === "function")
{
    const { performance } = require("perf_hooks");
    v86.microtick = performance.now.bind(performance);
}
else if(typeof process === "object" && process.hrtime)
{
    v86.microtick = function()
    {
        var t = process.hrtime();
        return t[0] * 1000 + t[1] / 1e6;
    };
}
else
{
    v86.microtick = Date.now;
}


// ---- File: src/browser/print_stats.js ----


function stats_to_string(cpu)
{
    return print_misc_stats(cpu) + print_instruction_counts(cpu);
}

function print_misc_stats(cpu)
{
    let text = "";

    const stat_names = [
        "COMPILE",
        "COMPILE_SKIPPED_NO_NEW_ENTRY_POINTS",
        "COMPILE_WRONG_ADDRESS_SPACE",
        "COMPILE_CUT_OFF_AT_END_OF_PAGE",
        "COMPILE_WITH_LOOP_SAFETY",
        "COMPILE_PAGE",
        "COMPILE_PAGE/COMPILE",
        "COMPILE_BASIC_BLOCK",
        "COMPILE_DUPLICATED_BASIC_BLOCK",
        "COMPILE_WASM_BLOCK",
        "COMPILE_WASM_LOOP",
        "COMPILE_DISPATCHER",
        "COMPILE_ENTRY_POINT",
        "COMPILE_WASM_TOTAL_BYTES",
        "COMPILE_WASM_TOTAL_BYTES/COMPILE_PAGE",
        "RUN_INTERPRETED",
        "RUN_INTERPRETED_NEW_PAGE",
        "RUN_INTERPRETED_PAGE_HAS_CODE",
        "RUN_INTERPRETED_PAGE_HAS_ENTRY_AFTER_PAGE_WALK",
        "RUN_INTERPRETED_NEAR_END_OF_PAGE",
        "RUN_INTERPRETED_DIFFERENT_STATE",
        "RUN_INTERPRETED_DIFFERENT_STATE_CPL3",
        "RUN_INTERPRETED_DIFFERENT_STATE_FLAT",
        "RUN_INTERPRETED_DIFFERENT_STATE_IS32",
        "RUN_INTERPRETED_DIFFERENT_STATE_SS32",
        "RUN_INTERPRETED_MISSED_COMPILED_ENTRY_RUN_INTERPRETED",
        "RUN_INTERPRETED_STEPS",
        "RUN_FROM_CACHE",
        "RUN_FROM_CACHE_STEPS",
        "RUN_FROM_CACHE_STEPS/RUN_FROM_CACHE",
        "RUN_FROM_CACHE_STEPS/RUN_INTERPRETED_STEPS",
        "DIRECT_EXIT",
        "INDIRECT_JUMP",
        "INDIRECT_JUMP_NO_ENTRY",
        "NORMAL_PAGE_CHANGE",
        "NORMAL_FALLTHRU",
        "NORMAL_FALLTHRU_WITH_TARGET_BLOCK",
        "NORMAL_BRANCH",
        "NORMAL_BRANCH_WITH_TARGET_BLOCK",
        "CONDITIONAL_JUMP",
        "CONDITIONAL_JUMP_PAGE_CHANGE",
        "CONDITIONAL_JUMP_EXIT",
        "CONDITIONAL_JUMP_FALLTHRU",
        "CONDITIONAL_JUMP_FALLTHRU_WITH_TARGET_BLOCK",
        "CONDITIONAL_JUMP_BRANCH",
        "CONDITIONAL_JUMP_BRANCH_WITH_TARGET_BLOCK",
        "DISPATCHER_SMALL",
        "DISPATCHER_LARGE",
        "LOOP",
        "LOOP_SAFETY",
        "CONDITION_OPTIMISED",
        "CONDITION_UNOPTIMISED",
        "CONDITION_UNOPTIMISED_PF",
        "CONDITION_UNOPTIMISED_UNHANDLED_L",
        "CONDITION_UNOPTIMISED_UNHANDLED_LE",
        "FAILED_PAGE_CHANGE",
        "SAFE_READ_FAST",
        "SAFE_READ_SLOW_PAGE_CROSSED",
        "SAFE_READ_SLOW_NOT_VALID",
        "SAFE_READ_SLOW_NOT_USER",
        "SAFE_READ_SLOW_IN_MAPPED_RANGE",
        "SAFE_WRITE_FAST",
        "SAFE_WRITE_SLOW_PAGE_CROSSED",
        "SAFE_WRITE_SLOW_NOT_VALID",
        "SAFE_WRITE_SLOW_NOT_USER",
        "SAFE_WRITE_SLOW_IN_MAPPED_RANGE",
        "SAFE_WRITE_SLOW_READ_ONLY",
        "SAFE_WRITE_SLOW_HAS_CODE",
        "SAFE_READ_WRITE_FAST",
        "SAFE_READ_WRITE_SLOW_PAGE_CROSSED",
        "SAFE_READ_WRITE_SLOW_NOT_VALID",
        "SAFE_READ_WRITE_SLOW_NOT_USER",
        "SAFE_READ_WRITE_SLOW_IN_MAPPED_RANGE",
        "SAFE_READ_WRITE_SLOW_READ_ONLY",
        "SAFE_READ_WRITE_SLOW_HAS_CODE",
        "PAGE_FAULT",
        "TLB_MISS",
        "MAIN_LOOP",
        "MAIN_LOOP_IDLE",
        "DO_MANY_CYCLES",
        "CYCLE_INTERNAL",
        "INVALIDATE_ALL_MODULES_NO_FREE_WASM_INDICES",
        "INVALIDATE_MODULE_WRITTEN_WHILE_COMPILED",
        "INVALIDATE_MODULE_UNUSED_AFTER_OVERWRITE",
        "INVALIDATE_MODULE_DIRTY_PAGE",
        "INVALIDATE_PAGE_HAD_CODE",
        "INVALIDATE_PAGE_HAD_ENTRY_POINTS",
        "DIRTY_PAGE_DID_NOT_HAVE_CODE",
        "RUN_FROM_CACHE_EXIT_SAME_PAGE",
        "RUN_FROM_CACHE_EXIT_NEAR_END_OF_PAGE",
        "RUN_FROM_CACHE_EXIT_DIFFERENT_PAGE",
        "CLEAR_TLB",
        "FULL_CLEAR_TLB",
        "TLB_FULL",
        "TLB_GLOBAL_FULL",
        "MODRM_SIMPLE_REG",
        "MODRM_SIMPLE_REG_WITH_OFFSET",
        "MODRM_SIMPLE_CONST_OFFSET",
        "MODRM_COMPLEX",
        "SEG_OFFSET_OPTIMISED",
        "SEG_OFFSET_NOT_OPTIMISED",
        "SEG_OFFSET_NOT_OPTIMISED_ES",
        "SEG_OFFSET_NOT_OPTIMISED_FS",
        "SEG_OFFSET_NOT_OPTIMISED_GS",
        "SEG_OFFSET_NOT_OPTIMISED_NOT_FLAT",
    ];

    let j = 0;
    const stat_values = {};
    for(let i = 0; i < stat_names.length; i++)
    {
        const name = stat_names[i];
        let value;
        if(name.includes("/"))
        {
            j++; // skip profiler_stat_get
            const [left, right] = name.split("/");
            value = stat_values[left] / stat_values[right];
        }
        else
        {
            const stat = stat_values[name] = cpu.wm.exports["profiler_stat_get"](i - j);
            value = stat >= 100e6 ? Math.round(stat / 1e6) + "m" : stat >= 100e3 ? Math.round(stat / 1e3) + "k" : stat;
        }
        text += name + "=" + value + "\n";
    }

    text += "\n";

    const tlb_entries = cpu.wm.exports["get_valid_tlb_entries_count"]();
    const global_tlb_entries = cpu.wm.exports["get_valid_global_tlb_entries_count"]();
    const nonglobal_tlb_entries = tlb_entries - global_tlb_entries;

    text += "TLB_ENTRIES=" + tlb_entries + " (" + global_tlb_entries + " global, " + nonglobal_tlb_entries + " non-global)\n";
    text += "WASM_TABLE_FREE=" + cpu.wm.exports["jit_get_wasm_table_index_free_list_count"]() + "\n";
    text += "JIT_CACHE_SIZE=" + cpu.wm.exports["jit_get_cache_size"]() + "\n";
    text += "FLAT_SEGMENTS=" + cpu.wm.exports["has_flat_segmentation"]() + "\n";

    text += "wasm memory size: " + (cpu.wasm_memory.buffer.byteLength >> 20) + "m\n";

    text += "Config:\n";
    text += "JIT_DISABLED=" + cpu.wm.exports["get_jit_config"](0) + "\n";
    text += "MAX_PAGES=" + cpu.wm.exports["get_jit_config"](1) + "\n";
    text += "JIT_USE_LOOP_SAFETY=" + Boolean(cpu.wm.exports["get_jit_config"](2)) + "\n";
    text += "MAX_EXTRA_BASIC_BLOCKS=" + cpu.wm.exports["get_jit_config"](3) + "\n";

    return text;
}

function print_instruction_counts(cpu)
{
    return [
        print_instruction_counts_offset(cpu, false, false, false, false),
        print_instruction_counts_offset(cpu, true, false, false, false),
        print_instruction_counts_offset(cpu, false, true, false, false),
        print_instruction_counts_offset(cpu, false, false, true, false),
        print_instruction_counts_offset(cpu, false, false, false, true),
    ].join("\n\n");
}

function print_instruction_counts_offset(cpu, compiled, jit_exit, unguarded_register, wasm_size)
{
    let text = "";

    const counts = [];

    const label =
        compiled ? "compiled" :
        jit_exit ? "jit exit" :
        unguarded_register ? "unguarded register" :
        wasm_size ? "wasm size" :
        "executed";

    for(let opcode = 0; opcode < 0x100; opcode++)
    {
        for(let fixed_g = 0; fixed_g < 8; fixed_g++)
        {
            for(const is_mem of [false, true])
            {
                const count = cpu.wm.exports["get_opstats_buffer"](compiled, jit_exit, unguarded_register, wasm_size, opcode, false, is_mem, fixed_g);
                counts.push({ opcode, count, is_mem, fixed_g });

                const count_0f = cpu.wm.exports["get_opstats_buffer"](compiled, jit_exit, unguarded_register, wasm_size, opcode, true, is_mem, fixed_g);
                counts.push({ opcode: 0x0f00 | opcode, count: count_0f, is_mem, fixed_g });
            }
        }
    }

    let total = 0;
    const prefixes = new Set([
        0x26, 0x2E, 0x36, 0x3E,
        0x64, 0x65, 0x66, 0x67,
        0xF0, 0xF2, 0xF3,
    ]);
    for(const { count, opcode } of counts)
    {
        if(!prefixes.has(opcode))
        {
            total += count;
        }
    }

    if(total === 0)
    {
        return "";
    }

    const per_opcode = new Uint32Array(0x100);
    const per_opcode0f = new Uint32Array(0x100);

    for(const { opcode, count } of counts)
    {
        if((opcode & 0xFF00) === 0x0F00)
        {
            per_opcode0f[opcode & 0xFF] += count;
        }
        else
        {
            per_opcode[opcode & 0xFF] += count;
        }
    }

    text += "------------------\n";
    text += "Total: " + total + "\n";

    const factor = total > 1e7 ? 1000 : 1;

    const max_count = Math.max.apply(Math,
        counts.map(({ count }) => Math.round(count / factor))
    );
    const pad_length = String(max_count).length;

    text += `Instruction counts ${label} (in ${factor}):\n`;

    for(let i = 0; i < 0x100; i++)
    {
        text += i.toString(16).padStart(2, "0") + ":" + pads(Math.round(per_opcode[i] / factor), pad_length);

        if(i % 16 === 15)
            text += "\n";
        else
            text += " ";
    }

    text += "\n";
    text += `Instruction counts ${label} (0f, in ${factor}):\n`;

    for(let i = 0; i < 0x100; i++)
    {
        text += (i & 0xFF).toString(16).padStart(2, "0") + ":" + pads(Math.round(per_opcode0f[i] / factor), pad_length);

        if(i % 16 === 15)
            text += "\n";
        else
            text += " ";
    }
    text += "\n";

    const top_counts = counts.filter(({ count }) => count).sort(({ count: count1 }, { count: count2 }) => count2 - count1);

    for(const { opcode, is_mem, fixed_g, count } of top_counts.slice(0, 200))
    {
        const opcode_description = opcode.toString(16) + "_" + fixed_g + (is_mem ? "_m" : "_r");
        text += opcode_description + ":" + (count / total * 100).toFixed(2) + " ";
    }
    text += "\n";

    return text;
}


// ---- File: src/browser/speaker.js ----





// For Types Only


/* global registerProcessor, sampleRate */

const DAC_QUEUE_RESERVE = 0.2;

const AUDIOBUFFER_MINIMUM_SAMPLING_RATE = 8000;

/**
 * @constructor
 * @param {!BusConnector} bus
 */
function SpeakerAdapter(bus)
{
    if(typeof window === "undefined")
    {
        return;
    }
    if(!window.AudioContext && !window["webkitAudioContext"])
    {
        console.warn("Web browser doesn't support Web Audio API");
        return;
    }

    var SpeakerDAC = window.AudioWorklet ? SpeakerWorkletDAC : SpeakerBufferSourceDAC;

    /** @const */
    this.bus = bus;

    this.audio_context = window.AudioContext ? new AudioContext() : new webkitAudioContext();

    /** @const */
    this.mixer = new SpeakerMixer(bus, this.audio_context);

    /** @const */
    this.pcspeaker = new PCSpeaker(bus, this.audio_context, this.mixer);

    this.dac = new SpeakerDAC(bus, this.audio_context, this.mixer);

    this.pcspeaker.start();

    bus.register("emulator-stopped", function()
    {
        this.audio_context.suspend();
    }, this);

    bus.register("emulator-started", function()
    {
        this.audio_context.resume();
    }, this);

    bus.register("speaker-confirm-initialized", function()
    {
        bus.send("speaker-has-initialized");
    }, this);
    bus.send("speaker-has-initialized");
}

SpeakerAdapter.prototype.destroy = function()
{
    this.audio_context && this.audio_context.close();
    this.audio_context = null;
    this.dac && this.dac.node_processor && this.dac.node_processor.port.close();
    this.dac = null;
};

/**
 * @constructor
 * @param {!BusConnector} bus
 * @param {!AudioContext} audio_context
 */
function SpeakerMixer(bus, audio_context)
{
    /** @const */
    this.audio_context = audio_context;

    this.sources = new Map();

    // States

    this.volume_both = 1;
    this.volume_left = 1;
    this.volume_right = 1;
    this.gain_left = 1;
    this.gain_right = 1;

    // Nodes
    // TODO: Find / calibrate / verify the filter frequencies

    this.node_treble_left = this.audio_context.createBiquadFilter();
    this.node_treble_right = this.audio_context.createBiquadFilter();
    this.node_treble_left.type = "highshelf";
    this.node_treble_right.type = "highshelf";
    this.node_treble_left.frequency.setValueAtTime(2000, this.audio_context.currentTime);
    this.node_treble_right.frequency.setValueAtTime(2000, this.audio_context.currentTime);

    this.node_bass_left = this.audio_context.createBiquadFilter();
    this.node_bass_right = this.audio_context.createBiquadFilter();
    this.node_bass_left.type = "lowshelf";
    this.node_bass_right.type = "lowshelf";
    this.node_bass_left.frequency.setValueAtTime(200, this.audio_context.currentTime);
    this.node_bass_right.frequency.setValueAtTime(200, this.audio_context.currentTime);

    this.node_gain_left = this.audio_context.createGain();
    this.node_gain_right = this.audio_context.createGain();

    this.node_merger = this.audio_context.createChannelMerger(2);

    // Graph

    this.input_left = this.node_treble_left;
    this.input_right = this.node_treble_right;

    this.node_treble_left.connect(this.node_bass_left);
    this.node_bass_left.connect(this.node_gain_left);
    this.node_gain_left.connect(this.node_merger, 0, 0);

    this.node_treble_right.connect(this.node_bass_right);
    this.node_bass_right.connect(this.node_gain_right);
    this.node_gain_right.connect(this.node_merger, 0, 1);

    this.node_merger.connect(this.audio_context.destination);

    // Interface

    bus.register("mixer-connect", function(data)
    {
        var source_id = data[0];
        var channel = data[1];
        this.connect_source(source_id, channel);
    }, this);

    bus.register("mixer-disconnect", function(data)
    {
        var source_id = data[0];
        var channel = data[1];
        this.disconnect_source(source_id, channel);
    }, this);

    bus.register("mixer-volume", function(data)
    {
        var source_id = data[0];
        var channel = data[1];
        var decibels = data[2];

        var gain = Math.pow(10, decibels / 20);

        var source = source_id === MIXER_SRC_MASTER ? this : this.sources.get(source_id);

        if(source === undefined)
        {
            dbg_assert(false, "Mixer set volume - cannot set volume for undefined source: " + source_id);
            return;
        }

        source.set_volume(gain, channel);
    }, this);

    bus.register("mixer-gain-left", function(/** number */ decibels)
    {
        this.gain_left = Math.pow(10, decibels / 20);
        this.update();
    }, this);

    bus.register("mixer-gain-right", function(/** number */ decibels)
    {
        this.gain_right = Math.pow(10, decibels / 20);
        this.update();
    }, this);

    function create_gain_handler(audio_node)
    {
        return function(decibels)
        {
            audio_node.gain.setValueAtTime(decibels, this.audio_context.currentTime);
        };
    }
    bus.register("mixer-treble-left", create_gain_handler(this.node_treble_left), this);
    bus.register("mixer-treble-right", create_gain_handler(this.node_treble_right), this);
    bus.register("mixer-bass-left", create_gain_handler(this.node_bass_left), this);
    bus.register("mixer-bass-right", create_gain_handler(this.node_bass_right), this);
}

/**
 * @param {!AudioNode} source_node
 * @param {number} source_id
 * @return {SpeakerMixerSource}
 */
SpeakerMixer.prototype.add_source = function(source_node, source_id)
{
    var source = new SpeakerMixerSource(
        this.audio_context,
        source_node,
        this.input_left,
        this.input_right
    );

    dbg_assert(!this.sources.has(source_id), "Mixer add source - overwritting source: " + source_id);

    this.sources.set(source_id, source);
    return source;
};

/**
 * @param {number} source_id
 * @param {number=} channel
 */
SpeakerMixer.prototype.connect_source = function(source_id, channel)
{
    var source = this.sources.get(source_id);

    if(source === undefined)
    {
        dbg_assert(false, "Mixer connect - cannot connect undefined source: " + source_id);
        return;
    }

    source.connect(channel);
};

/**
 * @param {number} source_id
 * @param {number=} channel
 */
SpeakerMixer.prototype.disconnect_source = function(source_id, channel)
{
    var source = this.sources.get(source_id);

    if(source === undefined)
    {
        dbg_assert(false, "Mixer disconnect - cannot disconnect undefined source: " + source_id);
        return;
    }

    source.disconnect(channel);
};

/**
 * @param {number} value
 * @param {number=} channel
 */
SpeakerMixer.prototype.set_volume = function(value, channel)
{
    if(channel === undefined)
    {
        channel = MIXER_CHANNEL_BOTH;
    }

    switch(channel)
    {
        case MIXER_CHANNEL_LEFT:
            this.volume_left = value;
            break;
        case MIXER_CHANNEL_RIGHT:
            this.volume_right = value;
            break;
        case MIXER_CHANNEL_BOTH:
            this.volume_both = value;
            break;
        default:
            dbg_assert(false, "Mixer set master volume - unknown channel: " + channel);
            return;
    }

    this.update();
};

SpeakerMixer.prototype.update = function()
{
    var net_gain_left = this.volume_both * this.volume_left * this.gain_left;
    var net_gain_right = this.volume_both * this.volume_right * this.gain_right;

    this.node_gain_left.gain.setValueAtTime(net_gain_left, this.audio_context.currentTime);
    this.node_gain_right.gain.setValueAtTime(net_gain_right, this.audio_context.currentTime);
};

/**
 * @constructor
 * @param {!AudioContext} audio_context
 * @param {!AudioNode} source_node
 * @param {!AudioNode} destination_left
 * @param {!AudioNode} destination_right
 */
function SpeakerMixerSource(audio_context, source_node, destination_left, destination_right)
{
    /** @const */
    this.audio_context = audio_context;

    // States

    this.connected_left = true;
    this.connected_right = true;
    this.gain_hidden = 1;
    this.volume_both = 1;
    this.volume_left = 1;
    this.volume_right = 1;

    // Nodes

    this.node_splitter = audio_context.createChannelSplitter(2);
    this.node_gain_left = audio_context.createGain();
    this.node_gain_right = audio_context.createGain();

    // Graph

    source_node.connect(this.node_splitter);

    this.node_splitter.connect(this.node_gain_left, 0);
    this.node_gain_left.connect(destination_left);

    this.node_splitter.connect(this.node_gain_right, 1);
    this.node_gain_right.connect(destination_right);
}

SpeakerMixerSource.prototype.update = function()
{
    var net_gain_left = this.connected_left * this.gain_hidden * this.volume_both * this.volume_left;
    var net_gain_right = this.connected_right * this.gain_hidden * this.volume_both * this.volume_right;

    this.node_gain_left.gain.setValueAtTime(net_gain_left, this.audio_context.currentTime);
    this.node_gain_right.gain.setValueAtTime(net_gain_right, this.audio_context.currentTime);
};

/** @param {number=} channel */
SpeakerMixerSource.prototype.connect = function(channel)
{
    var both = !channel || channel === MIXER_CHANNEL_BOTH;
    if(both || channel === MIXER_CHANNEL_LEFT)
    {
        this.connected_left = true;
    }
    if(both || channel === MIXER_CHANNEL_RIGHT)
    {
        this.connected_right = true;
    }
    this.update();
};

/** @param {number=} channel */
SpeakerMixerSource.prototype.disconnect = function(channel)
{
    var both = !channel || channel === MIXER_CHANNEL_BOTH;
    if(both || channel === MIXER_CHANNEL_LEFT)
    {
        this.connected_left = false;
    }
    if(both || channel === MIXER_CHANNEL_RIGHT)
    {
        this.connected_right = false;
    }
    this.update();
};

/**
 * @param {number} value
 * @param {number=} channel
 */
SpeakerMixerSource.prototype.set_volume = function(value, channel)
{
    if(channel === undefined)
    {
        channel = MIXER_CHANNEL_BOTH;
    }

    switch(channel)
    {
        case MIXER_CHANNEL_LEFT:
            this.volume_left = value;
            break;
        case MIXER_CHANNEL_RIGHT:
            this.volume_right = value;
            break;
        case MIXER_CHANNEL_BOTH:
            this.volume_both = value;
            break;
        default:
            dbg_assert(false, "Mixer set volume - unknown channel: " + channel);
            return;
    }

    this.update();
};

SpeakerMixerSource.prototype.set_gain_hidden = function(value)
{
    this.gain_hidden = value;
};

/**
 * @constructor
 * @param {!BusConnector} bus
 * @param {!AudioContext} audio_context
 * @param {!SpeakerMixer} mixer
 */
function PCSpeaker(bus, audio_context, mixer)
{
    // Nodes

    this.node_oscillator = audio_context.createOscillator();
    this.node_oscillator.type = "square";
    this.node_oscillator.frequency.setValueAtTime(440, audio_context.currentTime);

    // Interface

    this.mixer_connection = mixer.add_source(this.node_oscillator, MIXER_SRC_PCSPEAKER);
    this.mixer_connection.disconnect();

    bus.register("pcspeaker-enable", function()
    {
        mixer.connect_source(MIXER_SRC_PCSPEAKER);
    }, this);

    bus.register("pcspeaker-disable", function()
    {
        mixer.disconnect_source(MIXER_SRC_PCSPEAKER);
    }, this);

    bus.register("pcspeaker-update", function(data)
    {
        var counter_mode = data[0];
        var counter_reload = data[1];

        var frequency = 0;
        var beep_enabled = counter_mode === 3;

        if(beep_enabled)
        {
            frequency = OSCILLATOR_FREQ * 1000 / counter_reload;
            frequency = Math.min(frequency, this.node_oscillator.frequency.maxValue);
            frequency = Math.max(frequency, 0);
        }

        this.node_oscillator.frequency.setValueAtTime(frequency, audio_context.currentTime);
    }, this);
}

PCSpeaker.prototype.start = function()
{
    this.node_oscillator.start();
};

/**
 * @constructor
 * @param {!BusConnector} bus
 * @param {!AudioContext} audio_context
 * @param {!SpeakerMixer} mixer
 */
function SpeakerWorkletDAC(bus, audio_context, mixer)
{
    /** @const */
    this.bus = bus;

    /** @const */
    this.audio_context = audio_context;

    // State

    this.enabled = false;
    this.sampling_rate = 48000;

    // Worklet

    function worklet()
    {
        const RENDER_QUANTUM = 128;
        const MINIMUM_BUFFER_SIZE = 2 * RENDER_QUANTUM;
        const QUEUE_RESERVE = 1024;

        function sinc(x)
        {
            if(x === 0) return 1;
            x *= Math.PI;
            return Math.sin(x) / x;
        }

        var EMPTY_BUFFER =
        [
            new Float32Array(MINIMUM_BUFFER_SIZE),
            new Float32Array(MINIMUM_BUFFER_SIZE),
        ];

        /**
         * @constructor
         * @extends AudioWorkletProcessor
         */
        function DACProcessor()
        {
            var self = Reflect.construct(AudioWorkletProcessor, [], DACProcessor);

            // Params

            self.kernel_size = 3;

            // States

            // Buffers waiting for their turn to be consumed
            self.queue_data = new Array(1024);
            self.queue_start = 0;
            self.queue_end = 0;
            self.queue_length = 0;
            self.queue_size = self.queue_data.length;
            self.queued_samples = 0;

            // Buffers being actively consumed
            /** @type{Array<Float32Array>} */
            self.source_buffer_previous = EMPTY_BUFFER;
            /** @type{Array<Float32Array>} */
            self.source_buffer_current = EMPTY_BUFFER;

            // Ratio of alienland sample rate to homeland sample rate.
            self.source_samples_per_destination = 1.0;

            // Integer representing the position of the first destination sample
            // for the current block, relative to source_buffer_current.
            self.source_block_start = 0;

            // Real number representing the position of the current destination
            // sample relative to source_buffer_current, since source_block_start.
            self.source_time = 0.0;

            // Same as source_time but rounded down to an index.
            self.source_offset = 0;

            // Interface

            self.port.onmessage = (event) =>
            {
                switch(event.data.type)
                {
                    case "queue":
                        self.queue_push(event.data.value);
                        break;
                    case "sampling-rate":
                        self.source_samples_per_destination = event.data.value / sampleRate;
                        break;
                }
            };

            return self;
        }

        Reflect.setPrototypeOf(DACProcessor.prototype, AudioWorkletProcessor.prototype);
        Reflect.setPrototypeOf(DACProcessor, AudioWorkletProcessor);

        DACProcessor.prototype["process"] =
        DACProcessor.prototype.process = function(inputs, outputs, parameters)
        {
            for(var i = 0; i < outputs[0][0].length; i++)
            {
                // Lanczos resampling
                var sum0 = 0;
                var sum1 = 0;

                var start = this.source_offset - this.kernel_size + 1;
                var end = this.source_offset + this.kernel_size;

                for(var j = start; j <= end; j++)
                {
                    var convolute_index = this.source_block_start + j;
                    sum0 += this.get_sample(convolute_index, 0) * this.kernel(this.source_time - j);
                    sum1 += this.get_sample(convolute_index, 1) * this.kernel(this.source_time - j);
                }

                if(isNaN(sum0) || isNaN(sum1))
                {
                    // NaN values cause entire audio graph to cease functioning.
                    sum0 = sum1 = 0;
                    this.dbg_log("ERROR: NaN values! Ignoring for now.");
                }

                outputs[0][0][i] = sum0;
                outputs[0][1][i] = sum1;

                this.source_time += this.source_samples_per_destination;
                this.source_offset = Math.floor(this.source_time);
            }

            // +2 to safeguard against rounding variations
            var samples_needed_per_block = this.source_offset;
            samples_needed_per_block += this.kernel_size + 2;

            this.source_time -= this.source_offset;
            this.source_block_start += this.source_offset;
            this.source_offset = 0;

            // Note: This needs to be done after source_block_start is updated.
            this.ensure_enough_data(samples_needed_per_block);

            return true;
        };

        DACProcessor.prototype.kernel = function(x)
        {
            return sinc(x) * sinc(x / this.kernel_size);
        };

        DACProcessor.prototype.get_sample = function(index, channel)
        {
            if(index < 0)
            {
                // -ve index represents previous buffer
                //          <-------|
                // [Previous buffer][Current buffer]
                index += this.source_buffer_previous[0].length;
                return this.source_buffer_previous[channel][index];
            }
            else
            {
                return this.source_buffer_current[channel][index];
            }
        };

        DACProcessor.prototype.ensure_enough_data = function(needed)
        {
            var current_length = this.source_buffer_current[0].length;
            var remaining = current_length - this.source_block_start;

            if(remaining < needed)
            {
                this.prepare_next_buffer();
                this.source_block_start -= current_length;
            }
        };

        DACProcessor.prototype.prepare_next_buffer = function()
        {
            if(this.queued_samples < MINIMUM_BUFFER_SIZE && this.queue_length)
            {
                this.dbg_log("Not enough samples - should not happen during midway of playback");
            }

            this.source_buffer_previous = this.source_buffer_current;
            this.source_buffer_current = this.queue_shift();

            var sample_count = this.source_buffer_current[0].length;

            if(sample_count < MINIMUM_BUFFER_SIZE)
            {
                // Unfortunately, this single buffer is too small :(

                var queue_pos = this.queue_start;
                var buffer_count = 0;

                // Figure out how many small buffers to combine.
                while(sample_count < MINIMUM_BUFFER_SIZE && buffer_count < this.queue_length)
                {
                    sample_count += this.queue_data[queue_pos][0].length;

                    queue_pos = queue_pos + 1 & this.queue_size - 1;
                    buffer_count++;
                }

                // Note: if not enough buffers, this will be end-padded with zeros:
                var new_big_buffer_size = Math.max(sample_count, MINIMUM_BUFFER_SIZE);
                var new_big_buffer =
                [
                    new Float32Array(new_big_buffer_size),
                    new Float32Array(new_big_buffer_size),
                ];

                // Copy the first, already-shifted, small buffer into the new buffer.
                new_big_buffer[0].set(this.source_buffer_current[0]);
                new_big_buffer[1].set(this.source_buffer_current[1]);
                var new_big_buffer_pos = this.source_buffer_current[0].length;

                // Copy the rest.
                for(var i = 0; i < buffer_count; i++)
                {
                    var small_buffer = this.queue_shift();
                    new_big_buffer[0].set(small_buffer[0], new_big_buffer_pos);
                    new_big_buffer[1].set(small_buffer[1], new_big_buffer_pos);
                    new_big_buffer_pos += small_buffer[0].length;
                }

                // Pretend that everything's just fine.
                this.source_buffer_current = new_big_buffer;
            }

            this.pump();
        };

        DACProcessor.prototype.pump = function()
        {
            if(this.queued_samples / this.source_samples_per_destination < QUEUE_RESERVE)
            {
                this.port.postMessage(
                {
                    type: "pump",
                });
            }
        };

        DACProcessor.prototype.queue_push = function(item)
        {
            if(this.queue_length < this.queue_size)
            {
                this.queue_data[this.queue_end] = item;
                this.queue_end = this.queue_end + 1 & this.queue_size - 1;
                this.queue_length++;

                this.queued_samples += item[0].length;

                this.pump();
            }
        };

        DACProcessor.prototype.queue_shift = function()
        {
            if(!this.queue_length)
            {
                return EMPTY_BUFFER;
            }

            var item = this.queue_data[this.queue_start];

            this.queue_data[this.queue_start] = null;
            this.queue_start = this.queue_start + 1 & this.queue_size - 1;
            this.queue_length--;

            this.queued_samples -= item[0].length;

            return item;
        };

        DACProcessor.prototype.dbg_log = function(message)
        {
            if(DEBUG)
            {
                this.port.postMessage(
                {
                    type: "debug-log",
                    value: message,
                });
            }
        };

        registerProcessor("dac-processor", DACProcessor);
    }

    var worklet_string = worklet.toString();

    var worklet_code_start = worklet_string.indexOf("{") + 1;
    var worklet_code_end = worklet_string.lastIndexOf("}");
    var worklet_code = worklet_string.substring(worklet_code_start, worklet_code_end);

    if(DEBUG)
    {
        worklet_code = "var DEBUG = true;\n" + worklet_code;
    }

    var worklet_blob = new Blob([worklet_code], { type: "application/javascript" });
    var worklet_url = URL.createObjectURL(worklet_blob);

    /** @type {AudioWorkletNode} */
    this.node_processor = null;

    // Placeholder pass-through node to connect to, when worklet node is not ready yet.
    this.node_output = this.audio_context.createGain();

    this.audio_context
        .audioWorklet
        .addModule(worklet_url)
        .then(() =>
    {
        URL.revokeObjectURL(worklet_url);

        this.node_processor = new AudioWorkletNode(this.audio_context, "dac-processor",
        {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            parameterData: {},
            processorOptions: {},
        });

        this.node_processor.port.postMessage(
        {
            type: "sampling-rate",
            value: this.sampling_rate,
        });

        this.node_processor.port.onmessage = (event) =>
        {
            switch(event.data.type)
            {
                case "pump":
                    this.pump();
                    break;
                case "debug-log":
                    dbg_log("SpeakerWorkletDAC - Worklet: " + event.data.value);
                    break;
            }
        };

        // Graph

        this.node_processor.connect(this.node_output);
    });

    // Interface

    this.mixer_connection = mixer.add_source(this.node_output, MIXER_SRC_DAC);
    this.mixer_connection.set_gain_hidden(3);

    bus.register("dac-send-data", function(data)
    {
        this.queue(data);
    }, this);

    bus.register("dac-enable", function(enabled)
    {
        this.enabled = true;
    }, this);

    bus.register("dac-disable", function()
    {
        this.enabled = false;
    }, this);

    bus.register("dac-tell-sampling-rate", function(/** number */ rate)
    {
        dbg_assert(rate > 0, "Sampling rate should be nonzero");
        this.sampling_rate = rate;

        if(!this.node_processor)
        {
            return;
        }

        this.node_processor.port.postMessage(
        {
            type: "sampling-rate",
            value: rate,
        });
    }, this);

    if(DEBUG)
    {
        this.debugger = new SpeakerDACDebugger(this.audio_context, this.node_output);
    }
}

SpeakerWorkletDAC.prototype.queue = function(data)
{
    if(!this.node_processor)
    {
        return;
    }

    if(DEBUG)
    {
        this.debugger.push_queued_data(data);
    }

    this.node_processor.port.postMessage(
    {
        type: "queue",
        value: data,
    }, [data[0].buffer, data[1].buffer]);
};

SpeakerWorkletDAC.prototype.pump = function()
{
    if(!this.enabled)
    {
        return;
    }
    this.bus.send("dac-request-data");
};

/**
 * @constructor
 * @param {!BusConnector} bus
 * @param {!AudioContext} audio_context
 * @param {!SpeakerMixer} mixer
 */
function SpeakerBufferSourceDAC(bus, audio_context, mixer)
{
    /** @const */
    this.bus = bus;

    /** @const */
    this.audio_context = audio_context;

    // States

    this.enabled = false;
    this.sampling_rate = 22050;
    this.buffered_time = 0;
    this.rate_ratio = 1;

    // Nodes

    this.node_lowpass = this.audio_context.createBiquadFilter();
    this.node_lowpass.type = "lowpass";

    // Interface

    this.node_output = this.node_lowpass;

    this.mixer_connection = mixer.add_source(this.node_output, MIXER_SRC_DAC);
    this.mixer_connection.set_gain_hidden(3);

    bus.register("dac-send-data", function(data)
    {
        this.queue(data);
    }, this);

    bus.register("dac-enable", function(enabled)
    {
        this.enabled = true;
        this.pump();
    }, this);

    bus.register("dac-disable", function()
    {
        this.enabled = false;
    }, this);

    bus.register("dac-tell-sampling-rate", function(/** number */ rate)
    {
        dbg_assert(rate > 0, "Sampling rate should be nonzero");
        this.sampling_rate = rate;
        this.rate_ratio = Math.ceil(AUDIOBUFFER_MINIMUM_SAMPLING_RATE / rate);
        this.node_lowpass.frequency.setValueAtTime(rate / 2, this.audio_context.currentTime);
    }, this);

    if(DEBUG)
    {
        this.debugger = new SpeakerDACDebugger(this.audio_context, this.node_output);
    }
}

SpeakerBufferSourceDAC.prototype.queue = function(data)
{
    if(DEBUG)
    {
        this.debugger.push_queued_data(data);
    }

    var sample_count = data[0].length;
    var block_duration = sample_count / this.sampling_rate;

    var buffer;
    if(this.rate_ratio > 1)
    {
        var new_sample_count = sample_count * this.rate_ratio;
        var new_sampling_rate = this.sampling_rate * this.rate_ratio;
        buffer = this.audio_context.createBuffer(2, new_sample_count, new_sampling_rate);
        var buffer_data0 = buffer.getChannelData(0);
        var buffer_data1 = buffer.getChannelData(1);

        var buffer_index = 0;
        for(var i = 0; i < sample_count; i++)
        {
            for(var j = 0; j < this.rate_ratio; j++, buffer_index++)
            {
                buffer_data0[buffer_index] = data[0][i];
                buffer_data1[buffer_index] = data[1][i];
            }
        }
    }
    else
    {
        // Allocating new AudioBuffer every block
        // - Memory profiles show insignificant improvements if recycling old buffers.
        buffer = this.audio_context.createBuffer(2, sample_count, this.sampling_rate);
        if(buffer.copyToChannel)
        {
            buffer.copyToChannel(data[0], 0);
            buffer.copyToChannel(data[1], 1);
        }
        else
        {
            // Safari doesn't support copyToChannel yet. See #286
            buffer.getChannelData(0).set(data[0]);
            buffer.getChannelData(1).set(data[1]);
        }
    }

    var source = this.audio_context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.node_lowpass);
    source.addEventListener("ended", this.pump.bind(this));

    var current_time = this.audio_context.currentTime;

    if(this.buffered_time < current_time)
    {
        dbg_log("Speaker DAC - Creating/Recreating reserve - shouldn't occur frequently during playback");

        // Schedule pump() to queue evenly, starting from current time
        this.buffered_time = current_time;
        var target_silence_duration = DAC_QUEUE_RESERVE - block_duration;
        var current_silence_duration = 0;
        while(current_silence_duration <= target_silence_duration)
        {
            current_silence_duration += block_duration;
            this.buffered_time += block_duration;
            setTimeout(() => this.pump(), current_silence_duration * 1000);
        }
    }

    source.start(this.buffered_time);
    this.buffered_time += block_duration;

    // Chase the schedule - ensure reserve is full
    setTimeout(() => this.pump(), 0);
};

SpeakerBufferSourceDAC.prototype.pump = function()
{
    if(!this.enabled)
    {
        return;
    }
    if(this.buffered_time - this.audio_context.currentTime > DAC_QUEUE_RESERVE)
    {
        return;
    }
    this.bus.send("dac-request-data");
};

/**
 * @constructor
 */
function SpeakerDACDebugger(audio_context, source_node)
{
    /** @const */
    this.audio_context = audio_context;

    /** @const */
    this.node_source = source_node;

    this.node_processor = null;

    this.node_gain = this.audio_context.createGain();
    this.node_gain.gain.setValueAtTime(0, this.audio_context.currentTime);

    this.node_gain.connect(this.audio_context.destination);

    this.is_active = false;
    this.queued_history = [];
    this.output_history = [];
    this.queued = [[], []];
    this.output = [[], []];
}

/** @suppress {deprecated} */
SpeakerDACDebugger.prototype.start = function(duration_ms)
{
    this.is_active = true;
    this.queued = [[], []];
    this.output = [[], []];
    this.queued_history.push(this.queued);
    this.output_history.push(this.output);

    this.node_processor = this.audio_context.createScriptProcessor(1024, 2, 2);
    this.node_processor.onaudioprocess = (event) =>
    {
        this.output[0].push(event.inputBuffer.getChannelData(0).slice());
        this.output[1].push(event.inputBuffer.getChannelData(1).slice());
    };

    this.node_source.connect(this.node_processor);
    this.node_processor.connect(this.node_gain);

    setTimeout(() =>
    {
        this.stop();
    }, duration_ms);
};

SpeakerDACDebugger.prototype.stop = function()
{
    this.is_active = false;
    this.node_source.disconnect(this.node_processor);
    this.node_processor.disconnect();
    this.node_processor = null;
};

SpeakerDACDebugger.prototype.push_queued_data = function(data)
{
    if(this.is_active)
    {
        this.queued[0].push(data[0].slice());
        this.queued[1].push(data[1].slice());
    }
};

// Useful for Audacity imports
SpeakerDACDebugger.prototype.download_txt = function(history_id, channel)
{
    var txt = this.output_history[history_id][channel]
        .map((v) => v.join(" "))
        .join(" ");

    dump_file(txt, "dacdata.txt");
};

// Useful for general plotting
SpeakerDACDebugger.prototype.download_csv = function(history_id)
{
    var buffers = this.output_history[history_id];
    var csv_rows = [];
    for(var buffer_id = 0; buffer_id < buffers[0].length; buffer_id++)
    {
        for(var i = 0; i < buffers[0][buffer_id].length; i++)
        {
            csv_rows.push(`${buffers[0][buffer_id][i]},${buffers[1][buffer_id][i]}`);
        }
    }
    dump_file(csv_rows.join("\n"), "dacdata.csv");
};


// ---- File: src/browser/network.js ----
// For Types Only


/**
 * An ethernet-through-websocket adapter, to be used with
 *     https://github.com/benjamincburns/websockproxy
 *
 * emulated ethernet card <--> this <--> websocket proxy <--> network
 *
 * @constructor
 *
 * @param {string} url
 * @param {BusConnector} bus
 * @param {number} [id=0] id
 */
function NetworkAdapter(url, bus, id)
{
    this.bus = bus;
    this.socket = undefined;
    this.id = id || 0;

    // TODO: circular buffer?
    this.send_queue = [];
    this.url = url;

    this.reconnect_interval = 10000;
    this.last_connect_attempt = Date.now() - this.reconnect_interval;
    this.send_queue_limit = 64;
    this.destroyed = false;

    this.bus.register("net" + this.id + "-send", function(data)
    {
        this.send(data);
    }, this);
}

NetworkAdapter.prototype.handle_message = function(e)
{
    if(this.bus)
    {
        this.bus.send("net" + this.id + "-receive", new Uint8Array(e.data));
    }
};

NetworkAdapter.prototype.handle_close = function(e)
{
    //console.log("onclose", e);

    if(!this.destroyed)
    {
        this.connect();
        setTimeout(this.connect.bind(this), this.reconnect_interval);
    }
};

NetworkAdapter.prototype.handle_open = function(e)
{
    //console.log("open", e);

    for(var i = 0; i < this.send_queue.length; i++)
    {
        this.send(this.send_queue[i]);
    }

    this.send_queue = [];
};

NetworkAdapter.prototype.handle_error = function(e)
{
    //console.log("onerror", e);
};

NetworkAdapter.prototype.destroy = function()
{
    this.destroyed = true;
    if(this.socket)
    {
        this.socket.close();
    }
};

NetworkAdapter.prototype.connect = function()
{
    if(typeof WebSocket === "undefined")
    {
        return;
    }

    if(this.socket)
    {
        var state = this.socket.readyState;

        if(state === 0 || state === 1)
        {
            // already or almost there
            return;
        }
    }

    var now = Date.now();

    if(this.last_connect_attempt + this.reconnect_interval > now)
    {
        return;
    }

    this.last_connect_attempt = Date.now();

    try
    {
        this.socket = new WebSocket(this.url);
    }
    catch(e)
    {
        console.error(e);
        return;
    }

    this.socket.binaryType = "arraybuffer";

    this.socket.onopen = this.handle_open.bind(this);
    this.socket.onmessage = this.handle_message.bind(this);
    this.socket.onclose = this.handle_close.bind(this);
    this.socket.onerror = this.handle_error.bind(this);
};

NetworkAdapter.prototype.send = function(data)
{
    //console.log("send", data);

    if(!this.socket || this.socket.readyState !== 1)
    {
        this.send_queue.push(data);

        if(this.send_queue.length > 2 * this.send_queue_limit)
        {
            this.send_queue = this.send_queue.slice(-this.send_queue_limit);
        }

        this.connect();
    }
    else
    {
        this.socket.send(data);
    }
};

NetworkAdapter.prototype.change_proxy = function(url)
{
    this.url = url;

    if(this.socket)
    {
        this.socket.onclose = function() {};
        this.socket.onerror = function() {};
        this.socket.close();
        this.socket = undefined;
    }
};


// ---- File: src/browser/fake_network.js ----




// https://www.iana.org/assignments/ieee-802-numbers/ieee-802-numbers.xhtml
const ETHERTYPE_IPV4 = 0x0800;
const ETHERTYPE_ARP = 0x0806;
const ETHERTYPE_IPV6 = 0x86DD;

const IPV4_PROTO_ICMP = 1;
const IPV4_PROTO_TCP = 6;
const IPV4_PROTO_UDP = 17;

const UNIX_EPOCH = new Date("1970-01-01T00:00:00Z").getTime();
const NTP_EPOCH = new Date("1900-01-01T00:00:00Z").getTime();
const NTP_EPOC_DIFF = UNIX_EPOCH - NTP_EPOCH;
const TWO_TO_32 = Math.pow(2, 32);

const DHCP_MAGIC_COOKIE = 0x63825363;
const V86_ASCII = [118, 56, 54];

/* For the complete TCP state diagram see:
 *
 *   https://en.wikipedia.org/wiki/File:Tcp_state_diagram_fixed_new.svg
 *
 * State TIME_WAIT is not needed, we can skip it and transition directly to CLOSED instead.
 */
const TCP_STATE_CLOSED = "closed";
const TCP_STATE_SYN_RECEIVED = "syn-received";
const TCP_STATE_SYN_SENT = "syn-sent";
const TCP_STATE_SYN_PROBE = "syn-probe";
//const TCP_STATE_LISTEN = "listen";
const TCP_STATE_ESTABLISHED = "established";
const TCP_STATE_FIN_WAIT_1 = "fin-wait-1";
const TCP_STATE_CLOSE_WAIT = "close-wait";
const TCP_STATE_FIN_WAIT_2 = "fin-wait-2";
const TCP_STATE_LAST_ACK = "last-ack";
const TCP_STATE_CLOSING = "closing";
//const TCP_STATE_TIME_WAIT = "time-wait";

// source: RFC6335, 6. Port Number Ranges
const TCP_DYNAMIC_PORT_START = 49152;
const TCP_DYNAMIC_PORT_END   = 65535;
const TCP_DYNAMIC_PORT_RANGE = TCP_DYNAMIC_PORT_END - TCP_DYNAMIC_PORT_START;

const ETH_HEADER_SIZE     = 14;
const ETH_PAYLOAD_OFFSET  = ETH_HEADER_SIZE;
const ETH_PAYLOAD_SIZE    = 1500;
const ETH_TRAILER_SIZE    = 4;
const ETH_FRAME_SIZE      = ETH_HEADER_SIZE + ETH_PAYLOAD_SIZE + ETH_TRAILER_SIZE;
const IPV4_HEADER_SIZE    = 20;
const IPV4_PAYLOAD_OFFSET = ETH_PAYLOAD_OFFSET + IPV4_HEADER_SIZE;
const IPV4_PAYLOAD_SIZE   = ETH_PAYLOAD_SIZE - IPV4_HEADER_SIZE;
const UDP_HEADER_SIZE     = 8;
const UDP_PAYLOAD_OFFSET  = IPV4_PAYLOAD_OFFSET + UDP_HEADER_SIZE;
const UDP_PAYLOAD_SIZE    = IPV4_PAYLOAD_SIZE - UDP_HEADER_SIZE;
const TCP_HEADER_SIZE     = 20;
const TCP_PAYLOAD_OFFSET  = IPV4_PAYLOAD_OFFSET + TCP_HEADER_SIZE;
const TCP_PAYLOAD_SIZE    = IPV4_PAYLOAD_SIZE - TCP_HEADER_SIZE;
const ICMP_HEADER_SIZE    = 4;

const DEFAULT_DOH_SERVER = "cloudflare-dns.com";

function a2ethaddr(bytes) {
    return [0,1,2,3,4,5].map((i) => bytes[i].toString(16)).map(x => x.length === 1 ? "0" + x : x).join(":");
}

function iptolong(parts) {
    return parts[0] << 24 | parts[1] << 16 | parts[2] << 8 | parts[3];
}

class GrowableRingbuffer
{
    /**
     * @param {number} initial_capacity
     * @param {number} maximum_capacity
     */
    constructor(initial_capacity, maximum_capacity)
    {
        initial_capacity = Math.min(initial_capacity, 16);
        this.maximum_capacity = maximum_capacity ? Math.max(maximum_capacity, initial_capacity) : 0;
        this.tail = 0;
        this.head = 0;
        this.length = 0;
        this.buffer = new Uint8Array(initial_capacity);
    }

    /**
     * @param {Uint8Array} src_array
     */
    write(src_array)
    {
        const src_length = src_array.length;
        const total_length = this.length + src_length;
        let capacity = this.buffer.length;
        if(capacity < total_length) {
            dbg_assert(capacity > 0);
            while(capacity < total_length) {
                capacity *= 2;
            }
            if(this.maximum_capacity && capacity > this.maximum_capacity) {
                throw new Error("stream capacity overflow in GrowableRingbuffer.write(), package dropped");
            }
            const new_buffer = new Uint8Array(capacity);
            this.peek(new_buffer);
            this.tail = 0;
            this.head = this.length;
            this.buffer = new_buffer;
        }
        const buffer = this.buffer;

        const new_head = this.head + src_length;
        if(new_head > capacity) {
            const i_split = capacity - this.head;
            buffer.set(src_array.subarray(0, i_split), this.head);
            buffer.set(src_array.subarray(i_split));
        }
        else {
            buffer.set(src_array, this.head);
        }
        this.head = new_head % capacity;
        this.length += src_length;
    }

    /**
     * @param {Uint8Array} dst_array
     */
    peek(dst_array)
    {
        const length = Math.min(this.length, dst_array.length);
        if(length) {
            const buffer = this.buffer;
            const capacity = buffer.length;
            const new_tail = this.tail + length;
            if(new_tail > capacity) {
                const buf_len_left = new_tail % capacity;
                const buf_len_right = capacity - this.tail;
                dst_array.set(buffer.subarray(this.tail));
                dst_array.set(buffer.subarray(0, buf_len_left), buf_len_right);
            }
            else {
                dst_array.set(buffer.subarray(this.tail, new_tail));
            }
        }
        return length;
    }

    /**
     * @param {number} length
     */
    remove(length)
    {
        if(length > this.length) {
            length = this.length;
        }
        if(length) {
            this.tail = (this.tail + length) % this.buffer.length;
            this.length -= length;
        }
        return length;
    }
}

function create_eth_encoder_buf()
{
    const eth_frame = new Uint8Array(ETH_FRAME_SIZE);
    const buffer = eth_frame.buffer;
    const offset = eth_frame.byteOffset;
    return {
        eth_frame: eth_frame,
        eth_frame_view: new DataView(buffer),
        eth_payload_view: new DataView(buffer, offset + ETH_PAYLOAD_OFFSET, ETH_PAYLOAD_SIZE),
        ipv4_payload_view: new DataView(buffer, offset + IPV4_PAYLOAD_OFFSET, IPV4_PAYLOAD_SIZE),
        udp_payload_view: new DataView(buffer, offset + UDP_PAYLOAD_OFFSET, UDP_PAYLOAD_SIZE),
        text_encoder: new TextEncoder()
    };
}

/**
 * Copy given data array into view starting at offset, return number of bytes written.
 *
 * @param {number} offset
 * @param {ArrayBuffer|ArrayBufferView} data
 * @param {DataView} view
 * @param {Object} out
 */
function view_set_array(offset, data, view, out)
{
    out.eth_frame.set(data, view.byteOffset + offset);
    return data.length;
}

/**
 * UTF8-encode given string into view starting at offset, return number of bytes written.
 *
 * @param {number} offset
 * @param {string} str
 * @param {DataView} view
 * @param {Object} out
 */
function view_set_string(offset, str, view, out)
{
    return out.text_encoder.encodeInto(str, out.eth_frame.subarray(view.byteOffset + offset)).written;
}

/**
 * Calculate internet checksum for view[0 : length] and return the 16-bit result.
 * Source: RFC768 and RFC1071 (chapter 4.1).
 *
 * @param {number} length
 * @param {number} checksum
 * @param {DataView} view
 * @param {Object} out
 */
function calc_inet_checksum(length, checksum, view, out)
{
    const uint16_end = view.byteOffset + (length & ~1);
    const eth_frame = out.eth_frame;
    for(let i = view.byteOffset; i < uint16_end; i += 2) {
        checksum += eth_frame[i] << 8 | eth_frame[i+1];
    }
    if(length & 1) {
        checksum += eth_frame[uint16_end] << 8;
    }
    while(checksum >>> 16) {
        checksum = (checksum & 0xffff) + (checksum >>> 16);
    }
    return ~checksum & 0xffff;
}

/**
 * @param {Object} out
 * @param {Object} spec
 */
function make_packet(out, spec)
{
    dbg_assert(spec.eth);
    out.eth_frame.fill(0);
    return out.eth_frame.subarray(0, write_eth(spec, out));
}

function handle_fake_tcp(packet, adapter)
{
    const tuple = `${packet.ipv4.src.join(".")}:${packet.tcp.sport}:${packet.ipv4.dest.join(".")}:${packet.tcp.dport}`;

    if(packet.tcp.syn) {
        if(adapter.tcp_conn[tuple]) {
            dbg_log("SYN to already opened port", LOG_FETCH);
        }
        if(adapter.on_tcp_connection(packet, tuple)) {
            return;
        }
    }

    if(!adapter.tcp_conn[tuple]) {
        dbg_log(`I dont know about ${tuple}, so resetting`, LOG_FETCH);
        let bop = packet.tcp.ackn;
        if(packet.tcp.fin || packet.tcp.syn) bop += 1;
        let reply = {};
        reply.eth = { ethertype: ETHERTYPE_IPV4, src: adapter.router_mac, dest: packet.eth.src };
        reply.ipv4 = {
            proto: IPV4_PROTO_TCP,
            src: packet.ipv4.dest,
            dest: packet.ipv4.src
        };
        reply.tcp = {
            sport: packet.tcp.dport,
            dport: packet.tcp.sport,
            seq: bop,
            ackn: packet.tcp.seq + (packet.tcp.syn ? 1: 0),
            winsize: packet.tcp.winsize,
            rst: true,
            ack: packet.tcp.syn
        };
        adapter.receive(make_packet(adapter.eth_encoder_buf, reply));
        return true;
    }

    adapter.tcp_conn[tuple].process(packet);
}

function handle_fake_dns_static(packet, adapter)
{
    let reply = {};
    reply.eth = { ethertype: ETHERTYPE_IPV4, src: adapter.router_mac, dest: packet.eth.src };
    reply.ipv4 = {
        proto: IPV4_PROTO_UDP,
        src: adapter.router_ip,
        dest: packet.ipv4.src,
    };
    reply.udp = { sport: 53, dport: packet.udp.sport };

    let answers = [];
    let flags = 0x8000; //Response,
    flags |= 0x0180; // Recursion
    // flags |= 0x0400; Authoritative

    for(let i = 0; i < packet.dns.questions.length; ++i) {
        let q = packet.dns.questions[i];

        switch(q.type){
            case 1: // A record
                answers.push({
                    name: q.name,
                    type: q.type,
                    class: q.class,
                    ttl: 600,
                    data: [192, 168, 87, 1]
                });
                break;
            default:
        }
    }

    reply.dns = {
        id: packet.dns.id,
        flags: flags,
        questions: packet.dns.questions,
        answers: answers
    };
    adapter.receive(make_packet(adapter.eth_encoder_buf, reply));
    return true;
}

function handle_fake_dns_doh(packet, adapter)
{
    const fetch_url = `https://${adapter.doh_server || DEFAULT_DOH_SERVER}/dns-query`;
    const fetch_opts = {
        method: "POST",
        headers: [["content-type", "application/dns-message"]],
        body: packet.udp.data
    };
    fetch(fetch_url, fetch_opts).then(async (resp) => {
        const reply = {
            eth: {
                ethertype: ETHERTYPE_IPV4,
                src: adapter.router_mac,
                dest: packet.eth.src
            },
            ipv4: {
                proto: IPV4_PROTO_UDP,
                src: adapter.router_ip,
                dest: packet.ipv4.src
            },
            udp: {
                sport: 53,
                dport: packet.udp.sport,
                data: new Uint8Array(await resp.arrayBuffer())
            }
        };
        adapter.receive(make_packet(adapter.eth_encoder_buf, reply));
    });
    return true;
}

function handle_fake_dns(packet, adapter)
{
    if(adapter.dns_method === "static") {
        return handle_fake_dns_static(packet, adapter);
    }
    else {
        return handle_fake_dns_doh(packet, adapter);
    }
}

function handle_fake_ntp(packet, adapter) {
    let now = Date.now(); // - 1000 * 60 * 60 * 24 * 7;
    let now_n = now + NTP_EPOC_DIFF;
    let now_n_f = TWO_TO_32 * ((now_n % 1000) / 1000);

    let reply = {};
    reply.eth = { ethertype: ETHERTYPE_IPV4, src: adapter.router_mac, dest: packet.eth.src };
    reply.ipv4 = {
        proto: IPV4_PROTO_UDP,
        src: packet.ipv4.dest,
        dest: packet.ipv4.src,
    };
    reply.udp = { sport: 123, dport: packet.udp.sport };
    let flags = (0 << 6) | (4 << 3) | 4;
    reply.ntp = Object.assign({}, packet.ntp);
    reply.ntp.flags = flags;
    reply.ntp.poll = 10;
    reply.ntp.ori_ts_i = packet.ntp.trans_ts_i;
    reply.ntp.ori_ts_f = packet.ntp.trans_ts_f;

    reply.ntp.rec_ts_i = now_n / 1000;
    reply.ntp.rec_ts_f = now_n_f;

    reply.ntp.trans_ts_i = now_n / 1000;
    reply.ntp.trans_ts_f = now_n_f;

    reply.ntp.stratum = 2;
    adapter.receive(make_packet(adapter.eth_encoder_buf, reply));
    return true;
}

function handle_fake_dhcp(packet, adapter) {
    let reply = {};
    reply.eth = { ethertype: ETHERTYPE_IPV4, src: adapter.router_mac, dest: packet.eth.src };
    reply.ipv4 = {
        proto: IPV4_PROTO_UDP,
        src: adapter.router_ip,
        dest: adapter.vm_ip,
    };
    reply.udp = { sport: 67, dport: 68, };
    reply.dhcp = {
        htype: 1,
        hlen: 6,
        hops: 0,
        xid: packet.dhcp.xid,
        secs: 0,
        flags: 0,
        ciaddr: 0,
        yiaddr: iptolong(adapter.vm_ip),
        siaddr: iptolong(adapter.router_ip),
        giaddr: iptolong(adapter.router_ip),
        chaddr: packet.dhcp.chaddr,
    };

    let options = [];

    // idk, it seems like op should be 3, but udhcpc sends 1
    let fix = packet.dhcp.options.find(function(x) { return x[0] === 53; });
    if( fix && fix[2] === 3 ) packet.dhcp.op = 3;

    if(packet.dhcp.op === 1) {
        reply.dhcp.op = 2;
        options.push(new Uint8Array([53, 1, 2]));
    }

    if(packet.dhcp.op === 3) {
        reply.dhcp.op = 2;
        options.push(new Uint8Array([53, 1, 5]));
        options.push(new Uint8Array([51, 4, 8, 0, 0, 0]));  // Lease Time
    }

    let router_ip = [adapter.router_ip[0], adapter.router_ip[1], adapter.router_ip[2], adapter.router_ip[3]];
    options.push(new Uint8Array([1, 4, 255, 255, 255, 0])); // Netmask
    if(adapter.masquerade) {
        options.push(new Uint8Array([3, 4].concat(router_ip))); // Router
        options.push(new Uint8Array([6, 4].concat(router_ip))); // DNS
    }
    options.push(new Uint8Array([54, 4].concat(router_ip))); // DHCP Server
    options.push(new Uint8Array([60, 3].concat(V86_ASCII))); // Vendor
    options.push(new Uint8Array([255, 0]));

    reply.dhcp.options = options;
    adapter.receive(make_packet(adapter.eth_encoder_buf, reply));
}

function handle_fake_networking(data, adapter) {
    let packet = {};
    parse_eth(data, packet);

    if(packet.ipv4) {
        if(packet.tcp) {
            handle_fake_tcp(packet, adapter);
        }
        else if(packet.udp) {
            if(packet.dns) {
                handle_fake_dns(packet, adapter);
            }
            else if(packet.dhcp) {
                handle_fake_dhcp(packet, adapter);
            }
            else if(packet.ntp) {
                handle_fake_ntp(packet, adapter);
            }
            else if(packet.udp.dport === 8) {
                handle_udp_echo(packet, adapter);
            }
        }
        else if(packet.icmp && packet.icmp.type === 8) {
            handle_fake_ping(packet, adapter);
        }
    }
    else if(packet.arp && packet.arp.oper === 1 && packet.arp.ptype === ETHERTYPE_IPV4) {
        arp_whohas(packet, adapter);
    }
}

function parse_eth(data, o) {
    let view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    let ethertype = view.getUint16(12);
    let eth = {
        ethertype: ethertype,
        dest: data.subarray(0, 6),
        dest_s: a2ethaddr(data.subarray(0, 6)),
        src: data.subarray(6, 12),
        src_s: a2ethaddr(data.subarray(6, 12)),
    };

    o.eth = eth;

    // TODO: Remove CRC from the end of the packet maybe?
    let payload = data.subarray(ETH_HEADER_SIZE, data.length);

    if(ethertype === ETHERTYPE_IPV4) {
        parse_ipv4(payload, o);
    }
    else if(ethertype === ETHERTYPE_ARP) {
        parse_arp(payload, o);
    }
    else if(ethertype === ETHERTYPE_IPV6) {
        dbg_log("Unimplemented: ipv6");
    }
    else {
        dbg_log("Unknown ethertype: " + h(ethertype), LOG_FETCH);
    }
}

function write_eth(spec, out) {
    const view = out.eth_frame_view;
    view_set_array(0, spec.eth.dest, view, out);
    view_set_array(6, spec.eth.src, view, out);
    view.setUint16(12, spec.eth.ethertype);
    let len = ETH_HEADER_SIZE;
    if(spec.arp) {
        len += write_arp(spec, out);
    }
    else if(spec.ipv4) {
        len += write_ipv4(spec, out);
    }
    return len;
}

function parse_arp(data, o) {
    let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let hlen = data[4];
    let plen = data[5];

    let arp = {
        htype: view.getUint16(0),
        ptype: view.getUint16(2),
        oper: view.getUint16(6),
        sha: data.subarray(8, 14),
        spa: data.subarray(14, 18),
        tha: data.subarray(18, 24),
        tpa: data.subarray(24, 28),
    };
    o.arp = arp;
}

function write_arp(spec, out) {
    const view = out.eth_payload_view;
    view.setUint16(0, spec.arp.htype);
    view.setUint16(2, spec.arp.ptype);
    view.setUint8(4, spec.arp.sha.length);
    view.setUint8(5, spec.arp.spa.length);
    view.setUint16(6, spec.arp.oper);
    view_set_array(8, spec.arp.sha, view, out);
    view_set_array(14, spec.arp.spa, view, out);
    view_set_array(18, spec.arp.tha, view, out);
    view_set_array(24, spec.arp.tpa, view, out);
    return 28;
}

function parse_ipv4(data, o) {
    let view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    let version = (data[0] >> 4) & 0x0F;
    let ihl = data[0] & 0x0F;

    let tos = view.getUint8(1);
    let len = view.getUint16(2);

    let ttl = view.getUint8(8);
    let proto = view.getUint8(9);
    let ip_checksum = view.getUint16(10);

    let ipv4 = {
        version,
        ihl,
        tos,
        len,
        ttl,
        proto,
        ip_checksum,
        src: data.subarray(12, 12+4),
        dest: data.subarray(16, 16+4),
    };

    // Ethernet minmum packet size.
    if(Math.max(len, 46) !== data.length) {
        dbg_log(`ipv4 Length mismatch: ${len} != ${data.length}`, LOG_FETCH);
    }

    o.ipv4 = ipv4;
    let ipdata = data.subarray(ihl * 4, len);
    if(proto === IPV4_PROTO_ICMP) {
        parse_icmp(ipdata, o);
    }
    else if(proto === IPV4_PROTO_TCP) {
        parse_tcp(ipdata, o);
    }
    else if(proto === IPV4_PROTO_UDP) {
        parse_udp(ipdata, o);
    }
}

function write_ipv4(spec, out) {
    const view = out.eth_payload_view;
    const ihl = IPV4_HEADER_SIZE >> 2; // header length in 32-bit words
    const version = 4;

    let len = IPV4_HEADER_SIZE;
    if(spec.icmp) {
        len += write_icmp(spec, out);
    }
    else if(spec.udp) {
        len += write_udp(spec, out);
    }
    else if(spec.tcp) {
        len += write_tcp(spec, out);
    }

    view.setUint8(0, version << 4 | (ihl & 0x0F));
    view.setUint8(1, spec.ipv4.tos || 0);
    view.setUint16(2, len);
    view.setUint16(4, spec.ipv4.id || 0);
    view.setUint8(6, 2 << 5); // DF Flag
    view.setUint8(8, spec.ipv4.ttl || 32);
    view.setUint8(9, spec.ipv4.proto);
    view.setUint16(10, 0); // checksum initially zero before calculation
    view_set_array(12, spec.ipv4.src, view, out);
    view_set_array(16, spec.ipv4.dest, view, out);
    view.setUint16(10, calc_inet_checksum(IPV4_HEADER_SIZE, 0, view, out));
    return len;
}

function parse_icmp(data, o) {
    let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let icmp = {
        type: view.getUint8(0),
        code: view.getUint8(1),
        checksum: view.getUint16(2),
        data: data.subarray(4)
    };
    o.icmp = icmp;
}

function write_icmp(spec, out) {
    const view = out.ipv4_payload_view;
    view.setUint8(0, spec.icmp.type);
    view.setUint8(1, spec.icmp.code);
    view.setUint16(2, 0); // checksum initially zero before calculation
    const data_length = view_set_array(ICMP_HEADER_SIZE, spec.icmp.data, view, out);
    const total_length = ICMP_HEADER_SIZE + data_length;
    view.setUint16(2, calc_inet_checksum(total_length, 0, view, out));
    return total_length;
}

function parse_udp(data, o) {
    let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let udp = {
        sport: view.getUint16(0),
        dport: view.getUint16(2),
        len: view.getUint16(4),
        checksum: view.getUint16(6),
        data: data.subarray(8),
        data_s: new TextDecoder().decode(data.subarray(8))
    };

    //dbg_assert(udp.data.length + 8 == udp.len);
    if(udp.dport === 67 || udp.sport === 67) { //DHCP
        parse_dhcp(data.subarray(8), o);
    }
    else if(udp.dport === 53 || udp.sport === 53) {
        parse_dns(data.subarray(8), o);
    }
    else if(udp.dport === 123) {
        parse_ntp(data.subarray(8), o);
    }
    o.udp = udp;
}

function write_udp(spec, out) {
    const view = out.ipv4_payload_view;
    let total_length = UDP_HEADER_SIZE;
    if(spec.dhcp) {
        total_length += write_dhcp(spec, out);
    }
    else if(spec.dns) {
        total_length += write_dns(spec, out);
    }
    else if(spec.ntp) {
        total_length += write_ntp(spec, out);
    }
    else {
        total_length += view_set_array(0, spec.udp.data, out.udp_payload_view, out);
    }

    view.setUint16(0, spec.udp.sport);
    view.setUint16(2, spec.udp.dport);
    view.setUint16(4, total_length);
    view.setUint16(6, 0); // checksum initially zero before calculation

    const pseudo_header =
        (spec.ipv4.src[0] << 8 | spec.ipv4.src[1]) +
        (spec.ipv4.src[2] << 8 | spec.ipv4.src[3]) +
        (spec.ipv4.dest[0] << 8 | spec.ipv4.dest[1]) +
        (spec.ipv4.dest[2] << 8 | spec.ipv4.dest[3]) +
        IPV4_PROTO_UDP +
        total_length;
    view.setUint16(6, calc_inet_checksum(total_length, pseudo_header, view, out));
    return total_length;
}

function parse_dns(data, o) {
    let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let dns = {
        id: view.getUint16(0),
        flags: view.getUint16(2),
        questions: [],
        answers: []
    };

    let qdcount = view.getUint16(4);
    let ancount = view.getUint16(6);
    let nscount = view.getUint16(8);
    let arcount = view.getUint16(10);

    let offset = 12;
    function read_dstr() {
        let o = [];
        let len;
        do {
            len = view.getUint8(offset);
            o.push(new TextDecoder().decode(data.subarray(offset+1, offset+1+len)));
            offset += len + 1;
        } while(len > 0);
        return o;
    }

    for(let i = 0; i < qdcount; i++) {
        dns.questions.push({
            name: read_dstr(),
            type: view.getInt16(offset),
            class: view.getInt16(offset + 2)
        });
        offset += 4;
    }
    for(let i = 0; i < ancount; i++) {
        let ans = {
            name: read_dstr(),
            type: view.getInt16(offset),
            class: view.getUint16(offset + 2),
            ttl: view.getUint32(offset + 4)
        };
        offset += 8;
        let rdlen = view.getUint16(offset);
        offset += 2;
        ans.data = data.subarray(offset, offset+rdlen);
        offset += rdlen;
        dns.answers.push(ans);
    }
    o.dns = dns;
}

function write_dns(spec, out) {
    const view = out.udp_payload_view;
    view.setUint16(0, spec.dns.id);
    view.setUint16(2, spec.dns.flags);
    view.setUint16(4, spec.dns.questions.length);
    view.setUint16(6, spec.dns.answers.length);

    let offset = 12;
    for(let i = 0; i < spec.dns.questions.length; ++i) {
        let q = spec.dns.questions[i];
        for(let s of q.name) {
            const n_written = view_set_string(offset + 1, s, view, out);
            view.setUint8(offset, n_written);
            offset += 1 + n_written;
        }
        view.setUint16(offset, q.type);
        offset += 2;
        view.setUint16(offset, q.class);
        offset += 2;
    }

    function write_reply(a) {
        for(let s of a.name) {
            const n_written = view_set_string(offset + 1, s, view, out);
            view.setUint8(offset, n_written);
            offset += 1 + n_written;
        }
        view.setUint16(offset, a.type);
        offset += 2;
        view.setUint16(offset, a.class);
        offset += 2;
        view.setUint32(offset, a.ttl);
        offset += 4;
        view.setUint16(offset, a.data.length);
        offset += 2;
        offset += view_set_array(offset, a.data, view, out);
    }

    for(let i = 0; i < spec.dns.answers.length; ++i) {
        let a = spec.dns.answers[i];
        write_reply(a);
    }

    return offset;
}

function parse_dhcp(data, o) {
    let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let bootpo  = data.subarray(44,44+192);
    let dhcp = {
        op:  view.getUint8(0),
        htype: view.getUint8(1),
        hlen: view.getUint8(2),
        hops: view.getUint8(3),
        xid: view.getUint32(4),
        secs: view.getUint16(8),
        flags: view.getUint16(10),
        ciaddr: view.getUint32(12),
        yiaddr: view.getUint32(16),
        siaddr: view.getUint32(20),
        giaddr: view.getUint32(24),
        chaddr: data.subarray(28,28+16),
        magic: view.getUint32(236),
        options: [],
    };

    let options = data.subarray(240);
    for(let i = 0; i < options.length; ++i) {
        let start = i;
        let op = options[i];
        if(op === 0) continue;
        ++i;
        let len = options[i];
        i += len;
        dhcp.options.push(options.subarray(start, start + len + 2));
    }

    o.dhcp = dhcp;
    o.dhcp_options = dhcp.options;
}

function write_dhcp(spec, out) {
    const view = out.udp_payload_view;
    view.setUint8(0, spec.dhcp.op);
    view.setUint8(1, spec.dhcp.htype);
    view.setUint8(2, spec.dhcp.hlen);
    view.setUint8(3, spec.dhcp.hops);
    view.setUint32(4, spec.dhcp.xid);
    view.setUint16(8, spec.dhcp.secs);
    view.setUint16(10, spec.dhcp.flags);
    view.setUint32(12, spec.dhcp.ciaddr);
    view.setUint32(16, spec.dhcp.yiaddr);
    view.setUint32(20, spec.dhcp.siaddr);
    view.setUint32(24, spec.dhcp.giaddr);
    view_set_array(28, spec.dhcp.chaddr, view, out);

    view.setUint32(236, DHCP_MAGIC_COOKIE);

    let offset = 240;
    for(let o of spec.dhcp.options) {
        offset += view_set_array(offset, o, view, out);
    }
    return offset;
}

function parse_ntp(data, o) {
    let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    o.ntp = {
        flags: view.getUint8(0),
        stratum: view.getUint8(1),
        poll: view.getUint8(2),
        precision: view.getUint8(3),
        root_delay: view.getUint32(4),
        root_disp: view.getUint32(8),
        ref_id: view.getUint32(12),
        ref_ts_i: view.getUint32(16),
        ref_ts_f: view.getUint32(20),
        ori_ts_i: view.getUint32(24),
        ori_ts_f: view.getUint32(28),
        rec_ts_i: view.getUint32(32),
        rec_ts_f: view.getUint32(36),
        trans_ts_i: view.getUint32(40),
        trans_ts_f: view.getUint32(44),
    };
}

function write_ntp(spec, out) {
    const view = out.udp_payload_view;
    view.setUint8(0, spec.ntp.flags);
    view.setUint8(1, spec.ntp.stratum);
    view.setUint8(2, spec.ntp.poll);
    view.setUint8(3, spec.ntp.precision);
    view.setUint32(4, spec.ntp.root_delay);
    view.setUint32(8, spec.ntp.root_disp);
    view.setUint32(12, spec.ntp.ref_id);
    view.setUint32(16, spec.ntp.ref_ts_i);
    view.setUint32(20, spec.ntp.ref_ts_f);
    view.setUint32(24, spec.ntp.ori_ts_i);
    view.setUint32(28, spec.ntp.ori_ts_f);
    view.setUint32(32, spec.ntp.rec_ts_i);
    view.setUint32(36, spec.ntp.rec_ts_f);
    view.setUint32(40, spec.ntp.trans_ts_i);
    view.setUint32(44, spec.ntp.trans_ts_f);
    return 48;
}

function parse_tcp(data, o) {
    let view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    let tcp = {
        sport: view.getUint16(0),
        dport: view.getUint16(2),
        seq: view.getUint32(4),
        ackn: view.getUint32(8),
        doff: view.getUint8(12) >> 4,
        winsize: view.getUint16(14),
        checksum: view.getUint16(16),
        urgent: view.getUint16(18),
    };

    let flags = view.getUint8(13);

    tcp.fin = !!(flags & 0x01);
    tcp.syn = !!(flags & 0x02);
    tcp.rst = !!(flags & 0x04);
    tcp.psh = !!(flags & 0x08);
    tcp.ack = !!(flags & 0x10);
    tcp.urg = !!(flags & 0x20);
    tcp.ece = !!(flags & 0x40);
    tcp.cwr = !!(flags & 0x80);

    o.tcp = tcp;

    let offset = tcp.doff * 4;
    o.tcp_data = data.subarray(offset);
}

function write_tcp(spec, out) {
    const view = out.ipv4_payload_view;
    let flags = 0;
    let tcp = spec.tcp;

    if(tcp.fin) flags |= 0x01;
    if(tcp.syn) flags |= 0x02;
    if(tcp.rst) flags |= 0x04;
    if(tcp.psh) flags |= 0x08;
    if(tcp.ack) flags |= 0x10;
    if(tcp.urg) flags |= 0x20;
    if(tcp.ece) flags |= 0x40;
    if(tcp.cwr) flags |= 0x80;

    const doff = TCP_HEADER_SIZE >> 2;  // header length in 32-bit words

    view.setUint16(0, tcp.sport);
    view.setUint16(2, tcp.dport);
    view.setUint32(4, tcp.seq);
    view.setUint32(8, tcp.ackn);
    view.setUint8(12, doff << 4);
    view.setUint8(13, flags);
    view.setUint16(14, tcp.winsize);
    view.setUint16(16, 0); // checksum initially zero before calculation
    view.setUint16(18, tcp.urgent || 0);

    let total_length = TCP_HEADER_SIZE;
    if(spec.tcp_data) {
        total_length += view_set_array(TCP_HEADER_SIZE, spec.tcp_data, view, out);
    }

    const pseudo_header =
        (spec.ipv4.src[0] << 8 | spec.ipv4.src[1]) +
        (spec.ipv4.src[2] << 8 | spec.ipv4.src[3]) +
        (spec.ipv4.dest[0] << 8 | spec.ipv4.dest[1]) +
        (spec.ipv4.dest[2] << 8 | spec.ipv4.dest[3]) +
        IPV4_PROTO_TCP +
        total_length;
    view.setUint16(16, calc_inet_checksum(total_length, pseudo_header, view, out));
    return total_length;
}

function fake_tcp_connect(dport, adapter)
{
    const vm_ip_str = adapter.vm_ip.join(".");
    const router_ip_str = adapter.router_ip.join(".");
    const sport_0 = (Math.random() * TCP_DYNAMIC_PORT_RANGE) | 0;
    let sport, tuple, sport_i = 0;
    do {
        sport = TCP_DYNAMIC_PORT_START + ((sport_0 + sport_i) % TCP_DYNAMIC_PORT_RANGE);
        tuple = `${vm_ip_str}:${dport}:${router_ip_str}:${sport}`;
    } while(++sport_i < TCP_DYNAMIC_PORT_RANGE && adapter.tcp_conn[tuple]);
    if(adapter.tcp_conn[tuple]) {
        throw new Error("pool of dynamic TCP port numbers exhausted, connection aborted");
    }

    let conn = new TCPConnection();

    conn.tuple = tuple;
    conn.hsrc = adapter.router_mac;
    conn.psrc = adapter.router_ip;
    conn.sport = sport;
    conn.hdest = adapter.vm_mac;
    conn.dport = dport;
    conn.pdest = adapter.vm_ip;
    conn.net = adapter;
    adapter.tcp_conn[tuple] = conn;
    conn.connect();
    return conn;
}

function fake_tcp_probe(dport, adapter) {
    return new Promise((res, rej) => {
        let handle = fake_tcp_connect(dport, adapter);
        handle.state = TCP_STATE_SYN_PROBE;
        handle.on("probe", res);
    });
}

/**
 * @constructor
 */
function TCPConnection()
{
    this.state = TCP_STATE_CLOSED;
    this.net = null; // The adapter is stored here
    this.send_buffer = new GrowableRingbuffer(2048, 0);
    this.send_chunk_buf = new Uint8Array(TCP_PAYLOAD_SIZE);
    this.in_active_close = false;
    this.delayed_send_fin = false;
    this.delayed_state = undefined;
    this.events_handlers = {};
}

TCPConnection.prototype.on = function(event, handler) {
    this.events_handlers[event] = handler;
};

TCPConnection.prototype.emit = function(event, ...args) {
    if(!this.events_handlers[event]) return;
    this.events_handlers[event].apply(this, args);
};


TCPConnection.prototype.ipv4_reply = function() {
    let reply = {};
    reply.eth = { ethertype: ETHERTYPE_IPV4, src: this.hsrc, dest: this.hdest };
    reply.ipv4 = {
        proto: IPV4_PROTO_TCP,
        src: this.psrc,
        dest: this.pdest
    };
    reply.tcp = {
        sport: this.sport,
        dport: this.dport,
        winsize: this.winsize,
        ackn: this.ack,
        seq: this.seq,
        ack: true
    };
    return reply;
};

TCPConnection.prototype.packet_reply = function(packet, tcp_options) {
    const reply_tcp = {
        sport: packet.tcp.dport,
        dport: packet.tcp.sport,
        winsize: packet.tcp.winsize,
        ackn: this.ack,
        seq: this.seq
    };
    if(tcp_options) {
        for(const opt in tcp_options) {
            reply_tcp[opt] = tcp_options[opt];
        }
    }
    const reply = this.ipv4_reply();
    reply.tcp = reply_tcp;
    return reply;
};


TCPConnection.prototype.connect = function() {
    // dbg_log(`TCP[${this.tuple}]: connect(): sending SYN+ACK in state "${this.state}", next "${TCP_STATE_SYN_SENT}"`, LOG_FETCH);
    this.seq = 1338;
    this.ack = 1;
    this.start_seq = 0;
    this.winsize = 64240;
    this.state = TCP_STATE_SYN_SENT;

    let reply = this.ipv4_reply();
    reply.ipv4.id = 2345;
    reply.tcp = {
        sport: this.sport,
        dport: this.dport,
        seq: 1337,
        ackn: 0,
        winsize: 0,
        syn: true,
    };
    this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
};


TCPConnection.prototype.accept = function(packet) {
    this.seq = 1338;
    this.ack = packet.tcp.seq + 1;
    this.start_seq = packet.tcp.seq;
    this.hsrc = this.net.router_mac;
    this.psrc = packet.ipv4.dest;
    this.sport = packet.tcp.dport;
    this.hdest = packet.eth.src;
    this.dport = packet.tcp.sport;
    this.pdest = packet.ipv4.src;
    this.winsize = packet.tcp.winsize;

    let reply = this.ipv4_reply();
    reply.tcp = {
        sport: this.sport,
        dport: this.dport,
        seq: 1337,
        ackn: this.ack,
        winsize: packet.tcp.winsize,
        syn: true,
        ack: true
    };
    // dbg_log(`TCP[${this.tuple}]: accept(): sending SYN+ACK in state "${this.state}", next "${TCP_STATE_ESTABLISHED}"`, LOG_FETCH);
    this.state = TCP_STATE_ESTABLISHED;
    this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
};

TCPConnection.prototype.process = function(packet) {
    if(this.state === TCP_STATE_CLOSED) {
        // dbg_log(`TCP[${this.tuple}]: WARNING: connection already closed, packet dropped`, LOG_FETCH);
        const reply = this.packet_reply(packet, {rst: true});
        this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
        return;
    }
    else if(packet.tcp.rst) {
        if(this.state === TCP_STATE_SYN_PROBE) {
            this.emit("probe", false);
            this.release();
            return;
        }
        // dbg_log(`TCP[${this.tuple}]: received RST in state "${this.state}"`, LOG_FETCH);
        this.on_close();
        this.release();
        return;
    }
    else if(packet.tcp.syn) {
        if(this.state === TCP_STATE_SYN_SENT && packet.tcp.ack) {
            this.ack = packet.tcp.seq + 1;
            this.start_seq = packet.tcp.seq;
            this.last_received_ackn = packet.tcp.ackn;

            const reply = this.ipv4_reply();
            this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
            // dbg_log(`TCP[${this.tuple}]: received SYN+ACK in state "${this.state}", next "${TCP_STATE_ESTABLISHED}"`, LOG_FETCH);
            this.state = TCP_STATE_ESTABLISHED;
            this.emit("connect");
        }
        else if(this.state === TCP_STATE_SYN_PROBE && packet.tcp.ack) {
            this.emit("probe", true);
            const reply = this.packet_reply(packet, {rst: true});
            this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
            this.release();
        }
        else {
            dbg_log(`TCP[${this.tuple}]: WARNING: unexpected SYN packet dropped`, LOG_FETCH);
        }
        if(packet.tcp_data.length) {
            dbg_log(`TCP[${this.tuple}]: WARNING: ${packet.tcp_data.length} bytes of unexpected SYN packet payload dropped`, LOG_FETCH);
        }
        return;
    }

    if(packet.tcp.ack) {
        if(this.state === TCP_STATE_SYN_RECEIVED) {
            // dbg_log(`TCP[${this.tuple}]: received ACK in state "${this.state}", next "${TCP_STATE_ESTABLISHED}"`, LOG_FETCH);
            this.state = TCP_STATE_ESTABLISHED;
        }
        else if(this.state === TCP_STATE_FIN_WAIT_1) {
            if(!packet.tcp.fin) {   // handle FIN+ACK in FIN_WAIT_1 separately further down below
                // dbg_log(`TCP[${this.tuple}]: received ACK in state "${this.state}", next "${TCP_STATE_FIN_WAIT_2}"`, LOG_FETCH);
                this.state = TCP_STATE_FIN_WAIT_2;
            }
        }
        else if(this.state === TCP_STATE_CLOSING || this.state === TCP_STATE_LAST_ACK) {
            // dbg_log(`TCP[${this.tuple}]: received ACK in state "${this.state}"`, LOG_FETCH);
            this.release();
            return;
        }
    }

    if(this.last_received_ackn === undefined) {
        this.last_received_ackn = packet.tcp.ackn;
    }
    else {
        const n_ack = packet.tcp.ackn - this.last_received_ackn;
        //console.log("Read ", n_ack, "(", this.last_received_ackn, ") ", packet.tcp.ackn, packet.tcp.winsize)
        if(n_ack > 0) {
            this.last_received_ackn = packet.tcp.ackn;
            this.send_buffer.remove(n_ack);
            this.seq += n_ack;
            this.pending = false;

            if(this.delayed_send_fin && !this.send_buffer.length) {
                // dbg_log(`TCP[${this.tuple}]: sending delayed FIN from active close in state "${this.state}", next "${this.delayed_state}"`, LOG_FETCH);
                this.delayed_send_fin = false;
                this.state = this.delayed_state;
                const reply = this.ipv4_reply();
                reply.tcp.fin = true;
                this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
                return;
            }
        }
        else if(n_ack < 0) {    // TODO: could this just be a 32-bit sequence number overflow?
            dbg_log(`TCP[${this.tuple}]: ERROR: ack underflow (pkt=${packet.tcp.ackn} last=${this.last_received_ackn}), resetting`, LOG_FETCH);
            const reply = this.packet_reply(packet, {rst: true});
            this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
            this.on_close();
            this.release();
            return;
        }
    }

    if(packet.tcp.fin) {
        if(this.ack !== packet.tcp.seq) {
            dbg_log(`TCP[${this.tuple}]: WARNING: closing connection in state "${this.state}" with invalid seq (${this.ack} != ${packet.tcp.seq})`, LOG_FETCH);
        }
        ++this.ack; // FIN increases seqnr
        const reply = this.packet_reply(packet, {});
        if(this.state === TCP_STATE_ESTABLISHED) {
            // dbg_log(`TCP[${this.tuple}]: received FIN in state "${this.state}, next "${TCP_STATE_CLOSE_WAIT}""`, LOG_FETCH);
            reply.tcp.ack = true;
            this.state = TCP_STATE_CLOSE_WAIT;
            this.on_shutdown();
        }
        else if(this.state === TCP_STATE_FIN_WAIT_1) {
            if(packet.tcp.ack) {
                // dbg_log(`TCP[${this.tuple}]: received ACK+FIN in state "${this.state}"`, LOG_FETCH);
                this.release();
            }
            else {
                // dbg_log(`TCP[${this.tuple}]: received ACK in state "${this.state}", next "${TCP_STATE_CLOSING}"`, LOG_FETCH);
                this.state = TCP_STATE_CLOSING;
            }
            reply.tcp.ack = true;
        }
        else if(this.state === TCP_STATE_FIN_WAIT_2) {
            // dbg_log(`TCP[${this.tuple}]: received FIN in state "${this.state}"`, LOG_FETCH);
            this.release();
            reply.tcp.ack = true;
        }
        else {
            // dbg_log(`TCP[${this.tuple}]: ERROR: received FIN in unexpected TCP state "${this.state}", resetting`, LOG_FETCH);
            this.release();
            this.on_close();
            reply.tcp.rst = true;
        }
        this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
    }
    else if(this.ack !== packet.tcp.seq) {
        // Handle TCP Keep-Alives silently.
        // Excerpt from RFC 9293, 3.8.4. TCP Keep-Alives:
        //   To confirm that an idle connection is still active, these
        //   implementations send a probe segment designed to elicit a response
        //   from the TCP peer.  Such a segment generally contains SEG.SEQ =
        //   SND.NXT-1 and may or may not contain one garbage octet of data.
        if(this.ack !== packet.tcp.seq + 1) {
            dbg_log(`Packet seq was wrong ex: ${this.ack} ~${this.ack - this.start_seq} ` +
                `pk: ${packet.tcp.seq} ~${this.start_seq - packet.tcp.seq} ` +
                `(${this.ack - packet.tcp.seq}) = ${this.name}`, LOG_FETCH);
        }
        const reply = this.packet_reply(packet, {ack: true});
        this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
    }
    else if(packet.tcp.ack && packet.tcp_data.length > 0) {
        this.ack += packet.tcp_data.length;
        const reply = this.ipv4_reply();
        this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
        this.emit("data", packet.tcp_data);
    }

    this.pump();
};

/**
 * @param {Uint8Array} data
 */
TCPConnection.prototype.write = function(data) {
    if(!this.in_active_close) {
        this.send_buffer.write(data);
    }
    this.pump();
};

/**
 * @param {!Array<Uint8Array>} data_array
 */
TCPConnection.prototype.writev = function(data_array) {
    if(!this.in_active_close) {
        for(const data of data_array) {
            this.send_buffer.write(data);
        }
    }
    this.pump();
};

TCPConnection.prototype.close = function() {
    if(!this.in_active_close) {
        this.in_active_close = true;
        let next_state;
        if(this.state === TCP_STATE_ESTABLISHED || this.state === TCP_STATE_SYN_RECEIVED) {
            next_state = TCP_STATE_FIN_WAIT_1;
        }
        else if(this.state === TCP_STATE_CLOSE_WAIT) {
            next_state = TCP_STATE_LAST_ACK;
        }
        else {
            if(this.state !== TCP_STATE_SYN_SENT) {
                dbg_log(`TCP[${this.tuple}]: active close in unexpected state "${this.state}"`, LOG_FETCH);
            }
            this.release();
            return;
        }

        if(this.send_buffer.length || this.pending) {
            // dbg_log(`TCP[${this.tuple}]: active close, delaying FIN in state "${this.state}", delayed next "${next_state}"`, LOG_FETCH);
            this.delayed_send_fin = true;
            this.delayed_state = next_state;
        }
        else {
            // dbg_log(`TCP[${this.tuple}]: active close, sending FIN in state "${this.state}", next "${next_state}"`, LOG_FETCH);
            this.state = next_state;
            const reply = this.ipv4_reply();
            reply.tcp.fin = true;
            this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
        }
    }
    this.pump();
};

TCPConnection.prototype.on_shutdown = function() {
    this.emit("shutdown");
    // forward FIN event from guest device to network adapter
};

TCPConnection.prototype.on_close = function() {
    this.emit("close");
    // forward RST event from guest device to network adapter
};

TCPConnection.prototype.release = function() {
    if(this.net.tcp_conn[this.tuple]) {
        // dbg_log(`TCP[${this.tuple}]: connection closed in state "${this.state}"`, LOG_FETCH);
        this.state = TCP_STATE_CLOSED;
        delete this.net.tcp_conn[this.tuple];
    }
};

TCPConnection.prototype.pump = function() {
    if(this.send_buffer.length && !this.pending) {
        const data = this.send_chunk_buf;
        const n_ready = this.send_buffer.peek(data);
        const reply = this.ipv4_reply();
        reply.tcp.psh = true;
        reply.tcp_data = data.subarray(0, n_ready);
        this.net.receive(make_packet(this.net.eth_encoder_buf, reply));
        this.pending = true;
    }
};


function arp_whohas(packet, adapter) {
    let packet_subnet = iptolong(packet.arp.tpa) & 0xFFFFFF00;
    let router_subnet = iptolong(adapter.router_ip) & 0xFFFFFF00;

    if(!adapter.masquerade) {
        if(packet_subnet !== router_subnet) {
            return;
        }
    }

    if(packet_subnet === router_subnet) {
        // Ignore the DHCP client area
        if(packet.arp.tpa[3] > 99) return;
    }

    // Reply to ARP Whohas
    let reply = {};
    reply.eth = { ethertype: ETHERTYPE_ARP, src: adapter.router_mac, dest: packet.eth.src };
    reply.arp = {
        htype: 1,
        ptype: ETHERTYPE_IPV4,
        oper: 2,
        sha: adapter.router_mac,
        spa: packet.arp.tpa,
        tha: packet.eth.src,
        tpa: packet.arp.spa
    };
    adapter.receive(make_packet(adapter.eth_encoder_buf, reply));
}

function handle_fake_ping(packet, adapter) {
    let reply = {};
    reply.eth = { ethertype: ETHERTYPE_IPV4, src: adapter.router_mac, dest: packet.eth.src };
    reply.ipv4 = {
        proto: IPV4_PROTO_ICMP,
        src: packet.ipv4.dest,
        dest: packet.ipv4.src,
    };
    reply.icmp = {
        type: 0,
        code: packet.icmp.code,
        data: packet.icmp.data
    };
    adapter.receive(make_packet(adapter.eth_encoder_buf, reply));
}

function handle_udp_echo(packet, adapter) {
    // UDP Echo Server
    let reply = {};
    reply.eth = { ethertype: ETHERTYPE_IPV4, src: adapter.router_mac, dest: packet.eth.src };
    reply.ipv4 = {
        proto: IPV4_PROTO_UDP,
        src: packet.ipv4.dest,
        dest: packet.ipv4.src,
    };
    reply.udp = {
        sport: packet.udp.dport,
        dport: packet.udp.sport,
        data: new TextEncoder().encode(packet.udp.data_s)
    };
    adapter.receive(make_packet(adapter.eth_encoder_buf, reply));
}


// ---- File: src/browser/fetch_network.js ----






// For Types Only


/**
 * @constructor
 *
 * @param {BusConnector} bus
 * @param {*=} config
 */
function FetchNetworkAdapter(bus, config)
{
    config = config || {};
    this.bus = bus;
    this.id = config.id || 0;
    this.router_mac = new Uint8Array((config.router_mac || "52:54:0:1:2:3").split(":").map(function(x) { return parseInt(x, 16); }));
    this.router_ip = new Uint8Array((config.router_ip || "192.168.86.1").split(".").map(function(x) { return parseInt(x, 10); }));
    this.vm_ip = new Uint8Array((config.vm_ip || "192.168.86.100").split(".").map(function(x) { return parseInt(x, 10); }));
    this.masquerade = config.masquerade === undefined || !!config.masquerade;
    this.vm_mac = new Uint8Array(6);
    this.dns_method = config.dns_method || "static";
    this.doh_server = config.doh_server;
    this.tcp_conn = {};
    this.eth_encoder_buf = create_eth_encoder_buf();
    this.fetch = (...args) => fetch(...args);

    // Ex: 'https://corsproxy.io/?'
    this.cors_proxy = config.cors_proxy;

    this.bus.register("net" + this.id + "-mac", function(mac) {
        this.vm_mac = new Uint8Array(mac.split(":").map(function(x) { return parseInt(x, 16); }));
    }, this);
    this.bus.register("net" + this.id + "-send", function(data)
    {
        this.send(data);
    }, this);
}

FetchNetworkAdapter.prototype.destroy = function()
{
};

FetchNetworkAdapter.prototype.on_tcp_connection = function(packet, tuple)
{
    if(packet.tcp.dport === 80) {
        let conn = new TCPConnection();
        conn.state = TCP_STATE_SYN_RECEIVED;
        conn.net = this;
        conn.on("data", on_data_http);
        conn.tuple = tuple;
        conn.accept(packet);
        this.tcp_conn[tuple] = conn;
        return true;
    }
    return false;
};

FetchNetworkAdapter.prototype.connect = function(port)
{
    return fake_tcp_connect(port, this);
};

FetchNetworkAdapter.prototype.tcp_probe = function(port)
{
    return fake_tcp_probe(port, this);
};

/**
 * @this {TCPConnection}
 * @param {!ArrayBuffer} data
 */
async function on_data_http(data)
{
    this.read = this.read || "";
    this.read += new TextDecoder().decode(data);
    if(this.read && this.read.indexOf("\r\n\r\n") !== -1) {
        let offset = this.read.indexOf("\r\n\r\n");
        let headers = this.read.substring(0, offset).split(/\r\n/);
        let data = this.read.substring(offset + 4);
        this.read = "";

        let first_line = headers[0].split(" ");
        let target;
        if(/^https?:/.test(first_line[1])) {
            // HTTP proxy
            target = new URL(first_line[1]);
        }
        else {
            target = new URL("http://host" + first_line[1]);
        }
        if(typeof window !== "undefined" && target.protocol === "http:" && window.location.protocol === "https:") {
            // fix "Mixed Content" errors
            target.protocol = "https:";
        }

        let req_headers = new Headers();
        for(let i = 1; i < headers.length; ++i) {
            const header = this.net.parse_http_header(headers[i]);
            if(!header) {
                console.warn('The request contains an invalid header: "%s"', headers[i]);
                this.write(new TextEncoder().encode("HTTP/1.1 400 Bad Request\r\nContent-Length: 0"));
                return;
            }
            if( header.key.toLowerCase() === "host" ) target.host = header.value;
            else req_headers.append(header.key, header.value);
        }

        dbg_log("HTTP Dispatch: " + target.href, LOG_FETCH);
        this.name = target.href;
        let opts = {
            method: first_line[0],
            headers: req_headers,
        };
        if(["put", "post"].indexOf(opts.method.toLowerCase()) !== -1) {
            opts.body = data;
        }

        const fetch_url = this.net.cors_proxy ? this.net.cors_proxy + encodeURIComponent(target.href) : target.href;
        const encoder = new TextEncoder();
        let response_started = false;
        this.net.fetch(fetch_url, opts).then((resp) => {
            const header_lines = [
                `HTTP/1.1 ${resp.status} ${resp.statusText}`,
                `x-was-fetch-redirected: ${!!resp.redirected}`,
                `x-fetch-resp-url: ${resp.url}`,
                "Connection: closed"
            ];
            for(const [key, value] of resp.headers.entries()) {
                if(!["content-encoding", "connection", "content-length", "transfer-encoding"].includes(key.toLowerCase())) {
                    header_lines.push(`${key}:  ${value}`);
                }
            }
            this.write(encoder.encode(header_lines.join("\r\n") + "\r\n\r\n"));
            response_started = true;

            if(resp.body && resp.body.getReader) {
                const resp_reader = resp.body.getReader();
                const pump = ({ value, done }) => {
                    if(value) {
                        this.write(value);
                    }
                    if(done) {
                        this.close();
                    }
                    else {
                        return resp_reader.read().then(pump);
                    }
                };
                resp_reader.read().then(pump);
            } else {
                resp.arrayBuffer().then(buffer => {
                    this.write(new Uint8Array(buffer));
                    this.close();
                });
            }
        })
        .catch((e) => {
            console.warn("Fetch Failed: " + fetch_url + "\n" + e);
            if(!response_started) {
                const body = encoder.encode(`Fetch ${fetch_url} failed:\n\n${e.stack || e.message}`);
                const header_lines = [
                    "HTTP/1.1 502 Fetch Error",
                    "Content-Type: text/plain",
                    `Content-Length: ${body.length}`,
                    "Connection: closed"
                ];
                this.writev([encoder.encode(header_lines.join("\r\n") + "\r\n\r\n"), body]);
            }
            this.close();
        });
    }
}

FetchNetworkAdapter.prototype.fetch = async function(url, options)
{
    if(this.cors_proxy) url = this.cors_proxy + encodeURIComponent(url);

    try
    {
        const resp = await fetch(url, options);
        const ab = await resp.arrayBuffer();
        return [resp, ab];
    }
    catch(e)
    {
        console.warn("Fetch Failed: " + url + "\n" + e);
        let headers = new Headers();
        headers.set("Content-Type", "text/plain");
        return [
            {
                status: 502,
                statusText: "Fetch Error",
                headers: headers,
            },
            new TextEncoder().encode(`Fetch ${url} failed:\n\n${e.stack}`).buffer
        ];
    }
};

FetchNetworkAdapter.prototype.parse_http_header = function(header)
{
    const parts = header.match(/^([^:]*):(.*)$/);
    if(!parts) {
        dbg_log("Unable to parse HTTP header", LOG_FETCH);
        return;
    }

    const key = parts[1];
    const value = parts[2].trim();

    if(key.length === 0)
    {
        dbg_log("Header key is empty, raw header", LOG_FETCH);
        return;
    }
    if(value.length === 0)
    {
        dbg_log("Header value is empty", LOG_FETCH);
        return;
    }
    if(!/^[\w-]+$/.test(key))
    {
        dbg_log("Header key contains forbidden characters", LOG_FETCH);
        return;
    }
    if(!/^[\x20-\x7E]+$/.test(value))
    {
        dbg_log("Header value contains forbidden characters", LOG_FETCH);
        return;
    }

    return { key, value };
};

/**
 * @param {Uint8Array} data
 */
FetchNetworkAdapter.prototype.send = function(data)
{
    handle_fake_networking(data, this);
};

/**
 * @param {Uint8Array} data
 */
FetchNetworkAdapter.prototype.receive = function(data)
{
    this.bus.send("net" + this.id + "-receive", new Uint8Array(data));
};


// ---- File: src/browser/wisp_network.js ----





// For Types Only


/**
 * @constructor
 *
 * @param {String} wisp_url
 * @param {BusConnector} bus
 * @param {*=} config
 */
function WispNetworkAdapter(wisp_url, bus, config)
{
    this.register_ws(wisp_url);
    this.last_stream = 1;
    this.connections = {0: {congestion: 0}};
    this.congested_buffer = [];

    config = config || {};
    this.bus = bus;
    this.id = config.id || 0;
    this.router_mac = new Uint8Array((config.router_mac || "52:54:0:1:2:3").split(":").map(function(x) { return parseInt(x, 16); }));
    this.router_ip = new Uint8Array((config.router_ip || "192.168.86.1").split(".").map(function(x) { return parseInt(x, 10); }));
    this.vm_ip = new Uint8Array((config.vm_ip || "192.168.86.100").split(".").map(function(x) { return parseInt(x, 10); }));
    this.masquerade = config.masquerade === undefined || !!config.masquerade;
    this.vm_mac = new Uint8Array(6);
    this.dns_method = config.dns_method || "doh";
    this.doh_server = config.doh_server;
    this.tcp_conn = {};
    this.eth_encoder_buf = create_eth_encoder_buf();

    this.bus.register("net" + this.id + "-mac", function(mac) {
        this.vm_mac = new Uint8Array(mac.split(":").map(function(x) { return parseInt(x, 16); }));
    }, this);
    this.bus.register("net" + this.id + "-send", function(data) {
        this.send(data);
    }, this);
}

WispNetworkAdapter.prototype.register_ws = function(wisp_url) {
    this.wispws = new WebSocket(wisp_url.replace("wisp://", "ws://").replace("wisps://", "wss://"));
    this.wispws.binaryType = "arraybuffer";
    this.wispws.onmessage = (event) => {
        this.process_incoming_wisp_frame(new Uint8Array(event.data));
    };
    this.wispws.onclose = () => {
        setTimeout(() => {
            this.register_ws(wisp_url);
        }, 10000); // wait 10s before reconnecting
    };
};

WispNetworkAdapter.prototype.send_packet = function(data, type, stream_id) {
    if(this.connections[stream_id]) {
        if(this.connections[stream_id].congestion > 0) {
            if(type === "DATA") {
                this.connections[stream_id].congestion--;
            }
            this.wispws.send(data);
        } else {
            this.connections[stream_id].congested = true;
            this.congested_buffer.push({data: data, type: type});
        }
    }
};

WispNetworkAdapter.prototype.process_incoming_wisp_frame = function(frame) {
    const view = new DataView(frame.buffer);
    const stream_id = view.getUint32(1, true);
    switch(frame[0]) {
        case 1: // CONNECT
            // The server should never send this actually
            dbg_log("Server sent client-only packet CONNECT", LOG_NET);
            break;
        case 2: // DATA
            if(this.connections[stream_id])
                this.connections[stream_id].data_callback(frame.slice(5));
            else
                throw new Error("Got a DATA packet but stream not registered. ID: " + stream_id);
            break;
        case 3: // CONTINUE
            if(this.connections[stream_id]) {
                this.connections[stream_id].congestion = view.getUint32(5, true);
            }

            if(this.connections[stream_id].congested) {
                for(const packet of this.congested_buffer) {
                    this.send_packet(packet.data, packet.type, stream_id);
                }
                this.connections[stream_id].congested = false;
            }
            break;
        case 4: // CLOSE
            if(this.connections[stream_id])
                this.connections[stream_id].close_callback(view.getUint8(5));
            delete this.connections[stream_id];
            break;
        case 5: // PROTOEXT
            dbg_log("got a wisp V2 upgrade request, ignoring", LOG_NET);
            // Not responding, this is wisp v1 client not wisp v2;
            break;
        default:
            dbg_log("Wisp server returned unknown packet: " + frame[0], LOG_NET);
    }
};


// FrameObj will be the following
// FrameObj.stream_id (number)
//
// FrameObj.type -- CONNECT
//      FrameObj.hostname (string)
//      FrameObj.port (number)
//      FrameObj.data_callback (function (Uint8Array))
//      FrameObj.close_callback (function (number)) OPTIONAL
//
//
// FrameObj.type -- DATA
//      FrameObj.data (Uint8Array)
//
// FrameObj.type -- CLOSE
//      FrameObj.reason (number)
//
//

WispNetworkAdapter.prototype.send_wisp_frame = function(frame_obj) {
    let full_packet;
    let view;
    switch(frame_obj.type) {
        case "CONNECT":
            const hostname_buffer = new TextEncoder().encode(frame_obj.hostname);
            full_packet = new Uint8Array(5 + 1 + 2 + hostname_buffer.length);
            view = new DataView(full_packet.buffer);
            view.setUint8(0, 0x01);                       // TYPE
            view.setUint32(1, frame_obj.stream_id, true); // Stream ID
            view.setUint8(5, 0x01);                       // TCP
            view.setUint16(6, frame_obj.port, true);      // PORT
            full_packet.set(hostname_buffer, 8);          // hostname

            // Setting callbacks
            this.connections[frame_obj.stream_id] = {
                data_callback: frame_obj.data_callback,
                close_callback: frame_obj.close_callback,
                congestion: this.connections[0].congestion
            };
            break;
        case "DATA":
            full_packet = new Uint8Array(5 + frame_obj.data.length);
            view = new DataView(full_packet.buffer);
            view.setUint8(0, 0x02);                       // TYPE
            view.setUint32(1, frame_obj.stream_id, true); // Stream ID
            full_packet.set(frame_obj.data, 5);           // Actual data
            break;
        case "CLOSE":
            full_packet = new Uint8Array(5 + 1);
            view = new DataView(full_packet.buffer);
            view.setUint8(0, 0x04);                       // TYPE
            view.setUint32(1, frame_obj.stream_id, true); // Stream ID
            view.setUint8(5, frame_obj.reason);           // Packet size
            break;
        default:
            dbg_log("Client tried to send unknown packet: " + frame_obj.type, LOG_NET);

    }
    this.send_packet(full_packet, frame_obj.type, frame_obj.stream_id);
};

WispNetworkAdapter.prototype.destroy = function()
{
    if(this.wispws) {
        this.wispws.onmessage = null;
        this.wispws.onclose = null;
        this.wispws.close();
        this.wispws = null;
    }
};

/**
 * @param {Uint8Array} packet
 * @param {String} tuple
 */
WispNetworkAdapter.prototype.on_tcp_connection = function(packet, tuple)
{
    let conn = new TCPConnection();
    conn.state = TCP_STATE_SYN_RECEIVED;
    conn.net = this;
    conn.tuple = tuple;
    conn.stream_id = this.last_stream++;
    this.tcp_conn[tuple] = conn;

    conn.on("data", data => {
        if(data.length !== 0) {
            this.send_wisp_frame({
                type: "DATA",
                stream_id: conn.stream_id,
                data: data
            });
        }
    });

    conn.on_close = () => {
        this.send_wisp_frame({
            type: "CLOSE",
            stream_id: conn.stream_id,
            reason: 0x02    // 0x02: Voluntary stream closure
        });
    };

    // WISP doesn't implement shutdown, use close as workaround
    conn.on_shutdown = conn.on_close;

    this.send_wisp_frame({
        type: "CONNECT",
        stream_id: conn.stream_id,
        hostname: packet.ipv4.dest.join("."),
        port: packet.tcp.dport,
        data_callback: (data) => {
            conn.write(data);
        },
        close_callback: (data) => {
            conn.close();
        }
    });

    conn.accept(packet);
    return true;
};

/**
 * @param {Uint8Array} data
 */
WispNetworkAdapter.prototype.send = function(data)
{
    // TODO: forward UDP traffic to WISP server once this WISP client supports UDP
    handle_fake_networking(data, this);
};

/**
 * @param {Uint8Array} data
 */
WispNetworkAdapter.prototype.receive = function(data)
{
    this.bus.send("net" + this.id + "-receive", new Uint8Array(data));
};


// ---- File: src/browser/keyboard.js ----
// For Types Only


const SHIFT_SCAN_CODE = 0x2A;
const SCAN_CODE_RELEASE = 0x80;

const PLATFOM_WINDOWS = typeof window !== "undefined" && window.navigator.platform.toString().toLowerCase().search("win") >= 0;

/**
 * @constructor
 *
 * @param {BusConnector} bus
 */
function KeyboardAdapter(bus)
{
    var
        /**
         * @type {!Object.<boolean>}
         */
        keys_pressed = {},

        /**
         * Deferred KeyboardEvent or null (Windows AltGr-Filter)
         * @type {KeyboardEvent|Object|null}
         */
        deferred_event = null,

        /**
         * Deferred keydown state (Windows AltGr-Filter)
         * @type {boolean}
         */
        deferred_keydown = false,

        /**
         * Timeout-ID returned by setTimeout() or 0 (Windows AltGr-Filter)
         * @type {number}
         */
        deferred_timeout_id = 0,

        keyboard = this;

    /**
     * Set by emulator
     * @type {boolean}
     */
    this.emu_enabled = true;

    // Format:
    // Javascript event.keyCode -> make code
    const charmap = new Uint16Array([
        0, 0, 0, 0,  0, 0, 0, 0,
        // 0x08: backspace, tab, enter
        0x0E, 0x0F, 0, 0,  0, 0x1C, 0, 0,

        // 0x10: shift, ctrl, alt, pause, caps lock
        0x2A, 0x1D, 0x38, 0,  0x3A, 0, 0, 0,

        // 0x18: escape
        0, 0, 0, 0x01,  0, 0, 0, 0,

        // 0x20: spacebar, page down/up, end, home, arrow keys, ins, del
        0x39, 0xE049, 0xE051, 0xE04F,  0xE047, 0xE04B, 0xE048, 0xE04D,
        0x50, 0, 0, 0,  0, 0x52, 0x53, 0,

        // 0x30: numbers
        0x0B, 0x02, 0x03, 0x04,  0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A,

        // 0x3B: ;= (firefox only)
        0, 0x27, 0, 0x0D, 0, 0,

        // 0x40
        0,

        // 0x41: letters
        0x1E, 0x30, 0x2E, 0x20, 0x12, 0x21, 0x22, 0x23, 0x17, 0x24, 0x25, 0x26, 0x32,
        0x31, 0x18, 0x19, 0x10, 0x13, 0x1F, 0x14, 0x16, 0x2F, 0x11, 0x2D, 0x15, 0x2C,

        // 0x5B: Left Win, Right Win, Menu
        0xE05B, 0xE05C, 0xE05D, 0, 0,

        // 0x60: keypad
        0x52, 0x4F, 0x50, 0x51, 0x4B, 0x4C, 0x4D, 0x47,
        0x48, 0x49, 0, 0, 0, 0, 0, 0,

        // 0x70: F1 to F12
        0x3B, 0x3C, 0x3D, 0x3E, 0x3F, 0x40, 0x41, 0x42, 0x43, 0x44, 0x57, 0x58,

        0, 0, 0, 0,

        // 0x80
        0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0, 0, 0,

        // 0x90: Numlock
        0x45, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,     0, 0, 0, 0,

        // 0xA0: - (firefox only)
        0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,  0, 0x0C, 0, 0,

        // 0xB0
        // ,
        0, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0x27, 0x0D,  0x33, 0x0C, 0x34, 0x35,

        // 0xC0
        // `
        0x29, 0, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,     0, 0, 0, 0,

        // 0xD0
        // [']\
        0, 0, 0, 0,     0, 0, 0, 0,
        0, 0, 0, 0x1A,  0x2B, 0x1B, 0x28, 0,

        // 0xE0
        // Apple key on Gecko, Right alt
        0xE05B, 0xE038, 0, 0,  0, 0, 0, 0,
        0, 0, 0, 0,            0, 0, 0, 0,
    ]);


    // ascii -> javascript event code (US layout)
    const asciimap = {8: 8, 10: 13, 32: 32, 39: 222, 44: 188, 45: 189, 46: 190, 47: 191, 48: 48, 49: 49, 50: 50, 51: 51, 52: 52, 53: 53, 54: 54, 55: 55, 56: 56, 57: 57, 59: 186, 61: 187, 91: 219, 92: 220, 93: 221, 96: 192, 97: 65, 98: 66, 99: 67, 100: 68, 101: 69, 102: 70, 103: 71, 104: 72, 105: 73, 106: 74, 107: 75, 108: 76, 109: 77, 110: 78, 111: 79, 112: 80, 113: 81, 114: 82, 115: 83, 116: 84, 117: 85, 118: 86, 119: 87, 120: 88, 121: 89, 122: 90};
    const asciimap_shift = {33: 49, 34: 222, 35: 51, 36: 52, 37: 53, 38: 55, 40: 57, 41: 48, 42: 56, 43: 187, 58: 186, 60: 188, 62: 190, 63: 191, 64: 50, 65: 65, 66: 66, 67: 67, 68: 68, 69: 69, 70: 70, 71: 71, 72: 72, 73: 73, 74: 74, 75: 75, 76: 76, 77: 77, 78: 78, 79: 79, 80: 80, 81: 81, 82: 82, 83: 83, 84: 84, 85: 85, 86: 86, 87: 87, 88: 88, 89: 89, 90: 90, 94: 54, 95: 189, 123: 219, 124: 220, 125: 221, 126: 192};

    // From:
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code#Code_values_on_Linux_%28X11%29_%28When_scancode_is_available%29
    // http://stanislavs.org/helppc/make_codes.html
    // http://www.computer-engineering.org/ps2keyboard/scancodes1.html
    //
    // Mapping from event.code to scancode
    var codemap = {
        "Escape": 0x0001,
        "Digit1": 0x0002,
        "Digit2": 0x0003,
        "Digit3": 0x0004,
        "Digit4": 0x0005,
        "Digit5": 0x0006,
        "Digit6": 0x0007,
        "Digit7": 0x0008,
        "Digit8": 0x0009,
        "Digit9": 0x000a,
        "Digit0": 0x000b,
        "Minus": 0x000c,
        "Equal": 0x000d,
        "Backspace": 0x000e,
        "Tab": 0x000f,
        "KeyQ": 0x0010,
        "KeyW": 0x0011,
        "KeyE": 0x0012,
        "KeyR": 0x0013,
        "KeyT": 0x0014,
        "KeyY": 0x0015,
        "KeyU": 0x0016,
        "KeyI": 0x0017,
        "KeyO": 0x0018,
        "KeyP": 0x0019,
        "BracketLeft": 0x001a,
        "BracketRight": 0x001b,
        "Enter": 0x001c,
        "ControlLeft": 0x001d,
        "KeyA": 0x001e,
        "KeyS": 0x001f,
        "KeyD": 0x0020,
        "KeyF": 0x0021,
        "KeyG": 0x0022,
        "KeyH": 0x0023,
        "KeyJ": 0x0024,
        "KeyK": 0x0025,
        "KeyL": 0x0026,
        "Semicolon": 0x0027,
        "Quote": 0x0028,
        "Backquote": 0x0029,
        "ShiftLeft": 0x002a,
        "Backslash": 0x002b,
        "KeyZ": 0x002c,
        "KeyX": 0x002d,
        "KeyC": 0x002e,
        "KeyV": 0x002f,
        "KeyB": 0x0030,
        "KeyN": 0x0031,
        "KeyM": 0x0032,
        "Comma": 0x0033,
        "Period": 0x0034,
        "Slash": 0x0035,
        "IntlRo": 0x0035,
        "ShiftRight": 0x0036,
        "NumpadMultiply": 0x0037,
        "AltLeft": 0x0038,
        "Space": 0x0039,
        "CapsLock": 0x003a,
        "F1": 0x003b,
        "F2": 0x003c,
        "F3": 0x003d,
        "F4": 0x003e,
        "F5": 0x003f,
        "F6": 0x0040,
        "F7": 0x0041,
        "F8": 0x0042,
        "F9": 0x0043,
        "F10": 0x0044,
        "NumLock": 0x0045,
        "ScrollLock": 0x0046,
        "Numpad7": 0x0047,
        "Numpad8": 0x0048,
        "Numpad9": 0x0049,
        "NumpadSubtract": 0x004a,
        "Numpad4": 0x004b,
        "Numpad5": 0x004c,
        "Numpad6": 0x004d,
        "NumpadAdd": 0x004e,
        "Numpad1": 0x004f,
        "Numpad2": 0x0050,
        "Numpad3": 0x0051,
        "Numpad0": 0x0052,
        "NumpadDecimal": 0x0053,
        "IntlBackslash": 0x0056,
        "F11": 0x0057,
        "F12": 0x0058,

        "NumpadEnter": 0xe01c,
        "ControlRight": 0xe01d,
        "NumpadDivide": 0xe035,
        //"PrintScreen": 0x0063,
        "AltRight": 0xe038,
        "Home": 0xe047,
        "ArrowUp": 0xe048,
        "PageUp": 0xe049,
        "ArrowLeft": 0xe04b,
        "ArrowRight": 0xe04d,
        "End": 0xe04f,
        "ArrowDown": 0xe050,
        "PageDown": 0xe051,
        "Insert": 0xe052,
        "Delete": 0xe053,

        "OSLeft": 0xe05b,
        "OSRight": 0xe05c,
        "ContextMenu": 0xe05d,
    };

    this.bus = bus;

    this.destroy = function()
    {
        if(typeof window !== "undefined")
        {
            window.removeEventListener("keyup", keyup_handler, false);
            window.removeEventListener("keydown", keydown_handler, false);
            window.removeEventListener("blur", blur_handler, false);
        }
    };

    this.init = function()
    {
        if(typeof window === "undefined")
        {
            return;
        }
        this.destroy();

        window.addEventListener("keyup", keyup_handler, false);
        window.addEventListener("keydown", keydown_handler, false);
        window.addEventListener("blur", blur_handler, false);
    };
    this.init();

    this.simulate_press = function(code)
    {
        var ev = { keyCode: code };
        handler(ev, true);
        handler(ev, false);
    };

    this.simulate_char = function(chr)
    {
        var code = chr.charCodeAt(0);

        if(code in asciimap)
        {
            this.simulate_press(asciimap[code]);
        }
        else if(code in asciimap_shift)
        {
            send_to_controller(SHIFT_SCAN_CODE);
            this.simulate_press(asciimap_shift[code]);
            send_to_controller(SHIFT_SCAN_CODE | SCAN_CODE_RELEASE);
        }
        else
        {
            console.log("ascii -> keyCode not found: ", code, chr);
        }
    };

    function may_handle(e)
    {
        if(e.shiftKey && e.ctrlKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 75))
        {
              // don't prevent opening chromium dev tools
              // maybe add other important combinations here, too
              return false;
        }

        if(!keyboard.emu_enabled)
        {
            return false;
        }

        if(e.target)
        {
            // className shouldn't be hardcoded here
            return e.target.classList.contains("phone_keyboard") ||
                (e.target.nodeName !== "INPUT" && e.target.nodeName !== "TEXTAREA");
        }
        else
        {
            return true;
        }
    }

    function translate(e)
    {
        if(e.code !== undefined)
        {
            var code = codemap[e.code];

            if(code !== undefined)
            {
                return code;
            }
        }

        return charmap[e.keyCode];
    }

    function keyup_handler(e)
    {
        if(!e.altKey && keys_pressed[0x38])
        {
            // trigger ALT keyup manually - some browsers don't
            // see issue #165
            handle_code(0x38, false);
        }
        return handler(e, false);
    }

    function keydown_handler(e)
    {
        if(!e.altKey && keys_pressed[0x38])
        {
            // trigger ALT keyup manually - some browsers don't
            // see issue #165
            handle_code(0x38, false);
        }
        return handler(e, true);
    }

    function blur_handler(e)
    {
        // trigger keyup for all pressed keys
        var keys = Object.keys(keys_pressed),
            key;

        for(var i = 0; i < keys.length; i++)
        {
            key = +keys[i];

            if(keys_pressed[key])
            {
                handle_code(key, false);
            }
        }

        keys_pressed = {};
    }

    /**
     * @param {KeyboardEvent|Object} e
     * @param {boolean} keydown
     */
    function handler(e, keydown)
    {
        if(!keyboard.bus)
        {
            return;
        }

        if(!may_handle(e))
        {
            return;
        }

        e.preventDefault && e.preventDefault();

        if(PLATFOM_WINDOWS)
        {
            // Remove ControlLeft from key sequence [ControlLeft, AltRight] when
            // AltGraph-key is pressed or released.
            //
            // NOTE: AltGraph is false for the 1st key (ControlLeft-Down), becomes
            // true with the 2nd (AltRight-Down) and stays true until key AltGraph
            // is released (AltRight-Up).
            if(deferred_event)
            {
                clearTimeout(deferred_timeout_id);
                if(!(e.getModifierState && e.getModifierState("AltGraph") &&
                        deferred_keydown === keydown &&
                        deferred_event.code === "ControlLeft" && e.code === "AltRight"))
                {
                    handle_event(deferred_event, deferred_keydown);
                }
                deferred_event = null;
            }

            if(e.code === "ControlLeft")
            {
                // defer ControlLeft-Down/-Up until the next invocation of this method or 10ms have passed, whichever comes first
                deferred_event = e;
                deferred_keydown = keydown;
                deferred_timeout_id = setTimeout(() => {
                    handle_event(deferred_event, deferred_keydown);
                    deferred_event = null;
                }, 10);
                return false;
            }
        }

        handle_event(e, keydown);
        return false;
    }

    /**
     * @param {KeyboardEvent|Object} e
     * @param {boolean} keydown
     */
    function handle_event(e, keydown)
    {
        var code = translate(e);

        if(!code)
        {
            console.log("Missing char in map: keyCode=" + (e.keyCode || -1).toString(16) + " code=" + e.code);
            return;
        }

        handle_code(code, keydown, e.repeat);
    }

    /**
     * @param {number} code
     * @param {boolean} keydown
     * @param {boolean=} is_repeat
     */
    function handle_code(code, keydown, is_repeat)
    {
        if(keydown)
        {
            if(keys_pressed[code] && !is_repeat)
            {
                handle_code(code, false);
            }
        }
        else
        {
            if(!keys_pressed[code])
            {
                // stray keyup
                return;
            }
        }

        keys_pressed[code] = keydown;

        if(!keydown)
        {
            code |= 0x80;
        }
        //console.log("Key: " + code.toString(16) + " from " + chr.toString(16) + " down=" + keydown);

        if(code > 0xFF)
        {
            // prefix
            send_to_controller(code >> 8);
            send_to_controller(code & 0xFF);
        }
        else
        {
            send_to_controller(code);
        }
    }

    function send_to_controller(code)
    {
        keyboard.bus.send("keyboard-code", code);
    }
}


// ---- File: src/browser/mouse.js ----


// For Types Only


/**
 * @constructor
 *
 * @param {BusConnector} bus
 */
function MouseAdapter(bus, screen_container)
{
    const SPEED_FACTOR = 0.15;

    var left_down = false,
        right_down = false,
        middle_down = false,

        last_x = 0,
        last_y = 0,

        mouse = this;

    // set by controller
    this.enabled = false;

    // set by emulator
    this.emu_enabled = true;

    this.bus = bus;

    this.bus.register("mouse-enable", function(enabled)
    {
        this.enabled = enabled;
    }, this);

    // TODO: Should probably not use bus for this
    this.is_running = false;
    this.bus.register("emulator-stopped", function()
    {
        this.is_running = false;
    }, this);
    this.bus.register("emulator-started", function()
    {
        this.is_running = true;
    }, this);

    this.destroy = function()
    {
        if(typeof window === "undefined")
        {
            return;
        }
        window.removeEventListener("touchstart", touch_start_handler, false);
        window.removeEventListener("touchend", touch_end_handler, false);
        window.removeEventListener("touchmove", mousemove_handler, false);
        window.removeEventListener("mousemove", mousemove_handler, false);
        window.removeEventListener("mousedown", mousedown_handler, false);
        window.removeEventListener("mouseup", mouseup_handler, false);
        window.removeEventListener("wheel", mousewheel_handler, { passive: false });
    };

    this.init = function()
    {
        if(typeof window === "undefined")
        {
            return;
        }
        this.destroy();

        window.addEventListener("touchstart", touch_start_handler, false);
        window.addEventListener("touchend", touch_end_handler, false);
        window.addEventListener("touchmove", mousemove_handler, false);
        window.addEventListener("mousemove", mousemove_handler, false);
        window.addEventListener("mousedown", mousedown_handler, false);
        window.addEventListener("mouseup", mouseup_handler, false);
        window.addEventListener("wheel", mousewheel_handler, { passive: false });
    };
    this.init();

    function is_child(child, parent)
    {
        while(child.parentNode)
        {
            if(child === parent)
            {
                return true;
            }
            child = child.parentNode;
        }

        return false;
    }

    function may_handle(e)
    {
        if(!mouse.enabled || !mouse.emu_enabled)
        {
            return false;
        }

        const MOVE_MOUSE_WHEN_OVER_SCREEN_ONLY = true;

        if(MOVE_MOUSE_WHEN_OVER_SCREEN_ONLY)
        {
            var parent = screen_container || document.body;
            return document.pointerLockElement || is_child(e.target, parent);
        }
        else
        {
            if(e.type === "mousemove" || e.type === "touchmove")
            {
                return true;
            }

            if(e.type === "mousewheel" || e.type === "DOMMouseScroll")
            {
                return is_child(e.target, parent);
            }

            return !e.target || e.target.nodeName !== "INPUT" && e.target.nodeName !== "TEXTAREA";
        }
    }

    function touch_start_handler(e)
    {
        if(may_handle(e))
        {
            var touches = e["changedTouches"];

            if(touches && touches.length)
            {
                var touch = touches[touches.length - 1];
                last_x = touch.clientX;
                last_y = touch.clientY;
            }
        }
    }

    function touch_end_handler(e)
    {
        if(left_down || middle_down || right_down)
        {
            mouse.bus.send("mouse-click", [false, false, false]);
            left_down = middle_down = right_down = false;
        }
    }

    function mousemove_handler(e)
    {
        if(!mouse.bus)
        {
            return;
        }

        if(!may_handle(e))
        {
            return;
        }

        if(!mouse.is_running)
        {
            return;
        }

        var delta_x = 0;
        var delta_y = 0;

        var touches = e["changedTouches"];

        if(touches)
        {
            if(touches.length)
            {
                var touch = touches[touches.length - 1];
                delta_x = touch.clientX - last_x;
                delta_y = touch.clientY - last_y;

                last_x = touch.clientX;
                last_y = touch.clientY;

                e.preventDefault();
            }
        }
        else
        {
            if(typeof e["movementX"] === "number")
            {
                delta_x = e["movementX"];
                delta_y = e["movementY"];
            }
            else if(typeof e["webkitMovementX"] === "number")
            {
                delta_x = e["webkitMovementX"];
                delta_y = e["webkitMovementY"];
            }
            else if(typeof e["mozMovementX"] === "number")
            {
                delta_x = e["mozMovementX"];
                delta_y = e["mozMovementY"];
            }
            else
            {
                // Fallback for other browsers?
                delta_x = e.clientX - last_x;
                delta_y = e.clientY - last_y;

                last_x = e.clientX;
                last_y = e.clientY;
            }
        }

        delta_x *= SPEED_FACTOR;
        delta_y *= SPEED_FACTOR;

        //if(Math.abs(delta_x) > 100 || Math.abs(delta_y) > 100)
        //{
        //    // Large mouse delta, drop?
        //}

        delta_y = -delta_y;

        mouse.bus.send("mouse-delta", [delta_x, delta_y]);

        if(screen_container)
        {
            const absolute_x = e.pageX - screen_container.offsetLeft;
            const absolute_y = e.pageY - screen_container.offsetTop;
            mouse.bus.send("mouse-absolute", [
                absolute_x, absolute_y, screen_container.offsetWidth, screen_container.offsetHeight]);
        }
    }

    function mousedown_handler(e)
    {
        if(may_handle(e))
        {
            click_event(e, true);
        }
    }

    function mouseup_handler(e)
    {
        if(may_handle(e))
        {
            click_event(e, false);
        }
    }

    function click_event(e, down)
    {
        if(!mouse.bus)
        {
            return;
        }

        if(e.which === 1)
        {
            left_down = down;
        }
        else if(e.which === 2)
        {
            middle_down = down;
        }
        else if(e.which === 3)
        {
            right_down = down;
        }
        else
        {
            dbg_log("Unknown event.which: " + e.which);
        }
        mouse.bus.send("mouse-click", [left_down, middle_down, right_down]);
        e.preventDefault();
    }

    function mousewheel_handler(e)
    {
        if(!may_handle(e))
        {
            return;
        }

        var delta_x = e.wheelDelta || -e.detail;
        var delta_y = 0;

        if(delta_x < 0)
        {
            delta_x = -1;
        }
        else if(delta_x > 0)
        {
            delta_x = 1;
        }

        mouse.bus.send("mouse-wheel", [delta_x, delta_y]);
        e.preventDefault();
    }
}


// ---- File: src/browser/serial.js ----


// For Types Only


/**
 * @constructor
 *
 * @param {BusConnector} bus
 */
function SerialAdapter(element, bus)
{
    var serial = this;

    this.enabled = true;
    this.bus = bus;
    this.text = "";
    this.text_new_line = false;

    this.last_update = 0;


    this.bus.register("serial0-output-byte", function(byte)
    {
        var chr = String.fromCharCode(byte);
        this.show_char(chr);
    }, this);


    this.destroy = function()
    {
        element.removeEventListener("keypress", keypress_handler, false);
        element.removeEventListener("keydown", keydown_handler, false);
        element.removeEventListener("paste", paste_handler, false);
        window.removeEventListener("mousedown", window_click_handler, false);
    };

    this.init = function()
    {
        this.destroy();

        element.style.display = "block";
        element.addEventListener("keypress", keypress_handler, false);
        element.addEventListener("keydown", keydown_handler, false);
        element.addEventListener("paste", paste_handler, false);
        window.addEventListener("mousedown", window_click_handler, false);
    };
    this.init();


    this.show_char = function(chr)
    {
        if(chr === "\x08")
        {
            this.text = this.text.slice(0, -1);
            this.update();
        }
        else if(chr === "\r")
        {
            // do nothing
        }
        else
        {
            this.text += chr;

            if(chr === "\n")
            {
                this.text_new_line = true;
            }

            this.update();
        }
    };

    this.update = function()
    {
        var now = Date.now();
        var delta = now - this.last_update;

        if(delta < 16)
        {
            if(this.update_timer === undefined)
            {
                this.update_timer = setTimeout(() => {
                    this.update_timer = undefined;
                    var now = Date.now();
                    dbg_assert(now - this.last_update >= 15);
                    this.last_update = now;
                    this.render();
                }, 16 - delta);
            }
        }
        else
        {
            if(this.update_timer !== undefined)
            {
                clearTimeout(this.update_timer);
                this.update_timer = undefined;
            }

            this.last_update = now;
            this.render();
        }
    };

    this.render = function()
    {
        element.value = this.text;

        if(this.text_new_line)
        {
            this.text_new_line = false;
            element.scrollTop = 1e9;
        }
    };

    /**
     * @param {number} chr_code
     */
    this.send_char = function(chr_code)
    {
        if(serial.bus)
        {
            serial.bus.send("serial0-input", chr_code);
        }
    };

    function may_handle(e)
    {
        if(!serial.enabled)
        {
            return false;
        }

        // Something here?

        return true;
    }

    function keypress_handler(e)
    {
        if(!serial.bus)
        {
            return;
        }
        if(!may_handle(e))
        {
            return;
        }

        var chr = e.which;

        serial.send_char(chr);
        e.preventDefault();
    }

    function keydown_handler(e)
    {
        var chr = e.which;

        if(chr === 8)
        {
            // supress backspace
            serial.send_char(127);
            e.preventDefault();
        }
        else if(chr === 9)
        {
            // tab
            serial.send_char(9);
            e.preventDefault();
        }
    }

    function paste_handler(e)
    {
        if(!may_handle(e))
        {
            return;
        }

        var data = e.clipboardData.getData("text/plain");

        for(var i = 0; i < data.length; i++)
        {
            serial.send_char(data.charCodeAt(i));
        }

        e.preventDefault();
    }

    function window_click_handler(e)
    {
        if(e.target !== element)
        {
            element.blur();
        }
    }
}

/**
 * @constructor
 *
 * @param {BusConnector} bus
 */
function SerialRecordingAdapter(bus)
{
    var serial = this;
    this.text = "";

    bus.register("serial0-output-byte", function(byte)
    {
        var chr = String.fromCharCode(byte);
        this.text += chr;
    }, this);
}

/**
 * @constructor
 * @param {BusConnector} bus
 */
function SerialAdapterXtermJS(element, bus)
{
    this.element = element;

    if(!window["Terminal"])
    {
        return;
    }

    var term = this.term = new window["Terminal"]({
        "logLevel": "off",
    });
    term.write("This is the serial console. Whatever you type or paste here will be sent to COM1");

    const on_data_disposable = term["onData"](function(data) {
        for(let i = 0; i < data.length; i++)
        {
            bus.send("serial0-input", data.charCodeAt(i));
        }
    });

    bus.register("serial0-output-byte", function(byte)
    {
        term.write(Uint8Array.of(byte));
    }, this);

    this.destroy = function() {
        on_data_disposable["dispose"]();
        term["dispose"]();
    };
}

SerialAdapterXtermJS.prototype.show = function()
{
    this.term && this.term.open(this.element);
};


// ---- File: src/browser/inbrowser_network.js ----
// For Types Only


/**
 * Network adapter "inbrowser" which connects the emulated NIC
 * to a shared in-browser BroadcastChannel.
 *
 * NOTE: BroadcastChannel.postMessage() sends the given message to
 *       *other* BroadcastChannel objects set up for the same channel.
 *       Since we use the same BroadcastChannel instance for both
 *       sending and receiving we do not receive copies of our
 *       own sent messages.
 *       Source: https://html.spec.whatwg.org/multipage/web-messaging.html#broadcasting-to-other-browsing-contexts
 *
 * @constructor
 *
 * @param {BusConnector} bus
 * @param {*=} config
 */
function InBrowserNetworkAdapter(bus, config)
{
    const id = config.id || 0;

    this.bus = bus;
    this.bus_send_msgid = `net${id}-send`;
    this.bus_recv_msgid = `net${id}-receive`;
    this.channel = new BroadcastChannel(`v86-inbrowser-${id}`);
    this.is_open = true;

    // forward ethernet frames from emulated NIC to hub
    this.nic_to_hub_fn = (eth_frame) => {
        this.channel.postMessage(eth_frame);
    };
    this.bus.register(this.bus_send_msgid, this.nic_to_hub_fn, this);

    // forward ethernet frames from hub to emulated NIC
    this.hub_to_nic_fn = (ev) => {
        this.bus.send(this.bus_recv_msgid, ev.data);
    };
    this.channel.addEventListener("message", this.hub_to_nic_fn);
}

InBrowserNetworkAdapter.prototype.destroy = function()
{
    if(this.is_open) {
        this.bus.unregister(this.bus_send_msgid, this.nic_to_hub_fn);
        this.channel.removeEventListener("message", this.hub_to_nic_fn);
        this.channel.close();
        this.is_open = false;
    }
};


// ---- File: src/browser/starter.js ----

























/**
 * Constructor for emulator instances.
 *
 * Usage: `new V86(options);`
 *
 * Options can have the following properties (all optional, default in parenthesis):
 *
 * - `memory_size number` (64 * 1024 * 1024) - The memory size in bytes, should
 *   be a power of 2.
 * - `vga_memory_size number` (8 * 1024 * 1024) - VGA memory size in bytes.
 *
 * - `autostart boolean` (false) - If emulation should be started when emulator
 *   is ready.
 *
 * - `disable_keyboard boolean` (false) - If the keyboard should be disabled.
 * - `disable_mouse boolean` (false) - If the mouse should be disabled.
 *
 * - `network_relay_url string` (No network card) - The url of a server running
 *   websockproxy. See [networking.md](networking.md). Setting this will
 *   enable an emulated ne2k network card. Only provided for backwards
 *   compatibility, use `net_device` instead.
 *
 * - `net_device Object` (null) - An object with the following properties:
 *   - `relay_url: string` - See above
 *   - `type: "ne2k" | "virtio"` - the type of the emulated cards
 *
 * - `net_devices Array<Object>` - Like `net_device`, but allows specifying
 *   more than one network card (up to 4). (currently not implemented)
 *
 * - `bios Object` (No bios) - Either a url pointing to a bios or an
 *   ArrayBuffer, see below.
 * - `vga_bios Object` (No VGA bios) - VGA bios, see below.
 * - `hda Object` (No hard disk) - First hard disk, see below.
 * - `fda Object` (No floppy disk) - First floppy disk, see below.
 * - `cdrom Object` (No CD) - See below.
 *
 * - `bzimage Object` - A Linux kernel image to boot (only bzimage format), see below.
 * - `initrd Object` - A Linux ramdisk image, see below.
 * - `bzimage_initrd_from_filesystem boolean` - Automatically fetch bzimage and
 *    initrd from the specified `filesystem`.
 *
 * - `initial_state Object` (Normal boot) - An initial state to load, see
 *   [`restore_state`](#restore_statearraybuffer-state) and below.
 *
 * - `filesystem Object` (No 9p filesystem) - A 9p filesystem, see
 *   [filesystem.md](filesystem.md).
 *
 * - `serial_container HTMLTextAreaElement` (No serial terminal) - A textarea
 *   that will receive and send data to the emulated serial terminal.
 *   Alternatively the serial terminal can also be accessed programatically,
 *   see [serial.html](../examples/serial.html).
 *
 * - `screen_container HTMLElement` (No screen) - An HTMLElement. This should
 *   have a certain structure, see [basic.html](../examples/basic.html). Only
 *   provided for backwards compatibility, use `screen` instead.
 *
 * - `screen Object` (No screen) - An object with the following properties:
 *   - `container HTMLElement` - An HTMLElement, see above.
 *   - `scale` (1) - Set initial scale_x and scale_y, if 0 disable automatic upscaling and dpi-adaption
 *
 * ***
 *
 * There are two ways to load images (`bios`, `vga_bios`, `cdrom`, `hda`, ...):
 *
 * - Pass an object that has a url. Optionally, `async: true` and `size:
 *   size_in_bytes` can be added to the object, so that sectors of the image
 *   are loaded on demand instead of being loaded before boot (slower, but
 *   strongly recommended for big files). In that case, the `Range: bytes=...`
 *   header must be supported on the server.
 *
 *   ```javascript
 *   // download file before boot
 *   bios: {
 *       url: "bios/seabios.bin"
 *   }
 *   // download file sectors as requested, size is required
 *   hda: {
 *       url: "disk/linux.iso",
 *       async: true,
 *       size: 16 * 1024 * 1024
 *   }
 *   ```
 *
 * - Pass an `ArrayBuffer` or `File` object as `buffer` property.
 *
 *   ```javascript
 *   // use <input type=file>
 *   bios: {
 *       buffer: document.all.hd_image.files[0]
 *   }
 *   // start with empty hard disk
 *   hda: {
 *       buffer: new ArrayBuffer(16 * 1024 * 1024)
 *   }
 *   ```
 *
 * @param {{
      disable_mouse: (boolean|undefined),
      disable_keyboard: (boolean|undefined),
      wasm_fn: (Function|undefined),
      screen: ({
          scale: (number|undefined),
      } | undefined),
    }} options
 * @constructor
 */
function V86(options)
{
    if(typeof options.log_level === "number")
    {
        // XXX: Shared between all emulator instances
        set_log_level(options.log_level);
    }

    //var worker = new Worker("src/browser/worker.js");
    //var adapter_bus = this.bus = WorkerBus.init(worker);

    this.cpu_is_running = false;
    this.cpu_exception_hook = function(n) {};

    const bus = Bus.create();
    const adapter_bus = this.bus = bus[0];
    this.emulator_bus = bus[1];

    var cpu;
    var wasm_memory;

    const wasm_table = new WebAssembly.Table({ element: "anyfunc", initial: WASM_TABLE_SIZE + WASM_TABLE_OFFSET });

    const wasm_shared_funcs = {
        "cpu_exception_hook": n => this.cpu_exception_hook(n),
        "run_hardware_timers": function(a, t) { return cpu.run_hardware_timers(a, t); },
        "cpu_event_halt": () => { this.emulator_bus.send("cpu-event-halt"); },
        "abort": function() { dbg_assert(false); },
        "microtick": v86.microtick,
        "get_rand_int": function() { return get_rand_int(); },
        "apic_acknowledge_irq": function() { return cpu.devices.apic.acknowledge_irq(); },
        "stop_idling": function() { return cpu.stop_idling(); },

        "io_port_read8": function(addr) { return cpu.io.port_read8(addr); },
        "io_port_read16": function(addr) { return cpu.io.port_read16(addr); },
        "io_port_read32": function(addr) { return cpu.io.port_read32(addr); },
        "io_port_write8": function(addr, value) { cpu.io.port_write8(addr, value); },
        "io_port_write16": function(addr, value) { cpu.io.port_write16(addr, value); },
        "io_port_write32": function(addr, value) { cpu.io.port_write32(addr, value); },

        "mmap_read8": function(addr) { return cpu.mmap_read8(addr); },
        "mmap_read16": function(addr) { return cpu.mmap_read16(addr); },
        "mmap_read32": function(addr) { return cpu.mmap_read32(addr); },
        "mmap_write8": function(addr, value) { cpu.mmap_write8(addr, value); },
        "mmap_write16": function(addr, value) { cpu.mmap_write16(addr, value); },
        "mmap_write32": function(addr, value) { cpu.mmap_write32(addr, value); },
        "mmap_write64": function(addr, value0, value1) { cpu.mmap_write64(addr, value0, value1); },
        "mmap_write128": function(addr, value0, value1, value2, value3) {
            cpu.mmap_write128(addr, value0, value1, value2, value3);
        },

        "log_from_wasm": function(offset, len) {
            const str = read_sized_string_from_mem(wasm_memory, offset, len);
            dbg_log(str, LOG_CPU);
        },
        "console_log_from_wasm": function(offset, len) {
            const str = read_sized_string_from_mem(wasm_memory, offset, len);
            console.error(str);
        },
        "dbg_trace_from_wasm": function() {
            dbg_trace(LOG_CPU);
        },

        "codegen_finalize": (wasm_table_index, start, state_flags, ptr, len) => {
            cpu.codegen_finalize(wasm_table_index, start, state_flags, ptr, len);
        },
        "jit_clear_func": (wasm_table_index) => cpu.jit_clear_func(wasm_table_index),
        "jit_clear_all_funcs": () => cpu.jit_clear_all_funcs(),

        "__indirect_function_table": wasm_table,
    };

    let wasm_fn = options.wasm_fn;

    if(!wasm_fn)
    {
        wasm_fn = env =>
        {
            /* global __dirname */

            return new Promise(resolve => {
                let v86_bin = DEBUG ? "v86-debug.wasm" : "v86.wasm";
                let v86_bin_fallback = "v86-fallback.wasm";

                if(options.wasm_path)
                {
                    v86_bin = options.wasm_path;
                    v86_bin_fallback = v86_bin.replace("v86.wasm", "v86-fallback.wasm");
                }
                else if(typeof window === "undefined" && typeof __dirname === "string")
                {
                    v86_bin = __dirname + "/" + v86_bin;
                    v86_bin_fallback = __dirname + "/" + v86_bin_fallback;
                }
                else if(false)
                {
                    v86_bin = "build/" + v86_bin;
                    v86_bin_fallback = "build/" + v86_bin_fallback;
                }

                load_file(v86_bin, {
                    done: async bytes =>
                    {
                        try
                        {
                            const { instance } = await WebAssembly.instantiate(bytes, env);
                            this.wasm_source = bytes;
                            resolve(instance.exports);
                        }
                        catch(err)
                        {
                            load_file(v86_bin_fallback, {
                                    done: async bytes => {
                                        const { instance } = await WebAssembly.instantiate(bytes, env);
                                        this.wasm_source = bytes;
                                        resolve(instance.exports);
                                    },
                                });
                        }
                    },
                    progress: e =>
                    {
                        this.emulator_bus.send("download-progress", {
                            file_index: 0,
                            file_count: 1,
                            file_name: v86_bin,

                            lengthComputable: e.lengthComputable,
                            total: e.total,
                            loaded: e.loaded,
                        });
                    }
                });
            });
        };
    }

    wasm_fn({ "env": wasm_shared_funcs })
        .then((exports) => {
            wasm_memory = exports.memory;
            exports["rust_init"]();

            const emulator = this.v86 = new v86(this.emulator_bus, { exports, wasm_table });
            cpu = emulator.cpu;

            this.continue_init(emulator, options);
        });

    this.zstd_worker = null;
    this.zstd_worker_request_id = 0;
}

V86.prototype.continue_init = async function(emulator, options)
{
    this.bus.register("emulator-stopped", function()
    {
        this.cpu_is_running = false;
        this.screen_adapter.pause();
    }, this);

    this.bus.register("emulator-started", function()
    {
        this.cpu_is_running = true;
        this.screen_adapter.continue();
    }, this);

    var settings = {};

    this.disk_images = {
        fda: undefined,
        fdb: undefined,
        hda: undefined,
        hdb: undefined,
        cdrom: undefined,
    };

    const boot_order =
        options.boot_order ? options.boot_order :
        options.fda ? BOOT_ORDER_FD_FIRST :
        options.hda ? BOOT_ORDER_HD_FIRST : BOOT_ORDER_CD_FIRST;

    settings.acpi = options.acpi;
    settings.disable_jit = options.disable_jit;
    settings.load_devices = true;
    settings.memory_size = options.memory_size || 64 * 1024 * 1024;
    settings.vga_memory_size = options.vga_memory_size || 8 * 1024 * 1024;
    settings.boot_order = boot_order;
    settings.fastboot = options.fastboot || false;
    settings.fda = undefined;
    settings.fdb = undefined;
    settings.uart1 = options.uart1;
    settings.uart2 = options.uart2;
    settings.uart3 = options.uart3;
    settings.cmdline = options.cmdline;
    settings.preserve_mac_from_state_image = options.preserve_mac_from_state_image;
    settings.mac_address_translation = options.mac_address_translation;
    settings.cpuid_level = options.cpuid_level;
    settings.virtio_balloon = options.virtio_balloon;
    settings.virtio_console = options.virtio_console;
    settings.virtio_net = options.virtio_net;
    settings.screen_options = options.screen_options;

    const relay_url = options.network_relay_url || options.net_device && options.net_device.relay_url;
    if(relay_url)
    {
        // TODO: remove bus, use direct calls instead
        if(relay_url === "fetch")
        {
            this.network_adapter = new FetchNetworkAdapter(this.bus, options.net_device);
        }
        else if(relay_url === "inbrowser")
        {
            // NOTE: experimental, will change when usage of options.net_device gets refactored in favour of emulator.bus
            this.network_adapter = new InBrowserNetworkAdapter(this.bus, options.net_device);
        }
        else if(relay_url.startsWith("wisp://") || relay_url.startsWith("wisps://"))
        {
            this.network_adapter = new WispNetworkAdapter(relay_url, this.bus, options.net_device);
        }
        else
        {
            this.network_adapter = new NetworkAdapter(relay_url, this.bus);
        }
    }

    // Enable unconditionally, so that state images don't miss hardware
    // TODO: Should be properly fixed in restore_state
    settings.net_device = options.net_device || { type: "ne2k" };

    const screen_options = options.screen || {};
    if(options.screen_container)
    {
        screen_options.container = options.screen_container;
    }

    if(!options.disable_keyboard)
    {
        this.keyboard_adapter = new KeyboardAdapter(this.bus);
    }
    if(!options.disable_mouse)
    {
        this.mouse_adapter = new MouseAdapter(this.bus, screen_options.container);
    }

    if(screen_options.container)
    {
        this.screen_adapter = new ScreenAdapter(screen_options, () => this.v86.cpu.devices.vga && this.v86.cpu.devices.vga.screen_fill_buffer());
    }
    else
    {
        this.screen_adapter = new DummyScreenAdapter();
    }
    settings.screen = this.screen_adapter;
    settings.screen_options = screen_options;

    if(options.serial_container)
    {
        this.serial_adapter = new SerialAdapter(options.serial_container, this.bus);
        //this.recording_adapter = new SerialRecordingAdapter(this.bus);
    }

    if(options.serial_container_xtermjs)
    {
        this.serial_adapter = new SerialAdapterXtermJS(options.serial_container_xtermjs, this.bus);
    }

    if(!options.disable_speaker)
    {
        this.speaker_adapter = new SpeakerAdapter(this.bus);
    }

    // ugly, but required for closure compiler compilation
    function put_on_settings(name, buffer)
    {
        switch(name)
        {
            case "hda":
                settings.hda = this.disk_images.hda = buffer;
                break;
            case "hdb":
                settings.hdb = this.disk_images.hdb = buffer;
                break;
            case "cdrom":
                settings.cdrom = this.disk_images.cdrom = buffer;
                break;
            case "fda":
                settings.fda = this.disk_images.fda = buffer;
                break;
            case "fdb":
                settings.fdb = this.disk_images.fdb = buffer;
                break;

            case "multiboot":
                settings.multiboot = this.disk_images.multiboot = buffer.buffer;
                break;
            case "bzimage":
                settings.bzimage = this.disk_images.bzimage = buffer.buffer;
                break;
            case "initrd":
                settings.initrd = this.disk_images.initrd = buffer.buffer;
                break;

            case "bios":
                settings.bios = buffer.buffer;
                break;
            case "vga_bios":
                settings.vga_bios = buffer.buffer;
                break;
            case "initial_state":
                settings.initial_state = buffer.buffer;
                break;
            case "fs9p_json":
                settings.fs9p_json = buffer;
                break;
            default:
                dbg_assert(false, name);
        }
    }

    var files_to_load = [];

    const add_file = (name, file) =>
    {
        if(!file)
        {
            return;
        }

        if(file.get && file.set && file.load)
        {
            files_to_load.push({
                name: name,
                loadable: file,
            });
            return;
        }

        if(name === "bios" || name === "vga_bios" ||
            name === "initial_state" || name === "multiboot" ||
            name === "bzimage" || name === "initrd")
        {
            // Ignore async for these because they must be available before boot.
            // This should make result.buffer available after the object is loaded
            file.async = false;
        }

        if(name === "fda" || name === "fdb")
        {
            // small, doesn't make sense loading asynchronously
            file.async = false;
        }

        if(file.url && !file.async)
        {
            files_to_load.push({
                name: name,
                url: file.url,
                size: file.size,
            });
        }
        else
        {
            files_to_load.push({
                name,
                loadable: buffer_from_object(file, this.zstd_decompress_worker.bind(this)),
            });
        }
    };

    if(options.state)
    {
        console.warn("Warning: Unknown option 'state'. Did you mean 'initial_state'?");
    }

    add_file("bios", options.bios);
    add_file("vga_bios", options.vga_bios);
    add_file("cdrom", options.cdrom);
    add_file("hda", options.hda);
    add_file("hdb", options.hdb);
    add_file("fda", options.fda);
    add_file("fdb", options.fdb);
    add_file("initial_state", options.initial_state);
    add_file("multiboot", options.multiboot);
    add_file("bzimage", options.bzimage);
    add_file("initrd", options.initrd);

    if(options.filesystem)
    {
        var fs_url = options.filesystem.basefs;
        var base_url = options.filesystem.baseurl;

        let file_storage = new MemoryFileStorage();

        if(base_url)
        {
            file_storage = new ServerFileStorageWrapper(file_storage, base_url);
        }
        settings.fs9p = this.fs9p = new FS(file_storage);

        if(fs_url)
        {
            dbg_assert(base_url, "Filesystem: baseurl must be specified");

            var size;

            if(typeof fs_url === "object")
            {
                size = fs_url.size;
                fs_url = fs_url.url;
            }
            dbg_assert(typeof fs_url === "string");

            files_to_load.push({
                name: "fs9p_json",
                url: fs_url,
                size: size,
                as_json: true,
            });
        }
    }

    var starter = this;
    var total = files_to_load.length;

    var cont = function(index)
    {
        if(index === total)
        {
            setTimeout(done.bind(this), 0);
            return;
        }

        var f = files_to_load[index];

        if(f.loadable)
        {
            f.loadable.onload = function(e)
            {
                put_on_settings.call(this, f.name, f.loadable);
                cont(index + 1);
            }.bind(this);
            f.loadable.load();
        }
        else
        {
            load_file(f.url, {
                done: function(result)
                {
                    if(f.url.endsWith(".zst") && f.name !== "initial_state")
                    {
                        dbg_assert(f.size, "A size must be provided for compressed images");
                        result = this.zstd_decompress(f.size, new Uint8Array(result));
                    }

                    put_on_settings.call(this, f.name, f.as_json ? result : new SyncBuffer(result));
                    cont(index + 1);
                }.bind(this),
                progress: function progress(e)
                {
                    if(e.target.status === 200)
                    {
                        starter.emulator_bus.send("download-progress", {
                            file_index: index,
                            file_count: total,
                            file_name: f.url,

                            lengthComputable: e.lengthComputable,
                            total: e.total || f.size,
                            loaded: e.loaded,
                        });
                    }
                    else
                    {
                        starter.emulator_bus.send("download-error", {
                            file_index: index,
                            file_count: total,
                            file_name: f.url,
                            request: e.target,
                        });
                    }
                },
                as_json: f.as_json,
            });
        }
    }.bind(this);
    cont(0);

    async function done()
    {
        //if(settings.initial_state)
        //{
        //    // avoid large allocation now, memory will be restored later anyway
        //    settings.memory_size = 0;
        //}

        if(settings.fs9p && settings.fs9p_json)
        {
            if(!settings.initial_state)
            {
                settings.fs9p.load_from_json(settings.fs9p_json);

                if(options.bzimage_initrd_from_filesystem)
                {
                    const { bzimage_path, initrd_path } = this.get_bzimage_initrd_from_filesystem(settings.fs9p);

                    dbg_log("Found bzimage: " + bzimage_path + " and initrd: " + initrd_path);

                    const [initrd, bzimage] = await Promise.all([
                        settings.fs9p.read_file(initrd_path),
                        settings.fs9p.read_file(bzimage_path),
                    ]);
                    put_on_settings.call(this, "initrd", new SyncBuffer(initrd.buffer));
                    put_on_settings.call(this, "bzimage", new SyncBuffer(bzimage.buffer));
                }
            }
            else
            {
                dbg_log("Filesystem basefs ignored: Overridden by state image");
            }
        }
        else
        {
            dbg_assert(
                !options.bzimage_initrd_from_filesystem || settings.initial_state,
                "bzimage_initrd_from_filesystem: Requires a filesystem");
        }

        this.serial_adapter && this.serial_adapter.show && this.serial_adapter.show();

        this.v86.init(settings);

        if(settings.initial_state)
        {
            emulator.restore_state(settings.initial_state);

            // The GC can't free settings, since it is referenced from
            // several closures. This isn't needed anymore, so we delete it
            // here
            settings.initial_state = undefined;
        }

        if(options.autostart)
        {
            this.v86.run();
        }

        this.emulator_bus.send("emulator-loaded");
    }
};

/**
 * @param {number} decompressed_size
 * @param {Uint8Array} src
 * @return {ArrayBuffer}
 */
V86.prototype.zstd_decompress = function(decompressed_size, src)
{
    const cpu = this.v86.cpu;

    dbg_assert(!this.zstd_context);
    this.zstd_context = cpu.zstd_create_ctx(src.length);

    new Uint8Array(cpu.wasm_memory.buffer).set(src, cpu.zstd_get_src_ptr(this.zstd_context));

    const ptr = cpu.zstd_read(this.zstd_context, decompressed_size);
    const result = cpu.wasm_memory.buffer.slice(ptr, ptr + decompressed_size);
    cpu.zstd_read_free(ptr, decompressed_size);

    cpu.zstd_free_ctx(this.zstd_context);
    this.zstd_context = null;

    return result;
};

/**
 * @param {number} decompressed_size
 * @param {Uint8Array} src
 * @return {Promise<ArrayBuffer>}
 */
V86.prototype.zstd_decompress_worker = async function(decompressed_size, src)
{
    if(!this.zstd_worker)
    {
        function the_worker()
        {
            let wasm;

            globalThis.onmessage = function(e)
            {
                if(!wasm)
                {
                    const env = Object.fromEntries([
                        "cpu_exception_hook", "run_hardware_timers",
                        "cpu_event_halt", "microtick", "get_rand_int",
                        "apic_acknowledge_irq", "stop_idling",
                        "io_port_read8", "io_port_read16", "io_port_read32",
                        "io_port_write8", "io_port_write16", "io_port_write32",
                        "mmap_read8", "mmap_read16", "mmap_read32",
                        "mmap_write8", "mmap_write16", "mmap_write32", "mmap_write64", "mmap_write128",
                        "codegen_finalize",
                        "jit_clear_func", "jit_clear_all_funcs",
                    ].map(f => [f, () => console.error("zstd worker unexpectedly called " + f)]));

                    env["__indirect_function_table"] = new WebAssembly.Table({ element: "anyfunc", initial: 1024 });
                    env["abort"] = () => { throw new Error("zstd worker aborted"); };
                    env["log_from_wasm"] = env["console_log_from_wasm"] = (off, len) => {
                        console.log(String.fromCharCode(...new Uint8Array(wasm.exports.memory.buffer, off, len)));
                    };
                    env["dbg_trace_from_wasm"] = () => console.trace();

                    wasm = new WebAssembly.Instance(new WebAssembly.Module(e.data), { "env": env });
                    return;
                }

                const { src, decompressed_size, id } = e.data;
                const exports = wasm.exports;

                const zstd_context = exports["zstd_create_ctx"](src.length);
                new Uint8Array(exports.memory.buffer).set(src, exports["zstd_get_src_ptr"](zstd_context));

                const ptr = exports["zstd_read"](zstd_context, decompressed_size);
                const result = exports.memory.buffer.slice(ptr, ptr + decompressed_size);
                exports["zstd_read_free"](ptr, decompressed_size);

                exports["zstd_free_ctx"](zstd_context);

                postMessage({ result, id }, [result]);
            };
        }

        const url = URL.createObjectURL(new Blob(["(" + the_worker.toString() + ")()"], { type: "text/javascript" }));
        this.zstd_worker = new Worker(url);
        URL.revokeObjectURL(url);
        this.zstd_worker.postMessage(this.wasm_source, [this.wasm_source]);
    }

    return new Promise(resolve => {
        const id = this.zstd_worker_request_id++;
        const done = async e =>
        {
            if(e.data.id === id)
            {
                this.zstd_worker.removeEventListener("message", done);
                dbg_assert(decompressed_size === e.data.result.byteLength);
                resolve(e.data.result);
            }
        };
        this.zstd_worker.addEventListener("message", done);
        this.zstd_worker.postMessage({ src, decompressed_size, id }, [src.buffer]);
    });
};

V86.prototype.get_bzimage_initrd_from_filesystem = function(filesystem)
{
    const root = (filesystem.read_dir("/") || []).map(x => "/" + x);
    const boot = (filesystem.read_dir("/boot/") || []).map(x => "/boot/" + x);

    let initrd_path;
    let bzimage_path;

    for(const f of [].concat(root, boot))
    {
        const old = /old/i.test(f) || /fallback/i.test(f);
        const is_bzimage = /vmlinuz/i.test(f) || /bzimage/i.test(f);
        const is_initrd = /initrd/i.test(f) || /initramfs/i.test(f);

        if(is_bzimage && (!bzimage_path || !old))
        {
            bzimage_path = f;
        }

        if(is_initrd && (!initrd_path || !old))
        {
            initrd_path = f;
        }
    }

    if(!initrd_path || !bzimage_path)
    {
        console.log("Failed to find bzimage or initrd in filesystem. Files:");
        console.log(root.join(" "));
        console.log(boot.join(" "));
    }

    return { initrd_path, bzimage_path };
};

/**
 * Start emulation. Do nothing if emulator is running already. Can be
 * asynchronous.
 */
V86.prototype.run = async function()
{
    this.v86.run();
};

/**
 * Stop emulation. Do nothing if emulator is not running. Can be asynchronous.
 */
V86.prototype.stop = async function()
{
    if(!this.cpu_is_running)
    {
        return;
    }

    await new Promise(resolve => {
        const listener = () => {
            this.remove_listener("emulator-stopped", listener);
            resolve();
        };
        this.add_listener("emulator-stopped", listener);
        this.v86.stop();
    });
};

/**
 * @ignore
 */
V86.prototype.destroy = async function()
{
    await this.stop();

    this.v86.destroy();
    this.keyboard_adapter && this.keyboard_adapter.destroy();
    this.network_adapter && this.network_adapter.destroy();
    this.mouse_adapter && this.mouse_adapter.destroy();
    this.screen_adapter && this.screen_adapter.destroy();
    this.serial_adapter && this.serial_adapter.destroy();
    this.speaker_adapter && this.speaker_adapter.destroy();
};

/**
 * Restart (force a reboot).
 */
V86.prototype.restart = function()
{
    this.v86.restart();
};

/**
 * Add an event listener (the emulator is an event emitter). A list of events
 * can be found at [events.md](events.md).
 *
 * The callback function gets a single argument which depends on the event.
 *
 * @param {string} event Name of the event.
 * @param {function(?)} listener The callback function.
 */
V86.prototype.add_listener = function(event, listener)
{
    this.bus.register(event, listener, this);
};

/**
 * Remove an event listener.
 *
 * @param {string} event
 * @param {function(*)} listener
 */
V86.prototype.remove_listener = function(event, listener)
{
    this.bus.unregister(event, listener);
};

/**
 * Restore the emulator state from the given state, which must be an
 * ArrayBuffer returned by
 * [`save_state`](#save_statefunctionobject-arraybuffer-callback).
 *
 * Note that the state can only be restored correctly if this constructor has
 * been created with the same options as the original instance (e.g., same disk
 * images, memory size, etc.).
 *
 * Different versions of the emulator might use a different format for the
 * state buffer.
 *
 * @param {ArrayBuffer} state
 */
V86.prototype.restore_state = async function(state)
{
    dbg_assert(arguments.length === 1);
    this.v86.restore_state(state);
};

/**
 * Asynchronously save the current state of the emulator.
 *
 * @return {Promise<ArrayBuffer>}
 */
V86.prototype.save_state = async function()
{
    dbg_assert(arguments.length === 0);
    return this.v86.save_state();
};

/**
 * @return {number}
 * @ignore
 */
V86.prototype.get_instruction_counter = function()
{
    if(this.v86)
    {
        return this.v86.cpu.instruction_counter[0] >>> 0;
    }
    else
    {
        // TODO: Should be handled using events
        return 0;
    }
};

/**
 * @return {boolean}
 */
V86.prototype.is_running = function()
{
    return this.cpu_is_running;
};

/**
 * Set the image inserted in the floppy drive. Can be changed at runtime, as
 * when physically changing the floppy disk.
 */
V86.prototype.set_fda = async function(file)
{
    if(file.url && !file.async)
    {
        load_file(file.url, {
            done: result =>
            {
                this.v86.cpu.devices.fdc.set_fda(new SyncBuffer(result));
            },
        });
    }
    else
    {
        const image = buffer_from_object(file, this.zstd_decompress_worker.bind(this));
        image.onload = () =>
        {
            this.v86.cpu.devices.fdc.set_fda(image);
        };
        await image.load();
    }
};

/**
 * Eject the floppy drive.
 */
V86.prototype.eject_fda = function()
{
    this.v86.cpu.devices.fdc.eject_fda();
};

/**
 * Send a sequence of scan codes to the emulated PS2 controller. A list of
 * codes can be found at http://stanislavs.org/helppc/make_codes.html.
 * Do nothing if there is no keyboard controller.
 *
 * @param {Array.<number>} codes
 */
V86.prototype.keyboard_send_scancodes = function(codes)
{
    for(var i = 0; i < codes.length; i++)
    {
        this.bus.send("keyboard-code", codes[i]);
    }
};

/**
 * Send translated keys
 * @ignore
 */
V86.prototype.keyboard_send_keys = function(codes)
{
    for(var i = 0; i < codes.length; i++)
    {
        this.keyboard_adapter.simulate_press(codes[i]);
    }
};

/**
 * Send text
 * @ignore
 */
V86.prototype.keyboard_send_text = function(string)
{
    for(var i = 0; i < string.length; i++)
    {
        this.keyboard_adapter.simulate_char(string[i]);
    }
};

/**
 * Download a screenshot.
 *
 * @ignore
 */
V86.prototype.screen_make_screenshot = function()
{
    if(this.screen_adapter)
    {
        return this.screen_adapter.make_screenshot();
    }
    return null;
};

/**
 * Set the scaling level of the emulated screen.
 *
 * @param {number} sx
 * @param {number} sy
 *
 * @ignore
 */
V86.prototype.screen_set_scale = function(sx, sy)
{
    if(this.screen_adapter)
    {
        this.screen_adapter.set_scale(sx, sy);
    }
};

/**
 * Go fullscreen.
 *
 * @ignore
 */
V86.prototype.screen_go_fullscreen = function()
{
    if(!this.screen_adapter)
    {
        return;
    }

    var elem = document.getElementById("screen_container");

    if(!elem)
    {
        return;
    }

    // bracket notation because otherwise they get renamed by closure compiler
    var fn = elem["requestFullScreen"] ||
            elem["webkitRequestFullscreen"] ||
            elem["mozRequestFullScreen"] ||
            elem["msRequestFullScreen"];

    if(fn)
    {
        fn.call(elem);

        // This is necessary, because otherwise chromium keyboard doesn't work anymore.
        // Might (but doesn't seem to) break something else
        var focus_element = document.getElementsByClassName("phone_keyboard")[0];
        focus_element && focus_element.focus();
    }

    try {
        navigator.keyboard.lock();
    } catch(e) {}

    this.lock_mouse();
};

/**
 * Lock the mouse cursor: It becomes invisble and is not moved out of the
 * browser window.
 *
 * @ignore
 */
V86.prototype.lock_mouse = function()
{
    var elem = document.body;

    var fn = elem["requestPointerLock"] ||
                elem["mozRequestPointerLock"] ||
                elem["webkitRequestPointerLock"];

    if(fn)
    {
        fn.call(elem);
    }
};

/**
 * Enable or disable sending mouse events to the emulated PS2 controller.
 *
 * @param {boolean} enabled
 */
V86.prototype.mouse_set_status = function(enabled)
{
    if(this.mouse_adapter)
    {
        this.mouse_adapter.emu_enabled = enabled;
    }
};

/**
 * Enable or disable sending keyboard events to the emulated PS2 controller.
 *
 * @param {boolean} enabled
 */
V86.prototype.keyboard_set_status = function(enabled)
{
    if(this.keyboard_adapter)
    {
        this.keyboard_adapter.emu_enabled = enabled;
    }
};


/**
 * Send a string to the first emulated serial terminal.
 *
 * @param {string} data
 */
V86.prototype.serial0_send = function(data)
{
    for(var i = 0; i < data.length; i++)
    {
        this.bus.send("serial0-input", data.charCodeAt(i));
    }
};

/**
 * Send bytes to a serial port (to be received by the emulated PC).
 *
 * @param {Uint8Array} data
 */
V86.prototype.serial_send_bytes = function(serial, data)
{
    for(var i = 0; i < data.length; i++)
    {
        this.bus.send("serial" + serial + "-input", data[i]);
    }
};

/**
 * Set the modem status of a serial port.
 */
V86.prototype.serial_set_modem_status = function(serial, status)
{
    this.bus.send("serial" + serial + "-modem-status-input", status);
};

/**
 * Set the carrier detect status of a serial port.
 */
V86.prototype.serial_set_carrier_detect = function(serial, status)
{
    this.bus.send("serial" + serial + "-carrier-detect-input", status);
};

/**
 * Set the ring indicator status of a serial port.
 */
V86.prototype.serial_set_ring_indicator = function(serial, status)
{
    this.bus.send("serial" + serial + "-ring-indicator-input", status);
};

/**
 * Set the data set ready status of a serial port.
 */
V86.prototype.serial_set_data_set_ready = function(serial, status)
{
    this.bus.send("serial" + serial + "-data-set-ready-input", status);
};

/**
 * Set the clear to send status of a serial port.
 */
V86.prototype.serial_set_clear_to_send = function(serial, status)
{
    this.bus.send("serial" + serial + "-clear-to-send-input", status);
};

/**
 * Mount another filesystem to the current filesystem.
 * @param {string} path Path for the mount point
 * @param {string|undefined} baseurl
 * @param {string|undefined} basefs As a JSON string
 */
V86.prototype.mount_fs = async function(path, baseurl, basefs)
{
    let file_storage = new MemoryFileStorage();

    if(baseurl)
    {
        file_storage = new ServerFileStorageWrapper(file_storage, baseurl);
    }
    const newfs = new FS(file_storage, this.fs9p.qidcounter);
    if(baseurl)
    {
        dbg_assert(typeof basefs === "object", "Filesystem: basefs must be a JSON object");
        newfs.load_from_json(basefs);
    }

    const idx = this.fs9p.Mount(path, newfs);

    if(idx === -ENOENT)
    {
        throw new FileNotFoundError();
    }
    else if(idx === -EEXIST)
    {
        throw new FileExistsError();
    }
    else if(idx < 0)
    {
        dbg_assert(false, "Unexpected error code: " + (-idx));
        throw new Error("Failed to mount. Error number: " + (-idx));
    }
};

/**
 * Write to a file in the 9p filesystem. Nothing happens if no filesystem has
 * been initialized.
 *
 * @param {string} file
 * @param {Uint8Array} data
 */
V86.prototype.create_file = async function(file, data)
{
    dbg_assert(arguments.length === 2);
    var fs = this.fs9p;

    if(!fs)
    {
        return;
    }

    var parts = file.split("/");
    var filename = parts[parts.length - 1];

    var path_infos = fs.SearchPath(file);
    var parent_id = path_infos.parentid;
    var not_found = filename === "" || parent_id === -1;

    if(!not_found)
    {
        await fs.CreateBinaryFile(filename, parent_id, data);
    }
    else
    {
        return Promise.reject(new FileNotFoundError());
    }
};

/**
 * Read a file in the 9p filesystem. Nothing happens if no filesystem has been
 * initialized.
 *
 * @param {string} file
 */
V86.prototype.read_file = async function(file)
{
    dbg_assert(arguments.length === 1);
    var fs = this.fs9p;

    if(!fs)
    {
        return;
    }

    const result = await fs.read_file(file);

    if(result)
    {
        return result;
    }
    else
    {
        return Promise.reject(new FileNotFoundError());
    }
};

/*
 * @deprecated
 * Use wait_until_vga_screen_contains etc.
 */
V86.prototype.automatically = function(steps)
{
    const run = (steps) =>
    {
        const step = steps[0];

        if(!step)
        {
            return;
        }

        const remaining_steps = steps.slice(1);

        if(step.sleep)
        {
            setTimeout(() => run(remaining_steps), step.sleep * 1000);
            return;
        }

        if(step.vga_text)
        {
            this.wait_until_vga_screen_contains(step.vga_text).then(() => run(remaining_steps));
            return;
        }

        if(step.keyboard_send)
        {
            if(Array.isArray(step.keyboard_send))
            {
                this.keyboard_send_scancodes(step.keyboard_send);
            }
            else
            {
                dbg_assert(typeof step.keyboard_send === "string");
                this.keyboard_send_text(step.keyboard_send);
            }

            run(remaining_steps);
            return;
        }

        if(step.call)
        {
            step.call();
            run(remaining_steps);
            return;
        }

        dbg_assert(false, step);
    };

    run(steps);
};

V86.prototype.wait_until_vga_screen_contains = function(text)
{
    return new Promise(resolve =>
    {
        function test_line(line)
        {
            return typeof text === "string" ? line.includes(text) : text.test(line);
        }

        for(const line of this.screen_adapter.get_text_screen())
        {
            if(test_line(line))
            {
                resolve(true);
                return;
            }
        }

        const changed_rows = new Set();

        function put_char(args)
        {
            const [row, col, char] = args;
            changed_rows.add(row);
        }

        const check = () =>
        {
            for(const row of changed_rows)
            {
                const line = this.screen_adapter.get_text_row(row);
                if(test_line(line))
                {
                    this.remove_listener("screen-put-char", put_char);
                    resolve();
                    return;
                }
            }

            changed_rows.clear();
            setTimeout(check, 100);
        };
        check();

        this.add_listener("screen-put-char", put_char);
    });
};

/**
 * Reads data from memory at specified offset.
 *
 * @param {number} offset
 * @param {number} length
 * @returns
 */
V86.prototype.read_memory = function(offset, length)
{
    return this.v86.cpu.read_blob(offset, length);
};

/**
 * Writes data to memory at specified offset.
 *
 * @param {Array.<number>|Uint8Array} blob
 * @param {number} offset
 */
V86.prototype.write_memory = function(blob, offset)
{
    this.v86.cpu.write_blob(blob, offset);
};

V86.prototype.set_serial_container_xtermjs = function(element)
{
    this.serial_adapter && this.serial_adapter.destroy && this.serial_adapter.destroy();
    this.serial_adapter = new SerialAdapterXtermJS(element, this.bus);
    this.serial_adapter.show();
};

V86.prototype.get_instruction_stats = function()
{
    return print_stats.stats_to_string(this.v86.cpu);
};

/**
 * @ignore
 * @constructor
 *
 * @param {string=} message
 */
function FileExistsError(message)
{
    this.message = message || "File already exists";
}
FileExistsError.prototype = Error.prototype;

/**
 * @ignore
 * @constructor
 *
 * @param {string=} message
 */
function FileNotFoundError(message)
{
    this.message = message || "File not found";
}
FileNotFoundError.prototype = Error.prototype;

/* global module, self */

if(typeof module !== "undefined" && typeof module.exports !== "undefined")
{
    module.exports["V86"] = V86;
}
else if(typeof window !== "undefined")
{
    window["V86"] = V86;
}
else if(typeof importScripts === "function")
{
    // web worker
    self["V86"] = V86;
}


// ---- File: src/browser/main.js ----







const ON_LOCALHOST = !location.hostname.endsWith("copy.sh");

const DEFAULT_NETWORKING_PROXIES = ["wss://relay.widgetry.org/", "ws://localhost:8080/"];
const DEFAULT_MEMORY_SIZE = 128;
const DEFAULT_VGA_MEMORY_SIZE = 8;
const DEFAULT_BOOT_ORDER = 0;

function query_append()
{
    const version = $("version");
    return version ? "?" + version.textContent : "";
}

function set_title(text)
{
    document.title = text + " - v86" +  (DEBUG ? " - debug" : "");
    const description = document.querySelector("meta[name=description]");
    description && (description.content = "Running " + text);
}

function bool_arg(x)
{
    return !!x && x !== "0";
}

function format_timestamp(time)
{
    if(time < 60)
    {
        return time + "s";
    }
    else if(time < 3600)
    {
        return (time / 60 | 0) + "m " + pad0(time % 60, 2) + "s";
    }
    else
    {
        return (time / 3600 | 0) + "h " +
            pad0((time / 60 | 0) % 60, 2) + "m " +
            pad0(time % 60, 2) + "s";
    }
}

let progress_ticks = 0;

function show_progress(e)
{
    const el = $("loading");
    el.style.display = "block";

    if(e.file_name.endsWith(".wasm"))
    {
        const parts = e.file_name.split("/");
        el.textContent = "Fetching " + parts[parts.length - 1] + " ...";
        return;
    }

    if(e.file_index === e.file_count - 1 && e.loaded >= e.total - 2048)
    {
        // last file is (almost) loaded
        el.textContent = "Done downloading. Starting now ...";
        return;
    }

    let line = "Downloading images ";

    if(typeof e.file_index === "number" && e.file_count)
    {
        line += "[" + (e.file_index + 1) + "/" + e.file_count + "] ";
    }

    if(e.total && typeof e.loaded === "number")
    {
        var per100 = Math.floor(e.loaded / e.total * 100);
        per100 = Math.min(100, Math.max(0, per100));

        var per50 = Math.floor(per100 / 2);

        line += per100 + "% [";
        line += "#".repeat(per50);
        line += " ".repeat(50 - per50) + "]";
    }
    else
    {
        line += ".".repeat(progress_ticks++ % 50);
    }

    el.textContent = line;
}

function $(id)
{
    return document.getElementById(id);
}

// These values were previously stored in localStorage
const elements_to_restore = [
    "memory_size",
    "video_memory_size",
    "networking_proxy",
    "disable_audio",
    "enable_acpi",
    "boot_order",
];
for(const item of elements_to_restore)
{
    try
    {
        window.localStorage.removeItem(item);
    }
    catch(e) {}
}

function onload()
{
    if(!window.WebAssembly)
    {
        alert("Your browser is not supported because it doesn't support WebAssembly");
        return;
    }

    $("start_emulation").onclick = function(e)
    {
        start_emulation(null, null);
        $("start_emulation").blur();
        e.preventDefault();
    };

    if(DEBUG)
    {
        debug_onload();
    }

    if(DEBUG && ON_LOCALHOST)
    {
        // don't use online relay in debug mode
        $("relay_url").value = "ws://localhost:8080/";
    }

    const query_args = new URLSearchParams(location.search);
    const host = query_args.get("cdn") || (ON_LOCALHOST ? "images/" : "//i.copy.sh/");

    // Abandonware OS images are from https://winworldpc.com/library/operating-systems
    const oses = [
        {
            id: "archlinux",
            name: "Arch Linux",
            memory_size: 512 * 1024 * 1024,
            vga_memory_size: 8 * 1024 * 1024,
            state: { url: host + "arch_state-v2.bin.zst" },
            filesystem: {
                baseurl: host + "arch/",
            },
            net_device_type: "virtio",
        },
        {
            id: "archlinux-boot",
            name: "Arch Linux",
            memory_size: 512 * 1024 * 1024,
            vga_memory_size: 8 * 1024 * 1024,
            filesystem: {
                baseurl: host + "arch/",
                basefs: { url: host + "fs.json" },
            },
            cmdline: [
                "rw apm=off vga=0x344 video=vesafb:ypan,vremap:8",
                "root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose",
                "mitigations=off audit=0",
                "init_on_free=on",
                "tsc=reliable",
                "random.trust_cpu=on",
                "nowatchdog",
                "init=/usr/bin/init-openrc net.ifnames=0 biosdevname=0",
            ].join(" "),
            bzimage_initrd_from_filesystem: true,
            net_device_type: "virtio",
        },
        {
            id: "copy/skiffos",
            name: "SkiffOS",
            cdrom: {
                url: host + "skiffos/.iso",
                size: 124672000,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            memory_size: 512 * 1024 * 1024,
        },
        {
            id: "serenity",
            name: "SerenityOS",
            hda: {
                url: host + "serenity-v3/.img.zst",
                size: 734003200,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            memory_size: 512 * 1024 * 1024,
            state: { url: host + "serenity_state-v4.bin.zst" },
            homepage: "https://serenityos.org/",
            mac_address_translation: true,
        },
        {
            id: "serenity-boot",
            name: "SerenityOS",
            hda: {
                url: host + "serenity-v3/.img.zst",
                size: 734003200,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            memory_size: 512 * 1024 * 1024,
            homepage: "https://serenityos.org/",
        },
        {
            id: "redox",
            name: "Redox",
            hda: {
                url: host + "redox_demo_i686_2024-09-07_1225_harddrive/.img",
                size: 671088640,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            memory_size: 1024 * 1024 * 1024,
            state: { url: host + "redox_state-v2.bin.zst" },
            homepage: "https://www.redox-os.org/",
            acpi: true,
        },
        {
            id: "redox-boot",
            name: "Redox",
            hda: {
                url: host + "redox_demo_i686_2024-09-07_1225_harddrive/.img",
                size: 671088640,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            memory_size: 1024 * 1024 * 1024,
            homepage: "https://www.redox-os.org/",
            acpi: true,
        },
        {
            id: "helenos",
            memory_size: 256 * 1024 * 1024,
            cdrom: {
                //url: host + "HelenOS-0.11.2-ia32.iso",
                //size: 25765888,
                url: host + "HelenOS-0.14.1-ia32.iso",
                size: 25792512,
                async: false,
            },
            name: "HelenOS",
            homepage: "http://www.helenos.org/",
        },
        {
            id: "fiwix",
            memory_size: 256 * 1024 * 1024,
            hda: {
                url: host + "FiwixOS-3.4-i386/.img",
                size: 1024 * 1024 * 1024,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            name: "FiwixOS",
            homepage: "https://www.fiwix.org/",
        },
        {
            id: "haiku",
            memory_size: 512 * 1024 * 1024,
            hda: {
                url: host + "haiku-v4/.img",
                size: 1 * 1024 * 1024 * 1024,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            state: { url: host + "haiku_state-v4.bin.zst" },
            name: "Haiku",
            homepage: "https://www.haiku-os.org/",
        },
        {
            id: "haiku-boot",
            memory_size: 512 * 1024 * 1024,
            hda: {
                url: host + "haiku-v4/.img",
                size: 1 * 1024 * 1024 * 1024,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            name: "Haiku",
            homepage: "https://www.haiku-os.org/",
        },
        {
            id: "beos",
            memory_size: 512 * 1024 * 1024,
            hda: {
                url: host + "beos5/.img",
                size: 536870912,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            name: "BeOS 5",
        },
        {
            id: "msdos",
            hda: {
                url: host + "msdos622/.img",
                size: 64 * 1024 * 1024,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "MS-DOS 6.22",
        },
        {
            id: "msdos4",
            fda: {
                url: host + "msdos4.img",
                size: 1474560,
            },
            name: "MS-DOS 4",
        },
        {
            id: "freedos",
            fda: {
                url: host + "freedos722.img",
                size: 737280,
            },
            name: "FreeDOS",
        },
        {
            id: "freegem",
            hda: {
                url: host + "freegem/.bin",
                size: 209715200,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "Freedos with FreeGEM",
        },
        {
            id: "xcom",
            fda: {
                url: host + "xcom144.img",
                size: 1440 * 1024,
            },
            name: "Freedos with Xcom",
            homepage: "http://xcom.infora.hu/index.html",
        },
        {
            id: "psychdos",
            hda: {
                url: host + "psychdos/.img",
                size: 549453824,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "PsychDOS",
            homepage: "https://psychoslinux.gitlab.io/DOS/INDEX.HTM",
        },
        {
            id: "86dos",
            fda: {
                url: host + "pc86dos.img",
                size: 163840,
            },
            name: "86-DOS",
            homepage: "https://www.os2museum.com/wp/pc-86-dos/",
        },
        {
            id: "oberon",
            hda: {
                url: host + "oberon.img",
                size: 24 * 1024 * 1024,
                async: false,
            },
            name: "Oberon",
        },
        {
            id: "windows1",
            fda: {
                url: host + "windows101.img",
                size: 1474560,
            },
            name: "Windows 1.01",
        },
        {
            id: "windows2",
            hda: {
                url: host + "windows2.img",
                size: 4177920,
                async: false,
            },
            name: "Windows 2.03",
        },
        {
            id: "linux26",
            cdrom: {
                url: host + "linux.iso",
                size: 6547456,
                async: false,
            },
            name: "Linux",
        },
        {
            id: "linux3",
            cdrom: {
                url: host + "linux3.iso",
                size: 8638464,
                async: false,
            },
            name: "Linux",
        },
        {
            id: "linux4",
            cdrom: {
                url: host + "linux4.iso",
                size: 7731200,
                async: false,
            },
            name: "Linux",
            filesystem: {},
        },
        {
            id: "buildroot",
            bzimage: {
                url: host + "buildroot-bzimage.bin",
                size: 5166352,
                async: false,
            },
            name: "Buildroot Linux",
            filesystem: {},
            cmdline: "tsc=reliable mitigations=off random.trust_cpu=on",
        },
        {
            id: "buildroot6",
            bzimage: {
                url: host + "buildroot-bzimage68.bin",
                size: 10068480,
                async: false,
            },
            name: "Buildroot Linux 6.8",
            filesystem: {},
            cmdline: "tsc=reliable mitigations=off random.trust_cpu=on",
        },
        {
            id: "basiclinux",
            hda: {
                url: host + "bl3-5.img",
                size: 104857600,
                async: false,
            },
            name: "BasicLinux",
        },
        {
            id: "xpud",
            cdrom: {
                url: host + "xpud-0.9.2.iso",
                size: 67108864,
                async: false,
            },
            name: "xPUD",
            memory_size: 256 * 1024 * 1024,
        },
        {
            id: "elks",
            hda: {
                url: host + "elks-hd32-fat.img",
                size: 32514048,
                async: false,
            },
            name: "ELKS",
            homepage: "https://github.com/ghaerr/elks",
        },
        {
            id: "nodeos",
            bzimage: {
                url: host + "nodeos-kernel.bin",
                size: 14452000,
                async: false,
            },
            name: "NodeOS",
            cmdline: "tsc=reliable mitigations=off random.trust_cpu=on",
        },
        {
            id: "dsl",
            memory_size: 256 * 1024 * 1024,
            cdrom: {
                url: host + "dsl-4.11.rc2.iso",
                size: 52824064,
                async: false,
            },
            name: "Damn Small Linux",
            homepage: "http://www.damnsmalllinux.org/",
        },
        {
            id: "xwoaf",
            memory_size: 256 * 1024 * 1024,
            cdrom: {
                url: host + "xwoaf_rebuild4.iso",
                size: 2205696,
                async: false,
            },
            name: "xwoaf",
            homepage: "https://pupngo.dk/xwinflpy/xwoaf_rebuild.html",
        },
        {
            id: "minix",
            name: "Minix",
            memory_size: 256 * 1024 * 1024,
            cdrom: {
                url: host + "minix-3.3.0/.iso",
                size: 605581312,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            homepage: "https://www.minix3.org/",
        },
        {
            id: "unix-v7",
            name: "Unix V7",
            hda: {
                url: host + "unix-v7x86-0.8a/.img",
                size: 152764416,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
        },
        {
            id: "kolibrios",
            fda: {
                url: ON_LOCALHOST ?
                        host + "kolibri.img" :
                        "//builds.kolibrios.org/en_US/data/data/kolibri.img",
                size: 1474560,
            },
            name: "KolibriOS",
            homepage: "https://kolibrios.org/en/",
        },
        {
            id: "kolibrios-fallback",
            fda: {
                url: host + "kolibri.img",
                size: 1474560,
            },
            name: "KolibriOS",
        },
        {
            id: "mu",
            hda: {
                url: host + "mu-shell.img",
                size: 10321920,
                async: false,
            },
            memory_size: 256 * 1024 * 1024,
            name: "Mu",
            homepage: "https://github.com/akkartik/mu",
        },
        {
            id: "openbsd",
            hda: {
                url: host + "openbsd/.img",
                size: 1073741824,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            state: { url: host + "openbsd_state.bin.zst" },
            memory_size: 256 * 1024 * 1024,
            name: "OpenBSD",
        },
        {
            id: "sortix",
            cdrom: {
                url: host + "sortix-1.0-i686.iso",
                size: 71075840,
                async: false,
            },
            memory_size: 512 * 1024 * 1024,
            name: "Sortix",
        },
        {
            id: "openbsd-boot",
            hda: {
                url: host + "openbsd/.img",
                size: 1073741824,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            memory_size: 256 * 1024 * 1024,
            name: "OpenBSD",
            //acpi: true, // doesn't seem to work
        },
        {
            id: "netbsd",
            hda: {
                url: host + "netbsd/.img",
                size: 511000064,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            memory_size: 256 * 1024 * 1024,
            name: "NetBSD",
        },
        {
            id: "crazierl",
            multiboot: {
                url: host + "crazierl-elf.img",
                size: 896592,
                async: false,
            },
            initrd: {
                url: host + "crazierl-initrd.img",
                size: 18448316,
                async: false,
            },
            acpi: true,
            cmdline: "kernel /libexec/ld-elf32.so.1",
            memory_size: 128 * 1024 * 1024,
            name: "Crazierl",
        },
        {
            id: "solos",
            fda: {
                url: host + "os8.img",
                size: 1474560,
            },
            name: "Sol OS",
            homepage: "http://oby.ro/os/",
        },
        {
            id: "bootchess",
            fda: {
                url: host + "bootchess.img",
                size: 1474560,
            },
            name: "BootChess",
            homepage: "http://www.pouet.net/prod.php?which=64962",
        },
        {
            id: "bootbasic",
            fda: {
                url: host + "bootbasic.img",
                size: 512,
            },
            name: "bootBASIC",
            homepage: "https://github.com/nanochess/bootBASIC",
        },
        {
            id: "bootlogo",
            fda: {
                url: host + "bootlogo.img",
                size: 512,
            },
            name: "bootLogo",
            homepage: "https://github.com/nanochess/bootLogo",
        },
        {
            id: "pillman",
            fda: {
                url: host + "pillman.img",
                size: 512,
            },
            name: "Pillman",
            homepage: "https://github.com/nanochess/Pillman",
        },
        {
            id: "invaders",
            fda: {
                url: host + "invaders.img",
                size: 512,
            },
            name: "Invaders",
            homepage: "https://github.com/nanochess/Invaders",
        },
        {
            id: "sectorlisp",
            fda: {
                url: host + "sectorlisp-friendly.bin",
                size: 512,
            },
            name: "SectorLISP",
            homepage: "https://justine.lol/sectorlisp2/",
        },
        {
            id: "sectorforth",
            fda: {
                url: host + "sectorforth.img",
                size: 512,
            },
            name: "sectorforth",
            homepage: "https://github.com/cesarblum/sectorforth",
        },
        {
            id: "floppybird",
            fda: {
                url: host + "floppybird.img",
                size: 1474560,
            },
            name: "Floppy Bird",
            homepage: "http://mihail.co/floppybird",
        },
        {
            id: "stillalive",
            fda: {
                url: host + "stillalive-os.img",
                size: 368640,
            },
            name: "Still Alive",
            homepage: "https://github.com/maniekx86/stillalive-os",
        },
        {
            id: "hello-v86",
            fda: {
                url: host + "hello-v86.img",
                size: 512,
            },
            name: "Hello v86",
        },
        {
            id: "tetros",
            fda: {
                url: host + "tetros.img",
                size: 512,
            },
            name: "TetrOS",
            homepage: "https://github.com/daniel-e/tetros",
        },
        {
            id: "dino",
            fda: {
                url: host + "bootdino.img",
                size: 512,
            },
            name: "dino",
            homepage: "https://github.com/franeklubi/dino",
        },
        {
            id: "bootrogue",
            fda: {
                url: host + "bootrogue.img",
                size: 512,
            },
            name: "bootRogue",
            homepage: "https://github.com/nanochess/bootRogue",
        },
        {
            id: "duskos",
            hda: {
                url: host + "duskos.img",
                async: false,
                size: 8388608,
            },
            name: "Dusk OS",
            homepage: "http://duskos.org/",
        },
        {
            id: "windows2000",
            memory_size: 512 * 1024 * 1024,
            hda: {
                url: host + "windows2k-v2/.img",
                size: 2 * 1024 * 1024 * 1024,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "Windows 2000",
            state: { url: host + "windows2k_state-v3.bin.zst" },
            mac_address_translation: true,
        },
        {
            id: "windows2000-boot",
            memory_size: 512 * 1024 * 1024,
            hda: {
                url: host + "windows2k-v2/.img",
                size: 2 * 1024 * 1024 * 1024,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "Windows 2000",
        },
        {
            id: "windows-me",
            memory_size: 256 * 1024 * 1024,
            hda: {
                url: host + "windowsme-v2/.img",
                size: 834666496,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            state: { url: host + "windows-me_state-v2.bin.zst" },
            name: "Windows ME",
        },
        {
            id: "windowsnt4",
            memory_size: 512 * 1024 * 1024,
            hda: {
                url: host + "winnt4_noacpi/.img",
                size: 523837440,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "Windows NT 4.0",
            cpuid_level: 2,
        },
        {
            id: "windowsnt35",
            memory_size: 256 * 1024 * 1024,
            hda: {
                url: host + "windowsnt351/.img",
                size: 163577856,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "Windows NT 3.51",
        },
        {
            id: "windowsnt3",
            memory_size: 256 * 1024 * 1024,
            hda: {
                url: host + "winnt31/.img",
                size: 87 * 1024 * 1024,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "Windows NT 3.1",
        },
        {
            id: "windows98",
            memory_size: 128 * 1024 * 1024,
            hda: {
                url: host + "windows98/.img",
                size: 300 * 1024 * 1024,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "Windows 98",
            state: { url: host + "windows98_state.bin.zst" },
            mac_address_translation: true,
        },
        {
            id: "windows98-boot",
            memory_size: 128 * 1024 * 1024,
            hda: {
                url: host + "windows98/.img",
                size: 300 * 1024 * 1024,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "Windows 98",
        },
        {
            id: "windows95",
            memory_size: 64 * 1024 * 1024,
            // old image:
            //memory_size: 32 * 1024 * 1024,
            //hda: {
            //    url: host + "w95/.img",
            //    size: 242049024,
            //    async: true,
            //    fixed_chunk_size: 256 * 1024,
            //    use_parts: true,
            //},
            //state: { url: host + "windows95_state.bin.zst" },
            hda: {
                url: host + "windows95-v2/.img",
                size: 471859200,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "Windows 95",
        },
        {
            id: "windows95-boot",
            memory_size: 64 * 1024 * 1024,
            hda: {
                url: host + "windows95-v2/.img",
                size: 471859200,
                async: true,
                fixed_chunk_size: 256 * 1024,
                use_parts: true,
            },
            name: "Windows 95",
        },
        {
            id: "windows30",
            memory_size: 64 * 1024 * 1024,
            cdrom: {
                url: host + "Win30.iso",
                size: 7774208,
                async: false,
            },
            name: "Windows 3.0",
        },
        {
            id: "windows31",
            memory_size: 64 * 1024 * 1024,
            hda: {
                url: host + "win31.img",
                async: false,
                size: 34463744,
            },
            name: "Windows 3.1",
        },
        {
            id: "tilck",
            memory_size: 128 * 1024 * 1024,
            hda: {
                url: host + "tilck.img",
                async: false,
                size: 37748736,
            },
            name: "Tilck",
            homepage: "https://github.com/vvaltchev/tilck",
        },
        {
            id: "littlekernel",
            multiboot: {
                url: host + "littlekernel-multiboot.img",
                async: false,
                size: 969580,
            },
            name: "Little Kernel",
            homepage: "https://github.com/littlekernel/lk",
        },
        {
            id: "sanos",
            memory_size: 128 * 1024 * 1024,
            hda: {
                url: host + "sanos-flp.img",
                async: false,
                size: 1474560,
            },
            name: "Sanos",
            homepage: "http://www.jbox.dk/sanos/",
        },
        {
            id: "freebsd",
            memory_size: 256 * 1024 * 1024,
            hda: {
                url: host + "freebsd/.img",
                size: 2147483648,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            state: { url: host + "freebsd_state.bin.zst" },
            name: "FreeBSD",
        },
        {
            id: "freebsd-boot",
            memory_size: 256 * 1024 * 1024,
            hda: {
                url: host + "freebsd/.img",
                size: 2147483648,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            name: "FreeBSD",
        },
        {
            id: "reactos",
            memory_size: 512 * 1024 * 1024,
            hda: {
                url: host + "reactos-v2/.img",
                size: 681574400,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            state: { url: host + "reactos_state-v2.bin.zst" },
            mac_address_translation: true,
            name: "ReactOS",
            acpi: true,
            homepage: "https://reactos.org/",
        },
        {
            id: "reactos-boot",
            memory_size: 512 * 1024 * 1024,
            hda: {
                url: host + "reactos-v2/.img",
                size: 681574400,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            name: "ReactOS",
            acpi: true,
            homepage: "https://reactos.org/",
        },
        {
            id: "skift",
            cdrom: {
                url: host + "skift-20200910.iso",
                size: 64452608,
                async: false,
            },
            name: "Skift",
            homepage: "https://skiftos.org/",
        },
        {
            id: "snowdrop",
            fda: {
                url: host + "snowdrop.img",
                size: 1440 * 1024,
            },
            name: "Snowdrop",
            homepage: "http://www.sebastianmihai.com/snowdrop/",
        },
        {
            id: "openwrt",
            hda: {
                url: host + "openwrt-18.06.1-x86-legacy-combined-squashfs.img",
                size: 19846474,
                async: false,
            },
            name: "OpenWrt",
        },
        {
            id: "qnx",
            fda: {
                url: host + "qnx-demo-network-4.05.img",
                size: 1474560,
            },
            name: "QNX 4.05",
        },
        {
            id: "9front",
            memory_size: 128 * 1024 * 1024,
            hda: {
                url: host + "9front-10931.386/.iso",
                size: 489453568,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            state: { url: host + "9front_state-v3.bin.zst" },
            acpi: true,
            name: "9front",
            homepage: "https://9front.org/",
        },
        {
            id: "9front-boot",
            memory_size: 128 * 1024 * 1024,
            hda: {
                url: host + "9front-10931.386/.iso",
                size: 489453568,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            acpi: true,
            name: "9front",
            homepage: "https://9front.org/",
        },
        {
            id: "9legacy",
            memory_size: 512 * 1024 * 1024,
            hda: {
                url: host + "9legacy.img",
                async: false,
                size: 16000000,
            },
            name: "9legacy",
            homepage: "http://www.9legacy.org/",
            //net_device_type: "none",
        },
        {
            id: "mobius",
            fda: {
                url: host + "mobius-fd-release5.img",
                size: 1474560,
            },
            name: "Mobius",
        },
        {
            id: "android",
            memory_size: 512 * 1024 * 1024,
            cdrom: {
                url: host + "android-x86-1.6-r2/.iso",
                size: 54661120,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            name: "Android",
        },
        {
            id: "android4",
            memory_size: 512 * 1024 * 1024,
            cdrom: {
                url: host + "android_x86_nonsse3_4.4r1_20140904/.iso",
                size: 247463936,
                async: true,
                fixed_chunk_size: 1024 * 1024,
                use_parts: true,
            },
            name: "Android 4",
        },
        {
            id: "tinycore",
            memory_size: 256 * 1024 * 1024,
            hda: {
                url: host + "TinyCore-11.0.iso",
                size: 19922944,
                async: false,
            },
            name: "Tinycore",
            homepage: "http://www.tinycorelinux.net/",
        },
        {
            id: "slitaz",
            memory_size: 512 * 1024 * 1024,
            hda: {
                url: host + "slitaz-rolling-2024.iso",
                size: 56573952,
                async: false,
            },
            name: "SliTaz",
            homepage: "https://slitaz.org/",
        },
        {
            id: "freenos",
            memory_size: 256 * 1024 * 1024,
            cdrom: {
                url: host + "FreeNOS-1.0.3.iso",
                async: false,
                size: 11014144,
            },
            name: "FreeNOS",
            acpi: true,
            homepage: "http://www.freenos.org/",
        },
        {
            id: "syllable",
            memory_size: 512 * 1024 * 1024,
            hda: {
                url: host + "syllable-destop-0.6.7/.img",
                async: true,
                size: 500 * 1024 * 1024,
                fixed_chunk_size: 512 * 1024,
                use_parts: true,
            },
            name: "Syllable",
            homepage: "http://syllable.metaproject.frl/",
        },
        {
            id: "toaruos",
            memory_size: 512 * 1024 * 1024,
            cdrom: {
                url: host + "toaruos-1.6.1-core.iso",
                size: 67567616,
                async: false,
            },
            name: "ToaruOS",
            acpi: true,
            homepage: "https://toaruos.org/",
        },
        {
            id: "nopeos",
            cdrom: {
                url: host + "nopeos-0.1.iso",
                size: 532480,
                async: false,
            },
            name: "Nope OS",
            homepage: "https://github.com/d99kris/nopeos",
        },
        {
            id: "soso",
            cdrom: {
                url: host + "soso.iso",
                size: 22546432,
                async: false,
            },
            name: "Soso",
            homepage: "https://github.com/ozkl/soso",
        },
        {
            id: "pcmos",
            fda: {
                url: host + "PCMOS386-9-user-patched.img",
                size: 1440 * 1024,
            },
            name: "PC-MOS/386",
            homepage: "https://github.com/roelandjansen/pcmos386v501",
        },
        {
            id: "jx",
            fda: {
                url: host + "jx-demo.img",
                size: 1440 * 1024,
            },
            name: "JX",
            homepage: "https://www4.cs.fau.de/Projects/JX/index.html",
        },
        {
            id: "house",
            fda: {
                url: host + "hOp-0.8.img",
                size: 1440 * 1024,
            },
            name: "House",
            homepage: "https://programatica.cs.pdx.edu/House/",
        },
        {
            id: "bleskos",
            name: "BleskOS",
            cdrom: {
                url: host + "bleskos_2024u32.iso",
                size: 1835008,
                async: false,
            },
            homepage: "https://github.com/VendelinSlezak/BleskOS",
        },
        {
            id: "boneos",
            name: "BoneOS",
            cdrom: {
                url: host + "BoneOS.iso",
                size: 11429888,
                async: false,
            },
            homepage: "https://amanuel.io/projects/BoneOS/",
        },
        {
            id: "mikeos",
            name: "MikeOS",
            cdrom: {
                url: host + "mikeos.iso",
                size: 3311616,
                async: false,
            },
            homepage: "https://mikeos.sourceforge.net/",
        },
        {
            id: "bluejay",
            name: "Blue Jay",
            fda: {
                url: host + "bj050.img",
                size: 1474560,
            },
            homepage: "https://archiveos.org/blue-jay/",
        },
        {
            id: "t3xforth",
            name: "T3XFORTH",
            fda: {
                url: host + "t3xforth.img",
                size: 1474560,
            },
            homepage: "https://t3x.org/t3xforth/",
        },
        {
            id: "nanoshell",
            name: "NanoShell",
            cdrom: {
                url: host + "nanoshell.iso",
                size: 6785024,
                async: false,
            },
            homepage: "https://github.com/iProgramMC/NanoShellOS",
        },
        {
            id: "catk",
            name: "CatK",
            cdrom: {
                url: host + "catkernel.iso",
                size: 11968512,
                async: false,
            },
            homepage: "https://catk.neocities.org/",
        },
        {
            id: "mcp",
            name: "M/CP",
            fda: {
                url: host + "mcp2.img",
                size: 512,
            },
            homepage: "https://github.com/ybuzoku/MCP",
        },
        {
            id: "ibm-exploring",
            name: "Exploring The IBM Personal Computer",
            fda: {
                url: host + "ibm-exploring.img",
                size: 368640,
            },
        },
        {
            id: "leetos",
            name: "lEEt/OS",
            fda: {
                url: host + "leetos.img",
                size: 1474560,
            },
            homepage: "http://sininenankka.dy.fi/leetos/index.php",
        },
        {
            id: "newos",
            name: "NewOS",
            fda: {
                url: host + "newos-flp.img",
                size: 1474560,
                async: false,
            },
            homepage: "https://newos.org/",
        },
        {
            id: "aros-broadway",
            name: "AROS Broadway",
            memory_size: 512 * 1024 * 1024,
            cdrom: {
                url: host + "broadway10/.iso",
                size: 742051840,
                async: true,
                fixed_chunk_size: 512 * 1024,
                use_parts: true,
            },
            homepage: "https://web.archive.org/web/20231109224346/http://www.aros-broadway.de/",
        },
        {
            id: "icaros",
            name: "Icaros Desktop",
            memory_size: 512 * 1024 * 1024,
            cdrom: {
                url: host + "icaros-pc-i386-2.3/.iso",
                size: 726511616,
                async: true,
                // NOTE: needs 136MB/287 requests to boot, maybe state image or zst parts?
                fixed_chunk_size: 512 * 1024,
                use_parts: true,
            },
            homepage: "http://vmwaros.blogspot.com/",
        },
        {
            id: "tinyaros",
            name: "Tiny Aros",
            memory_size: 512 * 1024 * 1024,
            cdrom: {
                url: host + "tinyaros-pc-i386/.iso",
                size: 111175680,
                async: true,
                fixed_chunk_size: 512 * 1024,
                use_parts: true,
            },
            homepage: "https://www.tinyaros.it/",
        },
        {
            id: "dancy",
            name: "Dancy",
            cdrom: {
                url: host + "dancy.iso",
                size: 10485760,
                async: false,
            },
            homepage: "https://github.com/Tiihala/Dancy",
        },
        {
            id: "curios",
            name: "CuriOS",
            hda: {
                url: host + "curios.img",
                size: 83886080,
                async: false,
            },
            homepage: "https://github.com/h5n1xp/CuriOS",
        },
        {
            id: "os64",
            name: "OS64",
            cdrom: {
                url: host + "os64boot.iso",
                size: 5580800,
                async: false,
            },
            homepage: "https://os64.blogspot.com/",
        },
        {
            id: "ipxe",
            name: "iPXE",
            cdrom: {
                url: host + "ipxe.iso",
                size: 4194304,
                async: false,
            },
            homepage: "https://ipxe.org/",
        },
        {
            id: "netboot.xyz",
            name: "iPXE",
            cdrom: {
                url: host + "netboot.xyz.iso",
                size: 2398208,
                async: false,
            },
            homepage: "https://netboot.xyz/",
            net_device_type: "virtio",
        },
    ];

    if(DEBUG)
    {
        // see tests/kvm-unit-tests/x86/
        const tests = [
            "realmode",
            // All tests below require an APIC
            "cmpxchg8b",
            "port80",
            "setjmp",
            "sieve",
            "hypercall", // crashes
            "init", // stops execution
            "msr", // TODO: Expects 64 bit msrs
            "smap", // test stops, SMAP not enabled
            "tsc_adjust", // TODO: IA32_TSC_ADJUST
            "tsc", // TODO: rdtscp
            "rmap_chain", // crashes
            "memory", // missing mfence (uninteresting)
            "taskswitch", // TODO: Jump
            "taskswitch2", // TODO: Call TSS
            "eventinj", // Missing #nt
            "ioapic",
            "apic",
        ];

        for(const test of tests)
        {
            oses.push({
                name: "Test case: " + test,
                id: "test-" + test,
                memory_size: 128 * 1024 * 1024,
                multiboot: { url: "tests/kvm-unit-tests/x86/" + test + ".flat" }
            });
        }
    }

    const profile = query_args.get("profile");

    if(!profile && !DEBUG)
    {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = "build/v86.wasm" + query_append();
        document.head.appendChild(link);
    }

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = "build/xterm.js";
    document.head.appendChild(link);

    for(const os of oses)
    {
        if(profile === os.id)
        {
            start_emulation(os, query_args);
            return;
        }

        const element = $("start_" + os.id);

        if(element)
        {
            element.onclick = e =>
            {
                if(!e.ctrlKey)
                {
                    e.preventDefault();
                    element.blur();
                    start_emulation(os, null);
                }
            };
        }
    }

    if(profile === "custom")
    {
        // TODO: if one of the file form fields has a value (firefox), start here?

        if(query_args.has("hda.url") || query_args.has("cdrom.url") || query_args.has("fda.url"))
        {
            start_emulation(null, query_args);
        }
        else
        {
            if(query_args.has("m")) $("memory_size").value = query_args.get("m");
            if(query_args.has("vram")) $("vga_memory_size").value = query_args.get("vram");
            if(query_args.has("relay_url")) $("relay_url").value = query_args.get("relay_url");
            if(query_args.has("mute")) $("disable_audio").checked = bool_arg(query_args.get("mute"));
            if(query_args.has("acpi")) $("acpi").checked = bool_arg(query_args.get("acpi"));
            if(query_args.has("boot_order")) $("boot_order").value = query_args.get("boot_order");
        }
    }
    else if(/^[a-zA-Z0-9\-_]+\/[a-zA-Z0-9\-_]+$/g.test(profile))
    {
        // experimental: server that allows user-uploaded images

        const base = "https://v86-user-images.b-cdn.net/" + profile;

        fetch(base + "/profile.json")
            .catch(e => alert("Profile not found: " + profile))
            .then(response => response.json())
            .then(p => {
                function handle_image(o)
                {
                    return o && { url: base + "/" + o["url"], async: o["async"], size: o["size"] };
                }

                const profile = {
                    id: p["id"],
                    name: p["name"],
                    memory_size: p["memory_size"],
                    vga_memory_size: p["vga_memory_size"],
                    acpi: p["acpi"],
                    boot_order: p["boot_order"],
                    hda: handle_image(p["hda"]),
                    cdrom: handle_image(p["cdrom"]),
                    fda: handle_image(p["fda"]),
                    multiboot: handle_image(p["multiboot"]),
                    bzimage: handle_image(p["bzimage"]),
                    initrd: handle_image(p["initrd"]),
                };

                start_emulation(profile, query_args);
            });
    }

    const os_info = Array.from(document.querySelectorAll("#oses tbody tr")).map(element =>
    {
        const [_, size_raw, unit] = element.children[1].textContent.match(/([\d\.]+)\+? (\w+)/);
        let size = +size_raw;
        if(unit === "MB") size *= 1024 * 1024;
        else if(unit === "KB") size *= 1024;
        return {
            element,
            size,
            graphical: element.children[2].firstChild.className === "gui_icon",
            family: element.children[3].textContent.replace(/-like/, ""),
            arch: element.children[4].textContent,
            status: element.children[5].textContent,
            source: element.children[6].textContent,
            languages: new Set(element.children[7].textContent.split(", ")),
            medium: element.children[8].textContent,
        };
    });

    const known_filter = [
        [   // Family:
            { id: "linux", condition: os => os.family === "Linux" },
            { id: "bsd", condition: os => os.family === "BSD" },
            { id: "windows", condition: os => os.family === "Windows" },
            { id: "unix", condition: os => os.family === "Unix" },
            { id: "dos", condition: os => os.family === "DOS" },
            { id: "custom", condition: os => os.family === "Custom" },
        ],
        [   // UI:
            { id: "graphical", condition: os => os.graphical },
            { id: "text", condition: os => !os.graphical },
        ],
        [   // Medium:
            { id: "floppy", condition: os => os.medium === "Floppy" },
            { id: "cd", condition: os => os.medium === "CD" },
            { id: "hd", condition: os => os.medium === "HD" },
        ],
        [   // Size:
            { id: "bootsector", condition: os => os.size <= 512 },
            { id: "lt5mb", condition: os => os.size <= 5 * 1024 * 1024 },
            { id: "gt5mb", condition: os => os.size > 5 * 1024 * 1024 },
        ],
        [   // Status:
            { id: "modern", condition: os => os.status === "Modern" },
            { id: "historic", condition: os => os.status === "Historic" },
        ],
        [   // License:
            { id: "opensource", condition: os => os.source === "Open-source" },
            { id: "proprietary", condition: os => os.source === "Proprietary" },
        ],
        [   // Arch:
            { id: "16bit", condition: os => os.arch === "16-bit" },
            { id: "32bit", condition: os => os.arch === "32-bit" },
        ],
        [   // Lang:
            { id: "asm", condition: os => os.languages.has("ASM") },
            { id: "c", condition: os => os.languages.has("C") },
            { id: "cpp", condition: os => os.languages.has("C++") },
            { id: "other_lang", condition: os => ["ASM", "C", "C++"].every(lang => !os.languages.has(lang)) },
        ],
    ];

    const defined_filter = [];
    for(const known_category of known_filter)
    {
        const category = known_category.filter(filter => {
            const element = document.getElementById(`filter_${filter.id}`);
            if(element)
            {
                element.onchange = update_filters;
                filter.element = element;
            }
            return element;
        });
        if(category.length)
        {
            defined_filter.push(category);
        }
    }

    function update_filters()
    {
        const conjunction = [];
        for(const category of defined_filter)
        {
            const disjunction = category.filter(filter => filter.element.checked);
            if(disjunction.length)
            {
                conjunction.push(disjunction);
            }
        }
        for(const os of os_info)
        {
            os.element.style.display = conjunction.every(disjunction => disjunction.some(filter => filter.condition(os))) ? "" : "none";
        }
    }

    function set_proxy_value(id, value)
    {
        const elem = $(id);
        if(elem)
        {
            elem.onclick = () => $("relay_url").value = value;
        }
    }
    set_proxy_value("network_none", "");
    set_proxy_value("network_inbrowser", "inbrowser");
    set_proxy_value("network_fetch", "fetch");
    set_proxy_value("network_relay", "wss://relay.widgetry.org/");
    set_proxy_value("network_wisp", "wisps://wisp.mercurywork.shop/v86/");
}

function debug_onload()
{
    // called on window.onload, in debug mode

    const log_levels = $("log_levels");

    if(!log_levels)
    {
        return;
    }

    for(let i = 0; i < LOG_NAMES.length; i++)
    {
        const mask = LOG_NAMES[i][0];

        if(mask === 1)
            continue;

        const name = LOG_NAMES[i][1].toLowerCase();
        const input = document.createElement("input");
        const label = document.createElement("label");

        input.type = "checkbox";

        label.htmlFor = input.id = "log_" + name;

        if(LOG_LEVEL & mask)
        {
            input.checked = true;
        }
        input.mask = mask;

        label.append(input, pads(name, 4) + " ");
        log_levels.appendChild(label);

        if(i === Math.floor(LOG_NAMES.length / 2))
        {
            log_levels.append("\n");
        }
    }

    log_levels.onchange = function(e)
    {
        const target = e.target;
        const mask = target.mask;

        if(target.checked)
        {
            set_log_level(LOG_LEVEL | mask);
        }
        else
        {
            set_log_level(LOG_LEVEL & ~mask);
        }

        target.blur();
    };
}

window.addEventListener("load", onload, false);

// old webkit fires popstate on every load, fuck webkit
// https://code.google.com/p/chromium/issues/detail?id=63040
window.addEventListener("load", function()
{
    setTimeout(function()
    {
        window.addEventListener("popstate", onpopstate);
    }, 0);
});

// works in firefox and chromium
if(document.readyState === "complete")
{
    onload();
}

// we can get here in various ways:
// - the user clicked on the "start emulation"
// - the user clicked on a profile
// - the ?profile= query parameter specified a valid profile
// - the ?profile= query parameter was set to "custom" and at least one disk image was given
function start_emulation(profile, query_args)
{
    $("boot_options").style.display = "none";

    const new_query_args = new Map();
    new_query_args.set("profile", profile?.id || "custom");

    const settings = {};

    if(profile)
    {
        if(profile.state)
        {
            $("reset").style.display = "none";
        }

        set_title(profile.name);

        settings.initial_state = profile.state;
        settings.filesystem = profile.filesystem;
        settings.fda = profile.fda;
        settings.cdrom = profile.cdrom;
        settings.hda = profile.hda;
        settings.multiboot = profile.multiboot;
        settings.bzimage = profile.bzimage;
        settings.initrd = profile.initrd;
        settings.cmdline = profile.cmdline;
        settings.bzimage_initrd_from_filesystem = profile.bzimage_initrd_from_filesystem;
        settings.mac_address_translation = profile.mac_address_translation;
        settings.cpuid_level = profile.cpuid_level;
        settings.acpi = profile.acpi;
        settings.memory_size = profile.memory_size;
        settings.vga_memory_size = profile.vga_memory_size;
        settings.boot_order = profile.boot_order;
        settings.net_device_type = profile.net_device_type;

        if(!DEBUG && profile.homepage)
        {
            $("description").style.display = "block";
            const link = document.createElement("a");
            link.href = profile.homepage;
            link.textContent = profile.name;
            link.target = "_blank";
            $("description").append(document.createTextNode("Running "), link);
        }
    }

    if(query_args)
    {
        // ignore certain settings when using a state image
        if(!settings.initial_state)
        {
            let chunk_size = parseInt(query_args.get("chunk_size"), 10);
            if(chunk_size >= 0)
            {
                chunk_size = Math.min(4 * 1024 * 1024, Math.max(512, chunk_size));
                chunk_size = round_up_to_next_power_of_2(chunk_size);
            }
            else
            {
                chunk_size = 256 * 1024;
            }

            if(query_args.has("hda.url"))
            {
                settings.hda = {
                    size: parseInt(query_args.get("hda.size"), 10) || undefined,
                    // TODO: synchronous if small?
                    url: query_args.get("hda.url"),
                    fixed_chunk_size: chunk_size,
                    async: true,
                };
            }

            if(query_args.has("cdrom.url"))
            {
                settings.cdrom = {
                    size: parseInt(query_args.get("cdrom.size"), 10) || undefined,
                    url: query_args.get("cdrom.url"),
                    fixed_chunk_size: chunk_size,
                    async: true,
                };
            }

            if(query_args.has("fda.url"))
            {
                settings.fda = {
                    size: parseInt(query_args.get("fda.size"), 10) || undefined,
                    url: query_args.get("fda.url"),
                    async: false,
                };
            }

            const m = parseInt(query_args.get("m"), 10);
            if(m > 0)
            {
                settings.memory_size = Math.max(16, m) * 1024 * 1024;
            }

            const vram = parseInt(query_args.get("vram"), 10);
            if(vram > 0)
            {
                settings.vga_memory_size = vram * 1024 * 1024;
            }

            settings.acpi = query_args.has("acpi") ? bool_arg(query_args.get("acpi")) : settings.acpi;
            settings.use_bochs_bios = query_args.get("bios") === "bochs";
            settings.net_device_type = query_args.get("net_device_type") || settings.net_device_type;
        }

        settings.relay_url = query_args.get("relay_url");
        settings.disable_jit = bool_arg(query_args.get("disable_jit"));
        settings.disable_audio = bool_arg(query_args.get("mute"));
    }

    if(!settings.relay_url)
    {
        settings.relay_url = $("relay_url").value;
        if(!DEFAULT_NETWORKING_PROXIES.includes(settings.relay_url)) new_query_args.set("relay_url", settings.relay_url);
    }
    if(settings.relay_url.startsWith("fetch:"))
    {
        settings.cors_proxy = settings.relay_url.slice(6);
        settings.relay_url = "fetch";
    }
    settings.disable_audio = $("disable_audio").checked || settings.disable_audio;
    if(settings.disable_audio) new_query_args.set("mute", "1");

    // some settings cannot be overridden when a state image is used
    if(!settings.initial_state)
    {
        const bios = $("bios").files[0];
        if(bios)
        {
            settings.bios = { buffer: bios };
        }
        const vga_bios = $("vga_bios").files[0];
        if(vga_bios)
        {
            settings.vga_bios = { buffer: vga_bios };
        }
        const fda = $("floppy_image").files[0];
        if(fda)
        {
            settings.fda = { buffer: fda };
        }
        const cdrom = $("cdrom_image").files[0];
        if(cdrom)
        {
            settings.cdrom = { buffer: cdrom };
        }
        const hda = $("hda_image").files[0];
        if(hda)
        {
            settings.hda = { buffer: hda };
        }
        const hdb = $("hdb_image")?.files[0];
        if(hdb)
        {
            settings.hdb = { buffer: hdb };
        }
        const multiboot = $("multiboot_image")?.files[0];
        if(multiboot)
        {
            settings.multiboot = { buffer: multiboot };
        }
        const bzimage = $("bzimage").files[0];
        if(bzimage)
        {
            settings.bzimage = { buffer: bzimage };
        }
        const initrd = $("initrd").files[0];
        if(initrd)
        {
            settings.initrd = { buffer: initrd };
        }

        const title = multiboot?.name || hda?.name || cdrom?.name || hdb?.name || fda?.name || bios?.name;
        if(title)
        {
            set_title(title);
        }

        const MB = 1024 * 1024;

        const memory_size = parseInt($("memory_size").value, 10) || DEFAULT_MEMORY_SIZE;
        if(!settings.memory_size || memory_size !== DEFAULT_MEMORY_SIZE)
        {
            settings.memory_size = memory_size * MB;
        }
        if(memory_size !== DEFAULT_MEMORY_SIZE) new_query_args.set("m", String(memory_size));

        const vga_memory_size = parseInt($("vga_memory_size").value, 10) || DEFAULT_VGA_MEMORY_SIZE;
        if(!settings.vga_memory_size || vga_memory_size !== DEFAULT_VGA_MEMORY_SIZE)
        {
            settings.vga_memory_size = vga_memory_size * MB;
        }
        if(vga_memory_size !== DEFAULT_VGA_MEMORY_SIZE) new_query_args.set("vram", String(vga_memory_size));

        const boot_order = parseInt($("boot_order").value, 16) || DEFAULT_BOOT_ORDER;
        if(!settings.boot_order || boot_order !== DEFAULT_BOOT_ORDER)
        {
            settings.boot_order = boot_order;
        }
        if(settings.boot_order !== DEFAULT_BOOT_ORDER) new_query_args.set("boot_order", String(settings.boot_order));

        if(settings.acpi === undefined)
        {
            settings.acpi = $("acpi").checked;
            if(settings.acpi) new_query_args.set("acpi", "1");
        }

        const BIOSPATH = "bios/";

        if(!settings.bios)
        {
            settings.bios = { url: BIOSPATH + (DEBUG ? "seabios-debug.bin" : "seabios.bin") };
        }
        if(!settings.vga_bios)
        {
            settings.vga_bios = { url: BIOSPATH + (DEBUG ? "vgabios-debug.bin" : "vgabios.bin") };
        }
        if(settings.use_bochs_bios)
        {
            settings.bios = { url: BIOSPATH + "bochs-bios.bin" };
            settings.vga_bios = { url: BIOSPATH + "bochs-vgabios.bin" };
        }
    }

    if(!query_args)
    {
        push_state(new_query_args);
    }

    const emulator = new V86({
        wasm_path: "build/" + (DEBUG ? "v86-debug.wasm" : "v86.wasm") + query_append(),
        screen: {
            container: $("screen_container"),
            use_graphical_text: false,
        },
        net_device: {
            type: settings.net_device_type || "ne2k",
            relay_url: settings.relay_url,
            cors_proxy: settings.cors_proxy
        },
        autostart: true,

        memory_size: settings.memory_size,
        vga_memory_size: settings.vga_memory_size,
        boot_order: settings.boot_order,

        bios: settings.bios,
        vga_bios: settings.vga_bios,
        fda: settings.fda,
        hda: settings.hda,
        hdb: settings.hdb,
        cdrom: settings.cdrom,
        multiboot: settings.multiboot,
        bzimage: settings.bzimage,
        initrd: settings.initrd,

        cmdline: settings.cmdline,
        bzimage_initrd_from_filesystem: settings.bzimage_initrd_from_filesystem,
        acpi: settings.acpi,
        disable_jit: settings.disable_jit,
        initial_state: settings.initial_state,
        filesystem: settings.filesystem || {},
        disable_speaker: settings.disable_audio,
        mac_address_translation: settings.mac_address_translation,
        cpuid_level: settings.cpuid_level,
    });

    if(DEBUG) window.emulator = emulator;

    emulator.add_listener("emulator-ready", function()
    {
        if(DEBUG)
        {
            debug_start(emulator);
        }

        if(emulator.v86.cpu.wm.exports["profiler_is_enabled"]())
        {
            const CLEAR_STATS = false;

            const panel = document.createElement("pre");
            document.body.appendChild(panel);

            setInterval(function()
                {
                    if(!emulator.is_running())
                    {
                        return;
                    }

                    panel.textContent = emulator.get_instruction_stats();

                    CLEAR_STATS && emulator.v86.cpu.clear_opstats();
                }, CLEAR_STATS ? 5000 : 1000);
        }

        if(["dsl", "helenos", "android", "android4", "redox", "beos", "9legacy"].includes(profile?.id))
        {
            setTimeout(() => {
                // hack: Start automatically
                emulator.keyboard_send_text(profile.id === "9legacy" ? "1\n" : "\n");
            }, 3000);
        }

        init_ui(profile, settings, emulator);

        if(query_args?.has("c"))
        {
            setTimeout(function()
            {
                emulator.keyboard_send_text(query_args.get("c") + "\n");
            }, 25);
        }

        if(query_args?.has("s"))
        {
            setTimeout(function()
            {
                emulator.serial0_send(query_args.get("s") + "\n");
            }, 25);
        }
    });

    emulator.add_listener("download-progress", function(e)
    {
        show_progress(e);
    });

    emulator.add_listener("download-error", function(e)
    {
        const el = $("loading");
        el.style.display = "block";
        el.textContent = `Loading ${e.file_name} failed. Check your connection and reload the page to try again.`;
    });
}

/**
 * @param {Object} settings
 * @param {V86} emulator
 */
function init_ui(profile, settings, emulator)
{
    $("loading").style.display = "none";
    $("runtime_options").style.display = "block";
    $("runtime_infos").style.display = "block";
    $("screen_container").style.display = "block";

    if(settings.filesystem)
    {
        init_filesystem_panel(emulator);
    }
    else
    {
        emulator.add_listener("9p-attach", function()
        {
            init_filesystem_panel(emulator);
        });
    }

    $("run").onclick = function()
    {
        if(emulator.is_running())
        {
            $("run").value = "Run";
            emulator.stop();
        }
        else
        {
            $("run").value = "Pause";
            emulator.run();
        }

        $("run").blur();
    };

    $("exit").onclick = function()
    {
        emulator.destroy();
        location.href = location.pathname;
    };

    $("lock_mouse").onclick = function()
    {
        if(!mouse_is_enabled)
        {
            $("toggle_mouse").onclick();
        }

        emulator.lock_mouse();
        $("lock_mouse").blur();
    };

    var mouse_is_enabled = true;

    $("toggle_mouse").onclick = function()
    {
        mouse_is_enabled = !mouse_is_enabled;

        emulator.mouse_set_status(mouse_is_enabled);
        $("toggle_mouse").value = (mouse_is_enabled ? "Dis" : "En") + "able mouse";
        $("toggle_mouse").blur();
    };

    var last_tick = 0;
    var running_time = 0;
    var last_instr_counter = 0;
    var interval = null;
    var os_uses_mouse = false;
    var total_instructions = 0;

    function update_info()
    {
        var now = Date.now();

        var instruction_counter = emulator.get_instruction_counter();

        if(instruction_counter < last_instr_counter)
        {
            // 32-bit wrap-around
            last_instr_counter -= 0x100000000;
        }

        var last_ips = instruction_counter - last_instr_counter;
        last_instr_counter = instruction_counter;
        total_instructions += last_ips;

        var delta_time = now - last_tick;

        if(delta_time)
        {
            running_time += delta_time;
            last_tick = now;

            $("speed").textContent = (last_ips / 1000 / delta_time).toFixed(1);
            $("avg_speed").textContent = (total_instructions / 1000 / running_time).toFixed(1);
            $("running_time").textContent = format_timestamp(running_time / 1000 | 0);
        }
    }

    emulator.add_listener("emulator-started", function()
    {
        last_tick = Date.now();
        interval = setInterval(update_info, 1000);
    });

    emulator.add_listener("emulator-stopped", function()
    {
        update_info();
        if(interval !== null)
        {
            clearInterval(interval);
        }
    });

    var stats_9p = {
        read: 0,
        write: 0,
        files: [],
    };

    emulator.add_listener("9p-read-start", function(args)
    {
        const file = args[0];
        stats_9p.files.push(file);
        $("info_filesystem").style.display = "block";
        $("info_filesystem_status").textContent = "Loading ...";
        $("info_filesystem_last_file").textContent = file;
    });
    emulator.add_listener("9p-read-end", function(args)
    {
        stats_9p.read += args[1];
        $("info_filesystem_bytes_read").textContent = stats_9p.read;

        const file = args[0];
        stats_9p.files = stats_9p.files.filter(f => f !== file);

        if(stats_9p.files[0])
        {
            $("info_filesystem_last_file").textContent = stats_9p.files[0];
        }
        else
        {
            $("info_filesystem_status").textContent = "Idle";
        }
    });
    emulator.add_listener("9p-write-end", function(args)
    {
        stats_9p.write += args[1];
        $("info_filesystem_bytes_written").textContent = stats_9p.write;

        if(!stats_9p.files[0])
        {
            $("info_filesystem_last_file").textContent = args[0];
        }
    });

    var stats_storage = {
        read: 0,
        read_sectors: 0,
        write: 0,
        write_sectors: 0,
    };

    $("ide_type").textContent = emulator.disk_images.cdrom ? " (CD-ROM)" : " (hard disk)";

    emulator.add_listener("ide-read-start", function()
    {
        $("info_storage").style.display = "block";
        $("info_storage_status").textContent = "Loading ...";
    });
    emulator.add_listener("ide-read-end", function(args)
    {
        stats_storage.read += args[1];
        stats_storage.read_sectors += args[2];

        $("info_storage_status").textContent = "Idle";
        $("info_storage_bytes_read").textContent = stats_storage.read;
        $("info_storage_sectors_read").textContent = stats_storage.read_sectors;
    });
    emulator.add_listener("ide-write-end", function(args)
    {
        stats_storage.write += args[1];
        stats_storage.write_sectors += args[2];

        $("info_storage_bytes_written").textContent = stats_storage.write;
        $("info_storage_sectors_written").textContent = stats_storage.write_sectors;
    });

    var stats_net = {
        bytes_transmitted: 0,
        bytes_received: 0,
    };

    emulator.add_listener("eth-receive-end", function(args)
    {
        stats_net.bytes_received += args[0];

        $("info_network").style.display = "block";
        $("info_network_bytes_received").textContent = stats_net.bytes_received;
    });
    emulator.add_listener("eth-transmit-end", function(args)
    {
        stats_net.bytes_transmitted += args[0];

        $("info_network").style.display = "block";
        $("info_network_bytes_transmitted").textContent = stats_net.bytes_transmitted;
    });


    emulator.add_listener("mouse-enable", function(is_enabled)
    {
        os_uses_mouse = is_enabled;
        $("info_mouse_enabled").textContent = is_enabled ? "Yes" : "No";
    });

    emulator.add_listener("screen-set-size", function(args)
    {
        const [w, h, bpp] = args;
        $("info_res").textContent = w + "x" + h + (bpp ? "x" + bpp : "");
        $("info_vga_mode").textContent = bpp ? "Graphical" : "Text";
    });


    $("reset").onclick = function()
    {
        emulator.restart();
        $("reset").blur();
    };

    add_image_download_button(settings.hda, emulator.disk_images.hda, "hda");
    add_image_download_button(settings.hdb, emulator.disk_images.hdb, "hdb");
    add_image_download_button(settings.fda, emulator.disk_images.fda, "fda");
    add_image_download_button(settings.fdb, emulator.disk_images.fdb, "fdb");
    add_image_download_button(settings.cdrom, emulator.disk_images.cdrom, "cdrom");

    function add_image_download_button(obj, buffer, type)
    {
        var elem = $("get_" + type + "_image");

        if(!obj || obj.async)
        {
            elem.style.display = "none";
            return;
        }

        elem.onclick = function(e)
        {
            const filename = buffer.file && buffer.file.name || ((profile?.id || "v86") + (type === "cdrom" ? ".iso" : ".img"));

            if(buffer.get_as_file)
            {
                var file = buffer.get_as_file(filename);
                download(file, filename);
            }
            else
            {
                buffer.get_buffer(function(b)
                {
                    if(b)
                    {
                        dump_file(b, filename);
                    }
                    else
                    {
                        alert("The file could not be loaded. Maybe it's too big?");
                    }
                });
            }

            elem.blur();
        };
    }

    $("change_fda_image").value = settings.fda ? "Eject floppy image" : "Insert floppy image";
    $("change_fda_image").onclick = function()
    {
        if(emulator.v86.cpu.devices.fdc.fda_image)
        {
            emulator.eject_fda();
            $("change_fda_image").value = "Insert floppy image";
        }
        else
        {
            const file_input = document.createElement("input");
            file_input.type = "file";
            file_input.onchange = async function(e)
            {
                const file = file_input.files[0];
                if(file)
                {
                    await emulator.set_fda({ buffer: file });
                    $("change_fda_image").value = "Eject floppy image";
                }
            };
            file_input.click();
        }
        $("change_fda_image").blur();
    };

    $("memory_dump").onclick = function()
    {
        const mem8 = emulator.v86.cpu.mem8;
        dump_file(new Uint8Array(mem8.buffer, mem8.byteOffset, mem8.length), "v86memory.bin");
        $("memory_dump").blur();
    };

    //$("memory_dump_dmp").onclick = function()
    //{
    //    var memory = emulator.v86.cpu.mem8;
    //    var memory_size = memory.length;
    //    var page_size = 4096;
    //    var header = new Uint8Array(4096);
    //    var header32 = new Int32Array(header.buffer);

    //    header32[0] = 0x45474150; // 'PAGE'
    //    header32[1] = 0x504D5544; // 'DUMP'

    //    header32[0x10 >> 2] = emulator.v86.cpu.cr[3]; // DirectoryTableBase
    //    header32[0x24 >> 2] = 1; // NumberProcessors
    //    header32[0xf88 >> 2] = 1; // DumpType: full dump
    //    header32[0xfa0 >> 2] = header.length + memory_size; // RequiredDumpSpace

    //    header32[0x064 + 0 >> 2] = 1; // NumberOfRuns
    //    header32[0x064 + 4 >> 2] = memory_size / page_size; // NumberOfPages
    //    header32[0x064 + 8 >> 2] = 0; // BasePage
    //    header32[0x064 + 12 >> 2] = memory_size / page_size; // PageCount

    //    dump_file([header, memory], "v86memory.dmp");

    //    $("memory_dump_dmp").blur();
    //};

    /**
     * @this HTMLElement
     */
    $("capture_network_traffic").onclick = function()
    {
        this.value = "0 packets";

        let capture = [];

        function do_capture(direction, data)
        {
            capture.push({ direction, time: performance.now() / 1000, hex_dump: hex_dump(data) });
            $("capture_network_traffic").value = capture.length + " packets";
        }

        emulator.emulator_bus.register("net0-receive", do_capture.bind(this, "I"));
        emulator.add_listener("net0-send", do_capture.bind(this, "O"));

        this.onclick = function()
        {
            const capture_raw = capture.map(({ direction, time, hex_dump }) => {
                // https://www.wireshark.org/docs/wsug_html_chunked/ChIOImportSection.html
                // In wireshark: file -> import from hex -> tick direction indication, timestamp %s.%f
                return direction + " " + time.toFixed(6) + hex_dump + "\n";
            }).join("");
            dump_file(capture_raw, "traffic.hex");
            capture = [];
            this.value = "0 packets";
        };
    };


    $("save_state").onclick = async function()
    {
        const result = await emulator.save_state();
        dump_file(result, "v86state.bin");

        $("save_state").blur();
    };

    $("load_state").onclick = function()
    {
        $("load_state_input").click();
        $("load_state").blur();
    };

    /**
     * @this HTMLElement
     */
    $("load_state_input").onchange = async function()
    {
        var file = this.files[0];

        if(!file)
        {
            return;
        }

        var was_running = emulator.is_running();

        if(was_running)
        {
            await emulator.stop();
        }

        var filereader = new FileReader();
        filereader.onload = async function(e)
        {
            try
            {
                await emulator.restore_state(e.target.result);
            }
            catch(err)
            {
                alert("Something bad happened while restoring the state:\n" + err + "\n\n" +
                      "Note that the current configuration must be the same as the original");
                throw err;
            }

            if(was_running)
            {
                emulator.run();
            }
        };
        filereader.readAsArrayBuffer(file);

        this.value = "";
    };

    $("ctrlaltdel").onclick = function()
    {
        emulator.keyboard_send_scancodes([
            0x1D, // ctrl
            0x38, // alt
            0x53, // delete

            // break codes
            0x1D | 0x80,
            0x38 | 0x80,
            0x53 | 0x80,
        ]);

        $("ctrlaltdel").blur();
    };

    $("alttab").onclick = function()
    {
        emulator.keyboard_send_scancodes([
            0x38, // alt
            0x0F, // tab
        ]);

        setTimeout(function()
        {
            emulator.keyboard_send_scancodes([
                0x38 | 0x80,
                0x0F | 0x80,
            ]);
        }, 100);

        $("alttab").blur();
    };

    /**
     * @this HTMLElement
     */
    $("scale").onchange = function()
    {
        var n = parseFloat(this.value);

        if(n || n > 0)
        {
            emulator.screen_set_scale(n, n);
        }
    };

    $("fullscreen").onclick = function()
    {
        emulator.screen_go_fullscreen();
    };

    $("screen_container").onclick = function()
    {
        if(emulator.is_running() && emulator.speaker_adapter && emulator.speaker_adapter.audio_context.state === "suspended")
        {
            emulator.speaker_adapter.audio_context.resume();
        }

        if(mouse_is_enabled && os_uses_mouse)
        {
            emulator.lock_mouse();
        }
        else
        {
            // allow text selection
            if(window.getSelection().isCollapsed)
            {
                const phone_keyboard = document.getElementsByClassName("phone_keyboard")[0];

                // stop mobile browser from scrolling into view when the keyboard is shown
                phone_keyboard.style.top = document.body.scrollTop + 100 + "px";
                phone_keyboard.style.left = document.body.scrollLeft + 100 + "px";

                phone_keyboard.focus();
            }
        }
    };

    const phone_keyboard = document.getElementsByClassName("phone_keyboard")[0];

    phone_keyboard.setAttribute("autocorrect", "off");
    phone_keyboard.setAttribute("autocapitalize", "off");
    phone_keyboard.setAttribute("spellcheck", "false");
    phone_keyboard.tabIndex = 0;

    $("screen_container").addEventListener("mousedown", e =>
    {
        phone_keyboard.focus();
    }, false);

    $("take_screenshot").onclick = function()
    {
        const image = emulator.screen_make_screenshot();
        try {
            const w = window.open("");
            w.document.write(image.outerHTML);
        }
        catch(e) {}
        $("take_screenshot").blur();
    };

    if(emulator.speaker_adapter)
    {
        let is_muted = false;

        $("mute").onclick = function()
        {
            if(is_muted)
            {
                emulator.speaker_adapter.mixer.set_volume(1, undefined);
                is_muted = false;
                $("mute").value = "Mute";
            }
            else
            {
                emulator.speaker_adapter.mixer.set_volume(0, undefined);
                is_muted = true;
                $("mute").value = "Unmute";
            }

            $("mute").blur();
        };
    }
    else
    {
        $("mute").remove();
    }

    window.addEventListener("keydown", ctrl_w_rescue, false);
    window.addEventListener("keyup", ctrl_w_rescue, false);
    window.addEventListener("blur", ctrl_w_rescue, false);

    function ctrl_w_rescue(e)
    {
        if(e.ctrlKey)
        {
            window.onbeforeunload = function()
            {
                window.onbeforeunload = null;
                return "CTRL-W cannot be sent to the emulator.";
            };
        }
        else
        {
            window.onbeforeunload = null;
        }
    }

    const script = document.createElement("script");
    script.src = "build/xterm.js";
    script.async = true;
    script.onload = function()
    {
        emulator.set_serial_container_xtermjs($("terminal"));
    };
    document.body.appendChild(script);
}

function init_filesystem_panel(emulator)
{
    $("filesystem_panel").style.display = "block";

    /**
     * @this HTMLElement
     */
    $("filesystem_send_file").onchange = function()
    {
        Array.prototype.forEach.call(this.files, function(file)
        {
            var loader = new SyncFileBuffer(file);
            loader.onload = function()
            {
                loader.get_buffer(async function(buffer)
                {
                    await emulator.create_file("/" + file.name, new Uint8Array(buffer));
                });
            };
            loader.load();
        }, this);

        this.value = "";
        this.blur();
    };

    /**
     * @this HTMLElement
     */
    $("filesystem_get_file").onkeypress = async function(e)
    {
        if(e.which !== 13)
        {
            return;
        }

        this.disabled = true;

        let result;
        try
        {
             result = await emulator.read_file(this.value);
        }
        catch(err)
        {
            console.log(err);
        }

        this.disabled = false;

        if(result)
        {
            var filename = this.value.replace(/\/$/, "").split("/");
            filename = filename[filename.length - 1] || "root";

            dump_file(result, filename);
            this.value = "";
        }
        else
        {
            alert("Can't read file");
        }
    };
}

function debug_start(emulator)
{
    if(!emulator.v86)
    {
        return;
    }

    // called as soon as soon as emulation is started, in debug mode
    var debug = emulator.v86.cpu.debug;

    $("dump_gdt").onclick = debug.dump_gdt_ldt.bind(debug);
    $("dump_idt").onclick = debug.dump_idt.bind(debug);
    $("dump_regs").onclick = debug.dump_regs.bind(debug);
    $("dump_pt").onclick = debug.dump_page_structures.bind(debug);

    $("dump_log").onclick = function()
    {
        dump_file(log_data.join(""), "v86.log");
    };

    var cpu = emulator.v86.cpu;

    $("debug_panel").style.display = "block";
    setInterval(function()
    {
        $("debug_panel").textContent =
            cpu.debug.get_regs_short().join("\n") + "\n" + cpu.debug.get_state();

        $("dump_log").value = "Dump log" + (log_data.length ? " (" + log_data.length + " lines)" : "");
    }, 1000);

    // helps debugging
    window.cpu = cpu;
    window.dump_file = dump_file;
}

function onpopstate(e)
{
    location.reload();
}

function push_state(params)
{
    if(window.history.pushState)
    {
        let search = "?" + Array.from(params.entries()).map(([key, value]) => key + "=" + value.replace(/[?&=#+]/g, encodeURIComponent)).join("&");
        window.history.pushState({ search }, "", search);
    }
}

