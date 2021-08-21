'use strict';

namespace type {

    /**
     * data types in netcdf data file
     * 
     * The data types supported by netCDF are character, byte, short, long, float, 
     * and double. These data types are maintained in the netCDF raster layer, 
     * feature layer, or table created from a netCDF file.
     * 
     * > https://pro.arcgis.com/en/pro-app/latest/help/data/multidimensional/data-types-supported-by-netcdf.htm
     */
    export const cdfTypes = {
        BYTE: 1,
        CHAR: 2,
        SHORT: 3,
        INT: 4,
        FLOAT: 5,
        DOUBLE: 6
    };
}
