import web3 from "./web3";
import CampaignFactory from "./build/CampaignFactory.json";

const instance = new web3.eth.Contract(
  JSON.parse(CampaignFactory.interface),
  "0x8F7585A65cCa25eac9C7accc6bDBB483f3E0e876"
);

export default instance;
