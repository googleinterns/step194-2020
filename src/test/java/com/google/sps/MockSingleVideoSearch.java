package com.google.sps;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.util.HashMap;
import java.util.Map;

/* A shell class that has basic functionality of video search without integration tools */
public class MockSingleVideoSearch {
  public MockSingleVideoSearch() {}

  public long parseDuration(String encodedTime) {
    String shortenedTime = encodedTime.substring(2);
    long hours = 0;
    long minutes = 0;
    long seconds = 0;
    if (shortenedTime.contains("H")) {
      hours = Integer.parseInt(shortenedTime.substring(0, shortenedTime.indexOf("H")));
      seconds += (hours * 3600);
      shortenedTime = shortenedTime.substring(shortenedTime.indexOf("H") + 1);
    }
    if (shortenedTime.contains("M")) {
      minutes = Integer.parseInt(shortenedTime.substring(0, shortenedTime.indexOf("M")));
      seconds += (minutes * 60);
      shortenedTime = shortenedTime.substring(shortenedTime.indexOf("M") + 1);
    }
    if (shortenedTime.contains("S")) {
      seconds += Integer.parseInt(shortenedTime.substring(0, shortenedTime.indexOf("S")));
    }
    return seconds;
  }

  public Map<String, Object> getVideoInformation(
      JsonArray items, Map<String, Object> videoData, String videoID) {
    for (int i = 0; i < items.size(); i++) {
      JsonObject snippet = items.get(i).getAsJsonObject().getAsJsonObject("snippet");
      String thumbnailURL =
          snippet.getAsJsonObject("thumbnails").getAsJsonObject("medium").get("url").toString();
      String title = snippet.get("title").toString();
      String duration =
          items
              .get(i)
              .getAsJsonObject()
              .getAsJsonObject("contentDetails")
              .get("duration")
              .toString();
      duration = duration.substring(1, duration.length() - 1);
      long numberDuration = parseDuration(duration);
      String formattedVideoURL = "https://youtube.com/watch?v=" + videoID;
      String channelName = snippet.get("channelTitle").toString();
      String releaseDate = snippet.get("publishedAt").toString();
      try {
        videoData.put("title", title);
        videoData.put("thumbnailURL", thumbnailURL);
        videoData.put("videoURL", formattedVideoURL);
        videoData.put("videoID", videoID);
        videoData.put("duration", numberDuration);
        videoData.put("channelName", channelName);
        return videoData;
      } catch (Exception e) {
        System.out.println("Error: can't put video into firestore");
      }
    }
    return new HashMap<>();
  }
}
