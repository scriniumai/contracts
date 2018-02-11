pragma solidity ^0.4.18;

import "../libs/Owned.sol";

contract Instruments is Owned {

    uint constant TYPE_CURRENCIES = 1;
    uint constant TYPE_CRYPTO = 2;
    uint constant TYPE_COMMODITIES = 3;

    struct Asset {
        string name;
        uint assetType;
    }

    mapping (uint => Asset) public data;

    function isCorrect(uint _id) public view returns (bool) {
        return data[_id].assetType > 0;
    }

    function add(uint _id, string _name, uint _type) onlyOwner {
        data[_id] = Asset(_name, _type);
    }

    function remove(uint _id) onlyOwner {
        delete data[_id];
    }
}
