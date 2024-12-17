// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.4.4

// If other compressions are needed pull from https://github.com/pieroxy/lz-string (bring tests across also)

// Note also the esm port of lz-string for utf-8 only by @immutabl3/lz-string

const f = String.fromCharCode
const keyStrUriSafe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$'
const baseReverseDic = {}

export function compressToEncodedURIComponent(input: string) {
  if (input == null)
    return ''
  return _compress(input, 6, (index: number) => {
    return keyStrUriSafe.charAt(index)
  })
}

export function decompressFromEncodedURIComponent(input: string) {
  if (input == null)
    return ''
  if (input === '')
    return null
  input = input.replace(/ /g, '+')
  return _decompress(input.length, 32, (index: number) => {
    return getBaseValue(keyStrUriSafe, input.charAt(index))
  })
}

function getBaseValue(alphabet: string, character: string) {
  if (!baseReverseDic[alphabet]) {
    baseReverseDic[alphabet] = {}
    for (let i = 0; i < alphabet.length; i++)
      baseReverseDic[alphabet][alphabet.charAt(i)] = i
  }
  return baseReverseDic[alphabet][character]
}

function _compress(uncompressed: string, bitsPerChar: number, getCharFromInt: (index: number) => any) {
  if (uncompressed == null)
    return ''
  const context_dictionary = {}
  const context_dictionaryToCreate = {}
  const context_data = []
  let i
  let value
  let context_c = ''
  let context_wc = ''
  let context_w = ''
  let context_enlargeIn = 2 // Compensate for the first entry which should not count
  let context_dictSize = 3
  let context_numBits = 2
  let context_data_val = 0
  let context_data_position = 0
  let ii

  for (ii = 0; ii < uncompressed.length; ii += 1) {
    context_c = uncompressed.charAt(ii)
    if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
      context_dictionary[context_c] = context_dictSize++
      context_dictionaryToCreate[context_c] = true
    }

    context_wc = context_w + context_c
    if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
      context_w = context_wc
    }
    else {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1)
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            }
            else {
              context_data_position++
            }
          }
          value = context_w.charCodeAt(0)
          for (i = 0; i < 8; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            }
            else {
              context_data_position++
            }
            value = value >> 1
          }
        }
        else {
          value = 1
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | value
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            }
            else {
              context_data_position++
            }
            value = 0
          }
          value = context_w.charCodeAt(0)
          for (i = 0; i < 16; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            }
            else {
              context_data_position++
            }
            value = value >> 1
          }
        }
        context_enlargeIn--
        if (context_enlargeIn === 0) {
          context_enlargeIn = 2 ** context_numBits
          context_numBits++
        }
        delete context_dictionaryToCreate[context_w]
      }
      else {
        value = context_dictionary[context_w]
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          }
          else {
            context_data_position++
          }
          value = value >> 1
        }
      }
      context_enlargeIn--
      if (context_enlargeIn === 0) {
        context_enlargeIn = 2 ** context_numBits
        context_numBits++
      }
      // Add wc to the dictionary.
      context_dictionary[context_wc] = context_dictSize++
      context_w = String(context_c)
    }
  }

  // Output the code for w.
  if (context_w !== '') {
    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
      if (context_w.charCodeAt(0) < 256) {
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1)
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          }
          else {
            context_data_position++
          }
        }
        value = context_w.charCodeAt(0)
        for (i = 0; i < 8; i++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          }
          else {
            context_data_position++
          }
          value = value >> 1
        }
      }
      else {
        value = 1
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | value
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          }
          else {
            context_data_position++
          }
          value = 0
        }
        value = context_w.charCodeAt(0)
        for (i = 0; i < 16; i++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position === bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          }
          else {
            context_data_position++
          }
          value = value >> 1
        }
      }
      context_enlargeIn--
      if (context_enlargeIn === 0) {
        context_enlargeIn = 2 ** context_numBits
        context_numBits++
      }
      delete context_dictionaryToCreate[context_w]
    }
    else {
      value = context_dictionary[context_w]
      for (i = 0; i < context_numBits; i++) {
        context_data_val = (context_data_val << 1) | (value & 1)
        if (context_data_position === bitsPerChar - 1) {
          context_data_position = 0
          context_data.push(getCharFromInt(context_data_val))
          context_data_val = 0
        }
        else {
          context_data_position++
        }
        value = value >> 1
      }
    }
    context_enlargeIn--
    if (context_enlargeIn === 0) {
      context_enlargeIn = 2 ** context_numBits
      context_numBits++
    }
  }

  // Mark the end of the stream
  value = 2
  for (i = 0; i < context_numBits; i++) {
    context_data_val = (context_data_val << 1) | (value & 1)
    if (context_data_position === bitsPerChar - 1) {
      context_data_position = 0
      context_data.push(getCharFromInt(context_data_val))
      context_data_val = 0
    }
    else {
      context_data_position++
    }
    value = value >> 1
  }

  // Flush the last char
  // eslint-disable-next-line no-constant-condition
  while (true) {
    context_data_val = (context_data_val << 1)
    if (context_data_position === bitsPerChar - 1) {
      context_data.push(getCharFromInt(context_data_val))
      break
    }
    else { context_data_position++ }
  }
  return context_data.join('')
}

