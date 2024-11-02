import { createPublicClient, http } from "viem";
import { bsc } from "viem/chains";
import { BSC_RPC_URL, SELF_NFT_ADDRESS } from "@/lib/constants";
import { selfNftAbi } from "@/lib/abi/self-nft-abi";
import { hashString } from "@/lib/helpers";
import {
  createResponse,
  extractParams,
  fetchMetadata,
  isAuthorized,
} from "../lib/utils";

const chains = {
  1: "eth",
  56: "bsc",
  137: "polygon",
  43114: "avax",
  42161: "arb",
};

export async function GET(req: Request): Promise<Response> {
  const apiKey = req.headers.get("x-api-key");
  // if (!isAuthorized(apiKey)) {
  //   return createResponse({ error: "Unauthorized" }, 401);
  // }

  const { name, chainId } = extractParams(new URL(req.url), [
    "name",
    "chainId",
  ]);
  const parsedChainId = parseInt(chainId || "") as keyof typeof chains;

  if (!name || isNaN(parsedChainId)) {
    return createResponse({ error: "Name and valid chainId required" }, 400);
  }

  try {
    const client = createPublicClient({
      chain: bsc,
      transport: http(BSC_RPC_URL),
    });

    const resolvedAddress = await client.readContract({
      address: SELF_NFT_ADDRESS,
      abi: selfNftAbi,
      functionName: "ownerOf",
      args: [hashString(name)],
    });

    const tokenUri = await client.readContract({
      address: SELF_NFT_ADDRESS,
      abi: selfNftAbi,
      functionName: "tokenURI",
      args: [hashString(name)],
    });

    const metadata = await fetchMetadata(tokenUri);
    console.log(metadata);

    try {
      const metadataAddress =
        metadata.foreignAddresses[chains[parsedChainId]].address;
      return createResponse({ address: metadataAddress }, 200);
    } catch (error) {
      return createResponse({ address: resolvedAddress }, 200);
    }
  } catch (error) {
    console.error("Error resolving name:", error);
    return createResponse({ error: "Internal Server Error" }, 500);
  }
}
