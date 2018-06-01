pragma solidity ^0.4.23;

import "./shared/Owned.sol";
import "./shared/SafeMath.sol";


contract DemoBalances is Owned {
    using SafeMath for uint256;

    address public scriniumAddress;
    address public platformAddress;

    uint64 maxDemoBalance = 10000 * 100000000; // 10000SCR Max balance allowed for increase
    uint64 maxDemoDeposit = 1000 * 100000000; // 1000SCR Max amount to increase balance

    mapping (address => uint256) balance;

    modifier onlyPlatform {
        require(msg.sender == platformAddress);
        _;
    }

    constructor (address _scriniumAddress) public {
        scriniumAddress = _scriniumAddress;
    }

    function setPlatformAddress(address _platformAddress) external onlyOwner {
        platformAddress = _platformAddress;
    }

    function setScriniumAddress(address _scriniumAddress) external onlyOwner {
        scriniumAddress = _scriniumAddress;
    }

    function updateBalance(address _investor, int256 amount) external onlyPlatform {
        if (amount > 0) {
            balance[_investor] = balance[_investor].add(uint256(amount));
        } else {
            balance[_investor] = balance[_investor].sub(uint256(-1 * amount));
        }
    }

    function deposit(uint amount) external {
        demoDeposit(amount, msg.sender);
    }

    function withdrawal(uint amount) external {
        require(balance[msg.sender] >= amount);
        // do not send SCR anywhere for demo version
        balance[msg.sender] = balance[msg.sender].sub(amount);
    }

    function balanceOf(address _investor) public view returns(uint256) {
        return balance[_investor];
    }

    function demoDeposit(uint amount, address investor) public {
        require(
            balance[investor].add(amount) <= maxDemoBalance &&
            amount <= maxDemoDeposit
        );

        balance[investor] = balance[investor].add(amount);
    }
}
