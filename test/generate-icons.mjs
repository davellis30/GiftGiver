// Generates branded PNG app icons (rounded blue tile + white heart) without any
// image dependencies, by encoding PNGs directly. Run once to (re)create icons.
import zlib from 'node:zlib'
import { writeFileSync } from 'node:fs'

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

function makeIcon(N) {
  const rgba = Buffer.alloc(N * N * 4)
  const r = 0.22 * N // corner radius
  const cx = N / 2
  const cy = N * 0.47
  const scale = N * 0.3
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4
      // rounded-rect mask
      let inside = true
      const corners = [
        [r, r],
        [N - r, r],
        [r, N - r],
        [N - r, N - r],
      ]
      if (x < r && y < r) inside = Math.hypot(x - r, y - r) <= r
      else if (x > N - r && y < r) inside = Math.hypot(x - (N - r), y - r) <= r
      else if (x < r && y > N - r) inside = Math.hypot(x - r, y - (N - r)) <= r
      else if (x > N - r && y > N - r) inside = Math.hypot(x - (N - r), y - (N - r)) <= r
      if (!inside) {
        rgba[i + 3] = 0
        continue
      }
      // vertical gradient blue -> indigo
      const t = y / N
      const rC = Math.round(59 + (99 - 59) * t)
      const gC = Math.round(130 + (102 - 130) * t)
      const bC = Math.round(246 + (241 - 246) * t)
      // heart test
      const u = (x - cx) / scale
      const v = (cy - y) / scale
      const f = Math.pow(u * u + v * v - 1, 3) - u * u * v * v * v
      if (f <= 0) {
        rgba[i] = 255
        rgba[i + 1] = 255
        rgba[i + 2] = 255
        rgba[i + 3] = 255
      } else {
        rgba[i] = rC
        rgba[i + 1] = gC
        rgba[i + 2] = bC
        rgba[i + 3] = 255
      }
    }
  }
  return encodePng(N, N, rgba)
}

writeFileSync('public/apple-touch-icon.png', makeIcon(180))
writeFileSync('public/icon-192.png', makeIcon(192))
writeFileSync('public/icon-512.png', makeIcon(512))
console.log('Wrote apple-touch-icon.png, icon-192.png, icon-512.png')
