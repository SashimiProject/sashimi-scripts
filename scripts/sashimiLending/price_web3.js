const Web3 = require('web3');
const info = require('../../info.json');
const config = require("./sashimi-lending-config");
const SashimiOracle = require('../../build/contracts/SashimiOracle.json');
const IUniswapV2Pair = require('../../build/contracts/IUniswapV2Pair.json');
const helper = require('../helper');
const { encode, sign } = require('./reporter');
const { time } = require('./Helpers');

tokenMap = {
  'SASHIMI': {
    symbol: "SASHIMI",
    lpTokenAddress: "0x05FD6e48bf3530e5129A8f507Bc7E331EC3032C0", //SASHIMI-ETH lp token address
    decimals: 18,
    isReversed: false
  }
};

let sashimiOracle;

async function postPrices(timestamp, prices2dArr, symbols, signer = reporter) {
  let {
    messages,
    signatures
  } = prices2dArr.reduce(({ messages, signatures }, prices, i) => {
    const signedMessages = sign(
      encode(
        'prices',
        timestamp,
        prices
      ),
      signer.privateKey
    );

    return signedMessages.reduce(({ messages, signatures }, { message, signature }) => {
      return {
        messages: [...messages, message],
        signatures: [...signatures, signature],
      };
    }, { messages, signatures });
  }, { messages: [], signatures: [] });
  //TODO gas price
  //TODO 用BN解决精度问题
  //TODO 从各个地方获取价格，用权重获取均价
  await sashimiOracle.methods.postPrices(messages, signatures, symbols).send({from:info.addresses.alice});
}

async function main() { 
  console.log("start");
  try {
    let web3 = new Web3(config.networks.kovan.provider());
    const slETHAddress = "0xC3a0936374E7DA02692C7B3b2167D1e5e67D7eE8"
    web3.eth.defaultAccount=info.addresses.alice;
    const reporter = web3.eth.accounts.privateKeyToAccount(info.keyMap.alice);
    sashimiOracle = new web3.eth.Contract(SashimiOracle.abi, "0xf3e79be9b4f9793bc6cc7ec72e9a9a772dda68c6");
    let chainlinkOracleView = new web3.eth.Contract(SashimiOracle.abi, "0x5BcF405BCaf0375Fbda318cEaC3F9fa9997677Dd");
    let ethPriceInUSD = web3.utils.toBN(await sashimiOracle.methods.getUnderlyingPrice(slETHAddress).call()); //decimals of ethPriceInUSD is 18
    let prices = await helper.readJson("prices.json");// get price from prices.json
    let post = [];
    for (const [symbol, token] of Object.entries(this.tokenMap)) {
      var uniswapPair = new web3.eth.Contract(IUniswapV2Pair.abi, token.lpTokenAddress);
      var reserves = await uniswapPair.methods.getReserves().call();
      let priceInETH = 0;
      var reserve1 = web3.utils.toBN(reserves.reserve1);
      var reserve0 = web3.utils.toBN(reserves.reserve0);
      var decimals = web3.utils.toBN(10 ** token.decimals);
      if (!token.isReversed) {
        priceInETH = decimals.mul(reserve1).div(reserve0); //decimals of priceInETH is 18
      }else{
        priceInETH = decimals.mul(reserve0).div(reserve1); //decimals of priceInETH is 18
      }
      var priceInUSD = (priceInETH.mul(ethPriceInUSD).div(web3.utils.toBN(10**15)).div(web3.utils.toBN(10**15))).toNumber(); //decimals of priceInUSD is 6
      if (prices[symbol] == undefined) { // post price when symbol is not in prices.json
        prices[symbol] = priceInUSD;
        post.push(token);
      }
      else {
        var upperBound = parseInt(prices[symbol] * 1001 / 1000);
        var lowerBound = parseInt(prices[symbol] * 999 / 1000);
        if(priceInUSD > upperBound || priceInUSD < lowerBound){ //post price when price change is larger than 0.1%
          console.log(upperBound);
          console.log(lowerBound);
          console.log(priceInUSD);
          prices[symbol] = priceInUSD;
          post.push(token);
        }
      }
    }
    if(post.length > 0){
      let symobls = [];
      let priceArray = [];
      priceArray[0] = [];
      for(const token of post){
        symobls.push(token.symbol);
        var array = [token.symbol, prices[token.symbol]/10**6];
        priceArray[0].push(array);
      }
      console.log(JSON.stringify(symobls));
      console.log(JSON.stringify(priceArray));
      const timestamp = time() - 5;
      //await postPrices(timestamp, [[["ELF",0.077972],["GOF",0.511617],["SASHIMI",0.0036]]], ['ELF',"GOF","SASHIMI"], reporter);
      //await postPrices(timestamp, [[["GOF",0.460455]]], ["GOF"], reporter);
      //await postPrices(timestamp, [[["GOF",0.511617]]], ["GOF"], reporter);
      await postPrices(timestamp, priceArray, symobls, reporter); //update oracle price 
      console.log(JSON.stringify(prices));
      await helper.writeJsonSync("prices", prices); //save pirces to prices.json
    } 
  } catch (error) {
    console.log(error);
  }  
  console.log('End.');
}

(async () => {
  try {
      await main();
      process.exit();
  } catch (e) {
    console.log(e);
  }
})();