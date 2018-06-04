var Instruments = artifacts.require("Instruments");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(
      Instruments
    ).then(function (instruments) {

      const instrumentsData = require('../data/instruments.json');

      const txs = instrumentsData.map(
        ({ id, name, type }) => instruments.add(
          id,
          name,
          type,
          { from: accounts[0] }
        )
      );

      return Promise.all(txs);
    }).then(function () {
      return global.writeGethClientPreload(
        network,
        {
         instruments: {
            comment: __filename,
            abi: Instruments.abi,
            address: Instruments.address
          }
        }
      );
    });
};
