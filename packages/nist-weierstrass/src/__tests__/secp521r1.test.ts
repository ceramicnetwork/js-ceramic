import * as mapper from "../secp521r1"
import * as u8a from 'uint8arrays'

test('expect ECPointDecompress to throw an error for undefined', () => {
      expect(() => {
      mapper.ECPointDecompress();
      }).toThrowError('input must be a Uint8Array');
});

test('expect ECPointDecompress to throw an error for null', () => {
      expect(() => {
      mapper.ECPointDecompress(null);
      }).toThrowError('input must be a Uint8Array');
});

test('expect ECPointDecompress to throw an error for unexpected input', () => {
      expect(() => {
      mapper.ECPointDecompress(5);
      }).toThrowError('input must be a Uint8Array');
});

test('test a compressed public key in hex to an x,y point as BigInt', () => {
      const inputPublicKeyHex = '0201797e56de1f04d37cdfac773ed343d065ea38094adaa30f7b70e6c3a092c58853374b9dd33c0a3e78580e53611dd27956cd8f12b1b7dca6da5cf3b1547bd231026d';
      const output = {
            x: 5061360517040441838282269520099970447877213723793902228898448846612298638514602887978564867898092474133581265414728892733815093019000838420937313605087461997n,
            y: 1329596140978186019370583474165656385653376403344633542682938703327071621736880363777104011534675183164790027772996920308843365725678713493014537792316257370n
      }
      const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
      const point = mapper.ECPointDecompress(publicKey_u8a);
      expect(point).toEqual(output);
});

test('key decompression (y-coordinate even)', () => {
  const inputCompressedPoint = Uint8Array.from([2,1,136,150,76,97,65,179,107,240,223,46,252,94,95,182,167,112,107,112,89,123,182,47,127,128,174,58,9,124,57,243,252,135,25,91,0,99,153,233,154,136,48,21,214,42,104,181,152,232,34,58,26,117,10,127,126,153,27,98,170,127,154,76,15,186,131]);
  const output = {
        x: 5263732472326197894199528512881258061258008985078293539314860591268612844870409579995212283440520259722240821760850735845522405972639427405605101549097302659n,
        y: 1607355092586893166614735742487687197205018279836427959934123116181383543385248294164182350918606129115312468371462347169202332686725754242897081121013431644n
  };
  const point = mapper.ECPointDecompress( inputCompressedPoint );
  expect(point).toEqual(output);
});

test('key decompression (y-coordinate odd)', () => {
   const inputCompressedPoint = Uint8Array.from([3,0,151,143,203,135,104,78,187,251,114,62,105,95,166,228,102,64,224,86,36,243,227,190,158,1,194,63,113,48,136,170,84,42,128,6,194,89,182,168,21,47,89,145,191,55,19,234,218,6,185,235,48,192,252,197,201,248,119,20,62,81,208,201,96,248,228]);
   const output = {
         x: 2032110154488788077213201567120364960961965815286199604659291906768970909969119283818899578872461517336788602155693417440814335996232300768684759707497330916n,
         y: 1841758248948177066704050081277018555328484709289967242827139435277985400572702195216268205445645568812241874891622506750070402046267339319053879267599690907n
   };
   const point = mapper.ECPointDecompress( inputCompressedPoint )
   expect(point).toEqual(output);
});

//**** end of tests

// Function for test. Eliminate this when key-did-resolver is written.

function pubKeyHexToUint8Array(publicKeyHex: string) {
  if(publicKeyHex == null) {
   throw new TypeError('input cannot be null or undefined.');
  }
    if(publicKeyHex.length % 2 == 0) {
          return u8a.fromString(publicKeyHex,'base16');
      } else {
          return u8a.fromString(('0'+publicKeyHex),'base16');
    }
}
