import web3 from "./web3";
import CampaignFactory from "./build/CampaignFactory.json";

const instance = new web3.eth.Contract(
  JSON.parse(CampaignFactory.interface),
  "0xaEb787654fC9d11B0268b09E3b0Eabc376f09066"
);

export default instance;
