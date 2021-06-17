// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const RockPaperScissor = await hre.ethers.getContractFactory("RockPaperScissor");
  const rockpaperscissor = await RockPaperScissor.deploy();

  const NFTPrize = await hre.ethers.getContractFactory("NFTPrize")
  const nft = await NFTPrize.deploy()

  const NolanCoins = await hre.ethers.getContractFactory("NolanCoins");
  const nolancoins = await NolanCoins.deploy();
  // let tokenAddress = await nolancoins.address;


  // const Faucet = await hre.ethers.getContractFactory("Faucet");
  // const faucet = await Faucet.deploy(tokenAddress);

  await nft.deployed()
  await rockpaperscissor.deployed();
  await nolancoins.deployed();
  // await faucet.deployed();


  // console.log("Greeter deployed to:", greeter.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
