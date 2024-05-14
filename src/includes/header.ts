namespace header {

    export interface netcdfHeader {

        version?: number;
        globalAttributes?: attribute[];
        variables?: variable[];
        dimensions?: dimension[];

        /**
         * the data variable record dimension size description
        */
        recordDimension: recordDimension;
    }

    export interface recordDimension {
        length: number;
        id?: number;
        name?: string;
        recordStep?: number;
    }

    export interface dimension {
        name: string;
        size: number;
    }

    export interface variable extends keyindex {
        dimensions: number[];
        attributes: attribute[];
        type: string;
        size: number;
        offset: number;
        record: boolean;
    }

    export interface attribute extends keyindex {
        type: string;
        value: any;
    }

    export interface keyindex {
        name: string;
    }
}