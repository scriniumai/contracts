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

    event PlatformAddressSetted(address indexed _owner, address indexed _platformAddress);
    event ScriniumAddressSetted(address indexed _owner, address indexed _scriniumAddress);
    event DemoDeposited(address indexed _investor, uint _amount);
    event DemoWithdrawed(address indexed _investor, uint _amount);
    event BalanceUpdated(address indexed _investor, int _amount);

    constructor (address _scriniumAddress) public {
        scriniumAddress = _scriniumAddress;
    }

    function deposit(uint amount) external {
        demoDeposit(amount, msg.sender);
    }

    function setPlatformAddress(address _platformAddress) external onlyOwner {
        platformAddress = _platformAddress;
        emit PlatformAddressSetted(msg.sender, _platformAddress);
    }

    function setScriniumAddress(address _scriniumAddress) external onlyOwner {
        scriniumAddress = _scriniumAddress;
        emit ScriniumAddressSetted(msg.sender, _scriniumAddress);
    }

    function updateBalance(address _investor, int256 _amount) external onlyPlatform {
        if (_amount > 0) {
            balance[_investor] = balance[_investor].add(uint256(_amount));
        } else {
            balance[_investor] = balance[_investor].sub(uint256(-1 * _amount));
        }

        emit BalanceUpdated(_investor, _amount);
    }

    function withdrawal(uint _amount) external {
        require(balance[msg.sender] >= _amount);
        // do not send SCR anywhere for demo version
        balance[msg.sender] = balance[msg.sender].sub(_amount);
        emit DemoDeposited(msg.sender, _amount);
    }

    function balanceOf(address _investor) public view returns(uint256) {
        return balance[_investor];
    }

    function demoDeposit(uint _amount, address _investor) public {
        require(
            balance[_investor].add(_amount) <= maxDemoBalance &&
            _amount <= maxDemoDeposit
        );

        balance[_investor] = balance[_investor].add(_amount);

        emit DemoDeposited(_investor, _amount);
    }
}
