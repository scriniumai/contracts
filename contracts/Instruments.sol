pragma solidity ^0.4.23;

import "./shared/Assets.sol";
import "./shared/Owned.sol";


contract Instruments is Owned {
    event InstrumentAdded(address indexed _owner, uint indexed _id, bytes32 _name, uint _type);
    event InstrumentRemoved(address indexed _owner, uint indexed _id);

    mapping (uint => Assets.Asset) public instruments;

    function add(uint _id, bytes32 _name, uint _type) external onlyOwner {
        instruments[_id] = Assets.Asset(_name, _type);
        emit InstrumentAdded(msg.sender, _id, _name, _type);
    }

    function remove(uint _id) external onlyOwner {
        delete instruments[_id];
        emit InstrumentRemoved(msg.sender, _id);
    }

    function getInstrument (uint _id) external view returns (bytes32, uint) {
        return (instruments[_id].name, instruments[_id].assetType);
    }

    function isCorrect(uint _id) public view returns (bool) {
        return (
            instruments[_id].assetType == Assets.TYPE_CURRENCIES() ||
            instruments[_id].assetType == Assets.TYPE_CRYPTO() ||
            instruments[_id].assetType == Assets.TYPE_COMMODITIES() ||
            instruments[_id].assetType == Assets.TYPE_INDECES()
        );
    }

    // TODO: add oraclaized instrument quotes discovering according to liquidity provider
}
