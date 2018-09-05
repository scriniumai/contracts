pragma solidity ^0.4.23;


import "./shared/AddressTools.sol";
import "./shared/SafeMath.sol";
import "./shared/Owned.sol";

import "./Scrinium.sol";
import "./LiquidityProvider.sol";


contract Balances is Owned {
    using AddressTools for address;
    using SafeMath for uint256;

    address public scriniumAddress;
    address public liquidityProviderAddress;
    address public platformAddress;

    // ? FIXME: should the balance be only positive
    mapping (address => uint256) balance;

    modifier onlyPlatform {
        require(msg.sender == platformAddress);
        _;
    }

    modifier notZeroAddr (address _address) {
        require(_address.isContract());
        _;
    }

    event PlatformAddressSetted(address indexed _owner, address indexed _platformAddress);
    event LiquidityProviderAddressSetted(address indexed _owner, address indexed _liquidityProviderAddress);

    event BalanceDeposited(uint _externalId, address indexed _investor, uint _amount);
    event BalanceWithdrawed(uint _externalId, address indexed _investor, uint _amount);
    event BalanceUpdated(bytes32 indexed _updateType, address indexed _investor, int _amount);

    constructor(address _scriniumAddress) public {
        require(_scriniumAddress.isContract());
        scriniumAddress = _scriniumAddress;
    }

    function setPlatformAddress(address _platformAddress) external onlyOwner notZeroAddr(_platformAddress) {
        platformAddress = _platformAddress;
        emit PlatformAddressSetted(msg.sender, _platformAddress);
    }

    function setLiquidityProviderAddress(address _liquidityProviderAddress) external onlyOwner notZeroAddr(_liquidityProviderAddress) {
        liquidityProviderAddress = _liquidityProviderAddress;
        emit LiquidityProviderAddressSetted(msg.sender, _liquidityProviderAddress);
    }

    function deposit(uint _externalId, uint _amount) external {
        require(Scrinium(scriniumAddress).transferFrom(msg.sender, address(this), _amount));

        balance[msg.sender] = balance[msg.sender].add(_amount);

        emit BalanceDeposited(_externalId, msg.sender, _amount);
    }

    function updateBalance(
        address _investor,
        int256 _amount
    ) external onlyPlatform {
        if (_amount == 0) {
            return;
        }

        Scrinium _scrinium = Scrinium(scriniumAddress);

        uint256 amount;

        // 1. amount > 0:
        //    - Subtract amount from LiquidityProvider
        //    - Add amount to Balances
        //    - Add amount to investor
        //
        if (_amount > 0) {
            amount = uint256(_amount);
            // ? TODO: balance[liquidityProviderAddress] = balance[liquidityProviderAddress].sub(amount);
            require(_scrinium.transferFrom(liquidityProviderAddress, address(this), amount));
            balance[_investor] = balance[_investor].add(amount);
        // 2. amount < 0:
        //    - Subtract amount from investor
        //    - Subtract amount from Balances
        //    - Add amount to LiquidityProver
        } else {
            amount = uint256(-1 * _amount);
            require(_scrinium.transfer(liquidityProviderAddress, amount));
            balance[_investor] = balance[_investor].sub(amount);
            // ? TODO: balance[liquidityProviderAddress] = balance[liquidityProviderAddress].add(amount);
        }

        emit BalanceUpdated("trade", _investor, _amount);
    }

    function updateBalanceCommission(
        address _investor,
        address _commissionsAddress,
        uint _amount
    ) external onlyPlatform returns (bool) {
        require(balance[_investor] >= _amount);

        require(Scrinium(scriniumAddress).transfer(_commissionsAddress, _amount));
        balance[_investor] = balance[_investor].sub(_amount);

        emit BalanceUpdated("commission", _investor, int256(_amount));

        return true;
    }

    function withdrawal(uint _externalId, uint _amount) external {
        require(balance[msg.sender] >= _amount);

        require(Scrinium(scriniumAddress).transfer(msg.sender, _amount));


        balance[msg.sender] = balance[msg.sender].sub(_amount);

        emit BalanceWithdrawed(_externalId, msg.sender, _amount);
    }

    function balanceOf(address _investor) public view returns(uint256) {
        return balance[_investor];
    }
}
