var Subscriptions = artifacts.require("Subscriptions");
var DemoBalances = artifacts.require("DemoBalances");

var fs = require('fs');

module.exports = function(deployer, network){
  deployer.deploy(Subscriptions, DemoBalances.address)
    .then(function () {

          var code =`
// migrations/4_subscriptions.js
var subscriptions = eth.contract(JSON.parse('${JSON.stringify(Subscriptions.abi)}')).at('${Subscriptions.address}');
`;

      return fs.appendFileSync(`./preload-${network}.js`, code);
    });
};
