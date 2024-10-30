import React from "react";
import { OsdkContext } from "./OsdkContext.js";

export function useOsdkClient() {
  return React.useContext(OsdkContext).client;
}
