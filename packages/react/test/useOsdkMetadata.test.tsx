import type { Client } from "@osdk/client";
import { renderHook, waitFor } from "@testing-library/react";
import pDefer from "p-defer";
import * as React from "react";
import { describe, expect, it, vitest } from "vitest";
import { OsdkContext } from "../src/OsdkContext.js";
import { useOsdkMetadata } from "../src/useOsdkMetadata.js";

describe(useOsdkMetadata, () => {
  it("works", async () => {
    const deferred = pDefer();
    const fakeClient = {
      fetchMetadata: vitest.fn(async (o) => {
        return deferred.promise;
      }),
    } as any as Client;

    const wrapper = ({ children }: React.PropsWithChildren) => {
      return (
        <OsdkContext.Provider
          value={{
            client: fakeClient,
          }}
        >
          {children}
        </OsdkContext.Provider>
      );
    };

    const FooObjectDef = { type: "object", apiName: "foo" } as const;

    const { result, rerender } = renderHook(
      () => useOsdkMetadata(FooObjectDef),
      { wrapper },
    );

    expect(result.current).toEqual({ loading: true });

    deferred.resolve({ passedIn: FooObjectDef });

    await waitFor(() =>
      expect(result.current).toEqual({
        loading: false,
        metadata: { passedIn: FooObjectDef },
      })
    );
  });
});
