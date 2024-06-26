'use strict';

namespace utils {

    /**
     * Throws a non-valid NetCDF exception if the statement it's true
     * @ignore
     * @param {boolean} statement - Throws if true
     * @param {string} reason - Reason to throw
     */
    export function notNetcdf(statement: boolean, reason: string) {
        if (statement) {
            throw new TypeError(`Not a valid NetCDF v3.x file: ${reason}`);
        }
    }

    /**
     * Moves 1, 2, or 3 bytes to next 4-byte boundary
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     */
    export function padding(buffer: IOBuffer) {
        if ((buffer.offset % 4) !== 0) {
            buffer.skip(4 - (buffer.offset % 4));
        }
    }

    export function createInputBuffer(data: number[] | ArrayBuffer): InputData {
        if (!data || data == undefined) {
            throw "empty data is not allowed!";
        } else if (data instanceof ArrayBuffer) {
            return data;
        } else {
            return new Uint8Array(data);
        }
    }

    /**
     * Reads the name
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @return {string} - Name
     */
    export function readName(buffer: IOBuffer) {
        // Read name
        var nameLength = buffer.readUint32();
        var name = buffer.readChars(nameLength);

        // validate name
        // TODO

        // Apply padding
        padding(buffer);
        return name;
    }

    export function find<T extends header.keyindex>(data: T[], key: string): T {
        for (let o of data) {
            if (o.name === key) {
                return o;
            }
        }

        return null;
    }
}
