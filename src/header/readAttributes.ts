///<reference path="../includes/IOBuffer/IOBuffer.ts" />
///<reference path="../includes/header.ts" />

namespace header {

    /**
     * List of attributes
     * @ignore
     * @param {IOBuffer} buffer - Buffer for the file data
     * @return {Array<object>} - List of attributes with:
     *  * `name`: String with the name of the attribute
     *  * `type`: String with the type of the attribute
     *  * `value`: A number or string with the value of the attribute
     */
    export function attributesList(buffer: IOBuffer): attribute[] {
        const gAttList = buffer.readUint32();
        if (gAttList === ZERO) {
            utils.notNetcdf((buffer.readUint32() !== ZERO), 'wrong empty tag for list of attributes');
            return [];
        } else {
            utils.notNetcdf((gAttList !== NC_ATTRIBUTE), 'wrong tag for list of attributes');
            return readInternal(buffer);
        }
    }

    function readInternal(buffer: IOBuffer) {
        // Length of attributes
        const attributeSize = buffer.readUint32();
        const attributes: attribute[] = new Array(attributeSize);

        for (var gAtt = 0; gAtt < attributeSize; gAtt++) {
            // Read name
            var name = utils.readName(buffer);

            // Read type
            var type = buffer.readUint32();
            utils.notNetcdf(((type < 1) || (type > 6)), `non valid type ${type}`);

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
}