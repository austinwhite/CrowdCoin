const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const compiledFactory = require("../ethereum/build/CampaignFactory.json");
const compiledCampaign = require("../ethereum/build/Campaign.json");

let accounts;
let manager;
let contributerA;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  manager = await accounts[0];
  contributerA = await accounts[1];

  factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode })
    .send({ from: manager, gas: "1000000" });

  await factory.methods.createCampaign("100").send({
    from: manager,
    gas: "1000000",
  });

  [campaignAddress] = await factory.methods.getDeployedCampaigns().call();
  campaign = await new web3.eth.Contract(
    JSON.parse(compiledCampaign.interface),
    campaignAddress
  );
});

describe("Campaigns", () => {
  it("deploys a factroy and campaign", () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });

  it("marks caller as the campaign manager", async () => {
    const contractManager = await campaign.methods.manager().call();
    assert.strictEqual(manager, contractManager);
  });

  it("allows people to contribute money and marks them as approvers", async () => {
    await campaign.methods.contribute().send({
      value: "200",
      from: contributerA,
    });
    const isContributer = await campaign.methods.approvers(contributerA).call();
    assert(isContributer);
  });

  it("requires a minimum contribution", async () => {
    try {
      await campaign.methods.contribute().send({
        value: "5",
        from: contributerA,
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("allows a manager to make a payment request", async () => {
    await campaign.methods
      .createRequest("Buy batteries", "100", contributerA)
      .send({
        from: manager,
        gas: "1000000",
      });
    const request = await campaign.methods.requests(0).call();
    assert.strictEqual("Buy batteries", request.description);
  });

  it("processes requests", async () => {
    await campaign.methods.contribute().send({
      from: manager,
      value: web3.utils.toWei("10", "ether"),
    });

    await campaign.methods
      .createRequest("A", web3.utils.toWei("5", "ether"), contributerA)
      .send({ from: manager, gas: "1000000" });

    await campaign.methods.approveRequest(0).send({
      from: manager,
      gas: "1000000",
    });

    await campaign.methods.finalizeRequest(0).send({
      from: manager,
      gas: "1000000",
    });

    let balance = await web3.eth.getBalance(contributerA);
    balance = web3.utils.fromWei(balance, "ether");
    balance = parseFloat(balance);

    assert(balance > 104);
  });
});
