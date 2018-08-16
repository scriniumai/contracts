pragma solidity ^0.4.23;

import "./shared/AddressTools.sol";
import "./shared/SafeMath.sol";
import "./shared/Owned.sol";

import "./Subscriptions.sol";
import "./Balances.sol";
import "./Instruments.sol";
import "./LiquidityProvider.sol";


contract Platform is Owned {
    using AddressTools for address;
    using SafeMath for uint256;

    uint constant STATUS_PENDING = 1;
    uint constant STATUS_OPEN = 2;
    uint constant STATUS_CLOSED = 3;

    uint constant CMD_BUY = 0;
    uint constant CMD_SELL = 1;

    uint constant PRICE_MULTIPLIER = 1000000; // 10**6
    uint constant MARGIN_PERCENT_MULTIPLIER = 100;

    mapping (uint => Trade) public trades;
    mapping (uint => TradeQuotes) public tradeQuotes;

    struct Trade {
        address liquidityProviderAddress;
        address investor;
        uint masterTraderId;

        uint instrumentId;
        uint marginPercent;
        uint leverage;
        uint cmd;

        uint marginSCR;
        int profitSCR;

        uint status;
    }

    struct TradeQuotes {
        uint256 openTime;
        uint256 openPriceInstrument;
        uint256 openPriceSCRBaseCurrency;

        uint256 closeTime;
        uint256 closePriceInstrument;
        uint256 closePriceSCRBaseCurrency;
    }

    uint[] tradeIds;

    address public balancesAddress;
    address public instrumentsAddress;
    address public subscriptionsAddress;
    address public liquidityProviderAddress;


    modifier onlyLiquidityProvider {
        require(msg.sender == liquidityProviderAddress);
        _;
    }

    modifier notZeroAddr (address _address) {
        require(_address.isContract());
        _;
    }

    event BalancesAddressSetted(address indexed _owner, address _balancesAddress);
    event InstrumentsAddressSetted(address indexed _owner, address _instrumentsAddress);
    event SubscriptionsAddressSetted(address indexed _owner, address _subscriptionsAddress);
    event LiquidityProviderAddressSetted(address indexed _owner, address _liquidityProviderAddress);

    event TradeOpened(
        uint indexed _tradeId,
        address indexed _investor,
        uint indexed _masterTraderId,

        uint _instrumentId,
        uint _marginPercent,
        uint _marginSCR,
        uint _leverage,
        uint _cmd,

        uint _openTime,
        uint _openPriceInstrument,
        uint _openPriceSCRBase
    );
    event TradeClosed(
        uint indexed _tradeId,
        address indexed _investor,
        uint indexed _masterTraderId,

        uint _closeTime,
        uint _closePriceInstrument,
        uint _closePriceSCRBase,

        int _profitSCR
    );

    constructor(
        address _balancesAddress,
        address _instrumentsAddress,
        address _subscriptionsAddress,
        address _liquidityProviderAddress
    ) public {
        require(_balancesAddress.isContract());
        require(_instrumentsAddress.isContract());
        require(_subscriptionsAddress.isContract());
        require(_liquidityProviderAddress.isContract());

        balancesAddress = _balancesAddress;
        instrumentsAddress = _instrumentsAddress;
        subscriptionsAddress = _subscriptionsAddress;
        liquidityProviderAddress = _liquidityProviderAddress;

        emit BalancesAddressSetted(msg.sender, _balancesAddress);
        emit InstrumentsAddressSetted(msg.sender, _instrumentsAddress);
        emit InstrumentsAddressSetted(msg.sender, _instrumentsAddress);
        emit LiquidityProviderAddressSetted(msg.sender, _liquidityProviderAddress);
    }

    function setBalancesAddress(address _balancesAddress) external onlyOwner notZeroAddr(_balancesAddress) {
        balancesAddress = _balancesAddress;
        emit BalancesAddressSetted(msg.sender, _balancesAddress);
    }

    function setInstrumentsAddress(address _instrumentsAddress) external onlyOwner notZeroAddr(_instrumentsAddress) {
        instrumentsAddress = _instrumentsAddress;
        emit InstrumentsAddressSetted(msg.sender, _instrumentsAddress);
    }

    function setSubscriptionsAddress(address _subscriptionsAddress) external onlyOwner notZeroAddr(_subscriptionsAddress) {
        subscriptionsAddress = _subscriptionsAddress;
        emit SubscriptionsAddressSetted(msg.sender, _subscriptionsAddress);
    }

    function setLiquidityProviderAddress(address _liquidityProviderAddress) external onlyOwner notZeroAddr(_liquidityProviderAddress) {
        liquidityProviderAddress = _liquidityProviderAddress;
        emit LiquidityProviderAddressSetted(msg.sender, _liquidityProviderAddress);
    }

    function getTradesIds() public view returns (uint[]) {
        return tradeIds;
    }

    function getTradeQuote(uint _tradeId) external view returns (
        uint256 _openTime,
        uint256 _openPriceInstrument,
        uint256 _openPriceSCRBaseCurrency,

        uint256 _closeTime,
        uint256 _closePriceInstrument,
        uint256 _closePriceSCRBaseCurrency
    ) {
        TradeQuotes memory _tradeQuotes = tradeQuotes[_tradeId];

        return (
            _tradeQuotes.openTime,
            _tradeQuotes.openPriceInstrument,
            _tradeQuotes.openPriceSCRBaseCurrency,

            _tradeQuotes.closeTime,
            _tradeQuotes.closePriceInstrument,
            _tradeQuotes.closePriceSCRBaseCurrency
        );
    }

    function getTrade(uint _tradeId) external view returns (
        address _liquidityProviderAddress,
        address _investor,
        uint _masterTraderId,

        uint _instrumentId,
        uint _marginPercent,
        uint _leverage,
        uint _cmd,

        uint _marginSCR,
        int _profitSCR,

        uint _status
    ) {
        Trade memory _trade = trades[_tradeId];

        return (
            _trade.liquidityProviderAddress,
            _trade.investor,
            _trade.masterTraderId,

            _trade.instrumentId,
            _trade.marginPercent,
            _trade.leverage,
            _trade.cmd,

            _trade.marginSCR,
            _trade.profitSCR,

            _trade.status
        );
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
        uint _openPriceSCRBase
    ) external onlyLiquidityProvider {
        require(_marginPercent > 0 && _marginPercent < 100);

        Instruments _instrumentsContract = Instruments(instrumentsAddress);
        require(_instrumentsContract.isCorrect(_instrumentId));

        Balances _balancesContract = Balances(balancesAddress);
        uint _balance = _balancesContract.balanceOf(_investor);
        require(_balance > 0);

        uint _marginSCR = _balance.mul(_marginPercent).div(MARGIN_PERCENT_MULTIPLIER);

        // TODO: Check _investor to _masterTraderId subscription

        _openTrade(
            _tradeId,
            _investor,
            _masterTraderId,
            _instrumentId,
            _marginPercent,
            _marginSCR,
            _leverage,
            _cmd,
            _openTime,
            _openPriceInstrument,
            _openPriceSCRBase
        );

        // TODO: Lock margin for withdrawal or reusing in other trades

        emit TradeOpened(
            _tradeId,
            _investor,
            _masterTraderId,
            _instrumentId,
            _marginPercent,
            _marginSCR,
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
        uint _closePriceSCRBase
    ) external onlyLiquidityProvider {
        Trade memory _trade = trades[_tradeId];
        TradeQuotes memory _tradeQuotes = tradeQuotes[_tradeId];

        require(_trade.status == STATUS_OPEN);

        int _profitSCR = (int(_closePriceInstrument) - int(_tradeQuotes.openPriceInstrument))
            * int(_trade.marginSCR)
            * int(_trade.leverage)
            / int(PRICE_MULTIPLIER);

        if (_trade.cmd == CMD_SELL) {
            _profitSCR *= -1;
        }

        if (_closePriceSCRBase != _tradeQuotes.openPriceSCRBaseCurrency) {
            _profitSCR = _profitSCR
                * int(_tradeQuotes.openPriceSCRBaseCurrency)
                / int(_closePriceSCRBase);
        }

        _closeTrade(
            _tradeId,
            _closeTime,
            _closePriceInstrument,
            _closePriceSCRBase,
            _profitSCR
        );

        Balances _balancesContract = Balances(balancesAddress);
        _balancesContract.updateBalance(
            _trade.investor,
            _profitSCR
        );

        emit TradeClosed(
            _tradeId,
            _trade.investor,
            _trade.masterTraderId,

            _closeTime,
            _closePriceInstrument,
            _closePriceSCRBase,

            _profitSCR
        );
    }

    function _openTrade(
        uint _tradeId,
        address _investor,
        uint _masterTraderId,

        uint _instrumentId,
        uint _marginPercent,
        uint _marginSCR,
        uint _leverage,
        uint _cmd,

        uint _openTime,
        uint _openPriceInstrument,
        uint _openPriceSCRBase
    ) private {
        trades[_tradeId].liquidityProviderAddress = msg.sender;
        trades[_tradeId].investor = _investor;
        trades[_tradeId].masterTraderId = _masterTraderId;
        trades[_tradeId].instrumentId = _instrumentId;
        trades[_tradeId].marginPercent = _marginPercent;
        trades[_tradeId].marginSCR = _marginSCR;
        trades[_tradeId].leverage = _leverage;
        trades[_tradeId].cmd = _cmd;

        trades[_tradeId].status = STATUS_OPEN;

        tradeQuotes[_tradeId].openTime = _openTime;
        tradeQuotes[_tradeId].openPriceInstrument = _openPriceInstrument;
        tradeQuotes[_tradeId].openPriceSCRBaseCurrency = _openPriceSCRBase;

        tradeIds.push(_tradeId);
    }

    function _closeTrade(
        uint _tradeId,
        uint _closeTime,
        uint _closePriceInstrument,
        uint _closePriceSCRBase,

        int _profitSCR
    ) private {
        trades[_tradeId].status = STATUS_CLOSED;
        tradeQuotes[_tradeId].closeTime = _closeTime;
        tradeQuotes[_tradeId].closePriceInstrument = _closePriceInstrument;
        tradeQuotes[_tradeId].closePriceSCRBaseCurrency = _closePriceSCRBase;
        trades[_tradeId].profitSCR = _profitSCR;
    }
}
