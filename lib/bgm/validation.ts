/**
 * 오디오 파일 바이너리 시그니처 검증
 *
 * MP3: ID3v2 헤더 (0x49 0x44 0x33) 또는 MPEG sync (0xFF 0xFB/0xF3/0xF2)
 * M4A: ftyp atom (offset 4에 'ftyp')
 */
export function isValidAudioBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // MP3 — ID3v2 태그
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return true;
  }

  // MP3 — MPEG sync word (0xFF followed by 0xFB, 0xF3, or 0xF2)
  if (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xf3 || buffer[1] === 0xf2)) {
    return true;
  }

  // M4A/MP4 — ftyp atom at offset 4
  if (
    buffer[4] === 0x66 && // f
    buffer[5] === 0x74 && // t
    buffer[6] === 0x79 && // y
    buffer[7] === 0x70    // p
  ) {
    return true;
  }

  return false;
}
