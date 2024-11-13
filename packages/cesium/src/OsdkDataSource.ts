import type {
  InterfaceDefinition,
  ObjectSet,
  ObjectTypeDefinition,
  Osdk,
  PageResult,
  PropertyKeys,
} from "@osdk/api";
import * as Cesium from "cesium";
import { differenceInSeconds } from "date-fns";
import deepEqual from "deep-equal";

export type PropertyKeyMap<
  T extends ObjectTypeDefinition | InterfaceDefinition,
> = {
  location: PropertyKeys<T>;
  lastUpdated: PropertyKeys<T>;
  elevation?: PropertyKeys<T>;
  heading?: PropertyKeys<T>;
  velocity?: PropertyKeys<T>;
  verticalVelocity?: PropertyKeys<T>;
};

export class OsdkDataSource<
  T extends ObjectTypeDefinition | InterfaceDefinition,
> extends Cesium.CustomDataSource {
  #objectSet: ObjectSet<T>;

  #unsubscribe: undefined | (() => unknown);
  #options: { $pageSize?: number } | undefined;
  #properties: PropertyKeyMap<T>;

  constructor(
    objectSet: ObjectSet<T>,
    properties: PropertyKeyMap<T>,
    opts?: {
      $pageSize?: number;
    },
  ) {
    super();
    this.#objectSet = objectSet;

    this.#properties = properties;
    this.#options = opts;
  }

  async fullRefresh(): Promise<void> {
    let $nextPageToken = undefined;
    do {
      const result: PageResult<Osdk.Instance<T>> = await this.#objectSet
        .fetchPage({
          $pageSize: this.#options?.$pageSize ?? 1000,
          $nextPageToken,
        });
      $nextPageToken = result.nextPageToken;

      this.entities.suspendEvents();

      for (const osdkInstance of result.data) {
        this.addOrUpdateEntity(osdkInstance);
      }
      this.entities.resumeEvents();
    } while ($nextPageToken);
  }

  async subscribe(): Promise<void> {
    this.#objectSet.subscribe<any>([], {
      onChange: ({ object, state }) => {
        if (state === "ADDED_OR_UPDATED") {
          this.addOrUpdateEntity(object);
        }
      },
    });
  }

  addOrUpdateEntity(osdkInstance: Osdk.Instance<T>): void {
    const now = new Date();
    if (!this.entities.getById(osdkInstance.$primaryKey.toString())) {
      this.entities.add(
        new OsdkEntity(osdkInstance, this.#properties),
      );
    }
    const entity = this.entities.getOrCreateEntity(
      osdkInstance.$primaryKey.toString(),
    );

    const oldOsdkInstance = this.getOsdkInstance(entity);
    const changed = !deepEqual({ ...oldOsdkInstance }, { ...osdkInstance });
    if (changed || oldOsdkInstance === osdkInstance) {
      if (!osdkInstance[this.#properties.location]) {
        return;
      }
      const [lon, lat] = osdkInstance[this.#properties.location].coordinates;
      const height = this.#properties.elevation
        ? osdkInstance[this.#properties.elevation]
        : 0;
      const heading = this.#properties.heading
        ? osdkInstance[this.#properties.heading]
        : undefined;
      const velocity = this.#properties.velocity
        ? osdkInstance[this.#properties.velocity]
        : undefined;
      const verticalVelocity = this.#properties.verticalVelocity
        ? osdkInstance[this.#properties.verticalVelocity]
        : undefined;
      const lastUpdated = osdkInstance[this.#properties.lastUpdated];

      const startPosition = Cesium.Cartesian3.fromDegrees(lon, lat, height);

      if (velocity != null && verticalVelocity != null && heading != null) {
        const eastNorthUpFixedFrame = Cesium.Transforms.eastNorthUpToFixedFrame(
          startPosition,
        );

        entity.position = new Cesium.CallbackPositionProperty((_, result) => {
          result ??= startPosition;
          const secondsDiff = differenceInSeconds(
            new Date(),
            new Date(lastUpdated),
          );
          if (secondsDiff > 60 * 20) {
            return startPosition;
          }
          const distance = secondsDiff * velocity;
          const verticalDistance = secondsDiff * verticalVelocity;

          const x = distance * Math.sin(Cesium.Math.toRadians(heading));
          const y = distance * Math.cos(Cesium.Math.toRadians(heading));

          const offset = new Cesium.Cartesian3(x, y, verticalDistance);
          const finalPosition = Cesium.Matrix4.multiplyByPoint(
            eastNorthUpFixedFrame,
            offset,
            new Cesium.Cartesian3(),
          );

          return finalPosition;
        }, false);
      } else {
        entity.position = new Cesium.ConstantPositionProperty(startPosition);
      }

      entity.properties!["lastUpdatedInternal"] = now;
      entity.properties!["osdkInstance"] = osdkInstance;
      entity.properties!["lastUpdated"] = lastUpdated;
    }
  }

  destroy: () => void = () => {
    if (this.#unsubscribe) {
      this.#unsubscribe();
      this.#unsubscribe = undefined;
    }
  };

  getOsdkInstance(e: Cesium.Entity): Osdk.Instance<T> {
    const maybe: undefined | Osdk.Instance<T> = e.properties?.["osdkInstance"]
      .getValue();
    if (!maybe) {
      throw new Error(
        "Unable to find Osdk.Instance on the entity. Are you sure its from the OsdkDataSource?",
      );
    }
    return maybe;
  }

  getLastUpdated(e: Cesium.Entity): Date {
    const maybe: Date | undefined = e.properties?.["lastUpdatedInternal"]
      ?.getValue();
    if (!maybe) {
      throw new Error(
        "Unable to find Osdk.Instance on the entity. Are you sure its from the OsdkDataSource?",
      );
    }
    return maybe;
  }
}

class OsdkEntity<T extends ObjectTypeDefinition | InterfaceDefinition>
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
