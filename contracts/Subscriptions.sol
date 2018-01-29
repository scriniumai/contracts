pragma solidity 0.4.18;

import "../libs/Owned.sol";

contract Subscriptions is Owned {
    mapping (address => uint64[]) tradersByInvestor;
    mapping (uint64 => address[]) investorsByTrader;

    uint8 public subscriptionsLimit = 50;

    function setSubscriptionsLimit(uint8 _subscriptionsLimit) onlyOwner external  {
        subscriptionsLimit = _subscriptionsLimit;
    }

    function subscribe(uint64[] _traders) external {
        require(tradersByInvestor[msg.sender].length + _traders.length <= subscriptionsLimit);

        bool _isUserExists;
        for (uint i = 0; i < _traders.length; i++) {
            _isUserExists = false;

            for (uint k = 0; k < tradersByInvestor[msg.sender].length; k++) {
                if (tradersByInvestor[msg.sender][k] == _traders[i]) {
                    _isUserExists = true;
                    break;
                }
            }
            if (_isUserExists) {
                continue;
            }
            tradersByInvestor[msg.sender].push(_traders[i]);
            investorsByTrader[_traders[i]].push(msg.sender);
        }
    }

    function unsubscribe(uint64[] _traders) external {
        for (uint i = 0; i < _traders.length; i++) {
            uint64 trader = _traders[i];

            for (uint k = 0; k < investorsByTrader[trader].length; k++) {
                if (investorsByTrader[trader][k] == msg.sender) {

                    uint lastInvestorId = investorsByTrader[trader].length - 1;

                    investorsByTrader[trader][k] = investorsByTrader[trader][lastInvestorId];
                    investorsByTrader[trader].length = lastInvestorId;
                    break;
                }
            }

            for (uint j = 0; j < tradersByInvestor[msg.sender].length; j++) {
                if (tradersByInvestor[msg.sender][j] == _traders[i]) {
                    delete tradersByInvestor[msg.sender][j];

                    tradersByInvestor[msg.sender][j] = tradersByInvestor[msg.sender][tradersByInvestor[msg.sender].length - 1];
                    tradersByInvestor[msg.sender].length = tradersByInvestor[msg.sender].length - 1;
                    break;
                }
            }
        }
    }

    function getTraders() external view returns (uint64[]) {
        return tradersByInvestor[msg.sender];
    }

    function getInvestors(uint64 _trader) external view returns (address[]) {
        return investorsByTrader[_trader];
    }
}
