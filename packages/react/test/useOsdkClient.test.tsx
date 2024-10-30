import type { Client } from "@osdk/client";
import { act, renderHook } from "@testing-library/react";
import pDefer from "p-defer";
import * as React from "react";
import { describe, expect, it, vitest } from "vitest";
import { OsdkContext } from "../src/OsdkContext.js";
import { useOsdkClient } from "../src/useOsdkClient.js";
import { useOsdkMetadata } from "../src/useOsdkMetadata.js";

describe(useOsdkMetadata, () => {
  it("works with just client", () => {
    const fakeClient = {
      fetchMetadata: vitest.fn((o) => {
        return Promise.resolve({ passedIn: o }) as any;
      }),
    } as any as Client;

    const wrapper = ({ children }: React.PropsWithChildren) => {
      return (
        <OsdkContext.Provider
          value={{ client: fakeClient }}
        >
          {children}
        </OsdkContext.Provider>
      );
    };

    const { result, rerender } = renderHook(
      () => useOsdkClient(),
      { wrapper },
    );

    expect(result.current).toBe(fakeClient);
  });
});
