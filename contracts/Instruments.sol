pragma solidity ^0.4.23;

import "./shared/Owned.sol";


contract Instruments is Owned {

    uint constant public TYPE_CURRENCIES = 1;
    uint constant public TYPE_COMMODITIES = 2;
    uint constant public TYPE_CRYPTO = 3;
    uint constant public TYPE_INDECES = 4;

    struct Asset {
        string name;
        uint assetType;
    }

    event InstrumentAdded(address indexed _owner, uint indexed _id, string _name, uint _type);
    event InstrumentRemoved(address indexed _owner, uint indexed _id);

    mapping (uint => Asset) public instruments;

    function add(uint _id, string _name, uint _type) external onlyOwner {
        instruments[_id] = Asset(_name, _type);
        emit InstrumentAdded(msg.sender, _id, _name, _type);
    }

    function remove(uint _id) external onlyOwner {
        delete instruments[_id];
        emit InstrumentRemoved(msg.sender, _id);
    }

    function isCorrect(uint _id) public view returns (bool) {
        return (
            instruments[_id].assetType == TYPE_CURRENCIES ||
            instruments[_id].assetType == TYPE_CRYPTO ||
            instruments[_id].assetType == TYPE_COMMODITIES ||
            instruments[_id].assetType == TYPE_INDECES
        );
    }

    // TODO: add oraclaized instrument quotes discovering according to liquidity provider
}
