namespace Type {

    /**
    * Parse a number into their respective type
    * @ignore
    * @param {number} type - integer that represents the type
    * @return {string} - parsed value of the type
    */
    export function num2str(type: string | number): 'byte' | 'char' | 'short' | 'int' | 'float' | 'double' | 'undefined' {
        switch (Number(type)) {
            case cdfTypes.BYTE:
                return 'byte';
            case cdfTypes.CHAR:
                return 'char';
            case cdfTypes.SHORT:
                return 'short';
            case cdfTypes.INT:
                return 'int';
            case cdfTypes.FLOAT:
                return 'float';
            case cdfTypes.DOUBLE:
                return 'double';
            /* istanbul ignore next */
            default:
                return 'undefined';
        }
    }

    /**
     * Parse a number type identifier to his size in bytes
     * @ignore
     * @param {number} type - integer that represents the type
     * @return {number} -size of the type
     */
    export function num2bytes(type: number | string) {
        switch (Number(type)) {
            case cdfTypes.BYTE:
                return 1;
            case cdfTypes.CHAR:
                return 1;
            case cdfTypes.SHORT:
                return 2;
            case cdfTypes.INT:
                return 4;
            case cdfTypes.FLOAT:
                return 4;
            case cdfTypes.DOUBLE:
                return 8;
            /* istanbul ignore next */
            default:
                return -1;
        }
    }

    /**
     * Reverse search of num2str
     * @ignore
     * @param {string} type - string that represents the type
     * @return {number} - parsed value of the type
     */
    export function str2num(type: string) {
        switch (String(type)) {
            case 'byte':
                return cdfTypes.BYTE;
            case 'char':
                return cdfTypes.CHAR;
            case 'short':
                return cdfTypes.SHORT;
            case 'int':
                return cdfTypes.INT;
            case 'float':
                return cdfTypes.FLOAT;
            case 'double':
                return cdfTypes.DOUBLE;
            /* istanbul ignore next */
            default:
                return -1;
        }
    }

    /**
     * Auxiliary function to read numeric data
     * @ignore
     * @param {number} size - Size of the element to read
     * @param {function} bufferReader - Function to read next value
     * @return {Array<number>|number}
     */
    export function readNumber(size: number, bufferReader: () => number) {
        if (size !== 1) {
            var numbers: number[] = new Array(size);
            for (var i = 0; i < size; i++) {
                numbers[i] = bufferReader();
            }
            return numbers;
        } else {
            return bufferReader();
        }
    }

    /**
     * Given a type and a size reads the next element
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @param {number} type - Type of the data to read
     * @param {number} size - Size of the element to read
     * @return {string|Array<number>|number}
     */
    export function readType(buffer: IOBuffer, type: number, size: number) {
        switch (type) {
            case cdfTypes.BYTE:
                return buffer.readBytes(size);
            case cdfTypes.CHAR:
                return trimNull(buffer.readChars(size));
            case cdfTypes.SHORT:
                return readNumber(size, buffer.readInt16.bind(buffer));
            case cdfTypes.INT:
                return readNumber(size, buffer.readInt32.bind(buffer));
            case cdfTypes.FLOAT:
                return readNumber(size, buffer.readFloat32.bind(buffer));
            case cdfTypes.DOUBLE:
                return readNumber(size, buffer.readFloat64.bind(buffer));
            /* istanbul ignore next */
            default:
                utils.notNetcdf(true, `non valid type ${type}`);
                return undefined;
        }
    }

    /**
     * Removes null terminate value
     * @ignore
     * @param {string} value - String to trim
     * @return {string} - Trimmed string
     */
    export function trimNull(value: string) {
        if (value.charCodeAt(value.length - 1) === 0) {
            return value.substring(0, value.length - 1);
        }
        return value;
    }
}