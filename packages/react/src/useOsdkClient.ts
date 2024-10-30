import type { Client } from "@osdk/client";
import React from "react";
import { OsdkContext } from "./OsdkContext.js";

export function useOsdkClient(): Client {
  return React.useContext(OsdkContext).client;
}
