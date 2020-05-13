function buildMockCeramicDoc() {
  return {
    state: {
      log: []
    },
    content: {},
    change: jest.fn(),
    on: jest.fn(),
  }
}

function buildMockCeramic(mockDocuments) {
  const mockCeramic = {
    createDocument: jest.fn().mockResolvedValue(buildMockCeramicDoc()),
    loadDocument: jest.fn().mockResolvedValue(buildMockCeramicDoc()),
  }
  if (mockDocuments) {
    mockCeramic.loadDocument.mockImplementation(async (docId) => {
      const doc = mockDocuments.find(doc => doc.id === docId)
      return doc || buildMockCeramicDoc()
    })
  }
  return mockCeramic
}

export { buildMockCeramicDoc, buildMockCeramic }
