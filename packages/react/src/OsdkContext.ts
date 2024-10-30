import type { Client } from "@osdk/client";
import React from "react";

function fakeClientFn(..._args: any[]) {
  throw new Error(
    "This is not a real client. Did you forget to <OsdkContext.Provider>?",
  );
}

const fakeClient = Object.assign(fakeClientFn, {
  fetchMetadata: fakeClientFn,
} as Client);

export const OsdkContext = React.createContext<{ client: Client }>({
  client: fakeClient,
});
