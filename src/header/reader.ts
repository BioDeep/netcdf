///<reference path="../includes/IOBuffer/IOBuffer.ts" />
///<reference path="../includes/header.ts" />

'use strict';

module header {

    // Grammar constants
    export const ZERO = 0;
    export const NC_DIMENSION = 10;
    export const NC_VARIABLE = 11;
    export const NC_ATTRIBUTE = 12;

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
    export function readHeader(buffer: IOBuffer, version: number): netcdfHeader {
        // Length of record dimension
        // sum of the varSize's of all the record variables.
        const header: netcdfHeader = { recordDimension: { length: buffer.readUint32() } };

        // Version
        header.version = version;

        // List of dimensions
        const dimList = dimensionsList(buffer);
        header.recordDimension.id = dimList.recordId; // id of the unlimited dimension
        header.recordDimension.name = dimList.recordName; // name of the unlimited dimension
        header.dimensions = dimList.dimensions;

        // List of global attributes
        header.globalAttributes = attributesList(buffer);

        // List of variables
        const variables = variablesList(buffer, dimList.recordId, version);
        header.variables = variables.variables;
        header.recordDimension.recordStep = variables.recordStep;

        return header;
    }

}
