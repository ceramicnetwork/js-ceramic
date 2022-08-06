import * as mapper from "../secp384r1"
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
   const inputPublicKeyHex = '0265a9eb600585a6ef6edbf4c4f7769bbadb3ffa721013ade91fd272fe30457888854f53b8c41598bddd28bb6fb637f971';
   const output = {
         x: 15647482891880695628361423295295048383141137301636270605834221988066059282765781769641660206771257338747460454447473n,
         y: 9546043628548965590572582485871225792872188688117717253140508546948981101702483600611360132547640944614267655802760n
   };
   const publicKey_u8a = pubKeyHexToUint8Array(inputPublicKeyHex);
   const point = mapper.ECPointDecompress(publicKey_u8a);
   expect(point).toEqual(output);
});


test('key decompression (y-coordinate even)', () => {
  const inputCompressedPoint = Uint8Array.from([2,  35, 113, 197, 135,  41, 168, 153, 179,  78, 104,  37, 216,  27, 218, 187, 126,  99,  72,  18, 196, 175, 235, 162, 201, 186, 142,  10, 149, 170, 210, 194,  49,  95, 248, 223,  21, 242,  90, 255, 4,  44, 200,  42,  72, 183, 130, 241,  36]);
  const output = {
        x: 5455395577368722148202284288295229016372960408130441469301488141758433415923379298322689245302276505277663568654628n,
	y: 2491330177551765948830201920923407579397228012261106122732934988988922617191325104752570464363844486817305467959018n
  };

  const point = mapper.ECPointDecompress( inputCompressedPoint );

  expect(point).toEqual(output);
});

test('key decompression (y-coordinate odd)', () => {

   const inputCompressedPoint = Uint8Array.from([3, 85, 60, 88, 67, 106, 249, 139, 178, 116, 167, 2, 233, 109, 11, 235, 188, 203, 103, 93, 18, 204, 150, 41, 122, 192,  55,  55, 55,  99, 127, 81, 127, 209, 143, 40, 136, 37, 1, 46, 95, 243, 141, 178, 93, 39, 156, 202, 42]);
   const output = {
         x: 13118978274206463185421015920426680429096138428147576347133764307914667369844920909760800880755191326175781961124394n,
         y: 17805753635780018091095764692198364444788931266580341460971181687466050846576932422297677291691773698932002655999591n
   };

   const point = mapper.ECPointDecompress( inputCompressedPoint )

   expect(point).toEqual(output);
});

test('key decompression (y-coordinate odd) key#2', () => {

   const inputCompressedPoint = Uint8Array.from([ 3, 171,  37, 12,  72, 230,  28, 207, 37, 101, 156, 140,  69, 139, 233, 213,  25,  26,  99, 179, 80,  88, 236,  18,  49,  84,  35, 158, 171, 117, 128, 162, 150,  77, 208, 229,  89, 196, 110, 214, 41, 237,  36,  9, 182, 118, 204, 121, 43 ]);
   
   const output = {
        x: 26341583073126796700418388682664298992635319922642610490472596881255947259679994775386951611010846056313433587743019n,
        y: 36342522670550545791098022209848857466288485673789913258992953762740028300348932631529997025438540520232064962412623n
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
