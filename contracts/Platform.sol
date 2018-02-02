pragma solidity ^0.4.18;

import '../libs/Owned.sol';
import '../libs/SafeMath.sol';

import './Subscriptions.sol';
import './DemoBalances.sol';

contract Platform is Owned {
    using SafeMath for uint;

    uint internal constant STATUS_OPENED = 2;
    uint internal constant STATUS_CLOSED = 3;

    mapping (uint => Trade) public trades;
    uint[] tradeIds;

    struct Trade {
        uint traderId;

        // information
        string instrument; //@todo - use instrumentId
        uint openTime;
        string openPrice;   //@todo: use type uint for price
        uint closeTime;
        string closePrice;

        uint investedPercent;
        uint returnProfit;

        uint status;
//        Investing[] investings; //?? @todo
    }

    struct Investing {
        address investorId;
        uint investedAmount; // in SCR
        uint returnedAmount; // in SCR
        // @todo: commisions
    }


    // @todo: set it for owner only
    address subscriptionsAddress;
    address balancesAddress;

    function Platform(address _subscriptionsAddress, address _balancesAddress) {
        subscriptionsAddress = _subscriptionsAddress;
        balancesAddress = _balancesAddress;
    }

    // tradeId => InvestingState[]
//выпилится
    mapping (uint => Investing[]) public tradeIdInvestings;

    uint volumePartMultiplier = 100;

    function createTrade(
        uint _tradeId,
        uint _traderId,
        string _instrument,
        uint _openTime,
        string _openPrice,
        uint _investedPercent
    ) private {
        // 1. write to trades
        trades[_tradeId] = Trade({
            traderId: _traderId,

            instrument: _instrument,
            openTime: _openTime,
            openPrice: _openPrice,
            closeTime: 0,
            closePrice: '',

            investedPercent: _investedPercent,
            returnProfit: 0,
            status: STATUS_OPENED
        });

        tradeIds.push(_tradeId);
    }

    function openTrade (
         uint _tradeId,
         uint _traderId,
         string _instrument,
         uint _openTime,
         string _openPrice,
         uint _investedPercent
    ) external {
        Subscriptions _subscriptionsContract = Subscriptions(subscriptionsAddress);

        createTrade(_tradeId, _traderId, _instrument, _openTime, _openPrice, _investedPercent);

        uint _investorsCount = _subscriptionsContract.getCountOfInvestorsByTraderId(_traderId);
        address _investor;
    // var
        uint _amountToInvest;
        for (uint i = 0; i < _investorsCount; i++) {
            _investor = _subscriptionsContract.getInvestorByTraderIdAndKey(_traderId, i);

            doInvesting(_investor, _tradeId, _investedPercent);
        }
    }

    function doInvesting(
        address _investor,
        uint _tradeId,
        uint _investedPart
    ) internal returns (bool) {
        DemoBalances _balancesContract = DemoBalances(balancesAddress); // @todo: use abstract class for Balances
        uint _balance = _balancesContract.getBalanceOf(_investor);

        // @todo: check if balance gt than comission or minimal investment
        if (_balance == 0) {
            return false;
        }

        uint _amount = _balance.mul(_investedPart).div(volumePartMultiplier);
        if (!_balancesContract.decreaseBalance(_investor, _amount)) {
            return false;
        }

        tradeIdInvestings[_tradeId].push(
            Investing(_investor, _amount, 0)
        );
    }

    function closeTrade (uint id, uint returnAmount) external {
//        Trade storage trade = trades[id];
//
//        require(trade.id == id
//            && trade.status == STATUS_OPENED);
//
//        trade.status = STATUS_CLOSED;
//        trade.returnAmount = returnAmount;
// @todo
    }

    function getTradeIds() public view returns (uint[]) {
        return tradeIds;
    }
}
