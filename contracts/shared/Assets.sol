pragma solidity ^0.4.23;


library Assets {

    struct Asset {
        bytes32 name;
        uint assetType;
    }

    struct AssetReversed {
        uint id;
        uint assetType;
    }

    function TYPE_CURRENCIES () public pure returns (uint) {
        return 1;
    }

    function TYPE_COMMODITIES () public pure returns (uint) {
        return 2;
    }

    function TYPE_CRYPTO () public pure returns (uint) {
        return 3;
    }

    function TYPE_INDECES () public pure returns (uint) {
        return 4;
    }
}
