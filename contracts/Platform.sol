pragma solidity ^0.4.18;

import '../libs/Owned.sol';
import '../libs/SafeMath.sol';

contract Platform is Owned {
    using SafeMath for uint256;
    struct Trade {
        uint256 id;
        uint256 traderId;
        uint256 investedAmount;
        uint256 returnAmount;
        uint8 status;
    }

    uint8 internal constant STATUS_OPENED = 0;
    uint8 internal constant STATUS_CLOSED = 1;

    mapping (uint256 => Trade) public trades;

    function openTrade (uint256 id, uint256 traderId, uint256 investedAmount)
    external
    {
        // 1. write to trades
        trades[id] = Trade({
            id: id,
            traderId: traderId,
            investedAmount: investedAmount,
            returnAmount: 0,
            status: STATUS_OPENED
        });
    }

    function closeTrade (uint256 id, uint256 returnAmount)
    external
    {
        Trade storage trade = trades[id];

        require(trade.id == id
            && trade.status == STATUS_OPENED);

        trade.status = STATUS_CLOSED;
        trade.returnAmount = returnAmount;
    }
}
