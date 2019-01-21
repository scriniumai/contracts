pragma solidity ^0.4.23;

import "./shared/AddressTools.sol";
import "./shared/SafeMath.sol";
import "./shared/Owned.sol";

import "./Subscriptions.sol";
import "./Instruments.sol";
import "./Balances.sol";


contract Platform is Owned {
    using AddressTools for address;
    using SafeMath for uint256;

    uint constant STATUS_PENDING = 1;
    uint constant STATUS_OPEN = 2;
    uint constant STATUS_CLOSED = 3;
    uint constant STATUS_CLOSED_FORCED = 4;

    uint constant CMD_BUY = 0;
    uint constant CMD_SELL = 1;

    uint constant DEFAULT_MULTIPLIER = 10 ** 18;
    uint constant MARGIN_PERCENT_MULTIPLIER = 100;
    uint constant PRICE_MULTIPLIER = 10 ** 6;

    mapping(uint => Trade) public trades;
    mapping(uint => TradeQuotes) public tradeQuotes;
    mapping(uint => TradeMetas) public tradeMetas;

    mapping(address => uint[]) public investorTrades;
    mapping(address => mapping(uint => uint[])) public investorTradesAtPortfolioBlock;

    struct Trade {
        address liquidityProviderAddress;
        address investor;
        uint masterTraderId;

        uint instrumentId;
        uint marginPercent;
        uint leverage;
        uint cmd;

        uint marginSCR;
        uint marginRegulator;
        int profitSCR;

        uint status;
    }

    struct TradeQuotes {
        uint openTime;
        uint openPriceInstrument;
        uint openPriceSCRBaseCurrency;

        uint closeTime;
        uint closePriceInstrument;
        uint closePriceSCRBaseCurrency;
    }

    struct TradeMetas {
        uint actualIndex;
        uint overallIndex;
        uint blockNumber;
    }

    uint[] private tradeIds;

    address public balancesAddress;
    address public instrumentsAddress;
    address public subscriptionsAddress;
    address public liquidityProviderAddress;


    modifier onlyLiquidityProvider {
        require(msg.sender == liquidityProviderAddress);
        _;
    }

    modifier onlyOwnerOrLiquidityProvider {
        require(
            msg.sender == owner ||
            msg.sender == liquidityProviderAddress
        );
        _;
    }

    modifier onlyForOpenTrade (uint _tradeId) {
        require(trades[_tradeId].status == STATUS_OPEN);
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

        uint _marginRegulator,
        uint _conversionCoefficient,
        int _profitSCR
    );
    event TradeClosedForced(
        uint indexed _tradeId,
        address indexed _investor,
        uint indexed _masterTraderId,

        uint _closeTime,
        uint _closePriceInstrument,
        uint _closePriceSCRBase,

        uint _marginRegulator,
        int _profitSCR
    );

    constructor (
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
        emit SubscriptionsAddressSetted(msg.sender, _subscriptionsAddress);
        emit LiquidityProviderAddressSetted(msg.sender, _liquidityProviderAddress);
    }

    function setBalancesAddress (address _balancesAddress) external onlyOwner notZeroAddr(_balancesAddress) {
        balancesAddress = _balancesAddress;
        emit BalancesAddressSetted(msg.sender, _balancesAddress);
    }

    function setInstrumentsAddress (address _instrumentsAddress) external onlyOwner notZeroAddr(_instrumentsAddress) {
        instrumentsAddress = _instrumentsAddress;
        emit InstrumentsAddressSetted(msg.sender, _instrumentsAddress);
    }

    function setSubscriptionsAddress (address _subscriptionsAddress) external onlyOwner notZeroAddr(_subscriptionsAddress) {
        subscriptionsAddress = _subscriptionsAddress;
        emit SubscriptionsAddressSetted(msg.sender, _subscriptionsAddress);
    }

    function setLiquidityProviderAddress (address _liquidityProviderAddress) external onlyOwner notZeroAddr(_liquidityProviderAddress) {
        liquidityProviderAddress = _liquidityProviderAddress;
        emit LiquidityProviderAddressSetted(msg.sender, _liquidityProviderAddress);
    }

    function getTradesIds () public view returns (uint[]) {
        return tradeIds;
    }

    function getInvestorTrades (address _investor) external view returns (uint[]) {
        return investorTrades[_investor];
    }

    function getInvestorActualTrades (address _investor) public view returns (uint[]) {
        return this.getInvestorTradesAtPortfolioBlock(_investor, _getInvestorLastPortfolioBlock(_investor));
    }

    function getInvestorTradesAtPortfolioBlock (address _investor, uint _portfolioBlock) public view returns (uint[]) {
        return investorTradesAtPortfolioBlock[_investor][_portfolioBlock];
    }

    function getTrade (uint _tradeId) external view returns (
        address _liquidityProviderAddress,
        address _investor,
        uint _masterTraderId,

        uint _instrumentId,
        uint _marginPercent,
        uint _leverage,
        uint _cmd,

        uint _marginSCR,
        uint _marginRegulator,
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
            _trade.marginRegulator,
            _trade.profitSCR,

            _trade.status
        );
    }

    function getTradeQuote (uint _tradeId) external view returns (
        uint _openTime,
        uint _openPriceInstrument,
        uint _openPriceSCRBaseCurrency,

        uint _closeTime,
        uint _closePriceInstrument,
        uint _closePriceSCRBaseCurrency
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

    function getTradeMeta (uint _tradeId) external view returns (
        uint _index,
        uint _blockNumber
    ) {
        TradeMetas memory _tradeMetas = tradeMetas[_tradeId];

        return (
            _tradeMetas.actualIndex,
            _tradeMetas.blockNumber
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
    ) external onlyLiquidityProvider returns (bool) {
        require(Instruments(instrumentsAddress).isCorrect(_instrumentId));

        require(_marginPercent > 0);

        uint _balance = Balances(balancesAddress).balanceOf(_investor);
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

        return true;
    }

    function closeTrade (
        uint _tradeId,
        uint _marginRegulator,

        uint _closeTime,
        uint _closePriceInstrument,
        uint _closePriceSCRBase,

        uint _conversionCoefficient
    ) external onlyLiquidityProvider returns (bool) {
        Trade memory _trade = trades[_tradeId];

        int _profitSCR = _calculateProfitSCR(
            _tradeId,
            _closePriceInstrument,
            _marginRegulator,
            _conversionCoefficient
        );

        _closeTrade(
            _tradeId,
            _marginRegulator,

            _closeTime,
            _closePriceInstrument,
            _closePriceSCRBase,

            _profitSCR,

            false
        );

        Balances(balancesAddress).updateBalance(
            _trade.investor,
            _tradeId,
            _profitSCR
        );

        emit TradeClosed(
            _tradeId,
            _trade.investor,
            _trade.masterTraderId,

            _closeTime,
            _closePriceInstrument,
            _closePriceSCRBase,

            _marginRegulator,
            _conversionCoefficient,
            _profitSCR
        );

        return true;
    }

    function closeTradeForce (
        uint _tradeId
    ) external onlyOwnerOrLiquidityProvider returns (bool) {
        Trade memory _trade = trades[_tradeId];

        uint _marginRegulator = 0;
        uint _closeTime = now;
        uint _closePriceInstrument = 0;
        uint _closePriceSCRBase = 0;

        int _profitSCR = 0;

        _closeTrade(
            _tradeId,
            _marginRegulator,

            _closeTime,
            _closePriceInstrument,
            _closePriceSCRBase,

            _profitSCR,

            true
        );

        emit TradeClosedForced(
            _tradeId,
            _trade.investor,
            _trade.masterTraderId,

            _closeTime,
            _closePriceInstrument,
            _closePriceSCRBase,

            _marginRegulator,
            _profitSCR
        );
    }

    function takeCommission (
        address _investor,
        uint _tradeId,
        address _commissionsAddress,
        uint _commission
    ) external onlyLiquidityProvider returns (bool) {
        require(Balances(balancesAddress).updateBalanceCommission(
            _investor,
            _tradeId,
            _commissionsAddress,
            _commission
        ));
        return true;
    }

    function _openTrade (
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
        investorTrades[_investor].push(_tradeId);

        uint _investorLastPortfolioBlock = _getInvestorLastPortfolioBlock(_investor);

        investorTradesAtPortfolioBlock[_investor][_investorLastPortfolioBlock].push(_tradeId);

        tradeMetas[_tradeId].actualIndex = investorTradesAtPortfolioBlock[_investor][_investorLastPortfolioBlock].length - 1;
        tradeMetas[_tradeId].overallIndex = investorTrades[_investor].length - 1;
        tradeMetas[_tradeId].blockNumber = block.number;
    }

    function _calculateProfitSCR (
        uint _tradeId,
        uint _closePriceInstrument,
        uint _marginRegulator,
        uint _conversionCoefficient
    ) private view returns (int _profitSCR) {
        Trade memory _trade = trades[_tradeId];
        TradeQuotes memory _tradeQuotes = tradeQuotes[_tradeId];

        uint _balance = Balances(balancesAddress).balanceOf(_trade.investor);

        _profitSCR = (int(_closePriceInstrument) - int(_tradeQuotes.openPriceInstrument))
            * int(_trade.marginSCR)
            * int(_trade.leverage)
            / int(PRICE_MULTIPLIER)
            * int(_marginRegulator)
            / int(DEFAULT_MULTIPLIER)
            * int(_conversionCoefficient)
            / int(DEFAULT_MULTIPLIER);

        if (_trade.cmd == CMD_SELL) {
            _profitSCR *= -1;
        }

        // FIXME: Replace it with better balance zerofication algorithm
        if (_profitSCR < 0 && uint(-1 * _profitSCR) > _balance) {
            _profitSCR = -1 * int(_balance);
        }

        return _profitSCR;
    }

    function _closeTrade (
        uint _tradeId,
        uint _marginRegulator,

        uint _closeTime,
        uint _closePriceInstrument,
        uint _closePriceSCRBase,

        int _profitSCR,

        bool isForced
    ) private onlyForOpenTrade(_tradeId) {
        tradeQuotes[_tradeId].closeTime = _closeTime;
        tradeQuotes[_tradeId].closePriceInstrument = _closePriceInstrument;
        tradeQuotes[_tradeId].closePriceSCRBaseCurrency = _closePriceSCRBase;


        trades[_tradeId].marginRegulator = _marginRegulator;
        trades[_tradeId].profitSCR = _profitSCR;
        trades[_tradeId].status = isForced ? STATUS_CLOSED_FORCED : STATUS_CLOSED;
    }

    function _getInvestorLastPortfolioBlock (address _investor) private view returns (uint) {
        return Subscriptions(subscriptionsAddress).getInvestorLastPortfolioBlock(_investor);
    }
}
