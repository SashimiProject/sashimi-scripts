const HDWalletProvider = require("@truffle/hdwallet-provider");
const keys = require("../../keys");
const providers = require('../../providers');
const info = require('../../info.json');

module.exports = {

    networks: {
        development: {
            host: "127.0.0.1",
            network_id: "*",
            port: 7245,
            gas: 4000000,
            gasPrice: 10000000000, // 10 gwei
        },

        kovan: {
            provider: function () {
                return new HDWalletProvider({
                    privateKeys: keys.privateKeys,
                    providerOrUrl: providers.kovan,
                    numberOfAddresses: keys.privateKeys.length,
                    pollingInterval: 60000
                })
            },
            gas: 1000000
        },

        mainnet: {
            provider: function () {
                return new HDWalletProvider({
                    privateKeys: keys.privateKeys,
                    providerOrUrl: providers.mainnet,
                    numberOfAddresses: keys.privateKeys.length,
                    pollingInterval: 60000
                })
            },
            gas: 1000000,
            contracts:{
                oracle: "0x9fF795A1fB46F869b9158Ef0579a613177D68b26"
            },
            tokenMap: {
                'ETH': {
                    symbol: "ETH",
                    decimals: 18,
                    huobi: {
                        pair: "ethusdt",
                        weight: 435
                    },
                    binance: {
                        pair: "ETHUSDT",
                        weight: 528
                    },
                    uniswap: {
                        lpTokenAddress: "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852", //ETH-USDT lp token address(mainnet)
                        isReversed: false,
                        weight: 37
                    },
                    sashimiswap: {
                        lpTokenAddress: "0x490Ccb3C835597Ff31E525262235487f9426312b", //ETH-USDT lp token address(mainnet)
                        isReversed: false,
                        weight: 0
                    },
                    price_decimals: 3
                },
                'WBTC': {
                    symbol: "WBTC",
                    decimals: 8,
                    huobi: {
                        pair: "wbtcbtc",
                        weight: 6,
                        nextPair: "btcusdt"
                    },
                    binance: {
                        pair: "WBTCBTC",
                        weight: 127,
                        nextPair: "BTCUSDT"
                    },
                    uniswap: {
                        lpTokenAddress: "0xbb2b8038a1640196fbe3e38816f3e67cba72d940", //WBTC-ETH lp token address(mainnet)
                        isReversed: false,
                        weight: 867
                    },
                    price_decimals: 3
                },
                'DAI': {
                    symbol: "DAI",
                    decimals: 18,
                    huobi: {
                        pair: "daiusdt",
                        weight: 12
                    },
                    binance: {
                        pair: "DAIUSDT",
                        weight: 123
                    },
                    uniswap: {
                        lpTokenAddress: "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11", //DAI-ETH lp token address(mainnet)
                        isReversed: false,
                        weight: 865
                    },
                    price_decimals: 6
                },
                'YFI': {
                    symbol: "YFI",
                    decimals: 18,
                    huobi: {
                        pair: "yfiusdt",
                        weight: 175
                    },
                    binance: {
                        pair: "YFIUSDT",
                        weight: 766
                    },
                    uniswap: {
                        lpTokenAddress: "0x2fDbAdf3C4D5A8666Bc06645B8358ab803996E28", //YFI-ETH lp token address(mainnet)
                        isReversed: false,
                        weight: 59
                    },
                    price_decimals: 3
                },
                'ELF': {
                    symbol: "ELF",
                    decimals: 18,
                    huobi: {
                        pair: "elfusdt",
                        weight: 508
                    },
                    binance: {
                        pair: "ELFBTC",
                        weight: 490,
                        nextPair: "BTCUSDT"
                    },
                    uniswap: {
                        lpTokenAddress: "0xA6be7F7C6c454B364cDA446ea39Be9e5E4369DE8",
                        isReversed: false,
                        weight: 2
                    },
                    price_decimals: 6
                },
                'SASHIMI': {
                    symbol: "SASHIMI",
                    decimals: 18,
                    huobi: {
                        pair: "",
                        weight: 0
                    },
                    binance: {
                        pair: "",
                        weight: 0
                    },
                    uniswap: {
                        lpTokenAddress: "", //
                        isReversed: false,
                        weight: 0
                    },
                    sashimiswap: {
                        lpTokenAddress: "0x3fA4B0b3053413684d0B658689Ede7907bB4D69D", //
                        isReversed: true
                    },
                    price_decimals: 6
                },
            }
        }
    },

    api_keys: {
        etherscan: info.api_etherscan
    }
};