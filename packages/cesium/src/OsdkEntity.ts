import type {
  InterfaceDefinition,
  ObjectTypeDefinition,
  Osdk,
} from "@osdk/api";
import * as Cesium from "cesium";
import type { PropertyKeyMap } from "./OsdkDataSource.js";

export class OsdkEntity<T extends ObjectTypeDefinition | InterfaceDefinition>
  extends Cesium.Entity
{
  constructor(osdkInstance: Osdk.Instance<T>, propMap: PropertyKeyMap<T>) {
    super({
      id: osdkInstance.$primaryKey.toString(),
      properties: new Cesium.PropertyBag({
        osdkInstance: osdkInstance,
        lastUpdatedInternal: new Date(),
        ...(Object.fromEntries(
          Object.entries(propMap).map(([key, propKey]) => {
            return [
              key,
              new Cesium.CallbackProperty(() => {
                const osdkInstance: Osdk.Instance<T> = this
                  .properties!["osdkInstance"].getValue();
                return osdkInstance[propKey];
              }, false),
            ];
          }),
        )),
      }),
    });
  }
  declare properties:
    & Cesium.PropertyBag
    & Record<keyof PropertyKeyMap<any>, Cesium.Property>;
}
