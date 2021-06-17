const RPS = artifacts.require('./RockPaperScissor')
const NolanCoins = artifacts.require('./NolanCoins')
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const tokens = (n) => {
	return new web3.utils.BN(
	web3.utils.toWei(n.toString(), 'ether')
	)
}
const { expect } = require('chai');
require('chai')
	.use(require('chai-as-promised'))
	.should()

contract('RockPaperScissor', ([user1, user2, user3, user4]) => {
	let rps
	let token
	let amount
	let gameCounter
	const rock = 1
	const paper = 2
	const scissor = 3
	const bet = 100
	const sleep = milliseconds => new Promise(done => setTimeout(done, milliseconds));

	before(async () => {
		amount = tokens(100)
		token = await NolanCoins.new()
		rps = await RPS.new()
		

	})
	describe('deployment', async () => {
		let tokenAddress, gameAddress, gameName, tokenName, balance

		before(async () => {
			tokenAddress = token.address
			gameAddress = rps.address
			gameName = await rps.rpsName()
			tokenName = await token.name()
			balance = await token.balanceOf(tokenAddress)
		})
		it("game deploys successfully", async () => {

			assert.notEqual(gameAddress, 0x0)
      		assert.notEqual(gameAddress, '')
      		assert.notEqual(gameAddress, null)
      		assert.notEqual(gameAddress, undefined)
      		console.log("contract address:", gameAddress)
		})
		it("game has a name", async () => {
			
			assert.equal(gameName, "rock papER sCissor")
		})


		it("test token deploys successfully", async () => {

			assert.notEqual(tokenAddress, 0x0)
      		assert.notEqual(tokenAddress, '')
      		assert.notEqual(tokenAddress, null)
      		assert.notEqual(tokenAddress, undefined)

      	})
		it('token has name', async () => {

			assert.equal(tokenName, "Nolan Coins")	
			console.log(tokenAddress)
		})

		it("user 1 has balance of 1,000,000 tokens", async() => {		
			assert.equal(balance.toString(), tokens(1000000))
		})
	})

	describe("token faucet", async () => {
		let tokenAddress, drip
		before(async () => {
			tokenAddress = token.address
			drip = await token.drip(user1, {from:user1})
			await token.drip(user2, {from:user2})
			await token.drip(user3, {from:user3})
			await token.drip(user4, {from:user4})
		})
		
		it("drips 100 tokens to users", async () => {
			expect(token.balanceOf(user1)).to.eventually.be.a.bignumber.equal(tokens(100))
			expect(token.balanceOf(user2)).to.eventually.be.a.bignumber.equal(tokens(100))
			expect(token.balanceOf(user3)).to.eventually.be.a.bignumber.equal(tokens(100))
			expect(token.balanceOf(user4)).to.eventually.be.a.bignumber.equal(tokens(100))
		})


		it("emits transfer event", async () => {
			expectEvent(drip, "Transfer", {from: tokenAddress, to: user1, value:tokens(100)})
		})

		it("subtracts from total supply", async () => {
			expect(token.balanceOf(tokenAddress)).to.eventually.be.a.bignumber.equal(tokens(1000000 - 400))

		})

		it("rejects using faucet with non zero balance", async () => {
			await token.drip(user1, {from:user1}).should.be.rejected
			await token.drip(user2, {from:user2}).should.be.rejected
			await token.drip(user3, {from:user3}).should.be.rejected
			await token.drip(user4, {from:user4}).should.be.rejected

		})


	})



	describe("creating game", async () => {
		
		let game, gameId, address, symbol
		before(async () => {
			// token.transfer(user2, tokens(1000), {from: user1})
			// token.transfer(user3, tokens(1000), {from: user1})
			// token.transfer(user4, tokens(1000), {from: user1})
			token.approve(rps.address, amount, {from: user1})
			address = await token.address
			game = await rps.createGame(address, bet, { from: user1})
			gameId = await rps.gameCounter()
			
	
		})


		it("player 1 creates game", async () => {
			assert.equal(gameId, 1)
			console.log("gameId:", gameId.toNumber())
		})

		it("emits gameCreated event", async () => {
			expectEvent(game, 'GameCreated', {
				_gameId: new BN(gameId), 
				_player1: user1, 
				_tokenSymbol: await token.symbol(), 
				_betAmount: new BN(bet)
			});
		})

		it("rejects player1 from joining own game", async () => {
			await rps.joinGame(1, { from: user1 }).should.be.rejected
		})

		it("reject player1 move before player2 joins", async () => {
			await rps.makeMove(paper, 1, { from: user1 }).should.be.rejected

		})

		it("reject player2 move before joining", async () => {
			await rps.makeMove(paper, 1, { from: user2 }).should.be.rejected

		})
	})
	describe("joining game", async () => {
		let game, player2address, jackpot

		before(async () => {
			token.approve(rps.address, amount, {from: user2})

			game = await rps.joinGame(1, { from: user2 })
			player2address = game.logs[0].args._player2
			gameId = await rps.gameCounter()
			
			
		})
		it("player 2 joins game", async () => {
			assert.equal(player2address, user2)
			
			
		})

		it("emits Player2Joined event", async () => {

			expectEvent(game, 'Player2Joined', {
				_gameId: new BN(gameId), 
				_player1: user1, 
				_player2: user2,
				_tokenSymbol: await token.symbol(), 
				_jackpot:  new BN(bet * 2),
			});
		})

	})
	describe("making moves", async () => {
		let player1move, player2move, winner, gameId
		

		before(async () => {
			gameId = await rps.gameCounter()
			player1move = await rps.makeMove(rock, gameId, { from: user1 })			
			
		})

		it("player 1 makes move -- rock", async () => {

			assert.equal(player1move.logs[0].args._player1Moved, true)
		
		// })

		// it("emits MoveMade event", async () => {

			expectEvent(player1move, 'MoveMade', {
				_mover: user1,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  false,
			});
		})

		before(async () => {
			player2move = await rps.makeMove(paper, gameId, { from: user2 })


		})
		it("player 2 makes move -- paper", async () => {
	
			assert.equal(player2move.logs[0].args._player2Moved, true)
		

			expectEvent(player2move, 'MoveMade', {
				_mover: user2,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  true,
			});
		})
	})

	describe("reveal", async () => {
		let jackpot, balance, tokenAddress
		before(async () => {
			winner = await rps.reveal(1)
			jackpot = winner.logs[0].args[3]
			tokenAddress = token.address
			console.log("	jackpot is:", jackpot.toNumber())
		})

		it("player 2 is declared winner", async () => {
			assert.equal(winner.logs[0].args[0], user2)
			// console.log(winner.logs[0].args[0])
		})

		it("jackpot is added to player 2s in game balance", async () => {
			balance = await rps.winningBalances(tokenAddress, user2)
			assert.equal(balance.toNumber(), jackpot.toNumber())
			console.log("	player 2 balance is", balance.toNumber())



		})

	})

	describe("testing ALL playing combinations...", async () => {
		
		
		let game, secondPlayer, gameId, winner, tokenAddress, balance1, balance2
		

		beforeEach(async () => {
			await token.drip(user1, {from:user1})
			await token.drip(user2, {from:user2})
			address = await token.address
			token.approve(rps.address, tokens(1000), {from: user1})
			token.approve(rps.address, tokens(1000), {from: user2})
			game = await rps.createGame(address, bet, { from: user1})
			gameId = game.logs[0].args._gameId.toNumber()
			secondPlayer = await rps.joinGame(gameId, { from: user2 })

			// should be zero because it drips 100 tokens, and they bet 100 tokens
			balance1 = await token.balanceOf(user1)
			balance2 = await token.balanceOf(user2)

			console.log(balance1.toString(), balance2.toString())

			expectEvent(game, 'GameCreated', {
				_gameId: new BN(gameId), 
				_player1: user1, 
				_tokenSymbol: await token.symbol(), 
				_betAmount: new BN(bet)
			});
			expectEvent(secondPlayer, 'Player2Joined', {
				_gameId: new BN(gameId), 
				_player1: user1, 
				_player2: user2,
				_tokenSymbol: await token.symbol(), 
				_jackpot:  new BN(bet * 2),
			});
				// ROCK X SCISSOR
		})
		it("player1-rock, player2-scissor", async () => {
			player1move = await rps.makeMove(rock, gameId, { from: user1 })			
			player2move = await rps.makeMove(scissor, gameId, { from: user2 })
			console.log("gameId:", gameId)
			winner = await rps.reveal(gameId)
			assert.equal(winner.logs[0].args[0], user1)
			console.log("	player1 wins")
			expectEvent(player1move, 'MoveMade', {
				_mover: user1,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  false,
			});
			expectEvent(player2move, 'MoveMade', {
				_mover: user2,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  true,
			});
		})
		it("player1-scissor, player2-rock", async () => {
			player1move = await rps.makeMove(scissor, gameId, { from: user1 })			
			player2move = await rps.makeMove(rock, gameId, { from: user2 })
			console.log("gameId:", gameId)
			winner = await rps.reveal(gameId)
			assert.equal(winner.logs[0].args[0], user2)
			console.log("	player2 wins")
			expectEvent(player1move, 'MoveMade', {
				_mover: user1,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  false,
			});
			expectEvent(player2move, 'MoveMade', {
				_mover: user2,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  true,
			});
		})
 				// PAPER X SCISSOR
		it("player1-paper, player2-scissor", async () => {
			player1move = await rps.makeMove(paper, gameId, { from: user1 })			
			player2move = await rps.makeMove(scissor, gameId, { from: user2 })
			console.log("gameId:", gameId)
			winner = await rps.reveal(gameId)
			assert.equal(winner.logs[0].args[0], user2)
			console.log("	player2 wins")
			expectEvent(player1move, 'MoveMade', {
				_mover: user1,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  false,
			});
			expectEvent(player2move, 'MoveMade', {
				_mover: user2,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  true,
			});
		})
		it("player1-scissor, player2-paper", async () => {
			player1move = await rps.makeMove(scissor, gameId, { from: user1 })			
			player2move = await rps.makeMove(paper, gameId, { from: user2 })
			console.log("gameId:", gameId)
			winner = await rps.reveal(gameId)
			assert.equal(winner.logs[0].args[0], user1)
			console.log("	player1 wins")
			expectEvent(player1move, 'MoveMade', {
				_mover: user1,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  false,
			});
			expectEvent(player2move, 'MoveMade', {
				_mover: user2,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  true,
			});
		})

		it("player1-paper, player2-rock", async () => {
			player1move = await rps.makeMove(paper, gameId, { from: user1 })			
			player2move = await rps.makeMove(rock, gameId, { from: user2 })
			console.log("gameId:", gameId)
			winner = await rps.reveal(gameId)
			assert.equal(winner.logs[0].args[0], user1)
			console.log("	player1 wins")
			expectEvent(player1move, 'MoveMade', {
				_mover: user1,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  false,
			});
			expectEvent(player2move, 'MoveMade', {
				_mover: user2,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  true,
			});
		})
		it("player1-rock, player2-paper", async () => {
			player1move = await rps.makeMove(rock, gameId, { from: user1 })			
			player2move = await rps.makeMove(paper, gameId, { from: user2 })
			console.log("gameId:", gameId)
			winner = await rps.reveal(gameId)
			assert.equal(winner.logs[0].args[0], user2)
			console.log("	player2 wins")
			expectEvent(player1move, 'MoveMade', {
				_mover: user1,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  false,
			});
			expectEvent(player2move, 'MoveMade', {
				_mover: user2,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  true,
			});
		})



				// TIES
		it("player1-scissor, player2-scissor", async () => {
			player1move = await rps.makeMove(scissor, gameId, { from: user1 })			
			player2move = await rps.makeMove(scissor, gameId, { from: user2 })
			console.log("gameId:", gameId)
			await rps.reveal(gameId).should.be.rejected
			console.log("	tie")
			expectEvent(player1move, 'MoveMade', {
				_mover: user1,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  false,
			});
			expectEvent(player2move, 'MoveMade', {
				_mover: user2,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  true,
			});
			

		})
		it("player1-paper, player2-paper", async () => {
			player1move = await rps.makeMove(paper, gameId, { from: user1 })			
			player2move = await rps.makeMove(paper, gameId, { from: user2 })
			console.log("gameId:", gameId)
			await rps.reveal(gameId).should.be.rejected
			console.log("	tie")
			expectEvent(player1move, 'MoveMade', {
				_mover: user1,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  false,
			});
			expectEvent(player2move, 'MoveMade', {
				_mover: user2,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  true,
			});
			

		})
		it("player1-rock, player2-rock", async () => {
			player1move = await rps.makeMove(rock, gameId, { from: user1 })			
			player2move = await rps.makeMove(rock, gameId, { from: user2 })
			console.log("gameId:", gameId)
			await rps.reveal(gameId).should.be.rejected
			console.log("	tie")
			expectEvent(player1move, 'MoveMade', {
				_mover: user1,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  false,
			});
			expectEvent(player2move, 'MoveMade', {
				_mover: user2,
				_gameId: new BN(gameId), 
				_player1Moved: true, 
				_player2Moved:  true,
			});
		})

	})

		

	describe("double or nothing--player1 bets all her previous winnings", async () => {
		let tokenAddress, rpsAddress, game, gameId, balance1, balance2, player2, result, tokenBalBefore, tokenBalAfter

		before(async () => {
			// await token.drip(user1, {from:user1})
			// await token.drip(user2, {from:user2})
			
			tokenAddress = token.address
			balance1 = await rps.winningBalances(address, user1)
			balance2 = await rps.winningBalances(address, user2)
			console.log("player1 in-contract balance:", balance1.toNumber())
			console.log("player2 in-contract balance:", balance2.toNumber())
		})


		it("P1 creates via double or nothing, P2 joins via all in, completes game", async () => {
			
			game = await rps.doubleOrNothing(address, { from: user1})
			gameId = game.logs[0].args._gameId.toNumber()
			player2 = await rps.allIn(gameId, { from: user2 })
			console.log("gameId:", gameId)
			await rps.makeMove(paper, gameId, { from: user1 })			
			await rps.makeMove(rock, gameId, { from: user2 })
			result = await rps.reveal(gameId)
			assert.equal(result.logs[0].args[0], user1)
			console.log("player1 wins")
			balance1 = await rps.winningBalances(address, user1)
			balance2 = await rps.winningBalances(address, user2)
			console.log("player1 in-contract balance:", balance1.toNumber())
			console.log("player2 in-contract balance:", balance2.toNumber())
			tokenBalBefore = await token.balanceOf(address)
			// console.log(tokenBalBefore.toString())
			// console.log(tokenBalBefore.toString())
			



		})

		it("player 1 mints nft prize for 1000 tokens from winnings", async () => {
			rpsAddress = rps.address
			_nft = await rps.mintAndredeem(tokenAddress, {from: user1})
			tokenBalAfter = await token.balanceOf(address)


			
			




			await expectEvent.inTransaction(_nft.tx, token, 'Transfer', {
				from: rpsAddress,
				to: tokenAddress, 
				value: tokens(1000), 
			});
			console.log("emits NFT 'Transfer' event")

			expectEvent(_nft, 'Transfer', {
				from: "0x0000000000000000000000000000000000000000",
				to: user1, 
				tokenId: "1", 
			});
			console.log("emits erc20 'Transfer' event")


			assert.equal(await rps.ownerOf(1), user1)

			// assert.equal(tokenBalAfter.toString(), )





			



		})
		

	
		it("transfer in-contract balance to players' addresses", async () => {
			
			balance1 = await rps.winningBalances(address, user1)
			balance2 = await rps.winningBalances(address, user2)
			console.log("player1 in-contract balance:", balance1.toNumber())
			console.log("player2 in-contract balance:", balance2.toNumber())
			await rps.TransferOut(address, { from: user1 })
			await rps.TransferOut(address, { from: user2 })
			balance1 = await rps.winningBalances(address, user1)
			balance2 = await rps.winningBalances(address, user2)
			console.log("player1 in-contract balance after:", balance1.toNumber())
			console.log("player2 in-contract balance after:", balance2.toNumber())

		})
	})

			
		

	describe("cancelling a game with uncooperative opponent", async () => {
		
		let game, secondPlayer, gameId, winner, balance1, balance2

		before(async () => {
			await token.drip(user2, {from:user2})
			
			game = await rps.createGame(address, bet, { from: user1})
			gameId = game.logs[0].args._gameId.toNumber()
			secondPlayer = await rps.joinGame(gameId, { from: user2 })
			console.log("gameId:", gameId)
			// balance1 = await token.balanceOf(user1)
			// balance2 = await token.balanceOf(user2)

			// console.log(balance1.toString(), balance2.toString())

		})

		it("tries to cancel before time limit, gets reverted", async () => {
			await rps.cancelGame(gameId, { from: user1}).should.be.rejected

		})
		it("player2 tries to cancel game they did not create, gets reverted", async () => {
			await rps.cancelGame(gameId, { from: user2}).should.be.rejected
			
		})
		it("waits 1 minute...", async () => {
			console.log("waiting 1 minute...")
			await sleep(60000)
			await rps.cancelGame(gameId, { from: user1})
			console.log("allows cancellation after 1 minute")	
			balance1 = await token.balanceOf(user1)
			balance2 = await token.balanceOf(user2)

			console.log("players' final address balances after transferring out of contract")
			console.log(balance1.toString(), balance2.toString())

		}).timeout(65000)
	})

})