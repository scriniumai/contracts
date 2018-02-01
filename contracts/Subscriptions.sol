pragma solidity ^0.4.18;

import "../libs/Owned.sol";

contract Subscriptions is Owned {
    mapping (address => uint[]) investorTraderIds;
    mapping (uint => address[]) traderIdInvestors;

    uint8 public subscriptionsLimit = 50;

    function setSubscriptionsLimit(uint8 _subscriptionsLimit) onlyOwner external  {
        subscriptionsLimit = _subscriptionsLimit;
    }

    function subscribe(uint[] _traders) external {
        require(investorTraderIds[msg.sender].length + _traders.length <= subscriptionsLimit);

        bool _isUserExists;
        for (uint i = 0; i < _traders.length; i++) {
            _isUserExists = false;

            for (uint k = 0; k < investorTraderIds[msg.sender].length; k++) {
                if (investorTraderIds[msg.sender][k] == _traders[i]) {
                    _isUserExists = true;
                    break;
                }
            }
            if (_isUserExists) {
                continue;
            }
            investorTraderIds[msg.sender].push(_traders[i]);
            traderIdInvestors[_traders[i]].push(msg.sender);
        }
    }

    function unsubscribe(uint[] _traderIdsForUnsubscribe) external {
        for (uint i = 0; i < _traderIdsForUnsubscribe.length; i++) {
            //traderId
            uint traderIdForUnsubsribe = _traderIdsForUnsubscribe[i];

            for (uint k = 0; k < traderIdInvestors[traderIdForUnsubsribe].length; k++) {
                if (traderIdInvestors[traderIdForUnsubsribe][k] == msg.sender) {

                    uint lastInvestorId = traderIdInvestors[traderIdForUnsubsribe].length - 1;

                    traderIdInvestors[traderIdForUnsubsribe][k] = traderIdInvestors[traderIdForUnsubsribe][lastInvestorId];
                    traderIdInvestors[traderIdForUnsubsribe].length = lastInvestorId;
                    break;
                }
            }

            for (uint j = 0; j < investorTraderIds[msg.sender].length; j++) {
                if (investorTraderIds[msg.sender][j] == traderIdForUnsubsribe) {

                    uint lastTraderId = investorTraderIds[msg.sender].length - 1;

                    investorTraderIds[msg.sender][j] = investorTraderIds[msg.sender][lastTraderId];
                    investorTraderIds[msg.sender].length = lastTraderId;
                    break;
                }
            }
        }
    }

    function getCountOfInvestorsByTraderId(uint _traderId) public view returns (uint) {
        return traderIdInvestors[_traderId].length;
    }

    function getInvestorByTraderIdAndKey(uint _traderId, uint key) external view returns (address) {
        return traderIdInvestors[_traderId][key];
    }

    function getTraders() external view returns (uint[]) {
        return investorTraderIds[msg.sender];
    }

    function getInvestors(uint _traderId) external view returns (address[]) {
        return traderIdInvestors[_traderId];
    }
}
