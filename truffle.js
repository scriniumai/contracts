module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 5777,
      gas: 2 * 10**6
    },
    staging: {
      host: "127.0.0.1",
      port: 8546,
      network_id: "*",
      gas: 2 * 10**6
    }
  }
};
