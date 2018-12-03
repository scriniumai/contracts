pragma solidity ^0.4.23;

import "./shared/AddressTools.sol";
import "./shared/Owned.sol";

import "./Balances.sol";


contract Subscriptions is Owned {
    using AddressTools for address;

    uint public SUBSCRIPTIONS_LIMIT = 50;

    address public balancesAddress;

    mapping (address => bool) public investorsWithPortfolios;
    mapping (address => uint) public investorLastPortfolioDate;
    mapping (address => uint) public investorLastPortfolioBlock;

    mapping(uint => mapping(address => uint[])) private tradersIdsByBlocksAndInvestors;
    mapping(uint => mapping(uint => address[])) private investorsByBlocksAndTradersIds;
    mapping(uint => mapping(address => bool)) private traderIdActualInvestors;

    mapping (uint => address[]) private traderIdInvestors;

    modifier notZeroAddr (address _address) {
        require(_address.isContract());
        _;
    }

    event BalancesAddressSetted(address indexed _owner, address _balancesAddress);
    event Subscribed(address indexed _investor, uint[] _tradersIds);
    event Unsubscribed(address indexed _investor, uint[] _tradersIds);
    event SubscriptionsLimitSetted(address indexed _owner, uint _subscriptionLimit);

    constructor (address _balancesAddress) public {
        require(_balancesAddress.isContract());

        balancesAddress = _balancesAddress;

        emit BalancesAddressSetted(msg.sender, _balancesAddress);
    }

    function setBalancesAddress (address _balancesAddress) external onlyOwner notZeroAddr(_balancesAddress) {
        balancesAddress = _balancesAddress;
        emit BalancesAddressSetted(msg.sender, _balancesAddress);
    }

    function setSubscriptionsLimit (uint _subscriptionLimit) external onlyOwner {
        SUBSCRIPTIONS_LIMIT = _subscriptionLimit;
        emit SubscriptionsLimitSetted(msg.sender, _subscriptionLimit);
    }

    function subscribe (uint[] _tradersIds) external {
        require(Balances(balancesAddress).balanceOf(msg.sender) > 0);

        uint _investorLastPortfolioBlock = investorLastPortfolioBlock[msg.sender];
        uint[] memory _subscriptions = tradersIdsByBlocksAndInvestors[_investorLastPortfolioBlock][msg.sender];

        _unsubscribe(_subscriptions, msg.sender);

        _subscribe(_tradersIds, msg.sender);

        emit Subscribed(msg.sender, _tradersIds);
    }

    function unsubscribe (uint[] _tradersIds) external {
        _unsubscribe(_tradersIds, msg.sender);

        emit Unsubscribed(msg.sender, _tradersIds);
    }

    function getInvestorLastPortfolioBlock (address _investor) external view returns (uint) {
        return investorLastPortfolioBlock[_investor];
    }

    function getInvestorLastPortfolioDate (address _investor) external view returns (uint) {
        return investorLastPortfolioDate[_investor];
    }

    function getInvestors (uint _traderId) external view returns (address[]) {
        return traderIdInvestors[_traderId];
    }

    function getTraders (address _investor) external view returns (uint[]) {
        uint _investorLastPortfolioBlock = investorLastPortfolioBlock[_investor];
        return tradersIdsByBlocksAndInvestors[_investorLastPortfolioBlock][_investor];
    }

    function isInvestorActualForTraderId (uint _traderId, address _investor) external view returns (bool) {
        return traderIdActualInvestors[_traderId][_investor];
    }

    function _subscribe (uint[] _tradersIds, address _investor) private {
        require(_tradersIds.length <= SUBSCRIPTIONS_LIMIT);

        for (uint i = 0; i < _tradersIds.length; i++) {
            uint _traderId = _tradersIds[i];

            if (! this.isInvestorActualForTraderId(_traderId, _investor)) {
                traderIdInvestors[_traderId].push(_investor);
            }

            tradersIdsByBlocksAndInvestors[block.number][_investor].push(_traderId);
            investorsByBlocksAndTradersIds[block.number][_traderId].push(_investor);

            traderIdActualInvestors[_traderId][_investor] = true;
        }

        investorsWithPortfolios[_investor] = true;
        investorLastPortfolioDate[_investor] = block.timestamp;
        investorLastPortfolioBlock[_investor] = block.number;
    }

    function _unsubscribe (uint[] _tradersIds, address _investor) private {
        uint _investorLastPortfolioBlock = investorLastPortfolioBlock[_investor];
        uint[] storage _investorTradersIds = tradersIdsByBlocksAndInvestors[_investorLastPortfolioBlock][_investor];

        for (uint i = 0; i < _tradersIds.length; i++) {

            uint _traderId = _tradersIds[i];

            traderIdActualInvestors[_traderId][_investor] = false;

            for (uint k = 0; k < _investorTradersIds.length; k++) {
                if (_investorTradersIds[k] == _traderId) {

                    if (_investorTradersIds.length == 1) {
                        _investorTradersIds.length = 0;
                        break;
                    }

                    uint lastTraderId = _investorTradersIds.length - 1;

                    _investorTradersIds[k] = _investorTradersIds[lastTraderId];
                    _investorTradersIds.length--;
                    break;
                }
            }
        }

        if (_investorTradersIds.length == 0) {
            investorsWithPortfolios[_investor] = false;
            investorLastPortfolioDate[_investor] = 2 ** 256 - 1;
            investorLastPortfolioBlock[_investor] = 0;
        }
    }
}
