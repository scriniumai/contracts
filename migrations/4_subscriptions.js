var Subscriptions = artifacts.require("Subscriptions");

var fs = require('fs');

module.exports = function(deployer, network){
  deployer.deploy(Subscriptions)
    .then(function () {

          var code =`
// migrations/4_subscriptions.js
var subscriptions = eth.contract(JSON.parse('${JSON.stringify(Subscriptions.abi)}')).at('${Subscriptions.address}');
`;

      return fs.appendFileSync(`./preload-${network}.js`, code);
    });
};
