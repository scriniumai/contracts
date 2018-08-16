pragma solidity ^0.4.23;


import "./shared/AddressTools.sol";
import "./shared/SafeMath.sol";
import "./shared/Owned.sol";

import "./Scrinium.sol";
import "./Platform.sol";


contract LiquidityProvider is Owned {
    using AddressTools for address;
    using SafeMath for uint256;

    uint256 comissionsBalance = 0;

    address public scriniumAddress;
    address public balancesAddress;
    address public platformAddress;

    modifier notZeroAddr (address _address) {
        require(_address.isContract());
        _;
    }

    event BalancesAddressSetted(address indexed _owner, address indexed _balancesAddress);
    event PlatformAddressSetted(address indexed _owner, address indexed _platformAddress);
    event CommissionTaken(
        bytes32 indexed _direction,
        address indexed _investor,
        uint indexed _tradeId,
        uint _amount
    );

    constructor (address _scriniumAddress, address _balancesAddress) public {
        require(_scriniumAddress.isContract());
        require(_balancesAddress.isContract());

        scriniumAddress = _scriniumAddress;
        balancesAddress = _balancesAddress;

        emit BalancesAddressSetted(msg.sender, _balancesAddress);
    }

    function setBalancesAddress(address _balancesAddress) external onlyOwner notZeroAddr(_balancesAddress) {
        this.removeBalancesTransferAllowance();
        balancesAddress = _balancesAddress;
        this.addBalancesTransferAllowance();
        emit BalancesAddressSetted(msg.sender, _balancesAddress);
    }

    function setPlatformAddress(address _platformAddress) external onlyOwner notZeroAddr(_platformAddress) {
        platformAddress = _platformAddress;
        emit PlatformAddressSetted(msg.sender, _platformAddress);
    }

    function addBalancesTransferAllowance() external onlyOwner {
        Scrinium _scrinium = Scrinium(scriniumAddress);
        _scrinium.approve(balancesAddress, 2 ** 256 - 1);
    }

    function removeBalancesTransferAllowance() external onlyOwner {
        require(balancesAddress != address(0));

        Scrinium _scrinium = Scrinium(scriniumAddress);
        _scrinium.approve(balancesAddress, 0);
    }

    function withdrawPool(address _target) external onlyOwner returns (bool) {
        Scrinium _scrinium = Scrinium(scriniumAddress);

        uint256 balance = _scrinium.balanceOf(address(this));
        address _to = _target != address(0) ? _target : owner;

        return _scrinium.transfer(_to, balance);
    }

    function withdrawCommisions(address _target) external onlyOwner returns (bool) {
        Scrinium _scrinium = Scrinium(scriniumAddress);

        address _to = _target != address(0) ? _target : owner;

        if (comissionsBalance <= 0) {
            return true;
        }

        return _scrinium.transfer(_to, comissionsBalance);
    }

    function openTrade (
        uint _tradeId,
        address _investor,
        uint _masterTraderId,

        uint _instrumentId,
        uint _marginPercent,
        uint _leverage,
        uint _cmd,

        uint _openTime,
        uint _openPriceInstrument,
        uint _openPriceSCRBase,

        uint _commission
    ) external onlyOwner {
        require(_takeCommission(
            bytes32("open"),
            _investor,
            _tradeId,
            _commission
        ));

        Platform _platform = Platform(platformAddress);
        _platform.openTrade(
            _tradeId,
            _investor,
            _masterTraderId,

            _instrumentId,
            _marginPercent,
            _leverage,
            _cmd,

            _openTime,
            _openPriceInstrument,
            _openPriceSCRBase
        );
    }

    function closeTrade (
        uint _tradeId,
        uint _closeTime,
        uint _closePriceInstrument,
        uint _closePriceSCRBase,

        uint _commission
    ) external onlyOwner {
        Platform _platform = Platform(platformAddress);

        address _investor;

        (, _investor,,,,,,,,) = _platform.getTrade(_tradeId);

        require(_takeCommission(
            bytes32("close"),
            _investor,
            _tradeId,
            _commission
        ));

        _platform.closeTrade(
            _tradeId,
            _closeTime,
            _closePriceInstrument,
            _closePriceSCRBase
        );
    }

    function _takeCommission (
        bytes32 _direction,
        address _investor,
        uint _tradeId,
        uint _commission
    ) private returns (bool success) {
        comissionsBalance = comissionsBalance.add(_commission);

        emit CommissionTaken(
            _direction,
            _investor,
            _tradeId,
            _commission
        );

        return true;
    }
}
