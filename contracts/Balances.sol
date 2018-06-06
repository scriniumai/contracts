pragma solidity ^0.4.23;

import "./shared/SafeMath.sol";
import "./shared/Owned.sol";

import "./Scrinium.sol";

contract Balances is Owned {
    using SafeMath for uint256;

    mapping (address => uint256) balance;

    address public scriniumAddress;

    constructor(address _scriniumAddress) public {
        scriniumAddress = _scriniumAddress;
    }

    function setScriniumAddress(address _scriniumAddress) public onlyOwner {
        scriniumAddress = _scriniumAddress;
    }

    function deposit(uint amount) external {
        Scrinium _contract = Scrinium(scriniumAddress);
        require(_contract.transferFrom(msg.sender, address(this), amount));

        balance[msg.sender] = balance[msg.sender].add(amount);
    }

    function withdrawal(uint amount) external {
        require(balance[msg.sender] >= amount);

        Scrinium _contract = Scrinium(scriniumAddress);
        require(_contract.transfer(msg.sender, amount));

        balance[msg.sender] = balance[msg.sender].sub(amount);
    }

    function balanceOf(address _investor) public view returns(uint256) {
        return balance[_investor];
    }
}
