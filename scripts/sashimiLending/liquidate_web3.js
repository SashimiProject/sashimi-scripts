const Web3 = require('web3');
const info = require('../../info.json');
const config = require("./sashimi-lending-config");
const ComptrollerABI = require('./abis/Comptroller.json');
const PriceOracleABI = require("./abis/PriceOracle.json");
const SLUSDTABI = require('./abis/slUSDT.json');
const SLErc20ABI = require('./abis/slErc20.json');
const SLEtherABI = require('./abis/slEther.json');
const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');
const HttpsProxyAgent = require('https-proxy-agent');

let web3;

async function loadTokenContracts() {
    for (const [tokenAddress, slToken] of Object.entries(this.slTokenMap)) {        
        slToken.contract = new web3.eth.Contract(JSON.parse(slToken.abi), tokenAddress);
    }        
}

/*use ethscan API
  TODO： Add ethgasstation for backup
*/
async function getGasPrice(){
    try{
        let url = new URL('https://api.etherscan.io/api');
        let params = {
          "module": "gastracker",
          "action": "gasoracle",
          "apikey": info.api_etherscan
        };
        url.search = new URLSearchParams(params).toString();
        let response = await fetch(url,{
            agent: new HttpsProxyAgent("http://127.0.0.1:1087") //proxy only use in local.Online can remove it.
        });
        let gasOracle = await response.json();
        if(gasOracle.status != "1" || gasOracle.message !="OK"){
            //TODO Add retry logic
        }
        console.log(gasOracle.result.FastGasPrice);
        return new web3.utils.BN(parseInt(gasOracle.result.FastGasPrice) * 10**9);
    }
    catch(e){
        console.log(e)
    }
}

async function getETHPrice(){
    let priceOracle = new web3.eth.Contract(JSON.parse(PriceOracleABI.result), "0xf3e79be9b4f9793bc6cc7ec72e9a9a772dda68c6");
    var ethOraclePrice = await priceOracle.methods.getUnderlyingPrice("0xC3a0936374E7DA02692C7B3b2167D1e5e67D7eE8").call(); 
    return web3.utils.toBN(ethOraclePrice);
}

slTokenMap = {
    '0x4ae71f0e6f6976033be85b2773fd2cf88998ecc5': {
        symbol: "slUSDT",
        abi: SLUSDTABI.result
    },
    '0x0c18e5c128866ee48131338789ee3a0aa5ae1cf5': {
        symbol: "slELF",
        abi: SLErc20ABI.result
    },
    '0x6643a5637764a65aa458a017f1b2fe0cf28af8e8': {
        symbol: "slGOF",
        abi: SLErc20ABI.result
    },
    '0xc3a0936374e7da02692c7b3b2167d1e5e67d7ee8': {
        symbol: "slETH",
        abi: SLEtherABI.result
    }
  };
let close_factor = 0.5;
let liquidation_incentive = 1.08;

