var DemoBalances = artifacts.require("DemoBalances");
var Scrinium = artifacts.require("Scrinium");

var fs = require('fs');

module.exports = function(deployer, network){
    deployer.deploy(DemoBalances, Scrinium.address)
      .then(function () {

        if (network !== 'testing') { // do not use it for tests
          var code =`
// migrations/3_demo_balances.js
var demoBalances = eth.contract(JSON.parse('${JSON.stringify(DemoBalances.abi)}')).at('${DemoBalances.address}');
`;
          return fs.appendFileSync('./preload.js', code);
        }
      });
};
