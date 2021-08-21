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

}

interface variable {
    name: string;

}

interface attribute {
    name: string;
    type: string;
    value: any;
}