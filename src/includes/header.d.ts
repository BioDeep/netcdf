interface netcdfHeader {

    version?: number;
    globalAttributes?: attribute[];
    variables?: variable[];
    dimensions?: dimension[];

    recordDimension: {
        length: number;
        id?: number;
        name?: string;
        recordStep?: number;
    }


}

interface dimension {
    name: string;
    size: number;
}

interface variable {
    name: string;
    dimensions: number[];
    attributes: attribute[];
    type: string;
    size: number;
    offset: number;
    record: boolean;
}

interface attribute {
    name: string;
    type: string;
    value: any;
}