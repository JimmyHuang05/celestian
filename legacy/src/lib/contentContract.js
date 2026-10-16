const contract = globalThis.CelestianContentContract

if (!contract) {
  throw new Error('Celestian content contract was not loaded')
}

export const {
  entryTypes,
  mapMarkerTypes,
  getEntryType,
  getSupportedBlocks,
  normalizeMapMarkerType,
  getMapMarkerType,
  parseEntryBlocks,
  validateEntryPayload,
  getMapMarkerSvg,
} = contract

export default contract
