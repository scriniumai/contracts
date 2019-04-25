pragma solidity 0.5.0;


import "./shared/Assets.sol";
import "./shared/Owned.sol";


contract Instruments is Owned {
    event InstrumentAdded(address indexed _owner, uint indexed _id, bytes32 indexed _name, uint _type);
    event InstrumentRemoved(address indexed _owner, uint indexed _id, bytes32 indexed _name, uint _type);

    mapping (uint => Assets.Asset) public instruments;
    mapping (bytes32 => Assets.AssetReversed) public instrumentsReversed;

    function add(uint _id, bytes32 _name, uint _type) external onlyOwner {
        instruments[_id] = Assets.Asset(_name, _type);
        instrumentsReversed[_name] = Assets.AssetReversed(_id, _type);

        emit InstrumentAdded(msg.sender, _id, _name, _type);
    }

    function remove(uint _id) external onlyOwner {
        bytes32 _name = instruments[_id].name;
        uint _type = instruments[_id].assetType;

        delete instruments[_id];
        delete instrumentsReversed[_name];

        emit InstrumentRemoved(msg.sender, _id, _name, _type);
    }

    function getInstrument (uint _id) external view returns (bytes32, uint) {
        return (instruments[_id].name, instruments[_id].assetType);
    }

    function getInstrumentByName (bytes32 _name) external view returns (uint, uint) {
        return (instrumentsReversed[_name].id, instrumentsReversed[_name].assetType);
    }

    function isCorrect(uint _id) public view returns (bool) {
        return (
            instruments[_id].assetType == Assets.TYPE_CURRENCIES() ||
            instruments[_id].assetType == Assets.TYPE_CRYPTO() ||
            instruments[_id].assetType == Assets.TYPE_COMMODITIES() ||
            instruments[_id].assetType == Assets.TYPE_INDECES()
        );
    }
}
