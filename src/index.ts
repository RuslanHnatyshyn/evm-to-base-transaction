import { ethers, formatUnits, parseUnits } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const ethereumProvider = new ethers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
);
const baseProvider = new ethers.JsonRpcProvider(
  `https://base-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
);

const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error("Private key is not defined in the environment variables.");
}

const ethereumWallet = new ethers.Wallet(privateKey, ethereumProvider);
const baseWallet = new ethers.Wallet(privateKey, baseProvider);

const pdtEthereumAbi = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "success", type: "bool" }],
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
];
const pdtEthereumContract = new ethers.Contract(
  "0x375abb85c329753b1ba849a601438ae77eec9893",
  pdtEthereumAbi,
  ethereumWallet
);

const pdtBaseAbi = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "success", type: "bool" }],
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
];
const pdtBaseContract = new ethers.Contract(
  "0xeff2a458e464b07088bdb441c21a42ab4b61e07e",
  pdtBaseAbi,
  baseWallet
);

async function sendTransaction() {
  try {
    const ethereumBalanceBefore = await pdtEthereumContract.balanceOf(
      ethereumWallet.address
    );
    console.log(
      "Ethereum balance before TX:",
      formatUnits(ethereumBalanceBefore, 18)
    );

    const baseBalanceBefore = await pdtBaseContract.balanceOf(
      baseWallet.address
    );
    console.log("Base balance before TX:", formatUnits(baseBalanceBefore, 18));

    const amountToSend = parseUnits("1.0", 18);

    if (ethereumBalanceBefore.lt(amountToSend)) {
      throw new Error("Insufficient Ethereum balance for transaction.");
    }
    if (baseBalanceBefore.lt(amountToSend)) {
      throw new Error("Insufficient Base balance for transaction.");
    }

    const feeData = await ethereumProvider.getFeeData();
    const gasPrice = feeData.gasPrice;
    const gasLimit = 21000;

    const [transEthereum, transBase] = await Promise.all([
      pdtEthereumContract.transfer(
        "recipient's address",
        parseUnits("1.0", 18),
        { gasPrice, gasLimit }
      ),
      pdtBaseContract.transfer(
        "recipient's address",
        parseUnits("1.0", 18),
        { gasPrice, gasLimit },
      ),
    ]);

    console.log("Ethereum TX hash:", transEthereum.hash);
    console.log("Base TX hash:", transBase.hash);

    await Promise.all([transEthereum.wait(), transBase.wait()]);
    console.log("Both transaction confirmed.");

    const ethereumBalanceAfter = await pdtEthereumContract.balanceOf(
      ethereumWallet.address
    );
    console.log(
      "Ethereum balance after TX:",
      formatUnits(ethereumBalanceAfter, 18)
    );

    const baseBalanceAfter = await pdtBaseContract.balanceOf(
      baseWallet.address
    );
    console.log("Base balance after TX:", formatUnits(baseBalanceAfter, 18));
  } catch (error) {
    console.log("Error sending transaction:", error);
  }
}

sendTransaction();

