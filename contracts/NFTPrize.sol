// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTPrize is ERC721, ERC721Enumerable {
	using Counters for Counters.Counter;
	Counters.Counter private _tokenIds;

	constructor() ERC721("NFTPrize", "PRIZE")  {
	}

	function mintNFT() public {
		_tokenIds.increment();
        uint256 id = _tokenIds.current();
		_mint(msg.sender, id);
	}
	function _beforeTokenTransfer(address from, address to, uint tokenId) 
	internal 
	override(ERC721, ERC721Enumerable) {
		super._beforeTokenTransfer(from, to, tokenId);
	}
	function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory _tokenURI = _baseURI();
        return _tokenURI;
    }


	function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
		return super.supportsInterface(interfaceId);
	}
	function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.infura.io/ipfs/QmdXcSAVTDvx367FRiYTSW8toC17W8fFb2eWzaF9LooPc3";
    }
    
}
