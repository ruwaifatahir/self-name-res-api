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

export async function GET(req: Request): Promise<Response> {
  const apiKey = req.headers.get("authorization");

  if (!isAuthorized(apiKey)) {
    return createResponse({ error: "Unauthorized" }, 401);
  }

  const { name } = extractParams(new URL(req.url), ["name"]);

  if (!name) {
    return createResponse({ error: "Name required" }, 400);
  }

  try {
    const client = createPublicClient({
      chain: bsc,
      transport: http(BSC_RPC_URL),
    });

    const tokenUri = await client.readContract({
      address: SELF_NFT_ADDRESS,
      abi: selfNftAbi,
      functionName: "tokenURI",
      args: [hashString(name)],
    });

    const metadata = await fetchMetadata(tokenUri);
    console.log(metadata);

    if (!metadata) return createResponse({ error: "No metadata found" }, 404);

    return createResponse({ metadata }, 200);
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return createResponse({ error: "Internal Server Error" }, 500);
  }
}