function _decompress(length: number, resetValue: number, getNextValue: (index: number) => any) {
  const dictionary = []
  const result = []
  const data = { val: getNextValue(0), position: resetValue, index: 1 }

  let i
  let numBits = 3
  let entry = ''
  let dictSize = 4
  let enlargeIn = 4
  let next
  let w
  let bits
  let resb
  let maxpower
  let power
  let c

  for (i = 0; i < 3; i += 1)
    dictionary[i] = i

  bits = 0
  maxpower = 2 ** 2
  power = 1
  while (power !== maxpower) {
    resb = data.val & data.position
    data.position >>= 1
    if (data.position === 0) {
      data.position = resetValue
      data.val = getNextValue(data.index++)
    }
    bits |= (resb > 0 ? 1 : 0) * power
    power <<= 1
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  switch (next = bits) {
    case 0:
      bits = 0
      maxpower = 2 ** 8
      power = 1
      while (power !== maxpower) {
        resb = data.val & data.position
        data.position >>= 1
        if (data.position === 0) {
          data.position = resetValue
          data.val = getNextValue(data.index++)
        }
        bits |= (resb > 0 ? 1 : 0) * power
        power <<= 1
      }
      c = f(bits)
      break
    case 1:
      bits = 0
      maxpower = 2 ** 16
      power = 1
      while (power !== maxpower) {
        resb = data.val & data.position
        data.position >>= 1
        if (data.position === 0) {
          data.position = resetValue
          data.val = getNextValue(data.index++)
        }
        bits |= (resb > 0 ? 1 : 0) * power
        power <<= 1
      }
      c = f(bits)
      break
    case 2:
      return ''
  }
  dictionary[3] = c
  w = c
  result.push(c)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (data.index > length)
      return ''

    bits = 0
    maxpower = 2 ** numBits
    power = 1
    while (power !== maxpower) {
      resb = data.val & data.position
      data.position >>= 1
      if (data.position === 0) {
        data.position = resetValue
        data.val = getNextValue(data.index++)
      }
      bits |= (resb > 0 ? 1 : 0) * power
      power <<= 1
    }

    switch (c = bits) {
      case 0:
        bits = 0
        maxpower = 2 ** 8
        power = 1
        while (power !== maxpower) {
          resb = data.val & data.position
          data.position >>= 1
          if (data.position === 0) {
            data.position = resetValue
            data.val = getNextValue(data.index++)
          }
          bits |= (resb > 0 ? 1 : 0) * power
          power <<= 1
        }

        dictionary[dictSize++] = f(bits)
        c = dictSize - 1
        enlargeIn--
        break
      case 1:
        bits = 0
        maxpower = 2 ** 16
        power = 1
        while (power !== maxpower) {
          resb = data.val & data.position
          data.position >>= 1
          if (data.position === 0) {
            data.position = resetValue
            data.val = getNextValue(data.index++)
          }
          bits |= (resb > 0 ? 1 : 0) * power
          power <<= 1
        }
        dictionary[dictSize++] = f(bits)
        c = dictSize - 1
        enlargeIn--
        break
      case 2:
        return result.join('')
    }

    if (enlargeIn === 0) {
      enlargeIn = 2 ** numBits
      numBits++
    }

    if (dictionary[c]) {
      entry = dictionary[c]
    }
    else {
      if (c === dictSize)
        entry = w + w.charAt(0)

      else
        return null
    }
    result.push(entry)

    // Add w+entry[0] to the dictionary.
    dictionary[dictSize++] = w + entry.charAt(0)
    enlargeIn--

    w = entry

    if (enlargeIn === 0) {
      enlargeIn = 2 ** numBits
      numBits++
    }
  }
}
