///<reference path="IOBuffer.d.ts" />
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
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
        utils.notNetcdf(variable === undefined, "variable not found: " + variableName);
        // go to the offset position
        this.buffer.seek(variable.offset);
        if (variable.record) {
            // record variable case
            return data.record(this.buffer, variable, this.header.recordDimension);
        }
        else {
            // non-record variable case
            return data.nonRecord(this.buffer, variable);
        }
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
    return NetCDFReader;
}());
var debug;
(function (debug) {
    function toString(cdf) {
        var result = [];
        result.push('DIMENSIONS');
        for (var _i = 0, _a = cdf.dimensions; _i < _a.length; _i++) {
            var dimension = _a[_i];
            result.push("  " + dimension.name.padEnd(30) + " = size: " + dimension.size);
        }
        result.push('');
        result.push('GLOBAL ATTRIBUTES');
        for (var _b = 0, _c = cdf.globalAttributes; _b < _c.length; _b++) {
            var attribute = _c[_b];
            result.push("  " + attribute.name.padEnd(30) + " = " + attribute.value);
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
                stringify += " (length: " + variable.value.length + ")";
            }
            result.push("  " + variable.name.padEnd(30) + " = " + stringify);
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
            throw new TypeError("Not a valid NetCDF v3.x file: " + reason);
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
        return new Uint8Array(data);
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
            utils.notNetcdf(((type < 1) || (type > 6)), "non valid type " + type);
            // Read attribute
            var size = buffer.readUint32();
            var value = global.type.readType(buffer, type, size);
            // Apply padding
            utils.padding(buffer);
            attributes[gAtt] = {
                name: name,
                type: global.type.num2str(type),
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
            utils.notNetcdf(((type < 1) && (type > 6)), "non valid type " + type);
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
                type: global.type.num2str(type),
                size: varSize, offset: offset, record: record
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
var data;
(function (data_1) {
    data_1.STREAMING = 4294967295;
    /**
     * Read data for the given non-record variable
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @param {object} variable - Variable metadata
     * @return {Array} - Data of the element
     */
    function nonRecord(buffer, variable) {
        // variable type
        var type = global.type.str2num(variable.type);
        // size of the data
        var size = variable.size / global.type.num2bytes(type);
        // iterates over the data
        var data = new Array(size);
        for (var i = 0; i < size; i++) {
            data[i] = global.type.readType(buffer, type, 1);
        }
        return data;
    }
    data_1.nonRecord = nonRecord;
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
        var type = global.type.str2num(variable.type);
        var width = variable.size ? variable.size / global.type.num2bytes(type) : 1;
        // size of the data
        // TODO streaming data
        var size = recordDimension.length;
        // iterates over the data
        var data = new Array(size);
        var step = recordDimension.recordStep;
        for (var i = 0; i < size; i++) {
            var currentOffset = buffer.offset;
            data[i] = global.type.readType(buffer, type, width);
            buffer.seek(currentOffset + step);
        }
        return data;
    }
    data_1.record = record;
})(data || (data = {}));
var type;
(function (type_1) {
    /**
    * Parse a number into their respective type
    * @ignore
    * @param {number} type - integer that represents the type
    * @return {string} - parsed value of the type
    */
    function num2str(type) {
        switch (Number(type)) {
            case type_1.types.BYTE:
                return 'byte';
            case type_1.types.CHAR:
                return 'char';
            case type_1.types.SHORT:
                return 'short';
            case type_1.types.INT:
                return 'int';
            case type_1.types.FLOAT:
                return 'float';
            case type_1.types.DOUBLE:
                return 'double';
            /* istanbul ignore next */
            default:
                return 'undefined';
        }
    }
    type_1.num2str = num2str;
    /**
     * Parse a number type identifier to his size in bytes
     * @ignore
     * @param {number} type - integer that represents the type
     * @return {number} -size of the type
     */
    function num2bytes(type) {
        switch (Number(type)) {
            case type_1.types.BYTE:
                return 1;
            case type_1.types.CHAR:
                return 1;
            case type_1.types.SHORT:
                return 2;
            case type_1.types.INT:
                return 4;
            case type_1.types.FLOAT:
                return 4;
            case type_1.types.DOUBLE:
                return 8;
            /* istanbul ignore next */
            default:
                return -1;
        }
    }
    type_1.num2bytes = num2bytes;
    /**
     * Reverse search of num2str
     * @ignore
     * @param {string} type - string that represents the type
     * @return {number} - parsed value of the type
     */
    function str2num(type) {
        switch (String(type)) {
            case 'byte':
                return type_1.types.BYTE;
            case 'char':
                return type_1.types.CHAR;
            case 'short':
                return type_1.types.SHORT;
            case 'int':
                return type_1.types.INT;
            case 'float':
                return type_1.types.FLOAT;
            case 'double':
                return type_1.types.DOUBLE;
            /* istanbul ignore next */
            default:
                return -1;
        }
    }
    type_1.str2num = str2num;
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
    type_1.readNumber = readNumber;
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
            case type_1.types.BYTE:
                return buffer.readBytes(size);
            case type_1.types.CHAR:
                return trimNull(buffer.readChars(size));
            case type_1.types.SHORT:
                return readNumber(size, buffer.readInt16.bind(buffer));
            case type_1.types.INT:
                return readNumber(size, buffer.readInt32.bind(buffer));
            case type_1.types.FLOAT:
                return readNumber(size, buffer.readFloat32.bind(buffer));
            case type_1.types.DOUBLE:
                return readNumber(size, buffer.readFloat64.bind(buffer));
            /* istanbul ignore next */
            default:
                utils.notNetcdf(true, "non valid type " + type);
                return undefined;
        }
    }
    type_1.readType = readType;
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
    type_1.trimNull = trimNull;
})(type || (type = {}));
var type;
(function (type) {
    /**
     * data types in netcdf data file
     *
     * The data types supported by netCDF are character, byte, short, long, float,
     * and double. These data types are maintained in the netCDF raster layer,
     * feature layer, or table created from a netCDF file.
     *
     * > https://pro.arcgis.com/en/pro-app/latest/help/data/multidimensional/data-types-supported-by-netcdf.htm
     */
    type.types = {
        BYTE: 1,
        CHAR: 2,
        SHORT: 3,
        INT: 4,
        FLOAT: 5,
        DOUBLE: 6
    };
})(type || (type = {}));
//# sourceMappingURL=netcdf.js.map