async function liquidate(){
    console.log("start");
    web3 = new Web3(config.networks.kovan.provider());
    web3.eth.defaultAccount=info.addresses.alice;
    await loadTokenContracts();
    let comptroller = new web3.eth.Contract(JSON.parse(ComptrollerABI.result), "0x63Db84C0dF75205081c1ba1D5dc292aaA4166Dcb");
        
    try {
        let response = await fetch("https://test-loan.sashimi.cool/api/loan/unhealthyAccounts",{
            agent: new HttpsProxyAgent("http://127.0.0.1:1087") //proxy only use in local.Online can remove it.
        });
        let result = await response.json();
        if(result.code != 0){
            console.log(result); //TODO 写日志
        }
        let gasPrice = await getGasPrice();
        let unhealthyAccounts = [];
        for (const account of result.data) {
            let accountLiquidity = await comptroller.methods.getAccountLiquidity(account.address).call();
            if(accountLiquidity['1'] > 0) continue;
            let unhealthyAccount = {};
            unhealthyAccount.debt = [];
            unhealthyAccount.collateral = [];
            unhealthyAccount.address = account.address;
            unhealthyAccount.total_borrow_value_in_usd = parseFloat(account.totalBorrowValueInUSD);
            unhealthyAccount.total_collateral_value_in_usd = parseFloat(account.totalCollateralValueInUSD);
            account.tokens.forEach(token => {
                let slToken = {};
                slToken.symbol = token.symbol;
                slToken.underlying_decimals = token.market.underlyingDecimals;
                slToken.underlying_price = parseFloat(token.market.underlyingPriceUSD);
                slToken.address = token.address;
                slToken.contract = slTokenMap[slToken.address].contract;
                slToken.borrow_balance_underlying = parseFloat(token.storedBorrowBalance);
                slToken.borrow_balance_underlying_in_usd = slToken.underlying_price * slToken.borrow_balance_underlying;
                slToken.supply_balance_underlying = parseFloat(token.cTokenBalance) * parseFloat(token.market.exchangeRate);
                console.log(slToken.supply_balance_underlying);
                slToken.supply_balance_underlying_in_usd = slToken.underlying_price * slToken.supply_balance_underlying;
                if (slToken.borrow_balance_underlying > 0) {
                    unhealthyAccount.debt.push(slToken);
                }
                if (slToken.supply_balance_underlying > 0) {
                    unhealthyAccount.collateral.push(slToken);
                }
            });
            unhealthyAccount.debt.sort((a, b) => b.borrow_balance_underlying_in_usd - a.borrow_balance_underlying_in_usd);
            unhealthyAccount.collateral.sort((a, b) => b.supply_balance_underlying_in_usd - a.supply_balance_underlying_in_usd);
            console.log(unhealthyAccount);
            unhealthyAccounts.push(unhealthyAccount);
        };
        let ethPrice;
        if(unhealthyAccounts.length > 0){
            ethPrice = await getETHPrice();
        }        
        unhealthyAccounts.sort((a, b) => b.total_borrow_value_in_usd - a.total_borrow_value_in_usd);
        for (const unhealthyAccount of unhealthyAccounts) {
            let liquidationAmount = unhealthyAccount.debt[0].borrow_balance_underlying * close_factor;
            const expectedCollateral = unhealthyAccount.debt[0].borrow_balance_underlying_in_usd * close_factor * liquidation_incentive;
            const actualCollateral = unhealthyAccount.collateral[0].supply_balance_underlying_in_usd;
            if (expectedCollateral > actualCollateral) {
                liquidationAmount = actualCollateral / (liquidation_incentive * unhealthyAccount.debt[0].underlying_price);
            }
            let expectedGasAmount = 0;
            if (unhealthyAccount.debt[0].symbol === 'slETH') {
                expectedGasAmount = await unhealthyAccount.debt[0].contract.methods.liquidateBorrow(unhealthyAccount.address, unhealthyAccount.collateral[0].address).estimateGas({from: info.addresses.alice ,gas: 1000000, value: (liquidationAmount * 10**unhealthyAccount.debt[0].underlying_decimals).toFixed(0)});
                console.log(expectedGasAmount);
                console.log('slETH');
            } else {
                expectedGasAmount = await unhealthyAccount.debt[0].contract.methods.liquidateBorrow(unhealthyAccount.address, (liquidationAmount * 10**unhealthyAccount.debt[0].underlying_decimals).toFixed(0), unhealthyAccount.collateral[0].address).estimateGas({from: info.addresses.alice});
                console.log(expectedGasAmount);
                console.log(unhealthyAccount.debt[0].symbol);
            }
            const expectedGasFee = web3.utils.fromWei(gasPrice.mul(web3.utils.toBN(expectedGasAmount)).mul(ethPrice).div(web3.utils.toBN(10**18)));
            console.log(expectedGasFee);
            const expectedRevenue = expectedCollateral - (liquidationAmount * unhealthyAccount.debt[0].underlying_price);
            console.log(expectedRevenue);
            const expectedProfit = expectedRevenue - expectedGasFee;
            console.log(expectedProfit);
            // if(expectedProfit <= 0) continue;
            // if (unhealthyAccount.debt[0].symbol === 'slETH') {
            //     expectedGasAmount = await unhealthyAccount.debt[0].contract.methods.liquidateBorrow(unhealthyAccount.address, unhealthyAccount.collateral[0].address).send({from: info.addresses.alice, gasPrice: gasPrice.toNumber(),gas: 1000000,value: (liquidationAmount * 10**unhealthyAccount.debt[0].underlying_decimals).toFixed(0)});
            //     console.log('slETH');
            // } else {
            //     expectedGasAmount = await unhealthyAccount.debt[0].contract.methods.liquidateBorrow(unhealthyAccount.address, (liquidationAmount * 10**unhealthyAccount.debt[0].underlying_decimals).toFixed(0), unhealthyAccount.collateral[0].address).send({from: info.addresses.alice, gasPrice: gasPrice.toNumber(),gas: 1000000 });
            //     console.log(unhealthyAccount.debt[0].symbol);
            // }
        }
    }
    catch (e) {
        // This is where you run code if the server returns any errors
        console.log(e);
    }
    
    console.log('End.');
    process.exit();
}

liquidate();