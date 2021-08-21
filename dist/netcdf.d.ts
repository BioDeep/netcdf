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
    constructor(data: number[] | Buffer);
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
    function createInputBuffer(data: number[] | Buffer): InputData;
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
declare module data {
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
declare namespace type {
    /**
    * Parse a number into their respective type
    * @ignore
    * @param {number} type - integer that represents the type
    * @return {string} - parsed value of the type
    */
    function num2str(type: any): "undefined" | "byte" | "char" | "short" | "int" | "float" | "double";
    /**
     * Parse a number type identifier to his size in bytes
     * @ignore
     * @param {number} type - integer that represents the type
     * @return {number} -size of the type
     */
    function num2bytes(type: any): 1 | 2 | 4 | 8 | -1;
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
declare namespace type {
    /**
     * data types in netcdf data file
     *
     * The data types supported by netCDF are character, byte, short, long, float,
     * and double. These data types are maintained in the netCDF raster layer,
     * feature layer, or table created from a netCDF file.
     *
     * > https://pro.arcgis.com/en/pro-app/latest/help/data/multidimensional/data-types-supported-by-netcdf.htm
     */
    const types: {
        BYTE: number;
        CHAR: number;
        SHORT: number;
        INT: number;
        FLOAT: number;
        DOUBLE: number;
    };
}
