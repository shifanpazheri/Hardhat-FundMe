const { assert } = require("chai")
const { network, getNamedAccounts, ethers } = require("hardhat")
const chainId = network.config.chainId

chainId == 31337
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let sendValue = ethers.utils.parseEther("0.1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })
          it("allows people to send and withdraw the fund", async function () {
              const response1 = await fundMe.fund({ value: sendValue })
              await response1.wait(3)
              const startingFundMeBalance = await ethers.provider.getBalance(
                  fundMe.address
              )
              const startingDeployerBalance = await ethers.provider.getBalance(
                  deployer
              )

              console.log("contract address = " + fundMe.address)
              console.log(
                  "startingFundMeBalance = " + startingFundMeBalance.toString()
              )
              console.log(
                  "startingDeployerBalance = " +
                      startingDeployerBalance.toString()
              )
              const response2 = await fundMe.withdraw()
              await response2.wait(3) //wait then only we will get expected result
              const endingFundMeBalance = await ethers.provider.getBalance(
                  fundMe.address
              )
              const endingDeployerBalance = await ethers.provider.getBalance(
                  deployer
              )
              console.log(
                  "endingFundMeBalance = " + endingFundMeBalance.toString()
              )
              console.log(
                  "endingDeployerBalance = " + endingDeployerBalance.toString()
              )
              assert.equal(
                  startingFundMeBalance.toString(),
                  ethers.utils.parseEther("0.1")
              )
              assert.equal(endingFundMeBalance.toString(), "0")
          })
      })
