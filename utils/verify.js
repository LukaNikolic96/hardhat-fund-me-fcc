const { run } = require("hardhat");

const verify = async (contractAddress, args) => {
    console.log("Verifying contract...");
    try {
        setTimeout(
            () =>
                run("verify:verify", {
                    address: contractAddress,
                    constructorArguments: arguments,
                }),
            10000
        );
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified");
        } else {
            console.log(e);
        }
    }
};

module.exports = { verify };
