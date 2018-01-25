pragma solidity 0.4.18;

import "./Balances.sol";
//import "../libs/Owned.sol";

contract DemoBalances {
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
}
