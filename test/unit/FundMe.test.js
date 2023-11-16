const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          //const sendValue = "1000000000000000000" // 1 ETH
          // laksi za citanje nacin
          const sendValue = ethers.parseEther("1");
          beforeEach(async function () {
              // deploy our fundMe contract
              // using hardhat deploy
              /*Jos jedan nacin da uzmemo accounte
        const account = await ethers.getSigners()
        const accountZero = accounts[0]*/
              //const { deployer } = await getNamedAccounts() // izvlacimo samo deployer is getnamedaccounts
              deployer = (await getNamedAccounts()).deployer; // wrapujemo ga da bi mogli da koristimo samo deployer u funkcijama ispod
              await deployments.fixture(["all"]); // omogucava da deploy skripte s svi tagovi
              fundMe = await ethers.getContract("FundMe", deployer); // daje nam najskorasnjiji deployed fundMe contract
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });
          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.target);
              });
          });
          // testiramo fund funkciju iz fund me
          describe("fund", async function () {
              /* ona ocekuje pomocu expect da ima odredjen min koji smo zadali u fundme
        ako ne revertuje tj vrava teks you need to spend more ETH */
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  );
              });
              it("Updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  // response ceka da se pojave addrese i uzima jednu po jednu adresu
                  // i proverava da li je jednaka sendValue
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(response.toString(), sendValue.toString());
              });
              // testiramo ce doda li funderi u array of getFunder
              it("Adds funder to array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });
          describe("withdraw", async function () {
              // pre nego da krenemo da testiramo proveravamo i saljemo
              // zapravo neke fundove
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });
              it("Withdraw ETH form a single founder", async function () {
                  // Sastoji se od 3 dela
                  // Arrange - pocetni balans onog sto placa i onog kome je uplaceno
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress());
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt; //  izvlacimo te 2 stave iz receipt
                  const gasCost = gasUsed * gasPrice;
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // naknadno smo dodali i gasCost
                  // Assert
                  assert.equal(endingFundMeBalance, 0); // posto izvlacimo sve fundove
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  ); // proveravamo zbir pocetnog fundme i deployer balanca dali je jednak s krajnjim deployer balansom jer je primio sve fundove i uracunamo i gas kolko je potrosen
                  /* Sta smo sve uradeli u withdraw -  koristimo ethers.provider.getBalance da nam da balance
            bilo kod contracta isto radimo i s startingDeployerBalance i oni nam trebaju da bi uporedili sa
            krajnjim (ending) balansima. Zatim pozivamo withdraw funkciju u transactionResponse
            i dodajemo transactionReceipt koja sadrzi await i ceka jedan blok od kad se pozove transactionResponse (sto je odgovor na funkciju iz assert)
            zatim dodajemo crvenu tacku u koristimo debugger da vidimo kvo sve ima u receipt i onda izdvajamo gas used i gas price i mnozimo ih da dobijemo gasCost
            zatim dodajemo edningfundmebalance i endingDeployerBalance i stavljamo
            da je endingFundMeBallance equal s 0 i da je zbir pocetnog fund me i deloyer balansa
            jednak spiru krajnjeg deployer balansa i gasCost */
              });

              it("Withdraw ETH form a single founder", async function () {
                  // Sastoji se od 3 dela
                  // Arrange - pocetni balans onog sto placa i onog kome je uplaceno
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress());
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt; //  izvlacimo te 2 stave iz receipt
                  const gasCost = gasUsed * gasPrice;
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // naknadno smo dodali i gasCost
                  // Assert
                  assert.equal(endingFundMeBalance, 0); // posto izvlacimo sve fundove
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  );
              });
              // proveravamo da li dozvoljava withdraw od vise akaunta
              it("Allow us to withdraw with multiple getFunder", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners(); // u accounts ubacujemo tija akaunti
                  // pravimo for loop koja ce prolazi kroz akauntiti i pocinjemo od i=1 zato sto 0 je deployer
                  for (let i = 1; i < 6; i++) {
                      // pozivamo funkciju connect na fundMe yato sto kad pogledas gore fundMe je povezan s deployer
                      // kad god pozivamo transakciju s fundMe deployer je taj koji zove tu transakciju
                      // zato kreiramo nov objekat fundMeConnectedContract koji ce poveze sve te posebne akaunte
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      // fundMeConnectedContract je povezan s akaunti preko accounts[i]
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress());
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  );

                  // Provera da getFunderi budu resetovani kako treba
                  await expect(fundMe.getFunder(0)).to.be.reverted;
                  // loopoujemo kroz maps u fund me i proveravamo dal su svi akaunti resetovano tj jednaki
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].getAddress()
                          ),
                          0
                      );
                  }
              });
              // provera dal samo owner moze da podigne fundove
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  );
                  await expect(
                      fundMeConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
              });
              it("cheaperWithdraw testing...", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners(); // u accounts ubacujemo tija akaunti
                  // pravimo for loop koja ce prolazi kroz akauntiti i pocinjemo od i=1 zato sto 0 je deployer
                  for (let i = 1; i < 6; i++) {
                      // pozivamo funkciju connect na fundMe yato sto kad pogledas gore fundMe je povezan s deployer
                      // kad god pozivamo transakciju s fundMe deployer je taj koji zove tu transakciju
                      // zato kreiramo nov objekat fundMeConnectedContract koji ce poveze sve te posebne akaunte
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      // fundMeConnectedContract je povezan s akaunti preko accounts[i]
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress());
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  );

                  // Provera da getFunderi budu resetovani kako treba
                  await expect(fundMe.getFunder(0)).to.be.reverted;
                  // loopoujemo kroz maps u fund me i proveravamo dal su svi akaunti resetovano tj jednaki
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].getAddress()
                          ),
                          0
                      );
                  }
              });
          });
      });
