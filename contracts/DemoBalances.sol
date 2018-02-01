pragma solidity ^0.4.18;

import "./Balances.sol";
//import "../libs/Owned.sol";

contract DemoBalances is Owned {
    using SafeMath for uint256;

    function DemoBalances(address _scriniumAddress) public {
        scriniumAddress = _scriniumAddress;
    }
    address public scriniumAddress;

    uint64 maxDemoBalance = 10000 * 100000000; // 10000SCR Max balance allowed for increase
    uint64 maxDemoDeposit = 1000 * 100000000; // 1000SCR Max amount to increase balance

    mapping (address => uint256) balance;

    function deposit(uint amount) external {
        require(balance[msg.sender].add(amount) <= maxDemoBalance
            && amount <= maxDemoDeposit
        );

        balance[msg.sender] = balance[msg.sender].add(amount);
    }

    function withdrawal(uint amount) external {
        require(balance[msg.sender] >= amount);
        // do not send SCR anywhere
        balance[msg.sender] = balance[msg.sender].sub(amount);
    }

    function getBalance() public view returns(uint256) {
        return balance[msg.sender];
    }

    function getBalanceOf(address _investor) public view returns(uint256) {
        // @todo: allowed for owner or Platfrorm only

        return balance[_investor];
    }

    // @todo: use for Balances too.
    address public platformAddress;
    function setPlatform(address _platformAddress) external onlyOwner {
        platformAddress = _platformAddress;
    }

    function setScriniumAddress(address _scriniumAddress) external onlyOwner {
        scriniumAddress = _scriniumAddress;
    }

    function increaseBalance(address _investor, uint256 amount) external returns (bool) {
        // @todo: only for Platform
        if (balance[address(this)] >= amount) {
            balance[_investor] = balance[_investor].add(amount);
            balance[address(this)] = balance[address(this)].sub(amount);
            return true;
        }

        return false;
    }

    function decreaseBalance(address _investor, uint256 amount) external returns (bool) {
        // @todo: only for Platform

        if (balance[_investor] >= amount) {
            balance[_investor] = balance[_investor].sub(amount);
            balance[address(this)] = balance[address(this)].add(amount);

            return true;
        }

        return false;
    }

}
