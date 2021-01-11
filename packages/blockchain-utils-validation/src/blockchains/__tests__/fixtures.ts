export const proofs = {
  v0: {
    valid: {
      type: "ethereum-eoa",
      message:
        "Create a new 3Box profile\n\n- \nYour unique profile ID is did:3:bafysdfwefwe",
      signature:
        "0xfa69ccf4a94db61325429d37c58c6de534b73f439700fbb748209890a5780f3365a5335f82d424d7f9a63ee41b637c116e64ef2f32c761bb065e4409f978c4bb1c",
    },
    invalid: {
      type: "ethereum-eoa",
      message:
        "Create a new 3Box profile\n\n- \nYour unique profile ID is did:3:bafysdfwefwe",
      signature:
        "0xfa69ccf4a94db6139837459873459873498759834500fbb748209890a5780f3365a5335f82d424d7f9a63ee41b637c116e64ef2f32c761bb065e4409f978c4bb1c",
    },
  },
  v1: {
    valid: {
      version: 1,
      type: "ethereum-eoa",
      message:
        "Create a new 3Box profile\n\n- \nYour unique profile ID is did:3:bafysdfwefwe",
      signature:
        "0xfa69ccf4a94db61325429d37c58c6de534b73f439700fbb748209890a5780f3365a5335f82d424d7f9a63ee41b637c116e64ef2f32c761bb065e4409f978c4bb1c",
      address: "0x8fe2c4516e920425e177658aaac451ca0463ed69",
    },
    invalid: {
      version: 1,
      type: "ethereum-eoa",
      message:
        "Create a new 3Box profile\n\n- \nYour unique profile ID is did:3:bafysdfwefwe",
      signature:
        "0xfa69ccf4a94db61325429d37c58c6de534b73f439700fbb748209890a5780f3365a5335f82d424d7f9a63ee41b637c116e64ef2f32c761bb065e4409f978c4bb1c",
      address: "0x8fe2c4516e920425e177658aaac451ca0463ed87",
    },
  },
};
