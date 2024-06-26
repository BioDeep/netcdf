///<reference path="./includes/header.ts" />

'use strict';

import netcdfHeader = header.netcdfHeader;
import recordDimension = header.recordDimension;
import variable = header.variable;

/**
 * Reads a NetCDF v3.x file
 * 
 * https://www.unidata.ucar.edu/software/netcdf/docs/file_format_specifications.html
 * https://github.com/cheminfo/netcdfjs
 * 
 * @param {ArrayBuffer} data - ArrayBuffer or any Typed Array (including Node.js' Buffer from v4) with the data
 * @constructor
 */
class NetCDFReader {

    public header: netcdfHeader;
    public buffer: IOBuffer;

    /**
     * @return {string} - Version for the NetCDF format
     */
    get version(): 'classic format' | '64-bit offset format' {
        if (this.header.version === 1) {
            return 'classic format';
        } else {
            return '64-bit offset format';
        }
    }

    /**
     * @return {object} - Metadata for the record dimension
     *  * `length`: Number of elements in the record dimension
     *  * `id`: Id number in the list of dimensions for the record dimension
     *  * `name`: String with the name of the record dimension
     *  * `recordStep`: Number with the record variables step size
     */
    get recordDimension(): recordDimension {
        return this.header.recordDimension;
    }

    /**
     * @return {Array<object>} - List of dimensions with:
     *  * `name`: String with the name of the dimension
     *  * `size`: Number with the size of the dimension
     */
    get dimensions() {
        return this.header.dimensions;
    }

    /**
     * @return {Array<object>} - List of global attributes with:
     *  * `name`: String with the name of the attribute
     *  * `type`: String with the type of the attribute
     *  * `value`: A number or string with the value of the attribute
     */
    get globalAttributes() {
        return this.header.globalAttributes;
    }

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
    get variables(): variable[] {
        return this.header.variables;
    }

    constructor(data: number[] | ArrayBuffer) {
        // https://github.com/image-js/iobuffer
        // npm i iobuffer
        const buffer = new IOBuffer(utils.createInputBuffer(data));

        buffer.seek(0);
        buffer.setBigEndian();
        // Validate that it's a NetCDF file
        utils.notNetcdf(buffer.readChars(3) !== 'CDF', 'should start with CDF');

        // Check the NetCDF format
        const version = buffer.readByte();
        utils.notNetcdf(version > 2, 'unknown version');

        // Read the header
        this.header = header.readHeader(buffer, version);
        this.buffer = buffer;
    }

    /**
     * Returns the value of an attribute
     * 
     * @param {string} attributeName
     * @return {string} Value of the attributeName or null
     */
    getAttribute(attributeName: string): any {
        const attribute = utils.find(this.globalAttributes, attributeName);
        if (attribute) return attribute.value;
        return null;
    }

    /**
     * Returns the value of a variable as a string
     * @param {string} variableName
     * @return {string} Value of the variable as a string or null
     */
    getDataVariableAsString(variableName: string): string {
        const variable = this.getDataVariable(variableName);
        if (variable) return variable.join('');
        return null;
    }

    toString(): string {
        return debug.toString(this);
    }

    /**
     * Check if a dataVariable exists
     * @param {string} variableName - Name of the variable to find
     * @return {boolean}
     */
    dataVariableExists(variableName: string): boolean {
        const variable = utils.find(this.header.variables, variableName);
        return variable !== undefined;
    }

    /**
     * Check if an attribute exists
     * @param {string} attributeName - Name of the attribute to find
     * @return {boolean}
     */
    attributeExists(attributeName: string) {
        const attribute = utils.find(this.globalAttributes, attributeName);
        return attribute !== undefined;
    }

    /**
     * Retrieves the data for a given variable
     * @param {string|object} variableName - Name of the variable to search or variable object
     * @return {Array} - List with the variable values
     */
    getDataVariable(variableName: string) {
        let variable;
        if (typeof variableName === 'string') {
            // search the variable
            variable = utils.find(this.header.variables, variableName);
        } else {
            variable = variableName;
        }

        // throws if variable not found
        utils.notNetcdf(
            variable === undefined,
            `variable not found: ${variableName}`
        );

        // go to the offset position
        this.buffer.seek(variable.offset);

        if (variable.record) {
            // record variable case
            return Type.record(this.buffer, variable, this.header.recordDimension);
        } else {
            // non-record variable case
            return Type.nonRecord(this.buffer, variable);
        }
    }

    public static fetch(url: string, callback: XhrFetch) {
        const xhr = new XMLHttpRequest();

        xhr.open("GET", url);
        xhr.responseType = 'arraybuffer';
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                const buffer: ArrayBuffer = new Uint8Array(xhr.response);
                const cdf = new NetCDFReader(buffer);

                callback(cdf);
            }
        }
    }
}
