pragma solidity ^0.4.23;

import "./shared/Owned.sol";


contract Instruments is Owned {

    uint constant public TYPE_CURRENCIES = 1;
    uint constant public TYPE_CRYPTO = 2;
    uint constant public TYPE_COMMODITIES = 3;
    uint constant public TYPE_INDECES = 4;

    struct Asset {
        string name;
        uint assetType;
    }

    mapping (uint => Asset) public data;

    function add(uint _id, string _name, uint _type) external onlyOwner {
        data[_id] = Asset(_name, _type);
    }

    function remove(uint _id) external onlyOwner {
        delete data[_id];
    }

    function isCorrect(uint _id) public view returns (bool) {
        return (
            data[_id].assetType == TYPE_CURRENCIES ||
            data[_id].assetType == TYPE_CRYPTO ||
            data[_id].assetType == TYPE_COMMODITIES ||
            data[_id].assetType == TYPE_INDECES
        );
    }
}
