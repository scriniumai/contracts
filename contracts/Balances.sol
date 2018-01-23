pragma solidity 0.4.18;

import "../libs/SafeMath.sol";
import "./Scrinium.sol";


contract Balances {
    using SafeMath for uint256;

    address public scriniumAddress;

    function Balances(address _scriniumAddress) public {
        scriniumAddress = _scriniumAddress;
    }

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
}
