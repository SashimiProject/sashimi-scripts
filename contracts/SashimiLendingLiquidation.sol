pragma solidity ^0.6.10;

import "./IUniswapV2Router02.sol"; 
import "./SLToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract SashimiLendingLiquidation {
    address public immutable lend;
    IUniswapV2Router02 public immutable router;
    address public immutable exchange;
    address public immutable slETH;

    constructor(address lend_,IUniswapV2Router02 router_, address exchange_, address slETH_) public{
        lend = lend_;
        router = router_;
        exchange = exchange_;
        slETH = slETH_;
    }

    function LiquidateBorrow(SLToken slTokenBorrowed, address borrower, uint repayAmount, address slTokenCollateral) public view returns (uint) {
        uint balance = msg.value;        
        if(address(slTokenBorrowed) != slETH){
            address borrowUnderlying = slTokenBorrowed.underlying;
            swapTokenBorrowed(borrowUnderlying, repayAmount); //swap ETH to borrowed token
            uint err = SLErc20(borrowUnderlying).liquidateBorrow(borrower, repayAmount, slTokenCollateral);
            require(err == 0,"liquidateBorrow failed");            
        }else{ //no need to swap, if slTokenBorrowed is slETH
            SLEther(borrowUnderlying).liquidateBorrow.value(repayAmount)(borrower, slTokenCollateral);
        }
        uint redeemTokens = SLToken(slTokenCollateral).balanceOf(address(this));
        SLToken(slTokenCollateral).redeem(redeemTokens);

        if(slTokenCollateral != slETH){ //need to swap for eth, if slTokenCollateral is not slETH
            address tokenCollateral = SLToken(slTokenCollateral).underlying;
            swapTokenForETH(tokenCollateral, IERC20(tokenCollateral).balanceOf(address(this))); //swap token to ETH
        }
        require(address(this).balance > balance, "earn failed"); //compare eth balance changed
        //TODO transfer eth to sender
    }

    function swapETHForTokenBorrowed(address tokenBorrowed,uint amountOut) internal{
        address[] memory path = new address[](2);
        path[0] = weth;
        path[1] = tokenBorrowed;
        router.swapETHForExactTokens.value(msg.value)(amountOut, path, address(this), block.timestamp + 3);
    }

    function swapTokenForETH(address token,uint amountIn) internal{
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = weth;
        router.swapExactTokensForETH(amountIn, 0, path, address(this), block.timestamp + 3);
    }
}