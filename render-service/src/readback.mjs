/** Three/WebGPU returns 256-byte-aligned rows, without trailing padding on the final row. */
export function packRgbaReadback(pixels,width,height){
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1)throw new Error('invalid readback dimensions');
  const rowBytes=width*4,packedBytes=rowBytes*height,stride=Math.ceil(rowBytes/256)*256;
  const input=Buffer.from(pixels.buffer,pixels.byteOffset,pixels.byteLength);
  if(input.length===packedBytes)return Buffer.from(input);
  if(input.length!==(height-1)*stride+rowBytes&&input.length!==height*stride)throw new Error('unexpected GPU readback byte length');
  const output=Buffer.allocUnsafe(packedBytes);
  for(let row=0;row<height;row++)input.copy(output,row*rowBytes,row*stride,row*stride+rowBytes);
  return output;
}
