pragma solidity ^0.6.10;

interface Comptroller {
    function getAccountLiquidity(address account) external view returns (uint, uint, uint);
}