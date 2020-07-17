package com.google.step.YTLounge.data;

/** A YouTube video's data and relevant information */
public class Video {
  private final String title;
  private final String thumbnailURL;
  private final String videoURL;
  private final long duration;

  public Video(String title, String thumbnailURL, String videoURL, long duration) {
    this.title = title;
    this.thumbnailURL = thumbnailURL;
    this.videoURL = videoURL;
    this.duration = duration;
  }
}
