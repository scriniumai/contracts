module.exports = {
  networks: {
    development: {
      host: "app13.appdevstage.com",
      port: 8545,
      network_id: "*",
      gas:1600000
    },
    testing: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas:1600000
    }
  }
};
