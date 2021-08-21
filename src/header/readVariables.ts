module header {
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
    export function variablesList(buffer: IOBuffer, recordId: number, version: number) {
        const varList = buffer.readUint32();

        if (varList === ZERO) {
            utils.notNetcdf((buffer.readUint32() !== ZERO), 'wrong empty tag for list of variables');
            return {
                variables: [],
                recordStep: null
            };
        } else {
            utils.notNetcdf((varList !== NC_VARIABLE), 'wrong tag for list of variables');
            return readInternal(buffer, recordId, version);
        }
    }

    function readInternal(buffer: IOBuffer, recordId: number, version: number) {
        // Length of variables
        const variableSize = buffer.readUint32();

        var variables: variable[] = new Array(variableSize);
        var recordStep = 0;

        for (var v = 0; v < variableSize; v++) {
            // Read name
            var name = utils.readName(buffer);

            // Read dimensionality of the variable
            const dimensionality = buffer.readUint32();

            // Index into the list of dimensions
            var dimensionsIds = new Array(dimensionality);
            for (var dim = 0; dim < dimensionality; dim++) {
                dimensionsIds[dim] = buffer.readUint32();
            }

            // Read variables size
            var attributes = attributesList(buffer);

            // Read type
            var type = buffer.readUint32();
            utils.notNetcdf(((type < 1) && (type > 6)), `non valid type ${type}`);

            // Read variable size
            // The 32-bit varSize field is not large enough to contain the size of variables that require
            // more than 2^32 - 4 bytes, so 2^32 - 1 is used in the varSize field for such variables.
            const varSize = buffer.readUint32();

            // Read offset
            var offset = buffer.readUint32();
            if (version === 2) {
                utils.notNetcdf((offset > 0), 'offsets larger than 4GB not supported');
                offset = buffer.readUint32();
            }

            let record = false;
            // Count amount of record variables
            if ((typeof recordId !== 'undefined') && (dimensionsIds[0] === recordId)) {
                recordStep += varSize;
                record = true;
            }
            variables[v] = {
                name: name,
                dimensions: dimensionsIds,
                attributes,
                type: global.type.num2str(type),
                size: varSize, offset, record
            };
        }

        return {
            variables: variables,
            recordStep: recordStep
        };
    }
}