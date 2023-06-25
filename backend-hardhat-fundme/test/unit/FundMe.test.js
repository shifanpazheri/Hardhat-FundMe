const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { assert, expect } = require("chai")
const chainId = network.config.chainId

chainId != 31337
    ? describe.skip
    : describe("FundMe", async function () {
          beforeEach(async function () {})

          describe("Constructor", async function () {
              let fundMe
              let deployer
              let mockV3Aggregator
              const sendValue = ethers.utils.parseEther("1")
              beforeEach(async function () {
                  deployer = (await getNamedAccounts()).deployer
                  await deployments.fixture(["all"])
                  fundMe = await ethers.getContract("FundMe", deployer)
                  mockV3Aggregator = await ethers.getContract(
                      "MockV3Aggregator",
                      deployer
                  )
              })

              describe("constructor", async function () {
                  it("set aggregator response correctly", async function () {
                      const response = await fundMe.getPriceFeed()
                      assert.equal(response, mockV3Aggregator.address)
                  })
              })

              describe("fund", async function () {
                  it("Fails if you dont sent enough eth (using reverted)", async function () {
                      await expect(fundMe.fund()).to.be.reverted
                  })
                  it("Fails if you dont sent enough eth (using revertedWith)", async function () {
                      await expect(fundMe.fund()).to.be.revertedWith(
                          "You need to spend more ETH!"
                      )
                  })
                  it("updated the amount funded data structure", async function () {
                      await fundMe.fund({ value: sendValue })
                      const response = await fundMe.getAddressToAmountFunded(
                          deployer
                      )
                      assert(response, sendValue.toString())
                  })

                  it("adds funders to funders array", async function () {
                      await fundMe.fund({ value: sendValue })
                      const funder = await fundMe.getFunder(0)
                      assert.equal(funder, deployer)
                  })
              })
              describe("Withdraw", async function () {
                  beforeEach(async function () {
                      await fundMe.fund({ value: sendValue })
                  })
                  it("Withdraw ETH from single funder", async function () {
                      //It can be from ethers.provider.getBalance()
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)

                      const transactionResponse = await fundMe.withdraw()
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      )

                      const { gasUsed, effectiveGasPrice } = transactionReceipt
                      const gasCost = gasUsed.mul(effectiveGasPrice)

                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)

                      assert.equal(endingFundMeBalance, "0")
                      assert.equal(
                          startingDeployerBalance.add(startingFundMeBalance)
                              ._hex,
                          endingDeployerBalance.add(gasCost)._hex
                      )
                      assert.equal(
                          startingDeployerBalance
                              .add(startingFundMeBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      )
                  })
                  it("allows us to withdraw from multiple funders", async function () {
                      const accounts = await ethers.getSigners()
                      // accounts[i] is of type object
                      console.log(typeof accounts[0])
                      // accounts[i].address is of type address
                      console.log(accounts[0].address) //By default accounts[0] is deployer
                      for (let i = 1; i <= 10; i++) {
                          const fundMeConnectedContact = await fundMe.connect(
                              accounts[i]
                          )
                          await fundMeConnectedContact.fund({
                              value: sendValue,
                          })
                      }
                      const startingFundMeBalance =
                          await ethers.provider.getBalance(fundMe.address)
                      const startingDeployerBalance =
                          await ethers.provider.getBalance(deployer)

                      const transactionResponse = await fundMe.withdraw()
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      )

                      const { gasUsed, effectiveGasPrice } = transactionReceipt
                      const gasCost = gasUsed.mul(effectiveGasPrice)

                      const endingFundMeBalance =
                          await ethers.provider.getBalance(fundMe.address)
                      const endingDeployerBalance =
                          await ethers.provider.getBalance(deployer)
                      assert.equal(
                          startingFundMeBalance.toString(),
                          ethers.utils.parseEther("11").toString()
                      )
                      assert.equal(endingFundMeBalance, "0")
                      assert.equal(
                          startingDeployerBalance.add(startingFundMeBalance)
                              ._hex,
                          endingDeployerBalance.add(gasCost)._hex
                      )
                      assert.equal(
                          startingDeployerBalance
                              .add(startingFundMeBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      )
                      //Make sure funders reseted properly
                      await expect(fundMe.getFunder(0)).to.be.reverted

                      for (let i = 1; i <= 10; i++) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              ),
                              0
                          )
                      }
                      //deployer is an address
                      console.log("address of deployer = " + deployer)
                  })
                  it("Only owner should be allowed to withdraw", async function () {
                      const accounts = await ethers.getSigners()
                      const attacker = accounts[1].address //By default accounts[0] is deployer
                      const attackerConnectedContract = await fundMe.connect(
                          attacker
                      )
                      await expect(attackerConnectedContract.withdraw()).to.be
                          .reverted
                  })
              })
          })
      })
