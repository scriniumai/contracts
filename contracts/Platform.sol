pragma solidity ^0.4.18;

import '../libs/Owned.sol';
import '../libs/SafeMath.sol';

import './Subscriptions.sol';
import './DemoBalances.sol';
import './Instruments.sol';

contract Platform is Owned {
    using SafeMath for uint;

    uint internal constant STATUS_PENDING = 1;
    uint internal constant STATUS_OPEN = 2;
    uint internal constant STATUS_CLOSED = 3;

    uint internal constant CMD_BUY = 0;
    uint internal constant CMD_SELL = 1;

    uint internal constant PRICE_MULTIPLIER = 1000000; // 10**6
    uint internal constant MARGIN_PERCENT_MULTIPLIER = 100;

    struct Trade {
        address liquidProviderAddress;
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
        uint256 openTime; //@todo: use TimePriceQuote
        uint256 openPriceInstrument;
        uint256 openPriceSCRBaseCurrency;

        uint256 closeTime; //@todo: use TimePriceQuote
        uint256 closePriceInstrument;
        uint256 closePriceSCRBaseCurrency;
    }

    mapping (uint => Trade) public trades;
    mapping (uint => TradeQuotes) public tradeQuotes;

    uint[] tradeIds;

    address subscriptionsAddress;
    address balancesAddress;
    address instrumentsAddress;

    function Platform(address _subscriptionsAddress, address _balancesAddress) {
        subscriptionsAddress = _subscriptionsAddress;
        balancesAddress = _balancesAddress;
    }

    function setSubscriptionsAddress(address _subscriptionsAddress) external onlyOwner {
        subscriptionsAddress = _subscriptionsAddress;
    }

    function setBalancesAddress(address _balancesAddress) external onlyOwner {
        balancesAddress = _balancesAddress;
    }

    function setInstrumentsAddress(address _instrumentsAddress) external onlyOwner {
        instrumentsAddress = _instrumentsAddress;
    }

    struct testMeStruct {
        int foo;
    }

    mapping (uint => testMeStruct) testMeMapping;

    function testMe(uint _tradeId) external {
        trades[_tradeId].profitSCR = -1;
        trades[_tradeId].profitSCR = -2;

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
    ) external onlyAllowedLiquidProvider {
        Instruments _instrumentsContract = Instruments(instrumentsAddress);
        Balances _balancesContract = Balances(balancesAddress);

        uint _balance = _balancesContract.balanceOf(_investor);
        require(
            _balance > 0 &&
            0 < _marginPercent && _marginPercent < 100 &&
            _instrumentsContract.isCorrect(_instrumentId)
        );

        createTrade(
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

        // count marginSCR
        trades[_tradeId].marginSCR = _balance.mul(_marginPercent).div(MARGIN_PERCENT_MULTIPLIER);

        // @todo: lock margin for withdrawal or reusing in other trades
    }

    function closeTrade (
        uint _tradeId,
        uint _closeTime,
        uint _closePriceInstrument,
        uint _closePriceSCRBase
    ) external onlyAllowedLiquidProvider {
        require(trades[_tradeId].status == STATUS_OPEN);

        // update trade
        trades[_tradeId].status = STATUS_CLOSED;
        tradeQuotes[_tradeId].closeTime = _closeTime;
        tradeQuotes[_tradeId].closePriceInstrument = _closePriceInstrument;
        tradeQuotes[_tradeId].closePriceSCRBaseCurrency = _closePriceSCRBase;

        trades[_tradeId].profitSCR = (int(_closePriceInstrument) - int(tradeQuotes[_tradeId].openPriceInstrument))
            * int(trades[_tradeId].marginSCR)
            * int(trades[_tradeId].leverage)
            / int(PRICE_MULTIPLIER)
        ;

        if (trades[_tradeId].cmd == CMD_SELL) {
            trades[_tradeId].profitSCR *= -1;
        }

        // update profit if price SCR/Base was changed
        if (tradeQuotes[_tradeId].closePriceSCRBaseCurrency != tradeQuotes[_tradeId].openPriceSCRBaseCurrency) {
            trades[_tradeId].profitSCR = trades[_tradeId].profitSCR
                * int(tradeQuotes[_tradeId].openPriceSCRBaseCurrency)
                / int(tradeQuotes[_tradeId].closePriceSCRBaseCurrency)
            ;
        }

        DemoBalances _balancesContract = DemoBalances(balancesAddress);

        // @todo: optimize me - _balancesContract.updateBalance()
        if (trades[_tradeId].profitSCR > 0) {
            _balancesContract.increaseBalance(
                trades[_tradeId].investor,
                uint(trades[_tradeId].profitSCR)
            );
        } else {
            _balancesContract.decreaseBalance(
                trades[_tradeId].investor,
                uint(-1 * trades[_tradeId].profitSCR)
            );
        }
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
        uint _leverage,
        uint _cmd,

        uint _openTime,
        uint _openPriceInstrument,
        uint _openPriceSCRBase
    ) internal {
        trades[_tradeId].liquidProviderAddress = msg.sender;
        trades[_tradeId].investor = _investor;
        trades[_tradeId].masterTraderId = _masterTraderId;
        trades[_tradeId].instrumentId = _instrumentId;
        trades[_tradeId].marginPercent = _marginPercent;
        trades[_tradeId].leverage = _leverage;
        trades[_tradeId].cmd = _cmd;

        trades[_tradeId].status = STATUS_OPEN;

        tradeQuotes[_tradeId].openTime = _openTime;
        tradeQuotes[_tradeId].openPriceInstrument = _openPriceInstrument;
        tradeQuotes[_tradeId].openPriceSCRBaseCurrency = _openPriceSCRBase;

        tradeIds.push(_tradeId);
    }

    address allowedLiquidProvider;
    function setAllowedLiquidProvider(address _allowedLiquidProvider) public onlyOwner {
        allowedLiquidProvider = _allowedLiquidProvider;
    }

    modifier onlyAllowedLiquidProvider {
        require(msg.sender == allowedLiquidProvider);
        _;
    }
}
