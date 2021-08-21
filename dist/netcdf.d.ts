/**
 * Reads a NetCDF v3.x file
 *
 * https://www.unidata.ucar.edu/software/netcdf/docs/file_format_specifications.html
 * https://github.com/cheminfo/netcdfjs
 *
 * @param {ArrayBuffer} data - ArrayBuffer or any Typed Array (including Node.js' Buffer from v4) with the data
 * @constructor
 */
declare class NetCDFReader {
    header: netcdfHeader;
    buffer: IOBuffer;
    /**
     * @return {string} - Version for the NetCDF format
     */
    readonly version: "classic format" | "64-bit offset format";
    /**
     * @return {object} - Metadata for the record dimension
     *  * `length`: Number of elements in the record dimension
     *  * `id`: Id number in the list of dimensions for the record dimension
     *  * `name`: String with the name of the record dimension
     *  * `recordStep`: Number with the record variables step size
     */
    readonly recordDimension: {
        length: number;
        id?: number;
        name?: string;
        recordStep?: number;
    };
    /**
     * @return {Array<object>} - List of dimensions with:
     *  * `name`: String with the name of the dimension
     *  * `size`: Number with the size of the dimension
     */
    readonly dimensions: dimension[];
    /**
     * @return {Array<object>} - List of global attributes with:
     *  * `name`: String with the name of the attribute
     *  * `type`: String with the type of the attribute
     *  * `value`: A number or string with the value of the attribute
     */
    readonly globalAttributes: attribute[];
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
    readonly variables: variable[];
    constructor(data: number[] | ArrayBuffer);
    /**
     * Returns the value of an attribute
     * @param {string} attributeName
     * @return {string} Value of the attributeName or null
     */
    getAttribute(attributeName: string): any;
    /**
     * Returns the value of a variable as a string
     * @param {string} variableName
     * @return {string} Value of the variable as a string or null
     */
    getDataVariableAsString(variableName: string): string;
    toString(): string;
    /**
     * Retrieves the data for a given variable
     * @param {string|object} variableName - Name of the variable to search or variable object
     * @return {Array} - List with the variable values
     */
    getDataVariable(variableName: string): any[];
    /**
     * Check if a dataVariable exists
     * @param {string} variableName - Name of the variable to find
     * @return {boolean}
     */
    dataVariableExists(variableName: string): boolean;
    /**
     * Check if an attribute exists
     * @param {string} attributeName - Name of the attribute to find
     * @return {boolean}
     */
    attributeExists(attributeName: string): boolean;
    static fetch(url: string, callback: XhrFetch): void;
}
interface XhrFetch {
    (netcdf: NetCDFReader): void;
}
declare namespace debug {
    function toString(cdf: NetCDFReader): string;
}
declare namespace utils {
    /**
     * Throws a non-valid NetCDF exception if the statement it's true
     * @ignore
     * @param {boolean} statement - Throws if true
     * @param {string} reason - Reason to throw
     */
    function notNetcdf(statement: any, reason: any): void;
    /**
     * Moves 1, 2, or 3 bytes to next 4-byte boundary
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     */
    function padding(buffer: any): void;
    function createInputBuffer(data: number[] | ArrayBuffer): InputData;
    /**
     * Reads the name
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @return {string} - Name
     */
    function readName(buffer: any): any;
}
declare module header {
    /**
     * List of attributes
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @return {Array<object>} - List of attributes with:
     *  * `name`: String with the name of the attribute
     *  * `type`: String with the type of the attribute
     *  * `value`: A number or string with the value of the attribute
     */
    function attributesList(buffer: any): attribute[];
}
declare module header {
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
    function dimensionsList(buffer: any): {
        dimensions: dimension[];
        recordId: number;
        recordName: string;
    };
}
declare module header {
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
    function variablesList(buffer: IOBuffer, recordId: number, version: number): {
        variables: variable[];
        recordStep: number;
    };
}
declare module header {
    const ZERO = 0;
    const NC_DIMENSION = 10;
    const NC_VARIABLE = 11;
    const NC_ATTRIBUTE = 12;
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
    function readHeader(buffer: IOBuffer, version: number): netcdfHeader;
}
declare const defaultByteLength: number;
declare type InputData = number | ArrayBufferLike | ArrayBufferView | IOBuffer | Buffer;
interface IOBufferOptions {
    /**
     * Ignore the first n bytes of the ArrayBuffer.
     */
    offset?: number;
}
declare class IOBuffer {
    /**
     * Reference to the internal ArrayBuffer object.
     */
    buffer: ArrayBufferLike;
    /**
     * Byte length of the internal ArrayBuffer.
     */
    byteLength: number;
    /**
     * Byte offset of the internal ArrayBuffer.
     */
    byteOffset: number;
    /**
     * Byte length of the internal ArrayBuffer.
     */
    length: number;
    /**
     * The current offset of the buffer's pointer.
     */
    offset: number;
    private lastWrittenByte;
    private littleEndian;
    private _data;
    private _mark;
    private _marks;
    /**
     * @param data - The data to construct the IOBuffer with.
     * If data is a number, it will be the new buffer's length<br>
     * If data is `undefined`, the buffer will be initialized with a default length of 8Kb<br>
     * If data is an ArrayBuffer, SharedArrayBuffer, an ArrayBufferView (Typed Array), an IOBuffer instance,
     * or a Node.js Buffer, a view will be created over the underlying ArrayBuffer.
     * @param options
     */
    constructor(data?: InputData, options?: IOBufferOptions);
    /**
     * Checks if the memory allocated to the buffer is sufficient to store more
     * bytes after the offset.
     * @param byteLength - The needed memory in bytes.
     * @returns `true` if there is sufficient space and `false` otherwise.
     */
    available(byteLength?: number): boolean;
    /**
     * Check if little-endian mode is used for reading and writing multi-byte
     * values.
     * @returns `true` if little-endian mode is used, `false` otherwise.
     */
    isLittleEndian(): boolean;
    /**
     * Set little-endian mode for reading and writing multi-byte values.
     */
    setLittleEndian(): this;
    /**
     * Check if big-endian mode is used for reading and writing multi-byte values.
     * @returns `true` if big-endian mode is used, `false` otherwise.
     */
    isBigEndian(): boolean;
    /**
     * Switches to big-endian mode for reading and writing multi-byte values.
     */
    setBigEndian(): this;
    /**
     * Move the pointer n bytes forward.
     * @param n - Number of bytes to skip.
     */
    skip(n?: number): this;
    /**
     * Move the pointer to the given offset.
     * @param offset
     */
    seek(offset: number): this;
    /**
     * Store the current pointer offset.
     * @see {@link IOBuffer#reset}
     */
    mark(): this;
    /**
     * Move the pointer back to the last pointer offset set by mark.
     * @see {@link IOBuffer#mark}
     */
    reset(): this;
    /**
     * Push the current pointer offset to the mark stack.
     * @see {@link IOBuffer#popMark}
     */
    pushMark(): this;
    /**
     * Pop the last pointer offset from the mark stack, and set the current
     * pointer offset to the popped value.
     * @see {@link IOBuffer#pushMark}
     */
    popMark(): this;
    /**
     * Move the pointer offset back to 0.
     */
    rewind(): this;
    /**
     * Make sure the buffer has sufficient memory to write a given byteLength at
     * the current pointer offset.
     * If the buffer's memory is insufficient, this method will create a new
     * buffer (a copy) with a length that is twice (byteLength + current offset).
     * @param byteLength
     */
    ensureAvailable(byteLength?: number): this;
    /**
     * Read a byte and return false if the byte's value is 0, or true otherwise.
     * Moves pointer forward by one byte.
     */
    readBoolean(): boolean;
    /**
     * Read a signed 8-bit integer and move pointer forward by 1 byte.
     */
    readInt8(): number;
    /**
     * Read an unsigned 8-bit integer and move pointer forward by 1 byte.
     */
    readUint8(): number;
    /**
     * Alias for {@link IOBuffer#readUint8}.
     */
    readByte(): number;
    /**
     * Read `n` bytes and move pointer forward by `n` bytes.
     */
    readBytes(n?: number): Uint8Array;
    /**
     * Read a 16-bit signed integer and move pointer forward by 2 bytes.
     */
    readInt16(): number;
    /**
     * Read a 16-bit unsigned integer and move pointer forward by 2 bytes.
     */
    readUint16(): number;
    /**
     * Read a 32-bit signed integer and move pointer forward by 4 bytes.
     */
    readInt32(): number;
    /**
     * Read a 32-bit unsigned integer and move pointer forward by 4 bytes.
     */
    readUint32(): number;
    /**
     * Read a 32-bit floating number and move pointer forward by 4 bytes.
     */
    readFloat32(): number;
    /**
     * Read a 64-bit floating number and move pointer forward by 8 bytes.
     */
    readFloat64(): number;
    /**
     * Read a 1-byte ASCII character and move pointer forward by 1 byte.
     */
    readChar(): string;
    /**
     * Read `n` 1-byte ASCII characters and move pointer forward by `n` bytes.
     */
    readChars(n?: number): string;
    /**
     * Read the next `n` bytes, return a UTF-8 decoded string and move pointer
     * forward by `n` bytes.
     */
    readUtf8(n?: number): string;
    /**
     * Write 0xff if the passed value is truthy, 0x00 otherwise and move pointer
     * forward by 1 byte.
     */
    writeBoolean(value: unknown): this;
    /**
     * Write `value` as an 8-bit signed integer and move pointer forward by 1 byte.
     */
    writeInt8(value: number): this;
    /**
     * Write `value` as an 8-bit unsigned integer and move pointer forward by 1
     * byte.
     */
    writeUint8(value: number): this;
    /**
     * An alias for {@link IOBuffer#writeUint8}.
     */
    writeByte(value: number): this;
    /**
     * Write all elements of `bytes` as uint8 values and move pointer forward by
     * `bytes.length` bytes.
     */
    writeBytes(bytes: ArrayLike<number>): this;
    /**
     * Write `value` as a 16-bit signed integer and move pointer forward by 2
     * bytes.
     */
    writeInt16(value: number): this;
    /**
     * Write `value` as a 16-bit unsigned integer and move pointer forward by 2
     * bytes.
     */
    writeUint16(value: number): this;
    /**
     * Write `value` as a 32-bit signed integer and move pointer forward by 4
     * bytes.
     */
    writeInt32(value: number): this;
    /**
     * Write `value` as a 32-bit unsigned integer and move pointer forward by 4
     * bytes.
     */
    writeUint32(value: number): this;
    /**
     * Write `value` as a 32-bit floating number and move pointer forward by 4
     * bytes.
     */
    writeFloat32(value: number): this;
    /**
     * Write `value` as a 64-bit floating number and move pointer forward by 8
     * bytes.
     */
    writeFloat64(value: number): this;
    /**
     * Write the charCode of `str`'s first character as an 8-bit unsigned integer
     * and move pointer forward by 1 byte.
     */
    writeChar(str: string): this;
    /**
     * Write the charCodes of all `str`'s characters as 8-bit unsigned integers
     * and move pointer forward by `str.length` bytes.
     */
    writeChars(str: string): this;
    /**
     * UTF-8 encode and write `str` to the current pointer offset and move pointer
     * forward according to the encoded length.
     */
    writeUtf8(str: string): this;
    /**
     * Export a Uint8Array view of the internal buffer.
     * The view starts at the byte offset and its length
     * is calculated to stop at the last written byte or the original length.
     */
    toArray(): Uint8Array;
    /**
     * Update the last written byte offset
     * @private
     */
    private _updateLastWrittenByte;
}
declare namespace utf8.polyfill {
}
declare namespace utf8 {
    function decode(bytes: Uint8Array): string;
    function encode(str: string): Uint8Array;
}
declare module Type {
    const STREAMING = 4294967295;
    /**
     * Read data for the given non-record variable
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @param {object} variable - Variable metadata
     * @return {Array} - Data of the element
     */
    function nonRecord(buffer: any, variable: any): any[];
    /**
     * Read data for the given record variable
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @param {object} variable - Variable metadata
     * @param {object} recordDimension - Record dimension metadata
     * @return {Array} - Data of the element
     */
    function record(buffer: any, variable: any, recordDimension: any): any[];
}
declare namespace Type {
    /**
    * Parse a number into their respective type
    * @ignore
    * @param {number} type - integer that represents the type
    * @return {string} - parsed value of the type
    */
    function num2str(type: any): "byte" | "char" | "short" | "int" | "float" | "double" | "undefined";
    /**
     * Parse a number type identifier to his size in bytes
     * @ignore
     * @param {number} type - integer that represents the type
     * @return {number} -size of the type
     */
    function num2bytes(type: any): 1 | 2 | 4 | -1 | 8;
    /**
     * Reverse search of num2str
     * @ignore
     * @param {string} type - string that represents the type
     * @return {number} - parsed value of the type
     */
    function str2num(type: any): number;
    /**
     * Auxiliary function to read numeric data
     * @ignore
     * @param {number} size - Size of the element to read
     * @param {function} bufferReader - Function to read next value
     * @return {Array<number>|number}
     */
    function readNumber(size: any, bufferReader: any): any;
    /**
     * Given a type and a size reads the next element
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @param {number} type - Type of the data to read
     * @param {number} size - Size of the element to read
     * @return {string|Array<number>|number}
     */
    function readType(buffer: IOBuffer, type: number, size: number): any;
    /**
     * Removes null terminate value
     * @ignore
     * @param {string} value - String to trim
     * @return {string} - Trimmed string
     */
    function trimNull(value: string): string;
}
declare namespace Type {
    /**
     * data types in netcdf data file
     *
     * The data types supported by netCDF are character, byte, short, long, float,
     * and double. These data types are maintained in the netCDF raster layer,
     * feature layer, or table created from a netCDF file.
     *
     * > https://pro.arcgis.com/en/pro-app/latest/help/data/multidimensional/data-types-supported-by-netcdf.htm
     */
    const cdfTypes: {
        BYTE: number;
        CHAR: number;
        SHORT: number;
        INT: number;
        FLOAT: number;
        DOUBLE: number;
    };
}
