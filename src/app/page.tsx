"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const run = async () => {
      const response = await fetch(
        "http://localhost:3000/api/resolveName?name=ricomaverick&chainId=1",
        {
          headers: {
            accept: "application/json",
            "x-api-key": "111112",
          },
        }
      );
      const data = await response.json();

      console.log("data", data.address);
    };
    run();
  }, []);
  return <></>;
}
