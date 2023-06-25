const { getNamedAccounts, ethers } = require("hardhat")

let sendValue = ethers.utils.parseEther("1")
let response
async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    response = await fundMe.withdraw()
    await response.wait(1)
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
