pragma solidity ^0.4.23;

import "./shared/Owned.sol";
import "./shared/SafeMath.sol";

import "./Subscriptions.sol";
import "./DemoBalances.sol";
import "./Instruments.sol";


contract Platform is Owned {
    using SafeMath for uint;

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

    address subscriptionsAddress;
    address balancesAddress;
    address instrumentsAddress;

    address allowedLiquidityProvider;

    modifier onlyAllowedLiquidityProvider {
        require(msg.sender == allowedLiquidityProvider);
        _;
    }

    constructor(
        address _allowedLiquidityProvider,
        address _balancesAddress,
        address _instrumentsAddress,
        address _subscriptionsAddress
    ) public {
        allowedLiquidityProvider = _allowedLiquidityProvider;
        balancesAddress = _balancesAddress;
        instrumentsAddress = _instrumentsAddress;
        subscriptionsAddress = _subscriptionsAddress;
    }

    function setAllowedLiquidityProvider(address _allowedLiquidityProvider) external onlyOwner {
        allowedLiquidityProvider = _allowedLiquidityProvider;
    }

    function setBalancesAddress(address _balancesAddress) external onlyOwner {
        balancesAddress = _balancesAddress;
    }

    function setInstrumentsAddress(address _instrumentsAddress) external onlyOwner {
        instrumentsAddress = _instrumentsAddress;
    }

    function setSubscriptionsAddress(address _subscriptionsAddress) external onlyOwner {
        subscriptionsAddress = _subscriptionsAddress;
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
    ) external onlyAllowedLiquidityProvider {
        require(_marginPercent > 0 && _marginPercent < 100);

        Instruments _instrumentsContract = Instruments(instrumentsAddress);
        require(_instrumentsContract.isCorrect(_instrumentId));

        DemoBalances _balancesContract = DemoBalances(balancesAddress);
        uint _balance = _balancesContract.balanceOf(_investor);
        require(_balance > 0);

        uint _marginSCR = _balance.mul(_marginPercent).div(MARGIN_PERCENT_MULTIPLIER);

        createTrade(
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

        // @todo: lock margin for withdrawal or reusing in other trades
    }

    function closeTrade (
        uint _tradeId,
        uint _closeTime,
        uint _closePriceInstrument,
        uint _closePriceSCRBase
    ) external onlyAllowedLiquidityProvider {
        require(trades[_tradeId].status == STATUS_OPEN);

        // update trade
        trades[_tradeId].status = STATUS_CLOSED;
        tradeQuotes[_tradeId].closeTime = _closeTime;
        tradeQuotes[_tradeId].closePriceInstrument = _closePriceInstrument;
        tradeQuotes[_tradeId].closePriceSCRBaseCurrency = _closePriceSCRBase;

        trades[_tradeId].profitSCR = (int(_closePriceInstrument) - int(tradeQuotes[_tradeId].openPriceInstrument))
            * int(trades[_tradeId].marginSCR)
            * int(trades[_tradeId].leverage)
            / int(PRICE_MULTIPLIER);

        if (trades[_tradeId].cmd == CMD_SELL) {
            trades[_tradeId].profitSCR *= -1;
        }

        // update profit if price SCR/Base was changed
        if (tradeQuotes[_tradeId].closePriceSCRBaseCurrency != tradeQuotes[_tradeId].openPriceSCRBaseCurrency) {
            trades[_tradeId].profitSCR = trades[_tradeId].profitSCR
                * int(tradeQuotes[_tradeId].openPriceSCRBaseCurrency)
                / int(tradeQuotes[_tradeId].closePriceSCRBaseCurrency);
        }

        DemoBalances _balancesContract = DemoBalances(balancesAddress);
        _balancesContract.updateBalance(
            trades[_tradeId].investor,
            trades[_tradeId].profitSCR
        );
    }

    function getTradeIds() public view returns (uint[]) {
        return tradeIds;
    }

    function createTrade(
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
    ) internal {
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
}
