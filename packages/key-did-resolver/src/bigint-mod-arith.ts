/// Copy of `modPow` function from `https://github.com/juanelas/bigint-mod-arith`.
/// The package is not quite ready to be used in production as ES module.
/// See https://github.com/juanelas/bigint-mod-arith/pull/6
/// TODO Replace this with original `bigint-mod-arith` package, once the linked PR is merged and released.

/**
 * Finds the smallest positive element that is congruent to a in modulo n
 *
 * @remarks
 * a and b must be the same type, either number or bigint
 *
 * @param a - An integer
 * @param n - The modulo
 *
 * @throws {RangeError}
 * Excpeption thrown when n is not > 0
 *
 * @returns A bigint with the smallest positive representation of a modulo n
 */
export function toZn (a: number|bigint, n: number|bigint): bigint {
  if (typeof a === 'number') a = BigInt(a)
  if (typeof n === 'number') n = BigInt(n)

  if (n <= 0n) {
    throw new RangeError('n must be > 0')
  }

  const aZn = a % n
  return (aZn < 0n) ? aZn + n : aZn
}

export interface Egcd {
  g: bigint
  x: bigint
  y: bigint
}
/**
 * An iterative implementation of the extended euclidean algorithm or extended greatest common divisor algorithm.
 * Take positive integers a, b as input, and return a triple (g, x, y), such that ax + by = g = gcd(a, b).
 *
 * @param a
 * @param b
 *
 * @throws {RangeError}
 * This excepction is thrown if a or b are less than 0
 *
 * @returns A triple (g, x, y), such that ax + by = g = gcd(a, b).
 */
export function eGcd (a: number|bigint, b: number|bigint): Egcd {
  if (typeof a === 'number') a = BigInt(a)
  if (typeof b === 'number') b = BigInt(b)

  if (a <= 0n || b <= 0n) throw new RangeError('a and b MUST be > 0') // a and b MUST be positive

  let x = 0n
  let y = 1n
  let u = 1n
  let v = 0n

  while (a !== 0n) {
    const q = b / a
    const r: bigint = b % a
    const m = x - (u * q)
    const n = y - (v * q)
    b = a
    a = r
    x = u
    y = v
    u = m
    v = n
  }
  return {
    g: b,
    x: x,
    y: y
  }
}

/**
 * Modular inverse.
 *
 * @param a The number to find an inverse for
 * @param n The modulo
 *
 * @throws {RangeError}
 * Excpeption thorwn when a does not have inverse modulo n
 *
 * @returns The inverse modulo n
 */
export function modInv (a: number|bigint, n: number|bigint): bigint {
  const egcd = eGcd(toZn(a, n), n)
  if (egcd.g !== 1n) {
    throw new RangeError(`${a.toString()} does not have inverse modulo ${n.toString()}`) // modular inverse does not exist
  } else {
    return toZn(egcd.x, n)
  }
}

/**
 * Absolute value. abs(a)==a if a>=0. abs(a)==-a if a<0
 *
 * @param a
 *
 * @returns The absolute value of a
 */
export function abs (a: number|bigint): number|bigint {
  return (a >= 0) ? a : -a
}

/**
 * Modular exponentiation b**e mod n. Currently using the right-to-left binary method
 *
 * @param b base
 * @param e exponent
 * @param n modulo
 *
 * @throws {RangeError}
 * Excpeption thrown when n is not > 0
 *
 * @returns b**e mod n
 */
export function modPow (b: number|bigint, e: number|bigint, n: number|bigint): bigint {
  if (typeof b === 'number') b = BigInt(b)
  if (typeof e === 'number') e = BigInt(e)
  if (typeof n === 'number') n = BigInt(n)

  if (n <= 0n) {
    throw new RangeError('n must be > 0')
  } else if (n === 1n) {
    return 0n
  }

  b = toZn(b, n)

  if (e < 0n) {
    return modInv(modPow(b, abs(e), n), n)
  }

  let r = 1n
  while (e > 0) {
    if ((e % 2n) === 1n) {
      r = r * b % n
    }
    e = e / 2n
    b = b ** 2n % n
  }
  return r
}
