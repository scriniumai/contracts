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
        demoDeposit(amount, msg.sender);
    }

    function demoDeposit(uint amount, address investor) public {
        require(
            balance[investor].add(amount) <= maxDemoBalance &&
            amount <= maxDemoDeposit
        );

        balance[investor] = balance[investor].add(amount);
    }

    function withdrawal(uint amount) external {
        require(balance[msg.sender] >= amount);
        // do not send SCR anywhere
        balance[msg.sender] = balance[msg.sender].sub(amount);
    }

    function balanceOf(address _investor) public view returns(uint256) {
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

    // @todo: use int
    function increaseBalance(address _investor, uint256 amount) external {
        // @todo: only for Platform
//        require(balance[address(this)] >= amount);

        balance[_investor] = balance[_investor].add(amount);
//        balance[address(this)] = balance[address(this)].sub(amount);
    }

    function decreaseBalance(address _investor, uint256 amount) external {
// @todo: only for Platform
//        require(balance[_investor] >= amount);

        balance[_investor] = balance[_investor].sub(amount);
//        balance[address(this)] = balance[address(this)].add(amount);
    }

}
