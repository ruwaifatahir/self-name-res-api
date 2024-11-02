import { removeIpfsPrefix } from "@/lib/helpers";
import { PinataSDK } from "pinata-web3";
import { Metadata } from "./types";

export function createResponse(body: any, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type, authorization",
      "Content-Type": "application/json",
    },
  });
}

export function extractParams(
  url: URL,
  keys: string[]
): Record<string, string | null> {
  const params: Record<string, string | null> = {};
  keys.forEach((key) => {
    const value = url.searchParams.get(key);
    params[key] = value || null;
  });
  return params;
}

export function isAuthorized(apiKey: string | null): boolean {
  const authorizedApiKeys: string[] = (
    process.env.AUTHORIZED_API_KEYS || ""
  ).split(",");
  return apiKey !== null && authorizedApiKeys.includes(apiKey);
}

export async function fetchMetadata(tokenUri: string) {
  try {
    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT!,
      pinataGateway: process.env.PINATA_GATEWAY!,
      pinataGatewayKey: process.env.PINATA_GATEWAY_KEY!,
    });

    if (tokenUri) {
      const file = await pinata.gateways.get(removeIpfsPrefix(tokenUri));
      return file.data as unknown as Metadata;
    }

    throw new Error("No tokenUri provided");
  } catch (error) {
    console.error("Error fetching metadata from Pinata:", error);
    throw new Error("Metadata fetch failed");
  }
}
