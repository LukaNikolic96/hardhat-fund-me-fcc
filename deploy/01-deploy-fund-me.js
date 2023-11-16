//import
//main function
//calling of main function

//const { deployments, network } = require("hardhat")

// function deployFunc(hre) {
//     console.log("Hi!")
//     hre.getNamedAccounts()
//     hre.deployments
// }
// module.exports.default = deployFunc

// ce stavimo u anonimnu funkciju (istu funkciju ima ko ova gore)
// iz hre uzimamo getNamedAccounts, deployments
// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre
//     /* Isto je kao da smo napisali
//     hre.getNamedAccounts i hre.deployments */
// }
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");
// mogli smo i ovako da ga napisemo:
/* const helperConfig = require("../helper-hardhat-config")
const networkConfig = helpefConfig.networkConfig */

//const {network} = require("hardhat") //prjavljuje mi gresku kad koristim ovo

// Umesto da pisemo vise linija ce stavimo to u jednu
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    /* od deployments izvlacimo deploy i log od getNamedAccounts 
 izvlacimo deployer */
    const chainId = network.config.chainId;

    // za address ce koristimo chainId ako je chainId x koristi addressu Y
    //(ako je taj i taj chainId koristi tu i tu adresu)

    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"] -moze to ali u klip ce probamo nesta drugo
    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        // ako nismo na devlopment chain tj nismo deploy mock ce se koristi ovo
        ethUsdPriceFeedAddress =
            networkConfig[chainId]["ethUsdPriceFeedAddress"];
    }
    log(ethUsdPriceFeedAddress);

    /* ako contract ne postoji onda deploy minimalnu za nas
    local testing  */

    /* kad ocemo localhost ili hardhat network koristimo mock */
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        //verify
        await verify(fundMe.target, args);
    }
    log("------------------------------");
};
module.exports.tags = ["all", "fundme"];
