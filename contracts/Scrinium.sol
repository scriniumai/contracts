pragma solidity ^0.4.18;

import "./shared/ERC20.sol";
import "./shared/Owned.sol";
import "./shared/SafeMath.sol";


// NOTE: This contract was changed only for testing purposes!
contract Scrinium is ERC20, Owned {

    using SafeMath for uint256;

    string public name = "Scrinium";
    string public symbol = "SCR";
    uint256 public decimals = 8;
    uint256 multiplier = 100000000;

    uint256 public totalSupply;
    uint256 public hardcap = 180000000;

    uint256 public constant startTime = 1514678400; //5.12.2017
    uint256 public constant stopTime = 1521590400; //21.03.2018

    mapping (address => uint256) balance;
    mapping (address => mapping (address => uint256)) allowed;

    bool IS_TESTNET = false;
    uint16 constant NET_MAIN = 1;
    uint16 constant NET_ROPSTEN = 3;
    uint16 constant NET_RINKEBY = 4;
    uint16 constant NET_KOVAN = 42;
    uint16 constant NET_DEVELOP = 4447;
    uint16 constant NET_GANACHE = 5777;
    uint16[] NETWORKS = [
        NET_MAIN,
        NET_ROPSTEN,
        NET_RINKEBY,
        NET_KOVAN,
        NET_DEVELOP,
        NET_GANACHE
    ];

    constructor (uint16 networkId) public {
        bool isValidNetworkId = false;

        for (uint i = 0; i < NETWORKS.length; i++) {
            if (networkId == NETWORKS[i]) {
                isValidNetworkId = true;
                break;
            }
        }

        require(isValidNetworkId);

        IS_TESTNET = (networkId != NET_MAIN);

        hardcap = 180000000;
        hardcap = hardcap.mul(multiplier);
    }

    modifier onlyPayloadSize(uint size) {
        if(msg.data.length < size + 4) revert();
        _;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 remainingBalance) {
        return balance[_owner];
    }

    function transfer(address _to, uint256 _value) public onlyPayloadSize(2 * 32) returns (bool success) {
        if ((balance[msg.sender] >= _value) && (balance[_to] + _value > balance[_to])) {
            balance[msg.sender] -= _value;
            balance[_to] += _value;
            emit Transfer(msg.sender, _to, _value);
            return true;
        } else {
            return false;
        }
    }

    function transferFrom(address _from, address _to, uint256 _value) public onlyPayloadSize(3 * 32) returns (bool success) {
        if ((balance[_from] >= _value) && (allowed[_from][msg.sender] >= _value) && (balance[_to] + _value > balance[_to])) {
            balance[_to] += _value;
            balance[_from] -= _value;
            allowed[_from][msg.sender] -= _value;
            emit Transfer(_from, _to, _value);
            return true;
        } else {
            return false;
        }
    }

    function mintToken (address _target, uint256 _mintedAmount) public returns (bool success){
        require(_mintedAmount > 0);

        if (IS_TESTNET) {
            return _mintToken(_target, _mintedAmount);
        }

        return _mintTokenMainnet(_target, _mintedAmount);
    }

    function _mintTokenMainnet(address _target, uint256 _mintedAmount) private onlyOwner returns (bool success) {
        require(totalSupply.add(_mintedAmount) <= hardcap && now < stopTime);

        return _mintToken(_target, _mintedAmount);
    }

    function _mintToken(address _target, uint256 _mintedAmount) private returns (bool success) {
        uint256 addTokens = _mintedAmount;
        balance[_target] = balance[_target].add(addTokens);
        totalSupply = totalSupply.add(addTokens);

        emit Transfer(0, _target, addTokens);

        return true;
    }
}
