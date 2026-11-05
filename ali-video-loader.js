/* ALI: assemble same-origin lesson segments into an HTML5 playable source. */
window.AliVideoMedia = {
  async open() {
    const parts = await Promise.all(Array.from({length:23}, async (_,i) => {
      const path = './media/ali-video-01/part-'+String(i).padStart(2,'0')+'.bin';
      const response = await fetch(path);
      if (!response.ok) throw Error('Video segment unavailable: '+i);
      return response.arrayBuffer();
    }));
    return URL.createObjectURL(new Blob(parts, {type:'video/mp4'}));
  }
};
