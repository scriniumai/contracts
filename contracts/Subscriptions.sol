pragma solidity ^0.4.23;

import "./shared/Owned.sol";

import "./DemoBalances.sol";


contract Subscriptions is Owned {

    address public balancesAddress;

    uint public subscriptionsLimit = 50;

    mapping (address => uint[]) investorTraderIds;
    mapping (uint => address[]) traderIdInvestors;

    constructor(address _balancesAddress) public {
        balancesAddress = _balancesAddress;
    }

    // Allowed only for demo purposes!
    function demoSubscribeAndDeposit(uint[] _traderIds, uint _amount) external {
        privateSubscribe(_traderIds, msg.sender);

        DemoBalances _balances = DemoBalances(balancesAddress);
        _balances.demoDeposit(_amount, msg.sender);
    }

    function subscribe(uint[] _traderIds) external {
        privateSubscribe(_traderIds, msg.sender);
    }

    function unsubscribe(uint[] _traderIdsForUnsubscribe) external {
        for (uint i = 0; i < _traderIdsForUnsubscribe.length; i++) {

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

    function getCountOfInvestorsByTraderId(uint _traderId) external view returns (uint) {
        return traderIdInvestors[_traderId].length;
    }

    function getInvestors(uint _traderId) external view returns (address[]) {
        return traderIdInvestors[_traderId];
    }

    function getInvestorByTraderIdAndKey(uint _traderId, uint key) external view returns (address) {
        return traderIdInvestors[_traderId][key];
    }

    function setSubscriptionsLimit(uint _subscriptionsLimit) onlyOwner external {
        subscriptionsLimit = _subscriptionsLimit;
    }

    function getTraders(address _investor) external view returns (uint[]) {
        return investorTraderIds[_investor];
    }

    function privateSubscribe(uint[] _traderIds, address _investor) internal {
        require(investorTraderIds[_investor].length + _traderIds.length <= subscriptionsLimit);

        bool _isUserExists;
        for (uint i = 0; i < _traderIds.length; i++) {
            _isUserExists = false;

            for (uint k = 0; k < investorTraderIds[_investor].length; k++) {
                if (investorTraderIds[msg.sender][k] == _traderIds[i]) {
                    _isUserExists = true;
                    break;
                }
            }
            if (_isUserExists) {
                continue;
            }
            investorTraderIds[_investor].push(_traderIds[i]);
            traderIdInvestors[_traderIds[i]].push(_investor);
        }
    }
}
