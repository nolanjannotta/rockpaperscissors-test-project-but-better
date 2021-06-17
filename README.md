This is my RPS dapp.
inspired by this tweet: https://twitter.com/0xzak/status/1394721614089134083

this dapp allows anyone start a rock paper scissors game using any ERC20 token as bets. Allows anyone to join by betting the same token and same amount. Once a player has accumulated 1000 tokens, they can redeem for an NFT "prize." For convenience, there is also a test token faucet to allow players to play without wasting actual tokens. 

TO DO:
-create UI
  -shows public games
  -indicates whether player 2 has joined yet
  -keep tract of gamesWon
-review code
-add flexibility with betting -- wallet balances vs. in-contract balance
-currently tokens that are redeemed for the NFT get sent back into the test faucet, change this for actual tokens
-review test script
-double check security
-add ability to create unique game IDs, allowing friends to play each other by entering unique IDs. Currently ID's are only incremented. try using indices and unique ID's
- create mapping for gamesWon => address

