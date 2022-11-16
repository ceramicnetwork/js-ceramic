class StoreMap<TStore> {
  #map: Map<string, TStore>
  #baseLocation: string
  constructor(baseLocation: string) {
    this.#baseLocation = baseLocation
  }

  set(store: TStore, subChannel?: string): void {

  }

  get(subChannel?: string): TStore {
    // For illustrative purposes, initialisation of a newly seen subchannel/sublevel is omitted.
    return this.#map.get(this.fullLocation(subChannel))
  }

  private fullLocation(sublevelName?: string): string {
    if (sublevelName) {
      return `${this.#baseLocation}/${sublevelName}`
    } else {
      return this.#baseLocation
    }
  }
}
