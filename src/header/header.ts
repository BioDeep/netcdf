interface netcdfHeader {

    version?: string;
    globalAttributes?: {};
    variables?: {};
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