'use strict';

namespace debug {

    export function toString(cdf: NetCDFReader): string {
        let result: string[] = [];

        result.push('DIMENSIONS');
        for (let dimension of cdf.dimensions) {
            result.push(`  ${dimension.name.padEnd(30)} = size: ${dimension.size}`);
        }

        result.push('');
        result.push('GLOBAL ATTRIBUTES');
        for (let attribute of cdf.globalAttributes) {
            result.push(`  ${attribute.name.padEnd(30)} = ${attribute.value}`);
        }

        let variables = JSON.parse(JSON.stringify(cdf.variables));
        result.push('');
        result.push('VARIABLES:');
        for (let variable of variables) {
            variable.value = cdf.getDataVariable(variable);
            let stringify = JSON.stringify(variable.value);
            if (stringify.length > 50) stringify = stringify.substring(0, 50);
            if (!isNaN(variable.value.length)) {
                stringify += ` (length: ${variable.value.length})`;
            }
            result.push(`  ${variable.name.padEnd(30)} = ${stringify}`);
        }

        return result.join('\n');
    }

}
