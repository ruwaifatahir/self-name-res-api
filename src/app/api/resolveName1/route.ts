// src/app/api/resolveName/route.ts

import { ethers } from "ethers";
import { selfNftAbi } from "@/lib/abi/self-nft-abi";
import { BSC_RPC_URL, SELF_NFT_ADDRESS } from "@/lib/constants";
import {
  createResponse,
  extractParams,
  isAuthorized,
} from "./utils";

const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/bsc/20e03924912d20ea97e26493ebd4b1feab707ba068c14311820bfa36661307ec"
);

export async function GET(req: Request): Promise<Response> {
  const apiKey = req.headers.get("x-api-key");
  if (!isAuthorized(apiKey)) {
    return createResponse({ error: "Unauthorized" }, 401);
  }

  const { name, chainId } = extractParams(new URL(req.url), [
    "name",
    "chainId",
  ]);
  const parsedChainId = parseInt(chainId || "", 10);

  if (!name || isNaN(parsedChainId)) {
    return createResponse({ error: "Name and valid chainId required" }, 400);
  }

  try {
    const contract = new ethers.Contract(
      SELF_NFT_ADDRESS,
      selfNftAbi,
      provider
    );
    const resolvedAddress = await resolveAddress(contract, name, parsedChainId);

    return createResponse({ resolvedAddress }, 200);
  } catch (error) {
    console.error("Error resolving name:", error);
    return createResponse({ error: "Internal Server Error" }, 500);
  }
}
