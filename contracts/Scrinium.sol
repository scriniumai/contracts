pragma solidity ^0.4.18;

import '../libs/ERC20.sol';
import '../libs/Owned.sol';
import '../libs/SafeMath.sol';

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

    function Scrinium() {
        hardcap = 180000000;
        hardcap = hardcap.mul(multiplier);
    }

    modifier onlyPayloadSize(uint size) {
        if(msg.data.length < size + 4) revert();
        _;
    }

    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    function approve(address _spender, uint256 _value) returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function balanceOf(address _owner) constant returns (uint256 remainingBalance) {
        return balance[_owner];
    }

    function mintToken(address target, uint256 mintedAmount) onlyOwner returns (bool success) {
        require(mintedAmount > 0
        && (now < stopTime)
        && (totalSupply.add(mintedAmount) <= hardcap));

        uint256 addTokens = mintedAmount;
        balance[target] += addTokens;
        totalSupply += addTokens;
        Transfer(0, target, addTokens);
        return true;
    }

    function transfer(address _to, uint256 _value) onlyPayloadSize(2 * 32) returns (bool success) {
        if ((balance[msg.sender] >= _value) && (balance[_to] + _value > balance[_to])) {
            balance[msg.sender] -= _value;
            balance[_to] += _value;
            Transfer(msg.sender, _to, _value);
            return true;
        } else {
            return false;
        }
    }

    function transferFrom(address _from, address _to, uint256 _value) onlyPayloadSize(3 * 32) returns (bool success) {
        if ((balance[_from] >= _value) && (allowed[_from][msg.sender] >= _value) && (balance[_to] + _value > balance[_to])) {
            balance[_to] += _value;
            balance[_from] -= _value;
            allowed[_from][msg.sender] -= _value;
            Transfer(_from, _to, _value);
            return true;
        } else {
            return false;
        }
    }
}
