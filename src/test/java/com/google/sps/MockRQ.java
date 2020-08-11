package com.google.sps;

import com.google.step.YTLounge.data.Video;
import java.util.HashMap;
import java.util.Map;

public class MockRQ {
  private final String firstid = "100";
  private final String secondid = "101";
  private Map<String, Video> realRQ;
  private Map<String, Video> multipleRQ;
  private Video vid1;
  private Video vid2;

  public MockRQ() {
    realRQ = new HashMap<>();
    multipleRQ = new HashMap<>();
    vid1 =
        new Video(
            "FTC", 
            "https://i.ytimg.com/vi/9IVO5Dsz1KI/mqdefault.jpg",
            "https://youtube.com/watch?v=9IVO5Dsz1KI",
            112);
    vid2 =
        new Video(
            "Meet UX Designers at Google",
            "https://i.ytimg.com/vi/116sMd5U7UY/sddefault.jpg",
            "https://youtube.com/watch?v=116sMd5U7UY",
            136);
    realRQ.put("video1", vid1);
    multipleRQ.put("video1", vid1);
    multipleRQ.put("video2", vid2);
  }

  public Map<String, Video> mockGet(String roomid) {
    if (roomid.equals("100")) {
      return realRQ;
    } else if (roomid.equals("101")) {
      return multipleRQ;
    } else {
      return null; // room doesn't exist, so the get isn't successful
    }
  }
}
