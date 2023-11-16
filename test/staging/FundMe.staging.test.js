const { ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert } = require("chai");

/* let someVar = variable ? "yes" : "no" - upitnikad je prakticno
if statement ako je istina onda je yes ako ne onda je no */
developmentChains.includes(network.name) // kazemo da pokrece samo kad je na test net
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          const sendValue = ethers.parseEther("1");
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract("FundMe", deployer);
          });
          it("Allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();
              const endingBalance = await ethers.provider.getBalance(
                  fundMe.getAddress()
              );
              assert.equal(endingBalance.toString(), "0");
          });
      });
