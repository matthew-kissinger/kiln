import sharp from 'sharp';
const until=Date.now()+45000;let batches=0;
while(Date.now()<until){await Promise.all(Array.from({length:4},(_,i)=>sharp({create:{width:512,height:512,channels:4,background:{r:40+i*20,g:120,b:180,alpha:1}}}).resize(384,384).png().toBuffer()));batches++;await new Promise(r=>setTimeout(r,30));}
console.log(JSON.stringify({batches,versions:sharp.versions}));
