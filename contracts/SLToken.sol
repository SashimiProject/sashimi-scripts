pragma solidity ^0.6.10;

interface SLErc20 {
    function liquidateBorrow(address borrower, uint repayAmount, address slTokenCollateral) external returns (uint);
}

interface SLEther {
    function liquidateBorrow(address borrower, address slTokenCollateral) external payable;
}