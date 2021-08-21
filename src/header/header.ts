interface netcdfHeader {

    version?: number;
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