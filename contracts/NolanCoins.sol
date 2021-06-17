pragma solidity 0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract NolanCoins is ERC20 {
	constructor () ERC20 ("Nolan Coins", "NOL") {
		_mint(address(this), 1000000 * 1 ether );
	}

	function drip(address _recipient) public {
		require(balanceOf(_recipient) == 0, "already have it");
		require(_recipient != address(0));
		_transfer(address(this), _recipient, (100 * 1 ether));
		
	}


}