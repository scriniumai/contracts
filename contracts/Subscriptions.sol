pragma solidity ^0.4.23;

import "./shared/AddressTools.sol";
import "./shared/Owned.sol";

import "./Balances.sol";


contract Subscriptions is Owned {
    using AddressTools for address;

    address public balancesAddress;

    uint public subscriptionsLimit = 50;

    mapping (address => uint[]) investorTraderIds;
    mapping (uint => address[]) traderIdInvestors;

    modifier notZeroAddr (address _address) {
        require(_address.isContract());
        _;
    }

    event BalancesAddressSetted(address indexed _owner, address _balancesAddress);
    event Subscribed(address indexed _investor, uint[] _traderIds);
    event Unsubscribed(address indexed _investor, uint[] _traderIds);
    event SubscriptionsLimitSetted(address indexed _owner, uint subscriptionsLimit);

    constructor(address _balancesAddress) public {
        require(_balancesAddress.isContract());

        balancesAddress = _balancesAddress;

        emit BalancesAddressSetted(msg.sender, _balancesAddress);
    }

    function setBalancesAddress(address _balancesAddress) external onlyOwner notZeroAddr(_balancesAddress) {
        balancesAddress = _balancesAddress;
        emit BalancesAddressSetted(msg.sender, _balancesAddress);
    }

    function setSubscriptionsLimit(uint _subscriptionsLimit) external onlyOwner {
        subscriptionsLimit = _subscriptionsLimit;
        emit SubscriptionsLimitSetted(msg.sender, _subscriptionsLimit);
    }

    function subscribe(uint[] _traderIds) external {
        Balances _balances = Balances(balancesAddress);
        require(_balances.balanceOf(msg.sender) > 0);
        _subscribe(_traderIds, msg.sender);
    }

    function unsubscribe(uint[] _traderIds) external {
        for (uint i = 0; i < _traderIds.length; i++) {

            uint traderIdForUnsubsribe = _traderIds[i];

            for (uint k = 0; k < traderIdInvestors[traderIdForUnsubsribe].length; k++) {
                if (traderIdInvestors[traderIdForUnsubsribe][k] == msg.sender) {

                    if (traderIdInvestors[traderIdForUnsubsribe].length == 1) {
                        traderIdInvestors[traderIdForUnsubsribe].length = 0;
                        break;
                    }

                    uint lastInvestorId = traderIdInvestors[traderIdForUnsubsribe].length - 1;

                    traderIdInvestors[traderIdForUnsubsribe][k] = traderIdInvestors[traderIdForUnsubsribe][lastInvestorId];
                    traderIdInvestors[traderIdForUnsubsribe].length--;
                    break;
                }
            }

            for (uint j = 0; j < investorTraderIds[msg.sender].length; j++) {
                if (investorTraderIds[msg.sender][j] == traderIdForUnsubsribe) {

                    if (investorTraderIds[msg.sender].length == 1) {
                        investorTraderIds[msg.sender].length = 0;
                        break;
                    }

                    uint lastTraderId = investorTraderIds[msg.sender].length - 1;

                    investorTraderIds[msg.sender][j] = investorTraderIds[msg.sender][lastTraderId];
                    investorTraderIds[msg.sender].length--;
                    break;
                }
            }
        }
        emit Unsubscribed(msg.sender, _traderIds);
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

    function getTraders(address _investor) external view returns (uint[]) {
        return investorTraderIds[_investor];
    }

    function _subscribe(uint[] _traderIds, address _investor) internal {
        require(investorTraderIds[_investor].length + _traderIds.length <= subscriptionsLimit);

        bool _isSubscriptionExists;
        for (uint i = 0; i < _traderIds.length; i++) {
            _isSubscriptionExists = false;

            for (uint k = 0; k < investorTraderIds[_investor].length; k++) {
                if (investorTraderIds[_investor][k] == _traderIds[i]) {
                    _isSubscriptionExists = true;
                    break;
                }
            }

            if (_isSubscriptionExists) {
                continue;
            }

            investorTraderIds[_investor].push(_traderIds[i]);
            traderIdInvestors[_traderIds[i]].push(_investor);
        }

        emit Subscribed(_investor, _traderIds);
    }
}
