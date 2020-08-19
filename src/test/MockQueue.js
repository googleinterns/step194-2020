var queue = {
  videos: new Array(),
  validRooms: new Array(),
  validVideoIds: new Array(),

  initialize() {
    this.validRooms.push('1');
    this.validRooms.push('2');
    this.validRooms.push('3');
    this.validVideoIds.push('test1');
    this.validVideoIds.push('test2');
    this.validVideoIds.push('test3');
  },

  verifyURLStructure(url) {
    const validator = new RegExp('' +
      /(^(?:https?:\/\/)?(?:www\.)?)/.source +
      /((?:youtu\.be\/|youtube\.com\/))/.source +
      /((?:embed\/|v\/|watch\?v=|watch\?.+&v=))/.source +
      /((\w|-){11})(?:\S+)?$/.source,
    ); // regex for youtube link validation
    if (!url.match(validator)) { // signal bad link to user
      return false;
    } else {
      return true;
    }
  },

  clearQueue() {
    this.videos = [];
  },
  
  addToQueue(video) {
    if (this.validVideoIds.indexOf(video.id) === -1) {
      return false;
    };
    this.videos.push(video);
    return this.videos;
  },

  removeVideo(video) {
    let index = -1;
    for (let i = 0; i < this.videos.length; i++) {
      if (this.videos[i].id === video.id) {
        index = i;
        break;
      }
    }
    if (index > -1) {
      this.videos.splice(index, 1);
    } else {
      return false;
    }
    return this.videos;
  },

  isQueueEmpty() {
    if (videos.length === 0) {
      return true;
    }
    return false;
  },

  getVideoData(id) {
    if (id == '') {
      return false;
    }
    for (let i = 0; i < this.videos.length; i++) {
      if (this.videos[i].id === id) {
        return this.videos[i];
      }
    }
    return false;
  },

  parseTime(duration) {
    let minutes = 0;
    let seconds = 0;
    let hours = 0;
    let result = '';
    hours = (duration / 3600) | 0;
    minutes = ((duration - (hours * 3600)) / 60) | 0;
    seconds = duration - (hours * 3600) - (minutes * 60);
    if (hours > 0) {
      result += hours + ':';
    }
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    if (seconds < 10) {
      seconds = '0' + seconds;
    }
    return result + minutes + ':' + seconds;
  }
}

module.exports = { // eslint-disable-line no-undef
  queue: queue,
};
