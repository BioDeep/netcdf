'use strict';
/**
 * Reads a NetCDF v3.x file
 *
 * https://www.unidata.ucar.edu/software/netcdf/docs/file_format_specifications.html
 * https://github.com/cheminfo/netcdfjs
 *
 * @param {ArrayBuffer} data - ArrayBuffer or any Typed Array (including Node.js' Buffer from v4) with the data
 * @constructor
 */
var NetCDFReader = /** @class */ (function () {
    function NetCDFReader(data) {
        // https://github.com/image-js/iobuffer
        // npm i iobuffer
        var buffer = new IOBuffer(utils.createInputBuffer(data));
        buffer.seek(0);
        buffer.setBigEndian();
        // Validate that it's a NetCDF file
        utils.notNetcdf(buffer.readChars(3) !== 'CDF', 'should start with CDF');
        // Check the NetCDF format
        var version = buffer.readByte();
        utils.notNetcdf(version > 2, 'unknown version');
        // Read the header
        this.header = header.readHeader(buffer, version);
        this.buffer = buffer;
    }
    Object.defineProperty(NetCDFReader.prototype, "version", {
        /**
         * @return {string} - Version for the NetCDF format
         */
        get: function () {
            if (this.header.version === 1) {
                return 'classic format';
            }
            else {
                return '64-bit offset format';
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NetCDFReader.prototype, "recordDimension", {
        /**
         * @return {object} - Metadata for the record dimension
         *  * `length`: Number of elements in the record dimension
         *  * `id`: Id number in the list of dimensions for the record dimension
         *  * `name`: String with the name of the record dimension
         *  * `recordStep`: Number with the record variables step size
         */
        get: function () {
            return this.header.recordDimension;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NetCDFReader.prototype, "dimensions", {
        /**
         * @return {Array<object>} - List of dimensions with:
         *  * `name`: String with the name of the dimension
         *  * `size`: Number with the size of the dimension
         */
        get: function () {
            return this.header.dimensions;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NetCDFReader.prototype, "globalAttributes", {
        /**
         * @return {Array<object>} - List of global attributes with:
         *  * `name`: String with the name of the attribute
         *  * `type`: String with the type of the attribute
         *  * `value`: A number or string with the value of the attribute
         */
        get: function () {
            return this.header.globalAttributes;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(NetCDFReader.prototype, "variables", {
        /**
        * @return {Array<object>} - List of variables with:
        *  * `name`: String with the name of the variable
        *  * `dimensions`: Array with the dimension IDs of the variable
        *  * `attributes`: Array with the attributes of the variable
        *  * `type`: String with the type of the variable
        *  * `size`: Number with the size of the variable
        *  * `offset`: Number with the offset where of the variable begins
        *  * `record`: True if is a record variable, false otherwise
        */
        get: function () {
            return this.header.variables;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Returns the value of an attribute
     * @param {string} attributeName
     * @return {string} Value of the attributeName or null
     */
    NetCDFReader.prototype.getAttribute = function (attributeName) {
        var attribute = this.globalAttributes.find(function (val) { return val.name === attributeName; });
        if (attribute)
            return attribute.value;
        return null;
    };
    /**
     * Returns the value of a variable as a string
     * @param {string} variableName
     * @return {string} Value of the variable as a string or null
     */
    NetCDFReader.prototype.getDataVariableAsString = function (variableName) {
        var variable = this.getDataVariable(variableName);
        if (variable)
            return variable.join('');
        return null;
    };
    NetCDFReader.prototype.toString = function () {
        return debug.toString(this);
    };
    /**
     * Check if a dataVariable exists
     * @param {string} variableName - Name of the variable to find
     * @return {boolean}
     */
    NetCDFReader.prototype.dataVariableExists = function (variableName) {
        var variable = this.header.variables.find(function (val) {
            return val.name === variableName;
        });
        return variable !== undefined;
    };
    /**
     * Check if an attribute exists
     * @param {string} attributeName - Name of the attribute to find
     * @return {boolean}
     */
    NetCDFReader.prototype.attributeExists = function (attributeName) {
        var attribute = this.globalAttributes.find(function (val) { return val.name === attributeName; });
        return attribute !== undefined;
    };
    /**
     * Retrieves the data for a given variable
     * @param {string|object} variableName - Name of the variable to search or variable object
     * @return {Array} - List with the variable values
     */
    NetCDFReader.prototype.getDataVariable = function (variableName) {
        var variable;
        if (typeof variableName === 'string') {
            // search the variable
            variable = this.header.variables.find(function (val) { return val.name === variableName; });
        }
        else {
            variable = variableName;
        }
        // throws if variable not found
        utils.notNetcdf(variable === undefined, "variable not found: ".concat(variableName));
        // go to the offset position
        this.buffer.seek(variable.offset);
        if (variable.record) {
            // record variable case
            return Type.record(this.buffer, variable, this.header.recordDimension);
        }
        else {
            // non-record variable case
            return Type.nonRecord(this.buffer, variable);
        }
    };
    NetCDFReader.fetch = function (url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.responseType = 'arraybuffer';
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                var buffer = new Uint8Array(xhr.response);
                var cdf = new NetCDFReader(buffer);
                callback(cdf);
            }
        };
    };
    return NetCDFReader;
}());
var debug;
(function (debug) {
    function toString(cdf) {
        var result = [];
        result.push('DIMENSIONS');
        for (var _i = 0, _a = cdf.dimensions; _i < _a.length; _i++) {
            var dimension = _a[_i];
            result.push("  ".concat(dimension.name.padEnd(30), " = size: ").concat(dimension.size));
        }
        result.push('');
        result.push('GLOBAL ATTRIBUTES');
        for (var _b = 0, _c = cdf.globalAttributes; _b < _c.length; _b++) {
            var attribute = _c[_b];
            result.push("  ".concat(attribute.name.padEnd(30), " = ").concat(attribute.value));
        }
        var variables = JSON.parse(JSON.stringify(cdf.variables));
        result.push('');
        result.push('VARIABLES:');
        for (var _d = 0, variables_1 = variables; _d < variables_1.length; _d++) {
            var variable = variables_1[_d];
            variable.value = cdf.getDataVariable(variable);
            var stringify = JSON.stringify(variable.value);
            if (stringify.length > 50)
                stringify = stringify.substring(0, 50);
            if (!isNaN(variable.value.length)) {
                stringify += " (length: ".concat(variable.value.length, ")");
            }
            result.push("  ".concat(variable.name.padEnd(30), " = ").concat(stringify));
        }
        return result.join('\n');
    }
    debug.toString = toString;
})(debug || (debug = {}));
var utils;
(function (utils) {
    /**
     * Throws a non-valid NetCDF exception if the statement it's true
     * @ignore
     * @param {boolean} statement - Throws if true
     * @param {string} reason - Reason to throw
     */
    function notNetcdf(statement, reason) {
        if (statement) {
            throw new TypeError("Not a valid NetCDF v3.x file: ".concat(reason));
        }
    }
    utils.notNetcdf = notNetcdf;
    /**
     * Moves 1, 2, or 3 bytes to next 4-byte boundary
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     */
    function padding(buffer) {
        if ((buffer.offset % 4) !== 0) {
            buffer.skip(4 - (buffer.offset % 4));
        }
    }
    utils.padding = padding;
    function createInputBuffer(data) {
        if (!data || data == undefined) {
            throw "empty data is not allowed!";
        }
        else if (data instanceof ArrayBuffer) {
            return data;
        }
        else {
            return new Uint8Array(data);
        }
    }
    utils.createInputBuffer = createInputBuffer;
    /**
     * Reads the name
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @return {string} - Name
     */
    function readName(buffer) {
        // Read name
        var nameLength = buffer.readUint32();
        var name = buffer.readChars(nameLength);
        // validate name
        // TODO
        // Apply padding
        padding(buffer);
        return name;
    }
    utils.readName = readName;
})(utils || (utils = {}));
var header;
(function (header) {
    /**
     * List of attributes
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @return {Array<object>} - List of attributes with:
     *  * `name`: String with the name of the attribute
     *  * `type`: String with the type of the attribute
     *  * `value`: A number or string with the value of the attribute
     */
    function attributesList(buffer) {
        var gAttList = buffer.readUint32();
        if (gAttList === header.ZERO) {
            utils.notNetcdf((buffer.readUint32() !== header.ZERO), 'wrong empty tag for list of attributes');
            return [];
        }
        else {
            utils.notNetcdf((gAttList !== header.NC_ATTRIBUTE), 'wrong tag for list of attributes');
            return readInternal(buffer);
        }
    }
    header.attributesList = attributesList;
    function readInternal(buffer) {
        // Length of attributes
        var attributeSize = buffer.readUint32();
        var attributes = new Array(attributeSize);
        for (var gAtt = 0; gAtt < attributeSize; gAtt++) {
            // Read name
            var name = utils.readName(buffer);
            // Read type
            var type = buffer.readUint32();
            utils.notNetcdf(((type < 1) || (type > 6)), "non valid type ".concat(type));
            // Read attribute
            var size = buffer.readUint32();
            var value = Type.readType(buffer, type, size);
            // Apply padding
            utils.padding(buffer);
            attributes[gAtt] = {
                name: name,
                type: Type.num2str(type),
                value: value
            };
        }
        return attributes;
    }
})(header || (header = {}));
var header;
(function (header) {
    var NC_UNLIMITED = 0;
    /**
     * List of dimensions
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @return {object} - Ojbect containing the following properties:
     *  * `dimensions` that is an array of dimension object:
      *  * `name`: String with the name of the dimension
      *  * `size`: Number with the size of the dimension dimensions: dimensions
     *  * `recordId`: the id of the dimension that has unlimited size or undefined,
     *  * `recordName`: name of the dimension that has unlimited size
     */
    function dimensionsList(buffer) {
        var dimList = buffer.readUint32();
        if (dimList === header.ZERO) {
            utils.notNetcdf((buffer.readUint32() !== header.ZERO), 'wrong empty tag for list of dimensions');
            return {
                dimensions: [],
                recordId: null,
                recordName: null
            };
        }
        else {
            utils.notNetcdf((dimList !== header.NC_DIMENSION), 'wrong tag for list of dimensions');
            return readInternal(buffer);
        }
    }
    header.dimensionsList = dimensionsList;
    function readInternal(buffer) {
        // Length of dimensions
        var dimensionSize = buffer.readUint32();
        var recordId = null;
        var recordName = null;
        var dimensions = new Array(dimensionSize);
        for (var dim = 0; dim < dimensionSize; dim++) {
            // Read name
            var name_1 = utils.readName(buffer);
            // Read dimension size
            var size = buffer.readUint32();
            if (size === NC_UNLIMITED) {
                // in netcdf 3 one field can be of size unlimmited
                recordId = dim;
                recordName = name_1;
            }
            dimensions[dim] = {
                name: name_1,
                size: size
            };
        }
        return {
            dimensions: dimensions,
            recordId: recordId,
            recordName: recordName
        };
    }
})(header || (header = {}));
var header;
(function (header) {
    /**
 * List of variables
 * @ignore
 * @param {IOBuffer} buffer - Buffer for the file data
 * @param {number} recordId - Id of the unlimited dimension (also called record dimension)
 *                            This value may be undefined if there is no unlimited dimension
 * @param {number} version - Version of the file
 * @return {object} - Number of recordStep and list of variables with:
 *  * `name`: String with the name of the variable
 *  * `dimensions`: Array with the dimension IDs of the variable
 *  * `attributes`: Array with the attributes of the variable
 *  * `type`: String with the type of the variable
 *  * `size`: Number with the size of the variable
 *  * `offset`: Number with the offset where of the variable begins
 *  * `record`: True if is a record variable, false otherwise (unlimited size)
    */
    function variablesList(buffer, recordId, version) {
        var varList = buffer.readUint32();
        if (varList === header.ZERO) {
            utils.notNetcdf((buffer.readUint32() !== header.ZERO), 'wrong empty tag for list of variables');
            return {
                variables: [],
                recordStep: null
            };
        }
        else {
            utils.notNetcdf((varList !== header.NC_VARIABLE), 'wrong tag for list of variables');
            return readInternal(buffer, recordId, version);
        }
    }
    header.variablesList = variablesList;
    function readInternal(buffer, recordId, version) {
        // Length of variables
        var variableSize = buffer.readUint32();
        var variables = new Array(variableSize);
        var recordStep = 0;
        for (var v = 0; v < variableSize; v++) {
            // Read name
            var name = utils.readName(buffer);
            // Read dimensionality of the variable
            var dimensionality = buffer.readUint32();
            // Index into the list of dimensions
            var dimensionsIds = new Array(dimensionality);
            for (var dim = 0; dim < dimensionality; dim++) {
                dimensionsIds[dim] = buffer.readUint32();
            }
            // Read variables size
            var attributes = header.attributesList(buffer);
            // Read type
            var type = buffer.readUint32();
            utils.notNetcdf(((type < 1) && (type > 6)), "non valid type ".concat(type));
            // Read variable size
            // The 32-bit varSize field is not large enough to contain the size of variables that require
            // more than 2^32 - 4 bytes, so 2^32 - 1 is used in the varSize field for such variables.
            var varSize = buffer.readUint32();
            // Read offset
            var offset = buffer.readUint32();
            if (version === 2) {
                utils.notNetcdf((offset > 0), 'offsets larger than 4GB not supported');
                offset = buffer.readUint32();
            }
            var record = false;
            // Count amount of record variables
            if ((typeof recordId !== 'undefined') && (dimensionsIds[0] === recordId)) {
                recordStep += varSize;
                record = true;
            }
            variables[v] = {
                name: name,
                dimensions: dimensionsIds,
                attributes: attributes,
                type: Type.num2str(type),
                size: varSize,
                offset: offset,
                record: record
            };
        }
        return {
            variables: variables,
            recordStep: recordStep
        };
    }
})(header || (header = {}));
var header;
(function (header_1) {
    // Grammar constants
    header_1.ZERO = 0;
    header_1.NC_DIMENSION = 10;
    header_1.NC_VARIABLE = 11;
    header_1.NC_ATTRIBUTE = 12;
    /**
     * Read the header of the file
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @param {number} version - Version of the file
     * @return {object} - Object with the fields:
     *  * `recordDimension`: Number with the length of record dimension
     *  * `dimensions`: List of dimensions
     *  * `globalAttributes`: List of global attributes
     *  * `variables`: List of variables
     */
    function readHeader(buffer, version) {
        // Length of record dimension
        // sum of the varSize's of all the record variables.
        var header = { recordDimension: { length: buffer.readUint32() } };
        // Version
        header.version = version;
        // List of dimensions
        var dimList = header_1.dimensionsList(buffer);
        header.recordDimension.id = dimList.recordId; // id of the unlimited dimension
        header.recordDimension.name = dimList.recordName; // name of the unlimited dimension
        header.dimensions = dimList.dimensions;
        // List of global attributes
        header.globalAttributes = header_1.attributesList(buffer);
        // List of variables
        var variables = header_1.variablesList(buffer, dimList.recordId, version);
        header.variables = variables.variables;
        header.recordDimension.recordStep = variables.recordStep;
        return header;
    }
    header_1.readHeader = readHeader;
})(header || (header = {}));
var defaultByteLength = 1024 * 8;
var IOBuffer = /** @class */ (function () {
    /**
     * @param data - The data to construct the IOBuffer with.
     * If data is a number, it will be the new buffer's length<br>
     * If data is `undefined`, the buffer will be initialized with a default length of 8Kb<br>
     * If data is an ArrayBuffer, SharedArrayBuffer, an ArrayBufferView (Typed Array), an IOBuffer instance,
     * or a Node.js Buffer, a view will be created over the underlying ArrayBuffer.
     * @param options
     */
    function IOBuffer(data, options) {
        if (data === void 0) { data = defaultByteLength; }
        if (options === void 0) { options = {}; }
        var dataIsGiven = false;
        if (typeof data === 'number') {
            data = new ArrayBuffer(data);
        }
        else {
            dataIsGiven = true;
            this.lastWrittenByte = data.byteLength;
        }
        var offset = options.offset ? options.offset >>> 0 : 0;
        var byteLength = data.byteLength - offset;
        var dvOffset = offset;
        if (ArrayBuffer.isView(data) || data instanceof IOBuffer) {
            if (data.byteLength !== data.buffer.byteLength) {
                dvOffset = data.byteOffset + offset;
            }
            data = data.buffer;
        }
        if (dataIsGiven) {
            this.lastWrittenByte = byteLength;
        }
        else {
            this.lastWrittenByte = 0;
        }
        this.buffer = data;
        this.length = byteLength;
        this.byteLength = byteLength;
        this.byteOffset = dvOffset;
        this.offset = 0;
        this.littleEndian = true;
        this._data = new DataView(this.buffer, dvOffset, byteLength);
        this._mark = 0;
        this._marks = [];
    }
    /**
     * Checks if the memory allocated to the buffer is sufficient to store more
     * bytes after the offset.
     * @param byteLength - The needed memory in bytes.
     * @returns `true` if there is sufficient space and `false` otherwise.
     */
    IOBuffer.prototype.available = function (byteLength) {
        if (byteLength === void 0) { byteLength = 1; }
        return this.offset + byteLength <= this.length;
    };
    /**
     * Check if little-endian mode is used for reading and writing multi-byte
     * values.
     * @returns `true` if little-endian mode is used, `false` otherwise.
     */
    IOBuffer.prototype.isLittleEndian = function () {
        return this.littleEndian;
    };
    /**
     * Set little-endian mode for reading and writing multi-byte values.
     */
    IOBuffer.prototype.setLittleEndian = function () {
        this.littleEndian = true;
        return this;
    };
    /**
     * Check if big-endian mode is used for reading and writing multi-byte values.
     * @returns `true` if big-endian mode is used, `false` otherwise.
     */
    IOBuffer.prototype.isBigEndian = function () {
        return !this.littleEndian;
    };
    /**
     * Switches to big-endian mode for reading and writing multi-byte values.
     */
    IOBuffer.prototype.setBigEndian = function () {
        this.littleEndian = false;
        return this;
    };
    /**
     * Move the pointer n bytes forward.
     * @param n - Number of bytes to skip.
     */
    IOBuffer.prototype.skip = function (n) {
        if (n === void 0) { n = 1; }
        this.offset += n;
        return this;
    };
    /**
     * Move the pointer to the given offset.
     * @param offset
     */
    IOBuffer.prototype.seek = function (offset) {
        this.offset = offset;
        return this;
    };
    /**
     * Store the current pointer offset.
     * @see {@link IOBuffer#reset}
     */
    IOBuffer.prototype.mark = function () {
        this._mark = this.offset;
        return this;
    };
    /**
     * Move the pointer back to the last pointer offset set by mark.
     * @see {@link IOBuffer#mark}
     */
    IOBuffer.prototype.reset = function () {
        this.offset = this._mark;
        return this;
    };
    /**
     * Push the current pointer offset to the mark stack.
     * @see {@link IOBuffer#popMark}
     */
    IOBuffer.prototype.pushMark = function () {
        this._marks.push(this.offset);
        return this;
    };
    /**
     * Pop the last pointer offset from the mark stack, and set the current
     * pointer offset to the popped value.
     * @see {@link IOBuffer#pushMark}
     */
    IOBuffer.prototype.popMark = function () {
        var offset = this._marks.pop();
        if (offset === undefined) {
            throw new Error('Mark stack empty');
        }
        this.seek(offset);
        return this;
    };
    /**
     * Move the pointer offset back to 0.
     */
    IOBuffer.prototype.rewind = function () {
        this.offset = 0;
        return this;
    };
    /**
     * Make sure the buffer has sufficient memory to write a given byteLength at
     * the current pointer offset.
     * If the buffer's memory is insufficient, this method will create a new
     * buffer (a copy) with a length that is twice (byteLength + current offset).
     * @param byteLength
     */
    IOBuffer.prototype.ensureAvailable = function (byteLength) {
        if (byteLength === void 0) { byteLength = 1; }
        if (!this.available(byteLength)) {
            var lengthNeeded = this.offset + byteLength;
            var newLength = lengthNeeded * 2;
            var newArray = new Uint8Array(newLength);
            newArray.set(new Uint8Array(this.buffer));
            this.buffer = newArray.buffer;
            this.length = this.byteLength = newLength;
            this._data = new DataView(this.buffer);
        }
        return this;
    };
    /**
     * Read a byte and return false if the byte's value is 0, or true otherwise.
     * Moves pointer forward by one byte.
     */
    IOBuffer.prototype.readBoolean = function () {
        return this.readUint8() !== 0;
    };
    /**
     * Read a signed 8-bit integer and move pointer forward by 1 byte.
     */
    IOBuffer.prototype.readInt8 = function () {
        return this._data.getInt8(this.offset++);
    };
    /**
     * Read an unsigned 8-bit integer and move pointer forward by 1 byte.
     */
    IOBuffer.prototype.readUint8 = function () {
        return this._data.getUint8(this.offset++);
    };
    /**
     * Alias for {@link IOBuffer#readUint8}.
     */
    IOBuffer.prototype.readByte = function () {
        return this.readUint8();
    };
    /**
     * Read `n` bytes and move pointer forward by `n` bytes.
     */
    IOBuffer.prototype.readBytes = function (n) {
        if (n === void 0) { n = 1; }
        var bytes = new Uint8Array(n);
        for (var i = 0; i < n; i++) {
            bytes[i] = this.readByte();
        }
        return bytes;
    };
    /**
     * Read a 16-bit signed integer and move pointer forward by 2 bytes.
     */
    IOBuffer.prototype.readInt16 = function () {
        var value = this._data.getInt16(this.offset, this.littleEndian);
        this.offset += 2;
        return value;
    };
    /**
     * Read a 16-bit unsigned integer and move pointer forward by 2 bytes.
     */
    IOBuffer.prototype.readUint16 = function () {
        var value = this._data.getUint16(this.offset, this.littleEndian);
        this.offset += 2;
        return value;
    };
    /**
     * Read a 32-bit signed integer and move pointer forward by 4 bytes.
     */
    IOBuffer.prototype.readInt32 = function () {
        var value = this._data.getInt32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    };
    /**
     * Read a 32-bit unsigned integer and move pointer forward by 4 bytes.
     */
    IOBuffer.prototype.readUint32 = function () {
        var value = this._data.getUint32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    };
    /**
     * Read a 32-bit floating number and move pointer forward by 4 bytes.
     */
    IOBuffer.prototype.readFloat32 = function () {
        var value = this._data.getFloat32(this.offset, this.littleEndian);
        this.offset += 4;
        return value;
    };
    /**
     * Read a 64-bit floating number and move pointer forward by 8 bytes.
     */
    IOBuffer.prototype.readFloat64 = function () {
        var value = this._data.getFloat64(this.offset, this.littleEndian);
        this.offset += 8;
        return value;
    };
    /**
     * Read a 1-byte ASCII character and move pointer forward by 1 byte.
     */
    IOBuffer.prototype.readChar = function () {
        return String.fromCharCode(this.readInt8());
    };
    /**
     * Read `n` 1-byte ASCII characters and move pointer forward by `n` bytes.
     */
    IOBuffer.prototype.readChars = function (n) {
        if (n === void 0) { n = 1; }
        var result = '';
        for (var i = 0; i < n; i++) {
            result += this.readChar();
        }
        return result;
    };
    /**
     * Read the next `n` bytes, return a UTF-8 decoded string and move pointer
     * forward by `n` bytes.
     */
    IOBuffer.prototype.readUtf8 = function (n) {
        if (n === void 0) { n = 1; }
        return utf8.decode(this.readBytes(n));
    };
    /**
     * Write 0xff if the passed value is truthy, 0x00 otherwise and move pointer
     * forward by 1 byte.
     */
    IOBuffer.prototype.writeBoolean = function (value) {
        this.writeUint8(value ? 0xff : 0x00);
        return this;
    };
    /**
     * Write `value` as an 8-bit signed integer and move pointer forward by 1 byte.
     */
    IOBuffer.prototype.writeInt8 = function (value) {
        this.ensureAvailable(1);
        this._data.setInt8(this.offset++, value);
        this._updateLastWrittenByte();
        return this;
    };
    /**
     * Write `value` as an 8-bit unsigned integer and move pointer forward by 1
     * byte.
     */
    IOBuffer.prototype.writeUint8 = function (value) {
        this.ensureAvailable(1);
        this._data.setUint8(this.offset++, value);
        this._updateLastWrittenByte();
        return this;
    };
    /**
     * An alias for {@link IOBuffer#writeUint8}.
     */
    IOBuffer.prototype.writeByte = function (value) {
        return this.writeUint8(value);
    };
    /**
     * Write all elements of `bytes` as uint8 values and move pointer forward by
     * `bytes.length` bytes.
     */
    IOBuffer.prototype.writeBytes = function (bytes) {
        this.ensureAvailable(bytes.length);
        for (var i = 0; i < bytes.length; i++) {
            this._data.setUint8(this.offset++, bytes[i]);
        }
        this._updateLastWrittenByte();
        return this;
    };
    /**
     * Write `value` as a 16-bit signed integer and move pointer forward by 2
     * bytes.
     */
    IOBuffer.prototype.writeInt16 = function (value) {
        this.ensureAvailable(2);
        this._data.setInt16(this.offset, value, this.littleEndian);
        this.offset += 2;
        this._updateLastWrittenByte();
        return this;
    };
    /**
     * Write `value` as a 16-bit unsigned integer and move pointer forward by 2
     * bytes.
     */
    IOBuffer.prototype.writeUint16 = function (value) {
        this.ensureAvailable(2);
        this._data.setUint16(this.offset, value, this.littleEndian);
        this.offset += 2;
        this._updateLastWrittenByte();
        return this;
    };
    /**
     * Write `value` as a 32-bit signed integer and move pointer forward by 4
     * bytes.
     */
    IOBuffer.prototype.writeInt32 = function (value) {
        this.ensureAvailable(4);
        this._data.setInt32(this.offset, value, this.littleEndian);
        this.offset += 4;
        this._updateLastWrittenByte();
        return this;
    };
    /**
     * Write `value` as a 32-bit unsigned integer and move pointer forward by 4
     * bytes.
     */
    IOBuffer.prototype.writeUint32 = function (value) {
        this.ensureAvailable(4);
        this._data.setUint32(this.offset, value, this.littleEndian);
        this.offset += 4;
        this._updateLastWrittenByte();
        return this;
    };
    /**
     * Write `value` as a 32-bit floating number and move pointer forward by 4
     * bytes.
     */
    IOBuffer.prototype.writeFloat32 = function (value) {
        this.ensureAvailable(4);
        this._data.setFloat32(this.offset, value, this.littleEndian);
        this.offset += 4;
        this._updateLastWrittenByte();
        return this;
    };
    /**
     * Write `value` as a 64-bit floating number and move pointer forward by 8
     * bytes.
     */
    IOBuffer.prototype.writeFloat64 = function (value) {
        this.ensureAvailable(8);
        this._data.setFloat64(this.offset, value, this.littleEndian);
        this.offset += 8;
        this._updateLastWrittenByte();
        return this;
    };
    /**
     * Write the charCode of `str`'s first character as an 8-bit unsigned integer
     * and move pointer forward by 1 byte.
     */
    IOBuffer.prototype.writeChar = function (str) {
        return this.writeUint8(str.charCodeAt(0));
    };
    /**
     * Write the charCodes of all `str`'s characters as 8-bit unsigned integers
     * and move pointer forward by `str.length` bytes.
     */
    IOBuffer.prototype.writeChars = function (str) {
        for (var i = 0; i < str.length; i++) {
            this.writeUint8(str.charCodeAt(i));
        }
        return this;
    };
    /**
     * UTF-8 encode and write `str` to the current pointer offset and move pointer
     * forward according to the encoded length.
     */
    IOBuffer.prototype.writeUtf8 = function (str) {
        return this.writeBytes(utf8.encode(str));
    };
    /**
     * Export a Uint8Array view of the internal buffer.
     * The view starts at the byte offset and its length
     * is calculated to stop at the last written byte or the original length.
     */
    IOBuffer.prototype.toArray = function () {
        return new Uint8Array(this.buffer, this.byteOffset, this.lastWrittenByte);
    };
    /**
     * Update the last written byte offset
     * @private
     */
    IOBuffer.prototype._updateLastWrittenByte = function () {
        if (this.offset > this.lastWrittenByte) {
            this.lastWrittenByte = this.offset;
        }
    };
    return IOBuffer;
}());
/*
 * Copyright 2017 Sam Thorogood. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
var utf8;
(function (utf8) {
    var polyfill;
    (function (polyfill) {
        /**
         * @constructor
         * @param {string=} utfLabel
         */
        function FastTextEncoder(utfLabel) {
            if (utfLabel === void 0) { utfLabel = 'utf-8'; }
            if (utfLabel !== 'utf-8') {
                throw new RangeError("Failed to construct 'TextEncoder': The encoding label provided ('".concat(utfLabel, "') is invalid."));
            }
        }
        Object.defineProperty(FastTextEncoder.prototype, 'encoding', {
            value: 'utf-8',
        });
        /**
         * @param {string} string
         * @param {{stream: boolean}=} options
         * @return {!Uint8Array}
         */
        FastTextEncoder.prototype.encode = function (string, options) {
            if (options === void 0) { options = { stream: false }; }
            if (options.stream) {
                throw new Error("Failed to encode: the 'stream' option is unsupported.");
            }
            var pos = 0;
            var len = string.length;
            var out = [];
            var at = 0; // output position
            var tlen = Math.max(32, len + (len >> 1) + 7); // 1.5x size
            var target = new Uint8Array((tlen >> 3) << 3); // ... but at 8 byte offset
            while (pos < len) {
                var value = string.charCodeAt(pos++);
                if (value >= 0xd800 && value <= 0xdbff) {
                    // high surrogate
                    if (pos < len) {
                        var extra = string.charCodeAt(pos);
                        if ((extra & 0xfc00) === 0xdc00) {
                            ++pos;
                            value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                        }
                    }
                    if (value >= 0xd800 && value <= 0xdbff) {
                        continue; // drop lone surrogate
                    }
                }
                // expand the buffer if we couldn't write 4 bytes
                if (at + 4 > target.length) {
                    tlen += 8; // minimum extra
                    tlen *= 1.0 + (pos / string.length) * 2; // take 2x the remaining
                    tlen = (tlen >> 3) << 3; // 8 byte offset
                    var update = new Uint8Array(tlen);
                    update.set(target);
                    target = update;
                }
                if ((value & 0xffffff80) === 0) {
                    // 1-byte
                    target[at++] = value; // ASCII
                    continue;
                }
                else if ((value & 0xfffff800) === 0) {
                    // 2-byte
                    target[at++] = ((value >> 6) & 0x1f) | 0xc0;
                }
                else if ((value & 0xffff0000) === 0) {
                    // 3-byte
                    target[at++] = ((value >> 12) & 0x0f) | 0xe0;
                    target[at++] = ((value >> 6) & 0x3f) | 0x80;
                }
                else if ((value & 0xffe00000) === 0) {
                    // 4-byte
                    target[at++] = ((value >> 18) & 0x07) | 0xf0;
                    target[at++] = ((value >> 12) & 0x3f) | 0x80;
                    target[at++] = ((value >> 6) & 0x3f) | 0x80;
                }
                else {
                    // FIXME: do we care
                    continue;
                }
                target[at++] = (value & 0x3f) | 0x80;
            }
            return target.slice(0, at);
        };
        /**
         * @constructor
         * @param {string=} utfLabel
         * @param {{fatal: boolean}=} options
         */
        function FastTextDecoder(utfLabel, options) {
            if (utfLabel === void 0) { utfLabel = 'utf-8'; }
            if (options === void 0) { options = { fatal: false }; }
            if (utfLabel !== 'utf-8') {
                throw new RangeError("Failed to construct 'TextDecoder': The encoding label provided ('".concat(utfLabel, "') is invalid."));
            }
            if (options.fatal) {
                throw new Error("Failed to construct 'TextDecoder': the 'fatal' option is unsupported.");
            }
        }
        Object.defineProperty(FastTextDecoder.prototype, 'encoding', {
            value: 'utf-8',
        });
        Object.defineProperty(FastTextDecoder.prototype, 'fatal', { value: false });
        Object.defineProperty(FastTextDecoder.prototype, 'ignoreBOM', {
            value: false,
        });
        /**
         * @param {(!ArrayBuffer|!ArrayBufferView)} buffer
         * @param {{stream: boolean}=} options
         */
        FastTextDecoder.prototype.decode = function (buffer, options) {
            if (options === void 0) { options = { stream: false }; }
            if (options['stream']) {
                throw new Error("Failed to decode: the 'stream' option is unsupported.");
            }
            var bytes = new Uint8Array(buffer);
            var pos = 0;
            var len = bytes.length;
            var out = [];
            while (pos < len) {
                var byte1 = bytes[pos++];
                if (byte1 === 0) {
                    break; // NULL
                }
                if ((byte1 & 0x80) === 0) {
                    // 1-byte
                    out.push(byte1);
                }
                else if ((byte1 & 0xe0) === 0xc0) {
                    // 2-byte
                    var byte2 = bytes[pos++] & 0x3f;
                    out.push(((byte1 & 0x1f) << 6) | byte2);
                }
                else if ((byte1 & 0xf0) === 0xe0) {
                    var byte2 = bytes[pos++] & 0x3f;
                    var byte3 = bytes[pos++] & 0x3f;
                    out.push(((byte1 & 0x1f) << 12) | (byte2 << 6) | byte3);
                }
                else if ((byte1 & 0xf8) === 0xf0) {
                    var byte2 = bytes[pos++] & 0x3f;
                    var byte3 = bytes[pos++] & 0x3f;
                    var byte4 = bytes[pos++] & 0x3f;
                    // this can be > 0xffff, so possibly generate surrogates
                    var codepoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4;
                    if (codepoint > 0xffff) {
                        // codepoint &= ~0x10000;
                        codepoint -= 0x10000;
                        out.push(((codepoint >>> 10) & 0x3ff) | 0xd800);
                        codepoint = 0xdc00 | (codepoint & 0x3ff);
                    }
                    out.push(codepoint);
                }
                else {
                    // FIXME: we're ignoring this
                }
            }
            return String.fromCharCode.apply(null, out);
        };
    })(polyfill = utf8.polyfill || (utf8.polyfill = {}));
})(utf8 || (utf8 = {}));
var utf8;
(function (utf8) {
    // eslint-disable-next-line import/no-unassigned-import
    var decoder = new TextDecoder('utf-8');
    function decode(bytes) {
        return decoder.decode(bytes);
    }
    utf8.decode = decode;
    var encoder = new TextEncoder();
    function encode(str) {
        return encoder.encode(str);
    }
    utf8.encode = encode;
})(utf8 || (utf8 = {}));
var Type;
(function (Type) {
    Type.STREAMING = 4294967295;
    /**
     * Read data for the given non-record variable
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @param {object} variable - Variable metadata
     * @return {Array} - Data of the element
     */
    function nonRecord(buffer, variable) {
        // variable type
        var type = Type.str2num(variable.type);
        // size of the data
        var size = variable.size / Type.num2bytes(type);
        // iterates over the data
        var data = new Array(size);
        for (var i = 0; i < size; i++) {
            data[i] = Type.readType(buffer, type, 1);
        }
        return data;
    }
    Type.nonRecord = nonRecord;
    /**
     * Read data for the given record variable
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @param {object} variable - Variable metadata
     * @param {object} recordDimension - Record dimension metadata
     * @return {Array} - Data of the element
     */
    function record(buffer, variable, recordDimension) {
        // variable type
        var type = Type.str2num(variable.type);
        var width = variable.size ? variable.size / Type.num2bytes(type) : 1;
        // size of the data
        // TODO streaming data
        var size = recordDimension.length;
        // iterates over the data
        var data = new Array(size);
        var step = recordDimension.recordStep;
        for (var i = 0; i < size; i++) {
            var currentOffset = buffer.offset;
            data[i] = Type.readType(buffer, type, width);
            buffer.seek(currentOffset + step);
        }
        return data;
    }
    Type.record = record;
})(Type || (Type = {}));
var Type;
(function (Type) {
    /**
    * Parse a number into their respective type
    * @ignore
    * @param {number} type - integer that represents the type
    * @return {string} - parsed value of the type
    */
    function num2str(type) {
        switch (Number(type)) {
            case Type.cdfTypes.BYTE:
                return 'byte';
            case Type.cdfTypes.CHAR:
                return 'char';
            case Type.cdfTypes.SHORT:
                return 'short';
            case Type.cdfTypes.INT:
                return 'int';
            case Type.cdfTypes.FLOAT:
                return 'float';
            case Type.cdfTypes.DOUBLE:
                return 'double';
            /* istanbul ignore next */
            default:
                return 'undefined';
        }
    }
    Type.num2str = num2str;
    /**
     * Parse a number type identifier to his size in bytes
     * @ignore
     * @param {number} type - integer that represents the type
     * @return {number} -size of the type
     */
    function num2bytes(type) {
        switch (Number(type)) {
            case Type.cdfTypes.BYTE:
                return 1;
            case Type.cdfTypes.CHAR:
                return 1;
            case Type.cdfTypes.SHORT:
                return 2;
            case Type.cdfTypes.INT:
                return 4;
            case Type.cdfTypes.FLOAT:
                return 4;
            case Type.cdfTypes.DOUBLE:
                return 8;
            /* istanbul ignore next */
            default:
                return -1;
        }
    }
    Type.num2bytes = num2bytes;
    /**
     * Reverse search of num2str
     * @ignore
     * @param {string} type - string that represents the type
     * @return {number} - parsed value of the type
     */
    function str2num(type) {
        switch (String(type)) {
            case 'byte':
                return Type.cdfTypes.BYTE;
            case 'char':
                return Type.cdfTypes.CHAR;
            case 'short':
                return Type.cdfTypes.SHORT;
            case 'int':
                return Type.cdfTypes.INT;
            case 'float':
                return Type.cdfTypes.FLOAT;
            case 'double':
                return Type.cdfTypes.DOUBLE;
            /* istanbul ignore next */
            default:
                return -1;
        }
    }
    Type.str2num = str2num;
    /**
     * Auxiliary function to read numeric data
     * @ignore
     * @param {number} size - Size of the element to read
     * @param {function} bufferReader - Function to read next value
     * @return {Array<number>|number}
     */
    function readNumber(size, bufferReader) {
        if (size !== 1) {
            var numbers = new Array(size);
            for (var i = 0; i < size; i++) {
                numbers[i] = bufferReader();
            }
            return numbers;
        }
        else {
            return bufferReader();
        }
    }
    Type.readNumber = readNumber;
    /**
     * Given a type and a size reads the next element
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @param {number} type - Type of the data to read
     * @param {number} size - Size of the element to read
     * @return {string|Array<number>|number}
     */
    function readType(buffer, type, size) {
        switch (type) {
            case Type.cdfTypes.BYTE:
                return buffer.readBytes(size);
            case Type.cdfTypes.CHAR:
                return trimNull(buffer.readChars(size));
            case Type.cdfTypes.SHORT:
                return readNumber(size, buffer.readInt16.bind(buffer));
            case Type.cdfTypes.INT:
                return readNumber(size, buffer.readInt32.bind(buffer));
            case Type.cdfTypes.FLOAT:
                return readNumber(size, buffer.readFloat32.bind(buffer));
            case Type.cdfTypes.DOUBLE:
                return readNumber(size, buffer.readFloat64.bind(buffer));
            /* istanbul ignore next */
            default:
                utils.notNetcdf(true, "non valid type ".concat(type));
                return undefined;
        }
    }
    Type.readType = readType;
    /**
     * Removes null terminate value
     * @ignore
     * @param {string} value - String to trim
     * @return {string} - Trimmed string
     */
    function trimNull(value) {
        if (value.charCodeAt(value.length - 1) === 0) {
            return value.substring(0, value.length - 1);
        }
        return value;
    }
    Type.trimNull = trimNull;
})(Type || (Type = {}));
var Type;
(function (Type) {
    /**
     * data types in netcdf data file
     *
     * The data types supported by netCDF are character, byte, short, long, float,
     * and double. These data types are maintained in the netCDF raster layer,
     * feature layer, or table created from a netCDF file.
     *
     * > https://pro.arcgis.com/en/pro-app/latest/help/data/multidimensional/data-types-supported-by-netcdf.htm
     */
    Type.cdfTypes = {
        BYTE: 1,
        CHAR: 2,
        SHORT: 3,
        INT: 4,
        FLOAT: 5,
        DOUBLE: 6
    };
})(Type || (Type = {}));
//# sourceMappingURL=netcdf.js.map