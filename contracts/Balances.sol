pragma solidity ^0.4.18;

import "../libs/SafeMath.sol";
import "./Scrinium.sol";
import "../libs/Owned.sol";

contract Balances is Owned {
    using SafeMath for uint256;

    address public scriniumAddress;

    function Balances(address _scriniumAddress) public {
        scriniumAddress = _scriniumAddress;
    }

    // @todo: add fn setScrAddress
    mapping (address => uint256) balance;

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

    function getBalance() public view returns(uint256) {
        return balance[msg.sender];
    }

    //@todo: how to withdraw SCR to our addresses? or another investor addresses
}
