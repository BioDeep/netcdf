interface netcdfHeader {

    version?: number;
    globalAttributes?: attribute[];
    variables?: variable[];
    dimensions?: dimension[];

    /**
     * the data variable record dimension size description
    */
    recordDimension: recordDimension;
}

interface recordDimension {
    length: number;
    id?: number;
    name?: string;
    recordStep?: number;
}

interface dimension {
    name: string;
    size: number;
}

interface variable extends keyindex {
    dimensions: number[];
    attributes: attribute[];
    type: string;
    size: number;
    offset: number;
    record: boolean;
}

interface attribute extends keyindex {
    type: string;
    value: any;
}

interface keyindex {
    name: string;
}