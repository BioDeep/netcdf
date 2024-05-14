module header {

    const NC_UNLIMITED = 0;

    export interface dimensionList {
        dimensions: dimension[],
        recordId: number,
        recordName: string
    }

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
    export function dimensionsList(buffer: IOBuffer): dimensionList {
        const dimList = buffer.readUint32();

        if (dimList === ZERO) {
            utils.notNetcdf((buffer.readUint32() !== ZERO), 'wrong empty tag for list of dimensions');
            return <dimensionList>{
                dimensions: [],
                recordId: null,
                recordName: null
            };
        } else {
            utils.notNetcdf((dimList !== NC_DIMENSION), 'wrong tag for list of dimensions');
            return readInternal(buffer);
        }
    }

    function readInternal(buffer: IOBuffer): dimensionList {
        // Length of dimensions
        const dimensionSize = buffer.readUint32();

        let recordId: number = null;
        let recordName: string = null;
        let dimensions: dimension[] = new Array(dimensionSize);

        for (var dim = 0; dim < dimensionSize; dim++) {
            // Read name
            const name = utils.readName(buffer);
            // Read dimension size
            const size = buffer.readUint32();

            if (size === NC_UNLIMITED) {
                // in netcdf 3 one field can be of size unlimmited
                recordId = dim;
                recordName = name;
            }

            dimensions[dim] = {
                name: name,
                size: size
            };
        }

        return <dimensionList>{
            dimensions: dimensions,
            recordId: recordId,
            recordName: recordName
        };
    }
}