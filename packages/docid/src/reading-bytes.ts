import CID from 'cids';
import varint from 'varint';

export function readVarint(bytes: Uint8Array): [number, Uint8Array, number] {
  const value = varint.decode(bytes);
  const readLength = varint.decode.bytes;
  const remainder = bytes.slice(readLength);
  return [value, remainder, readLength];
}

function isCidVersion(input: number): input is 0 | 1 {
  return input === 0 || input === 1;
}

export function readCid(bytes: Uint8Array): [CID, Uint8Array] {
  const [cidVersion, cidVersionRemainder] = readVarint(bytes);
  if (!isCidVersion(cidVersion)) {
    throw new Error(`Unknown CID version ${cidVersion}`);
  }
  const [codec, codecRemainder] = readVarint(cidVersionRemainder);
  const [, mhCodecRemainder, mhCodecLength] = readVarint(codecRemainder);
  const [mhLength, , mhLengthLength] = readVarint(mhCodecRemainder);
  const multihashBytes = codecRemainder.slice(0, mhCodecLength + mhLengthLength + mhLength);
  const multihashBytesRemainder = codecRemainder.slice(mhCodecLength + mhLengthLength + mhLength);
  return [new CID(cidVersion, codec, multihashBytes), multihashBytesRemainder];
}
